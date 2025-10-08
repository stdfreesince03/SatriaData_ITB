export default function NewsletterSection() {
    return (
        <section className="px-6 py-16 bg-white">
            <div className="max-w-2xl mx-auto text-center">
                <h2 className="text-3xl font-normal text-gray-900 mb-3">Daily Trends newsletter</h2>
                <p className="text-gray-600 mb-8">
                    Get updates on what's trending delivered to your mailbox (English only)
                </p>

                <div className="flex gap-4 max-w-md mx-auto">
                    <input
                        type="email"
                        placeholder="wynaiariskartika04@gmail.com"
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium">
                        Sign Up
                    </button>
                </div>

                <p className="text-xs text-gray-500 mt-4">
                    Your information will be used in accordance with Google's privacy policy.
                    You can unsubscribe at any time.
                </p>
            </div>
        </section>
    );
}