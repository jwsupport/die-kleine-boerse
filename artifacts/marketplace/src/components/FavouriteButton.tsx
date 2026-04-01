import { Star } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@workspace/replit-auth-web";
import {
  useGetFavouriteIds,
  getFavouriteIdsQueryKey,
  getFavouritesQueryKey,
  useAddFavourite,
  useRemoveFavourite,
} from "@workspace/api-client-react";

interface FavouriteButtonProps {
  listingId: string;
  className?: string;
}

export function FavouriteButton({ listingId, className = "" }: FavouriteButtonProps) {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const { data: ids } = useGetFavouriteIds({
    query: {
      queryKey: getFavouriteIdsQueryKey(),
      enabled: isAuthenticated,
      staleTime: 30_000,
    },
  });

  const addFav = useAddFavourite();
  const removeFav = useRemoveFavourite();

  if (!isAuthenticated) return null;

  const isFavourited = (ids ?? []).includes(listingId);
  const isPending = addFav.isPending || removeFav.isPending;

  const toggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isPending) return;

    const optimisticIds = isFavourited
      ? (ids ?? []).filter((id) => id !== listingId)
      : [...(ids ?? []), listingId];

    queryClient.setQueryData(getFavouriteIdsQueryKey(), optimisticIds);

    if (isFavourited) {
      removeFav.mutate(listingId, {
        onSettled: () => {
          queryClient.invalidateQueries({ queryKey: getFavouriteIdsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getFavouritesQueryKey() });
        },
      });
    } else {
      addFav.mutate(listingId, {
        onSettled: () => {
          queryClient.invalidateQueries({ queryKey: getFavouriteIdsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getFavouritesQueryKey() });
        },
      });
    }
  };

  return (
    <button
      onClick={toggle}
      aria-label={isFavourited ? "Aus Merkliste entfernen" : "Zur Merkliste hinzufügen"}
      className={`flex items-center justify-center w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm shadow-sm transition-all hover:scale-110 active:scale-95 ${className}`}
    >
      <Star
        className={`w-4 h-4 transition-colors ${
          isFavourited ? "fill-amber-400 stroke-amber-400" : "stroke-slate-400"
        }`}
      />
    </button>
  );
}
