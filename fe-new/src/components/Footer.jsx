export default function Footer() {
    return (
        <footer className="border-t border-gray-200 px-6 py-8 bg-white">
            <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                    <span className="text-2xl">🔍</span>
                    <span className="font-medium">Google</span>
                </div>
                <div className="flex flex-wrap gap-6">
                    <a href="#" className="hover:text-gray-900">Privacy</a>
                    <a href="#" className="hover:text-gray-900">Terms</a>
                    <a href="#" className="hover:text-gray-900">Send feedback</a>
                    <a href="#" className="hover:text-gray-900">About</a>
                </div>
                <div className="flex items-center gap-6">
                    <button className="flex items-center gap-2 hover:text-gray-900">
                        <span className="text-lg">❓</span>
                        Help
                    </button>
                    <button className="flex items-center gap-2 hover:text-gray-900">
                        <span className="text-lg">🌐</span>
                        English (United States)
                    </button>
                </div>
            </div>
        </footer>
    );
}