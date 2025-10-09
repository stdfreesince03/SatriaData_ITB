from fastapi import APIRouter, Query
from typing import Dict, Any, List
import pandas as pd
from collections import Counter

router = APIRouter(prefix="/api/trending", tags=["trending"])

# Will be set by main.py
df = None


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