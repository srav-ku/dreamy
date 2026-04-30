export function getProfileImageUrl(url: string | null): string | null {
  if (!url) return null;
  // Insert transformation after /upload/
  return url.replace("/upload/", "/upload/c_fill,g_face,w_200,h_200,f_auto,q_auto/");
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();
}
