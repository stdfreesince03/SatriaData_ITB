from fastapi import APIRouter, Query
import random
from utils.text_processing import is_interesting_query

router = APIRouter(prefix="/api/search", tags=["search"])

# Will be set by main.py
topic_keywords = {}
hashtag_stats = None
topics_data = None


def set_globals(tk, hs, td):
    """Set module-level globals from main"""
    global topic_keywords, hashtag_stats, topics_data
    topic_keywords = tk
    hashtag_stats = hs
    topics_data = td


def generate_2word_phrases_per_topic():
    """For each topic, pick 2 random adjacent words."""
    phrases = []

    for topic_name, keywords in topic_keywords.items():
        if len(keywords) < 2:
            continue

        start_idx = random.randint(0, len(keywords) - 2)
        word1 = keywords[start_idx]
        word2 = keywords[start_idx + 1]
        phrase = f"{word1} {word2}"

        if is_interesting_query(phrase):
            phrases.append({
                "text": phrase,
                "type": "topic_phrase",
                "icon": "🔍",
                "topic_name": topic_name
            })

    return phrases


@router.get("/random-suggestions")
async def get_random_suggestions(limit: int = Query(5, ge=1, le=10)):
    """Returns random 2-word phrase suggestions."""
    all_suggestions = []

    topic_phrases = generate_2word_phrases_per_topic()
    all_suggestions.extend(topic_phrases)

    if hashtag_stats is not None and len(hashtag_stats) > 0:
        top_hashtags = hashtag_stats.nlargest(15, 'mean_eng')
        for _, row in top_hashtags.iterrows():
            hashtag = row['tag']
            if is_interesting_query(str(hashtag), min_length=3):
                all_suggestions.append({
                    "text": f"#{hashtag}",
                    "type": "hashtag",
                    "icon": "#️⃣"
                })

    random.shuffle(all_suggestions)

    return {"suggestions": all_suggestions[:limit]}


@router.get("/suggestions")
async def get_search_suggestions(
    q: str = Query(..., min_length=1),
    limit: int = Query(10, ge=1, le=20)
):
    """Returns search suggestions based on user query."""
    query = q.lower().strip()
    suggestions = []

    # Match topic names
    for topic_name in topics_data.values():
        if query in topic_name.lower() and is_interesting_query(topic_name):
            suggestions.append({
                "text": topic_name,
                "type": "category",
                "icon": "🏷"
            })

    # Match hashtags
    if hashtag_stats is not None and len(hashtag_stats) > 0:
        hashtag_matches = hashtag_stats[
            hashtag_stats['tag'].astype(str).str.contains(query, case=False, na=False)
        ].nlargest(5, 'mean_eng')

        for _, row in hashtag_matches.iterrows():
            hashtag = row['tag']
            if is_interesting_query(str(hashtag), min_length=3):
                suggestions.append({
                    "text": f"#{hashtag}",
                    "type": "hashtag",
                    "icon": "#️⃣"
                })

    # Match keywords in topics
    for topic_name, keywords in topic_keywords.items():
        matching_keywords = [kw for kw in keywords if query in kw]
        if matching_keywords:
            idx = keywords.index(matching_keywords[0])
            if idx < len(keywords) - 1:
                phrase = f"{keywords[idx]} {keywords[idx + 1]}"
                if is_interesting_query(phrase):
                    suggestions.append({
                        "text": phrase,
                        "type": "topic_phrase",
                        "icon": "🔍"
                    })

    # Return unique suggestions
    seen = set()
    unique_suggestions = []
    for s in suggestions:
        if s['text'] not in seen:
            seen.add(s['text'])
            unique_suggestions.append(s)
            if len(unique_suggestions) >= limit:
                break

    return {"query": q, "suggestions": unique_suggestions}