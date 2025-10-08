"use client";
import React, { useState } from 'react';
import Header from './Header';
import Footer from './Footer';
import HomePage from './pages/HomePage';
import ExplorePage from './pages/ExplorePage';
import TrendingNowPage from './pages/TrendingNowPage';

export default function GoogleTrendsApp() {
    // Tab state
    const [activeTab, setActiveTab] = useState('home');

    // Home page state
    const [searchQuery, setSearchQuery] = useState('indonesia vs arab saudi');
    const [inputValue, setInputValue] = useState('');
    const [isSearching, setIsSearching] = useState(false);

    // Explore page - search query passed from Home
    const [exploreQuery, setExploreQuery] = useState('');

    // Explore page state (original)
    const [country, setCountry] = useState('Indonesia');
    const [timeRange, setTimeRange] = useState('Past 12 months');
    const [category, setCategory] = useState('All categories');
    const [searchType, setSearchType] = useState('Web Search');

    // Trending Now state
    const [trendingCountry, setTrendingCountry] = useState('Indonesia');
    const [trendingTime, setTrendingTime] = useState('Past 24 hours');
    const [trendingCategory, setTrendingCategory] = useState('All categories');
    const [rowsPerPage, setRowsPerPage] = useState(25);

    // Handle search from Home page - transitions to Explore
    const handleSearch = (e) => {
        e.preventDefault();
        if (inputValue.trim()) {
            setIsSearching(true);
            setSearchQuery(inputValue);

            // Switch to explore tab and pass the query
            setExploreQuery(inputValue);
            setActiveTab('explore');

            setTimeout(() => setIsSearching(false), 500);
        }
    };

    return (
        <div className="min-h-screen bg-white">
            <Header activeTab={activeTab} setActiveTab={setActiveTab} />

            {activeTab === 'home' && (
                <HomePage
                    searchQuery={searchQuery}
                    inputValue={inputValue}
                    setInputValue={setInputValue}
                    handleSearch={handleSearch}
                    isSearching={isSearching}
                />
            )}

            {activeTab === 'explore' && (
                <ExplorePage
                    initialQuery={exploreQuery}
                    onQueryChange={setExploreQuery}
                />
            )}

            {activeTab === 'trending' && (
                <TrendingNowPage
                    trendingCountry={trendingCountry}
                    setTrendingCountry={setTrendingCountry}
                    trendingTime={trendingTime}
                    setTrendingTime={setTrendingTime}
                    trendingCategory={trendingCategory}
                    setTrendingCategory={setTrendingCategory}
                    rowsPerPage={rowsPerPage}
                    setRowsPerPage={setRowsPerPage}
                />
            )}

            <Footer />
        </div>
    );
}