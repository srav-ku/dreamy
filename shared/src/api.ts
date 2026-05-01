import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useLocation } from "wouter";

const rawBaseUrl = (import.meta.env.VITE_API_BASE_URL || "").trim();

function resolveBaseUrl() {
  if (!rawBaseUrl) return "";

  // Prevent production deployments from accidentally calling local dev backends.
  if (typeof window !== "undefined") {
    const isLocalHost = ["localhost", "127.0.0.1"].includes(window.location.hostname);
    const pointsToLocalBackend = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i.test(rawBaseUrl);

    if (!isLocalHost && pointsToLocalBackend) {
      console.warn(
        `Ignoring VITE_API_BASE_URL=${rawBaseUrl} on host ${window.location.hostname}. ` +
          "Set VITE_API_BASE_URL to your deployed Cloudflare Worker URL and redeploy.",
      );
      return "";
    }
  }

  return rawBaseUrl.replace(/\/$/, "");
}

const BASE_URL = resolveBaseUrl();

// Types
export type Person = {
  id: number;
  name: string;
  slug: string;
  profile_image: string | null;
  bio: string | null;
  created_at: string;
  updated_at: string;
};

export type Album = {
  id: number;
  person_id: number;
  name: string;
  slug: string;
  cover_image: string | null;
  image_count: number;
};

export type Image = {
  id: number;
  album_id: number;
  image_url: string;
  thumbnail_url: string;
  order_index: number;
  created_at: string;
};

export type PersonFull = Person & {
  albums: Album[];
};

export type SearchResults = {
  persons: Person[];
  albums: Array<Album & { person_slug: string; person_name: string }>;
};

// Fetch wrapper
async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem("admin_token");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };
  
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  let response: Response;

  try {
    response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });
  } catch (error) {
    const hint =
      BASE_URL
        ? `Network request failed for ${BASE_URL}${endpoint}.`
        : "Network request failed for relative API path.";

    throw new Error(
      `${hint} Check VITE_API_BASE_URL. In Cloudflare Pages, set it to your deployed Worker URL and redeploy.`,
    );
  }

  if (response.status === 401 && token) {
    localStorage.removeItem("admin_token");
    window.location.href = "/"; // Redirect to login
    throw new Error("Unauthorized");
  }

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(err.error || `HTTP error ${response.status}`);
  }

  return response.json();
}

// --- Public Hooks ---

export function useListPersons() {
  return useQuery({
    queryKey: ["persons"],
    queryFn: () => apiFetch<Person[]>("/api/persons"),
  });
}

export function usePersonFull(slug: string) {
  return useQuery({
    queryKey: ["person-full", slug],
    queryFn: () => apiFetch<PersonFull>(`/api/person/${slug}/full`),
    enabled: !!slug,
  });
}

export function useImages(albumSlug: string) {
  return useQuery({
    queryKey: ["images", albumSlug],
    queryFn: () => apiFetch<Image[]>(`/api/images/${albumSlug}`),
    enabled: !!albumSlug,
  });
}

export function useSearch(q: string) {
  return useQuery({
    queryKey: ["search", q],
    queryFn: () => apiFetch<SearchResults>(`/api/search?q=${encodeURIComponent(q)}`),
    enabled: q.trim().length > 0,
  });
}

// --- Admin Hooks ---

export function useAdminPerson(id: string | number) {
  return useQuery({
    queryKey: ["admin-person", id],
    queryFn: () => apiFetch<PersonFull>(`/api/admin/person/${id}`),
    enabled: !!id,
  });
}

export function useAdminAlbum(id: string | number) {
  return useQuery({
    queryKey: ["admin-album", id],
    queryFn: () => apiFetch<Album & { person_slug: string }>(`/api/admin/album/${id}`),
    enabled: !!id,
  });
}

export function useCreatePerson() {
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  return useMutation({
    mutationFn: (data: { name: string; bio?: string; profile_image?: string }) => 
      apiFetch<Person>("/api/admin/person", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["persons"] });
      toast.success("Person created");
      setLocation("/persons");
    },
    onError: (err: any) => toast.error(err.message),
  });
}

export function useUpdatePerson() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: { name?: string; bio?: string; profile_image?: string } }) => 
      apiFetch<Person>(`/api/admin/person/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    onSuccess: (person) => {
      queryClient.invalidateQueries({ queryKey: ["persons"] });
      queryClient.invalidateQueries({ queryKey: ["admin-person", person.id] });
      toast.success("Person updated");
    },
    onError: (err: any) => toast.error(err.message),
  });
}

export function useDeletePerson() {
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  return useMutation({
    mutationFn: (id: number) => apiFetch(`/api/admin/person/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["persons"] });
      toast.success("Person deleted");
      setLocation("/persons");
    },
    onError: (err: any) => toast.error(err.message),
  });
}

export function useCreateAlbum() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { person_id: number; name: string }) => 
      apiFetch<Album>("/api/admin/album", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: (album) => {
      queryClient.invalidateQueries({ queryKey: ["admin-person", album.person_id] });
      toast.success("Album created");
    },
    onError: (err: any) => toast.error(err.message),
  });
}

export function useUpdateAlbum() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) => 
      apiFetch<Album>(`/api/admin/album/${id}`, { method: "PUT", body: JSON.stringify({ name }) }),
    onSuccess: (album) => {
      queryClient.invalidateQueries({ queryKey: ["admin-album", album.id] });
      queryClient.invalidateQueries({ queryKey: ["admin-person"] });
      toast.success("Album updated");
    },
    onError: (err: any) => toast.error(err.message),
  });
}

export function useDeleteAlbum() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiFetch(`/api/admin/album/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-person"] });
      toast.success("Album deleted");
    },
    onError: (err: any) => toast.error(err.message),
  });
}

export function useCreateImages() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { album_id: number; images: Array<{ image_url: string; thumbnail_url: string }> }) => 
      apiFetch<Image[]>("/api/admin/images", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["images"] });
      toast.success("Images uploaded");
    },
    onError: (err: any) => toast.error(err.message),
  });
}

export function useReorderImages() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Array<{ id: number; order_index: number }>) => 
      apiFetch("/api/admin/images/reorder", { method: "PUT", body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["images"] });
    },
    onError: (err: any) => toast.error(err.message),
  });
}

export function useDeleteImage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiFetch(`/api/admin/image/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["images"] });
      toast.success("Image deleted");
    },
    onError: (err: any) => toast.error(err.message),
  });
}
