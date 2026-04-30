import { useState } from "react";
import { Link, useParams, useLocation } from "wouter";
import { useCreateAlbum, usePerson } from "@/lib/api";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

export default function AlbumNew() {
  const params = useParams();
  const id = Number(params.id);
  const [, setLocation] = useLocation();
  const { data: person } = usePerson(id);

  const [name, setName] = useState("");
  const createAlbum = useCreateAlbum();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createAlbum.mutate({ person_id: id, name }, {
      onSuccess: () => {
        setLocation(`/persons/${id}/albums`);
      }
    });
  };

  return (
    <Layout>
      <div className="flex items-center gap-6 mb-6">
        <Link href={`/persons/${id}/albums`} className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-bold">New album {person ? `for ${person.name}` : ""}</h1>
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
        </div>

        <div className="pt-4 border-t border-[#2F3336]">
          <Button 
            type="submit" 
            disabled={createAlbum.isPending || !name}
            className="rounded-full bg-white text-black hover:bg-[#eff3f4] font-bold px-8"
          >
            {createAlbum.isPending ? "Creating..." : "Create album"}
          </Button>
        </div>
      </motion.form>
    </Layout>
  );
}
