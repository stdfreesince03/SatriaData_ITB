from __future__ import annotations

from fastapi import APIRouter, Query
from typing import Dict, Any, List
import pandas as pd
import numpy as np
import os
import random
from utils.text_processing import normalize_text, as_list

router = APIRouter(prefix="/api", tags=["explore"])

# Will be set by main.py
df = None
faiss_index = None
embedding_model = None


def set_globals(dataframe, index=None, model=None):
    """Set module-level globals from main"""
    global df, faiss_index, embedding_model
    df = dataframe
    faiss_index = index
    embedding_model = model


def _safe_int(x):
    try:
        if pd.isna(x):
            return 0
        return int(x)
    except Exception:
        return 0


def _safe_float(x):
    try:
        if pd.isna(x):
            return 0.0
        val = float(x)
        if np.isinf(val):
            return 0.0
        return val
    except Exception:
        return 0.0


def _filename(path: str) -> str:
    if not isinstance(path, str) or not path:
        return ""
    return os.path.basename(path)


def _topk(df: pd.DataFrame, k: int, sort_cols: List[str]) -> pd.DataFrame:
    d = df.copy()
    for c in sort_cols:
        if c not in d.columns:
            d[c] = 0
    return d.sort_values(sort_cols, ascending=[False] * len(sort_cols)).head(k)


def _ensure_cols(df: pd.DataFrame):
    need = [
        "Id", "caption", "text", "full_text", "owner_username", "category", "hashtags",
        "raw_video_path", "display_url", "view_count", "like_count", "engagement_rate",
        "embed_url", "thumbnail_url"
    ]
    for c in need:
        if c not in df.columns:
            df[c] = None

    df["view_count"] = pd.to_numeric(df["view_count"], errors="coerce").fillna(0)
    df["like_count"] = pd.to_numeric(df["like_count"], errors="coerce").fillna(0)
    df["engagement_rate"] = pd.to_numeric(df["engagement_rate"], errors="coerce").fillna(0.0)
    df["hashtags_list"] = df["hashtags"].apply(as_list)
    df["lc_caption"] = df["caption"].astype(str).str.lower()
    df["lc_text"] = df["text"].astype(str).str.lower()
    df["lc_full_text"] = df["full_text"].astype(str).str.lower()
    df["lc_creator"] = df["owner_username"].astype(str).str.lower()
    df["lc_category"] = df["category"].astype(str).str.lower()
    return df


def _video_card(row: pd.Series) -> Dict[str, Any]:
    """Convert DataFrame row to video card - with proper None/NaN handling"""
    import re
    
    # FIXED: Proper title handling to avoid "nan"
    caption = row.get("caption")
    full_text = row.get("full_text")
    text = row.get("text")
    
    title = None
    
    # Try caption first
    if pd.notna(caption) and str(caption).strip() and str(caption).lower() != 'nan':
        title = str(caption).strip()
    # Try text next
    elif pd.notna(text) and str(text).strip() and str(text).lower() != 'nan':
        title = str(text).strip()
    # Try full_text
    elif pd.notna(full_text) and str(full_text).strip() and str(full_text).lower() != 'nan':
        title = str(full_text).strip()
    
    # Fallback if still no title
    if not title:
        category = row.get("category")
        if pd.notna(category) and str(category).strip() and str(category).lower() not in ['nan', 'none', '']:
            title = f"{category} video"
        else:
            title = "Video"
    
    # Clean up whitespace
    title = re.sub(r"\s+", " ", title).strip()
    
    # Truncate to first 5 words
    words = title.split()
    if len(words) > 5:
        title = ' '.join(words[:5]) + "..."
    else:
        title = ' '.join(words)

    embed_url = row.get("embed_url")
    thumbnail_url = row.get("thumbnail_url")
    video_url = embed_url if pd.notna(embed_url) else row.get("display_url")
    thumbnail = thumbnail_url if pd.notna(thumbnail_url) else row.get("display_url")

    return {
        "id": _safe_int(row.get("Id")),
        "title": title,
        "creator": str(row.get("owner_username", "")).strip() or "Unknown",
        "category": str(row.get("category", "")).strip() or "General",
        "views": _safe_int(row.get("view_count")),
        "likes": _safe_int(row.get("like_count")),
        "engagement_rate": round(_safe_float(row.get("engagement_rate")), 5),
        "thumbnail": thumbnail if pd.notna(thumbnail) else "",
        "video_url": video_url if pd.notna(video_url) else "",
        "embed_url": embed_url if pd.notna(embed_url) else None,
        "instagram_url": row.get("display_url") if pd.notna(row.get("display_url")) else "",
        "hashtags": as_list(row.get("hashtags")),
    }


def _semantic_search_section(q: str, per_row: int, exclude_ids: set) -> Dict[str, Any] | None:
    """
    NEW: FAISS semantic search section
    Returns videos similar by MEANING, not just keywords
    """
    if faiss_index is None or embedding_model is None:
        print("   ⚠️ FAISS not available, skipping semantic section")
        return None
    
    try:
        # Encode query
        query_embedding = embedding_model.encode(
            [q],
            normalize_embeddings=True,
            show_progress_bar=False
        ).astype('float32')
        
        # Search FAISS
        distances, indices = faiss_index.search(query_embedding, k=per_row * 3)
        
        # Get results
        results_df = df.iloc[indices[0]].copy()
        
        # Clean NaN similarity scores
        similarity_scores = np.nan_to_num(distances[0], nan=0.0, posinf=0.0, neginf=0.0)
        results_df['similarity_score'] = similarity_scores
        
        # Exclude already shown videos
        if exclude_ids:
            results_df = results_df[~results_df['Id'].isin(exclude_ids)]
        
        if results_df.empty:
            return None
        
        # Take top results
        results_df = results_df.head(per_row)
        
        items = []
        for _, row in results_df.iterrows():
            card = _video_card(row)
            similarity = _safe_float(row.get('similarity_score', 0))
            card['similarity_score'] = round(similarity, 4)
            items.append(card)
        
        print(f"   ✓ Semantic section: {len(items)} videos")
        
        return {
            "key": "semantic",
            "title": f"Related to \"{q}\"",
            "reason": "FAISS",
            "items": items
        }
        
    except Exception as e:
        print(f"   ❌ Semantic search error: {e}")
        return None


def _section_by_category(df: pd.DataFrame, q: str, per_row: int) -> Dict[str, Any] | None:
    ql = normalize_text(q)
    if not ql: return None
    hit = df[df["lc_category"].str.contains(ql, na=False)]
    if hit.empty: return None
    top_cat = (hit.groupby("category")["view_count"].sum().sort_values(ascending=False).index[0])
    subset = df[df["category"] == top_cat]
    subset = _topk(subset, per_row, ["engagement_rate", "view_count"])
    items = [_video_card(r) for _, r in subset.iterrows()]
    return {"key": "category", "title": f"Because you searched '{q}'", "reason": f"Top in {top_cat}", "items": items}


def _section_by_creator(df: pd.DataFrame, q: str, per_row: int, max_creators: int = 2) -> List[Dict[str, Any]]:
    ql = normalize_text(q)
    if not ql: return []
    cand = df[df["lc_creator"].str.contains(ql, na=False)]
    if cand.empty: return []
    top_creators = (cand.groupby("owner_username")["view_count"]
                    .sum().sort_values(ascending=False).head(max_creators).index.tolist())
    out = []
    for c in top_creators:
        vids = df[df["owner_username"] == c]
        vids = _topk(vids, per_row, ["engagement_rate", "view_count"])
        items = [_video_card(r) for _, r in vids.iterrows()]
        out.append({"key": "creator", "title": f"Popular from @{c}", "reason": "Creator match", "items": items})
    return out


def _section_by_hashtag(df: pd.DataFrame, q: str, per_row: int, max_tags: int = 2) -> List[Dict[str, Any]]:
    ql = normalize_text(q)
    if not ql: return []
    ex = df.explode("hashtags_list")
    ex["lc_tag"] = ex["hashtags_list"].astype(str).str.lower()
    hit = ex[ex["lc_tag"].str.contains(ql, na=False) & ex["lc_tag"].notnull()]
    if hit.empty: return []
    top_tags = (hit.groupby("lc_tag")["view_count"].sum().sort_values(ascending=False).head(max_tags).index.tolist())
    out = []
    for tag in top_tags:
        vids = ex[ex["lc_tag"] == tag]
        base = _topk(vids, per_row, ["engagement_rate", "view_count"])
        base = base.sample(frac=1, random_state=random.randint(1, 10)).head(per_row)
        items = [_video_card(r) for _, r in base.iterrows()]
        out.append({"key": "hashtag", "title": f"Trending with #{tag}", "reason": "Hashtag match", "items": items})
    return out


def _section_by_text(df: pd.DataFrame, q: str, per_row: int) -> Dict[str, Any] | None:
    ql = normalize_text(q)
    if not ql: return None
    mask = (
            df["lc_caption"].str.contains(ql, na=False) |
            df["lc_text"].str.contains(ql, na=False) |
            df["lc_full_text"].str.contains(ql, na=False)
    )
    hit = df[mask]
    if hit.empty: return None
    hit = _topk(hit, per_row * 2, ["engagement_rate", "view_count"])
    hit = hit.sample(frac=1, random_state=random.randint(1, 99)).head(per_row)
    items = [_video_card(r) for _, r in hit.iterrows()]
    return {"key": "similar", "title": f"Similar to \"{q}\"", "reason": "Text match", "items": items}


def _section_spotlight(df: pd.DataFrame, per_row: int) -> Dict[str, Any]:
    base = _topk(df, per_row * 3, ["engagement_rate", "view_count"])
    base = base.sample(frac=1, random_state=random.randint(1, 99)).head(per_row)
    items = [_video_card(r) for _, r in base.iterrows()]
    return {"key": "spotlight", "title": "Now Trending", "reason": "High engagement overall", "items": items}


def _section_more_from_category(df: pd.DataFrame, dominant_category: str, per_row: int, exclude_ids: set) -> Dict[str, Any] | None:
    """Return random videos from the dominant category, excluding already shown videos."""
    if not dominant_category or dominant_category == "None" or pd.isna(dominant_category):
        return None

    cat_videos = df[df["category"] == dominant_category]

    if exclude_ids:
        cat_videos = cat_videos[~cat_videos["Id"].isin(exclude_ids)]

    if cat_videos.empty or len(cat_videos) < 3:
        return None

    top_candidates = _topk(cat_videos, per_row * 2, ["engagement_rate", "view_count"])
    random_selection = top_candidates.sample(
        n=min(per_row, len(top_candidates)),
        random_state=random.randint(1, 999)
    )

    items = [_video_card(r) for _, r in random_selection.iterrows()]

    return {
        "key": "more_from_category",
        "title": f"More videos about {dominant_category}",
        "reason": f"Popular in {dominant_category}",
        "items": items
    }


@router.get("/explore")
def explore(q: str = Query(..., min_length=1), rows_per_section: int = 16):
    """
    ENHANCED: Netflix-style Explore with SEMANTIC SEARCH + all keyword matching
    
    Now includes:
    1. Category matches (keyword)
    2. Creator matches (keyword)
    3. Hashtag matches (keyword)
    4. Text matches (keyword)
    5. SEMANTIC MATCHES (FAISS) ← NEW!
    6. More from category
    """
    print(f"🔍 EXPLORE: q='{q}', rows_per_section={rows_per_section}")
    print(f"   FAISS available: {faiss_index is not None and embedding_model is not None}")

    if df is None:
        return {"query": q, "sections": []}

    data = _ensure_cols(df.copy())
    sections: List[Dict[str, Any]] = []
    all_shown_ids = set()

    # 1. CATEGORY SECTION (keyword match)
    cat = _section_by_category(data, q, rows_per_section)
    if cat:
        sections.append(cat)
        all_shown_ids.update(item["id"] for item in cat["items"])
        print(f"   ✓ Category section: {len(cat['items'])} videos")

    # 2. CREATOR SECTIONS (keyword match)
    creator_sections = _section_by_creator(data, q, min(rows_per_section, 12))
    for sec in creator_sections:
        sections.append(sec)
        all_shown_ids.update(item["id"] for item in sec["items"])
    if creator_sections:
        print(f"   ✓ Creator sections: {len(creator_sections)} sections")

    # 3. HASHTAG SECTIONS (keyword match)
    hashtag_sections = _section_by_hashtag(data, q, min(rows_per_section, 12))
    for sec in hashtag_sections:
        sections.append(sec)
        all_shown_ids.update(item["id"] for item in sec["items"])
    if hashtag_sections:
        print(f"   ✓ Hashtag sections: {len(hashtag_sections)} sections")

    # 4. TEXT SECTION (keyword match)
    txt = _section_by_text(data, q, rows_per_section)
    if txt:
        sections.append(txt)
        all_shown_ids.update(item["id"] for item in txt["items"])
        print(f"   ✓ Text section: {len(txt['items'])} videos")

    # 5. ⭐ NEW: SEMANTIC SECTION (FAISS - finds related content by meaning)
    semantic = _semantic_search_section(q, rows_per_section, all_shown_ids)
    if semantic:
        sections.append(semantic)
        all_shown_ids.update(item["id"] for item in semantic["items"])

    # 6. FALLBACK: If no results, show trending
    if not sections:
        spotlight = _section_spotlight(data, rows_per_section)
        sections.append(spotlight)
        all_shown_ids.update(item["id"] for item in spotlight["items"])
        print(f"   ⚠️ No matches, showing trending: {len(spotlight['items'])} videos")

    # De-duplicate existing sections
    for s in sections:
        seen = set()
        uniq = []
        for it in s["items"]:
            vid = it.get("id")
            if vid in seen: continue
            seen.add(vid)
            uniq.append(it)
        s["items"] = uniq

    # Find ALL categories from results
    category_counts = {}
    for section in sections:
        for item in section["items"]:
            cat_name = item.get("category")
            if cat_name and cat_name != "None":
                category_counts[cat_name] = category_counts.get(cat_name, 0) + 1

    if category_counts:
        # Sort categories by count and take TOP 2
        sorted_categories = sorted(category_counts.items(), key=lambda x: x[1], reverse=True)[:2]
        print(f"   📊 Top 2 categories: {[c[0] for c in sorted_categories]}")

        # Add "More from category" section for TOP 2 categories
        for cat_name, count in sorted_categories:
            more_section = _section_more_from_category(
                data,
                cat_name,
                rows_per_section,
                all_shown_ids
            )
            if more_section:
                sections.append(more_section)
                all_shown_ids.update(item["id"] for item in more_section["items"])
                print(f"   ✓ More from {cat_name}: {len(more_section['items'])} videos")

    total_videos = sum(len(s['items']) for s in sections)
    print(f"✅ Returning {len(sections)} sections with {total_videos} total videos")
    
    return {
        "query": q,
        "sections": sections
    }