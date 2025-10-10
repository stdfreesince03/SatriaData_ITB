from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
import pandas as pd
import re
import json

router = APIRouter(prefix="/api", tags=["events"])

# Global variable
event_data = None
df = None


def set_globals(events_df, videos_df):
    """Set module-level globals from main"""
    global event_data, df
    event_data = events_df
    df = videos_df


def extract_video_ids_from_text(text: str) -> List[tuple]:
    """
    Extract [ID] markers from text and return list of (video_id, sentence) tuples
    Example: "[864] This is a sentence" -> (864, "This is a sentence")
    """
    pattern = r'\[(\d+)\]\s*([^\[]+)'
    matches = re.findall(pattern, text)
    return [(int(vid_id), sentence.strip()) for vid_id, sentence in matches]


def get_video_by_id(video_id: int) -> Dict[str, Any]:
    """Get video details by ID"""
    if df is None:
        return None

    video = df[df['Id'] == video_id]
    if video.empty:
        return None

    row = video.iloc[0]
    return {
        "id": int(row['Id']),
        "thumbnail": f"https://drive.google.com/thumbnail?id={row.get('drive_file_id')}&sz=w400" if pd.notna(
            row.get('drive_file_id')) else None,
        "embed_url": f"https://drive.google.com/file/d/{row.get('drive_file_id')}/preview" if pd.notna(
            row.get('drive_file_id')) else None,
        "creator": row.get('owner_username'),
        "category": row.get('category'),
        "views": int(row.get('view_count', 0)),
        "likes": int(row.get('like_count', 0))
    }


@router.get("/events/by-category/{category}")
def get_events_by_category(category: str):
    """Get all events for a specific category"""
    if event_data is None:
        raise HTTPException(status_code=500, detail="Event data not loaded")

    # Map category IDs to names
    category_map = {
        "beauty": "Beauty & Skincare",
        "fitness": "Fitness & Gym",
        "sports": "Sports & Athletes",
        "automotive": "Automotive & Cars",
        "health": "Health & Wellness",
        "gaming": "Gaming & Tech",
        "finance": "Finance & Business",
        "pets": "Pets & Veterinary"
    }

    category_name = category_map.get(category)
    if not category_name:
        raise HTTPException(status_code=404, detail="Category not found")

    # Filter events by category
    category_events = event_data[event_data['category'] == category_name]

    if category_events.empty:
        return {"category": category, "events": []}

    events = []
    for _, event in category_events.iterrows():
        # Parse member_ids
        try:
            member_ids = json.loads(event['member_ids'].replace("'", '"'))
        except:
            member_ids = []

        # Parse top_hashtags
        try:
            top_hashtags = json.loads(event['top_hashtags'].replace("'", '"'))
        except:
            top_hashtags = []

        # Extract sentences with video IDs from summary_text
        text_segments = extract_video_ids_from_text(event['summary_text'])

        # Get video details for segments
        segments = []
        for video_id, sentence in text_segments[:10]:  # Limit to 10 segments
            video = get_video_by_id(video_id)
            segments.append({
                "text": sentence,
                "video": video
            })

        # Get sample videos from member_ids
        sample_videos = []
        for vid_id in member_ids[:6]:  # Get first 6 videos
            video = get_video_by_id(vid_id)
            if video:
                sample_videos.append(video)

        events.append({
            "event_id": event['event_id'],
            "cluster_size": int(event['cluster_size']),
            "time_start": event['time_start'],
            "time_end": event['time_end'],
            "summary_highlevel": event['summary_highlevel'],
            "summary_text": event['summary_text'],
            "top_hashtags": top_hashtags,
            "member_ids": member_ids,
            "sample_videos": sample_videos,
            "segments": segments  # Text + video pairs
        })

    return {
        "category": category,
        "category_name": category_name,
        "events": events
    }