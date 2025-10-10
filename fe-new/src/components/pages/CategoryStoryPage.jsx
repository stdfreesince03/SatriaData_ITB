'use client';

import { X, ChevronLeft, ChevronRight, Play } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';

const API_BASE = 'http://localhost:8000';

const categoryColors = {
    beauty: { from: "from-pink-400", to: "to-purple-500", bg: "bg-pink-50", text: "text-pink-600", accent: "rgb(236, 72, 153)" },
    fitness: { from: "from-orange-400", to: "to-red-500", bg: "bg-orange-50", text: "text-orange-600", accent: "rgb(249, 115, 22)" },
    sports: { from: "from-blue-400", to: "to-teal-500", bg: "bg-blue-50", text: "text-blue-600", accent: "rgb(59, 130, 246)" },
    automotive: { from: "from-gray-700", to: "to-black", bg: "bg-gray-50", text: "text-gray-800", accent: "rgb(55, 65, 81)" },
    health: { from: "from-green-400", to: "to-teal-600", bg: "bg-green-50", text: "text-green-600", accent: "rgb(34, 197, 94)" },
    gaming: { from: "from-purple-500", to: "to-blue-700", bg: "bg-purple-50", text: "text-purple-600", accent: "rgb(147, 51, 234)" },
    finance: { from: "from-yellow-400", to: "to-orange-600", bg: "bg-yellow-50", text: "text-yellow-700", accent: "rgb(234, 179, 8)" },
    pets: { from: "from-amber-300", to: "to-lime-500", bg: "bg-amber-50", text: "text-amber-600", accent: "rgb(245, 158, 11)" }
};

function VideoThumbnail({ video }) {
    const [showIframe, setShowIframe] = useState(false);

    return (
        <div className="aspect-[9/16] rounded-xl overflow-hidden bg-gray-100 shadow-lg relative group cursor-pointer">
            {!showIframe && video.thumbnail ? (
                <div
                    onClick={() => setShowIframe(true)}
                    className="w-full h-full relative"
                >
                    <img
                        src={video.thumbnail}
                        alt="Video thumbnail"
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                        <div className="bg-white/90 rounded-full p-4 group-hover:scale-110 transition-transform">
                            <svg className="w-8 h-8 text-gray-800" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z"/>
                            </svg>
                        </div>
                    </div>
                </div>
            ) : showIframe && video.embed_url ? (
                <iframe
                    src={video.embed_url}
                    className="w-full h-full"
                    allow="autoplay"
                />
            ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                    Video {video.id}
                </div>
            )}
        </div>
    );
}

function VideoCarousel({ videos, categoryId }) {
    const scrollRef = useRef(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);

    const colors = categoryColors[categoryId] || categoryColors.beauty;

    const scroll = (direction) => {
        const container = scrollRef.current;
        if (!container) return;

        const scrollAmount = 320;
        container.scrollBy({
            left: direction === 'left' ? -scrollAmount : scrollAmount,
            behavior: 'smooth'
        });

        setTimeout(() => {
            setCanScrollLeft(container.scrollLeft > 0);
            setCanScrollRight(container.scrollLeft < container.scrollWidth - container.clientWidth - 10);
        }, 300);
    };

    return (
        <div className="relative group">
            {canScrollLeft && (
                <button
                    onClick={() => scroll('left')}
                    className={`absolute left-0 top-1/2 -translate-y-1/2 z-10 ${colors.bg} shadow-lg rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity`}
                >
                    <ChevronLeft className={colors.text} size={24} />
                </button>
            )}

            <div
                ref={scrollRef}
                className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                {videos.slice(0, 6).map((video, i) => (
                    video && (
                        <div key={i} className="flex-shrink-0 w-[280px]">
                            <VideoThumbnail video={video} />
                        </div>
                    )
                ))}
            </div>

            {canScrollRight && (
                <button
                    onClick={() => scroll('right')}
                    className={`absolute right-0 top-1/2 -translate-y-1/2 z-10 ${colors.bg} shadow-lg rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity`}
                >
                    <ChevronRight className={colors.text} size={24} />
                </button>
            )}
        </div>
    );
}

export default function CategoryStoryPage() {
    const params = useParams();
    const categoryId = params?.categoryId || 'beauty';
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [categoryName, setCategoryName] = useState('');

    useEffect(() => {
        async function loadEvents() {
            try {
                const response = await fetch(`${API_BASE}/api/events/by-category/${categoryId}`);
                const data = await response.json();
                setEvents(data.events || []);
                setCategoryName(data.category_name || '');
            } catch (error) {
                console.error('Failed to load events:', error);
            } finally {
                setLoading(false);
            }
        }
        loadEvents();
    }, [categoryId]);

    const colors = categoryColors[categoryId] || categoryColors.beauty;

    const highlightText = (text) => {
        const parts = text.split(/(\*[^*]+\*)/g);
        return parts.map((part, i) => {
            if (part.startsWith('*') && part.endsWith('*')) {
                const content = part.slice(1, -1);
                return (
                    <span
                        key={i}
                        className="font-semibold px-1.5 py-0.5 rounded"
                        style={{
                            background: `linear-gradient(to right, ${colors.accent}15, ${colors.accent}25)`,
                            color: colors.accent
                        }}
                    >
                        {content}
                    </span>
                );
            }
            return part;
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-gray-600">Loading stories...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white">
            {/* Header */}
            <header className="border-b border-gray-200 sticky top-0 bg-white/80 backdrop-blur-md z-50">
                <div className="max-w-6xl mx-auto px-8 py-6 flex items-center justify-between">
                    <h1 className="text-2xl font-semibold text-gray-900">{categoryName}</h1>
                    <button
                        onClick={() => window.close()}
                        className="p-2 hover:bg-gray-100 rounded-full transition"
                    >
                        <X size={24} />
                    </button>
                </div>
            </header>

            {/* Hero Banner */}
            <div className={`bg-gradient-to-r ${colors.from} ${colors.to} py-20 mb-16`}>
                <div className="max-w-6xl mx-auto px-8">
                    <h2 className="text-5xl font-bold text-white mb-4">
                        Data Stories
                    </h2>
                    <p className="text-xl text-white/90 max-w-2xl">
                        Discover trending narratives and insights from Indonesian social media
                    </p>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-6xl mx-auto px-8 pb-20">
                {events.length === 0 ? (
                    <div className="text-center py-20">
                        <p className="text-gray-600">No events found for this category</p>
                    </div>
                ) : (
                    events.map((event, eventIdx) => (
                        <div key={event.event_id} className="mb-24">
                            {/* Event Title - Only summary_highlevel */}
                            <div className="mb-12">
                                <h3
                                    className="text-2xl leading-relaxed mb-8"
                                    style={{
                                        background: `linear-gradient(to right, ${colors.accent}, ${colors.accent}80)`,
                                        WebkitBackgroundClip: 'text',
                                        backgroundClip: 'text'
                                    }}
                                >
                                    {highlightText(event.summary_highlevel)}
                                </h3>

                                {/* Hashtags */}
                                {event.top_hashtags && event.top_hashtags.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mb-8">
                                        {event.top_hashtags.slice(0, 8).map((tag, i) => (
                                            <span
                                                key={i}
                                                className={`text-sm ${colors.bg} ${colors.text} px-4 py-2 rounded-full font-medium`}
                                            >
                                                #{tag}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Video Carousel with Thumbnails */}
                            {event.sample_videos && event.sample_videos.length > 0 && (
                                <div className="mb-20">
                                    <h4 className="text-xl font-semibold text-gray-800 mb-6">Featured Videos</h4>
                                    <VideoCarousel videos={event.sample_videos} categoryId={categoryId} />
                                </div>
                            )}

                            {/* Story Segments - Direct to sentence-by-sentence with thumbnails */}
                            {event.segments && event.segments.map((segment, segIdx) => (
                                <div key={segIdx} className="mb-20">
                                    <div className="grid grid-cols-5 gap-8 items-start">
                                        {/* Text (3 columns) */}
                                        <div className="col-span-3">
                                            <p className="text-2xl font-light text-gray-800 leading-relaxed">
                                                {highlightText(segment.text)}
                                            </p>
                                        </div>

                                        {/* Video Thumbnail (2 columns) */}
                                        <div className="col-span-2">
                                            <div className="sticky top-24">
                                                {segment.video ? (
                                                    <VideoThumbnail video={segment.video} />
                                                ) : (
                                                    <div className="aspect-[9/16] rounded-xl overflow-hidden bg-gray-100 shadow-lg flex items-center justify-center text-gray-400">
                                                        <div className="text-center">
                                                            <svg className="w-16 h-16 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                            </svg>
                                                            <p className="text-sm">Video not available</p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {eventIdx < events.length - 1 && (
                                <div className="border-t border-gray-200 my-20"></div>
                            )}
                        </div>
                    ))
                )}

                {/* Footer */}
                <div className="text-center pt-16">
                    <div
                        className="inline-block text-sm font-medium px-6 py-3 rounded-full"
                        style={{
                            background: `${colors.accent}10`,
                            color: colors.accent
                        }}
                    >
                        End of story
                    </div>
                </div>
            </div>
        </div>
    );
}