import React, { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSearch, useImages, usePersonFull } from "@workspace/shared/api";
import { Search as SearchIcon, Loader2, ChevronRight, User as UserIcon, Folder, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImagePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (image: any) => void;
}

export const ImagePickerModal = ({ isOpen, onClose, onSelect }: ImagePickerModalProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAlbum, setSelectedAlbum] = useState<{ id: number; slug: string; name: string; personSlug: string; personName: string } | null>(null);
  const [selectedPersonSlug, setSelectedPersonSlug] = useState<string | null>(null);

  const { data: searchResults, isLoading: searching } = useSearch(searchQuery);
  const { data: personFull, isLoading: loadingPerson } = usePersonFull(selectedPersonSlug || "");
  const { data: images, isLoading: loadingImages } = useImages(selectedAlbum?.slug || "");

  const handlePersonClick = (person: any) => {
    setSelectedPersonSlug(person.slug);
  };

  const handleAlbumClick = (album: any) => {
    setSelectedAlbum({
      id: album.id,
      slug: album.slug,
      name: album.name,
      personSlug: album.person_slug || selectedPersonSlug,
      personName: album.person_name || personFull?.name || ""
    });
  };

  const resetAll = () => {
    setSearchQuery("");
    setSelectedAlbum(null);
    setSelectedPersonSlug(null);
  };

  const handleClose = () => {
    resetAll();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="!fixed !inset-0 !translate-x-0 !translate-y-0 sm:!left-[50%] sm:!top-[50%] sm:!-translate-x-1/2 sm:!-translate-y-1/2 w-full max-w-none sm:max-w-[500px] bg-black border-[#2f3336] p-0 overflow-hidden flex flex-col h-dvh sm:h-[600px] shadow-2xl rounded-none sm:rounded-xl border-0 sm:border z-[99999]">
        <DialogHeader className="p-4 border-b border-[#2f3336]">
          <DialogTitle className="text-[#e7e9ea] flex items-center gap-2 pr-6">
            {selectedAlbum ? (
              <button onClick={() => setSelectedAlbum(null)} className="hover:text-[#1d9bf0] flex items-center gap-1 transition-colors text-left">
                <ChevronRight className="h-4 w-4 rotate-180 shrink-0" /> <span className="truncate">{selectedAlbum.name}</span>
              </button>
            ) : selectedPersonSlug ? (
              <button onClick={() => setSelectedPersonSlug(null)} className="hover:text-[#1d9bf0] flex items-center gap-1 transition-colors text-lg text-left">
                <ChevronRight className="h-4 w-4 rotate-180 shrink-0" /> <span className="truncate">{personFull?.name || "Actress"}</span>
              </button>
            ) : (
              "Mention Image"
            )}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Search for an actress or album to mention an image.
          </DialogDescription>
        </DialogHeader>

        <div className="p-0 flex flex-col flex-1 overflow-hidden">
          {!selectedAlbum && !selectedPersonSlug && (
            <>
              <div className="p-4 border-b border-[#2f3336] bg-black/50">
                <div className="relative">
                  <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#71767b]" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search actress or album..."
                    className="pl-10 bg-[#16181c] border-[#2f3336] focus-visible:ring-[#1d9bf0] h-11"
                  />
                </div>
              </div>

              <ScrollArea className="flex-1">
                {searching ? (
                  <div className="flex justify-center p-12">
                    <Loader2 className="h-8 w-8 animate-spin text-[#1d9bf0]" />
                  </div>
                ) : (
                  <div className="p-2 space-y-6">
                    {/* Unified Results */}
                    {(!searchResults?.persons?.length && !searchResults?.albums?.length && searchQuery) && (
                      <p className="text-center text-sm text-[#71767b] py-20">
                        No results found for "{searchQuery}"
                      </p>
                    )}

                    {(searchResults?.persons?.length ?? 0) > 0 && (
                      <div className="space-y-1">
                        <h4 className="px-3 py-1 text-[11px] font-bold text-[#71767b] uppercase tracking-widest flex items-center gap-2">
                          <UserIcon className="h-3.5 w-3.5" /> ACTRESSES
                        </h4>
                        {searchResults?.persons?.map((person) => (
                          <button
                            key={person.id}
                            onClick={() => handlePersonClick(person)}
                            className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-[#16181c] transition-all text-left group"
                          >
                            <div className="w-12 h-12 rounded-full bg-[#2f3336] shrink-0 overflow-hidden border-2 border-transparent group-hover:border-[#1d9bf0]">
                              {person.profile_image ? (
                                <img src={person.profile_image} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-[#71767b]">
                                  <UserIcon className="h-6 w-6" />
                                </div>
                              )}
                            </div>
                            <span className="text-[15px] font-bold text-[#e7e9ea] group-hover:text-[#1d9bf0]">
                              {person.name}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}

                    {(searchResults?.albums?.length ?? 0) > 0 && (
                      <div className="space-y-1">
                        <h4 className="px-3 py-1 text-[11px] font-bold text-[#71767b] uppercase tracking-widest flex items-center gap-2">
                          <Folder className="h-3.5 w-3.5" /> ALBUMS
                        </h4>
                        {searchResults?.albums?.map((album) => (
                          <button
                            key={album.id}
                            onClick={() => handleAlbumClick(album)}
                            className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-[#16181c] transition-all text-left group"
                          >
                            <div className="w-14 h-14 rounded-lg bg-[#2f3336] shrink-0 overflow-hidden border border-white/5 shadow-sm group-hover:border-[#1d9bf0]/30">
                              {album.cover_image && (
                                <img src={album.cover_image} alt="" className="w-full h-full object-cover" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[15px] font-bold text-[#e7e9ea] group-hover:text-[#1d9bf0] truncate">
                                {album.name}
                              </p>
                              <p className="text-xs text-[#71767b] truncate mt-0.5">
                                {album.person_name}
                              </p>
                            </div>
                            <ChevronRight className="h-5 w-5 text-[#2f3336] group-hover:text-[#1d9bf0]" />
                          </button>
                        ))}
                      </div>
                    )}
                    
                    {!searchQuery && (
                      <div className="flex flex-col items-center justify-center py-20 text-[#71767b]">
                        <SearchIcon className="h-12 w-12 mb-4 opacity-10" />
                        <p className="text-sm font-medium">Search to find images to mention</p>
                      </div>
                    )}
                  </div>
                )}
              </ScrollArea>
            </>
          )}

          {selectedPersonSlug && !selectedAlbum && (
            <ScrollArea className="flex-1">
              {loadingPerson ? (
                <div className="flex justify-center p-20">
                  <Loader2 className="h-8 w-8 animate-spin text-[#1d9bf0]" />
                </div>
              ) : (
                <div className="p-2 space-y-1">
                   <h4 className="px-3 py-2 text-[11px] font-bold text-[#71767b] uppercase tracking-widest">
                     SELECT AN ALBUM
                   </h4>
                   {personFull?.albums.map((album) => (
                      <button
                        key={album.id}
                        onClick={() => handleAlbumClick({ ...album, person_slug: personFull.slug, person_name: personFull.name })}
                        className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-[#16181c] transition-all text-left group"
                      >
                        <div className="w-14 h-14 rounded-lg bg-[#2f3336] shrink-0 overflow-hidden border border-white/5 group-hover:border-[#1d9bf0]/30">
                          {album.cover_image && (
                            <img src={album.cover_image} alt="" className="w-full h-full object-cover" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[15px] font-bold text-[#e7e9ea] group-hover:text-[#1d9bf0] truncate">
                            {album.name}
                          </p>
                          <p className="text-xs text-[#71767b] truncate mt-0.5">
                            {album.image_count} images
                          </p>
                        </div>
                        <ChevronRight className="h-5 w-5 text-[#2f3336] group-hover:text-[#1d9bf0]" />
                      </button>
                   ))}
                </div>
              )}
            </ScrollArea>
          )}

          {selectedAlbum && (
            <ScrollArea className="flex-1 bg-black/20">
              {loadingImages ? (
                <div className="flex justify-center p-20">
                  <Loader2 className="h-8 w-8 animate-spin text-[#1d9bf0]" />
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-1.5 p-2">
                  {images?.map((img) => (
                    <button
                      key={img.id}
                      onClick={() => onSelect({
                        imageId: img.id,
                        imageUrl: img.thumbnail_url,
                        albumSlug: selectedAlbum.slug,
                        personSlug: selectedAlbum.personSlug,
                        personName: selectedAlbum.personName,
                        albumName: selectedAlbum.name
                      })}
                      className="aspect-square relative group overflow-hidden bg-[#2f3336] rounded-md"
                    >
                      <img src={img.thumbnail_url} alt="" className="w-full h-full object-cover transition-all duration-300 group-hover:scale-110 group-hover:brightness-110" />
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
