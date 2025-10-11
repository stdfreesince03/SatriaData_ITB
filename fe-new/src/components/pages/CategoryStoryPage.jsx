'use client';

import { X, ChevronLeft, ChevronRight, Play } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import {API_BASE} from "@/lib/api";


const categoryColors = {
    beauty: {
        from: "from-pink-400",
        to: "to-purple-500",
        bg: "bg-pink-50",
        text: "text-pink-600",
        accent: "rgb(236, 72, 153)",
        title: "Beauty Trends",
        subtitle: "Discover what's trending in Indonesian beauty and skincare"
    },
    fitness: {
        from: "from-orange-400",
        to: "to-red-500",
        bg: "bg-orange-50",
        text: "text-orange-600",
        accent: "rgb(249, 115, 22)",
        title: "Fitness Culture",
        subtitle: "Explore Indonesia's growing fitness community and wellness trends"
    },
    sports: {
        from: "from-blue-400",
        to: "to-teal-500",
        bg: "bg-blue-50",
        text: "text-blue-600",
        accent: "rgb(59, 130, 246)",
        title: "Sports Stories",
        subtitle: "From local heroes to athletic achievements inspiring Indonesian fans"
    },
    automotive: {
        from: "from-gray-700",
        to: "to-black",
        bg: "bg-gray-50",
        text: "text-gray-800",
        accent: "rgb(55, 65, 81)",
        title: "Car Culture",
        subtitle: "Rev up with Indonesia's automotive scene, from mods to road trips"
    },
    health: {
        from: "from-green-400",
        to: "to-teal-600",
        bg: "bg-green-50",
        text: "text-green-600",
        accent: "rgb(34, 197, 94)",
        title: "Health & Wellness",
        subtitle: "Mental health, nutrition, and lifestyle trends shaping Indonesia"
    },
    gaming: {
        from: "from-purple-500",
        to: "to-blue-700",
        bg: "bg-purple-50",
        text: "text-purple-600",
        accent: "rgb(147, 51, 234)",
        title: "Gaming & Tech",
        subtitle: "Level up with gaming trends, tech reviews, and digital culture"
    },
    finance: {
        from: "from-yellow-400",
        to: "to-orange-600",
        bg: "bg-yellow-50",
        text: "text-yellow-700",
        accent: "rgb(234, 179, 8)",
        title: "Finance & Business",
        subtitle: "Investment tips, business insights, and financial literacy"
    },
    pets: {
        from: "from-amber-300",
        to: "to-lime-500",
        bg: "bg-amber-50",
        text: "text-amber-600",
        accent: "rgb(245, 158, 11)",
        title: "Pets & Care",
        subtitle: "Pet care tips, adorable moments, and veterinary advice"
    }
};

/** ---------- Video Thumbnail (visuals unchanged) ---------- */
function VideoThumbnail({ video, onPlay }) {
    return (
        <div
            className="aspect-[9/16] rounded-xl overflow-hidden bg-gray-100 shadow-lg relative group cursor-pointer"
            onClick={() => onPlay && onPlay(video)}
        >
            {video?.thumbnail ? (
                <div className="w-full h-full relative">
                    {/* Keep <img> to preserve your original look */}
                    <Image
                        src={video.thumbnail}
                        alt={video.title}
                        fill
                        sizes="96px"
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                        <div className="bg-white/90 rounded-full p-4 group-hover:scale-110 transition-transform">
                            <svg className="w-8 h-8 text-gray-800" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z" />
                            </svg>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                    Video {video?.id ?? ''}
                </div>
            )}
        </div>
    );
}

/** ---------- Carousel (visuals unchanged; opens modal on click) ---------- */
function VideoCarousel({ videos, categoryId, onPlay }) {
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

    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;
        const update = () => {
            setCanScrollLeft(el.scrollLeft > 0);
            setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
        };
        update();
        el.addEventListener("scroll", update, { passive: true });
        return () => el.removeEventListener("scroll", update);
    }, []);

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
                            <VideoThumbnail video={video} onPlay={onPlay} />
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

/** ---------- MiniPlayer (copied from your working component) ---------- */
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
                        {video?.embed_url ? (
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
                    <h2 className="text-xl font-bold mb-2 text-gray-900">{video?.title}</h2>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                        {video?.creator && <span className="font-medium">@{video.creator}</span>}
                        {video?.views != null && (<><span>•</span><span>{Number(video.views).toLocaleString()} views</span></>)}
                        {video?.likes != null && (<><span>•</span><span>{Number(video.likes).toLocaleString()} likes</span></>)}
                        {video?.engagement_rate != null && (
                            <>
                                <span>•</span>
                                <span className="text-green-600 font-medium">
                  {(Number(video.engagement_rate) * 100).toFixed(2)}% engagement
                </span>
                            </>
                        )}
                    </div>

                    {Array.isArray(video?.hashtags) && video.hashtags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                            {video.hashtags.map((tag, i) => (
                                <span key={i} className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-medium">
                  #{tag}
                </span>
                            ))}
                        </div>
                    )}

                    <div className="flex gap-2">
                        {video?.instagram_url && (
                            <a
                                href={video.instagram_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg hover:shadow-lg transition font-semibold text-white text-sm"
                            >
                                View on Instagram
                            </a>
                        )}
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

/** ---------- Page (JS) ---------- */
export default function CategoryStoryPage() {
    const params = useParams();
    const categoryId = params?.categoryId || 'beauty';
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [categoryName, setCategoryName] = useState('');
    const [selectedVideo, setSelectedVideo] = useState(null);

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
                        {colors.title}
                    </h2>
                    <p className="text-xl text-white/90 max-w-2xl">
                        {colors.subtitle}
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
                                                className={`${colors.bg} ${colors.text} px-4 py-2 rounded-full font-medium text-sm`}
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
                                    <VideoCarousel
                                        videos={event.sample_videos}
                                        categoryId={categoryId}
                                        onPlay={(v) => setSelectedVideo(v)}
                                    />
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
                                                    <VideoThumbnail
                                                        video={segment.video}
                                                        onPlay={(v) => setSelectedVideo(v)}
                                                    />
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

            {/* Mini Player Modal */}
            {selectedVideo && (
                <MiniPlayer video={selectedVideo} onClose={() => setSelectedVideo(null)} />
            )}
        </div>
    );
}
