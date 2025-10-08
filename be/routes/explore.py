from __future__ import annotations

from fastapi import APIRouter, Query
from typing import Dict, Any, List
import pandas as pd
import os
import random
from utils.text_processing import normalize_text, as_list

router = APIRouter(prefix="/api", tags=["explore"])

# Will be set by main.py
df = None


def set_globals(dataframe):
    """Set module-level globals from main"""
    global df
    df = dataframe


def _safe_int(x):
    try:
        return int(x)
    except Exception:
        return 0


def _safe_float(x):
    try:
        return float(x)
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
    import re
    title = (row.get("caption") or row.get("full_text") or "")
    title = re.sub(r"\s+", " ", str(title)).strip()

    embed_url = row.get("embed_url")
    thumbnail_url = row.get("thumbnail_url")
    video_url = embed_url if pd.notna(embed_url) else row.get("display_url")
    thumbnail = thumbnail_url if pd.notna(thumbnail_url) else row.get("display_url")

    words = title.split()
    if len(words) > 5:
        title = ' '.join(words[:5]) + "..."
    else:
        title = ' '.join(words)

    return {
        "id": _safe_int(row.get("Id")),
        "title": title,
        "creator": row.get("owner_username"),
        "category": row.get("category"),
        "views": _safe_int(row.get("view_count")),
        "likes": _safe_int(row.get("like_count")),
        "engagement_rate": round(_safe_float(row.get("engagement_rate")), 5),
        "thumbnail": thumbnail,
        "video_url": video_url,
        "embed_url": embed_url,
        "instagram_url": row.get("display_url"),
        "hashtags": as_list(row.get("hashtags")),
    }


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


def _section_more_from_category(df: pd.DataFrame, dominant_category: str, per_row: int, exclude_ids: set) -> Dict[
                                                                                                                 str, Any] | None:
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
    """Netflix-style Explore: returns rows grouped by category/creator/hashtag/text."""
    print(f"🔍 DEBUG: explore() called with q={q}, rows_per_section={rows_per_section}")
    print(f"🔍 DEBUG: df is None? {df is None}")

    if df is None:
        return {"query": q, "sections": []}

    print(f"🔍 DEBUG: df.shape = {df.shape}")
    print(f"🔍 DEBUG: df.columns = {list(df.columns)[:10]}...")

    data = _ensure_cols(df.copy())
    sections: List[Dict[str, Any]] = []
    all_shown_ids = set()

    cat = _section_by_category(data, q, rows_per_section)
    if cat:
        sections.append(cat)
        all_shown_ids.update(item["id"] for item in cat["items"])

    creator_sections = _section_by_creator(data, q, min(rows_per_section, 12))
    for sec in creator_sections:
        sections.append(sec)
        all_shown_ids.update(item["id"] for item in sec["items"])

    hashtag_sections = _section_by_hashtag(data, q, min(rows_per_section, 12))
    for sec in hashtag_sections:
        sections.append(sec)
        all_shown_ids.update(item["id"] for item in sec["items"])

    txt = _section_by_text(data, q, rows_per_section)
    if txt:
        sections.append(txt)
        all_shown_ids.update(item["id"] for item in txt["items"])

    if not sections:
        spotlight = _section_spotlight(data, rows_per_section)
        sections.append(spotlight)
        all_shown_ids.update(item["id"] for item in spotlight["items"])

    # De-dup existing sections
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
        print(f"📊 Top 2 categories in results:")
        for cat, count in sorted_categories:
            print(f"   - {cat}: {count} videos")

        # Add "More from category" section for TOP 2 categories only
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
                print(f"✅ Added 'More from {cat_name}' section with {len(more_section['items'])} videos")

    print(f"✅ Returning {len(sections)} sections with {sum(len(s['items']) for s in sections)} total videos")
    return {"query": q, "sections": sections}