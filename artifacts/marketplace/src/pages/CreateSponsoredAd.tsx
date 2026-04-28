import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@workspace/replit-auth-web";
import { Megaphone, ExternalLink, Loader2, ImageIcon, X, CheckCircle2, AlertCircle } from "lucide-react";

interface MyAd {
  id: string;
  title: string;
  description?: string;
  imageUrl?: string;
  targetUrl: string;
  status: string;
  paymentStatus: string;
  adminNote?: string;
  createdAt: string;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: "Ausstehend", color: "bg-amber-100 text-amber-700" },
  approved: { label: "Freigegeben", color: "bg-green-100 text-green-700" },
  rejected: { label: "Abgelehnt", color: "bg-red-100 text-red-700" },
};

const PAYMENT_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: "Zahlung ausstehend", color: "text-amber-600" },
  paid: { label: "Bezahlt", color: "text-green-600" },
};

export function CreateSponsoredAd() {
  const { user, isAuthenticated, isLoading: authLoading, login } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageStatus, setImageStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [targetUrl, setTargetUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [myAds, setMyAds] = useState<MyAd[]>([]);
  const [loadingAds, setLoadingAds] = useState(false);

  const base = import.meta.env.BASE_URL.replace(/\/+$/, "");

  const fetchMyAds = async () => {
    setLoadingAds(true);
    try {
      const res = await fetch(`${base}/api/sponsored-ads/my`, { credentials: "include" });
      if (res.ok) setMyAds(await res.json());
    } finally {
      setLoadingAds(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) fetchMyAds();
  }, [isAuthenticated]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const adId = params.get("adId");
    if (params.get("payment") === "success" && adId) {
      toast({ title: "Zahlung erfolgreich!", description: "Ihre Anzeige wird nach Admin-Prüfung freigeschaltet." });
      window.history.replaceState({}, "", "/ads/create");
      fetchMyAds();
    }
    if (params.get("payment") === "cancelled") {
      toast({ title: "Zahlung abgebrochen", variant: "destructive" });
      window.history.replaceState({}, "", "/ads/create");
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !targetUrl.trim()) return;
    setSubmitting(true);

    try {
      const res = await fetch(`${base}/api/sponsored-ads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ title, description, imageUrl, targetUrl }),
      });

      if (!res.ok) {
        const err = await res.json();
        toast({ title: "Fehler", description: err.error ?? "Unbekannter Fehler", variant: "destructive" });
        setSubmitting(false);
        return;
      }

      const data = await res.json();
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    } catch {
      toast({ title: "Netzwerkfehler", variant: "destructive" });
      setSubmitting(false);
    }
  };

  if (!authLoading && !isAuthenticated) {
    return (
      <div className="min-h-[100dvh] flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 flex flex-col items-center justify-center text-center px-4 py-24">
          <Megaphone className="w-12 h-12 text-slate-200 mb-6" strokeWidth={1.5} />
          <h1 className="text-2xl font-medium text-slate-900 mb-3">Werbung schalten</h1>
          <p className="text-slate-500 mb-8 max-w-md">Melden Sie sich an und schalten Sie als Gewerbekunde Ihre Werbung auf der Startseite.</p>
          <Button onClick={login} className="bg-slate-900 hover:bg-slate-800">Anmelden</Button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 md:px-8 py-8 md:py-14 max-w-5xl">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-3">
            <Megaphone className="w-3.5 h-3.5" />
            Gewerbekunden
          </div>
          <h1 className="text-3xl md:text-4xl font-medium tracking-tight text-slate-900 mb-2">
            Werbung schalten
          </h1>
          <p className="text-slate-500 text-sm max-w-xl">
            Schalten Sie Ihre Werbeanzeige auf der Startseite. Nach Prüfung durch unser Admin-Team wird Ihre Anzeige live geschaltet.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Form */}
          <div>
            {/* Price box */}
            <div className="border border-slate-200 rounded-sm p-5 bg-slate-50 mb-6 flex items-start gap-4">
              <div className="flex-1">
                <p className="font-semibold text-slate-900 mb-0.5">Werbeplatz Startseite</p>
                <p className="text-sm text-slate-500">Ihre Anzeige erscheint prominent in der rechten Spalte der Startseite.</p>
                <ul className="mt-2 space-y-1 text-xs text-slate-500">
                  <li>✓ Logo / Bild Ihrer Wahl</li>
                  <li>✓ Eigener Titel und Beschreibung</li>
                  <li>✓ Direkter Link zu Ihrer Website</li>
                  <li>✓ Admin-geprüft und freigegeben</li>
                </ul>
              </div>
              <div className="text-right shrink-0">
                <p className="text-2xl font-semibold text-slate-900">€49,00</p>
                <p className="text-xs text-slate-400">einmalig</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="title" className="text-sm font-medium text-slate-700">
                  Anzeigentitel <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="title"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="z.B. Malerarbeiten München – faire Preise"
                  maxLength={80}
                  required
                />
                <p className="text-xs text-slate-400">{title.length}/80</p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="description" className="text-sm font-medium text-slate-700">
                  Kurzbeschreibung
                </Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Kurze Beschreibung Ihres Angebots (optional)"
                  rows={3}
                  maxLength={200}
                  className="resize-none text-sm"
                />
                <p className="text-xs text-slate-400">{description.length}/200</p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="imageUrl" className="text-sm font-medium text-slate-700">
                  Bild-URL <span className="text-slate-400 font-normal">(Logo oder Foto)</span>
                </Label>
                <div className="relative">
                  <Input
                    id="imageUrl"
                    value={imageUrl}
                    onChange={e => {
                      const val = e.target.value;
                      setImageUrl(val);
                      setImageStatus(val.trim() ? "loading" : "idle");
                    }}
                    placeholder="https://example.com/logo.png"
                    type="url"
                    className="pr-10"
                  />
                  {imageUrl && (
                    <button
                      type="button"
                      onClick={() => { setImageUrl(""); setImageStatus("idle"); }}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-600 transition-colors"
                      title="URL entfernen"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <p className="text-xs text-slate-400">
                  Empfohlen: min. 800 × 300 px, JPG oder PNG. Das Bild erscheint in der Werbeleiste auf der Startseite.
                </p>

                {/* Preview area */}
                {imageUrl && (
                  <div className="mt-3 border border-slate-200 rounded-sm overflow-hidden bg-slate-50">
                    <div className="flex items-center gap-2 px-3 py-1.5 border-b border-slate-100 bg-white">
                      <ImageIcon className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-[11px] text-slate-400 uppercase tracking-widest font-medium">Vorschau</span>
                      {imageStatus === "ok" && <CheckCircle2 className="w-3.5 h-3.5 text-green-500 ml-auto" />}
                      {imageStatus === "error" && <AlertCircle className="w-3.5 h-3.5 text-red-400 ml-auto" />}
                      {imageStatus === "loading" && <Loader2 className="w-3.5 h-3.5 text-slate-300 ml-auto animate-spin" />}
                    </div>
                    <div className="w-full aspect-[16/7] bg-slate-100 relative">
                      {imageStatus === "error" ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-slate-400">
                          <AlertCircle className="w-6 h-6 text-slate-300" />
                          <p className="text-xs">Bild konnte nicht geladen werden</p>
                          <p className="text-[10px] text-slate-300">Prüfe die URL oder ob das Bild öffentlich zugänglich ist</p>
                        </div>
                      ) : (
                        <img
                          src={imageUrl}
                          alt="Vorschau"
                          className="w-full h-full object-cover"
                          onLoad={() => setImageStatus("ok")}
                          onError={() => setImageStatus("error")}
                        />
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="targetUrl" className="text-sm font-medium text-slate-700">
                  Ziel-URL <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="targetUrl"
                  value={targetUrl}
                  onChange={e => setTargetUrl(e.target.value)}
                  placeholder="https://ihre-website.de"
                  type="url"
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={submitting || !title.trim() || !targetUrl.trim()}
                className="w-full bg-slate-900 hover:bg-slate-800 h-12 text-sm font-medium gap-2"
              >
                {submitting ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Weiterleitung zu Stripe…</>
                ) : (
                  <>Jetzt buchen &amp; bezahlen — €49,00</>
                )}
              </Button>
              <p className="text-xs text-slate-400 text-center">Sichere Zahlung über Stripe. Nach Prüfung wird Ihre Anzeige freigeschaltet.</p>
            </form>
          </div>

          {/* My Ads */}
          <div>
            <h2 className="text-lg font-medium text-slate-900 mb-4">Meine Werbeanzeigen</h2>

            {loadingAds ? (
              <div className="space-y-3">
                {[1, 2].map(i => <div key={i} className="h-24 bg-slate-100 rounded-sm animate-pulse" />)}
              </div>
            ) : myAds.length === 0 ? (
              <div className="py-12 text-center text-slate-400 border border-dashed border-slate-200 rounded-sm">
                <Megaphone className="w-8 h-8 mx-auto mb-3 text-slate-200" strokeWidth={1.5} />
                <p className="text-sm">Noch keine Anzeigen gebucht</p>
              </div>
            ) : (
              <div className="space-y-3">
                {myAds.map(ad => {
                  const statusMeta = STATUS_LABELS[ad.status] ?? STATUS_LABELS.pending;
                  const payMeta = PAYMENT_LABELS[ad.paymentStatus] ?? PAYMENT_LABELS.pending;
                  return (
                    <div key={ad.id} className="border border-slate-200 rounded-sm p-4 space-y-2.5 bg-white">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-medium text-sm text-slate-900 leading-tight">{ad.title}</h3>
                        <span className={`shrink-0 text-[10px] px-2 py-0.5 rounded-full font-medium ${statusMeta.color}`}>
                          {statusMeta.label}
                        </span>
                      </div>

                      {ad.imageUrl && (
                        <div className="w-full aspect-[16/6] bg-slate-100 rounded-sm overflow-hidden">
                          <img src={ad.imageUrl} alt={ad.title} className="w-full h-full object-cover" />
                        </div>
                      )}

                      {ad.description && <p className="text-xs text-slate-500">{ad.description}</p>}

                      <div className="flex items-center justify-between gap-2 pt-1">
                        <span className={`text-[11px] font-medium ${payMeta.color}`}>{payMeta.label}</span>
                        <a href={ad.targetUrl} target="_blank" rel="noopener noreferrer" className="text-[11px] text-slate-400 hover:text-slate-700 flex items-center gap-1">
                          <ExternalLink className="w-3 h-3" /> Link öffnen
                        </a>
                      </div>

                      {ad.adminNote && (
                        <div className="bg-amber-50 border border-amber-100 rounded-sm px-3 py-2 text-xs text-amber-700">
                          <span className="font-semibold">Admin-Notiz:</span> {ad.adminNote}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
