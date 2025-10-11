import { useState, useEffect } from 'react';
import { Search, TrendingUp, X, Play } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {API_BASE} from "@/lib/api";


export default function TrendingNowPage({onTrendingTopicClick}) {
    const router = useRouter();
    const [trends, setTrends] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTrend, setSelectedTrend] = useState(null);
    const [detailData, setDetailData] = useState(null);
    const [selectedVideo, setSelectedVideo] = useState(null);

    // Filters
    const [timeRange, setTimeRange] = useState('recent');
    const [category, setCategory] = useState('All categories');
    const [searchQuery, setSearchQuery] = useState('');

    const categories = [
        'All categories',
        'Beauty & Skincare',
        'Fitness & Gym',
        'Sports & Athletes',
        'Automotive & Cars',
        'Health & Wellness',
        'Gaming & Tech',
        'Finance & Business',
        'Pets & Veterinary'
    ];

    useEffect(() => {
        fetchTrends();
    }, [timeRange, category]);

    const fetchTrends = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                time_range: timeRange,
                limit: '50'
            });

            if (category !== 'All categories') {
                params.append('category', category);
            }

            const response = await fetch(`${API_BASE}/api/trending/trending-now?${params}`);
            const data = await response.json();
            setTrends(data.trends || []);
        } catch (error) {
            console.error('Error fetching trends:', error);
            setTrends([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchTrendDetail = async (trendName) => {
        try {
            const params = new URLSearchParams({
                time_range: timeRange
            });

            const response = await fetch(`${API_BASE}/api/trending/trending-detail/${encodeURIComponent(trendName)}?${params}`);
            const data = await response.json();
            setDetailData(data);
        } catch (error) {
            console.error('Error fetching trend detail:', error);
        }
    };

    const handleTrendClick = (trend) => {
        setSelectedTrend(trend);
        fetchTrendDetail(trend.name);
    };

    const closeDetail = () => {
        setSelectedTrend(null);
        setDetailData(null);
    };

    const handleExploreAll = () => {
        const q = (selectedTrend?.name || '').replace(/^[#@]/, '').trim();
       onTrendingTopicClick(q)
    };

    // Filter trends by search
    const filteredTrends = trends.filter(trend => {
        if (searchQuery && !trend.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        return true;
    });

    const TrendLine = ({ data }) => {
        if (!data || data.length === 0) return null;

        const max = Math.max(...data, 1);
        const points = data.map((val, idx) => {
            const x = (idx / (data.length - 1)) * 100;
            const y = 30 - ((val / max) * 25);
            return `${x},${y}`;
        }).join(' ');

        return (
            <svg viewBox="0 0 100 30" className="w-full h-8">
                <polyline
                    points={points}
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="2"
                />
            </svg>
        );
    };

    return (
        <section className="px-6 py-8 bg-gray-50 min-h-screen">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-3xl font-normal text-gray-900 mb-2">Trending now</h1>
                    <p className="text-sm text-gray-600">Updated {new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })}</p>
                </div>

                {/* Filters - Google Trends Style */}
                <div className="bg-white rounded-lg p-4 shadow-sm mb-6 flex items-center justify-between flex-wrap gap-4">
                    <div className="flex gap-4 flex-wrap items-center">
                        <select
                            value={timeRange}
                            onChange={(e) => setTimeRange(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="recent">Recent</option>
                            <option value="all">All time</option>
                        </select>

                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            {categories.map(cat => (
                                <option key={cat} value={cat}>
                                    {cat}
                                </option>
                            ))}
                        </select>

                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search trends..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 pr-4 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
                            />
                        </div>
                    </div>
                </div>

                {/* Trending Table - Google Trends Style */}
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                    {loading ? (
                        <div className="p-12 text-center text-gray-500">
                            <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                            <p>Loading trends...</p>
                        </div>
                    ) : filteredTrends.length === 0 ? (
                        <div className="p-12 text-center text-gray-500">
                            <Search className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                            <p>No trends found</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="border-b border-gray-200">
                                <tr>
                                    <th className="text-left p-4 text-sm font-medium text-gray-700">
                                        <div className="flex items-center gap-2">
                                            <Search className="w-4 h-4" />
                                            Trends
                                        </div>
                                    </th>
                                    <th className="text-left p-4 text-sm font-medium text-gray-700">Search volume</th>
                                </tr>
                                </thead>
                                <tbody>
                                {filteredTrends.map((trend, idx) => (
                                    <tr
                                        key={idx}
                                        className={`border-b border-gray-100 hover:bg-blue-50 cursor-pointer transition ${
                                            selectedTrend?.name === trend.name ? 'bg-blue-50' : ''
                                        }`}
                                        onClick={() => handleTrendClick(trend)}
                                    >
                                        <td className="p-4">
                                            <div className="flex items-start gap-3">
                                                {/*<span className="text-xl">{getTrendIcon(trend.type)}</span>*/}
                                                <div className="flex-1">
                                                    <div className="font-medium text-gray-900 mb-1">{trend.name}</div>
                                                    <div className="flex items-center gap-2 text-sm">
                                                            <span className="flex items-center gap-1 text-green-600">
                                                                <TrendingUp className="w-3 h-3" />
                                                                Active
                                                            </span>
                                                        <span className="text-gray-500">{trend.time}</span>
                                                        {trend.related_tag && (
                                                            <>
                                                                <span className="text-blue-600 underline text-xs">{trend.related_tag}</span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-6">
                                                <div className="text-right min-w-[80px]">
                                                    <div className="font-medium text-gray-900">{trend.volume}</div>
                                                    <div className="text-sm text-green-600 font-semibold">{trend.growth}</div>
                                                </div>
                                                <div className="w-32">
                                                    <TrendLine data={trend.timeseries} />
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Detail Panel - Google Trends Style */}
            {selectedTrend && (
                <div className="fixed inset-0 bg-black/50 flex items-end justify-end z-50" onClick={closeDetail}>
                    <div
                        className="bg-white w-full max-w-2xl h-full overflow-y-auto animate-slideInRight shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between z-10">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    {/*<span className="text-3xl">{getTrendIcon(selectedTrend.type)}</span>*/}
                                    <h2 className="text-2xl font-normal text-gray-900">{selectedTrend.name}</h2>
                                </div>
                                <p className="text-sm text-gray-600">Trend breakdown</p>
                            </div>
                            <button
                                onClick={closeDetail}
                                className="p-2 hover:bg-gray-100 rounded-full transition"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6">
                            {!detailData ? (
                                <div className="text-center py-12 text-gray-500">
                                    <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                                    <p>Loading details...</p>
                                </div>
                            ) : (
                                <>
                                    {/* Quick Stats */}
                                    <div className="grid grid-cols-3 gap-4 mb-8">
                                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                                            <div className="text-2xl font-semibold text-gray-900">{detailData.total_videos}</div>
                                            <div className="text-sm text-gray-600">Videos</div>
                                        </div>
                                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                                            <div className="text-2xl font-semibold text-gray-900">
                                                {(detailData.total_views / 1000).toFixed(1)}K
                                            </div>
                                            <div className="text-sm text-gray-600">Views</div>
                                        </div>
                                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                                            <div className="text-2xl font-semibold text-gray-900">
                                                {(detailData.avg_engagement * 100).toFixed(1)}%
                                            </div>
                                            <div className="text-sm text-gray-600">Engagement</div>
                                        </div>
                                    </div>

                                    {/* Related Categories */}
                                    {Object.keys(detailData.related_categories || {}).length > 0 && (
                                        <div className="mb-8">
                                            <h3 className="text-lg font-medium text-gray-900 mb-4">Related topics</h3>
                                            <div className="space-y-2">
                                                {Object.entries(detailData.related_categories).slice(0, 5).map(([cat, count]) => (
                                                    <div key={cat} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                                        <span className="text-sm text-gray-900">{cat}</span>
                                                        <span className="text-sm font-medium text-gray-600">{count}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Top Hashtags */}
                                    {Object.keys(detailData.top_hashtags || {}).length > 0 && (
                                        <div className="mb-8">
                                            <h3 className="text-lg font-medium text-gray-900 mb-4">Related hashtags</h3>
                                            <div className="flex flex-wrap gap-2">
                                                {Object.entries(detailData.top_hashtags).slice(0, 12).map(([tag, count]) => (
                                                    <span
                                                        key={tag}
                                                        className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm hover:bg-blue-100 transition cursor-pointer"
                                                    >
                                                        #{tag} ({count})
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Top Videos */}
                                    <div>
                                        <h3 className="text-lg font-medium text-gray-900 mb-4">In the news</h3>
                                        <div className="space-y-3">
                                            {detailData.top_videos?.slice(0, 6).map((video) => (
                                                <div
                                                    key={video.id}
                                                    className="flex gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition group"
                                                    onClick={() => setSelectedVideo(video)}
                                                >
                                                    <div className="relative w-24 h-16 bg-gray-900 rounded overflow-hidden flex-shrink-0">
                                                        {video.thumbnail ? (
                                                            <Image
                                                                src={video.thumbnail}
                                                                alt={video.title}
                                                                fill
                                                                sizes="96px"
                                                                className="object-cover"
                                                            />
                                                        ) : (
                                                            <div className="flex items-center justify-center h-full text-gray-400 text-xs">
                                                                No thumb
                                                            </div>
                                                        )}
                                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                                                            <Play size={20} className="text-white" fill="white" />
                                                        </div>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-sm font-medium text-gray-900 mb-1 line-clamp-2 group-hover:text-blue-600 transition">
                                                            {video.title}
                                                        </div>
                                                        <div className="text-xs text-gray-600">
                                                            @{video.creator} {(video.views / 1000).toFixed(1)}K views
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Explore Button */}
                                    <div className="mt-8 pt-8 border-t border-gray-200">
                                        <button
                                            onClick={handleExploreAll}
                                            className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition flex items-center justify-center gap-2"
                                        >
                                            <Search className="w-5 h-5" />
                                            Explore all results
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Video Modal */}
            {selectedVideo && (
                <VideoModal video={selectedVideo} onClose={() => setSelectedVideo(null)} />
            )}
        </section>
    );
}

function VideoModal({ video, onClose }) {
    return (
        <div
            className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4 animate-fadeIn"
            onClick={onClose}
        >
            <div
                className="max-w-5xl w-full bg-white rounded-xl overflow-hidden shadow-2xl animate-scaleIn"
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
                                allow="autoplay; fullscreen"
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
                    <h2 className="text-2xl font-bold mb-2 text-gray-900">{video.title}</h2>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                        <span className="font-medium">@{video.creator}</span>
                        <span>{video.views.toLocaleString()} views</span>
                        <span>{video.likes.toLocaleString()} likes</span>
                        <span className="text-green-600 font-medium">
                            {(video.engagement_rate * 100).toFixed(2)}% engagement
                        </span>
                    </div>
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition font-medium text-gray-700 text-sm"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}