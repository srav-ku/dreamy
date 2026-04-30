import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useSearch } from "@/lib/api";
import { Layout } from "@/components/layout";
import { getProfileImageUrl, getInitials } from "@/lib/cloudinary";
import { motion } from "framer-motion";

export function Search() {
  const [location, setLocation] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const initialQ = searchParams.get("q") || "";
  
  const [search, setSearch] = useState(initialQ);
  const [debouncedSearch, setDebouncedSearch] = useState(initialQ);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      if (search.trim() !== initialQ) {
        setLocation(`/search?q=${encodeURIComponent(search.trim())}`, { replace: true });
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [search, setLocation, initialQ]);

  const { data: persons, isLoading, isError } = useSearch(debouncedSearch);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      setLocation(`/search?q=${encodeURIComponent(search.trim())}`);
    }
  };

  return (
    <Layout title="Search">
      <div className="sticky top-0 z-10 bg-black/80 backdrop-blur-md px-4 py-2 border-b border-[#2f3336]">
        <form onSubmit={handleSearchSubmit} className="relative">
          <svg viewBox="0 0 24 24" aria-hidden="true" className="w-4 h-4 fill-[#71767b] absolute left-4 top-1/2 -translate-y-1/2"><g><path d="M10.25 3.75c-3.59 0-6.5 2.91-6.5 6.5s2.91 6.5 6.5 6.5c1.795 0 3.419-.726 4.596-1.904 1.178-1.177 1.904-2.801 1.904-4.596 0-3.59-2.91-6.5-6.5-6.5zm-8.5 6.5c0-4.694 3.806-8.5 8.5-8.5s8.5 3.806 8.5 8.5c0 1.986-.682 3.815-1.824 5.262l4.781 4.781-1.414 1.414-4.781-4.781c-1.447 1.142-3.276 1.824-5.262 1.824-4.694 0-8.5-3.806-8.5-8.5z"></path></g></svg>
          <input
            type="text"
            placeholder="Search people"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
            className="w-full bg-[#202327] text-[#e7e9ea] border border-transparent focus:bg-black focus:border-[#1d9bf0] rounded-full py-3 pl-12 pr-4 outline-none transition-colors placeholder:text-[#71767b]"
          />
        </form>
      </div>

      {debouncedSearch.trim() === "" ? (
        <div className="p-8 text-center text-[#71767b]">
          Enter a name to search for people.
        </div>
      ) : isLoading ? (
        <div className="p-4 space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex gap-4 animate-pulse">
              <div className="w-12 h-12 rounded-full bg-[#2f3336]"></div>
              <div className="flex-1 space-y-2 py-1">
                <div className="h-4 bg-[#2f3336] rounded w-1/4"></div>
                <div className="h-3 bg-[#2f3336] rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="p-8 text-center text-[#71767b]">
          Search failed. Please try again.
        </div>
      ) : persons?.length === 0 ? (
        <div className="p-8 text-center">
          <div className="text-xl font-bold text-[#e7e9ea] mb-2">No results for "{debouncedSearch}"</div>
          <div className="text-[#71767b]">Try searching for something else.</div>
        </div>
      ) : (
        <div className="flex flex-col">
          {persons?.map((person, i) => (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              key={person.id}
            >
              <Link href={`/p/${person.slug}`} className="flex gap-4 p-4 border-b border-[#2f3336] hover:bg-[#080808] transition-colors cursor-pointer">
                {person.profile_image ? (
                  <img src={getProfileImageUrl(person.profile_image)!} alt={person.name} className="w-12 h-12 rounded-full object-cover bg-[#2f3336]" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-[#2f3336] flex items-center justify-center text-[#e7e9ea] font-bold">
                    {getInitials(person.name)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h2 className="font-bold text-[#e7e9ea] truncate">{person.name}</h2>
                  {person.bio && <p className="text-[#71767b] text-sm mt-1 line-clamp-2">{person.bio}</p>}
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </Layout>
  );
}
