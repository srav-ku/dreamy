import { useState, useCallback, useRef } from "react";
import { Link, useParams } from "wouter";
import { useListPersons, useListImages, useCreateImages } from "@/lib/api";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Upload, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type UploadingFile = {
  id: string;
  file: File;
  progress: number;
  status: "uploading" | "success" | "error";
  result?: { image_url: string; thumbnail_url: string };
};

export default function AlbumUpload() {
  const params = useParams();
  const albumId = Number(params.albumId);
  
  // To get album info, we find the person who owns it. This is a bit of a workaround
  // since we don't have a direct GET /api/album/:id endpoint.
  const { data: persons } = useListPersons();
  let foundAlbum = null;
  let foundPerson = null;
  if (persons) {
    for (const p of persons) {
      const pFull = p as any; // Need to load person full for albums but we might not have it loaded.
      // Wait, list persons doesn't return full albums. We don't have a direct album endpoint hook.
      // We can just use the album slug for images, but wait, the API contract says:
      // GET /api/images/:albumSlug
      // How do we get the albumSlug from albumId?
    }
  }
  
  const [searchParams] = new URLSearchParams(window.location.search);
  const albumSlug = searchParams.get("slug");
  const { data: existingImages, isLoading: imagesLoading } = useListImages(albumSlug || "");
  
  const [files, setFiles] = useState<UploadingFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const createImages = useCreateImages();

  const handleFiles = useCallback((newFiles: FileList | File[]) => {
    const arr = Array.from(newFiles).filter(f => f.type.startsWith("image/"));
    if (arr.length === 0) return;

    const newUploads = arr.map(file => ({
      id: Math.random().toString(36).substring(7),
      file,
      progress: 0,
      status: "uploading" as const,
    }));

    setFiles(prev => [...prev, ...newUploads]);

    newUploads.forEach(async (upload) => {
      try {
        const result = await uploadToCloudinary(upload.file, (pct) => {
          setFiles(prev => prev.map(f => f.id === upload.id ? { ...f, progress: pct } : f));
        });
        setFiles(prev => prev.map(f => f.id === upload.id ? { ...f, status: "success", progress: 100, result } : f));
      } catch (err) {
        setFiles(prev => prev.map(f => f.id === upload.id ? { ...f, status: "error" } : f));
      }
    });
  }, []);

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => setIsDragging(false);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const allSuccess = files.length > 0 && files.every(f => f.status === "success");
  const anyUploading = files.some(f => f.status === "uploading");

  const handleSave = () => {
    const successfulUploads = files.filter(f => f.status === "success" && f.result).map(f => f.result!);
    if (successfulUploads.length > 0) {
      createImages.mutate({ album_id: albumId, images: successfulUploads }, {
        onSuccess: () => {
          setFiles([]);
          // Optionally redirect back
        }
      });
    }
  };

  return (
    <Layout>
      <div className="flex items-center gap-6 mb-6">
        <button onClick={() => window.history.back()} className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold">Upload Photos</h1>
      </div>

      <div 
        className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
          isDragging ? "border-[#1d9bf0] bg-[#1d9bf0]/10" : "border-[#2F3336] hover:border-[#71767B]"
        }`}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        <Upload className="w-10 h-10 mx-auto text-[#71767B] mb-4" />
        <p className="text-lg font-medium mb-2">Drag photos here</p>
        <p className="text-sm text-[#71767B] mb-6">Or click to select files</p>
        <Button 
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          className="rounded-full border-[#2F3336] text-white hover:bg-white/10 bg-transparent font-bold"
        >
          Select files
        </Button>
        <input 
          type="file" 
          multiple 
          accept="image/*" 
          className="hidden" 
          ref={fileInputRef}
          onChange={(e) => {
            if (e.target.files) handleFiles(e.target.files);
            e.target.value = ""; // Reset to allow selecting same files again
          }}
        />
      </div>

      {files.length > 0 && (
        <div className="mt-8 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-lg">Uploads ({files.length})</h3>
            <Button
              onClick={handleSave}
              disabled={anyUploading || !allSuccess || createImages.isPending}
              className="rounded-full bg-white text-black hover:bg-[#eff3f4] font-bold px-6"
            >
              {createImages.isPending ? "Saving..." : "Save to album"}
            </Button>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-8">
            <AnimatePresence>
              {existingImages?.map((image) => (
                <motion.div 
                  key={image.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="relative aspect-square rounded-lg overflow-hidden bg-[#16181C] border border-[#2F3336]"
                >
                  <img 
                    src={image.thumbnail_url || image.image_url} 
                    alt="uploaded photo" 
                    className="w-full h-full object-cover"
                  />
                </motion.div>
              ))}
              {files.map((file) => (
                <motion.div 
                  key={file.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="relative aspect-square rounded-lg overflow-hidden bg-[#16181C] border border-[#2F3336]"
                >
                  <img 
                    src={URL.createObjectURL(file.file)} 
                    alt="upload preview" 
                    className="w-full h-full object-cover opacity-50"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                    {file.status === "uploading" && (
                      <div className="w-12 h-12 rounded-full border-4 border-[#2F3336] border-t-[#1d9bf0] animate-spin" />
                    )}
                    {file.status === "success" && (
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                        <CheckCircle2 className="w-10 h-10 text-[#00ba7c]" />
                      </motion.div>
                    )}
                    {file.status === "error" && (
                      <span className="text-[#f4212e] text-sm font-bold px-2 py-1 bg-black/80 rounded">Failed</span>
                    )}
                  </div>
                  {file.status === "uploading" && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#2F3336]">
                      <div 
                        className="h-full bg-[#1d9bf0] transition-all duration-300"
                        style={{ width: `${file.progress}%` }}
                      />
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}
    </Layout>
  );
}
