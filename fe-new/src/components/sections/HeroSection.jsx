"use client";
import { TrendingUp, X, RefreshCw } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import {API_BASE} from "@/lib/api";

export default function HeroSection({ searchQuery, inputValue, setInputValue, handleSearch, isSearching }) {
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const [trendingChips, setTrendingChips] = useState([]);
    const [isRotating, setIsRotating] = useState(false);
    const [animatedPlaceholder, setAnimatedPlaceholder] = useState('');
    const [currentSuggestion, setCurrentSuggestion] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const suggestionsRef = useRef(null);
    const inputRef = useRef(null);

    // Fetch random trending chips on mount and rotation
    const fetchRandomTrending = async () => {
        try {
            setIsRotating(true);
            const response = await fetch(`${API_BASE}/api/search/random-suggestions?limit=5`);
            const data = await response.json();
            setTrendingChips(data.suggestions || []);
        } catch (error) {
            console.error('Failed to fetch random suggestions:', error);
        } finally {
            setTimeout(() => setIsRotating(false), 500);
        }
    };

    // Fetch suggestion for animated placeholder
    const fetchPlaceholderSuggestion = async () => {
        try {
            const response = await fetch(`${API_BASE}/api/search/random-suggestions?limit=1`);
            const data = await response.json();
            if (data.suggestions && data.suggestions.length > 0) {
                return data.suggestions[0].text.replace('#', '');
            }
        } catch (error) {
            console.error('Failed to fetch placeholder suggestion:', error);
        }
        return 'Search topics, hashtags, creators...';
    };

    // Animated typing effect for placeholder
    useEffect(() => {
        let timeoutId;

        const animatePlaceholder = async () => {
            // Only animate if input is empty
            if (inputValue) {
                setAnimatedPlaceholder('');
                return;
            }

            // Deleting phase
            if (currentSuggestion && animatedPlaceholder.length > 0 && isDeleting) {
                timeoutId = setTimeout(() => {
                    setAnimatedPlaceholder(prev => prev.slice(0, -1));
                }, 30); // Delete speed: 30ms per char
            }
            // Finished deleting, get new suggestion
            else if (isDeleting && animatedPlaceholder.length === 0) {
                setIsDeleting(false);
                const newSuggestion = await fetchPlaceholderSuggestion();
                setCurrentSuggestion(newSuggestion);
                setIsTyping(true);
            }
            // Typing phase
            else if (isTyping && animatedPlaceholder.length < currentSuggestion.length) {
                timeoutId = setTimeout(() => {
                    setAnimatedPlaceholder(currentSuggestion.slice(0, animatedPlaceholder.length + 1));
                }, 80); // Type speed: 80ms per char
            }
            // Finished typing, wait then start deleting
            else if (isTyping && animatedPlaceholder.length === currentSuggestion.length) {
                setIsTyping(false);
                timeoutId = setTimeout(() => {
                    setIsDeleting(true);
                }, 3000); // Wait 3 seconds before deleting
            }
            // Initial state - start typing
            else if (!isDeleting && !isTyping && !currentSuggestion) {
                const initialSuggestion = await fetchPlaceholderSuggestion();
                setCurrentSuggestion(initialSuggestion);
                setIsTyping(true);
            }
        };

        animatePlaceholder();

        return () => clearTimeout(timeoutId);
    }, [animatedPlaceholder, currentSuggestion, isDeleting, isTyping, inputValue]);

    // Load initial trending chips
    useEffect(() => {
        fetchRandomTrending();

        // Auto-rotate every 15 seconds
        const interval = setInterval(fetchRandomTrending, 15000);
        return () => clearInterval(interval);
    }, []);

    // Fetch suggestions from API when typing
    useEffect(() => {
        const fetchSuggestions = async () => {
            if (inputValue.length < 2) {
                setSuggestions([]);
                return;
            }

            try {
                const response = await fetch(
                    `${API_BASE}/api/search/suggestions?q=${encodeURIComponent(inputValue)}&limit=8`
                );
                const data = await response.json();
                setSuggestions(data.suggestions || []);
            } catch (error) {
                console.error('Failed to fetch suggestions:', error);
                setSuggestions([]);
            }
        };

        const debounce = setTimeout(fetchSuggestions, 200);
        return () => clearTimeout(debounce);
    }, [inputValue]);

    // Handle keyboard navigation
    const handleKeyDown = (e) => {
        if (!showSuggestions || suggestions.length === 0) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev =>
                prev < suggestions.length - 1 ? prev + 1 : prev
            );
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (selectedIndex >= 0) {
                selectSuggestion(suggestions[selectedIndex]);
            } else {
                handleSearch(e);
                setShowSuggestions(false);
            }
        } else if (e.key === 'Escape') {
            setShowSuggestions(false);
            setSelectedIndex(-1);
        }
    };

    const selectSuggestion = (suggestion) => {
        setInputValue(suggestion.text);
        setShowSuggestions(false);
        setSelectedIndex(-1);
        const fakeEvent = { preventDefault: () => {} };
        handleSearch(fakeEvent);
    };

    // Close suggestions when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (suggestionsRef.current && !suggestionsRef.current.contains(e.target)) {
                setShowSuggestions(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const getIconForType = (type) => {
        switch(type) {
            default: return '';
        }
    };

    return (
        <section className="relative bg-gradient-to-br from-red-50 via-pink-50 to-blue-50 px-6 py-16 overflow-hidden">
            <div className="max-w-7xl mx-auto relative z-10">
                <div className="max-w-xl">
                    <h1 className="text-4xl font-normal text-gray-900 mb-2">
                        Explore what <span className="font-medium">Satria Data 2025</span>
                    </h1>
                    <h1 className="text-4xl font-normal text-gray-900 mb-6">
                        is looking for right now
                    </h1>
                </div>

                <div className="flex items-center gap-4 mt-8">
                    <form onSubmit={handleSearch} className="flex items-center gap-4 relative flex-1 max-w-2xl">
                        <div className="relative flex-1" ref={suggestionsRef}>
                            <div className="bg-white rounded-full px-6 py-3 shadow-sm flex items-center gap-3">
                                <TrendingUp className="w-5 h-5 text-red-500" />
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={inputValue}
                                    onChange={(e) => {
                                        setInputValue(e.target.value);
                                        setShowSuggestions(true);
                                        setSelectedIndex(-1);
                                    }}
                                    onFocus={() => setShowSuggestions(true)}
                                    onKeyDown={handleKeyDown}
                                    placeholder={animatedPlaceholder + (isTyping ? '|' : '')}
                                    className="flex-1 outline-none text-gray-700 bg-transparent placeholder:text-gray-400"
                                />
                                {inputValue && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setInputValue('');
                                            setSuggestions([]);
                                            inputRef.current?.focus();
                                        }}
                                        className="p-1 hover:bg-gray-100 rounded-full"
                                    >
                                        <X className="w-4 h-4 text-gray-400" />
                                    </button>
                                )}
                            </div>

                            {/* Suggestions Dropdown */}
                            {showSuggestions && suggestions.length > 0 && (
                                <div className="absolute top-full mt-2 w-full bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden z-50">
                                    {suggestions.map((suggestion, idx) => (
                                        <button
                                            key={idx}
                                            type="button"
                                            onClick={() => selectSuggestion(suggestion)}
                                            onMouseEnter={() => setSelectedIndex(idx)}
                                            className={`w-full px-6 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left ${
                                                selectedIndex === idx ? 'bg-gray-50' : ''
                                            }`}
                                        >
                                            <span className="text-xl">{getIconForType(suggestion.type)}</span>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm font-medium text-gray-900 truncate">
                                                    {suggestion.text}
                                                </div>
                                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                                    <span className="capitalize">{suggestion.type.replace('_', ' ')}</span>
                                                    {suggestion.engagement && (
                                                        <span>• {suggestion.engagement}% engagement</span>
                                                    )}
                                                    {suggestion.video_count && (
                                                        <span>• {suggestion.video_count} videos</span>
                                                    )}
                                                </div>
                                            </div>
                                            <TrendingUp className="w-4 h-4 text-gray-400" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={isSearching}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full font-medium disabled:opacity-50 transition-all whitespace-nowrap"
                        >
                            {isSearching ? 'Searching...' : 'Explore'}
                        </button>
                    </form>
                </div>

                {/* Random rotating suggestions */}
                <div className="mt-6 flex items-center gap-2 flex-wrap">
                    <span className="text-sm text-gray-600">Try searching:</span>
                    <div className={`flex items-center gap-2 flex-wrap transition-opacity duration-300 ${isRotating ? 'opacity-50' : 'opacity-100'}`}>
                        {trendingChips.map((chip, idx) => (
                            <button
                                key={`${chip.text}-${idx}`}
                                onClick={() => {
                                    setInputValue(chip.text.replace(/^#/, ''));
                                    const fakeEvent = { preventDefault: () => {} };
                                    handleSearch(fakeEvent);
                                }}
                                className="px-4 py-1.5 bg-white/80 hover:bg-white rounded-full text-sm text-gray-700 hover:text-gray-900 transition-colors shadow-sm flex items-center gap-1.5"
                            >
                                <span>{chip.text}</span>
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={fetchRandomTrending}
                        className="p-1.5 hover:bg-white/80 rounded-full transition-colors"
                        title="Get new suggestions"
                    >
                        <RefreshCw className={`w-4 h-4 text-gray-600 ${isRotating ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            <svg className="absolute top-0 right-0 w-1/2 h-full" viewBox="0 0 400 200" preserveAspectRatio="none">
                <path d="M0,150 Q100,140 200,80 T400,60" fill="rgba(239,68,68,0.15)" stroke="rgba(239,68,68,0.3)" strokeWidth="2"/>
                <path d="M0,160 Q100,150 200,100 T400,90" fill="rgba(59,130,246,0.1)" stroke="none"/>
            </svg>
        </section>
    );
}