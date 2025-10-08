import { Download, ChevronLeft, ChevronRight, TrendingUp } from 'lucide-react';

const trendingNowData = [
    { name: "meyden", volume: "1K+", growth: "+200%", time: "6 hours ago", tag: "" },
    { name: "cultural leonesa", volume: "2K+", growth: "+200%", time: "17 hours ago", tag: "albacete" },
    { name: "harga iphone 17 pro max", volume: "2K+", growth: "+300%", time: "14 hours ago", tag: "apple iphone 17 pro max" },
    { name: "kenny austin", volume: "500+", growth: "+100%", time: "3 hours ago", tag: "" },
    { name: "cuan", volume: "500+", growth: "+200%", time: "3 hours ago", tag: "prajego pangestu" },
    { name: "leny yoro", volume: "500+", growth: "+100%", time: "7 hours ago", tag: "" },
    { name: "tka 2025", volume: "2K+", growth: "+100%", time: "5 hours ago", tag: "simulasi tka" }
];

export default function TrendingNowPage({
                                            trendingCountry,
                                            setTrendingCountry,
                                            trendingTime,
                                            setTrendingTime,
                                            trendingCategory,
                                            setTrendingCategory,
                                            rowsPerPage,
                                            setRowsPerPage
                                        }) {
    return (
        <section className="px-6 py-8 bg-gray-50 min-h-screen">
            <div className="max-w-7xl mx-auto">
                {/* Filters */}
                <div className="bg-white rounded-lg p-4 shadow-sm mb-6 flex items-center justify-between flex-wrap gap-4">
                    <div className="flex gap-4 flex-wrap">
                        <select
                            value={trendingCountry}
                            onChange={(e) => setTrendingCountry(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option>🌍 Indonesia</option>
                            <option>🌍 United States</option>
                            <option>🌍 Global</option>
                        </select>

                        <select
                            value={trendingTime}
                            onChange={(e) => setTrendingTime(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option>📅 Past 24 hours</option>
                            <option>📅 Past 7 days</option>
                            <option>📅 Past 30 days</option>
                        </select>

                        <select
                            value={trendingCategory}
                            onChange={(e) => setTrendingCategory(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option>🎯 All categories</option>
                            <option>🎯 Business</option>
                            <option>🎯 Entertainment</option>
                            <option>🎯 Sports</option>
                        </select>

                        <button className="px-4 py-2 border border-gray-300 rounded-full text-sm hover:bg-gray-50">
                            # All trends
                        </button>

                        <button className="px-4 py-2 border border-gray-300 rounded-full text-sm hover:bg-gray-50">
                            ⚡ By relevance
                        </button>
                    </div>

                    <button className="px-4 py-2 bg-blue-50 text-blue-600 rounded-full text-sm font-medium hover:bg-blue-100 flex items-center gap-2">
                        <Download className="w-4 h-4" />
                        Export
                    </button>
                </div>

                {/* Trending Table */}
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <tbody>
                            {trendingNowData.map((item, idx) => (
                                <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                                    <td className="p-4">
                                        <input type="checkbox" className="w-4 h-4" />
                                    </td>
                                    <td className="p-4">
                                        <div className="font-medium text-gray-900">{item.name}</div>
                                    </td>
                                    <td className="p-4 text-gray-600">
                                        <div>{item.volume}</div>
                                        <div className="text-sm text-green-600">{item.growth}</div>
                                    </td>
                                    <td className="p-4 text-gray-600">
                                        <div>{item.time}</div>
                                        <div className="text-sm text-green-600 flex items-center gap-1">
                                            <TrendingUp className="w-3 h-3" />
                                            Active
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        {item.tag && (
                                            <span className="text-sm text-gray-600 underline">{item.tag}</span>
                                        )}
                                    </td>
                                    <td className="p-4 w-48">
                                        <svg viewBox="0 0 100 30" className="w-full h-12">
                                            <polyline
                                                points={`0,${Math.random() * 20 + 5} 20,${Math.random() * 20 + 5} 40,${Math.random() * 20 + 5} 60,${Math.random() * 10 + 2} 80,${Math.random() * 5 + 1} 100,0`}
                                                fill="none"
                                                stroke="#10b981"
                                                strokeWidth="2"
                                            />
                                        </svg>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="p-4 border-t border-gray-200 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">Rows per page</span>
                            <select
                                value={rowsPerPage}
                                onChange={(e) => setRowsPerPage(Number(e.target.value))}
                                className="px-2 py-1 border border-gray-300 rounded text-sm"
                            >
                                <option>25</option>
                                <option>50</option>
                                <option>100</option>
                            </select>
                        </div>

                        <div className="flex items-center gap-4">
                            <span className="text-sm text-gray-600">1-25 of 96</span>
                            <div className="flex gap-1">
                                <button className="p-2 hover:bg-gray-100 rounded disabled:opacity-50" disabled>
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <button className="p-2 hover:bg-gray-100 rounded disabled:opacity-50" disabled>
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <button className="p-2 hover:bg-gray-100 rounded">
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                                <button className="p-2 hover:bg-gray-100 rounded">
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}