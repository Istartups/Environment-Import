import React, { useState, useEffect } from "react";
import { authFetch } from "@/lib/authFetch";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Loader2, Plus, RefreshCw, Key, Copy, Search,
  User, Monitor, MoreHorizontal, Send, Trash2,
  XCircle, Building2, Mail, Phone, MessageSquare, Power,
  PackagePlus, Pencil, CircleDollarSign, Smartphone, Wand2,
  ShieldCheck, AlertTriangle, TrendingUp
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { openWhatsApp, openSMS, openEmail } from "@/lib/utils";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

interface License {
  id: number;
  key: string;
  status: "active" | "expired" | "suspended" | "revoked";
  customerName?: string;
  businessName?: string;
  email?: string;
  phone?: string;
  activationDate?: string;
  expiryDate?: string;
  createdAt: string;
}

interface DevicePlan {
  id: number;
  name: string;
  description?: string;
  deviceCount: number;
  price: number;
  isActive: boolean;
  sortOrder: number;
}

const emptyPlan: Omit<DevicePlan, "id"> = {
  name: "",
  description: "",
  deviceCount: 1,
  price: 0,
  isActive: true,
  sortOrder: 0,
};

const STATUS_CONFIG = {
  active:    { label: "Active",    className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
  expired:   { label: "Expired",   className: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
  suspended: { label: "Suspended", className: "bg-orange-500/10 text-orange-600 border-orange-500/20" },
  revoked:   { label: "Revoked",   className: "bg-red-500/10 text-red-600 border-red-500/20" },
};

export default function LicenseManagement() {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newLicense, setNewLicense] = useState({ customerName: "", businessName: "", email: "", phone: "" });
  const [submitting, setSubmitting] = useState(false);

  const [plans, setPlans] = useState<DevicePlan[]>([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [showPlanDialog, setShowPlanDialog] = useState(false);
  const [editingPlan, setEditingPlan] = useState<DevicePlan | null>(null);
  const [planForm, setPlanForm] = useState<Omit<DevicePlan, "id">>(emptyPlan);
  const [planSubmitting, setPlanSubmitting] = useState(false);
  const [deletingPlanId, setDeletingPlanId] = useState<number | null>(null);
  const [seeding, setSeeding] = useState(false);

  const { toast } = useToast();

  const fetchLicenses = async () => {
    setLoading(true);
    try {
      const res = await authFetch("/api/admin/licenses");
      if (res.ok) setLicenses(await res.json());
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Failed to load licenses" });
    } finally {
      setLoading(false);
    }
  };

  const fetchPlans = async () => {
    setPlansLoading(true);
    try {
      const res = await authFetch("/api/admin/device-plans");
      if (res.ok) {
        const data = await res.json();
        setPlans(data);
      }
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Failed to load device plans" });
    } finally {
      setPlansLoading(false);
    }
  };

  const seedPlansFromSettings = async () => {
    setSeeding(true);
    try {
      const infoRes = await fetch("/api/payment-info");
      if (!infoRes.ok) throw new Error("Could not fetch payment settings");
      const info = await infoRes.json();

      const tiers: { deviceCount: number; price: number; name: string; description: string }[] = [];
      if (info.price)        tiers.push({ deviceCount: 1, price: info.price,        name: "1 Device",  description: "Premium license for a single device" });
      if (info.price2Device) tiers.push({ deviceCount: 2, price: info.price2Device, name: "2 Devices", description: "Premium license for up to 2 devices" });
      if (info.price3Device) tiers.push({ deviceCount: 3, price: info.price3Device, name: "3 Devices", description: "Premium license for up to 3 devices" });
      if (info.price5Device) tiers.push({ deviceCount: 5, price: info.price5Device, name: "5 Devices", description: "Premium license for up to 5 devices" });

      if (tiers.length === 0) {
        toast({ title: "No prices found", description: "Set prices in Payment Settings first." });
        return;
      }

      for (let i = 0; i < tiers.length; i++) {
        const t = tiers[i];
        await authFetch("/api/admin/device-plans", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...t, isActive: true, sortOrder: i }),
        });
      }

      toast({ title: `✨ ${tiers.length} plans created`, description: "Device plans seeded from your saved prices." });
      await fetchPlans();
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Could not seed plans from payment settings." });
    } finally {
      setSeeding(false);
    }
  };

  useEffect(() => { fetchLicenses(); fetchPlans(); }, []);

  const handleCreate = async () => {
    setSubmitting(true);
    try {
      const res = await authFetch("/api/admin/licenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newLicense),
      });
      if (res.ok) {
        toast({ title: "License Created", description: "New license generated successfully." });
        setShowCreateDialog(false);
        setNewLicense({ customerName: "", businessName: "", email: "", phone: "" });
        fetchLicenses();
      }
    } catch {
      toast({ variant: "destructive", title: "Error" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id: number, status: string) => {
    try {
      const res = await authFetch(`/api/admin/licenses/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) { toast({ title: "Status Updated" }); fetchLicenses(); }
    } catch {
      toast({ variant: "destructive", title: "Error" });
    }
  };

  const handleResend = async (id: number) => {
    try {
      const res = await authFetch(`/api/admin/licenses/${id}/resend`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        const text = `Hello ${data.details.businessName},\n\nYour OneTailor Premium License is ready!\n\nLicense Key: ${data.details.key}\n\nThank you for choosing OneTailor!`;
        navigator.clipboard.writeText(text);
        toast({ title: "Ready to Resend", description: "License details copied to clipboard." });
      }
    } catch {
      toast({ variant: "destructive", title: "Error" });
    }
  };

  const openPlanDialog = (plan?: DevicePlan) => {
    if (plan) {
      setEditingPlan(plan);
      setPlanForm({ name: plan.name, description: plan.description || "", deviceCount: plan.deviceCount, price: plan.price, isActive: plan.isActive, sortOrder: plan.sortOrder });
    } else {
      setEditingPlan(null);
      setPlanForm(emptyPlan);
    }
    setShowPlanDialog(true);
  };

  const handleSavePlan = async () => {
    setPlanSubmitting(true);
    try {
      const method = editingPlan ? "PUT" : "POST";
      const url = editingPlan ? `/api/admin/device-plans/${editingPlan.id}` : "/api/admin/device-plans";
      const res = await authFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(planForm),
      });
      if (res.ok) {
        toast({ title: editingPlan ? "Plan Updated" : "Plan Created" });
        setShowPlanDialog(false);
        fetchPlans();
      } else {
        const err = await res.json();
        toast({ variant: "destructive", title: "Error", description: err.message || "Failed to save plan" });
      }
    } catch {
      toast({ variant: "destructive", title: "Error" });
    } finally {
      setPlanSubmitting(false);
    }
  };

  const handleDeletePlan = async (id: number) => {
    setDeletingPlanId(id);
    try {
      const res = await authFetch(`/api/admin/device-plans/${id}`, { method: "DELETE" });
      if (res.ok) { toast({ title: "Plan Deleted" }); fetchPlans(); }
      else toast({ variant: "destructive", title: "Error", description: "Failed to delete plan" });
    } catch {
      toast({ variant: "destructive", title: "Error" });
    } finally {
      setDeletingPlanId(null);
    }
  };

  const filteredLicenses = licenses.filter(l =>
    l.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.businessName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeLicenses   = licenses.filter(l => l.status === "active").length;
  const suspendedLicenses = licenses.filter(l => l.status === "suspended" || l.status === "revoked").length;

  return (
    <div className="space-y-8 pb-20">

      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/50 mb-1">Admin</p>
          <h1 className="text-3xl font-black text-foreground tracking-tight">License Management</h1>
          <p className="text-sm text-muted-foreground mt-1">Monitor licenses and manage device plan offerings.</p>
        </div>
      </div>

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Licenses", value: licenses.length, icon: Key,         color: "text-primary",      bg: "bg-primary/10" },
          { label: "Active",         value: activeLicenses,  icon: ShieldCheck,  color: "text-emerald-500",  bg: "bg-emerald-500/10" },
          { label: "Suspended",      value: suspendedLicenses, icon: AlertTriangle, color: "text-orange-500", bg: "bg-orange-500/10" },
          { label: "Device Plans",   value: plans.length,    icon: PackagePlus,  color: "text-violet-500",   bg: "bg-violet-500/10" },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-card border border-border rounded-2xl p-5 flex items-center gap-4">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${bg}`}>
              <Icon size={20} className={color} />
            </div>
            <div>
              <p className="text-2xl font-black text-foreground leading-none">{value}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mt-1">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Tabs ── */}
      <Tabs defaultValue="licenses" className="space-y-6">
        <TabsList className="bg-muted/40 border border-border rounded-2xl p-1 flex gap-1 w-full max-w-xs">
          <TabsTrigger value="licenses" className="flex-1 rounded-xl px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center justify-center gap-2 font-bold text-sm transition-all">
            <Key className="w-3.5 h-3.5" /> Licenses
          </TabsTrigger>
          <TabsTrigger value="device-plans" className="flex-1 rounded-xl px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center justify-center gap-2 font-bold text-sm transition-all">
            <PackagePlus className="w-3.5 h-3.5" /> Plans
          </TabsTrigger>
        </TabsList>

        {/* ════ Licenses Tab ════ */}
        <TabsContent value="licenses" className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
          <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, business or key…"
                className="pl-10 h-11 rounded-xl bg-muted/20 border-border"
              />
            </div>
            <div className="flex gap-2 shrink-0">
              <Button variant="outline" onClick={fetchLicenses} disabled={loading} className="rounded-xl h-11 gap-2 font-bold">
                <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
                Refresh
              </Button>
              <Button onClick={() => setShowCreateDialog(true)} className="rounded-xl h-11 gap-2 font-bold">
                <Plus size={15} />
                New License
              </Button>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            {/* Table header */}
            <div className="px-6 py-4 border-b border-border bg-muted/20">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                {filteredLicenses.length} {filteredLicenses.length === 1 ? "license" : "licenses"}
              </p>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-48">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : filteredLicenses.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-16 text-center px-6">
                <div className="w-14 h-14 bg-muted/40 rounded-2xl flex items-center justify-center">
                  <Key size={24} className="text-muted-foreground" />
                </div>
                <p className="font-bold text-foreground">{searchQuery ? "No matches found" : "No licenses yet"}</p>
                <p className="text-sm text-muted-foreground">
                  {searchQuery ? "Try a different search term." : "Generate a new license to get started."}
                </p>
                {!searchQuery && (
                  <Button onClick={() => setShowCreateDialog(true)} className="rounded-xl gap-2 mt-1">
                    <Plus size={15} /> Generate License
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-border">
                      <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground h-12 px-6">Business / User</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground h-12 px-6">License Key</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground h-12 px-6">Status</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground h-12 px-6">Activated</TableHead>
                      <TableHead className="text-right text-[10px] font-black uppercase tracking-widest text-muted-foreground h-12 px-6">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLicenses.map((l) => {
                      const initials = ((l.businessName || l.customerName || "?")[0] || "?").toUpperCase();
                      const cfg = STATUS_CONFIG[l.status] || STATUS_CONFIG.active;
                      return (
                        <TableRow key={l.id} className="border-border hover:bg-muted/10 transition-colors group">
                          <TableCell className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/15 flex items-center justify-center shrink-0">
                                <span className="text-xs font-black text-primary">{initials}</span>
                              </div>
                              <div>
                                <p className="font-bold text-sm text-foreground">{l.businessName || "Unknown"}</p>
                                <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                                  <User size={9} /> {l.customerName || "—"}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <code className="text-[11px] font-mono bg-primary/5 text-primary px-2.5 py-1 rounded-lg border border-primary/10">{l.key}</code>
                              <button
                                onClick={() => { navigator.clipboard.writeText(l.key); toast({ title: "Copied!" }); }}
                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <Copy size={13} className="text-muted-foreground hover:text-primary" />
                              </button>
                            </div>
                          </TableCell>
                          <TableCell className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold border ${cfg.className}`}>
                              {cfg.label}
                            </span>
                          </TableCell>
                          <TableCell className="px-6 py-4 text-xs text-muted-foreground">
                            {l.activationDate ? new Date(l.activationDate).toLocaleDateString() : "Never"}
                          </TableCell>
                          <TableCell className="px-6 py-4 text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full hover:bg-muted">
                                  <MoreHorizontal size={15} />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48 rounded-xl p-2">
                                <DropdownMenuItem onClick={() => handleResend(l.id)} className="rounded-lg gap-2.5 cursor-pointer text-sm">
                                  <Copy size={14} /> Copy Details
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => {
                                    if (!l.phone) { toast({ title: "No phone number" }); return; }
                                    openWhatsApp(l.phone, `Hello ${l.businessName || l.customerName || "Customer"},\n\nYour OneTailor Premium License is ready!\n\nLicense Key: ${l.key}\n\nThank you for choosing OneTailor!`);
                                  }}
                                  className="rounded-lg gap-2.5 cursor-pointer text-sm text-emerald-600"
                                >
                                  <MessageSquare size={14} /> Send WhatsApp
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    if (!l.phone) { toast({ title: "No phone number" }); return; }
                                    openSMS(l.phone, `Hello ${l.businessName || l.customerName || "Customer"}, your OneTailor License is: ${l.key}`);
                                  }}
                                  className="rounded-lg gap-2.5 cursor-pointer text-sm text-blue-600"
                                >
                                  <Send size={14} /> Send SMS
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    if (!l.email) { toast({ title: "No email" }); return; }
                                    openEmail(l.email, "Your OneTailor License Key", `Hello ${l.businessName || l.customerName || "Customer"},\n\nYour OneTailor Premium License is ready!\n\nLicense Key: ${l.key}\n\nThank you for choosing OneTailor!`);
                                  }}
                                  className="rounded-lg gap-2.5 cursor-pointer text-sm text-orange-600"
                                >
                                  <Mail size={14} /> Send Email
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleUpdateStatus(l.id, l.status === "active" ? "suspended" : "active")}
                                  className="rounded-lg gap-2.5 cursor-pointer text-sm"
                                >
                                  <Power size={14} /> {l.status === "active" ? "Suspend" : "Activate"}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleUpdateStatus(l.id, "revoked")}
                                  className="rounded-lg gap-2.5 text-red-500 cursor-pointer text-sm"
                                >
                                  <XCircle size={14} /> Revoke License
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </TabsContent>

        {/* ════ Device Plans Tab ════ */}
        <TabsContent value="device-plans" className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
          <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
            <div>
              <p className="text-sm text-muted-foreground">Plans users can select when expanding their device count.</p>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button variant="outline" onClick={fetchPlans} disabled={plansLoading} className="rounded-xl h-11 gap-2 font-bold">
                <RefreshCw size={15} className={plansLoading ? "animate-spin" : ""} />
                Refresh
              </Button>
              <Button onClick={() => openPlanDialog()} className="rounded-xl h-11 gap-2 font-bold">
                <Plus size={15} />
                New Plan
              </Button>
            </div>
          </div>

          {plansLoading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : plans.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-border bg-card/50">
              <div className="p-12 flex flex-col items-center gap-5 text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
                  <PackagePlus className="w-8 h-8 text-primary/60" />
                </div>
                <div>
                  <p className="font-black text-lg text-foreground">No Device Plans Yet</p>
                  <p className="text-sm text-muted-foreground mt-1 max-w-xs">Create plans so users can expand their license to more devices.</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    onClick={seedPlansFromSettings}
                    disabled={seeding}
                    variant="outline"
                    className="rounded-xl gap-2 font-bold border-primary/30 text-primary hover:bg-primary/5"
                  >
                    {seeding ? <Loader2 size={15} className="animate-spin" /> : <Wand2 size={15} />}
                    Auto-seed from Prices
                  </Button>
                  <Button onClick={() => openPlanDialog()} className="rounded-xl gap-2 font-bold">
                    <Plus size={15} /> Create Manually
                  </Button>
                </div>
                <p className="text-[11px] text-muted-foreground max-w-xs">
                  <strong>Auto-seed</strong> reads your saved payment prices (1 / 2 / 3 / 5 device tiers) and creates matching plans automatically.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className={`rounded-2xl border bg-card overflow-hidden transition-all flex flex-col ${plan.isActive ? "border-border hover:border-primary/30" : "border-border/30 opacity-55"}`}
                >
                  {/* Card accent bar */}
                  <div className="h-1 w-full" style={{ background: plan.isActive ? "linear-gradient(90deg, hsl(var(--primary)), hsl(var(--primary)/0.4))" : "hsl(var(--muted))" }} />

                  <div className="p-5 flex-1 space-y-4">
                    {/* Header row */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-base text-foreground truncate">{plan.name}</p>
                        {plan.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{plan.description}</p>}
                      </div>
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border shrink-0 ${plan.isActive ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : "bg-muted text-muted-foreground border-border"}`}>
                        {plan.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>

                    {/* Metrics */}
                    <div className="flex items-center gap-5">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-muted/40 rounded-lg flex items-center justify-center">
                          <Monitor size={14} className="text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-xs font-black text-foreground leading-none">{plan.deviceCount}</p>
                          <p className="text-[10px] text-muted-foreground">devices</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                          <TrendingUp size={14} className="text-primary" />
                        </div>
                        <div>
                          <p className="text-xs font-black text-primary leading-none">{Number(plan.price).toLocaleString()}</p>
                          <p className="text-[10px] text-muted-foreground">price</p>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2 border-t border-border/50">
                      <Button variant="outline" size="sm" onClick={() => openPlanDialog(plan)} className="flex-1 rounded-xl h-9 gap-1.5 text-xs font-bold">
                        <Pencil size={12} /> Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={deletingPlanId === plan.id}
                        onClick={() => handleDeletePlan(plan.id)}
                        className="rounded-xl h-9 w-9 p-0 text-red-500 border-red-500/20 hover:bg-red-500/10 hover:border-red-500/40"
                      >
                        {deletingPlanId === plan.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ── Create License Dialog ── */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="rounded-3xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-black">Generate New License</DialogTitle>
            <DialogDescription>Manually create a premium license for a customer.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {[
              { label: "Business Name", placeholder: "e.g. Joyful Stitches", key: "businessName", icon: Building2, required: true },
              { label: "Customer Name", placeholder: "Full Name", key: "customerName", icon: User },
            ].map(({ label, placeholder, key, icon: Icon, required }) => (
              <div key={key} className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground ml-1">
                  {label} {required && <span className="text-destructive">*</span>}
                </label>
                <div className="relative">
                  <Icon className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                  <Input
                    placeholder={placeholder}
                    value={(newLicense as any)[key]}
                    onChange={e => setNewLicense({ ...newLicense, [key]: e.target.value })}
                    className="pl-11 h-12 rounded-xl bg-muted/20"
                  />
                </div>
              </div>
            ))}
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Email", type: "email", key: "email", icon: Mail },
                { label: "Phone", type: "tel", key: "phone", icon: Phone },
              ].map(({ label, type, key, icon: Icon }) => (
                <div key={key} className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground ml-1">{label}</label>
                  <div className="relative">
                    <Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                    <Input
                      type={type}
                      value={(newLicense as any)[key]}
                      onChange={e => setNewLicense({ ...newLicense, [key]: e.target.value })}
                      className="pl-9 h-11 rounded-xl bg-muted/20 text-sm"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter className="gap-2 pt-2">
            <Button variant="outline" onClick={() => setShowCreateDialog(false)} className="rounded-xl h-11 flex-1">Cancel</Button>
            <Button onClick={handleCreate} disabled={submitting || !newLicense.businessName} className="rounded-xl h-11 flex-1 font-bold">
              {submitting ? <Loader2 className="animate-spin" /> : "Generate License"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Create / Edit Plan Dialog ── */}
      <Dialog open={showPlanDialog} onOpenChange={setShowPlanDialog}>
        <DialogContent className="rounded-3xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-black">{editingPlan ? "Edit Device Plan" : "New Device Plan"}</DialogTitle>
            <DialogDescription>Configure the plan details that users will see.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground ml-1">Plan Name <span className="text-destructive">*</span></label>
              <Input
                placeholder="e.g. 3-Device Pack"
                value={planForm.name}
                onChange={e => setPlanForm({ ...planForm, name: e.target.value })}
                className="h-12 rounded-xl bg-muted/20"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground ml-1">Description</label>
              <Textarea
                placeholder="Brief description shown to users…"
                value={planForm.description}
                onChange={e => setPlanForm({ ...planForm, description: e.target.value })}
                className="rounded-xl resize-none bg-muted/20"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground ml-1">Device Count</label>
                <div className="relative">
                  <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                  <Input type="number" min={1} value={planForm.deviceCount} onChange={e => setPlanForm({ ...planForm, deviceCount: Number(e.target.value) })} className="pl-9 h-12 rounded-xl bg-muted/20" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground ml-1">Price</label>
                <div className="relative">
                  <CircleDollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                  <Input type="number" min={0} step={0.01} value={planForm.price} onChange={e => setPlanForm({ ...planForm, price: Number(e.target.value) })} className="pl-9 h-12 rounded-xl bg-muted/20" />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground ml-1">Sort Order</label>
                <Input type="number" min={0} value={planForm.sortOrder} onChange={e => setPlanForm({ ...planForm, sortOrder: Number(e.target.value) })} className="h-12 rounded-xl bg-muted/20" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground ml-1">Active</label>
                <div className="h-12 flex items-center">
                  <Switch checked={planForm.isActive} onCheckedChange={v => setPlanForm({ ...planForm, isActive: v })} />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2 pt-2">
            <Button variant="outline" onClick={() => setShowPlanDialog(false)} className="rounded-xl h-11 flex-1">Cancel</Button>
            <Button onClick={handleSavePlan} disabled={planSubmitting || !planForm.name} className="rounded-xl h-11 flex-1 font-bold">
              {planSubmitting ? <Loader2 className="animate-spin" /> : (editingPlan ? "Save Changes" : "Create Plan")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
