import { useEffect, useState } from "react";
import {
  Users, Crown, Clock, AlertCircle, CheckCircle, XCircle,
  Search, RefreshCw, CheckSquare, Square, Zap, ShieldOff, Shield, Star
} from "lucide-react";
import { authFetch } from "@/lib/authFetch";

interface AccountRecord {
  id: number;
  email: string | null;
  businessName: string | null;
  phone: string | null;
  isPremium: boolean;
  status: string;
  accountStatus: string;
  premiumRequestStatus: string | null;
  latestPaymentStatus: string | null;
  lastLoginAt: string | null;
  createdAt: string;
  premiumExpiryDate: string | null;
  profile: {
    name: string;
    city: string | null;
    state: string | null;
    country: string | null;
  } | null;
}

const STATUS_STYLES: Record<string, string> = {
  "Premium Active":     "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
  "Payment Submitted":  "bg-blue-500/10 text-blue-400 border border-blue-500/20",
  "Payment Approved":   "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
  "Payment Rejected":   "bg-red-500/10 text-red-400 border border-red-500/20",
  "Pending Payment":    "bg-amber-500/10 text-amber-400 border border-amber-500/20",
  "Lead":               "bg-slate-500/10 text-slate-400 border border-slate-500/20",
  "Suspended":          "bg-red-500/10 text-red-400 border border-red-500/20",
};

const STATUS_ICONS: Record<string, React.ElementType> = {
  "Premium Active":    Crown,
  "Payment Submitted": Clock,
  "Pending Payment":   Clock,
  "Payment Rejected":  XCircle,
  "Lead":              Users,
  "Suspended":         AlertCircle,
};

function StatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLES[status] || "bg-slate-500/10 text-slate-400";
  const Icon = STATUS_ICONS[status] || CheckCircle;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold ${style}`}>
      <Icon size={11} />
      {status}
    </span>
  );
}

export default function Accounts() {
  const [accounts, setAccounts]       = useState<AccountRecord[]>([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState("");
  const [filter, setFilter]           = useState<string>("all");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkMsg, setBulkMsg]         = useState("");
  const [expiryFilter, setExpiryFilter] = useState<"all" | "expiring_soon" | "expired">("all");
  const [selectedAccount, setSelectedAccount] = useState<AccountRecord | null>(null);

  const fetchAccounts = async () => {
    setLoading(true);
    setSelectedIds(new Set());
    try {
      const res = await authFetch("/api/admin/accounts");
      if (!res.ok) throw new Error("Failed to fetch accounts");
      setAccounts(await res.json());
    } catch (err) {
      console.error("Accounts fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAccounts(); }, []);

  const uniqueStatuses = ["all", ...Array.from(new Set(accounts.map(a => a.accountStatus)))];

  const filtered = accounts.filter(acc => {
    const matchSearch =
      !search ||
      acc.email?.toLowerCase().includes(search.toLowerCase()) ||
      acc.businessName?.toLowerCase().includes(search.toLowerCase()) ||
      acc.phone?.includes(search);
    const matchFilter = filter === "all" || acc.accountStatus === filter;

    let matchExpiry = true;
    if (expiryFilter === "expiring_soon" && acc.isPremium && acc.premiumExpiryDate) {
      const daysUntilExpiry = Math.ceil((new Date(acc.premiumExpiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      matchExpiry = daysUntilExpiry <= 7 && daysUntilExpiry > 0;
    } else if (expiryFilter === "expired" && acc.isPremium && acc.premiumExpiryDate) {
      matchExpiry = new Date(acc.premiumExpiryDate) < new Date();
    } else if (expiryFilter !== "all") {
      matchExpiry = false;
    }

    return matchSearch && matchFilter && matchExpiry;
  });

  const allSelected   = filtered.length > 0 && filtered.every(a => selectedIds.has(a.id));
  const someSelected  = filtered.some(a => selectedIds.has(a.id));
  const selectedCount = [...selectedIds].filter(id => filtered.find(a => a.id === id)).length;

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(prev => {
        const next = new Set(prev);
        filtered.forEach(a => next.delete(a.id));
        return next;
      });
    } else {
      setSelectedIds(prev => {
        const next = new Set(prev);
        filtered.forEach(a => next.add(a.id));
        return next;
      });
    }
  };

  const runBulkAction = async (action: string) => {
    const ids = [...selectedIds].filter(id => filtered.find(a => a.id === id));
    if (!ids.length) return;
    const label =
      action === "approvePremium" ? "approve premium for" :
      action === "suspend"        ? "suspend" :
      action === "activate"       ? "activate" :
      action === "grantBonus"     ? "grant +5 usage to" : action;
    if (!confirm(`${label.charAt(0).toUpperCase() + label.slice(1)} ${ids.length} account(s)?`)) return;
    setBulkLoading(true);
    setBulkMsg("");
    try {
      const res = await authFetch("/api/admin/users/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids, action, bonusAmount: 5 }),
      });
      const data = await res.json();
      setBulkMsg(data.message || "Done");
      setSelectedIds(new Set());
      fetchAccounts();
    } catch {
      setBulkMsg("Error — please try again.");
    } finally {
      setBulkLoading(false);
    }
  };

  const stats = {
    total:          accounts.length,
    premium:        accounts.filter(a => a.isPremium).length,
    pendingPayment: accounts.filter(a => a.premiumRequestStatus === "payment_submitted").length,
    leads:          accounts.filter(a => a.accountStatus === "Lead").length,
    expiringSoon:   accounts.filter(a => a.isPremium && a.premiumExpiryDate &&
      Math.ceil((new Date(a.premiumExpiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) <= 7 &&
      new Date(a.premiumExpiryDate) > new Date()
    ).length,
  };

  const exportToCSV = () => {
    const headers = ["ID", "Business Name", "Email", "Phone", "Status", "Premium", "Premium Expiry", "Joined", "Last Login", "City", "State", "Country"];
    const rows = filtered.map(acc => [
      String(acc.id),
      acc.businessName || acc.profile?.name || "",
      acc.email || "",
      acc.phone || "",
      acc.accountStatus,
      acc.isPremium ? "Yes" : "No",
      acc.premiumExpiryDate ? new Date(acc.premiumExpiryDate).toLocaleDateString() : "",
      new Date(acc.createdAt).toLocaleDateString(),
      acc.lastLoginAt ? new Date(acc.lastLoginAt).toLocaleDateString() : "Never",
      acc.profile?.city || "",
      acc.profile?.state || "",
      acc.profile?.country || "",
    ]);
    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `accounts_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Accounts</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Registered premium accounts and conversion pipeline</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-card border border-border text-muted-foreground text-sm font-semibold hover:bg-muted/50 transition-colors">
            <RefreshCw size={14} className="rotate-90" />
            Export CSV
          </button>
          <button onClick={fetchAccounts}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 text-primary text-sm font-semibold hover:bg-primary/20 transition-colors">
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: "Total Accounts", value: stats.total,          icon: Users,        color: "text-blue-400" },
          { label: "Premium Active", value: stats.premium,        icon: Crown,        color: "text-emerald-400" },
          { label: "Expiring Soon",  value: stats.expiringSoon,   icon: Clock,        color: "text-amber-400" },
          { label: "Pending Review", value: stats.pendingPayment, icon: AlertCircle,  color: "text-amber-400" },
          { label: "Leads",          value: stats.leads,          icon: Users,        color: "text-slate-400" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-card border border-border rounded-2xl p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Icon size={16} className={color} />
              <span className="text-xs text-muted-foreground font-medium">{label}</span>
            </div>
            <p className="text-2xl font-bold">{value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by email, business name, phone..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-card border border-border outline-none focus:border-primary text-sm"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto">
          {uniqueStatuses.map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${filter === s ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground hover:border-primary/30"}`}
            >
              {s === "all" ? "All" : s}
            </button>
          ))}
        </div>
      </div>

      {/* Quick Filters + Expiry Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-2">
          <button onClick={() => setFilter("Premium Active")}
            className="px-2 py-1 rounded-lg text-[9px] font-bold bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors">Premium</button>
          <button onClick={() => setFilter("Lead")}
            className="px-2 py-1 rounded-lg text-[9px] font-bold bg-slate-500/10 text-slate-400 hover:bg-slate-500/20 transition-colors">Leads</button>
          <button onClick={() => setFilter("Suspended")}
            className="px-2 py-1 rounded-lg text-[9px] font-bold bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors">Suspended</button>
        </div>
        <div className="flex gap-2 overflow-x-auto">
          {[
            { value: "all", label: "All Premium" },
            { value: "expiring_soon", label: "Expiring Soon (7 days)" },
            { value: "expired", label: "Expired" },
          ].map(f => (
            <button key={f.value} onClick={() => setExpiryFilter(f.value as any)}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-bold whitespace-nowrap transition-colors ${expiryFilter === f.value ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" : "bg-card border border-border text-muted-foreground hover:border-primary/30"}`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Bulk Action Bar */}
      {someSelected && (
        <div className="flex flex-wrap items-center gap-3 px-4 py-3 rounded-2xl border"
          style={{ background: "rgba(96,165,250,0.07)", borderColor: "rgba(96,165,250,0.25)" }}>
          <span className="text-xs font-bold text-blue-400">{selectedCount} selected</span>
          <div className="flex flex-wrap gap-2 flex-1">
            <button
              onClick={() => runBulkAction("approvePremium")}
              disabled={bulkLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
            >
              <Crown size={11} /> Approve Premium
            </button>
            <button
              onClick={() => runBulkAction("suspend")}
              disabled={bulkLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50"
            >
              <ShieldOff size={11} /> Suspend
            </button>
            <button
              onClick={() => runBulkAction("activate")}
              disabled={bulkLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 transition-colors disabled:opacity-50"
            >
              <Shield size={11} /> Activate
            </button>
            <button
              onClick={() => runBulkAction("grantBonus")}
              disabled={bulkLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20 transition-colors disabled:opacity-50"
            >
              <Star size={11} /> Grant +5 Usage
            </button>
          </div>
          {bulkLoading && <Zap size={14} className="text-primary animate-pulse" />}
          {bulkMsg && <span className="text-xs text-muted-foreground">{bulkMsg}</span>}
          <button
            onClick={() => { setSelectedIds(new Set()); setBulkMsg(""); }}
            className="ml-auto text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Clear
          </button>
        </div>
      )}

      {/* Table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <RefreshCw size={20} className="animate-spin mr-2" />
            Loading accounts...
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground space-y-2">
            <Users size={40} className="mx-auto opacity-30" />
            <p className="font-medium">{search || filter !== "all" ? "No accounts match your filter" : "No registered accounts yet"}</p>
            <p className="text-sm opacity-60">Accounts appear when users create a premium account</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="p-4 w-10">
                    <button
                      onClick={toggleSelectAll}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                      title={allSelected ? "Deselect all" : "Select all"}
                    >
                      {allSelected
                        ? <CheckSquare size={16} className="text-primary" />
                        : <Square size={16} />}
                    </button>
                  </th>
                  <th className="text-left p-4 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Business</th>
                  <th className="text-left p-4 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Contact</th>
                  <th className="text-left p-4 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Location</th>
                  <th className="text-left p-4 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Status</th>
                  <th className="text-left p-4 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Premium</th>
                  <th className="text-left p-4 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Joined</th>
                  <th className="text-left p-4 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Last Login</th>
                  <th className="text-right p-4 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map(acc => {
                  const checked = selectedIds.has(acc.id);
                  return (
                    <tr
                      key={acc.id}
                      className={`hover:bg-muted/20 transition-colors cursor-pointer ${checked ? "bg-primary/5" : ""}`}
                      onClick={() => setSelectedAccount(acc)}
                    >
                      <td className="p-4 w-10" onClick={e => { e.stopPropagation(); toggleSelect(acc.id); }}>
                        {checked
                          ? <CheckSquare size={15} className="text-primary" />
                          : <Square size={15} className="text-muted-foreground" />}
                      </td>
                      <td className="p-4">
                        <p className="font-semibold">{acc.businessName || acc.profile?.name || "—"}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">ID #{acc.id}</p>
                      </td>
                      <td className="p-4">
                        <p className="text-sm">{acc.email || "—"}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{acc.phone || "—"}</p>
                      </td>
                      <td className="p-4">
                        <p className="text-sm text-muted-foreground">
                          {[acc.profile?.city, acc.profile?.state, acc.profile?.country]
                            .filter(Boolean)
                            .join(", ") || "—"}
                        </p>
                      </td>
                      <td className="p-4">
                        <StatusBadge status={acc.accountStatus} />
                      </td>
                      <td className="p-4">
                        {acc.isPremium ? (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
                              <Crown size={10} /> Active
                            </span>
                            {acc.premiumExpiryDate && (
                              <p className="text-[9px] text-muted-foreground">Expires: {new Date(acc.premiumExpiryDate).toLocaleDateString()}</p>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">Free</span>
                        )}
                      </td>
                      <td className="p-4 text-xs text-muted-foreground">
                        {new Date(acc.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
                      </td>
                      <td className="p-4 text-xs text-muted-foreground">
                        {acc.lastLoginAt
                          ? new Date(acc.lastLoginAt).toLocaleDateString("en-NG", { day: "numeric", month: "short" })
                          : "Never"}
                      </td>
                      <td className="p-4 text-right" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          {!acc.isPremium && acc.accountStatus !== "Suspended" && (
                            <button onClick={async () => { if (confirm(`Approve premium for ${acc.businessName || acc.email}?`)) { await authFetch(`/api/admin/users/${acc.id}/approve-premium`, { method: "POST" }); fetchAccounts(); } }}
                              className="p-1.5 rounded-lg hover:bg-emerald-500/10 text-emerald-400 transition-colors" title="Approve Premium">
                              <Crown size={14} />
                            </button>
                          )}
                          {acc.accountStatus !== "Suspended" ? (
                            <button onClick={async () => { if (confirm(`Suspend ${acc.businessName || acc.email}?`)) { await authFetch(`/api/admin/users/${acc.id}/suspend`, { method: "POST" }); fetchAccounts(); } }}
                              className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-400 transition-colors" title="Suspend">
                              <ShieldOff size={14} />
                            </button>
                          ) : (
                            <button onClick={async () => { if (confirm(`Activate ${acc.businessName || acc.email}?`)) { await authFetch(`/api/admin/users/${acc.id}/activate`, { method: "POST" }); fetchAccounts(); } }}
                              className="p-1.5 rounded-lg hover:bg-emerald-500/10 text-emerald-400 transition-colors" title="Activate">
                              <Shield size={14} />
                            </button>
                          )}
                          <button onClick={async () => { if (confirm(`Grant +5 usage bonus to ${acc.businessName || acc.email}?`)) { await authFetch(`/api/admin/users/${acc.id}/grant-bonus`, { method: "POST" }); fetchAccounts(); } }}
                            className="p-1.5 rounded-lg hover:bg-amber-500/10 text-amber-400 transition-colors" title="Grant Bonus Usage">
                            <Star size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground text-right">
        {filtered.length} of {accounts.length} accounts shown
        {selectedCount > 0 && ` · ${selectedCount} selected`}
      </p>

      {/* Account Details Modal */}
      {selectedAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedAccount(null)}>
          <div className="relative max-w-md w-full bg-card border border-border rounded-3xl p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setSelectedAccount(null)} className="absolute top-4 right-4 p-1 rounded-full hover:bg-muted/50">
              <XCircle size={18} />
            </button>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Users size={20} className="text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">{selectedAccount.businessName || selectedAccount.profile?.name || "Unknown"}</h3>
                  <p className="text-xs text-muted-foreground">ID #{selectedAccount.id}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Email</p>
                  <p className="font-medium">{selectedAccount.email || "—"}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Phone</p>
                  <p className="font-medium">{selectedAccount.phone || "—"}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Location</p>
                  <p className="font-medium">
                    {[selectedAccount.profile?.city, selectedAccount.profile?.state, selectedAccount.profile?.country].filter(Boolean).join(", ") || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Joined</p>
                  <p className="font-medium">{new Date(selectedAccount.createdAt).toLocaleDateString()}</p>
                </div>
                {selectedAccount.isPremium && (
                  <div className="col-span-2">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Premium Expiry</p>
                    <p className="font-medium text-amber-400">
                      {selectedAccount.premiumExpiryDate ? new Date(selectedAccount.premiumExpiryDate).toLocaleDateString() : "Lifetime"}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
