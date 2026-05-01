import { useState, useCallback, useRef, useEffect } from "react";
import { Link, useParams } from "wouter";
import { useAdminAlbum, useImages, useCreateImages, useReorderImages, useDeleteImage } from "@/lib/api";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Upload, CheckCircle2, Trash2, GripVertical, Loader2 } from "lucide-react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import { toast } from "sonner";

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
  
  const { data: album, isLoading: albumLoading } = useAdminAlbum(albumId);
  const albumSlug = album?.slug;

  const { data: existingImages, isLoading: imagesLoading } = useImages(albumSlug || "");
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    if (existingImages) {
      setItems(existingImages);
    }
  }, [existingImages]);
  
  const [files, setFiles] = useState<UploadingFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const createImages = useCreateImages();
  const reorderImages = useReorderImages();
  const deleteImage = useDeleteImage();

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
      } catch (err: any) {
        toast.error(err.message || "Upload failed");
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
        }
      });
    }
  };

  const handleReorder = (newItems: any[]) => {
    setItems(newItems);
    const updates = newItems.map((item, index) => ({ id: item.id, order_index: index }));
    reorderImages.mutate(updates);
  };

  if (albumLoading) return <Layout><div className="flex items-center justify-center p-12"><Loader2 className="animate-spin" /></div></Layout>;

  return (
    <Layout>
      <div className="flex items-center gap-6 mb-6">
        <button onClick={() => window.history.back()} className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold">Manage Photos</h1>
          <p className="text-sm text-[#71767B]">{album?.name}</p>
        </div>
      </div>

      <div 
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors mb-8 ${
          isDragging ? "border-[#1d9bf0] bg-[#1d9bf0]/10" : "border-[#2F3336] hover:border-[#71767B]"
        }`}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        <Upload className="w-8 h-8 mx-auto text-[#71767B] mb-2" />
        <p className="font-medium mb-1">Drag photos here</p>
        <p className="text-xs text-[#71767B] mb-4">Or click to select files</p>
        <Button 
          variant="outline"
          size="sm"
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
            e.target.value = ""; 
          }}
        />
      </div>

      {files.length > 0 && (
        <div className="mb-12 p-4 border border-[#2F3336] rounded-xl bg-[#080808]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold">New Uploads ({files.length})</h3>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setFiles([])} disabled={anyUploading} className="rounded-full text-[#71767B]">Clear</Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={anyUploading || !allSuccess || createImages.isPending}
                className="rounded-full bg-white text-black hover:bg-[#eff3f4] font-bold px-6"
              >
                {createImages.isPending ? "Saving..." : "Save to album"}
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
            {files.map((file) => (
              <div key={file.id} className="relative aspect-square rounded-lg overflow-hidden bg-[#16181C] border border-[#2F3336]">
                <img 
                  src={URL.createObjectURL(file.file)} 
                  alt="upload preview" 
                  className="w-full h-full object-cover opacity-50"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                  {file.status === "uploading" && (
                    <div className="w-8 h-8 rounded-full border-2 border-[#2F3336] border-t-[#1d9bf0] animate-spin" />
                  )}
                  {file.status === "success" && (
                    <CheckCircle2 className="w-8 h-8 text-[#00ba7c]" />
                  )}
                  {file.status === "error" && (
                    <span className="text-[#f4212e] text-[10px] font-bold px-1 bg-black/80 rounded">Failed</span>
                  )}
                </div>
                {file.status === "uploading" && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#2F3336]">
                    <div className="h-full bg-[#1d9bf0] transition-all duration-300" style={{ width: `${file.progress}%` }} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className="font-bold text-lg mb-4">Album Photos ({items.length})</h3>
        {imagesLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => <div key={i} className="aspect-square rounded-lg bg-[#16181C] animate-pulse" />)}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-12 text-[#71767B] border border-[#2F3336] border-dashed rounded-xl">
            No photos yet.
          </div>
        ) : (
          <Reorder.Group axis="y" values={items} onReorder={handleReorder} className="space-y-2">
            {items.map((image) => (
              <Reorder.Item 
                key={image.id} 
                value={image}
                className="flex items-center gap-4 p-2 bg-[#080808] border border-[#2F3336] rounded-xl group cursor-default"
              >
                <div className="cursor-grab active:cursor-grabbing p-1 text-[#71767B] hover:text-[#e7e9ea]">
                  <GripVertical className="w-5 h-5" />
                </div>
                <div className="w-16 h-16 rounded-md overflow-hidden bg-[#16181C] border border-[#2F3336] shrink-0">
                  <img src={image.thumbnail_url} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 text-xs text-[#71767B] truncate">
                  {image.image_url.split('/').pop()}
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => deleteImage.mutate(image.id)}
                  className="rounded-full text-[#71767B] hover:bg-[#f4212e]/10 hover:text-[#f4212e] opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </Reorder.Item>
            ))}
          </Reorder.Group>
        )}
      </div>
    </Layout>
  );
}
