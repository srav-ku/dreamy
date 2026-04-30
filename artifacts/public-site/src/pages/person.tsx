import { Link, useParams } from "wouter";
import { usePersonFull } from "@/lib/api";
import { Layout } from "@/components/layout";
import { getProfileImageUrl, getInitials } from "@/lib/cloudinary";
import { motion } from "framer-motion";

export function PersonPage() {
  const params = useParams<{ personSlug: string }>();
  const { data: person, isLoading, isError } = usePersonFull(params.personSlug || "");

  if (isLoading) {
    return (
      <Layout title="Profile">
        <div className="p-4 space-y-4 animate-pulse border-b border-[#2f3336]">
          <div className="w-24 h-24 rounded-full bg-[#2f3336]"></div>
          <div className="space-y-2 py-1">
            <div className="h-6 bg-[#2f3336] rounded w-1/3"></div>
            <div className="h-4 bg-[#2f3336] rounded w-2/3 mt-2"></div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-1 p-1">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="aspect-square bg-[#2f3336] animate-pulse"></div>
          ))}
        </div>
      </Layout>
    );
  }

  if (isError || !person) {
    return (
      <Layout title="Profile">
        <div className="p-8 text-center text-[#71767b]">
          Person not found or failed to load.
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={person.name}>
      <div className="px-4 py-6 border-b border-[#2f3336]">
        {person.profile_image ? (
          <img src={getProfileImageUrl(person.profile_image)!} alt={person.name} className="w-24 h-24 rounded-full object-cover border-4 border-black" />
        ) : (
          <div className="w-24 h-24 rounded-full bg-[#2f3336] border-4 border-black flex items-center justify-center text-[#e7e9ea] text-3xl font-bold">
            {getInitials(person.name)}
          </div>
        )}
        <div className="mt-4">
          <h1 className="font-bold text-xl text-[#e7e9ea]">{person.name}</h1>
          {person.bio && <p className="text-[#e7e9ea] text-base mt-3 leading-snug whitespace-pre-wrap">{person.bio}</p>}
        </div>
      </div>
      
      <div className="border-b border-[#2f3336]">
        <div className="flex font-bold text-[#e7e9ea] text-sm">
          <div className="py-4 px-6 relative cursor-pointer hover:bg-[#181818] transition-colors flex-1 text-center">
            Albums
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-[#1d9bf0] rounded-full"></div>
          </div>
        </div>
      </div>

      <div className="p-1">
        {person.albums.length === 0 ? (
          <div className="p-8 text-center text-[#71767b]">
            No albums yet.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
            {person.albums.map((album, i) => (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "0px 0px -50px 0px" }}
                transition={{ delay: i * 0.05 }}
                key={album.id}
                className="relative aspect-square group overflow-hidden bg-[#2f3336]"
              >
                <Link href={`/p/${person.slug}/${album.slug}`} className="block w-full h-full">
                  {album.cover_image ? (
                    <img 
                      src={album.cover_image} 
                      alt={album.name} 
                      className="w-full h-full object-cover transition-all duration-300 group-hover:brightness-110"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[#71767b]">
                      No cover
                    </div>
                  )}
                  <div className="absolute inset-0 border border-transparent group-hover:border-white/20 pointer-events-none transition-colors z-10"></div>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-2">
                    <div className="font-bold text-[#e7e9ea] text-sm truncate">{album.name}</div>
                    <div className="text-[#71767b] text-xs">{album.image_count} photo{album.image_count !== 1 ? 's' : ''}</div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
