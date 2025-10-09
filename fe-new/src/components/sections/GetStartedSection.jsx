import { Play } from 'lucide-react';

const tutorials = [
    { title: "Intro to Google Trends data", color: "bg-yellow-600" },
    { title: "Google Trends walkthrough", color: "bg-gray-400" },
    { title: "Google Trends advanced tips", color: "bg-blue-500" },
    { title: "Trending Now", color: "bg-green-600" }
];

export default function GetStartedSection() {
    return (
        <section className="px-6 py-16 bg-gradient-to-b from-blue-50 to-white">
            <div className="max-w-7xl mx-auto">
                <h2 className="text-3xl font-normal text-gray-900 text-center mb-3">Get started with Trends</h2>
                <p className="text-gray-600 text-center mb-12">
                    New to Trends? Browse these resources to learn what it can do and how to use it.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
                    {tutorials.map((tutorial, idx) => (
                        <div key={idx} className={`${tutorial.color} rounded-xl p-6 text-white relative overflow-hidden group cursor-pointer hover:scale-105 transition-transform`}>
                            <div className="relative z-10">
                                <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center mb-4">
                                    <Play className="w-6 h-6" />
                                </div>
                                <h3 className="text-lg font-medium">{tutorial.title}</h3>
                            </div>
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white bg-opacity-10 rounded-full -mr-16 -mt-16" />
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}