import { useState } from "react";
import { useAuth } from "@workspace/replit-auth-web";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetProfileListings,
  getGetProfileListingsQueryKey,
  useDeleteListing,
  useUpdateListing,
} from "@workspace/api-client-react";
import { Navbar } from "@/components/layout/Navbar";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Clock, Zap, Pencil, Trash2, Loader2 } from "lucide-react";
import { useT, getCatLabel } from "@/lib/i18n";
import { formatDistanceToNow, isPast } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { CATEGORIES } from "@/lib/categories";

type ProfileListing = {
  id: string;
  title: string;
  price: number;
  category: string;
  location: string;
  description?: string | null;
  isNegotiable: boolean;
  imageUrls?: string[] | null;
  status: string;
  listingType: string;
  daysAge: number;
  expiryDate?: string | null;
};

export function MyAds() {
  const t = useT();
  const { user, isLoading: authLoading, isAuthenticated, login } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editListing, setEditListing] = useState<ProfileListing | null>(null);
  const [editForm, setEditForm] = useState({
    title: "",
    price: "",
    category: "",
    location: "",
    description: "",
    isNegotiable: false,
  });

  const { data: listings, isLoading: listingsLoading } = useGetProfileListings(
    user?.id ?? "",
    {
      query: {
        queryKey: getGetProfileListingsQueryKey(user?.id ?? ""),
        enabled: !!user?.id,
      },
    }
  );

  const deleteMutation = useDeleteListing();
  const updateMutation = useUpdateListing();

  const BOOST_TIERS = [
    { key: "1d",  label: "Power 1 Tag",   price: "€2,49", days: 1  },
    { key: "2d",  label: "Power 2 Tage",  price: "€5,59", days: 2  },
    { key: "30d", label: "Boost 30 Tage", price: "€15,95", days: 30 },
  ] as const;

  const handleBoost = async (listingId: string, boostTier: string) => {
    try {
      const base = import.meta.env.BASE_URL.replace(/\/+$/, "");
      const res = await fetch(`${base}/api/stripe/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ listingId, boostTier }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast({ title: "Stripe nicht konfiguriert", description: "Zahlung ist noch nicht verfügbar.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Fehler", description: "Checkout konnte nicht gestartet werden.", variant: "destructive" });
    }
  };

  const handleDeleteConfirm = () => {
    if (!deleteId) return;
    deleteMutation.mutate({ id: deleteId }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetProfileListingsQueryKey(user?.id ?? "") });
        toast({ title: t.myAds_deleteSuccess ?? "Anzeige gelöscht" });
        setDeleteId(null);
      },
      onError: () => {
        toast({ title: "Fehler", description: "Anzeige konnte nicht gelöscht werden.", variant: "destructive" });
        setDeleteId(null);
      },
    });
  };

  const openEdit = (listing: ProfileListing) => {
    setEditListing(listing);
    setEditForm({
      title: listing.title,
      price: String(listing.price),
      category: listing.category,
      location: listing.location,
      description: listing.description ?? "",
      isNegotiable: listing.isNegotiable,
    });
  };

  const handleEditSave = () => {
    if (!editListing) return;
    updateMutation.mutate(
      {
        id: editListing.id,
        data: {
          title: editForm.title,
          price: parseFloat(editForm.price),
          category: editForm.category,
          location: editForm.location,
          description: editForm.description,
          isNegotiable: editForm.isNegotiable,
        },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetProfileListingsQueryKey(user?.id ?? "") });
          toast({ title: t.admin_edit_success ?? "Anzeige aktualisiert" });
          setEditListing(null);
        },
        onError: () => {
          toast({ title: "Fehler", description: "Änderungen konnten nicht gespeichert werden.", variant: "destructive" });
        },
      }
    );
  };

  if (authLoading) {
    return (
      <div className="min-h-[100dvh] flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 md:px-8 py-12 max-w-4xl">
          <div className="space-y-4 animate-pulse">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-slate-100 rounded-sm" />
            ))}
          </div>
        </main>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-[100dvh] flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 md:px-8 py-24 max-w-4xl text-center">
          <h1 className="text-2xl font-medium tracking-tight text-slate-900 mb-4">Anmelden um deine Anzeigen zu sehen</h1>
          <p className="text-slate-500 mb-8">Du musst eingeloggt sein, um deine Inserate zu verwalten.</p>
          <Button onClick={login} className="bg-slate-900 hover:bg-slate-800 text-white">
            Anmelden
          </Button>
        </main>
      </div>
    );
  }

  const myListings = listings ?? [];
  const MAX_LISTINGS = 200;
  const activeCount = myListings.filter((l) => l.status === "active").length;
  const usagePct = Math.min((activeCount / MAX_LISTINGS) * 100, 100);
  const usageColor = usagePct >= 90 ? "bg-red-500" : usagePct >= 70 ? "bg-amber-400" : "bg-slate-900";

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 md:px-8 py-10 max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-medium tracking-tight text-slate-900">{t.myAds_title}</h1>
            <p className="text-slate-500 text-sm mt-1">
              {myListings.length} {myListings.length !== 1 ? t.myAds_listings : t.myAds_listing}
            </p>
          </div>
          <Link href="/listings/create">
            <Button className="bg-slate-900 hover:bg-slate-800 text-white gap-2">
              <Plus className="w-4 h-4" />
              {t.myAds_newListing}
            </Button>
          </Link>
        </div>

        {/* 200-slot usage bar */}
        <div className="mb-8 p-5 bg-white border border-slate-100 rounded-2xl shadow-sm">
          <div className="flex justify-between items-baseline mb-2">
            <span className="text-xs uppercase tracking-widest font-semibold text-slate-400">
              {t.myAds_slotsLabel}
            </span>
            <span className="text-sm font-medium text-slate-900">
              {activeCount} <span className="text-slate-400 font-normal">{t.myAds_of} {MAX_LISTINGS}</span>
            </span>
          </div>
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${usageColor}`}
              style={{ width: `${usagePct}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            {activeCount < MAX_LISTINGS
              ? t.myAds_slotsUsage.replace("{n}", String(activeCount)).replace("{max}", String(MAX_LISTINGS))
              : t.myAds_slotsMaxReached}
          </p>
        </div>

        {listingsLoading ? (
          <div className="space-y-3 animate-pulse">
            {[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-slate-100 rounded-sm" />)}
          </div>
        ) : myListings.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <p className="text-lg">{t.myAds_noListings}</p>
            <p className="text-sm mt-2">{t.myAds_noListingsDesc}</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {myListings.map((listing) => {
              const expiresAt = listing.expiryDate ? new Date(listing.expiryDate) : null;
              const expired = expiresAt ? isPast(expiresAt) : false;
              const isPaid = listing.listingType === "paid";
              const isDeleted = listing.status === "deleted";

              return (
                <div key={listing.id} className="flex gap-4 py-5 group">
                  <div className="w-20 h-20 shrink-0 overflow-hidden rounded-sm bg-slate-100">
                    {listing.imageUrls?.[0] ? (
                      <img
                        src={listing.imageUrls[0]}
                        alt={listing.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300 text-xs">Kein Bild</div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div className="flex items-start justify-between gap-2">
                      <Link href={`/listings/${listing.id}`} className="font-medium text-slate-900 hover:underline truncate">
                        {listing.title}
                      </Link>
                      <div className="flex items-center gap-2 shrink-0">
                        {isPaid ? (
                          <Badge className="bg-slate-900 text-white text-[10px] uppercase tracking-wide px-2 py-0.5">Bezahlt</Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] uppercase tracking-wide px-2 py-0.5 text-slate-500">Kostenlos</Badge>
                        )}
                        <Badge
                          variant="outline"
                          className={`text-[10px] uppercase tracking-wide px-2 py-0.5 ${
                            listing.status === "active" ? "text-green-700 border-green-200" :
                            listing.status === "deleted" ? "text-red-500 border-red-200" :
                            "text-slate-500"
                          }`}
                        >
                          {listing.status}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-slate-400 mt-1">
                      <span className="font-medium text-slate-700">€{Number(listing.price).toFixed(2)}</span>
                      <span>{getCatLabel(listing.category, t)}</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {listing.daysAge === 0 ? "Today" : `${listing.daysAge}d old`}
                      </span>
                      {expiresAt && (
                        <span className={expired ? "text-red-500" : ""}>
                          {expired ? t.myAds_expired : `${t.myAds_expires} ${formatDistanceToNow(expiresAt, { addSuffix: true })}`}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 mt-2">
                      {!isPaid && listing.status === "active" && (
                        <Popover>
                          <PopoverTrigger asChild>
                            <button className="text-xs font-medium text-slate-500 hover:text-slate-900 flex items-center gap-1 transition-colors">
                              <Zap className="w-3 h-3" />
                              {t.myAds_boost}
                            </button>
                          </PopoverTrigger>
                          <PopoverContent align="start" className="w-64 p-3">
                            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Boost wählen</p>
                            <div className="space-y-1.5">
                              {BOOST_TIERS.map((tier) => (
                                <button
                                  key={tier.key}
                                  onClick={() => handleBoost(listing.id, tier.key)}
                                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg border border-slate-200 hover:border-slate-900 hover:bg-slate-50 transition-all group text-left"
                                >
                                  <div>
                                    <p className="text-sm font-medium text-slate-900">{tier.label}</p>
                                    <p className="text-[11px] text-slate-400">{tier.days} Tag{tier.days > 1 ? "e" : ""} sichtbar</p>
                                  </div>
                                  <span className="text-sm font-semibold text-slate-900 tabular-nums">{tier.price}</span>
                                </button>
                              ))}
                            </div>
                          </PopoverContent>
                        </Popover>
                      )}

                      {!isDeleted && (
                        <>
                          <button
                            onClick={() => openEdit(listing as ProfileListing)}
                            className="text-xs font-medium text-slate-400 hover:text-slate-900 flex items-center gap-1 transition-colors"
                          >
                            <Pencil className="w-3 h-3" />
                            {t.admin_action_edit ?? "Bearbeiten"}
                          </button>
                          <button
                            onClick={() => setDeleteId(listing.id)}
                            className="text-xs font-medium text-slate-400 hover:text-red-600 flex items-center gap-1 transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                            {t.admin_action_delete ?? "Löschen"}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.admin_delete_title}</AlertDialogTitle>
            <AlertDialogDescription>{t.admin_delete_desc}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.profile_cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && <Loader2 className="w-3 h-3 animate-spin mr-2" />}
              {t.admin_delete_confirm}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit dialog */}
      <Dialog open={!!editListing} onOpenChange={(open) => !open && setEditListing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t.admin_edit_title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-xs text-slate-500 mb-1.5 block">{t.admin_edit_fieldTitle}</Label>
              <Input
                value={editForm.title}
                onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-slate-500 mb-1.5 block">{t.admin_edit_fieldPrice}</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={editForm.price}
                  onChange={(e) => setEditForm((f) => ({ ...f, price: e.target.value }))}
                />
              </div>
              <div>
                <Label className="text-xs text-slate-500 mb-1.5 block">{t.admin_edit_fieldCategory}</Label>
                <select
                  value={editForm.category}
                  onChange={(e) => setEditForm((f) => ({ ...f, category: e.target.value }))}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.id} value={c.label}>{getCatLabel(c.label, t)}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <Label className="text-xs text-slate-500 mb-1.5 block">{t.admin_edit_fieldLocation}</Label>
              <Input
                value={editForm.location}
                onChange={(e) => setEditForm((f) => ({ ...f, location: e.target.value }))}
              />
            </div>
            <div>
              <Label className="text-xs text-slate-500 mb-1.5 block">{t.admin_edit_fieldDesc}</Label>
              <Textarea
                rows={4}
                className="resize-none"
                value={editForm.description}
                onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="negotiable"
                checked={editForm.isNegotiable}
                onChange={(e) => setEditForm((f) => ({ ...f, isNegotiable: e.target.checked }))}
                className="rounded border-slate-300"
              />
              <Label htmlFor="negotiable" className="text-sm text-slate-700 cursor-pointer">
                {t.admin_edit_fieldNegotiable}
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditListing(null)}>{t.profile_cancel}</Button>
            <Button
              onClick={handleEditSave}
              disabled={updateMutation.isPending || !editForm.title.trim()}
              className="bg-slate-900 hover:bg-slate-800 text-white"
            >
              {updateMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {t.admin_edit_save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
