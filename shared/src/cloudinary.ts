export async function uploadToCloudinary(
  file: File,
  onProgress?: (pct: number) => void
): Promise<{ image_url: string; thumbnail_url: string }> {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    throw new Error("Cloudinary configuration missing. Please check VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET.");
  }

  return new Promise((resolve, reject) => {
    const url = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    
    formData.append("file", file);
    formData.append("upload_preset", uploadPreset);

    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable && onProgress) {
        const pct = Math.round((e.loaded / e.total) * 100);
        onProgress(pct);
      }
    });

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          const image_url = response.secure_url;
          const thumbnail_url = image_url.replace("/upload/", "/upload/c_fill,f_auto,q_auto,w_600/");
          resolve({ image_url, thumbnail_url });
        } catch (err) {
          reject(new Error("Failed to parse Cloudinary response"));
        }
      } else {
        const err = JSON.parse(xhr.responseText).error?.message || xhr.statusText;
        reject(new Error(`Cloudinary upload failed: ${err}`));
      }
    });

    xhr.addEventListener("error", () => {
      reject(new Error("Network error during Cloudinary upload"));
    });

    xhr.open("POST", url, true);
    xhr.send(formData);
  });
}

export function getProfileImageUrl(url: string | null): string | null {
  if (!url) return null;
  return url.replace("/upload/", "/upload/c_fill,g_face,w_200,h_200,f_auto,q_auto/");
}

export function getAlbumCoverUrl(url: string | null): string | null {
  if (!url) return null;
  return url.replace("/upload/", "/upload/c_fill,w_600,h_600,f_auto,q_auto/");
}
