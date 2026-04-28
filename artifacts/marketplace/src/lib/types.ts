import type { Profile } from "@workspace/api-client-react";

export interface FullProfile extends Profile {
  isBusiness?: boolean;
  isVerified?: boolean;
  setupComplete?: boolean;
  companyName?: string | null;
  vatId?: string | null;
  street?: string | null;
  postalCode?: string | null;
  city?: string | null;
  country?: string | null;
  phone?: string | null;
  website?: string | null;
}
