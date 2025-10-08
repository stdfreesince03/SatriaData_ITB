import { Search, TrendingUp } from 'lucide-react';

const trendingTopics = [
    {
        title: "Head to Head Indonesia Vs Arab Saudi: Garuda Dalam Laju Tak...",
        time: "43 minutes ago",
        source: "detikSport"
    },
    {
        title: "Jelang Indonesia vs Arab Saudi, Patrick Kluivert Siap Cover B...",
        time: "1 hour ago",
        source: "Kompas.com"
    },
    {
        title: "FIFA Tolak Protes PSSI untuk Ganti Wasit Kuwaiti di Indonesia vs Saudi",
        time: "2 hours ago",
        source: "CNN Indonesia"
    }
];

export default function SearchInterestSection({ searchQuery }) {
    return (
        <section className="px-6 py-12 bg-gray-50">
            <div className="max-w-7xl mx-auto">
                <p className="text-sm text-gray-500 mb-6">Search interest...</p>

                <div className="bg-white rounded-lg p-6 shadow-sm mb-4">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg text-gray-900">
                            Why is <span className="font-medium">{searchQuery}</span> trending?
                        </h2>
                        <button className="flex items-center gap-2 text-blue-600 text-sm hover:bg-blue-50 px-4 py-2 rounded-full">
                            <Search className="w-4 h-4" />
                            Search it
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {trendingTopics.map((topic, idx) => (
                            <div key={idx} className="flex gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer">
                                <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex-shrink-0 flex items-center justify-center">
                                    <TrendingUp className="w-8 h-8 text-white" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-sm font-medium text-gray-900 mb-1 line-clamp-2">
                                        {topic.title}
                                    </h3>
                                    <p className="text-xs text-gray-500">
                                        {topic.time} • {topic.source}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}