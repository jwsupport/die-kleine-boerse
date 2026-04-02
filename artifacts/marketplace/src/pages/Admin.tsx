import { useState, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@workspace/replit-auth-web";
import { useT, getCatLabel } from "@/lib/i18n";
import { isAdminEmail } from "@/lib/admin";
import {
  useAdminGetListings,
  getAdminGetListingsQueryKey,
  useAdminUpdateListingStatus,
  useAdminGetStats,
  getAdminGetStatsQueryKey,
  useUpdateListing,
  useAdminGetRevenue,
  useAdminGetPayments,
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
import { Loader2, Pencil, TrendingUp, BadgeCheck } from "lucide-react";
import { CATEGORIES } from "@/lib/categories";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";

const MONTH_LABELS = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];
const REVENUE_YEARS = Array.from({ length: 2050 - 2026 + 1 }, (_, i) => 2026 + i);

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

  // Users tab
  type AdminProfile = {
    id: string; username: string | null; fullName: string | null;
    avatarUrl: string | null; createdAt: string;
    isVerified: boolean; verificationDate: string | null;
  };
  const [users, setUsers] = useState<AdminProfile[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [verifyPending, setVerifyPending] = useState<string | null>(null);

  type IntelligenceRow = {
    keyword: string; searchCount: number; listingCount: number; lastSearchedAt: string;
  };
  const [intelligence, setIntelligence] = useState<IntelligenceRow[]>([]);
  const [intelligenceLoading, setIntelligenceLoading] = useState(false);

  type PendingVideo = {
    id: string; title: string; price: number; category: string; location: string;
    videoUrl: string | null; imageUrls: string[]; createdAt: string;
    sellerName: string | null; sellerId: string;
  };
  const [pendingVideos, setPendingVideos] = useState<PendingVideo[]>([]);
  const [pendingVideosLoading, setPendingVideosLoading] = useState(false);
  const [videoActionPending, setVideoActionPending] = useState<string | null>(null);

  type BusinessBooking = {
    id: string; profileId: string; companyName: string; vatId: string | null;
    listingTitle: string; amount: number | null; paymentStatus: string;
    invoiceNumber: string | null; createdAt: string;
  };
  const [businessBookings, setBusinessBookings] = useState<BusinessBooking[]>([]);
  const [businessBookingsLoading, setBusinessBookingsLoading] = useState(false);
  const [markPaidPending, setMarkPaidPending] = useState<string | null>(null);

  const loadBusinessBookings = async () => {
    setBusinessBookingsLoading(true);
    try {
      const base = import.meta.env.BASE_URL.replace(/\/+$/, "");
      const res = await fetch(`${base}/api/admin/business-bookings`, { credentials: "include" });
      if (res.ok) setBusinessBookings(await res.json());
    } finally {
      setBusinessBookingsLoading(false);
    }
  };

  const handleMarkPaid = async (id: string) => {
    setMarkPaidPending(id);
    try {
      const base = import.meta.env.BASE_URL.replace(/\/+$/, "");
      const res = await fetch(`${base}/api/admin/business-bookings/${id}/mark-paid`, {
        method: "PATCH", credentials: "include",
      });
      if (res.ok) {
        const { invoiceNumber } = await res.json();
        setBusinessBookings(prev => prev.map(b => b.id === id ? { ...b, paymentStatus: "paid", invoiceNumber } : b));
        toast({ title: "Bezahlt markiert", description: `Rechnung: ${invoiceNumber}` });
      }
    } finally {
      setMarkPaidPending(null);
    }
  };

  const loadPendingVideos = async () => {
    setPendingVideosLoading(true);
    try {
      const base = import.meta.env.BASE_URL.replace(/\/+$/, "");
      const res = await fetch(`${base}/api/admin/pending-videos`, { credentials: "include" });
      if (res.ok) setPendingVideos(await res.json());
    } finally {
      setPendingVideosLoading(false);
    }
  };

  const handleVideoApprove = async (id: string) => {
    setVideoActionPending(id);
    try {
      const base = import.meta.env.BASE_URL.replace(/\/+$/, "");
      const res = await fetch(`${base}/api/admin/pending-videos/${id}/approve`, { method: "POST", credentials: "include" });
      if (res.ok) {
        setPendingVideos(prev => prev.filter(v => v.id !== id));
        toast({ title: "Anzeige freigeschaltet", description: "Video-Proof genehmigt." });
      }
    } finally {
      setVideoActionPending(null);
    }
  };

  const handleVideoReject = async (id: string) => {
    setVideoActionPending(id);
    try {
      const base = import.meta.env.BASE_URL.replace(/\/+$/, "");
      const res = await fetch(`${base}/api/admin/pending-videos/${id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ reason: "Video-Proof abgelehnt durch Admin" }),
      });
      if (res.ok) {
        setPendingVideos(prev => prev.filter(v => v.id !== id));
        toast({ title: "Anzeige abgelehnt", description: "Listing wurde gelöscht.", variant: "destructive" });
      }
    } finally {
      setVideoActionPending(null);
    }
  };

  const loadIntelligence = async () => {
    setIntelligenceLoading(true);
    try {
      const base = import.meta.env.BASE_URL.replace(/\/+$/, "");
      const res = await fetch(`${base}/api/admin/market-intelligence`, { credentials: "include" });
      if (res.ok) setIntelligence(await res.json());
    } finally {
      setIntelligenceLoading(false);
    }
  };

  const loadUsers = async () => {
    setUsersLoading(true);
    try {
      const base = import.meta.env.BASE_URL.replace(/\/+$/, "");
      const res = await fetch(`${base}/api/profiles`, { credentials: "include" });
      if (res.ok) setUsers(await res.json());
    } finally {
      setUsersLoading(false);
    }
  };

  const toggleVerify = async (profileId: string, currentState: boolean) => {
    setVerifyPending(profileId);
    try {
      const base = import.meta.env.BASE_URL.replace(/\/+$/, "");
      await fetch(`${base}/api/profiles/${profileId}/verify`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ verify: !currentState }),
      });
      setUsers(prev => prev.map(u => u.id === profileId
        ? { ...u, isVerified: !currentState, verificationDate: !currentState ? new Date().toISOString() : null }
        : u
      ));
      toast({ title: !currentState ? "Nutzer verifiziert" : "Verifizierung entfernt" });
    } catch {
      toast({ title: "Fehler", variant: "destructive" });
    } finally {
      setVerifyPending(null);
    }
  };

  // Listings Filters
  const [statusFilter, setStatusFilter] = useState("All");
  const [isReportedFilter, setIsReportedFilter] = useState(false);

  // Stats Filters
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const [statsMonth, setStatsMonth] = useState(currentMonth.toString());
  const [statsYear, setStatsYear] = useState(currentYear.toString());

  // Revenue
  const [revenueYear, setRevenueYear] = useState(currentYear.toString());

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

  const revenueYearNum = parseInt(revenueYear);
  const { data: revenueRaw, isLoading: loadingRevenue, isError: revenueError } = useAdminGetRevenue(revenueYearNum);

  // Payments tab
  const [paymentsYear, setPaymentsYear] = useState(currentYear.toString());
  const paymentsYearNum = parseInt(paymentsYear);
  const { data: payments, isLoading: loadingPayments } = useAdminGetPayments(paymentsYearNum);

  const revenueChartData = useMemo(() => {
    const byMonth: Record<string, number> = {};
    (revenueRaw ?? []).forEach((r) => {
      const m = r.month.slice(5, 7);
      byMonth[m] = r.revenue;
    });
    return MONTH_LABELS.map((label, i) => {
      const key = String(i + 1).padStart(2, "0");
      return { label, revenue: byMonth[key] ?? 0 };
    });
  }, [revenueRaw]);

  const totalRevenue = useMemo(
    () => revenueChartData.reduce((s, d) => s + d.revenue, 0),
    [revenueChartData],
  );

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
          queryClient.invalidateQueries({ queryKey: ["/api/admin/listings"] });
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
          queryClient.invalidateQueries({ queryKey: ["/api/admin/listings"] });
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
            <TabsTrigger
              value="revenue"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-slate-900 data-[state=active]:bg-transparent px-6 py-3 font-medium text-slate-600 data-[state=active]:text-slate-900"
            >
              Umsätze
            </TabsTrigger>
            <TabsTrigger
              value="payments"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-slate-900 data-[state=active]:bg-transparent px-6 py-3 font-medium text-slate-600 data-[state=active]:text-slate-900"
            >
              Zahlungen
            </TabsTrigger>
            <TabsTrigger
              value="users"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-slate-900 data-[state=active]:bg-transparent px-6 py-3 font-medium text-slate-600 data-[state=active]:text-slate-900"
              onClick={() => { if (users.length === 0) loadUsers(); }}
            >
              Nutzer
            </TabsTrigger>
            <TabsTrigger
              value="intelligence"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-slate-900 data-[state=active]:bg-transparent px-6 py-3 font-medium text-slate-600 data-[state=active]:text-slate-900"
              onClick={() => { if (intelligence.length === 0) loadIntelligence(); }}
            >
              Intelligence
            </TabsTrigger>
            <TabsTrigger
              value="video-review"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-slate-900 data-[state=active]:bg-transparent px-6 py-3 font-medium text-slate-600 data-[state=active]:text-slate-900 relative"
              onClick={() => { if (pendingVideos.length === 0) loadPendingVideos(); }}
            >
              Video-Prüfung
              {pendingVideos.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {pendingVideos.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="b2b"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-slate-900 data-[state=active]:bg-transparent px-6 py-3 font-medium text-slate-600 data-[state=active]:text-slate-900"
              onClick={() => { if (businessBookings.length === 0) loadBusinessBookings(); }}
            >
              B2B
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

            <p className="text-xs text-slate-500 -mt-4">
              {format(new Date(parseInt(statsYear), parseInt(statsMonth) - 1, 1), "MMMM yyyy")}
            </p>

            {loadingStats ? (
              <div className="py-24 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-slate-400" /></div>
            ) : stats ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title={t.admin_stats_total}    value={stats.totalListings}    bg="bg-slate-100" />
                <StatCard title={t.admin_stats_active}   value={stats.activeListings}   bg="bg-emerald-50"  text="text-emerald-900" />
                <StatCard title={t.admin_stats_pending}  value={stats.pendingListings}  bg="bg-amber-50"    text="text-amber-900" />
                <StatCard title={t.admin_stats_deleted}  value={stats.deletedListings}  bg="bg-slate-200" />
                <StatCard title={t.admin_stats_reported} value={stats.reportedListings} bg="bg-red-50"      text="text-red-900" />
                <StatCard title={t.admin_stats_free}     value={stats.freeListings}     bg="bg-white"       border="border border-slate-200" />
                <StatCard title={t.admin_stats_paid}     value={stats.paidListings}     bg="bg-indigo-50"   text="text-indigo-900" />
                <StatCard title={t.admin_stats_profiles} value={stats.newProfilesThisPeriod} bg="bg-slate-100" />

                <div className="col-span-1 md:col-span-2 lg:col-span-4 bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-center">
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

          <TabsContent value="revenue" className="space-y-8">
            {/* Year selector */}
            <div className="flex items-center gap-4 bg-white p-4 border border-slate-200 rounded-lg shadow-sm w-full md:w-fit">
              <TrendingUp className="w-4 h-4 text-slate-400" />
              <div>
                <Label className="text-xs font-medium text-slate-500 mb-1.5 block">Jahr</Label>
                <Select value={revenueYear} onValueChange={setRevenueYear}>
                  <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {REVENUE_YEARS.map((y) => (
                      <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {loadingRevenue ? (
              <div className="py-24 flex justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
              </div>
            ) : revenueError ? (
              <div className="py-16 text-center text-red-400 text-sm">
                Fehler beim Laden der Umsatzdaten. Bitte Seite neu laden.
              </div>
            ) : (
              <div className="space-y-6">
                {/* KPI row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-white border border-slate-200 rounded-xl p-6">
                    <p className="text-xs uppercase tracking-widest text-slate-400 mb-1">Jahresumsatz {revenueYear}</p>
                    <p className="text-3xl font-light text-slate-900">
                      €{totalRevenue.toFixed(2).replace(".", ",")}
                    </p>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-xl p-6">
                    <p className="text-xs uppercase tracking-widest text-slate-400 mb-1">Aktive Monate</p>
                    <p className="text-3xl font-light text-slate-900">
                      {revenueChartData.filter((d) => d.revenue > 0).length}
                    </p>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-xl p-6">
                    <p className="text-xs uppercase tracking-widest text-slate-400 mb-1">Ø pro Monat</p>
                    <p className="text-3xl font-light text-slate-900">
                      €{revenueChartData.filter((d) => d.revenue > 0).length > 0
                          ? (totalRevenue / revenueChartData.filter((d) => d.revenue > 0).length).toFixed(2).replace(".", ",")
                          : "0,00"}
                    </p>
                  </div>
                </div>

                {/* Bar chart */}
                <div className="bg-white border border-slate-200 rounded-xl p-6">
                  <p className="text-sm font-medium text-slate-700 mb-6">
                    Monatliche Umsätze — {revenueYear}
                  </p>
                  {totalRevenue === 0 ? (
                    <div className="py-16 text-center text-slate-400 text-sm">
                      Keine Umsätze in {revenueYear}
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={320}>
                      <BarChart data={revenueChartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                        <XAxis
                          dataKey="label"
                          tick={{ fontSize: 11, fill: "#94a3b8" }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          tickFormatter={(v) => `€${v}`}
                          tick={{ fontSize: 11, fill: "#94a3b8" }}
                          axisLine={false}
                          tickLine={false}
                          width={52}
                        />
                        <Tooltip
                          formatter={(value: number) => [`€${value.toFixed(2).replace(".", ",")}`, "Umsatz"]}
                          contentStyle={{
                            border: "1px solid #e2e8f0",
                            borderRadius: "12px",
                            fontSize: "12px",
                            boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
                          }}
                          cursor={{ fill: "#f8fafc" }}
                        />
                        <Bar dataKey="revenue" radius={[6, 6, 0, 0]} maxBarSize={48}>
                          {revenueChartData.map((entry, index) => (
                            <Cell
                              key={index}
                              fill={entry.revenue > 0 ? "#1e293b" : "#e2e8f0"}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>

                {/* Monthly breakdown table */}
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100">
                    <p className="text-sm font-medium text-slate-700">Aufschlüsselung nach Monat</p>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs uppercase tracking-wider text-slate-400">Monat</TableHead>
                        <TableHead className="text-xs uppercase tracking-wider text-slate-400 text-right">Umsatz</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {revenueChartData.map((row) => (
                        <TableRow key={row.label} className={row.revenue === 0 ? "opacity-40" : ""}>
                          <TableCell className="font-medium text-slate-700">{row.label} {revenueYear}</TableCell>
                          <TableCell className="text-right text-slate-900 font-mono">
                            €{row.revenue.toFixed(2).replace(".", ",")}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </TabsContent>

          {/* ─────────────── ZAHLUNGEN TAB ─────────────── */}
          <TabsContent value="payments" className="space-y-8">
            {/* Year selector */}
            <div className="flex items-center gap-4 bg-white p-4 border border-slate-200 rounded-lg shadow-sm w-full md:w-fit">
              <div>
                <Label className="text-xs font-medium text-slate-500 mb-1.5 block">Jahr</Label>
                <Select value={paymentsYear} onValueChange={setPaymentsYear}>
                  <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {REVENUE_YEARS.map((y) => (
                      <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {loadingPayments ? (
              <div className="py-24 flex justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
              </div>
            ) : (
              <div className="space-y-6">
                {/* KPI row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-white border border-slate-200 rounded-xl p-6">
                    <p className="text-xs uppercase tracking-widest text-slate-400 mb-1">Aktive Monate</p>
                    <p className="text-3xl font-light text-slate-900">
                      {new Set((payments ?? []).map((p) => p.paidAt.slice(0, 7))).size}
                    </p>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-xl p-6">
                    <p className="text-xs uppercase tracking-widest text-slate-400 mb-1">Zahlungen {paymentsYear}</p>
                    <p className="text-3xl font-light text-slate-900">
                      {(payments ?? []).length}
                    </p>
                  </div>
                </div>

                {/* Payments table */}
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100">
                    <p className="text-sm font-medium text-slate-700">Einzelne Zahlungen — {paymentsYear}</p>
                  </div>
                  {(payments ?? []).length === 0 ? (
                    <div className="py-16 text-center text-slate-400 text-sm">
                      Keine Zahlungen in {paymentsYear}
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs uppercase tracking-wider text-slate-400 font-medium">Datum</TableHead>
                          <TableHead className="text-xs uppercase tracking-wider text-slate-400 font-medium">Anzeige</TableHead>
                          <TableHead className="text-xs uppercase tracking-wider text-slate-400 font-medium">Kategorie</TableHead>
                          <TableHead className="text-xs uppercase tracking-wider text-slate-400 font-medium text-right">Betrag</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(payments ?? []).map((p) => (
                          <TableRow key={p.id} className="hover:bg-slate-50">
                            <TableCell className="text-sm text-slate-600 whitespace-nowrap">
                              {format(new Date(p.paidAt), "dd.MM.yyyy")}
                            </TableCell>
                            <TableCell className="text-sm font-medium text-slate-900 max-w-xs truncate">
                              {p.title}
                            </TableCell>
                            <TableCell className="text-sm text-slate-500">
                              {getCatLabel(p.category, t)}
                            </TableCell>
                            <TableCell className="text-sm font-medium text-slate-900 text-right tabular-nums">
                              €{p.amount.toFixed(2).replace(".", ",")}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                  {(payments ?? []).length > 0 && (
                    <div className="px-6 py-3 border-t border-slate-100 flex justify-end">
                      <span className="text-sm font-semibold text-slate-900">
                        Gesamt: €{(payments ?? []).reduce((s, p) => s + p.amount, 0).toFixed(2).replace(".", ",")}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-medium text-slate-900">Nutzer</h2>
              <Button variant="outline" size="sm" onClick={loadUsers} disabled={usersLoading}>
                {usersLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Aktualisieren"}
              </Button>
            </div>

            {usersLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
              </div>
            ) : users.length === 0 ? (
              <div className="py-16 text-center text-slate-400 border border-dashed border-slate-200 rounded-lg">
                Keine Nutzer gefunden
              </div>
            ) : (
              <div className="rounded-lg border border-slate-200 overflow-hidden">
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Benutzername</TableHead>
                      <TableHead>Mitglied seit</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead className="text-center">Verifiziert</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium text-slate-900">
                          {u.fullName || <span className="text-slate-400 italic">–</span>}
                        </TableCell>
                        <TableCell className="text-slate-500">
                          {u.username ? `@${u.username}` : <span className="text-slate-300 italic">–</span>}
                        </TableCell>
                        <TableCell className="text-slate-500 text-sm">
                          {format(new Date(u.createdAt), "dd.MM.yyyy")}
                        </TableCell>
                        <TableCell className="text-center">
                          {u.isVerified ? (
                            <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full text-[10px] uppercase tracking-widest font-bold border border-blue-100">
                              <BadgeCheck className="w-3 h-3" /> Verifiziert
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400">–</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <Switch
                            checked={u.isVerified}
                            disabled={verifyPending === u.id}
                            onCheckedChange={() => toggleVerify(u.id, u.isVerified)}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          <TabsContent value="intelligence" className="space-y-6">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-blue-600 font-bold mb-1">Market Intelligence</p>
                <h2 className="text-2xl font-light text-slate-900">Was deine Nutzer wirklich suchen</h2>
              </div>
              <Button variant="outline" size="sm" onClick={loadIntelligence} disabled={intelligenceLoading}>
                {intelligenceLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Aktualisieren"}
              </Button>
            </div>

            {intelligenceLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
              </div>
            ) : intelligence.length === 0 ? (
              <div className="py-20 text-center border border-dashed border-slate-200 rounded-2xl">
                <p className="text-slate-400 text-sm mb-1">Noch keine Suchdaten vorhanden</p>
                <p className="text-slate-300 text-xs">Suchbegriffe werden automatisch erfasst, sobald Nutzer suchen</p>
              </div>
            ) : (
              <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm space-y-7">
                {(() => {
                  const maxCount = Math.max(...intelligence.map(r => r.searchCount), 1);
                  return intelligence.map((row) => (
                    <div key={row.keyword}>
                      <div className="flex justify-between items-end mb-2">
                        <span className="text-sm font-semibold text-slate-900 uppercase tracking-wider">
                          {row.keyword}
                        </span>
                        <span className="text-[10px] text-slate-400 tabular-nums">
                          {row.searchCount} {row.searchCount === 1 ? "Suche" : "Suchen"} · {row.listingCount} {row.listingCount === 1 ? "Anzeige" : "Anzeigen"}
                        </span>
                      </div>
                      <div className="relative w-full h-2 bg-slate-50 rounded-full overflow-hidden">
                        <div
                          className="absolute left-0 top-0 h-full rounded-full transition-all duration-1000"
                          style={{
                            width: `${Math.min((row.searchCount / maxCount) * 100, 100)}%`,
                            background: row.listingCount === 0 ? "#ef4444" : "#0f172a",
                          }}
                        />
                      </div>
                      {row.listingCount === 0 && (
                        <p className="text-[10px] text-red-500 mt-1.5 font-bold uppercase tracking-tight">
                          ⚠ Marktlücke — Keine Anzeigen für diesen Begriff
                        </p>
                      )}
                      {row.listingCount > 0 && row.searchCount >= 5 && (
                        <p className="text-[10px] text-blue-500 mt-1.5 font-medium">
                          🔥 Hohe Nachfrage — Boost-Empfehlung für passende Anzeigen
                        </p>
                      )}
                    </div>
                  ));
                })()}
              </div>
            )}
          </TabsContent>

          <TabsContent value="video-review" className="space-y-6">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-red-500 font-bold mb-1">Anti-Scam System</p>
                <h2 className="text-2xl font-light text-slate-900">Video-Proof Prüfung</h2>
              </div>
              <Button variant="outline" size="sm" onClick={loadPendingVideos} disabled={pendingVideosLoading}>
                {pendingVideosLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Aktualisieren"}
              </Button>
            </div>

            {pendingVideosLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
              </div>
            ) : pendingVideos.length === 0 ? (
              <div className="py-20 text-center border border-dashed border-slate-200 rounded-2xl">
                <p className="text-slate-400 text-sm mb-1">Keine Videos zur Prüfung</p>
                <p className="text-slate-300 text-xs">Neue Anzeigen über 500 € erscheinen hier automatisch</p>
              </div>
            ) : (
              <div className="space-y-5">
                {pendingVideos.map((pv) => (
                  <div key={pv.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-6">
                    {pv.videoUrl ? (
                      <div className="flex-shrink-0">
                        <video
                          width={220}
                          className="rounded-xl bg-black object-cover"
                          controls
                          style={{ maxHeight: 160 }}
                        >
                          <source src={pv.videoUrl} />
                          Dein Browser unterstützt kein Video.
                        </video>
                      </div>
                    ) : (
                      <div className="w-[220px] h-[140px] bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <p className="text-xs text-slate-400">Kein Video</p>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs uppercase tracking-widest text-slate-400 font-semibold mb-1">{pv.category}</p>
                      <h3 className="text-xl font-medium text-slate-900 mb-1 line-clamp-1">{pv.title}</h3>
                      <p className="text-slate-500 text-sm mb-4">
                        €{pv.price.toLocaleString("de-DE")} · {pv.location}
                        {pv.sellerName && <> · <span className="font-medium">{pv.sellerName}</span></>}
                        <span className="ml-2 text-slate-400 text-xs">
                          {new Date(pv.createdAt).toLocaleDateString("de-DE")}
                        </span>
                      </p>
                      {pv.imageUrls.length > 0 && (
                        <div className="flex gap-2 mb-4">
                          {pv.imageUrls.slice(0, 3).map((url, i) => (
                            <img key={i} src={url} alt="" className="w-12 h-12 rounded-lg object-cover border border-slate-100" />
                          ))}
                        </div>
                      )}
                      <div className="flex gap-3">
                        <Button
                          onClick={() => handleVideoApprove(pv.id)}
                          disabled={videoActionPending === pv.id}
                          className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl px-6"
                        >
                          {videoActionPending === pv.id
                            ? <Loader2 className="w-4 h-4 animate-spin" />
                            : "Video korrekt — Freischalten"}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleVideoReject(pv.id)}
                          disabled={videoActionPending === pv.id}
                          className="text-red-500 border-red-200 hover:bg-red-50 rounded-xl"
                        >
                          Ablehnen
                        </Button>
                        {pv.videoUrl && (
                          <a
                            href={pv.videoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-500 underline flex items-center self-center ml-1"
                          >
                            Video extern öffnen
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="b2b" className="space-y-6">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-bold mb-1">Business Module</p>
                <h2 className="text-2xl font-light text-slate-900">B2B-Buchungen</h2>
              </div>
              <Button variant="outline" size="sm" onClick={loadBusinessBookings} disabled={businessBookingsLoading}>
                {businessBookingsLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Aktualisieren"}
              </Button>
            </div>

            {businessBookingsLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
              </div>
            ) : businessBookings.length === 0 ? (
              <div className="py-20 text-center border border-dashed border-slate-200 rounded-2xl">
                <p className="text-slate-400 text-sm mb-1">Keine B2B-Buchungen vorhanden</p>
                <p className="text-slate-300 text-xs">Buchungen erscheinen automatisch sobald gewerbliche Anbieter bezahlte Anzeigen schalten</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Unternehmen</TableHead>
                      <TableHead>USt-IdNr.</TableHead>
                      <TableHead>Anzeigentitel</TableHead>
                      <TableHead>Betrag</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Rechnungsnr.</TableHead>
                      <TableHead>Datum</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {businessBookings.map((booking) => (
                      <TableRow key={booking.id}>
                        <TableCell className="font-medium text-slate-900">{booking.companyName}</TableCell>
                        <TableCell className="text-slate-500 text-xs font-mono">{booking.vatId ?? "—"}</TableCell>
                        <TableCell className="text-slate-700 max-w-[180px] truncate">{booking.listingTitle}</TableCell>
                        <TableCell className="font-medium">
                          {booking.amount != null ? `€${Number(booking.amount).toFixed(2)}` : "—"}
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] uppercase tracking-widest font-bold ${booking.paymentStatus === "paid" ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}>
                            {booking.paymentStatus === "paid" ? "Bezahlt" : "Offen"}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs font-mono text-slate-500">{booking.invoiceNumber ?? "—"}</TableCell>
                        <TableCell className="text-xs text-slate-400">
                          {new Date(booking.createdAt).toLocaleDateString("de-DE")}
                        </TableCell>
                        <TableCell>
                          {booking.paymentStatus !== "paid" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleMarkPaid(booking.id)}
                              disabled={markPaidPending === booking.id}
                              className="text-xs"
                            >
                              {markPaidPending === booking.id ? <Loader2 className="w-3 h-3 animate-spin" /> : "Als bezahlt markieren"}
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
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
                    <SelectItem key={c.id} value={c.label}>{getCatLabel(c.id, t)}</SelectItem>
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
