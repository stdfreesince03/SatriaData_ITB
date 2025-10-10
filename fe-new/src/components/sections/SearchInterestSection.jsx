import { Search, TrendingUp, Play, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import Image from 'next/image';

const API_BASE = 'http://localhost:8000';

export default function SearchInterestSection({ onSearchClick }) {
    const [trendingTopics, setTrendingTopics] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [selectedVideo, setSelectedVideo] = useState(null);
    const [isAutoRotating, setIsAutoRotating] = useState(true);

    // Fetch trending topics from API
    useEffect(() => {
        const fetchTrending = async () => {
            try {
                // Try viral-topics first, fallback to simple-topics
                let response = await fetch(`${API_BASE}/api/trending/viral-topics?limit=10`);
                let data = await response.json();

                // If empty, try simple endpoint
                if (!data.topics || data.topics.length === 0) {
                    console.log('Viral topics empty, trying simple endpoint...');
                    response = await fetch(`${API_BASE}/api/trending/simple-topics?limit=10`);
                    data = await response.json();
                }

                if (!data.topics || data.topics.length === 0) {
                    console.error('No topics from any endpoint');
                    setLoading(false);
                    return;
                }

                // For each topic, fetch RELEVANT videos that actually match the query
                const topicsWithVideos = [];

                for (const topic of data.topics.slice(0, 5)) {
                    try {
                        // Search using the category name
                        const searchQuery = topic.category;

                        const videoResponse = await fetch(
                            `${API_BASE}/api/explore?q=${encodeURIComponent(searchQuery)}&rows_per_section=12`
                        );
                        const videoData = await videoResponse.json();

                        // Collect videos from all sections
                        let allVideos = videoData.sections.flatMap(s => s.items);

                        // STRICT FILTER: Only show videos from THIS category
                        const categoryVideos = allVideos.filter(v =>
                            v.category === topic.category
                        );

                        // Sort by engagement and take top 3
                        categoryVideos.sort((a, b) => b.engagement_rate - a.engagement_rate);
                        const topVideos = categoryVideos.slice(0, 3);

                        if (topVideos.length >= 2) {  // Need at least 2 videos
                            topicsWithVideos.push({
                                query: topic.category,  // Use just category name
                                category: topic.category,
                                videoCount: topic.video_count,
                                totalViews: topic.total_views,
                                videos: topVideos
                            });
                        }
                    } catch (err) {
                        console.error(`Failed to fetch videos for ${topic.category}:`, err);
                    }
                }

                // Only set topics that have videos
                const validTopics = topicsWithVideos.filter(t => t.videos && t.videos.length > 0);

                if (validTopics.length > 0) {
                    setTrendingTopics(validTopics);
                } else {
                    console.warn('No valid topics with videos found');
                }

                setLoading(false);
            } catch (error) {
                console.error('Failed to fetch trending topics:', error);
                setLoading(false);
            }
        };

        fetchTrending();
    }, []);

    // Auto-rotate every 10 seconds
    useEffect(() => {
        if (!isAutoRotating || trendingTopics.length <= 1) return;

        const interval = setInterval(() => {
            setCurrentIndex((prev) => {
                const next = (prev + 1) % trendingTopics.length;
                console.log(`🔄 Auto-rotating: ${prev} → ${next} (${trendingTopics.length} total)`);
                return next;
            });
        }, 6000);

        console.log(`✅ Auto-rotation started (every 10s, ${trendingTopics.length} topics)`);

        return () => {
            clearInterval(interval);
            console.log('🛑 Auto-rotation stopped');
        };
    }, [isAutoRotating, trendingTopics.length]);

    const handlePrevious = () => {
        setIsAutoRotating(false);
        setCurrentIndex((prev) => {
            const next = (prev - 1 + trendingTopics.length) % trendingTopics.length;
            console.log(`⬅️ Manual previous: ${prev} → ${next}`);
            return next;
        });
        // Resume auto-rotation after 30 seconds
        setTimeout(() => setIsAutoRotating(true), 30000);
    };

    const handleNext = () => {
        setIsAutoRotating(false);
        setCurrentIndex((prev) => {
            const next = (prev + 1) % trendingTopics.length;
            console.log(`➡️ Manual next: ${prev} → ${next}`);
            return next;
        });
        // Resume auto-rotation after 30 seconds
        setTimeout(() => setIsAutoRotating(true), 30000);
    };

    if (loading) {
        return (
            <section className="px-6 py-12 bg-gray-50">
                <div className="max-w-7xl mx-auto">
                    <div className="bg-white rounded-lg p-12 shadow-sm text-center">
                        <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                        <p className="text-gray-600">Loading trending topics...</p>
                    </div>
                </div>
            </section>
        );
    }

    if (trendingTopics.length === 0) {
        return (
            <section className="px-6 py-12 bg-gray-50">
                <div className="max-w-7xl mx-auto">
                    <div className="bg-white rounded-lg p-12 shadow-sm text-center">
                        <TrendingUp className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                        <p className="text-gray-600">No trending topics available</p>
                    </div>
                </div>
            </section>
        );
    }

    const currentTopic = trendingTopics[currentIndex];

    return (
        <section className="px-6 py-12 bg-gray-50">
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-4">
                    <p className="text-sm text-gray-500">Trending right now</p>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handlePrevious}
                            className="p-2 hover:bg-white rounded-full transition"
                        >
                            <ChevronLeft className="w-5 h-5 text-gray-600" />
                        </button>
                        <div className="flex gap-1">
                            {trendingTopics.map((_, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => {
                                        setCurrentIndex(idx);
                                        setIsAutoRotating(false);
                                    }}
                                    className={`h-1 rounded-full transition-all ${
                                        idx === currentIndex ? 'w-8 bg-blue-600' : 'w-1 bg-gray-300'
                                    }`}
                                />
                            ))}
                        </div>
                        <button
                            onClick={handleNext}
                            className="p-2 hover:bg-white rounded-full transition"
                        >
                            <ChevronRight className="w-5 h-5 text-gray-600" />
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded-lg p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900 mb-1">
                                {currentTopic.query}
                            </h2>
                            <p className="text-sm text-gray-500">
                                {currentTopic.videoCount} videos • {((currentTopic.totalViews || 0) / 1000).toFixed(0)}K total views
                            </p>
                        </div>
                        <button
                            onClick={() => onSearchClick && onSearchClick(currentTopic.category || currentTopic.query)}
                            className="flex items-center gap-2 text-blue-600 text-sm hover:bg-blue-50 px-4 py-2 rounded-full transition"
                        >
                            <Search className="w-4 h-4" />
                            Explore all
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {currentTopic.videos.map((video, idx) => (
                            <VideoCard
                                key={`${video.id}-${idx}`}
                                video={video}
                                onClick={() => setSelectedVideo(video)}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* Mini Player Modal */}
            {selectedVideo && (
                <MiniPlayer video={selectedVideo} onClose={() => setSelectedVideo(null)} />
            )}
        </section>
    );
}

function VideoCard({ video, onClick }) {
    const [hovered, setHovered] = useState(false);

    return (
        <div
            className="flex gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition group"
            onClick={onClick}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            <div className="relative w-24 h-32 bg-gray-900 rounded-lg flex-shrink-0 overflow-hidden">
                <Image
                    src={video.thumbnail}
                    alt={video.title}
                    fill
                    sizes="96px"
                    className="object-cover"
                />
                {hovered && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
                        <Play size={32} className="text-white" fill="white" />
                    </div>
                )}
                <div className="absolute top-1 right-1 bg-black/80 px-1.5 py-0.5 rounded text-xs z-10">
                    {(video.views / 1000).toFixed(1)}K
                </div>
            </div>
            <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-gray-900 mb-1 line-clamp-2 group-hover:text-blue-600 transition">
                    {video.title}
                </h3>
                <p className="text-xs text-gray-500 mb-1">@{video.creator}</p>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                        {video.category}
                    </span>
                    <span>{video.likes} likes</span>
                </div>
            </div>
        </div>
    );
}

function MiniPlayer({ video, onClose }) {
    return (
        <div
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 animate-fadeIn"
            onClick={onClose}
        >
            <div
                className="max-w-4xl w-full bg-white rounded-xl overflow-hidden shadow-2xl animate-scaleIn"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="relative">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70 p-2 rounded-full transition"
                    >
                        <X size={24} className="text-white" />
                    </button>

                    <div className="aspect-video bg-black">
                        {video.embed_url ? (
                            <iframe
                                src={video.embed_url}
                                className="w-full h-full"
                                allow="autoplay"
                            />
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 gap-4">
                                <Play size={64} />
                                <p>Video preview not available</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-6 bg-gray-50">
                    <h2 className="text-xl font-bold mb-2 text-gray-900">{video.title}</h2>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                        <span className="font-medium">@{video.creator}</span>
                        <span>•</span>
                        <span>{video.views.toLocaleString()} views</span>
                        <span>•</span>
                        <span>{video.likes.toLocaleString()} likes</span>
                        <span>•</span>
                        <span className="text-green-600 font-medium">
                            {(video.engagement_rate * 100).toFixed(2)}% engagement
                        </span>
                    </div>

                    {video.hashtags && video.hashtags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                            {video.hashtags.map((tag, i) => (
                                <span key={i} className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-medium">
                                    #{tag}
                                </span>
                            ))}
                        </div>
                    )}

                    <div className="flex gap-2">
                        <button
                            onClick={onClose}
                            className="px-6 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition font-medium text-gray-700 text-sm"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}