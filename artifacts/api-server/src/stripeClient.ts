import Stripe from "stripe";
import { StripeSync } from "stripe-replit-sync";

let stripeSyncInstance: StripeSync | null = null;

async function resolveStripeSecretKey(): Promise<string> {
  try {
    const resp = await fetch(
      `https://replit.com/api/v1/repl/stripe/${process.env.REPL_ID}`,
      { headers: { "X-Requested-With": "replit-stripe" } },
    );
    if (resp.ok) {
      const json = (await resp.json()) as { data?: { secretKey?: string } };
      if (json.data?.secretKey) return json.data.secretKey;
    }
  } catch {
    // ignore — fall through to env var
  }
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("Stripe secret key not configured");
  return key;
}

export async function getUncachableStripeClient(): Promise<Stripe> {
  const secretKey = await resolveStripeSecretKey();
  return new Stripe(secretKey, { apiVersion: "2026-03-25.dahlia" });
}

export async function getStripeSync(): Promise<StripeSync> {
  if (!stripeSyncInstance) {
    const stripeSecretKey = await resolveStripeSecretKey();
    stripeSyncInstance = new StripeSync({
      stripeSecretKey,
      poolConfig: { connectionString: process.env.DATABASE_URL! },
    });
  }
  return stripeSyncInstance;
}
