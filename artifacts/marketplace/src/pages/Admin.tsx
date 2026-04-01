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
  getAdminGetStatsQueryKey
} from "@workspace/api-client-react";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";

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

  // Action states
  const [rejectDialogItem, setRejectDialogItem] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  
  const [deleteDialogItem, setDeleteDialogItem] = useState<string | null>(null);

  const handleStatusUpdate = (id: string, status: string, reason?: string) => {
    updateStatus.mutate(
      { id, data: { status, reason } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getAdminGetListingsQueryKey() });
          toast({ title: "Listing updated", description: `Status changed to ${status}.` });
          if (status === "rejected") {
            setRejectDialogItem(null);
            setRejectReason("");
          }
          if (status === "deleted") {
            setDeleteDialogItem(null);
          }
        },
        onError: () => {
          toast({ title: "Update failed", description: "An error occurred.", variant: "destructive" });
        }
      }
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active": return <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-none shadow-none font-medium">Active</Badge>;
      case "pending": return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 border-none shadow-none font-medium">Pending</Badge>;
      case "rejected": return <Badge className="bg-red-100 text-red-800 hover:bg-red-100 border-none shadow-none font-medium">Rejected</Badge>;
      case "deleted": return <Badge className="bg-slate-100 text-slate-800 hover:bg-slate-100 border-none shadow-none font-medium">Deleted</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Access gate — only the super-admin email may enter
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
            <h1 className="text-3xl font-medium text-slate-900 tracking-tight">Admin Dashboard</h1>
            <p className="text-slate-500 mt-1">Manage listings and view platform analytics.</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-8 w-full justify-start border-b border-slate-200 rounded-none bg-transparent h-auto p-0">
            <TabsTrigger 
              value="listings" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-slate-900 data-[state=active]:bg-transparent px-6 py-3 font-medium text-slate-600 data-[state=active]:text-slate-900"
            >
              Listings Management
            </TabsTrigger>
            <TabsTrigger 
              value="stats"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-slate-900 data-[state=active]:bg-transparent px-6 py-3 font-medium text-slate-600 data-[state=active]:text-slate-900"
            >
              Statistics & Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="listings" className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4 items-end md:items-center bg-white p-4 border border-slate-200 rounded-lg shadow-sm">
              <div className="w-full md:w-64">
                <Label className="text-xs font-medium text-slate-500 mb-1.5 block">Status Filter</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All</SelectItem>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Rejected">Rejected</SelectItem>
                    <SelectItem value="Deleted">Deleted</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2 h-10 px-2">
                <Switch id="reported-mode" checked={isReportedFilter} onCheckedChange={setIsReportedFilter} />
                <Label htmlFor="reported-mode" className="text-sm font-medium">Show Reported Only</Label>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow>
                      <TableHead className="w-[300px]">Listing Title</TableHead>
                      <TableHead>Seller</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Report Reason</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
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
                          No listings found matching these filters.
                        </TableCell>
                      </TableRow>
                    ) : (
                      listings?.map((listing) => (
                        <TableRow key={listing.id} className={listing.isReported ? "border-l-4 border-l-red-500" : ""}>
                          <TableCell className="font-medium text-slate-900 truncate max-w-[300px]" title={listing.title}>
                            {listing.title}
                          </TableCell>
                          <TableCell className="text-slate-600">{listing.sellerName || 'Unknown'}</TableCell>
                          <TableCell>
                            {listing.listingType === 'paid' ? (
                              <Badge variant="outline" className="text-amber-700 border-amber-200 bg-amber-50">Paid</Badge>
                            ) : (
                              <Badge variant="outline" className="text-slate-600 border-slate-200 bg-slate-50">Free</Badge>
                            )}
                          </TableCell>
                          <TableCell>{getStatusBadge(listing.status)}</TableCell>
                          <TableCell className="text-sm text-slate-500 max-w-[200px] truncate" title={listing.reportReason || ""}>
                            {listing.reportReason || "—"}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              {listing.status !== 'active' && (
                                <Button size="sm" variant="outline" className="h-8" onClick={() => handleStatusUpdate(listing.id, 'active')}>
                                  {listing.isReported ? 'Keep' : 'Approve'}
                                </Button>
                              )}
                              {listing.status !== 'rejected' && listing.status !== 'deleted' && (
                                <Button size="sm" variant="outline" className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => setRejectDialogItem(listing.id)}>
                                  Reject
                                </Button>
                              )}
                              {listing.status !== 'deleted' && (
                                <Button size="sm" variant="ghost" className="h-8 text-slate-500 hover:text-red-600 hover:bg-red-50" onClick={() => setDeleteDialogItem(listing.id)}>
                                  Delete
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
                <Label className="text-xs font-medium text-slate-500 mb-1.5 block">Month</Label>
                <Select value={statsMonth} onValueChange={setStatsMonth}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }).map((_, i) => (
                      <SelectItem key={i+1} value={(i+1).toString()}>
                        {format(new Date(2000, i, 1), 'MMMM')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-medium text-slate-500 mb-1.5 block">Year</Label>
                <Select value={statsYear} onValueChange={setStatsYear}>
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[currentYear - 1, currentYear, currentYear + 1].map(y => (
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
                <StatCard title="Total Listings" value={stats.totalListings} bg="bg-slate-100" />
                <StatCard title="Active Listings" value={stats.activeListings} bg="bg-emerald-50" text="text-emerald-900" />
                <StatCard title="Pending Listings" value={stats.pendingListings} bg="bg-amber-50" text="text-amber-900" />
                <StatCard title="Deleted/Archived" value={stats.deletedListings} bg="bg-slate-200" />
                
                <StatCard title="Reported Listings" value={stats.reportedListings} bg="bg-red-50" text="text-red-900" />
                <StatCard title="Free Listings" value={stats.freeListings} bg="bg-white" border="border border-slate-200" />
                <StatCard title="Paid Listings" value={stats.paidListings} bg="bg-indigo-50" text="text-indigo-900" />
                <StatCard title="Total Profiles" value={stats.totalProfiles} bg="bg-slate-100" />

                <StatCard title="New Profiles (Period)" value={stats.newProfilesThisPeriod} bg="bg-slate-50" border="border border-dashed border-slate-300" />
                <StatCard title="New Listings (Period)" value={stats.newListingsThisPeriod} bg="bg-slate-50" border="border border-dashed border-slate-300" />
                
                <div className="col-span-1 md:col-span-2 lg:col-span-2 bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-center">
                  <h3 className="text-sm font-medium text-slate-500 mb-4">Free vs Paid Split</h3>
                  <div className="flex h-4 rounded-full overflow-hidden w-full bg-slate-100">
                    <div 
                      className="bg-slate-400 h-full transition-all" 
                      style={{ width: `${stats.totalListings ? (stats.freeListings / stats.totalListings) * 100 : 0}%` }}
                      title="Free"
                    />
                    <div 
                      className="bg-indigo-400 h-full transition-all" 
                      style={{ width: `${stats.totalListings ? (stats.paidListings / stats.totalListings) * 100 : 0}%` }}
                      title="Paid"
                    />
                  </div>
                  <div className="flex justify-between mt-2 text-sm">
                    <span className="text-slate-600 font-medium">Free: {stats.freeListings}</span>
                    <span className="text-indigo-600 font-medium">Paid: {stats.paidListings}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-24 text-center text-slate-500">Failed to load statistics.</div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <Dialog open={!!rejectDialogItem} onOpenChange={(open) => !open && setRejectDialogItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Listing</DialogTitle>
            <DialogDescription>Please provide a reason for rejecting this listing.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="reason" className="mb-2 block">Reason</Label>
            <Input 
              id="reason" 
              value={rejectReason} 
              onChange={e => setRejectReason(e.target.value)} 
              placeholder="e.g. Inappropriate content"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogItem(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => rejectDialogItem && handleStatusUpdate(rejectDialogItem, 'rejected', rejectReason)}>
              Reject Listing
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteDialogItem} onOpenChange={(open) => !open && setDeleteDialogItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>Are you sure you want to permanently delete this listing? This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setDeleteDialogItem(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteDialogItem && handleStatusUpdate(deleteDialogItem, 'deleted')}>
              Delete Listing
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}

function StatCard({ title, value, bg = "bg-white", text = "text-slate-900", border = "" }: { title: string, value: number, bg?: string, text?: string, border?: string }) {
  return (
    <div className={`p-6 rounded-xl ${bg} ${border}`}>
      <h3 className="text-sm font-medium text-slate-500 mb-2">{title}</h3>
      <p className={`text-4xl font-semibold tracking-tight ${text}`}>{value.toLocaleString()}</p>
    </div>
  );
}