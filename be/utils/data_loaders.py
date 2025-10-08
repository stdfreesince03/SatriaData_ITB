import pandas as pd
from collections import Counter
import re
from .text_processing import STOPWORDS, is_interesting_query


def extract_topic_keywords(df_with_topics, topics_dict, top_n=20):
    """Extract top keywords for each topic from videos assigned to that topic."""
    topic_keywords = {}

    for topic_id, topic_name in topics_dict.items():
        if topic_id == '-1' or 'outlier' in topic_name.lower():
            continue

        topic_videos = df_with_topics[df_with_topics['Topic'] == int(topic_id)]

        if len(topic_videos) == 0:
            continue

        all_text = ' '.join(topic_videos['full_text'].dropna().values)
        words = re.findall(r'\b\w{3,}\b', all_text.lower())
        interesting_words = [w for w in words if w not in STOPWORDS and len(w) > 3]
        word_counts = Counter(interesting_words)
        top_words = [word for word, count in word_counts.most_common(top_n)]

        if len(top_words) >= 2:
            topic_keywords[topic_name] = top_words

    return topic_keywords