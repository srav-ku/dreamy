import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useLocation } from "wouter";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

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

// Fetch wrapper
async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem("admin_token");
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options.headers,
  };
  
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    localStorage.removeItem("admin_token");
    window.location.href = import.meta.env.BASE_URL.replace(/\/$/, "") + "/";
    throw new Error("Unauthorized");
  }

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(err.error || `HTTP error ${response.status}`);
  }

  return response.json();
}

// Hooks
export function useLogin() {
  const [, setLocation] = useLocation();
  return useMutation({
    mutationFn: async (password: string) => {
      const res = await apiFetch<{ token: string }>("/api/admin/login", {
        method: "POST",
        body: JSON.stringify({ password }),
      });
      return res.token;
    },
    onSuccess: (token) => {
      localStorage.setItem("admin_token", token);
      setLocation("/persons");
    },
    onError: (err: any) => {
      toast.error(err.message || "Login failed");
    }
  });
}

export function useListPersons() {
  return useQuery({
    queryKey: ["persons"],
    queryFn: () => apiFetch<Person[]>("/api/persons"),
  });
}

export function usePerson(id: string | number) {
  const { data: persons } = useListPersons();
  const person = persons?.find((p) => p.id === Number(id));
  
  return useQuery({
    queryKey: ["person", person?.slug],
    queryFn: () => apiFetch<PersonFull>(`/api/person/${person?.slug}/full`),
    enabled: !!person?.slug,
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
  const [, setLocation] = useLocation();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: { name?: string; bio?: string; profile_image?: string } }) => 
      apiFetch<Person>(`/api/admin/person/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["persons"] });
      toast.success("Person updated");
      setLocation("/persons");
    },
    onError: (err: any) => toast.error(err.message),
  });
}

export function useListAlbums(personSlug: string) {
  return useQuery({
    queryKey: ["albums", personSlug],
    queryFn: () => apiFetch<Album[]>(`/api/albums/${personSlug}`),
    enabled: !!personSlug,
  });
}

export function useCreateAlbum() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { person_id: number; name: string }) => 
      apiFetch<Album>("/api/admin/album", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: (album) => {
      queryClient.invalidateQueries({ queryKey: ["person"] });
      queryClient.invalidateQueries({ queryKey: ["albums"] });
      toast.success("Album created");
    },
    onError: (err: any) => toast.error(err.message),
  });
}

export function useListImages(albumSlug: string) {
  return useQuery({
    queryKey: ["images", albumSlug],
    queryFn: () => apiFetch<Image[]>(`/api/images/${albumSlug}`),
    enabled: !!albumSlug,
  });
}

export function useCreateImages() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { album_id: number; images: Array<{ image_url: string; thumbnail_url: string }> }) => 
      apiFetch<Image[]>("/api/admin/images", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["images"] });
      toast.success("Images uploaded");
    },
    onError: (err: any) => toast.error(err.message),
  });
}
