import { useDiscoverySearch } from "../hooks/useDiscoverySearch";
import { SearchInput } from "../components/discovery/SearchInput";
import { SearchDropdown } from "../components/discovery/SearchDropdown";

function Discovery() {
  const {
    query,
    handleQueryChange,
    wrapperRef,
    showDropdown,
    setDismissed,
    products,
    categories,
    banners,
    hasResults,
    sectionOrder,
    isFetching,
    isError,
    isUninitialized,
  } = useDiscoverySearch();

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-hidden bg-[#050914]">
      {/* Gradient background */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute -left-40 -top-40 h-[600px] w-[600px] rounded-full bg-lagoon/10 blur-[140px]" />
        <div className="absolute -right-40 top-1/3 h-[500px] w-[500px] rounded-full bg-violet-600/8 blur-[120px]" />
        <div className="absolute bottom-0 left-1/2 h-[400px] w-[700px] -translate-x-1/2 rounded-full bg-indigo-900/20 blur-[100px]" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-5xl flex-1 px-6 py-10 md:px-12">
        <div ref={wrapperRef} className="relative">
          <SearchInput
            value={query}
            isFetching={isFetching}
            onChange={handleQueryChange}
            onFocus={() => setDismissed(false)}
          />
          <SearchDropdown
            show={showDropdown}
            isFetching={isFetching}
            isError={isError}
            isUninitialized={isUninitialized}
            query={query}
            hasResults={hasResults}
            sectionOrder={sectionOrder}
            products={products}
            categories={categories}
            banners={banners}
          />
        </div>
      </div>
    </div>
  );
}

export default Discovery;
