export * from "./generated/api";
export * from "./generated/api.schemas";
export { setBaseUrl, setAuthTokenGetter } from "./custom-fetch";
export type { AuthTokenGetter } from "./custom-fetch";
export {
  getFavouriteIdsQueryKey,
  getFavouritesQueryKey,
  useGetFavouriteIds,
  useGetFavourites,
  useAddFavourite,
  useRemoveFavourite,
  useAdminGetRevenue,
  useAdminGetPayments,
  useUpdateProfile,
} from "./custom-hooks";
