import React, { useState, useEffect } from "react";
import { authFetch } from "@/lib/authFetch";
import { 
  Card, CardContent, CardHeader, CardTitle, CardDescription 
} from "@/components/ui/card";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { 
  CheckCircle2, XCircle, RefreshCw, Search, ExternalLink, 
  Image as ImageIcon, MoreHorizontal, User, Mail, Phone,
  Banknote, CreditCard, Clock, Loader2
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter 
} from "@/components/ui/dialog";

interface Payment {
  id: number;
  userId: number;
  amount: number;
  method: string;
  status: string;
  reference?: string;
  evidenceUrl?: string;
  adminNotes?: string;
  createdAt: string;
  verifiedAt?: string;
}

export default function Payment() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [currencySettings, setCurrencySettings] = useState({ code: "NGN", symbol: "₦" });
  const [approvingId, setApprovingId] = useState<number | null>(null);
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "success" | "failed">("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedPayments, setSelectedPayments] = useState<number[]>([]);
  const [showBulkApproveDialog, setShowBulkApproveDialog] = useState(false);
  const [showEvidenceDialog, setShowEvidenceDialog] = useState(false);
  const [evidencePayment, setEvidencePayment] = useState<Payment | null>(null);
  const [showDateFilter, setShowDateFilter] = useState(false);
  const { toast } = useToast();

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const res = await authFetch("/api/admin/payments");
      if (res.ok) {
        const data = await res.json();
        setPayments(data);
      }
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "Failed to load payments" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
    fetch("/api/payment-info")
      .then(res => res.json())
      .then(data => {
        if (data.currencyCode && data.currencySymbol) {
          setCurrencySettings({ code: data.currencyCode, symbol: data.currencySymbol });
        }
      });
  }, []);

  const handleApprove = async (id: number) => {
    if (!confirm("Are you sure you want to approve this payment and activate the license?")) return;
    setApprovingId(id);
    try {
      const res = await authFetch(`/api/admin/payments/${id}/approve`, { method: "POST" });
      if (res.ok) {
        toast({ title: "Approved", description: "Payment approved and license generated." });
        fetchPayments();
      }
    } catch (err) {
      toast({ variant: "destructive", title: "Error" });
    } finally {
      setApprovingId(null);
    }
  };

  const handleReject = async () => {
    if (!selectedPayment || !rejectReason) return;
    setRejectingId(selectedPayment.id);
    try {
      const res = await authFetch(`/api/admin/payments/${selectedPayment.id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: rejectReason })
      });
      if (res.ok) {
        toast({ title: "Rejected", description: "Payment has been rejected." });
        setShowRejectDialog(false);
        setRejectReason("");
        fetchPayments();
      }
    } catch (err) {
      toast({ variant: "destructive", title: "Error" });
    } finally {
      setRejectingId(null);
    }
  };

  const filteredPayments = payments.filter(p => {
    const matchesSearch = p.reference?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.method.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || p.status === statusFilter;
    let matchesDate = true;
    if (dateFrom) matchesDate = matchesDate && new Date(p.createdAt) >= new Date(dateFrom);
    if (dateTo) {
      const endDate = new Date(dateTo);
      endDate.setHours(23, 59, 59);
      matchesDate = matchesDate && new Date(p.createdAt) <= endDate;
    }
    return matchesSearch && matchesStatus && matchesDate;
  });

  const handleBulkApprove = async () => {
    setShowBulkApproveDialog(false);
    for (const id of selectedPayments) {
      await authFetch(`/api/admin/payments/${id}/approve`, { method: "POST" });
    }
    toast({ title: "Bulk Approve", description: `${selectedPayments.length} payments approved.` });
    setSelectedPayments([]);
    fetchPayments();
  };

  const exportToCSV = () => {
    const headers = ["Reference", "Method", "Amount", "Status", "Date", "User ID"];
    const rows = filteredPayments.map(p => [
      p.reference || "", p.method, String(p.amount), p.status,
      new Date(p.createdAt).toLocaleString(), String(p.userId),
    ]);
    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payments_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatPrice = (p: number) => {
    return new Intl.NumberFormat('en-NG', { 
      style: 'currency', 
      currency: currencySettings.code,
      maximumFractionDigits: 0,
    }).format(p).replace(currencySettings.code, currencySettings.symbol);
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Payment Management</h1>
          <p className="text-muted-foreground text-sm">Review transactions and approve manual payments.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportToCSV} className="rounded-xl gap-2">
            <RefreshCw size={16} className="rotate-90" />
            Export CSV
          </Button>
          <Button variant="outline" onClick={fetchPayments} disabled={loading} className="rounded-xl gap-2">
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Refresh
          </Button>
        </div>
      </div>

      {/* ── Stats Cards ── */}
      {(() => {
        const stats = {
          total: payments.length,
          pending: payments.filter(p => p.status === "pending").length,
          approved: payments.filter(p => p.status === "success").length,
          rejected: payments.filter(p => p.status === "failed").length,
          totalAmount: payments.reduce((sum, p) => p.status === "success" ? sum + p.amount : sum, 0),
        };
        return (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { label: "Total Payments", value: stats.total, icon: CreditCard, color: "text-primary", bg: "bg-primary/10" },
              { label: "Pending", value: stats.pending, icon: Clock, color: "text-amber-500", bg: "bg-amber-500/10" },
              { label: "Approved", value: stats.approved, icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500/10" },
              { label: "Rejected", value: stats.rejected, icon: XCircle, color: "text-red-500", bg: "bg-red-500/10" },
              { label: "Total Revenue", value: formatPrice(stats.totalAmount), icon: Banknote, color: "text-primary", bg: "bg-primary/10" },
            ].map(({ label, value, icon: Icon, color, bg }) => (
              <div key={label} className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${bg}`}>
                  <Icon size={18} className={color} />
                </div>
                <div>
                  <p className="text-xl font-black text-foreground leading-none">{value}</p>
                  <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground mt-1">{label}</p>
                </div>
              </div>
            ))}
          </div>
        );
      })()}

      {/* ── Status Filter + Search ── */}
      <div className="flex flex-col gap-4">
        <div className="flex gap-2 flex-wrap">
          {[
            { value: "all", label: "All", count: payments.length },
            { value: "pending", label: "Pending", count: payments.filter(p => p.status === "pending").length },
            { value: "success", label: "Approved", count: payments.filter(p => p.status === "success").length },
            { value: "failed", label: "Rejected", count: payments.filter(p => p.status === "failed").length },
          ].map(f => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value as any)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
                statusFilter === f.value
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                  : "bg-muted/30 text-muted-foreground hover:bg-muted/50"
              }`}
            >
              {f.label}
              {f.count > 0 && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  statusFilter === f.value ? "bg-white/20" : "bg-muted/50"
                }`}>
                  {f.count}
                </span>
              )}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by reference or method..."
              className="pl-10 rounded-xl bg-muted/20 border-border"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDateFilter(!showDateFilter)}
            className={`rounded-xl gap-2 ${showDateFilter || dateFrom || dateTo ? "border-primary/40 text-primary" : ""}`}
          >
            <Clock size={14} /> Date Filter
          </Button>
        </div>
        {(showDateFilter || dateFrom || dateTo) && (
          <div className="flex items-center gap-2">
            <Input
              type="date"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              className="w-36 rounded-xl bg-muted/20 border-border text-sm"
            />
            <span className="text-muted-foreground text-xs">—</span>
            <Input
              type="date"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              className="w-36 rounded-xl bg-muted/20 border-border text-sm"
            />
            {(dateFrom || dateTo) && (
              <Button variant="ghost" size="sm" onClick={() => { setDateFrom(""); setDateTo(""); }} className="rounded-xl">
                Clear
              </Button>
            )}
          </div>
        )}
      </div>

      <Card className="rounded-3xl border-none shadow-2xl bg-card overflow-hidden">
        <CardHeader className="border-b border-border/50">
          <CardTitle className="text-sm font-black uppercase tracking-wider">Transactions</CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="w-8 px-4">
                  <input
                    type="checkbox"
                    checked={selectedPayments.length === filteredPayments.filter(p => p.status === "pending").length && filteredPayments.filter(p => p.status === "pending").length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedPayments(filteredPayments.filter(p => p.status === "pending").map(p => p.id));
                      } else {
                        setSelectedPayments([]);
                      }
                    }}
                    className="rounded border-border"
                  />
                </TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-primary/70 h-14 px-6">Method</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-primary/70 h-14 px-6">Amount</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-primary/70 h-14 px-6">Reference</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-primary/70 h-14 px-6">Status</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-primary/70 h-14 px-6">Date</TableHead>
                <TableHead className="text-right text-[10px] font-black uppercase tracking-widest text-primary/70 h-14 px-6">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayments.map((p) => (
                <TableRow key={p.id} className="border-b border-border hover:bg-muted/10 transition-colors">
                  <TableCell className="px-4 py-5">
                    {p.status === "pending" && (
                      <input
                        type="checkbox"
                        checked={selectedPayments.includes(p.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedPayments([...selectedPayments, p.id]);
                          } else {
                            setSelectedPayments(selectedPayments.filter(id => id !== p.id));
                          }
                        }}
                        className="rounded border-border"
                      />
                    )}
                  </TableCell>
                  <TableCell className="px-6 py-5">
                    <div className="flex items-center gap-2 font-bold text-sm">
                      {p.method === 'paystack' ? <CreditCard size={14} className="text-emerald-500" /> : <Banknote size={14} className="text-blue-500" />}
                      <span className="capitalize">{p.method}</span>
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-5 font-black text-primary">{formatPrice(p.amount)}</TableCell>
                  <TableCell className="px-6 py-5">
                    <span className="font-mono text-[10px] bg-muted px-2 py-1 rounded-md text-muted-foreground">
                      {p.reference || "N/A"}
                    </span>
                  </TableCell>
                  <TableCell className="px-6 py-5">
                    <Badge variant={p.status === 'success' ? 'default' : p.status === 'pending' ? 'secondary' : 'destructive'} className="capitalize rounded-full px-3">
                      {p.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-6 py-5 text-xs text-muted-foreground">
                    {new Date(p.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="px-6 py-5 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full"><MoreHorizontal size={16} /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48 rounded-xl p-2">
                        {p.evidenceUrl && (
                          <DropdownMenuItem onClick={() => { setEvidencePayment(p); setShowEvidenceDialog(true); }} className="rounded-lg gap-2 cursor-pointer">
                            <ImageIcon size={14} /> View Evidence
                          </DropdownMenuItem>
                        )}
                        {p.status === 'pending' && p.method === 'manual' && (
                          <>
                            <DropdownMenuItem onClick={() => handleApprove(p.id)} disabled={approvingId === p.id} className="rounded-lg gap-2 text-emerald-500 cursor-pointer">
                              {approvingId === p.id ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />} Approve & Activate
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => { setSelectedPayment(p); setShowRejectDialog(true); }} className="rounded-lg gap-2 text-red-500 cursor-pointer">
                              <XCircle size={14} /> Reject Payment
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {filteredPayments.length === 0 && (
                <TableRow><TableCell colSpan={6} className="h-32 text-center text-muted-foreground">No transactions found.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent className="rounded-3xl max-w-md">
          <DialogHeader>
            <DialogTitle>Reject Payment</DialogTitle>
            <DialogDescription>Please provide a reason for rejecting this payment. The user will see this note.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input 
              placeholder="e.g. Receipt is unreadable, Amount doesn't match" 
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="h-12 rounded-xl"
            />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowRejectDialog(false)} className="rounded-xl h-12 flex-1">Cancel</Button>
            <Button variant="destructive" onClick={handleReject} disabled={!rejectReason || rejectingId !== null} className="rounded-xl h-12 flex-1">
              {rejectingId !== null ? <Loader2 className="animate-spin mr-1" /> : null} Reject Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Evidence Dialog ── */}
      <Dialog open={showEvidenceDialog} onOpenChange={setShowEvidenceDialog}>
        <DialogContent className="rounded-3xl max-w-2xl">
          <DialogHeader>
            <DialogTitle>Payment Evidence</DialogTitle>
            <DialogDescription>
              Reference: {evidencePayment?.reference} • Amount: {evidencePayment && formatPrice(evidencePayment.amount)}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {evidencePayment?.evidenceUrl && (
              <img
                src={evidencePayment.evidenceUrl.replace('/uploads/', '/api/uploads/')}
                alt="Payment Evidence"
                className="rounded-xl w-full max-h-[50vh] object-contain bg-muted/20"
              />
            )}
          </div>
          {evidencePayment?.status === "pending" && evidencePayment?.method === "manual" && (
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setShowEvidenceDialog(false)} className="rounded-xl">
                Close
              </Button>
              <Button
                onClick={() => {
                  handleApprove(evidencePayment.id);
                  setShowEvidenceDialog(false);
                }}
                className="rounded-xl bg-emerald-500 hover:bg-emerald-600"
              >
                Approve Payment
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Bulk Action Bar ── */}
      {selectedPayments.length > 0 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-card border border-primary/30 rounded-2xl shadow-2xl p-3 flex items-center gap-4">
          <span className="text-sm font-bold">{selectedPayments.length} selected</span>
          <Button
            onClick={() => setShowBulkApproveDialog(true)}
            className="rounded-xl bg-emerald-500 hover:bg-emerald-600"
          >
            <CheckCircle2 size={14} className="mr-1" /> Approve All
          </Button>
          <Button variant="outline" onClick={() => setSelectedPayments([])} className="rounded-xl">
            Clear
          </Button>
        </div>
      )}

      {/* ── Bulk Approve Confirmation ── */}
      <Dialog open={showBulkApproveDialog} onOpenChange={setShowBulkApproveDialog}>
        <DialogContent className="rounded-3xl max-w-sm">
          <DialogHeader>
            <DialogTitle>Approve {selectedPayments.length} Payments?</DialogTitle>
            <DialogDescription>This will activate licenses for all selected payments.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowBulkApproveDialog(false)} className="rounded-xl flex-1">Cancel</Button>
            <Button onClick={handleBulkApprove} className="rounded-xl bg-emerald-500 hover:bg-emerald-600 flex-1">
              Yes, Approve All
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
