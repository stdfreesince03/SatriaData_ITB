import { ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import {API_BASE} from "@/lib/api";


const categoryConfig = [
    {
        id: 'beauty',
        title: "Beauty & Skincare Trends",
        color: "bg-gradient-to-br from-pink-400 via-rose-400 to-purple-500",
        pattern: "geometric"
    },
    {
        id: 'fitness',
        title: "Fitness & Gym Culture",
        color: "bg-gradient-to-br from-orange-400 via-red-500 to-pink-500",
        pattern: "grid"
    },
    {
        id: 'sports',
        title: "Sports & Athletes",
        color: "bg-gradient-to-br from-blue-400 via-cyan-500 to-teal-500",
        pattern: "waves"
    },
    {
        id: 'automotive',
        title: "Automotive & Cars",
        color: "bg-gradient-to-br from-gray-700 via-gray-800 to-black",
        pattern: "diagonal"
    },
    {
        id: 'health',
        title: "Health & Wellness",
        color: "bg-gradient-to-br from-green-400 via-emerald-500 to-teal-600",
        pattern: "dots"
    },
    {
        id: 'gaming',
        title: "Gaming & Tech",
        color: "bg-gradient-to-br from-purple-500 via-indigo-600 to-blue-700",
        pattern: "circuit"
    },
    {
        id: 'finance',
        title: "Finance & Business",
        color: "bg-gradient-to-br from-yellow-400 via-amber-500 to-orange-600",
        pattern: "geometric"
    },
    {
        id: 'pets',
        title: "Pets & Veterinary",
        color: "bg-gradient-to-br from-amber-300 via-yellow-400 to-lime-500",
        pattern: "paws"
    }
];

export default function CategoryStoriesSection() {
    const [categoryData, setCategoryData] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch first event for each category to get summary_highlevel
        async function fetchCategoryData() {
            const data = {};

            for (const cat of categoryConfig) {
                try {
                    const response = await fetch(`${API_BASE}/api/events/by-category/${cat.id}`);
                    const result = await response.json();

                    if (result.events && result.events.length > 0) {
                        // Get first event's summary_highlevel
                        data[cat.id] = result.events[0].summary_highlevel;
                    }
                } catch (error) {
                    console.error(`Failed to load ${cat.id}:`, error);
                }
            }

            setCategoryData(data);
            setLoading(false);
        }

        fetchCategoryData();
    }, []);

    const openStory = (category) => {
        const url = `/story/${category.id}`;
        window.open(url, '_blank');
    };

    const truncateText = (text, maxLength = 120) => {
        if (!text || text.length <= maxLength) return text;
        return text.slice(0, maxLength).trim() + '...';
    };

    return (
        <section className="px-6 py-16 bg-white">
            <div className="max-w-7xl mx-auto">
                <h2 className="text-3xl font-normal text-gray-900 text-center mb-3">Explore by Category</h2>
                <p className="text-gray-600 text-center mb-12">
                    Dive deep into each category to discover trending videos, insights, and data stories
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {categoryConfig.map((story) => (
                        <button
                            key={story.id}
                            onClick={() => openStory(story)}
                            className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 hover:scale-105 text-left group"
                        >
                            <div className={`h-48 ${story.color} relative overflow-hidden`}>
                                {story.pattern === 'geometric' && (
                                    <div className="absolute inset-0 opacity-20">
                                        {[...Array(16)].map((_, i) => (
                                            <div
                                                key={i}
                                                className="absolute bg-white rounded-lg"
                                                style={{
                                                    width: '20%',
                                                    height: '20%',
                                                    left: `${(i % 4) * 25}%`,
                                                    top: `${Math.floor(i / 4) * 25}%`,
                                                    transform: `rotate(${i * 15}deg)`
                                                }}
                                            />
                                        ))}
                                    </div>
                                )}
                                {story.pattern === 'grid' && (
                                    <div className="absolute inset-0" style={{
                                        backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
                                        backgroundSize: '30px 30px'
                                    }} />
                                )}
                                {story.pattern === 'dots' && (
                                    <div className="absolute inset-0" style={{
                                        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.2) 2px, transparent 2px)',
                                        backgroundSize: '20px 20px'
                                    }} />
                                )}
                                {story.pattern === 'waves' && (
                                    <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 100 100" preserveAspectRatio="none">
                                        <path d="M0,50 Q25,30 50,50 T100,50 L100,100 L0,100 Z" fill="white" />
                                        <path d="M0,60 Q25,40 50,60 T100,60 L100,100 L0,100 Z" fill="white" opacity="0.5" />
                                    </svg>
                                )}
                                {story.pattern === 'diagonal' && (
                                    <div className="absolute inset-0" style={{
                                        backgroundImage: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.1) 0px, rgba(255,255,255,0.1) 10px, transparent 10px, transparent 20px)'
                                    }} />
                                )}
                                {story.pattern === 'circuit' && (
                                    <div className="absolute inset-0 opacity-20">
                                        <svg width="100%" height="100%">
                                            <circle cx="20%" cy="30%" r="3" fill="white" />
                                            <circle cx="80%" cy="70%" r="3" fill="white" />
                                            <circle cx="50%" cy="50%" r="4" fill="white" />
                                            <line x1="20%" y1="30%" x2="50%" y2="50%" stroke="white" strokeWidth="1" />
                                            <line x1="50%" y1="50%" x2="80%" y2="70%" stroke="white" strokeWidth="1" />
                                        </svg>
                                    </div>
                                )}
                                {story.pattern === 'paws' && (
                                    <div className="absolute inset-0 opacity-30">
                                        {[...Array(8)].map((_, i) => (
                                            <div
                                                key={i}
                                                className="absolute text-white text-4xl"
                                                style={{
                                                    left: `${(i % 4) * 25 + 10}%`,
                                                    top: `${Math.floor(i / 4) * 40 + 15}%`,
                                                    transform: `rotate(${i * 30}deg)`
                                                }}
                                            >
                                                🐾
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="absolute bottom-4 right-4 bg-white/20 backdrop-blur-sm rounded-full p-2 group-hover:bg-white/40 transition-colors">
                                    <ChevronRight className="w-5 h-5 text-white" />
                                </div>
                            </div>
                            <div className="p-6">
                                <h3 className="text-xl font-medium text-gray-900 mb-3">{story.title}</h3>
                                {loading ? (
                                    <div className="h-16 bg-gray-100 animate-pulse rounded"></div>
                                ) : (
                                    <p className="text-sm text-gray-600 line-clamp-3">
                                        {categoryData[story.id]
                                            ? truncateText(categoryData[story.id], 120)
                                            : 'Discover trending content and insights in this category'
                                        }
                                    </p>
                                )}
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </section>
    );
}