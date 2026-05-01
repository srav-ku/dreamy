import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useSearch } from "@/lib/api";
import { Layout } from "@/components/layout";
import { getProfileImageUrl, getInitials, getAlbumCoverUrl } from "@/lib/cloudinary";
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

  const { data, isLoading, isError } = useSearch(debouncedSearch);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      setLocation(`/search?q=${encodeURIComponent(search.trim())}`);
    }
  };

  const hasResults = (data?.persons?.length ?? 0) > 0 || (data?.albums?.length ?? 0) > 0;

  return (
    <Layout title="Search">
      <div className="sticky top-0 z-10 bg-black/80 backdrop-blur-md px-4 py-2 border-b border-[#2f3336]">
        <form onSubmit={handleSearchSubmit} className="relative">
          <svg viewBox="0 0 24 24" aria-hidden="true" className="w-4 h-4 fill-[#71767b] absolute left-4 top-1/2 -translate-y-1/2"><g><path d="M10.25 3.75c-3.59 0-6.5 2.91-6.5 6.5s2.91 6.5 6.5 6.5c1.795 0 3.419-.726 4.596-1.904 1.178-1.177 1.904-2.801 1.904-4.596 0-3.59-2.91-6.5-6.5-6.5zm-8.5 6.5c0-4.694 3.806-8.5 8.5-8.5s8.5 3.806 8.5 8.5c0 1.986-.682 3.815-1.824 5.262l4.781 4.781-1.414 1.414-4.781-4.781c-1.447 1.142-3.276 1.824-5.262 1.824-4.694 0-8.5-3.806-8.5-8.5z"></path></g></svg>
          <input
            type="text"
            placeholder="Search people or albums"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
            className="w-full bg-[#202327] text-[#e7e9ea] border border-transparent focus:bg-black focus:border-[#1d9bf0] rounded-full py-3 pl-12 pr-4 outline-none transition-colors placeholder:text-[#71767b]"
          />
        </form>
      </div>

      {debouncedSearch.trim() === "" ? (
        <div className="p-8 text-center text-[#71767b]">
          Enter a name to search.
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
      ) : !hasResults ? (
        <div className="p-8 text-center">
          <div className="text-xl font-bold text-[#e7e9ea] mb-2">No results for "{debouncedSearch}"</div>
          <div className="text-[#71767b]">Try searching for something else.</div>
        </div>
      ) : data ? (
        <div className="flex flex-col">
          {data.persons.length > 0 && (
            <>
              <div className="px-4 py-3 border-b border-[#2f3336] bg-[#080808] text-sm font-bold text-[#71767b]">People</div>
              {data.persons.map((person, i) => (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  key={`p-${person.id}`}
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
            </>
          )}

          {data.albums.length > 0 && (
            <>
              <div className="px-4 py-3 border-b border-[#2f3336] bg-[#080808] text-sm font-bold text-[#71767b] mt-4">Albums</div>
              {data.albums.map((album, i) => (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  key={`a-${album.id}`}
                >
                  <Link href={`/p/${album.person_slug}/${album.slug}`} className="flex gap-4 p-4 border-b border-[#2f3336] hover:bg-[#080808] transition-colors cursor-pointer">
                    <div className="w-16 h-16 rounded overflow-hidden bg-[#2f3336] shrink-0 border border-[#2f3336]">
                      {album.cover_image ? (
                        <img src={getAlbumCoverUrl(album.cover_image)!} alt={album.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[#71767b]">
                          <svg viewBox="0 0 24 24" aria-hidden="true" className="w-8 h-8 fill-current"><g><path d="M19.75 2H4.25C3.01 2 2 3.01 2 4.25v15.5C2 20.99 3.01 22 4.25 22h15.5c1.24 0 2.25-1.01 2.25-2.25V4.25C22 3.01 20.99 2 19.75 2zM4.25 3.5h15.5c.41 0 .75.34.75.75v15.5c0 .41-.34.75-.75.75H4.25c-.41 0-.75-.34-.75-.75V4.25c0-.41.34-.75.75-.75zM12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zm0 8.5c-1.93 0-3.5-1.57-3.5-3.5s1.57-3.5 3.5-3.5 3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5z"></path></g></svg>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="font-bold text-[#e7e9ea] truncate">{album.name}</h2>
                      <p className="text-[#71767b] text-sm mt-1">{album.person_name}</p>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </>
          )}
        </div>
      ) : (
        <div className="p-8 text-center text-[#71767b]">Search failed.</div>
      )}
    </Layout>
  );
}
