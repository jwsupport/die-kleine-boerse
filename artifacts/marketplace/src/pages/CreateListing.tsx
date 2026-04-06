import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useCreateListing, useCreateCategoryCheckout } from "@workspace/api-client-react";
import { useAuth } from "@workspace/replit-auth-web";
import { Navbar } from "@/components/layout/Navbar";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { SEO } from "@/components/seo/SEO";
import { CATEGORIES, categoryByLabel } from "@/lib/categories";
import { ShieldCheck, Zap, Check, Loader2, Video } from "lucide-react";
import { ImageUploader } from "@/components/ImageUploader";
import { useT, getCatLabel } from "@/lib/i18n";

export function CreateListing() {
  const t = useT();
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const createListing = useCreateListing();
  const createCategoryCheckout = useCreateCategoryCheckout();
  const { user, isAuthenticated, login } = useAuth();

  const [formData, setFormData] = useState({
    title: "",
    price: "",
    isNegotiable: false,
    category: "",
    location: "",
    description: "",
    imageUrls: [] as string[],
    videoUrl: "",
    isSilent: false,
  });

  const [selectedTier, setSelectedTier] = useState<"free" | "boost">("free");
  const [isBusiness, setIsBusiness] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    fetch(`${import.meta.env.BASE_URL.replace(/\/+$/, "")}/api/profiles/${user.id}`, { credentials: "include" })
      .then(r => r.ok ? r.json() : null)
      .then(p => { if (p?.isBusiness) setIsBusiness(true); })
      .catch(() => {});
  }, [user?.id]);

  const selectedCategory = categoryByLabel[formData.category];
  const categoryFee = selectedCategory?.fee ?? 0;
  const isBoost = selectedTier === "boost" && categoryFee === 0;
  const fee = isBoost ? 1.00 : categoryFee;
  const requiresPayment = fee > 0;
  const showTierPicker = formData.category !== "" && categoryFee === 0;
  const priceNum = Number(formData.price);
  const needsVideoProof = priceNum >= 500;

  const field = <K extends keyof typeof formData>(key: K) => ({
    value: formData[key] as string,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setFormData((p) => ({ ...p, [key]: e.target.value })),
  });

  const base = import.meta.env.BASE_URL.replace(/\/+$/, "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated || !user) {
      login();
      return;
    }

    if (!formData.title || !formData.price || !formData.category || !formData.location) {
      toast({
        title: t.create_required,
        description: t.create_requiredDesc,
        variant: "destructive",
      });
      return;
    }

    if (needsVideoProof && !formData.videoUrl.trim()) {
      toast({
        title: "Video-Proof erforderlich",
        description: "Für Objekte über 500 € ist ein Video-Proof-Link notwendig.",
        variant: "destructive",
      });
      return;
    }

    createListing.mutate(
      {
        data: {
          sellerId: user.id,
          title: formData.title,
          price: priceNum,
          isNegotiable: formData.isNegotiable,
          category: formData.category,
          location: formData.location,
          description: formData.description || null,
          imageUrls: formData.imageUrls,
          boostTier: isBoost ? "boost" : undefined,
          videoUrl: formData.videoUrl.trim() || undefined,
          isSilent: formData.isSilent,
        } as any,
      },
      {
        onSuccess: (newListing) => {
          if ((newListing as any).status === "pending_video") {
            toast({
              title: "Video-Proof eingereicht",
              description: "Deine Anzeige wird nach Prüfung des Videos freigeschaltet.",
            });
            setLocation("/my-ads");
          } else if (newListing.paymentStatus === "pending") {
            setLocation(`/pay/${newListing.id}`);
          } else {
            toast({ title: t.create_success, description: t.create_successDesc });
            setLocation(`/listings/${newListing.id}`);
          }
        },
        onError: () => {
          toast({ title: t.create_error, description: t.create_errorDesc, variant: "destructive" });
        },
      }
    );
  };

  const isSubmitting = createListing.isPending || createCategoryCheckout.isPending;

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      <SEO title="Anzeige aufgeben" description="Verkaufe dein Objekt auf Die kleine Börse — einfach, sicher und kostenlos." />
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-12 max-w-2xl">
        <div className="mb-10">
          <h1 className="text-3xl font-light text-slate-900 mb-2">{t.create_pageTitle}</h1>
          <p className="text-slate-500 text-sm">{t.create_pageSubtitle}</p>
        </div>

        <div className="bg-white border border-slate-100 rounded-3xl shadow-sm p-8 md:p-10">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-xs uppercase tracking-widest text-slate-400 mb-2 font-semibold">
                {t.create_titleLabel} *
              </label>
              <input
                type="text"
                required
                className="w-full p-4 bg-slate-50 border border-transparent rounded-xl focus:ring-2 focus:ring-slate-200 outline-none transition-all text-slate-900 placeholder:text-slate-400"
                placeholder={t.create_titlePlaceholder}
                {...field("title")}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs uppercase tracking-widest text-slate-400 mb-2 font-semibold">
                  {t.create_priceLabel} *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  className="w-full p-4 bg-slate-50 border border-transparent rounded-xl focus:ring-2 focus:ring-slate-200 outline-none text-slate-900 placeholder:text-slate-400"
                  placeholder="0.00"
                  {...field("price")}
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-slate-400 mb-2 font-semibold">
                  {t.create_categoryLabel} *
                </label>
                <select
                  required
                  className="w-full p-4 bg-slate-50 border border-transparent rounded-xl focus:ring-2 focus:ring-slate-200 outline-none text-slate-900"
                  value={formData.category}
                  onChange={(e) => setFormData((p) => ({ ...p, category: e.target.value }))}
                >
                  <option value="" disabled>{t.create_categorySelect}</option>
                  {CATEGORIES.map((c) => (
                    <option key={c.id} value={c.label}>
                      {getCatLabel(c.id, t)}{c.fee > 0 ? ` — €${c.fee.toFixed(2)}` : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs uppercase tracking-widest text-slate-400 mb-2 font-semibold">
                  {t.create_locationLabel} *
                </label>
                <input
                  type="text"
                  required
                  className="w-full p-4 bg-slate-50 border border-transparent rounded-xl focus:ring-2 focus:ring-slate-200 outline-none text-slate-900 placeholder:text-slate-400"
                  placeholder={t.create_locationPlaceholder}
                  {...field("location")}
                />
              </div>
              <div className="flex items-center gap-3 pt-8">
                <Switch
                  id="negotiable"
                  checked={formData.isNegotiable}
                  onCheckedChange={(checked) => setFormData((p) => ({ ...p, isNegotiable: checked }))}
                />
                <label htmlFor="negotiable" className="text-sm text-slate-600 cursor-pointer select-none">
                  {t.create_negotiable}
                </label>
              </div>
            </div>

            {/* Description */}
            <div>
              <div className="mb-2">
                <label className="block text-xs uppercase tracking-widest text-slate-400 font-semibold">
                  {t.create_descriptionLabel}
                </label>
              </div>
              <textarea
                rows={5}
                className="w-full p-4 bg-slate-50 border border-transparent rounded-xl focus:ring-2 focus:ring-slate-200 outline-none resize-none text-slate-900 placeholder:text-slate-400"
                placeholder={t.create_descriptionPlaceholder}
                {...field("description")}
              />
            </div>

            <ImageUploader
              value={formData.imageUrls}
              onChange={(urls) => setFormData((p) => ({ ...p, imageUrls: urls }))}
              maxImages={isBusiness ? 8 : 4}
            />

            {/* Video-Proof — shown when price ≥ €500 */}
            {needsVideoProof && (
              <div className="p-6 bg-blue-50 rounded-3xl border border-blue-100 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <Video className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest font-bold text-blue-600 mb-1">Sicherheits-Check Aktiv</p>
                    <p className="text-sm text-slate-700 leading-relaxed">
                      Objekte über 500 € erfordern einen <strong>Video-Proof</strong>. Nimm ein kurzes Video (max. 10 s) auf,
                      in dem das Objekt und ein Zettel mit der Aufschrift <strong>"Die kleine Börse"</strong> zu sehen sind.
                      Lade es auf Speed.it hoch und füge den Link hier ein. Die Anzeige wird nach manueller Prüfung freigeschaltet.
                    </p>
                  </div>
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-blue-500 mb-2 font-semibold">
                    Video-Link (Speed.it o.ä.) *
                  </label>
                  <input
                    type="url"
                    placeholder="https://speed.it/dein-video"
                    value={formData.videoUrl}
                    onChange={(e) => setFormData((p) => ({ ...p, videoUrl: e.target.value }))}
                    className="w-full p-4 bg-white border border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-200 outline-none text-slate-900 placeholder:text-slate-400 text-sm"
                  />
                </div>
              </div>
            )}

            {/* Tier picker — free categories get the two-option selector */}
            {formData.category && (
              showTierPicker ? (
                <div className="space-y-3">
                  <p className="text-xs uppercase tracking-widest text-slate-400 font-semibold">
                    {t.create_tierHeading}
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectedTier("free")}
                      className={`relative p-5 rounded-2xl border-2 text-left transition-all ${
                        selectedTier === "free"
                          ? "border-slate-900 bg-slate-50"
                          : "border-slate-100 bg-white hover:border-slate-200"
                      }`}
                    >
                      {selectedTier === "free" && (
                        <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-slate-900 flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </span>
                      )}
                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center mb-3">
                        <ShieldCheck className="w-4 h-4 text-green-600" />
                      </div>
                      <p className="font-semibold text-slate-900 text-sm">{t.create_tierFreeTitle}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{t.create_tierFreeDesc}</p>
                      <p className="text-xl font-light text-slate-900 mt-2">Gratis</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedTier("boost")}
                      className={`relative p-5 rounded-2xl border-2 text-left transition-all ${
                        selectedTier === "boost"
                          ? "border-slate-900 bg-slate-50"
                          : "border-slate-100 bg-white hover:border-slate-200"
                      }`}
                    >
                      <span className="absolute top-3 left-3 text-[9px] uppercase tracking-widest font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                        {t.create_tierBoostBadge}
                      </span>
                      {selectedTier === "boost" && (
                        <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-slate-900 flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </span>
                      )}
                      <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center mb-3 mt-5">
                        <Zap className="w-4 h-4 text-amber-600" />
                      </div>
                      <p className="font-semibold text-slate-900 text-sm">{t.create_tierBoostTitle}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{t.create_tierBoostDesc}</p>
                      <p className="text-xl font-light text-slate-900 mt-2">€1,00</p>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex justify-between items-center">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 rounded-full p-1.5 bg-amber-100">
                        <Zap className="w-3.5 h-3.5 text-amber-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900 uppercase tracking-wider">
                          {t.create_feeLabel}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">{t.create_paidValid}</p>
                      </div>
                    </div>
                    <div className="text-2xl font-light text-slate-900">
                      €{fee.toFixed(2).replace(".", ",")}
                    </div>
                  </div>
                </div>
              )
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setLocation("/")}
                className="flex-1 py-4 rounded-2xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 transition-all text-sm"
              >
                {t.create_cancel}
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-4 rounded-2xl bg-slate-900 text-white font-medium hover:bg-slate-800 transition-all disabled:bg-slate-300 text-sm"
              >
                {isSubmitting
                  ? <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                  : requiresPayment
                    ? `${t.create_submit} — €${fee.toFixed(2)}`
                    : needsVideoProof
                      ? "Anzeige + Video einreichen"
                      : t.create_submit}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
