import { ChevronRight } from 'lucide-react';

const madeWithTrends = [
    {
        title: "Trends TV",
        description: "What is Trending right now on Google around the world. See it visualised with our new screensaver.",
        color: "bg-gradient-to-br from-green-500 via-yellow-500 to-blue-500",
        pattern: "geometric"
    },
    {
        title: "Visualizing Google Trends data",
        description: "Welcome to our data visualization project, where the Trends Data Team works with the best designers around the world to tell stories with data - and make the results open source.",
        color: "bg-gradient-to-br from-red-400 to-red-500",
        pattern: "grid"
    },
    {
        title: "Trends Gallery",
        description: "See what's trending in different regions and categories.",
        color: "bg-gradient-to-br from-gray-300 to-gray-400",
        pattern: "dots"
    }
];

export default function MadeWithTrendsSection() {
    return (
        <section className="px-6 py-16 bg-white">
            <div className="max-w-7xl mx-auto">
                <h2 className="text-3xl font-normal text-gray-900 text-center mb-3">Made with Trends</h2>
                <p className="text-gray-600 text-center mb-12">
                    See how Google Trends is being used across the world, by newsrooms, charities, and more
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {madeWithTrends.map((item, idx) => (
                        <div key={idx} className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                            <div className={`h-48 ${item.color} relative`}>
                                {item.pattern === 'geometric' && (
                                    <div className="absolute inset-0 opacity-40">
                                        {[...Array(12)].map((_, i) => (
                                            <div
                                                key={i}
                                                className="absolute bg-white"
                                                style={{
                                                    width: '25%',
                                                    height: '25%',
                                                    left: `${(i % 4) * 25}%`,
                                                    top: `${Math.floor(i / 4) * 33.33}%`
                                                }}
                                            />
                                        ))}
                                    </div>
                                )}
                                {item.pattern === 'grid' && (
                                    <div className="absolute inset-0" style={{
                                        backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
                                        backgroundSize: '30px 30px'
                                    }} />
                                )}
                            </div>
                            <div className="p-6">
                                <h3 className="text-xl font-medium text-gray-900 mb-3">{item.title}</h3>
                                <p className="text-sm text-gray-600 mb-4 line-clamp-3">{item.description}</p>
                                <button className="flex items-center gap-2 text-blue-600 text-sm font-medium hover:gap-3 transition-all">
                                    <ChevronRight className="w-4 h-4" />
                                    Visit
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}