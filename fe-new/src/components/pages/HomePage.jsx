import HeroSection from '../sections/HeroSection';
import SearchInterestSection from '../sections/SearchInterestSection';
import MadeWithTrendsSection from '../sections/MadeWithTrendsSection';
import GetStartedSection from '../sections/GetStartedSection';
import NewsletterSection from '../sections/NewsletterSection';
import CategoryStoriesSection from "@/components/sections/CategoryStoriesSection";
import InsightsCarouselSection from '../sections/InsightsCarouselSection';

export default function HomePage({
                                     searchQuery,
                                     inputValue,
                                     setInputValue,
                                     handleSearch,
                                     isSearching,
                                     onTrendingTopicClick
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
            <SearchInterestSection
                onSearchClick={onTrendingTopicClick}
            />
            <InsightsCarouselSection />
            <CategoryStoriesSection/>
            {/*<MadeWithTrendsSection />*/}
            {/*<GetStartedSection />*/}
        </>
    );
}