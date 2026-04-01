import Stripe from "stripe";
import { StripeSync } from "stripe-replit-sync";

let stripeSyncInstance: StripeSync | null = null;

export async function getUncachableStripeClient(): Promise<Stripe> {
  const { data } = await fetch(
    `https://replit.com/api/v1/repl/stripe/${process.env.REPL_ID}`,
    { headers: { "X-Requested-With": "replit-stripe" } },
  )
    .then((r) => r.json())
    .catch(() => ({ data: null }));

  const secretKey = data?.secretKey ?? process.env.STRIPE_SECRET_KEY;
  if (!secretKey) throw new Error("Stripe secret key not configured");

  return new Stripe(secretKey, { apiVersion: "2025-03-31.basil" });
}

export async function getStripeSync(): Promise<StripeSync> {
  if (!stripeSyncInstance) {
    const stripe = await getUncachableStripeClient();
    stripeSyncInstance = new StripeSync(stripe, process.env.DATABASE_URL!);
  }
  return stripeSyncInstance;
}
