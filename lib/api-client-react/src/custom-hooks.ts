import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { customFetch } from "./custom-fetch";

type Listing = {
  id: string;
  title: string;
  price: number;
  category: string;
  location: string;
  imageUrls: string[];
  status: string;
  createdAt: string;
  [key: string]: unknown;
};

type RevenueItem = { month: string; revenue: number };
type PaymentItem = { id: string; title: string; category: string; amount: number; paidAt: string };

type UpdateProfileVars = {
  id: string;
  body: {
    fullName?: string | null;
    username?: string | null;
    isBusiness?: boolean;
    companyName?: string | null;
    vatId?: string | null;
    setupComplete?: boolean;
    street?: string | null;
    postalCode?: string | null;
    city?: string | null;
    country?: string | null;
    phone?: string | null;
    website?: string | null;
  };
};

export function getFavouriteIdsQueryKey() {
  return ["/favourites/ids"] as const;
}

export function getFavouritesQueryKey() {
  return ["/favourites"] as const;
}

export function useGetFavouriteIds(options?: { query?: Partial<Parameters<typeof useQuery>[0]> }) {
  return useQuery<string[]>({
    queryKey: getFavouriteIdsQueryKey(),
    queryFn: async () => customFetch<string[]>("/api/favourites/ids", { method: "GET" }),
    ...options?.query,
  });
}

export function useGetFavourites(options?: { query?: Partial<Parameters<typeof useQuery>[0]> }) {
  return useQuery<Listing[]>({
    queryKey: getFavouritesQueryKey(),
    queryFn: async () => customFetch<Listing[]>("/api/favourites", { method: "GET" }),
    ...options?.query,
  });
}

export function useAddFavourite() {
  return useMutation<void, Error, string>({
    mutationFn: async (listingId: string) => {
      await customFetch("/api/favourites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId }),
      });
    },
  });
}

export function useRemoveFavourite() {
  return useMutation<void, Error, string>({
    mutationFn: async (listingId: string) => {
      await customFetch(`/api/favourites/${listingId}`, { method: "DELETE" });
    },
  });
}

export function useAdminGetRevenue(year?: number) {
  return useQuery<RevenueItem[]>({
    queryKey: ["/admin/revenue", year],
    queryFn: async () => {
      const url = year ? `/api/admin/revenue?year=${year}` : "/api/admin/revenue";
      return customFetch<RevenueItem[]>(url, { method: "GET" });
    },
  });
}

export function useAdminGetPayments(year?: number) {
  return useQuery<PaymentItem[]>({
    queryKey: ["/admin/payments", year],
    queryFn: async () => {
      const url = year ? `/api/admin/payments?year=${year}` : "/api/admin/payments";
      return customFetch<PaymentItem[]>(url, { method: "GET" });
    },
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation<{ ok: boolean }, Error, UpdateProfileVars>({
    mutationFn: async ({ id, body }) => {
      return customFetch<{ ok: boolean }>(`/api/profiles/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    },
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: [`/api/profiles/${id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/profiles", id] });
    },
  });
}
