from fastapi import APIRouter, Query, HTTPException
from typing import Dict, Any, List,Optional
import pandas as pd
from collections import Counter

router = APIRouter(prefix="/api/trending", tags=["trending"])

# Will be set by main.py
df = None


import pandas as pd

def _safe_series(frame: pd.DataFrame, col: str) -> pd.Series:
    """Return a string Series for `col` if it exists, else an empty Series."""
    if col in frame.columns:
        return frame[col].fillna("").astype(str)
    return pd.Series([""] * len(frame), index=frame.index, dtype="object")

def _search_mask(frame: pd.DataFrame, q: str) -> pd.Series:
    """
    Build a robust text blob from multiple columns and do a case-insensitive,
    non-regex contains() to avoid KeyError and regex pitfalls.
    """
    text = _safe_series(frame, "caption")
    # fallbacks / enrichers
    for c in ("full_text", "owner_username", "category", "hashtags"):
        text = text.str.cat(_safe_series(frame, c), sep=" ")
    # regex=False so queries like "c++", "wardah" etc. don't explode
    return text.str.contains(q, case=False, na=False, regex=False)


def set_globals(dataframe):
    """Set module-level globals from main"""
    global df
    df = dataframe


@router.get("/debug")
def debug_data():
    """Debug endpoint to see what data we have"""
    if df is None:
        return {"error": "df is None"}

    return {
        "total_rows": len(df),
        "columns": list(df.columns),
        "category_column_exists": 'category' in df.columns,
        "sample_categories": df['category'].dropna().head(10).tolist() if 'category' in df.columns else [],
        "category_value_counts": df['category'].value_counts().head(10).to_dict() if 'category' in df.columns else {},
        "sample_row": df.iloc[0].to_dict() if len(df) > 0 else {}
    }


@router.get("/viral-topics")
def get_viral_topics(limit: int = Query(5, ge=1, le=20)):
    """
    Returns viral trending topics based on categories.
    """
    if df is None:
        print("❌ df is None!")
        return {"topics": []}

    if len(df) == 0:
        print("❌ df is empty!")
        return {"topics": []}

    print(f"📊 DataFrame has {len(df)} rows")
    print(f"📋 Columns: {list(df.columns)}")

    if 'category' not in df.columns:
        print("❌ No 'category' column!")
        return {"topics": []}

    try:
        topics = []

        # Check categories
        print(f"📊 Total videos: {len(df)}")
        print(f"📊 Videos with category: {df['category'].notna().sum()}")
        print(f"📊 Unique categories: {df['category'].nunique()}")
        print(f"📊 Sample categories: {df['category'].dropna().head(5).tolist()}")

        # Get category stats - SIMPLIFIED
        category_groups = df.groupby('category', dropna=True)

        for category, group in category_groups:
            # Skip if category is None, empty, or 'None' string
            if pd.isna(category) or str(category).strip() == '' or str(category).lower() == 'none':
                continue

            # Calculate stats
            video_count = len(group)
            total_views = int(group['view_count'].sum())
            avg_engagement = float(group['engagement_rate'].mean())

            # Get top hashtags for this category
            all_hashtags = []
            for hashtags_raw in group['hashtags'].dropna().head(30):
                try:
                    hashtags_str = str(hashtags_raw)

                    # Parse hashtags
                    if hashtags_str.startswith('['):
                        import ast
                        hashtags = ast.literal_eval(hashtags_str)
                    else:
                        hashtags = hashtags_str.split(',')

                    # Clean hashtags
                    for tag in hashtags:
                        tag = str(tag).strip().strip("'\"").strip()
                        if tag and len(tag) > 0 and tag.lower() not in ['none', 'nan']:
                            all_hashtags.append(tag)
                except:
                    pass

            # Build query string - JUST USE CATEGORY NAME
            # Don't add random hashtags that make no sense
            query = str(category)

            topics.append({
                'query': query,
                'category': str(category),
                'video_count': video_count,
                'total_views': total_views,
                'avg_engagement': round(avg_engagement, 4)
            })

        # Sort by total views
        topics.sort(key=lambda x: x['total_views'], reverse=True)

        print(f"✅ Found {len(topics)} topics")
        return {"topics": topics[:limit]}

    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return {"topics": []}


@router.get("/simple-topics")
def get_simple_topics(limit: int = Query(5, ge=1, le=10)):
    """
    Absolute simplest: Just return categories with counts
    """
    if df is None or len(df) == 0:
        return {"topics": []}

    if 'category' not in df.columns:
        return {"topics": []}

    # Get value counts
    category_counts = df['category'].value_counts()

    topics = []
    for category, count in category_counts.head(limit).items():
        if pd.notna(category) and str(category).lower() != 'none':
            topics.append({
                'query': str(category),
                'category': str(category),
                'video_count': int(count),
                'total_views': 0,
                'avg_engagement': 0.0
            })

    return {"topics": topics}


@router.get("/viral-by-category")
def get_viral_by_category(
        top_n: int = Query(10, ge=1, le=50),
        category: Optional[str] = None,
        sort_by: str = Query('engagement', regex='^(engagement|latest|views)$')
):
    if df is None:
        raise HTTPException(status_code=500, detail="Video data not loaded")

    # Apply category filter if specified
    working_df = df.copy()
    if category and category != 'All categories':
        working_df = working_df[working_df['category'] == category]
        categories = [category]
    else:
        categories = working_df['category'].dropna().unique()

    sections = []

    for cat in sorted(categories):
        # Filter by category
        cat_df = working_df[working_df['category'] == cat].copy()  # <-- Changed from df to working_df

        if len(cat_df) == 0:
            continue

        if sort_by == 'latest':
            cat_df = cat_df.sort_values('taken_at', ascending=False)
        elif sort_by == 'views':
            cat_df = cat_df.sort_values('view_count', ascending=False)
        else:  # engagement
            cat_df = cat_df.sort_values(['engagement_rate', 'view_count'], ascending=[False, False])

        # Take top N
        top_videos = cat_df.head(top_n)

        # Format videos
        videos = []
        for _, row in top_videos.iterrows():
            video = {
                "id": int(row['Id']),
                "title": (row.get("caption") or row.get("full_text")[:50] or "") or f"Video {row['Id']}",
                "creator": row.get('owner_username', 'unknown'),
                "thumbnail": f"https://drive.google.com/thumbnail?id={row.get('drive_file_id')}&sz=w400" if pd.notna(
                    row.get('drive_file_id')) else row.get('display_url'),
                "embed_url": f"https://drive.google.com/file/d/{row.get('drive_file_id')}/preview" if pd.notna(
                    row.get('drive_file_id')) else None,
                "views": int(row.get('view_count', 0)),
                "likes": int(row.get('like_count', 0)),
                "engagement_rate": float(row.get('engagement_rate', 0)),
                "category": row.get('category', ''),
                "hashtags": eval(row.get('hashtags', '[]')) if isinstance(row.get('hashtags'), str) else (
                        row.get('hashtags', []) or []),
                "instagram_url": row.get('shortcode_url') or row.get('video_url')
            }
            videos.append(video)

        if videos:
            sections.append({
                "key": f"category_{cat.lower().replace(' ', '_')}",
                "title": f"🔥 Trending in {cat}",
                "reason": f"Most viral content",
                "items": videos
            })

    return {"sections": sections}


@router.get("/overall-viral")
def get_overall_viral(limit: int = 50):
    """
    Get overall most viral videos across all categories.
    """
    if df is None:
        raise HTTPException(status_code=500, detail="Video data not loaded")

    # Sort by engagement rate
    viral_df = df.sort_values(
        ['engagement_rate', 'view_count'],
        ascending=[False, False]
    ).head(limit)

    videos = []
    for _, row in viral_df.iterrows():
        video = {
            "id": int(row['Id']),
            "title": row.get('caption', '')[:100] or f"Video {row['Id']}",
            "creator": row.get('owner_username', 'unknown'),
            "thumbnail": f"https://drive.google.com/thumbnail?id={row.get('drive_file_id')}&sz=w400" if pd.notna(
                row.get('drive_file_id')) else row.get('display_url'),
            "embed_url": f"https://drive.google.com/file/d/{row.get('drive_file_id')}/preview" if pd.notna(
                row.get('drive_file_id')) else None,
            "views": int(row.get('view_count', 0)),
            "likes": int(row.get('like_count', 0)),
            "engagement_rate": float(row.get('engagement_rate', 0)),
            "category": row.get('category', ''),
            "hashtags": eval(row.get('hashtags', '[]')) if isinstance(row.get('hashtags'), str) else (
                        row.get('hashtags', []) or []),
            "instagram_url": row.get('shortcode_url') or row.get('video_url')
        }
        videos.append(video)

    return {
        "sections": [{
            "key": "overall_viral",
            "title": "🔥 Most Viral Videos",
            "reason": "Top engagement across all categories",
            "items": videos
        }]
    }

@router.get("/top-topics")
def get_top_topics(limit: int = 10, category: str = None):
    """Get top topics (categories) by video count and engagement."""
    if df is None:
        raise HTTPException(status_code=500, detail="Video data not loaded")

    # Apply category filter if specified
    working_df = df.copy()
    if category and category != 'All':
        working_df = working_df[working_df['category'] == category]

    if len(working_df) == 0:
        return {"topics": []}

    category_stats = working_df.groupby('category').agg({
        'Id': 'count',
        'view_count': 'sum',
        'engagement_rate': 'mean'
    }).reset_index()

    category_stats.columns = ['topic', 'video_count', 'total_views', 'avg_engagement']
    category_stats = category_stats.sort_values('video_count', ascending=False).head(limit)

    topics = []
    for _, row in category_stats.iterrows():
        topics.append({
            "topic": row['topic'],
            "video_count": int(row['video_count']),
            "total_views": int(row['total_views']),
            "trend": "↗"
        })

    return {"topics": topics}


@router.get("/relevant-topics")
def get_relevant_topics(q: str, limit: int = 10, category: str = None):
    if df is None:
        raise HTTPException(status_code=500, detail="Video data not loaded")

    relevant = df[_search_mask(df, q)]

    if category and category != 'All':
        relevant = relevant[relevant['category'] == category]

    if len(relevant) == 0:
        return {"topics": []}

    category_stats = relevant.groupby('category').agg({
        'Id': 'count', 'view_count': 'sum', 'engagement_rate': 'mean'
    }).reset_index()

    category_stats.columns = ['topic', 'video_count', 'total_views', 'avg_engagement']
    category_stats = category_stats.sort_values('video_count', ascending=False).head(limit)

    topics = [{
        "topic": row['topic'],
        "video_count": int(row['video_count']),
        "total_views": int(row['total_views']),
        "trend": "↗"
    } for _, row in category_stats.iterrows()]

    return {"topics": topics}



@router.get("/top-creators")
def get_top_creators(limit: int = 10, category: str = None):
    """Get top creators by engagement and followers."""
    if df is None:
        raise HTTPException(status_code=500, detail="Video data not loaded")

    # Apply category filter if specified
    working_df = df.copy()
    if category and category != 'All':
        working_df = working_df[working_df['category'] == category]

    if len(working_df) == 0:
        return {"creators": []}

    creator_stats = working_df.groupby('owner_username').agg({
        'Id': 'count',
        'view_count': 'sum',
        'like_count': 'sum',
        'engagement_rate': 'mean'
    }).reset_index()

    creator_stats.columns = ['creator', 'video_count', 'total_views', 'total_likes', 'avg_engagement']
    creator_stats = creator_stats.sort_values('avg_engagement', ascending=False).head(limit)

    creators = []
    for _, row in creator_stats.iterrows():
        creators.append({
            "creator": row['creator'],
            "video_count": int(row['video_count']),
            "total_views": int(row['total_views']),
            "engagement": f"{float(row['avg_engagement']) * 100:.1f}%"
        })

    return {"creators": creators}


@router.get("/relevant-creators")
def get_relevant_creators(q: str, limit: int = 10, category: str = None):
    if df is None:
        raise HTTPException(status_code=500, detail="Video data not loaded")

    relevant = df[_search_mask(df, q)]
    if category and category != 'All':
        relevant = relevant[relevant['category'] == category]
    if len(relevant) == 0:
        return {"creators": []}

    creator_stats = relevant.groupby('owner_username').agg({
        'Id': 'count', 'view_count': 'sum', 'like_count': 'sum', 'engagement_rate': 'mean'
    }).reset_index()

    creator_stats.columns = ['creator', 'video_count', 'total_views', 'total_likes', 'avg_engagement']
    creator_stats = creator_stats.sort_values('avg_engagement', ascending=False).head(limit)

    creators = [{
        "creator": row['creator'],
        "video_count": int(row['video_count']),
        "total_views": int(row['total_views']),
        "engagement": f"{float(row['avg_engagement']) * 100:.1f}%"
    } for _, row in creator_stats.iterrows()]

    return {"creators": creators}



@router.get("/top-hashtags")
def get_top_hashtags(limit: int = 10, category: str = None):
    """Get top hashtags by frequency."""
    if df is None:
        raise HTTPException(status_code=500, detail="Video data not loaded")

    # Apply category filter if specified
    working_df = df.copy()
    if category and category != 'All':
        working_df = working_df[working_df['category'] == category]

    if len(working_df) == 0:
        return {"hashtags": []}

    all_hashtags = []
    for hashtags in working_df['hashtags'].dropna():
        if isinstance(hashtags, str):
            try:
                tags = eval(hashtags)
                all_hashtags.extend(tags)
            except:
                pass
        elif isinstance(hashtags, list):
            all_hashtags.extend(hashtags)

    if len(all_hashtags) == 0:
        return {"hashtags": []}

    hashtag_counts = pd.Series(all_hashtags).value_counts().head(limit)

    hashtags = []
    for tag, count in hashtag_counts.items():
        hashtags.append({
            "hashtag": tag,
            "count": int(count),
            "trend": "↗"
        })

    return {"hashtags": hashtags}


@router.get("/relevant-hashtags")
def get_relevant_hashtags(q: str, limit: int = 10, category: str = None):
    if df is None:
        raise HTTPException(status_code=500, detail="Video data not loaded")

    relevant = df[_search_mask(df, q)]
    if category and category != 'All':
        relevant = relevant[relevant['category'] == category]
    if len(relevant) == 0:
        return {"hashtags": []}

    all_hashtags = []
    for hashtags in relevant.get('hashtags', pd.Series([], dtype="object")).dropna():
        try:
            if isinstance(hashtags, str) and hashtags.strip().startswith('['):
                import ast
                tags = ast.literal_eval(hashtags)
            elif isinstance(hashtags, str):
                tags = [h.strip() for h in hashtags.split(',')]
            else:
                tags = list(hashtags) if hasattr(hashtags, '__iter__') else []
            all_hashtags.extend([t for t in tags if t])
        except Exception:
            pass

    if not all_hashtags:
        return {"hashtags": []}

    counts = pd.Series(all_hashtags).value_counts().head(limit)
    return {"hashtags": [{"hashtag": tag, "count": int(cnt), "trend": "↗"} for tag, cnt in counts.items()]}



@router.get("/top-videos")
def get_top_videos(limit: int = 10, category: str = None):
    """Get top videos overall."""
    if df is None:
        raise HTTPException(status_code=500, detail="Video data not loaded")

    # Apply category filter if specified
    working_df = df.copy()
    if category and category != 'All':
        working_df = working_df[working_df['category'] == category]

    if len(working_df) == 0:
        return {"videos": []}

    top = working_df.sort_values(['engagement_rate', 'view_count'], ascending=[False, False]).head(limit)

    videos = []
    for _, row in top.iterrows():
        videos.append({
            "title": (row.get("caption") or row.get("full_text")[:50] or "") or f"Video {row['Id']}",
            "creator": row.get('owner_username', 'unknown'),
            "views": int(row.get('view_count', 0)),
            "category": row.get('category', '')
        })

    return {"videos": videos}


@router.get("/relevant-videos")
def get_relevant_videos(q: str, limit: int = 10, category: str = None):
    if df is None:
        raise HTTPException(status_code=500, detail="Video data not loaded")

    relevant = df[_search_mask(df, q)]
    if category and category != 'All':
        relevant = relevant[relevant['category'] == category]
    if len(relevant) == 0:
        return {"videos": []}

    top = relevant.sort_values(['engagement_rate', 'view_count'], ascending=[False, False]).head(limit)

    videos = []
    for _, row in top.iterrows():
        videos.append({
            "title": (row.get("caption") or (row.get("full_text") or "")[:50]) or f"Video {row['Id']}",
            "creator": row.get('owner_username', 'unknown'),
            "views": int(row.get('view_count', 0)),
            "category": row.get('category', '')
        })
    return {"videos": videos}
