import HeroSection from '../sections/HeroSection';
import SearchInterestSection from '../sections/SearchInterestSection';
import MadeWithTrendsSection from '../sections/MadeWithTrendsSection';
import GetStartedSection from '../sections/GetStartedSection';
import NewsletterSection from '../sections/NewsletterSection';

export default function HomePage({ searchQuery, inputValue, setInputValue, handleSearch, isSearching }) {
    return (
        <>
            <HeroSection
                searchQuery={searchQuery}
                inputValue={inputValue}
                setInputValue={setInputValue}
                handleSearch={handleSearch}
                isSearching={isSearching}
            />
            <SearchInterestSection searchQuery={searchQuery} />
            <MadeWithTrendsSection />
            <GetStartedSection />
        </>
    );
}