import { useState } from "react";
import { Link } from "wouter";
import { useCreatePerson } from "@/lib/api";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { slugify } from "@/lib/utils";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Upload, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

export default function PersonNew() {
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const createPerson = useCreatePerson();

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const { image_url } = await uploadToCloudinary(file);
      setProfileImage(image_url);
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createPerson.mutate({ name, bio, profile_image: profileImage || undefined });
  };

  const slugPreview = slugify(name);

  return (
    <Layout>
      <div className="flex items-center gap-6 mb-6">
        <Link href="/persons" className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-bold">New person</h1>
      </div>

      <motion.form 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleSubmit} 
        className="space-y-6 max-w-xl"
      >
        <div className="flex items-center gap-6">
          <div className="relative group">
            <Avatar className="h-24 w-24 border border-[#2F3336]">
              <AvatarImage src={profileImage || undefined} className="object-cover" />
              <AvatarFallback className="bg-[#16181C] text-[#71767B]">
                {isUploading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Upload className="w-6 h-6" />}
              </AvatarFallback>
            </Avatar>
            <label className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 rounded-full cursor-pointer transition-opacity">
              <Upload className="w-6 h-6 text-white" />
              <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={isUploading} />
            </label>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium mb-1">Profile Image</p>
            <p className="text-xs text-[#71767B]">Upload a square photo.</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#71767B] mb-1">Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-transparent border-[#2F3336] focus-visible:ring-1 focus-visible:ring-[#1d9bf0] text-white rounded-md"
              required
            />
            {name.trim() && (
              <p className="text-[10px] text-[#71767B] mt-1 ml-1">
                Slug: <span className="text-[#1d9bf0]">/p/{slugPreview}</span>
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-[#71767B] mb-1">Bio</label>
            <Textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="bg-transparent border-[#2F3336] focus-visible:ring-1 focus-visible:ring-[#1d9bf0] text-white rounded-md min-h-[120px] resize-none"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-[#2F3336]">
          <Button 
            type="submit" 
            disabled={createPerson.isPending || !name || isUploading}
            className="rounded-full bg-white text-black hover:bg-[#eff3f4] font-bold px-8"
          >
            {createPerson.isPending ? "Saving..." : "Save"}
          </Button>
        </div>
      </motion.form>
    </Layout>
  );
}
