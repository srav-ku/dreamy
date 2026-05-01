import { useState } from "react";
import { Link, useParams } from "wouter";
import { useAdminPerson, useDeleteAlbum } from "@/lib/api";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, ImageIcon, Trash2, Search } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function PersonAlbums() {
  const params = useParams();
  const id = Number(params.id);
  
  const { data: person, isLoading } = useAdminPerson(id);
  const deleteAlbum = useDeleteAlbum();
  const [search, setSearch] = useState("");

  const filteredAlbums = person?.albums?.filter(a => 
    a.name.toLowerCase().includes(search.toLowerCase())
  );

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

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#71767B]" />
        <Input 
          placeholder="Search albums..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 bg-[#16181C] border-[#2F3336] focus:border-[#1d9bf0] transition-colors rounded-xl text-white h-11"
        />
      </div>

      <div className="space-y-0">
        {filteredAlbums?.length === 0 ? (
          <div className="text-center py-12 text-[#71767B]">
            <p>{search ? `No albums matching "${search}"` : "No albums yet."}</p>
          </div>
        ) : (
          filteredAlbums?.map((album) => (
            <div key={album.id} className="flex items-center gap-4 py-4 border-b border-[#2F3336] hover:bg-white/[0.03] transition-colors -mx-4 px-4 cursor-pointer group">
              <Link href={`/albums/${album.id}/upload?slug=${album.slug}`} className="flex-1 flex items-center gap-4 min-w-0">
                <div className="w-16 h-16 rounded bg-[#16181C] flex items-center justify-center overflow-hidden border border-[#2F3336]">
                  {album.cover_image ? (
                    <img src={album.cover_image} alt={album.name} className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="w-6 h-6 text-[#71767B]" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold group-hover:underline decoration-[#71767B] underline-offset-4">{album.name}</div>
                  <div className="text-[#71767B] text-sm">
                    {album.image_count} photos • {((album.image_count * 2.5) / 1024).toFixed(2)} GB
                  </div>
                </div>              </Link>
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Link href={`/albums/${album.id}/edit`}>
                  <Button variant="outline" size="sm" className="rounded-full border-[#2F3336] text-white hover:bg-white/10 bg-transparent">
                    Edit
                  </Button>
                </Link>
                <Link href={`/albums/${album.id}/upload`}>
                  <Button variant="outline" size="sm" className="rounded-full border-[#2F3336] text-white hover:bg-white/10 bg-transparent">
                    Photos
                  </Button>
                </Link>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full text-[#f4212e] hover:bg-[#f4212e]/10 hover:text-[#f4212e]">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-black border-[#2F3336] text-white">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete {album.name}?</AlertDialogTitle>
                      <AlertDialogDescription className="text-[#71767B]">
                        This will permanently delete this album and all its photos. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="bg-transparent border-[#2F3336] text-white hover:bg-white/10 rounded-full">Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={() => deleteAlbum.mutate(album.id)}
                        className="bg-[#f4212e] text-white hover:bg-[#d7202b] rounded-full font-bold"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))
        )}
      </div>
    </Layout>
  );
}
