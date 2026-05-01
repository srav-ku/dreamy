import { useState, useEffect } from "react";
import { Link, useParams, useLocation } from "wouter";
import { useAdminAlbum, useUpdateAlbum } from "@/lib/api";
import { slugify } from "@/lib/utils";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

export default function AlbumEdit() {
  const params = useParams();
  const id = Number(params.albumId);
  const [, setLocation] = useLocation();
  
  const { data: album, isLoading } = useAdminAlbum(id);
  const [name, setName] = useState("");
  const updateAlbum = useUpdateAlbum();

  useEffect(() => {
    if (album) {
      setName(album.name);
    }
  }, [album]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateAlbum.mutate({ id, name }, {
      onSuccess: () => {
        setLocation(`/persons/${album?.person_id}/albums`);
      }
    });
  };

  if (isLoading) return <Layout><div className="flex items-center justify-center p-12"><Loader2 className="animate-spin" /></div></Layout>;

  return (
    <Layout>
      <div className="flex items-center gap-6 mb-6">
        <Link href={`/persons/${album?.person_id}/albums`} className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-bold">Edit album</h1>
      </div>

      <motion.form 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleSubmit} 
        className="space-y-6 max-w-xl"
      >
        <div>
          <label className="block text-sm font-medium text-[#71767B] mb-1">Album Name</label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="bg-transparent border-[#2F3336] focus-visible:ring-1 focus-visible:ring-[#1d9bf0] text-white rounded-md"
            required
            autoFocus
          />
          {name.trim() && (
            <p className="text-[10px] text-[#71767B] mt-1 ml-1">
              Slug: <span className="text-[#1d9bf0]">/{slugify(name)}</span>
            </p>
          )}
        </div>

        <div className="pt-4 border-t border-[#2F3336]">
          <Button 
            type="submit" 
            disabled={updateAlbum.isPending || !name}
            className="rounded-full bg-white text-black hover:bg-[#eff3f4] font-bold px-8"
          >
            {updateAlbum.isPending ? "Saving..." : "Save changes"}
          </Button>
        </div>
      </motion.form>
    </Layout>
  );
}
