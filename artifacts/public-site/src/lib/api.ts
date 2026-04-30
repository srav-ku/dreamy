import { useQuery } from "@tanstack/react-query";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

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

async function fetchApi<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`);
  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }
  return res.json();
}

export function useListPersons() {
  return useQuery<Person[]>({
    queryKey: ["persons"],
    queryFn: () => fetchApi("/api/persons"),
  });
}

export function usePersonFull(slug: string) {
  return useQuery<PersonFull>({
    queryKey: ["person", slug],
    queryFn: () => fetchApi(`/api/person/${slug}/full`),
    enabled: !!slug,
  });
}

export function useImages(albumSlug: string) {
  return useQuery<Image[]>({
    queryKey: ["images", albumSlug],
    queryFn: () => fetchApi(`/api/images/${albumSlug}`),
    enabled: !!albumSlug,
  });
}

export function useSearch(q: string) {
  return useQuery<Person[]>({
    queryKey: ["search", q],
    queryFn: () => fetchApi(`/api/search?q=${encodeURIComponent(q)}`),
    enabled: q.trim().length > 0,
  });
}
