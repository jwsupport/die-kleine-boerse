import * as zod from "zod";

export const UpdateProfileParams = zod.object({
  id: zod.string(),
});

export const UpdateProfileBody = zod.object({
  fullName: zod.string().nullish(),
  username: zod.string().nullish(),
  isBusiness: zod.boolean().optional(),
  companyName: zod.string().nullish(),
  vatId: zod.string().nullish(),
  setupComplete: zod.boolean().optional(),
  street: zod.string().nullish(),
  postalCode: zod.string().nullish(),
  city: zod.string().nullish(),
  country: zod.string().nullish(),
  phone: zod.string().nullish(),
  website: zod.string().nullish(),
});

export const UpdateProfileResponse = zod.object({
  ok: zod.boolean(),
});

export const AdminGetRevenueQueryParams = zod.object({
  year: zod.string().optional(),
});

export const AdminGetRevenueResponseItem = zod.object({
  month: zod.string(),
  revenue: zod.number(),
});

export const AdminGetRevenueResponse = zod.array(AdminGetRevenueResponseItem);

export const AdminGetPaymentsQueryParams = zod.object({
  year: zod.string().optional(),
});

export const AdminGetPaymentsResponseItem = zod.object({
  id: zod.string(),
  title: zod.string(),
  category: zod.string(),
  amount: zod.number(),
  paidAt: zod.string(),
});

export const AdminGetPaymentsResponse = zod.array(AdminGetPaymentsResponseItem);
