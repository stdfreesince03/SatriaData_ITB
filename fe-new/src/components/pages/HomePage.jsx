import HeroSection from "../sections/HeroSection";
import SearchInterestSection from "../sections/SearchInterestSection";
import CategoryStoriesSection from "@/components/sections/CategoryStoriesSection";
import InsightsCarouselSection from "../sections/InsightsCarouselSection";

export default function HomePage({
                                     searchQuery,
                                     inputValue,
                                     setInputValue,
                                     handleSearch,
                                     isSearching,
                                     onTrendingTopicClick,
                                     onOpenInsights,       // <-- passed from App.jsx
                                 }) {
    return (
        <>
            <HeroSection
                searchQuery={searchQuery}
                inputValue={inputValue}
                setInputValue={setInputValue}
                handleSearch={handleSearch}
                isSearching={isSearching}
            />

            <SearchInterestSection onSearchClick={onTrendingTopicClick} />

            {/* Insights carousel lives here */}
            <InsightsCarouselSection onOpen={onOpenInsights} />

            <CategoryStoriesSection />
        </>
    );
}
