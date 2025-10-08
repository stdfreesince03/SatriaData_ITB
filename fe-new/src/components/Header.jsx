import { Menu } from 'lucide-react';
import Image from "next/image";
import { Baloo_2 } from "next/font/google";

const baloo = Baloo_2({ subsets: ["latin"], weight: ["600","700"] });


export default function Header({ activeTab, setActiveTab }) {
    return (
        <header className="border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between max-w-7xl mx-auto">
                <div className="flex items-center gap-6">
                    <Menu className="w-6 h-6 text-gray-600 cursor-pointer" />
                    <div className="flex items-center gap-2">
                        <Image src='/gajah_itb.png' alt={"Logo Gajah ITB"}  width={32}
                               height={32}
                               className="h-14 w-auto"
                               priority/>
                        <div className={`${baloo.className} text-itb text-3xl leading-none tracking-tight`}>
                            ITB
                            Trends
                        </div>
                    </div>
                    <nav className="flex gap-8 ml-8">
                        <button
                            onClick={() => setActiveTab('home')}
                            className={`${activeTab === 'home' ? 'text-blue-600 font-medium border-b-2 border-blue-600' : 'text-gray-600 hover:text-gray-900'}  cursor-pointer transition-colors`}
                        >
                            Home
                        </button>
                        <button
                            onClick={() => setActiveTab('explore')}
                            className={`${activeTab === 'explore' ? 'text-blue-600 font-medium border-b-2 border-blue-600' : 'text-gray-600 hover:text-gray-900'}  cursor-pointer transition-colors`}
                        >
                            Explore
                        </button>
                        <button
                            onClick={() => setActiveTab('trending')}
                            className={`${activeTab === 'trending' ? 'text-blue-600 font-medium border-b-2 border-blue-600' : 'text-gray-600 hover:text-gray-900'} cursor-pointer transition-colors`}
                        >
                            Trending now
                        </button>
                    </nav>
                </div>
            </div>
        </header>
    );
}