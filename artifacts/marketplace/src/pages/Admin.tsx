import { useState, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@workspace/replit-auth-web";
import { useT } from "@/lib/i18n";
import { isAdminEmail } from "@/lib/admin";
import {
  useAdminGetListings,
  getAdminGetListingsQueryKey,
  useAdminUpdateListingStatus,
  useAdminGetStats,
  getAdminGetStatsQueryKey,
  useUpdateListing,
} from "@workspace/api-client-react";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Loader2, Pencil } from "lucide-react";
import { CATEGORIES } from "@/lib/categories";

interface EditForm {
  title: string;
  description: string;
  price: string;
  category: string;
  location: string;
  isNegotiable: boolean;
}

export function Admin() {
  const t = useT();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();

  const [activeTab, setActiveTab] = useState("listings");

  // Listings Filters
  const [statusFilter, setStatusFilter] = useState("All");
  const [isReportedFilter, setIsReportedFilter] = useState(false);

  // Stats Filters
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const [statsMonth, setStatsMonth] = useState(currentMonth.toString());
  const [statsYear, setStatsYear] = useState(currentYear.toString());

  const listingsParams = useMemo(() => {
    const params: any = {};
    if (statusFilter !== "All") params.status = statusFilter.toLowerCase();
    if (isReportedFilter) params.isReported = true;
    return params;
  }, [statusFilter, isReportedFilter]);

  const { data: listings, isLoading: loadingListings } = useAdminGetListings(listingsParams, {
    query: { queryKey: getAdminGetListingsQueryKey(listingsParams) }
  });

  const statsParams = { month: parseInt(statsMonth), year: parseInt(statsYear) };
  const { data: stats, isLoading: loadingStats } = useAdminGetStats(statsParams, {
    query: { queryKey: getAdminGetStatsQueryKey(statsParams) }
  });

  const updateStatus = useAdminUpdateListingStatus();
  const updateListing = useUpdateListing();

  // Dialog states
  const [rejectDialogItem, setRejectDialogItem] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [deleteDialogItem, setDeleteDialogItem] = useState<string | null>(null);
  const [editDialogItem, setEditDialogItem] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({
    title: "", description: "", price: "", category: "", location: "", isNegotiable: false,
  });

  const openEditDialog = (listing: any) => {
    setEditForm({
      title: listing.title ?? "",
      description: listing.description ?? "",
      price: String(listing.price ?? ""),
      category: listing.category ?? "",
      location: listing.location ?? "",
      isNegotiable: listing.isNegotiable ?? false,
    });
    setEditDialogItem(listing.id);
  };

  const handleStatusUpdate = (id: string, status: string, reason?: string) => {
    updateStatus.mutate(
      { id, data: { status, reason } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getAdminGetListingsQueryKey() });
          toast({ title: t.admin_updated, description: t.admin_updatedDesc });
          if (status === "rejected") { setRejectDialogItem(null); setRejectReason(""); }
          if (status === "deleted") { setDeleteDialogItem(null); }
        },
        onError: () => {
          toast({ title: t.admin_updateFailed, description: t.admin_updateFailedDesc, variant: "destructive" });
        }
      }
    );
  };

  const handleEditSave = () => {
    if (!editDialogItem) return;
    const priceNum = parseFloat(editForm.price);
    if (isNaN(priceNum)) return;

    updateListing.mutate(
      {
        id: editDialogItem,
        data: {
          title: editForm.title,
          description: editForm.description || null,
          price: priceNum,
          category: editForm.category,
          location: editForm.location,
          isNegotiable: editForm.isNegotiable,
        },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getAdminGetListingsQueryKey() });
          toast({ title: t.admin_edit_success });
          setEditDialogItem(null);
        },
        onError: () => {
          toast({ title: t.admin_edit_error, variant: "destructive" });
        },
      }
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":   return <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-none shadow-none font-medium">{t.admin_status_active}</Badge>;
      case "pending":  return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 border-none shadow-none font-medium">{t.admin_status_pending}</Badge>;
      case "rejected": return <Badge className="bg-red-100 text-red-800 hover:bg-red-100 border-none shadow-none font-medium">{t.admin_status_rejected}</Badge>;
      case "deleted":  return <Badge className="bg-slate-100 text-slate-800 hover:bg-slate-100 border-none shadow-none font-medium">{t.admin_status_deleted}</Badge>;
      default:         return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Access gate
  if (!authLoading && (!isAuthenticated || !isAdminEmail(user?.email))) {
    return (
      <div className="min-h-[100dvh] flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-3 max-w-xs">
            <div className="inline-flex w-14 h-14 rounded-full bg-slate-100 items-center justify-center mb-2">
              <Loader2 className="w-6 h-6 text-slate-300" />
            </div>
            <h1 className="text-xl font-medium text-slate-900">{t.admin_noAccess}</h1>
            <p className="text-sm text-slate-500">{t.admin_noAccessDesc}</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] flex flex-col bg-slate-50">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-medium text-slate-900 tracking-tight">{t.admin_dashboard}</h1>
            <p className="text-slate-500 mt-1">{t.admin_dashboardDesc}</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-8 w-full justify-start border-b border-slate-200 rounded-none bg-transparent h-auto p-0">
            <TabsTrigger
              value="listings"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-slate-900 data-[state=active]:bg-transparent px-6 py-3 font-medium text-slate-600 data-[state=active]:text-slate-900"
            >
              {t.admin_tab_listings}
            </TabsTrigger>
            <TabsTrigger
              value="stats"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-slate-900 data-[state=active]:bg-transparent px-6 py-3 font-medium text-slate-600 data-[state=active]:text-slate-900"
            >
              {t.admin_tab_stats}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="listings" className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4 items-end md:items-center bg-white p-4 border border-slate-200 rounded-lg shadow-sm">
              <div className="w-full md:w-64">
                <Label className="text-xs font-medium text-slate-500 mb-1.5 block">{t.admin_filter_status}</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t.admin_status_all} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">{t.admin_status_all}</SelectItem>
                    <SelectItem value="Active">{t.admin_status_active}</SelectItem>
                    <SelectItem value="Pending">{t.admin_status_pending}</SelectItem>
                    <SelectItem value="Rejected">{t.admin_status_rejected}</SelectItem>
                    <SelectItem value="Deleted">{t.admin_status_deleted}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2 h-10 px-2">
                <Switch id="reported-mode" checked={isReportedFilter} onCheckedChange={setIsReportedFilter} />
                <Label htmlFor="reported-mode" className="text-sm font-medium">{t.admin_filter_reported}</Label>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow>
                      <TableHead className="w-[260px]">{t.admin_table_listingTitle}</TableHead>
                      <TableHead>{t.admin_table_seller}</TableHead>
                      <TableHead>{t.admin_table_type}</TableHead>
                      <TableHead>{t.admin_table_status}</TableHead>
                      <TableHead>{t.admin_table_reason}</TableHead>
                      <TableHead className="text-right">{t.admin_table_actions}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingListings ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-32 text-center">
                          <Loader2 className="h-6 w-6 animate-spin mx-auto text-slate-400" />
                        </TableCell>
                      </TableRow>
                    ) : listings?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-32 text-center text-slate-500">
                          {t.admin_table_empty}
                        </TableCell>
                      </TableRow>
                    ) : (
                      listings?.map((listing) => (
                        <TableRow key={listing.id} className={listing.isReported ? "border-l-4 border-l-red-500" : ""}>
                          <TableCell className="font-medium text-slate-900 truncate max-w-[260px]" title={listing.title}>
                            {listing.title}
                          </TableCell>
                          <TableCell className="text-slate-600">{listing.sellerName || t.admin_unknown}</TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              {listing.listingType === "paid" ? (
                                <Badge variant="outline" className="text-amber-700 border-amber-200 bg-amber-50">{t.admin_badge_paid}</Badge>
                              ) : (
                                <Badge variant="outline" className="text-slate-600 border-slate-200 bg-slate-50">{t.admin_badge_free}</Badge>
                              )}
                              {listing.paymentStatus === "pending" && (
                                <Badge variant="outline" className="text-orange-700 border-orange-300 bg-orange-50 text-[10px] px-1.5">
                                  {t.admin_badge_cryptoPending}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge(listing.status)}</TableCell>
                          <TableCell className="text-sm text-slate-500 max-w-[180px] truncate" title={listing.reportReason || ""}>
                            {listing.reportReason || "—"}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 text-slate-500 hover:text-slate-900 hover:bg-slate-100 gap-1"
                                onClick={() => openEditDialog(listing)}
                              >
                                <Pencil className="w-3.5 h-3.5" />
                                {t.admin_action_edit}
                              </Button>
                              {listing.status !== "active" && (
                                <Button size="sm" variant="outline" className="h-8" onClick={() => handleStatusUpdate(listing.id, "active")}>
                                  {listing.isReported ? t.admin_action_keep : t.admin_action_approve}
                                </Button>
                              )}
                              {listing.status !== "rejected" && listing.status !== "deleted" && (
                                <Button size="sm" variant="outline" className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => setRejectDialogItem(listing.id)}>
                                  {t.admin_action_reject}
                                </Button>
                              )}
                              {listing.status !== "deleted" && (
                                <Button size="sm" variant="ghost" className="h-8 text-slate-500 hover:text-red-600 hover:bg-red-50" onClick={() => setDeleteDialogItem(listing.id)}>
                                  {t.admin_action_delete}
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="stats" className="space-y-8">
            <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 border border-slate-200 rounded-lg shadow-sm w-full md:w-fit">
              <div>
                <Label className="text-xs font-medium text-slate-500 mb-1.5 block">{t.admin_stats_month}</Label>
                <Select value={statsMonth} onValueChange={setStatsMonth}>
                  <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }).map((_, i) => (
                      <SelectItem key={i + 1} value={(i + 1).toString()}>
                        {format(new Date(2000, i, 1), "MMMM")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-medium text-slate-500 mb-1.5 block">{t.admin_stats_year}</Label>
                <Select value={statsYear} onValueChange={setStatsYear}>
                  <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[currentYear - 1, currentYear, currentYear + 1].map((y) => (
                      <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {loadingStats ? (
              <div className="py-24 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-slate-400" /></div>
            ) : stats ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title={t.admin_stats_total}      value={stats.totalListings}        bg="bg-slate-100" />
                <StatCard title={t.admin_stats_active}     value={stats.activeListings}       bg="bg-emerald-50"  text="text-emerald-900" />
                <StatCard title={t.admin_stats_pending}    value={stats.pendingListings}      bg="bg-amber-50"    text="text-amber-900" />
                <StatCard title={t.admin_stats_deleted}    value={stats.deletedListings}      bg="bg-slate-200" />
                <StatCard title={t.admin_stats_reported}   value={stats.reportedListings}     bg="bg-red-50"      text="text-red-900" />
                <StatCard title={t.admin_stats_free}       value={stats.freeListings}         bg="bg-white"       border="border border-slate-200" />
                <StatCard title={t.admin_stats_paid}       value={stats.paidListings}         bg="bg-indigo-50"   text="text-indigo-900" />
                <StatCard title={t.admin_stats_profiles}   value={stats.totalProfiles}        bg="bg-slate-100" />
                <StatCard title={t.admin_stats_newProfiles} value={stats.newProfilesThisPeriod} bg="bg-slate-50" border="border border-dashed border-slate-300" />
                <StatCard title={t.admin_stats_newListings} value={stats.newListingsThisPeriod} bg="bg-slate-50" border="border border-dashed border-slate-300" />

                <div className="col-span-1 md:col-span-2 lg:col-span-2 bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-center">
                  <h3 className="text-sm font-medium text-slate-500 mb-4">{t.admin_stats_split}</h3>
                  <div className="flex h-4 rounded-full overflow-hidden w-full bg-slate-100">
                    <div className="bg-slate-400 h-full transition-all" style={{ width: `${stats.totalListings ? (stats.freeListings / stats.totalListings) * 100 : 0}%` }} title={t.admin_badge_free} />
                    <div className="bg-indigo-400 h-full transition-all" style={{ width: `${stats.totalListings ? (stats.paidListings / stats.totalListings) * 100 : 0}%` }} title={t.admin_badge_paid} />
                  </div>
                  <div className="flex justify-between mt-2 text-sm">
                    <span className="text-slate-600 font-medium">{t.admin_badge_free}: {stats.freeListings}</span>
                    <span className="text-indigo-600 font-medium">{t.admin_badge_paid}: {stats.paidListings}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-24 text-center text-slate-500">{t.admin_stats_failed}</div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Edit Dialog */}
      <Dialog open={!!editDialogItem} onOpenChange={(open) => !open && setEditDialogItem(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t.admin_edit_title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="edit-title">{t.admin_edit_fieldTitle}</Label>
              <Input
                id="edit-title"
                value={editForm.title}
                onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-desc">{t.admin_edit_fieldDesc}</Label>
              <Textarea
                id="edit-desc"
                rows={3}
                value={editForm.description}
                onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                className="resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="edit-price">{t.admin_edit_fieldPrice}</Label>
                <Input
                  id="edit-price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={editForm.price}
                  onChange={(e) => setEditForm((f) => ({ ...f, price: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-location">{t.admin_edit_fieldLocation}</Label>
                <Input
                  id="edit-location"
                  value={editForm.location}
                  onChange={(e) => setEditForm((f) => ({ ...f, location: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-category">{t.admin_edit_fieldCategory}</Label>
              <Select value={editForm.category} onValueChange={(v) => setEditForm((f) => ({ ...f, category: v }))}>
                <SelectTrigger id="edit-category"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.id} value={c.label}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <Checkbox
                id="edit-negotiable"
                checked={editForm.isNegotiable}
                onCheckedChange={(checked) => setEditForm((f) => ({ ...f, isNegotiable: !!checked }))}
              />
              <Label htmlFor="edit-negotiable" className="text-sm cursor-pointer">{t.admin_edit_fieldNegotiable}</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogItem(null)}>{t.admin_cancel}</Button>
            <Button
              onClick={handleEditSave}
              disabled={updateListing.isPending || !editForm.title.trim()}
              className="bg-slate-900 hover:bg-slate-800 text-white"
            >
              {updateListing.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {t.admin_edit_save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={!!rejectDialogItem} onOpenChange={(open) => !open && setRejectDialogItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.admin_reject_title}</DialogTitle>
            <DialogDescription>{t.admin_reject_desc}</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="reason" className="mb-2 block">{t.admin_reject_label}</Label>
            <Input
              id="reason"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder={t.admin_reject_placeholder}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogItem(null)}>{t.admin_cancel}</Button>
            <Button variant="destructive" onClick={() => rejectDialogItem && handleStatusUpdate(rejectDialogItem, "rejected", rejectReason)}>
              {t.admin_reject_confirm}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={!!deleteDialogItem} onOpenChange={(open) => !open && setDeleteDialogItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.admin_delete_title}</DialogTitle>
            <DialogDescription>{t.admin_delete_desc}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setDeleteDialogItem(null)}>{t.admin_cancel}</Button>
            <Button variant="destructive" onClick={() => deleteDialogItem && handleStatusUpdate(deleteDialogItem, "deleted")}>
              {t.admin_delete_confirm}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatCard({ title, value, bg = "bg-white", text = "text-slate-900", border = "" }: {
  title: string; value: number; bg?: string; text?: string; border?: string;
}) {
  return (
    <div className={`p-6 rounded-xl ${bg} ${border}`}>
      <h3 className="text-sm font-medium text-slate-500 mb-2">{title}</h3>
      <p className={`text-4xl font-semibold tracking-tight ${text}`}>{value.toLocaleString()}</p>
    </div>
  );
}
