export async function uploadToCloudinary(
  file: File,
  onProgress?: (pct: number) => void
): Promise<{ image_url: string; thumbnail_url: string }> {
  return new Promise((resolve, reject) => {
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      reject(new Error("Cloudinary credentials missing"));
      return;
    }

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
        reject(new Error(`Cloudinary upload failed: ${xhr.statusText}`));
      }
    });

    xhr.addEventListener("error", () => {
      reject(new Error("Network error during Cloudinary upload"));
    });

    xhr.open("POST", url, true);
    xhr.send(formData);
  });
}
