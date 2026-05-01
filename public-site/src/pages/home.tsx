import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { useListPersons, useSearch } from "@/lib/api";
import { Layout } from "@/components/layout";
import { getProfileImageUrl, getInitials } from "@/lib/cloudinary";
import { motion, AnimatePresence } from "framer-motion";

export function Home() {
  const { data: persons, isLoading, isError } = useListPersons();
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 200);
    return () => clearTimeout(timer);
  }, [search]);

  const { data: searchResults, isLoading: searchLoading } = useSearch(debouncedSearch);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      setLocation(`/search?q=${encodeURIComponent(search.trim())}`);
    }
  };

  return (
    <Layout>
      <div className="sticky top-0 z-20 bg-black/80 backdrop-blur-md px-4 py-2 border-b border-[#2f3336]">
        <div ref={searchRef} className="relative">
          <form onSubmit={handleSearchSubmit} className="relative">
            <svg viewBox="0 0 24 24" aria-hidden="true" className="w-4 h-4 fill-[#71767b] absolute left-4 top-1/2 -translate-y-1/2"><g><path d="M10.25 3.75c-3.59 0-6.5 2.91-6.5 6.5s2.91 6.5 6.5 6.5c1.795 0 3.419-.726 4.596-1.904 1.178-1.177 1.904-2.801 1.904-4.596 0-3.59-2.91-6.5-6.5-6.5zm-8.5 6.5c0-4.694 3.806-8.5 8.5-8.5s8.5 3.806 8.5 8.5c0 1.986-.682 3.815-1.824 5.262l4.781 4.781-1.414 1.414-4.781-4.781c-1.447 1.142-3.276 1.824-5.262 1.824-4.694 0-8.5-3.806-8.5-8.5z"></path></g></svg>
            <input
              type="text"
              placeholder="Search people"
              value={search}
              onFocus={() => setShowResults(true)}
              onChange={(e) => {
                setSearch(e.target.value);
                setShowResults(true);
              }}
              className="w-full bg-[#202327] text-[#e7e9ea] border border-transparent focus:bg-black focus:border-[#1d9bf0] rounded-full py-3 pl-12 pr-4 outline-none transition-colors placeholder:text-[#71767b]"
            />
          </form>

          <AnimatePresence>
            {showResults && search.trim() !== "" && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full left-0 right-0 mt-1 bg-black border border-[#2f3336] rounded-2xl overflow-hidden shadow-xl z-30"
              >
                {searchLoading ? (
                  <div className="p-4 text-[#71767b] text-center text-sm">Searching...</div>
                ) : searchResults && (searchResults.persons.length > 0 || searchResults.albums.length > 0) ? (
                  <div className="max-h-[350px] overflow-y-auto">
                    {searchResults.persons.map((person) => (
                      <Link 
                        key={person.id} 
                        href={`/p/${person.slug}`}
                        className="flex items-center gap-3 p-3 hover:bg-[#181818] transition-colors border-b border-[#2f3336] last:border-0"
                      >
                        {person.profile_image ? (
                          <img src={getProfileImageUrl(person.profile_image)!} alt="" className="w-10 h-10 rounded-full object-cover bg-[#2f3336]" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-[#2f3336] flex items-center justify-center text-[#e7e9ea] text-xs font-bold">
                            {getInitials(person.name)}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-[#e7e9ea] truncate">{person.name}</div>
                          <div className="text-[#71767b] text-xs truncate">{person.bio || "No bio"}</div>
                        </div>
                      </Link>
                    ))}
                    {searchResults.albums.map((album) => (
                      <Link 
                        key={album.id} 
                        href={`/p/${album.person_slug}/${album.slug}`}
                        className="flex items-center gap-3 p-3 hover:bg-[#181818] transition-colors border-b border-[#2f3336] last:border-0"
                      >
                        <div className="w-10 h-10 rounded-lg bg-[#2f3336] flex items-center justify-center text-[#e7e9ea] text-xs font-bold">
                          <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current opacity-70"><path d="M19.75 2H4.25C3.01 2 2 3.01 2 4.25v15.5C2 20.99 3.01 22 4.25 22h15.5c1.24 0 2.25-1.01 2.25-2.25V4.25C22 3.01 20.99 2 19.75 2zM4.25 3.5h15.5c.41 0 .75.34.75.75v10.12l-3.23-3.23c-.29-.29-.77-.29-1.06 0l-5.47 5.47-2.72-2.72c-.29-.29-.77-.29-1.06 0l-3.46 3.46V4.25c0-.41.34-.75.75-.75zm0 17c-.41 0-.75-.34-.75-.75v-2.06l4-4 2.72 2.72c.29.29.77.29 1.06 0l5.47-5.47 4.25 4.25v4.56c0 .41-.34.75-.75.75H4.25z"></path></svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-[#e7e9ea] truncate">{album.name}</div>
                          <div className="text-[#71767b] text-xs truncate">Album by {album.person_name}</div>
                        </div>
                      </Link>
                    ))}
                    <Link 
                      href={`/search?q=${encodeURIComponent(search.trim())}`}
                      className="block p-3 text-center text-[#1d9bf0] hover:bg-[#181818] transition-colors text-sm font-medium"
                    >
                      Show all results for "{search}"
                    </Link>
                  </div>
                ) : (
                  <div className="p-4 text-[#71767b] text-center text-sm">No results found</div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {isLoading ? (
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
          Failed to load people.
        </div>
      ) : persons?.length === 0 ? (
        <div className="p-8 text-center text-[#71767b]">
          No people found.
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
