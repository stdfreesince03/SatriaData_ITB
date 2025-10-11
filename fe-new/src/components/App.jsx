"use client";
import React, { useState } from "react";
import Header from "./Header";
import Footer from "./Footer";
import HomePage from "./pages/HomePage";
import ExplorePage from "./pages/ExplorePage";
import TrendingNowPage from "./pages/TrendingNowPage";
import InsightsPage from "./pages/InsightsPage"; // <-- you said you added this

export default function GoogleTrendsApp() {
    // Tabs: 'home' | 'explore' | 'trending' | 'insights'
    const [activeTab, setActiveTab] = useState("home");

    // Home
    const [searchQuery, setSearchQuery] = useState("indonesia vs arab saudi");
    const [inputValue, setInputValue] = useState("");
    const [isSearching, setIsSearching] = useState(false);

    // Explore
    const [exploreQuery, setExploreQuery] = useState("");

    // Trending Now
    const [trendingCountry, setTrendingCountry] = useState("Indonesia");
    const [trendingTime, setTrendingTime] = useState("Past 24 hours");
    const [trendingCategory, setTrendingCategory] = useState("All categories");
    const [rowsPerPage, setRowsPerPage] = useState(25);

    // Insights
    const [insightSlug, setInsightSlug] = useState(null);

    const handleSearch = (e) => {
        e.preventDefault();
        if (!inputValue.trim()) return;
        setIsSearching(true);
        setSearchQuery(inputValue);
        setExploreQuery(inputValue);
        setActiveTab("explore");
        setTimeout(() => setIsSearching(false), 300);
    };

    const handleTrendingTopicClick = (query) => {
        setInputValue(query);
        setSearchQuery(query);
        setExploreQuery(query);
        setActiveTab("explore");
    };

    const openInsights = (slug) => {
        setInsightSlug(slug || null);
        setActiveTab("insights");
    };

    return (
        <div className="min-h-screen bg-white">
            <Header activeTab={activeTab} setActiveTab={setActiveTab} />

            {activeTab === "home" && (
                <HomePage
                    searchQuery={searchQuery}
                    inputValue={inputValue}
                    setInputValue={setInputValue}
                    handleSearch={handleSearch}
                    isSearching={isSearching}
                    onTrendingTopicClick={handleTrendingTopicClick}
                    onOpenInsights={openInsights}         // <-- wire to carousel
                />
            )}

            {activeTab === "explore" && (
                <ExplorePage initialQuery={exploreQuery} onQueryChange={setExploreQuery} />
            )}

            {activeTab === "trending" && (
                <TrendingNowPage
                    trendingCountry={trendingCountry}
                    setTrendingCountry={setTrendingCountry}
                    trendingTime={trendingTime}
                    setTrendingTime={setTrendingTime}
                    trendingCategory={trendingCategory}
                    setTrendingCategory={setTrendingCategory}
                    rowsPerPage={rowsPerPage}
                    setRowsPerPage={setRowsPerPage}
                    onTrendingTopicClick={handleTrendingTopicClick}
                />
            )}

            {activeTab === "insights" && (
                <InsightsPage initialSlug={insightSlug} />   // optional: use slug to preselect
            )}

            <Footer />
        </div>
    );
}
