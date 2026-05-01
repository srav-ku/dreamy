import { useState, useEffect } from "react";
import { Link, useParams } from "wouter";
import { useImages, usePersonFull } from "@/lib/api";
import { Layout } from "@/components/layout";
import { motion, AnimatePresence } from "framer-motion";

export function AlbumPage() {
  const params = useParams<{ personSlug: string; albumSlug: string }>();
  const { data: person, isLoading: personLoading } = usePersonFull(params.personSlug || "");
  const { data: images, isLoading: imagesLoading, isError } = useImages(params.albumSlug || "");
  
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const album = person?.albums.find(a => a.slug === params.albumSlug);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (lightboxIndex === null) return;
      if (e.key === "Escape") setLightboxIndex(null);
      if (e.key === "ArrowLeft") setLightboxIndex(prev => (prev !== null && prev > 0 ? prev - 1 : prev));
      if (e.key === "ArrowRight") setLightboxIndex(prev => (prev !== null && images && prev < images.length - 1 ? prev + 1 : prev));
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxIndex, images]);

  const closeLightbox = () => setLightboxIndex(null);

  const isLoading = personLoading || imagesLoading;

  if (isLoading) {
    return (
      <Layout title="Album">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-1 p-1">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => (
            <div key={i} className="aspect-square bg-[#2f3336] animate-pulse"></div>
          ))}
        </div>
      </Layout>
    );
  }

  if (isError || !person || !album) {
    return (
      <Layout title="Album">
        <div className="p-8 text-center text-[#71767b]">
          Album not found.
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={album.name}>
      <div className="px-4 py-3 border-b border-[#2f3336]">
        <Link href={`/p/${person.slug}`} className="text-[#71767b] hover:text-[#e7e9ea] transition-colors text-sm font-bold flex items-center gap-2 w-max">
          <img src={person.profile_image || ""} alt="" className="w-6 h-6 rounded-full bg-[#2f3336] object-cover" />
          {person.name}
        </Link>
      </div>

      <div className="p-1">
        {images?.length === 0 ? (
          <div className="p-8 text-center text-[#71767b]">
            No images in this album yet.
          </div>
        ) : (
          <div className="columns-2 sm:columns-3 lg:columns-4 gap-1 space-y-1">
            {images?.map((image, i) => (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "0px 0px -50px 0px" }}
                transition={{ delay: i * 0.02 }}
                key={image.id}
                className="relative break-inside-avoid mb-1 bg-[#2f3336] cursor-pointer group"
                onClick={() => setLightboxIndex(i)}
              >
                <img 
                  src={image.thumbnail_url} 
                  alt="" 
                  className="w-full h-auto block transition-all duration-300 group-hover:brightness-110"
                  loading="lazy"
                />
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {lightboxIndex !== null && images && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/95 flex flex-col backdrop-blur-sm"
          >
            <div className="flex justify-between items-center p-4 absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/50 to-transparent">
              <div className="text-[#e7e9ea] font-bold">
                {lightboxIndex + 1} / {images.length}
              </div>
              <button 
                onClick={closeLightbox}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-black/50 text-[#e7e9ea] hover:bg-[#2f3336] transition-colors"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true" className="w-6 h-6 fill-current"><g><path d="M10.59 12L4.54 5.96l1.42-1.42L12 10.59l6.04-6.05 1.42 1.42L13.41 12l6.05 6.04-1.42 1.42L12 13.41l-6.04 6.05-1.42-1.42L10.59 12z"></path></g></svg>
              </button>
            </div>

            <div 
              className="flex-1 flex items-center justify-center p-4 relative"
              onClick={closeLightbox}
            >
              <motion.img
                key={lightboxIndex}
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                src={images[lightboxIndex].image_url}
                alt=""
                className="max-w-full max-h-full object-contain"
                onClick={(e) => e.stopPropagation()}
              />

              {lightboxIndex > 0 && (
                <button 
                  onClick={(e) => { e.stopPropagation(); setLightboxIndex(lightboxIndex - 1); }}
                  className="absolute left-4 w-12 h-12 flex items-center justify-center rounded-full bg-black/50 text-[#e7e9ea] hover:bg-[#2f3336] transition-colors"
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true" className="w-6 h-6 fill-current"><g><path d="M7.414 13l5.043 5.04-1.414 1.42L3.586 12l7.457-7.46 1.414 1.42L7.414 11H21v2H7.414z"></path></g></svg>
                </button>
              )}

              {lightboxIndex < images.length - 1 && (
                <button 
                  onClick={(e) => { e.stopPropagation(); setLightboxIndex(lightboxIndex + 1); }}
                  className="absolute right-4 w-12 h-12 flex items-center justify-center rounded-full bg-black/50 text-[#e7e9ea] hover:bg-[#2f3336] transition-colors"
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true" className="w-6 h-6 fill-current"><g><path d="M16.586 13l-5.043 5.04 1.414 1.42L20.414 12l-7.457-7.46-1.414 1.42L16.586 11H3v2h13.586z"></path></g></svg>
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Layout>
  );
}
