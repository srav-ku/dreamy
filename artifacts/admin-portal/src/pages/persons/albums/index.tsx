import { Link, useParams } from "wouter";
import { usePerson } from "@/lib/api";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, ImageIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function PersonAlbums() {
  const params = useParams();
  const id = Number(params.id);
  
  const { data: personWrapper, isLoading } = usePerson(id);
  const person = personWrapper;

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center gap-6 mb-6">
          <Skeleton className="h-8 w-8 rounded-full bg-[#2F3336]" />
          <Skeleton className="h-8 w-48 bg-[#2F3336]" />
        </div>
      </Layout>
    );
  }

  if (!person) return <Layout><div>Not found</div></Layout>;

  return (
    <Layout>
      <div className="flex items-center gap-6 mb-8 pb-8 border-b border-[#2F3336]">
        <Link href="/persons" className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <Avatar className="h-16 w-16 border border-[#2F3336]">
          <AvatarImage src={person.profile_image || undefined} className="object-cover" />
          <AvatarFallback className="bg-[#16181C] text-[#71767B] text-xl">{person.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h1 className="text-xl font-bold">{person.name}</h1>
          <p className="text-sm text-[#71767B]">Albums management</p>
        </div>
        <Link href={`/persons/${person.id}/edit`}>
          <Button variant="outline" className="rounded-full border-[#2F3336] text-white hover:bg-white/10 bg-transparent font-bold">
            Edit person
          </Button>
        </Link>
      </div>

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold">Albums</h2>
        <Link href={`/persons/${person.id}/albums/new`}>
          <Button className="rounded-full bg-white text-black hover:bg-[#eff3f4] font-bold px-4">
            + New album
          </Button>
        </Link>
      </div>

      <div className="space-y-0">
        {person.albums?.length === 0 ? (
          <div className="text-center py-12 text-[#71767B]">
            <p>No albums yet.</p>
          </div>
        ) : (
          person.albums?.map((album) => (
            <Link key={album.id} href={`/albums/${album.id}/upload?slug=${album.slug}`}>
              <div className="flex items-center gap-4 py-4 border-b border-[#2F3336] hover:bg-white/[0.03] transition-colors -mx-4 px-4 cursor-pointer group">
                <div className="w-16 h-16 rounded bg-[#16181C] flex items-center justify-center overflow-hidden border border-[#2F3336]">
                  {album.cover_image ? (
                    <img src={album.cover_image} alt={album.name} className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="w-6 h-6 text-[#71767B]" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-bold group-hover:underline decoration-[#71767B] underline-offset-4">{album.name}</div>
                  <div className="text-[#71767B] text-sm">{album.image_count} photos</div>
                </div>
                <Button variant="outline" size="sm" className="rounded-full border-[#2F3336] text-white hover:bg-white/10 bg-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  Upload
                </Button>
              </div>
            </Link>
          ))
        )}
      </div>
    </Layout>
  );
}
