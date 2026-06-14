import React, { useState, useEffect } from "react";
import { authFetch } from "@/lib/authFetch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Loader2, Plus, RefreshCw, Key, ShieldCheck, Copy, Search, 
  Download, User, Monitor, MoreHorizontal, Send, Trash2, 
  XCircle, CheckCircle2, Building2, Mail, Phone, MessageSquare, Power,
  PackagePlus, Pencil, CircleDollarSign, Smartphone
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

export default function LicenseManagement() {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newLicense, setNewLicense] = useState({
    customerName: "",
    businessName: "",
    email: "",
    phone: ""
  });
  const [submitting, setSubmitting] = useState(false);

  const [plans, setPlans] = useState<DevicePlan[]>([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [showPlanDialog, setShowPlanDialog] = useState(false);
  const [editingPlan, setEditingPlan] = useState<DevicePlan | null>(null);
  const [planForm, setPlanForm] = useState<Omit<DevicePlan, "id">>(emptyPlan);
  const [planSubmitting, setPlanSubmitting] = useState(false);
  const [deletingPlanId, setDeletingPlanId] = useState<number | null>(null);

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
      if (res.ok) setPlans(await res.json());
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Failed to load device plans" });
    } finally {
      setPlansLoading(false);
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

  return (
    <div className="space-y-8 pb-20">
      <div>
        <h1 className="text-3xl font-bold text-foreground">License Management</h1>
        <p className="text-muted-foreground text-sm">Monitor licenses and manage device plan offerings.</p>
      </div>

      <Tabs defaultValue="licenses" className="space-y-6">
        <TabsList className="bg-muted/40 border border-border rounded-2xl p-1 flex gap-1 w-full max-w-sm">
          <TabsTrigger value="licenses" className="flex-1 rounded-xl px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center justify-center gap-2 font-bold text-sm transition-all">
            <Key className="w-3.5 h-3.5" /> Licenses
          </TabsTrigger>
          <TabsTrigger value="device-plans" className="flex-1 rounded-xl px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center justify-center gap-2 font-bold text-sm transition-all">
            <PackagePlus className="w-3.5 h-3.5" /> Device Plans
          </TabsTrigger>
        </TabsList>

        {/* ── Licenses Tab ── */}
        <TabsContent value="licenses" className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
          <div className="flex justify-between items-center">
            <div />
            <div className="flex gap-2">
              <Button variant="outline" onClick={fetchLicenses} disabled={loading} className="rounded-xl h-10 gap-2">
                <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                Sync
              </Button>
              <Button onClick={() => setShowCreateDialog(true)} className="rounded-xl h-10 gap-2">
                <Plus size={16} />
                Generate New
              </Button>
            </div>
          </div>

          <Card className="rounded-3xl border-none shadow-2xl bg-card overflow-hidden">
            <CardHeader className="border-b border-border/50">
              <div className="flex flex-col md:flex-row justify-between gap-4">
                <CardTitle>All Licenses</CardTitle>
                <div className="relative w-full md:w-80">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by key, user or business..."
                    className="pl-10 rounded-xl bg-muted/20 border-border"
                  />
                </div>
              </div>
            </CardHeader>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-primary/70 h-14 px-6">Business / User</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-primary/70 h-14 px-6">License Key</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-primary/70 h-14 px-6">Status</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-primary/70 h-14 px-6">Activated</TableHead>
                    <TableHead className="text-right text-[10px] font-black uppercase tracking-widest text-primary/70 h-14 px-6">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLicenses.map((l) => (
                    <TableRow key={l.id} className="border-b border-border hover:bg-muted/10 transition-colors">
                      <TableCell className="px-6 py-5">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-bold text-sm text-foreground">{l.businessName || "Unknown"}</span>
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1"><User size={10} /> {l.customerName || "-"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-5">
                        <div className="flex items-center gap-2">
                          <code className="text-[11px] font-mono bg-primary/5 text-primary px-2 py-1 rounded border border-primary/10">{l.key}</code>
                          <button onClick={() => { navigator.clipboard.writeText(l.key); toast({ title: "Copied!" }); }}><Copy size={12} className="text-muted-foreground hover:text-primary" /></button>
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-5">
                        <Badge variant={l.status === 'active' ? 'default' : 'secondary'} className="capitalize rounded-full px-3 text-[10px]">
                          {l.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-6 py-5 text-xs text-muted-foreground">
                        {l.activationDate ? new Date(l.activationDate).toLocaleDateString() : "Never"}
                      </TableCell>
                      <TableCell className="px-6 py-5 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full"><MoreHorizontal size={16} /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 rounded-xl p-2">
                            <DropdownMenuItem onClick={() => handleResend(l.id)} className="rounded-lg gap-2 cursor-pointer">
                              <Copy size={14} /> Copy Details
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => {
                                if (!l.phone) { toast({ title: "No phone number", description: "This license has no phone number on record." }); return; }
                                openWhatsApp(l.phone, `Hello ${l.businessName || l.customerName || "Customer"},\n\nYour OneTailor Premium License is ready!\n\nLicense Key: ${l.key}\n\nThank you for choosing OneTailor!`);
                              }}
                              className="rounded-lg gap-2 cursor-pointer text-emerald-500"
                            >
                              <MessageSquare size={14} /> Send WhatsApp
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                if (!l.phone) { toast({ title: "No phone number", description: "This license has no phone number on record." }); return; }
                                openSMS(l.phone, `Hello ${l.businessName || l.customerName || "Customer"}, your OneTailor License is: ${l.key}`);
                              }}
                              className="rounded-lg gap-2 cursor-pointer text-blue-500"
                            >
                              <Send size={14} /> Send SMS
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                if (!l.email) { toast({ title: "No email", description: "This license has no email on record." }); return; }
                                openEmail(l.email, "Your OneTailor License Key", `Hello ${l.businessName || l.customerName || "Customer"},\n\nYour OneTailor Premium License is ready!\n\nLicense Key: ${l.key}\n\nThank you for choosing OneTailor!`);
                              }}
                              className="rounded-lg gap-2 cursor-pointer text-orange-500"
                            >
                              <Mail size={14} /> Send Email
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleUpdateStatus(l.id, l.status === 'active' ? 'suspended' : 'active')} className="rounded-lg gap-2 cursor-pointer">
                              <Power size={14} /> {l.status === 'active' ? 'Suspend' : 'Activate'}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleUpdateStatus(l.id, 'revoked')} className="rounded-lg gap-2 text-red-500 cursor-pointer">
                              <XCircle size={14} /> Revoke License
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>

        {/* ── Device Plans Tab ── */}
        <TabsContent value="device-plans" className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-muted-foreground">Create plans that PWA users can select to expand their license.</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={fetchPlans} disabled={plansLoading} className="rounded-xl h-10 gap-2">
                <RefreshCw size={16} className={plansLoading ? "animate-spin" : ""} />
                Refresh
              </Button>
              <Button onClick={() => openPlanDialog()} className="rounded-xl h-10 gap-2">
                <Plus size={16} />
                New Plan
              </Button>
            </div>
          </div>

          {plansLoading ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : plans.length === 0 ? (
            <Card className="rounded-3xl border-dashed border-2 border-border bg-card/50">
              <CardContent className="p-12 flex flex-col items-center gap-4 text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
                  <PackagePlus className="w-8 h-8 text-primary/60" />
                </div>
                <div>
                  <p className="font-bold text-foreground">No Device Plans Yet</p>
                  <p className="text-sm text-muted-foreground mt-1">Create plans so users can expand their license to more devices.</p>
                </div>
                <Button onClick={() => openPlanDialog()} className="rounded-xl gap-2">
                  <Plus size={16} /> Create First Plan
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {plans.map((plan) => (
                <Card key={plan.id} className={`rounded-3xl border bg-card overflow-hidden transition-all ${plan.isActive ? "border-border" : "border-border/40 opacity-60"}`}>
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-lg text-foreground truncate">{plan.name}</p>
                        {plan.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{plan.description}</p>}
                      </div>
                      <Badge variant={plan.isActive ? "default" : "secondary"} className="rounded-full text-[10px] shrink-0">
                        {plan.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Smartphone size={14} />
                        <span className="font-semibold">{plan.deviceCount} device{plan.deviceCount !== 1 ? "s" : ""}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-primary font-black text-base">
                        <CircleDollarSign size={14} />
                        <span>{Number(plan.price).toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 pt-2 border-t border-border/50">
                      <Button variant="outline" size="sm" onClick={() => openPlanDialog(plan)} className="flex-1 rounded-xl h-9 gap-1.5 text-xs font-bold">
                        <Pencil size={12} /> Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={deletingPlanId === plan.id}
                        onClick={() => handleDeletePlan(plan.id)}
                        className="rounded-xl h-9 w-9 p-0 text-destructive border-destructive/30 hover:bg-destructive/10"
                      >
                        {deletingPlanId === plan.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Create License Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="rounded-3xl max-w-md">
          <DialogHeader>
            <DialogTitle>Generate New License</DialogTitle>
            <DialogDescription>Manually create a premium license for a customer.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-muted-foreground ml-1">Business Name</label>
              <div className="relative">
                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <Input placeholder="e.g. Joyful Stitches" value={newLicense.businessName} onChange={e => setNewLicense({...newLicense, businessName: e.target.value})} className="pl-12 h-12 rounded-xl" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-muted-foreground ml-1">Customer Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <Input placeholder="Full Name" value={newLicense.customerName} onChange={e => setNewLicense({...newLicense, customerName: e.target.value})} className="pl-12 h-12 rounded-xl" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-muted-foreground ml-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                  <Input type="email" value={newLicense.email} onChange={e => setNewLicense({...newLicense, email: e.target.value})} className="pl-9 h-11 rounded-xl text-xs" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-muted-foreground ml-1">Phone</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                  <Input type="tel" value={newLicense.phone} onChange={e => setNewLicense({...newLicense, phone: e.target.value})} className="pl-9 h-11 rounded-xl text-xs" />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowCreateDialog(false)} className="rounded-xl h-12 flex-1">Cancel</Button>
            <Button onClick={handleCreate} disabled={submitting || !newLicense.businessName} className="rounded-xl h-12 flex-1">
              {submitting ? <Loader2 className="animate-spin" /> : "Generate License"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create / Edit Plan Dialog */}
      <Dialog open={showPlanDialog} onOpenChange={setShowPlanDialog}>
        <DialogContent className="rounded-3xl max-w-md">
          <DialogHeader>
            <DialogTitle>{editingPlan ? "Edit Device Plan" : "New Device Plan"}</DialogTitle>
            <DialogDescription>Configure the plan details that users will see when expanding their license.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-muted-foreground ml-1">Plan Name <span className="text-destructive">*</span></label>
              <Input
                placeholder="e.g. 3-Device Pack"
                value={planForm.name}
                onChange={e => setPlanForm({ ...planForm, name: e.target.value })}
                className="h-12 rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-muted-foreground ml-1">Description</label>
              <Textarea
                placeholder="Brief description shown to users..."
                value={planForm.description}
                onChange={e => setPlanForm({ ...planForm, description: e.target.value })}
                className="rounded-xl resize-none"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-muted-foreground ml-1">Device Count</label>
                <div className="relative">
                  <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                  <Input
                    type="number"
                    min={1}
                    value={planForm.deviceCount}
                    onChange={e => setPlanForm({ ...planForm, deviceCount: Number(e.target.value) })}
                    className="pl-9 h-12 rounded-xl"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-muted-foreground ml-1">Price</label>
                <div className="relative">
                  <CircleDollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                  <Input
                    type="number"
                    min={0}
                    step={0.01}
                    value={planForm.price}
                    onChange={e => setPlanForm({ ...planForm, price: Number(e.target.value) })}
                    className="pl-9 h-12 rounded-xl"
                  />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-muted-foreground ml-1">Sort Order</label>
                <Input
                  type="number"
                  min={0}
                  value={planForm.sortOrder}
                  onChange={e => setPlanForm({ ...planForm, sortOrder: Number(e.target.value) })}
                  className="h-12 rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-muted-foreground ml-1">Active</label>
                <div className="h-12 flex items-center">
                  <Switch
                    checked={planForm.isActive}
                    onCheckedChange={v => setPlanForm({ ...planForm, isActive: v })}
                  />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowPlanDialog(false)} className="rounded-xl h-12 flex-1">Cancel</Button>
            <Button onClick={handleSavePlan} disabled={planSubmitting || !planForm.name} className="rounded-xl h-12 flex-1">
              {planSubmitting ? <Loader2 className="animate-spin" /> : (editingPlan ? "Save Changes" : "Create Plan")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
