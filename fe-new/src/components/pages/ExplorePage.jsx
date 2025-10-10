import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronLeft, ChevronRight, Play, TrendingUp, Users, Hash, X, Video } from 'lucide-react';
import Image from 'next/image'

const API_BASE = 'http://localhost:8000';

export default function ExplorePage({ initialQuery = '', onQueryChange }) {
    const [query, setQuery] = useState(initialQuery);
    const [sections, setSections] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedVideo, setSelectedVideo] = useState(null);
    const [showResults, setShowResults] = useState(false);

    // Filter states
    const [category, setCategory] = useState('All categories');
    const [sortBy, setSortBy] = useState('engagement'); // engagement, latest, views

    // 4 Box states
    const [topics, setTopics] = useState([]);
    const [creators, setCreators] = useState([]);
    const [hashtags, setHashtags] = useState([]);
    const [videos, setVideos] = useState([]);
    const [boxesLoading, setBoxesLoading] = useState(false);

    // Box filter states
    const [topicCategory, setTopicCategory] = useState('All');
    const [creatorCategory, setCreatorCategory] = useState('All');
    const [hashtagCategory, setHashtagCategory] = useState('All');
    const [videoCategory, setVideoCategory] = useState('All');

    const hasQuery = query && query.trim();

    // Load initial data
    useEffect(() => {
        if (!initialQuery || !initialQuery.trim()) {
            loadViralVideos();
            loadTopBoxes();
        }
    }, []);

    // Handle initialQuery from Home
    useEffect(() => {
        if (initialQuery && initialQuery.trim()) {
            setQuery(initialQuery);
            handleSearch(initialQuery);
        }
    }, [initialQuery]);

    // Reload when filters change
    useEffect(() => {
        if (hasQuery) {
            handleSearch(query);
        } else {
            loadViralVideos();
        }
    }, [category, sortBy]); // eslint-disable-line

    // Reload boxes when box filters change
    useEffect(() => {
        if (hasQuery) {
            loadRelevantBoxes(query);
        } else {
            loadTopBoxes();
        }
    }, [topicCategory, creatorCategory, hashtagCategory, videoCategory]); // eslint-disable-line

    const loadViralVideos = async () => {
        setLoading(true);
        setShowResults(true);

        try {
            const params = new URLSearchParams({
                top_n: '12',
                sort_by: sortBy,
                ...(category !== 'All categories' && { category })
            });

            const response = await fetch(`${API_BASE}/api/trending/viral-by-category?${params}`);
            const data = await response.json();
            setSections(data.sections || []);
        } catch (error) {
            console.error('Failed to load viral videos:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadTopBoxes = async () => {
        setBoxesLoading(true);
        try {
            const params = {
                topics: new URLSearchParams({
                    limit: 10,
                    ...(topicCategory !== 'All' && { category: topicCategory })
                }),
                creators: new URLSearchParams({
                    limit: 10,
                    ...(creatorCategory !== 'All' && { category: creatorCategory })
                }),
                hashtags: new URLSearchParams({
                    limit: 10,
                    ...(hashtagCategory !== 'All' && { category: hashtagCategory })
                }),
                videos: new URLSearchParams({
                    limit: 10,
                    ...(videoCategory !== 'All' && { category: videoCategory })
                })
            };

            const [topicsRes, creatorsRes, hashtagsRes, videosRes] = await Promise.all([
                fetch(`${API_BASE}/api/trending/top-topics?${params.topics.toString()}`),
                fetch(`${API_BASE}/api/trending/top-creators?${params.creators.toString()}`),
                fetch(`${API_BASE}/api/trending/top-hashtags?${params.hashtags.toString()}`),
                fetch(`${API_BASE}/api/trending/top-videos?${params.videos.toString()}`)
            ]);

            const [topicsData, creatorsData, hashtagsData, videosData] = await Promise.all([
                topicsRes.json(),
                creatorsRes.json(),
                hashtagsRes.json(),
                videosRes.json()
            ]);

            setTopics(topicsData.topics || []);
            setCreators(creatorsData.creators || []);
            setHashtags(hashtagsData.hashtags || []);
            setVideos(videosData.videos || []);
        } catch (error) {
            console.error('Failed to load top boxes:', error);
        } finally {
            setBoxesLoading(false);
        }
    };

    const loadRelevantBoxes = async (searchQuery) => {
        setBoxesLoading(true);
        try {
            const params = {
                topics: new URLSearchParams({
                    q: searchQuery,
                    limit: 10,
                    ...(topicCategory !== 'All' && { category: topicCategory })
                }),
                creators: new URLSearchParams({
                    q: searchQuery,
                    limit: 10,
                    ...(creatorCategory !== 'All' && { category: creatorCategory })
                }),
                hashtags: new URLSearchParams({
                    q: searchQuery,
                    limit: 10,
                    ...(hashtagCategory !== 'All' && { category: hashtagCategory })
                }),
                videos: new URLSearchParams({
                    q: searchQuery,
                    limit: 10,
                    ...(videoCategory !== 'All' && { category: videoCategory })
                })
            };

            const [topicsRes, creatorsRes, hashtagsRes, videosRes] = await Promise.all([
                fetch(`${API_BASE}/api/trending/relevant-topics?${params.topics.toString()}`),
                fetch(`${API_BASE}/api/trending/relevant-creators?${params.creators.toString()}`),
                fetch(`${API_BASE}/api/trending/relevant-hashtags?${params.hashtags.toString()}`),
                fetch(`${API_BASE}/api/trending/relevant-videos?${params.videos.toString()}`)
            ]);

            const [topicsData, creatorsData, hashtagsData, videosData] = await Promise.all([
                topicsRes.json(),
                creatorsRes.json(),
                hashtagsRes.json(),
                videosRes.json()
            ]);

            setTopics(topicsData.topics || []);
            setCreators(creatorsData.creators || []);
            setHashtags(hashtagsData.hashtags || []);
            setVideos(videosData.videos || []);
        } catch (error) {
            console.error('Failed to load relevant boxes:', error);
        } finally {
            setBoxesLoading(false);
        }
    };

    const handleSearch = async (searchQuery) => {
        const q = (searchQuery || '').trim();
        if (!q) {
            loadViralVideos();
            loadTopBoxes();
            return;
        }

        setLoading(true);
        setShowResults(true);

        onQueryChange?.(q);

        try {
            const params = new URLSearchParams({
                q,
                rows_per_section: '16',
                sort_by: sortBy,
                ...(category !== 'All categories' && { category })
            });

            const response = await fetch(`${API_BASE}/api/explore?${params}`);
            const data = await response.json();
            setSections(data.sections || []);

            // keep boxes perfectly in sync with the exact query used for videos
            await loadRelevantBoxes(q);
        } catch (error) {
            console.error('Search failed:', error);
        } finally {
            setLoading(false);
        }
    };

    // <<< Use onKeyDown, read the live value, then call handleSearch with it >>>
    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const v = e.currentTarget.value;
            setQuery(v);
            handleSearch(v);
        }
    };

    const handleBoxItemClick = (text) => {
        setQuery(text);
        handleSearch(text);
    };

    const categories = [
        'All categories',
        'Beauty & Skincare',
        'Fitness & Gym',
        'Sports & Athletes',
        'Health & Wellness',
        'Gaming & Tech',
        'Finance & Business',
        'Automotive & Cars',
        'Pets & Veterinary'
    ];

    const boxCategories = ['All', ...categories.slice(1)];

    return (
        <section className="px-6 py-8 bg-gray-50 min-h-screen">
            <div className="max-w-7xl mx-auto">
                {/* Search Box */}
                <div className="bg-white rounded-lg p-8 shadow-sm mb-6">
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}   // <-- swapped from onKeyPress
                        placeholder="Add a search term"
                        className="w-full text-xl text-gray-700 outline-none"
                    />
                </div>

                {/* Filters */}
                <div className="bg-white rounded-lg p-4 shadow-sm mb-6 flex gap-4 flex-wrap">
                    <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        {categories.map(cat => (
                            <option key={cat}>{cat}</option>
                        ))}
                    </select>

                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="engagement">Most engaging</option>
                        <option value="latest">Most recent</option>
                        <option value="views">Most viewed</option>
                    </select>
                </div>

                {/* Video Results */}
                {showResults && (
                    <div className="bg-white rounded-lg shadow-sm overflow-hidden animate-slideDown mb-6">
                        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-medium text-gray-900">Video Results</h3>
                                <p className="text-sm text-gray-600 mt-0.5">
                                    {loading ? 'Searching...' : `${sections.reduce((sum, s) => sum + s.items.length, 0)} videos found`}
                                </p>
                            </div>
                            <button
                                onClick={() => {
                                    setShowResults(false);
                                    setSections([]);
                                }}
                                className="p-2 hover:bg-gray-100 rounded-lg transition"
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        <div className="max-h-[500px] overflow-y-auto">
                            {loading ? (
                                <div className="p-12 text-center">
                                    <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                                    <p className="text-gray-600">Searching videos...</p>
                                </div>
                            ) : sections.length > 0 ? (
                                <div className="px-6 py-4 space-y-6">
                                    {sections.map((section, idx) => (
                                        <VideoRow
                                            key={`${section.key}-${idx}`}
                                            section={section}
                                            onVideoClick={setSelectedVideo}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="p-12 text-center">
                                    <Search size={48} className="mx-auto text-gray-400 mb-4" />
                                    <p className="text-gray-600">No results found</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* 4 Boxes Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Topics Box */}
                    <InfoBox
                        title={hasQuery ? "Relevant topics" : "Top topics"}
                        icon={<TrendingUp className="w-5 h-5 text-blue-500" />}
                        items={topics}
                        loading={boxesLoading}
                        filterValue={topicCategory}
                        onFilterChange={setTopicCategory}
                        filterOptions={boxCategories}
                        renderItem={(topic) => (
                            <div
                                onClick={() => handleBoxItemClick(topic.topic)}
                                className="flex justify-between items-center p-3 hover:bg-gray-50 rounded cursor-pointer transition"
                            >
                                <div>
                                    <p className="font-medium text-gray-900">{topic.topic}</p>
                                    <p className="text-xs text-gray-500">{topic.video_count} videos</p>
                                </div>
                                <span className="text-xl">{topic.trend}</span>
                            </div>
                        )}
                        emptyMessage={hasQuery ? "No relevant topics found" : "Trending topics will appear here"}
                    />

                    {/* Creators Box */}
                    <InfoBox
                        title={hasQuery ? "Relevant creators" : "Top creators"}
                        icon={<Users className="w-5 h-5 text-purple-500" />}
                        items={creators}
                        loading={boxesLoading}
                        filterValue={creatorCategory}
                        onFilterChange={setCreatorCategory}
                        filterOptions={boxCategories}
                        renderItem={(creator) => (
                            <div
                                onClick={() => handleBoxItemClick(creator.creator)}
                                className="flex justify-between items-center p-3 hover:bg-gray-50 rounded cursor-pointer transition"
                            >
                                <div>
                                    <p className="font-medium text-gray-900">@{creator.creator}</p>
                                    <p className="text-xs text-gray-500">{creator.video_count} videos</p>
                                </div>
                                <span className="text-xs font-medium text-green-600">{creator.engagement}</span>
                            </div>
                        )}
                        emptyMessage={hasQuery ? "No relevant creators found" : "Top creators will appear here"}
                    />

                    {/* Hashtags Box */}
                    <InfoBox
                        title={hasQuery ? "Relevant hashtags" : "Top hashtags"}
                        icon={<Hash className="w-5 h-5 text-pink-500" />}
                        items={hashtags}
                        loading={boxesLoading}
                        filterValue={hashtagCategory}
                        onFilterChange={setHashtagCategory}
                        filterOptions={boxCategories}
                        renderItem={(hashtag) => (
                            <div
                                onClick={() => handleBoxItemClick(hashtag.hashtag)}
                                className="flex justify-between items-center p-3 hover:bg-gray-50 rounded cursor-pointer transition"
                            >
                                <p className="font-medium text-gray-900">#{hashtag.hashtag}</p>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-gray-500">{hashtag.count}</span>
                                    <span className="text-xl">{hashtag.trend}</span>
                                </div>
                            </div>
                        )}
                        emptyMessage={hasQuery ? "No relevant hashtags found" : "Trending hashtags will appear here"}
                    />

                    {/* Videos Box */}
                    <InfoBox
                        title={hasQuery ? "Relevant videos" : "Top videos"}
                        icon={<Video className="w-5 h-5 text-red-500" />}
                        items={videos}
                        loading={boxesLoading}
                        filterValue={videoCategory}
                        onFilterChange={setVideoCategory}
                        filterOptions={boxCategories}
                        renderItem={(video) => (
                            <div
                                onClick={() => handleBoxItemClick(video.title)}
                                className="p-3 hover:bg-gray-50 rounded cursor-pointer transition"
                            >
                                <p className="font-medium text-gray-900 text-sm line-clamp-2 mb-1">{video.title}</p>
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                    <span>@{video.creator}</span>
                                    <span>•</span>
                                    <span>{(video.views / 1000).toFixed(1)}K views</span>
                                </div>
                            </div>
                        )}
                        emptyMessage={hasQuery ? "No relevant videos found" : "Top videos will appear here"}
                    />
                </div>
            </div>

            {/* Video Modal */}
            {selectedVideo && (
                <VideoModal video={selectedVideo} onClose={() => setSelectedVideo(null)} />
            )}
        </section>
    );
}

function InfoBox({ title, icon, items, loading, renderItem, emptyMessage, filterValue, onFilterChange, filterOptions }) {
    return (
        <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    {icon}
                    <h3 className="text-lg font-medium text-gray-900">{title}</h3>
                </div>
                {filterOptions && (
                    <select
                        value={filterValue}
                        onChange={(e) => onFilterChange(e.target.value)}
                        className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        {filterOptions.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                        ))}
                    </select>
                )}
            </div>
            {loading ? (
                <div className="text-center py-8">
                    <div className="inline-block w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : items.length > 0 ? (
                <div className="space-y-1 max-h-[400px] overflow-y-auto">
                    {items.map((item, idx) => (
                        <div key={idx}>{renderItem(item)}</div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-8 text-gray-500">
                    <p className="text-sm">{emptyMessage}</p>
                </div>
            )}
        </div>
    );
}

function VideoRow({ section, onVideoClick }) {
    const scrollRef = useRef(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);

    const scroll = (direction) => {
        const container = scrollRef.current;
        if (!container) return;
        const scrollAmount = direction === 'left' ? -600 : 600;
        container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    };

    const checkScroll = () => {
        const container = scrollRef.current;
        if (!container) return;
        setCanScrollLeft(container.scrollLeft > 0);
        setCanScrollRight(container.scrollLeft < container.scrollWidth - container.clientWidth - 10);
    };

    useEffect(() => {
        checkScroll();
        const container = scrollRef.current;
        if (container) {
            container.addEventListener('scroll', checkScroll);
            return () => container.removeEventListener('scroll', checkScroll);
        }
    }, []);

    const getIcon = () => {
        if (section.key.includes('category_')) return <TrendingUp size={16} className="text-orange-500" />;
        switch (section.key) {
            case 'hashtag': return <Hash size={16} className="text-blue-500" />;
            case 'creator': return <Users size={16} className="text-purple-500" />;
            case 'spotlight': return <TrendingUp size={16} className="text-red-500" />;
            case 'more_from_category': return <TrendingUp size={16} className="text-green-500" />;
            default: return <Search size={16} className="text-gray-500" />;
        }
    };

    return (
        <div className="mb-6 last:mb-0">
            <div className="flex items-center gap-2 mb-3">
                {getIcon()}
                <h4 className="text-sm font-semibold text-gray-900">{section.title}</h4>
                <span className="text-gray-500 text-xs">• {section.reason}</span>
            </div>
            <div className="relative group">
                {canScrollLeft && (
                    <button onClick={() => scroll('left')} className="absolute left-0 top-0 bottom-0 z-10 w-8 bg-gradient-to-r from-white via-white to-transparent flex items-center justify-start opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="bg-white rounded-full p-1 shadow-md ml-1">
                            <ChevronLeft size={20} className="text-gray-700" />
                        </div>
                    </button>
                )}
                <div ref={scrollRef} className="flex gap-3 overflow-x-auto scrollbar-hide scroll-smooth" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                    {section.items.map((video) => (
                        <VideoCard key={video.id} video={video} onClick={() => onVideoClick(video)} />
                    ))}
                </div>
                {canScrollRight && (
                    <button onClick={() => scroll('right')} className="absolute right-0 top-0 bottom-0 z-10 w-8 bg-gradient-to-l from-white via-white to-transparent flex items-center justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="bg-white rounded-full p-1 shadow-md mr-1">
                            <ChevronRight size={20} className="text-gray-700" />
                        </div>
                    </button>
                )}
            </div>
        </div>
    );
}

function VideoCard({ video, onClick }) {
    const [hovered, setHovered] = useState(false);
    return (
        <div className="flex-shrink-0 w-40 cursor-pointer transition-transform hover:scale-105" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} onClick={onClick}>
            <div className="relative aspect-[9/16] rounded-lg overflow-hidden bg-gray-900 mb-2 shadow-sm">
                <Image src={video.thumbnail} alt={video.title} fill sizes="160px" className="w-full h-full object-cover" loading="lazy" />
                {hovered && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <Play size={32} className="text-white drop-shadow-lg" fill="white" />
                    </div>
                )}
                <div className="absolute top-2 right-2 bg-black/80 px-1.5 py-0.5 rounded text-xs font-medium">
                    {(video.views / 1000).toFixed(1)}K
                </div>
            </div>
            <h3 className="font-medium text-xs line-clamp-2 mb-1 text-gray-900">{video.title || 'Untitled'}</h3>
            <p className="text-gray-600 text-xs mb-1">@{video.creator}</p>
            <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">{video.category}</span>
                <span className="text-xs text-gray-500">{video.likes} likes</span>
            </div>
        </div>
    );
}

function VideoModal({ video, onClose }) {
    const iframeRef = useRef(null);
    useEffect(() => {
        if (video.embed_url && iframeRef.current) {
            iframeRef.current.src = video.embed_url;
        }
    }, [video.embed_url]);

    return (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 animate-fadeIn" onClick={onClose}>
            <div className="max-w-5xl w-full bg-white rounded-xl overflow-hidden shadow-2xl animate-scaleIn" onClick={(e) => e.stopPropagation()}>
                <div className="relative">
                    <button onClick={onClose} className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70 p-2 rounded-full transition">
                        <X size={24} className="text-white" />
                    </button>
                    <div className="aspect-video bg-black">
                        {video.embed_url ? (
                            <iframe ref={iframeRef} src={video.embed_url} className="w-full h-full" allow="autoplay; fullscreen" loading="eager" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">Video not available</div>
                        )}
                    </div>
                </div>
                <div className="p-6 bg-gray-50">
                    <h2 className="text-2xl font-bold mb-2 text-gray-900">{video.title || 'Untitled'}</h2>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                        <span className="font-medium">@{video.creator}</span>
                        <span>•</span>
                        <span>{video.views.toLocaleString()} views</span>
                        <span>•</span>
                        <span>{video.likes.toLocaleString()} likes</span>
                        <span>•</span>
                        <span className="text-green-600 font-medium">{(video.engagement_rate * 100).toFixed(2)}% engagement</span>
                    </div>
                    {video.hashtags && video.hashtags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                            {video.hashtags.map((tag, i) => (
                                <span key={i} className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-medium">#{tag}</span>
                            ))}
                        </div>
                    )}
                    {video.instagram_url && (
                        <a href={video.instagram_url} target="_blank" rel="noopener noreferrer" className="inline-block px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg hover:shadow-lg transition font-semibold text-white">View on Instagram</a>
                    )}
                </div>
            </div>
        </div>
    );
}
