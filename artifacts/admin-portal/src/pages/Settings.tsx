import React, { useState, useEffect, useRef } from "react";
import { authFetch } from "@/lib/authFetch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { 
  Loader2, 
  Save, 
  Sun, 
  Moon, 
  Monitor, 
  Banknote, 
  Globe, 
  Lock, 
  Building2,
  Zap,
  Crown,
  Link as LinkIcon,
  Trash2,
  AlertTriangle,
  Palette,
  ShieldAlert,
  ShieldCheck,
  RefreshCw,
  Smartphone,
  ImageIcon,
  Upload,
  X,
  Mail,
  Eye,
  EyeOff,
  Send,
  CheckCircle,
  KeyRound,
  Info,
  ChevronRight,
} from "lucide-react";

interface PaymentInfo {
  pwaLogoData?: string;
  pwaFaviconData?: string;
  pwaSplashData?: string;
  price: string;
  price2Device: string;
  price3Device: string;
  price5Device: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  instructions: string;
  paymentLink?: string;
  globalUsageLimit: number;
  measurementLimit: number;
  proUpgradeMessage: string;
  proUpgradeLink: string;
  proUpgradeButtonText: string;
  proUpgradeTitle: string;
  proTeaserFrequency: string;
  premiumUserTitle: string;
  premiumUserMessage: string;
  freeUpgradeTitle: string;
  freeUpgradeMessage: string;
  freeUpgradeCTA: string;
  pendingTitle: string;
  pendingBody: string;
  pendingCTA: string;
  adminNotificationPhone: string;
  adminNotificationMessage: string;
  isUsageLimitEnabled: boolean;
  isDebugMode: boolean;
  pwaName: string;
  pwaShortName: string;
  pwaDescription: string;
  pwaThemeColor: string;
  pwaBackgroundColor: string;
  // Email / SMTP
  smtpHost: string;
  smtpPort: string;
  smtpSecure: boolean;
  smtpUser: string;
  smtpPass: string;
  emailFromName: string;
  emailFromAddr: string;
  resendApiKey: string;
}

function ChangePasswordCard() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast({ variant: "destructive", title: "Passwords don't match", description: "New password and confirm password must be the same." });
      return;
    }
    if (newPassword.length < 8) {
      toast({ variant: "destructive", title: "Too short", description: "New password must be at least 8 characters." });
      return;
    }
    setSaving(true);
    try {
      const res = await authFetch("/api/admin/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        toast({ title: "Password Changed", description: "Your admin password has been updated successfully." });
        setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
      } else {
        toast({ variant: "destructive", title: "Failed", description: data.message });
      }
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Could not reach server" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="rounded-3xl border-primary/20 bg-primary/5 overflow-hidden">
      <CardContent className="p-8">
        <h3 className="text-lg font-bold text-foreground flex items-center gap-2 mb-4">
          <KeyRound className="w-5 h-5 text-primary" /> Change Admin Password
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-wider text-primary/60 px-1">Current Password</label>
            <div className="relative">
              <Input
                type={showCurrent ? "text" : "password"}
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                required
                className="h-12 rounded-xl bg-muted/30 pr-12"
              />
              <button type="button" onClick={() => setShowCurrent(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-wider text-primary/60 px-1">New Password</label>
            <div className="relative">
              <Input
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="At least 8 characters"
                required
                className="h-12 rounded-xl bg-muted/30 pr-12"
              />
              <button type="button" onClick={() => setShowNew(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-wider text-primary/60 px-1">Confirm New Password</label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Repeat new password"
              required
              className={`h-12 rounded-xl bg-muted/30 ${confirmPassword && confirmPassword !== newPassword ? "border-red-500" : ""}`}
            />
            {confirmPassword && confirmPassword !== newPassword && (
              <p className="text-xs text-red-500 px-1">Passwords don't match</p>
            )}
          </div>
          <Button type="submit" disabled={saving} className="h-12 px-8 rounded-2xl font-bold">
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Update Password
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function TestEmailButton({ onSent }: { onSent?: () => void }) {
  const [to, setTo] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const { toast } = useToast();

  const send = async () => {
    if (!to) return;
    setSending(true);
    try {
      const res = await authFetch("/api/admin/test-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to }),
      });
      const data = await res.json();
      if (res.ok) {
        setSent(true);
        onSent?.();
        toast({ title: "Test Email Sent", description: `Delivered to ${to}` });
        setTimeout(() => setSent(false), 4000);
      } else {
        toast({ variant: "destructive", title: "Send Failed", description: data.message });
      }
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Could not reach server" });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 space-y-3">
      <p className="text-[10px] font-black uppercase tracking-widest text-primary/70">Test Email Delivery</p>
      <div className="flex gap-2">
        <Input
          type="email"
          placeholder="your@email.com"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="h-10 rounded-xl bg-muted/20 border-border flex-1"
        />
        <Button
          type="button"
          onClick={send}
          disabled={sending || !to}
          className="h-10 px-4 rounded-xl gap-2 shrink-0"
          variant={sent ? "default" : "outline"}
        >
          {sending ? <Loader2 size={14} className="animate-spin" /> : sent ? <CheckCircle size={14} /> : <Send size={14} />}
          {sending ? "Sending…" : sent ? "Sent!" : "Send Test"}
        </Button>
      </div>
      <p className="text-[10px] text-muted-foreground">Sends a test email using the active provider (Resend or SMTP). Save settings first.</p>
    </div>
  );
}

function TestSmtpButton({ onResult }: { onResult?: (working: boolean) => void }) {
  const [testing, setTesting] = useState(false);
  const { toast } = useToast();

  const testConnection = async () => {
    setTesting(true);
    try {
      const res = await authFetch("/api/admin/test-smtp", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        toast({ title: "SMTP Test Passed", description: data.message });
        onResult?.(true);
      } else {
        toast({ variant: "destructive", title: "SMTP Test Failed", description: data.message });
        onResult?.(false);
      }
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Could not test SMTP" });
      onResult?.(false);
    } finally {
      setTesting(false);
    }
  };

  return (
    <Button type="button" variant="outline" onClick={testConnection} disabled={testing} className="h-10 px-4 rounded-xl gap-2">
      {testing ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
      {testing ? "Testing..." : "Test SMTP Connection"}
    </Button>
  );
}

export default function Settings() {
  const [theme, setTheme] = useState<"light" | "dark" | "system">(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem("admin_theme") as "light" | "dark" | "system") || "system";
    }
    return "system";
  });

  const [currencySymbol, setCurrencySymbol] = useState("₦");

  const updateTheme = (newTheme: "light" | "dark" | "system") => {
    setTheme(newTheme);
    localStorage.setItem("admin_theme", newTheme);

    if (newTheme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      document.documentElement.classList.toggle("dark", systemTheme === "dark");
    } else {
      document.documentElement.classList.toggle("dark", newTheme === "dark");
    }
  };

  const [showSmtpPass, setShowSmtpPass] = useState(false);
  const [showResendKey, setShowResendKey] = useState(false);
  const [emailSaving, setEmailSaving] = useState(false);
  const [lastEmailTest, setLastEmailTest] = useState<string | null>(null);
  const [smtpStatus, setSmtpStatus] = useState<{ tested: boolean; working: boolean } | null>(null);

  useEffect(() => {
    const savedTheme = localStorage.getItem("admin_theme") as "light" | "dark" | "system" | null;
    if (savedTheme) {
      setTheme(savedTheme);
      if (savedTheme === "system") {
        const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        document.documentElement.classList.toggle("dark", systemDark);
      } else {
        document.documentElement.classList.toggle("dark", savedTheme === "dark");
      }
    }
  }, []);

  const [settings, setSettings] = useState<PaymentInfo>({
    price: "",
    price2Device: "",
    price3Device: "",
    price5Device: "",
    bankName: "",
    accountNumber: "",
    accountName: "",
    instructions: "",
    paymentLink: "",
    globalUsageLimit: 25,
    measurementLimit: 25,
    proUpgradeMessage: "",
    proUpgradeLink: "",
    proUpgradeButtonText: "",
    proUpgradeTitle: "",
    premiumUserTitle: "",
    premiumUserMessage: "",
    freeUpgradeTitle: "",
    freeUpgradeMessage: "",
    freeUpgradeCTA: "",
    pendingTitle: "",
    pendingBody: "",
    pendingCTA: "",
    adminNotificationPhone: "",
    adminNotificationMessage: "",
    isUsageLimitEnabled: true,
    isDebugMode: false,
    pwaName: "",
    pwaShortName: "",
    pwaDescription: "",
    pwaThemeColor: "#6D28D9",
    pwaBackgroundColor: "#ffffff",
    pwaLogoData: "",
    pwaFaviconData: "",
    pwaSplashData: "",
    smtpHost: "",
    smtpPort: "587",
    smtpSecure: false,
    smtpUser: "",
    smtpPass: "",
    emailFromName: "",
    emailFromAddr: "",
    resendApiKey: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const logoFileRef    = useRef<HTMLInputElement>(null);
  const faviconFileRef = useRef<HTMLInputElement>(null);
  const splashFileRef  = useRef<HTMLInputElement>(null);

  const compressImage = (file: File, maxPx: number): Promise<string> =>
    new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const s = Math.min(1, maxPx / Math.max(img.width, img.height));
        const c = document.createElement("canvas");
        c.width = img.width * s; c.height = img.height * s;
        c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        resolve(c.toDataURL("image/png", 0.9));
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(); };
      img.src = url;
    });

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/payment-info");
      if (res.ok) {
        const data = await res.json();
        if (data.currencySymbol) setCurrencySymbol(data.currencySymbol);
        setSettings({
          price: (data.price !== null && data.price !== undefined) ? String(data.price) : "",
          price2Device: (data.price2Device !== null && data.price2Device !== undefined) ? String(data.price2Device) : "",
          price3Device: (data.price3Device !== null && data.price3Device !== undefined) ? String(data.price3Device) : "",
          price5Device: (data.price5Device !== null && data.price5Device !== undefined) ? String(data.price5Device) : "",
          bankName: data.bankName || "",
          accountNumber: data.accountNumber || "",
          accountName: data.accountName || "",
          instructions: data.instructions || "",
          paymentLink: data.paymentLink || "",
          globalUsageLimit: data.globalUsageLimit || 25,
          measurementLimit: data.measurementLimit || 25,
          proUpgradeMessage: data.proUpgradeMessage || "",
          proUpgradeLink: data.proUpgradeLink || "",
          proUpgradeButtonText: data.proUpgradeButtonText || "",
          proUpgradeTitle: data.proUpgradeTitle || "",
          proTeaserFrequency: data.proTeaserFrequency || "always",
          premiumUserTitle: data.premiumUserTitle || "",
          premiumUserMessage: data.premiumUserMessage || "",
          freeUpgradeTitle: data.freeUpgradeTitle || "",
          freeUpgradeMessage: data.freeUpgradeMessage || "",
          freeUpgradeCTA: data.freeUpgradeCTA || "",
          pendingTitle: data.pendingTitle || "",
          pendingBody: data.pendingBody || "",
          pendingCTA: data.pendingCTA || "",
          adminNotificationPhone: data.adminNotificationPhone || "",
          adminNotificationMessage: data.adminNotificationMessage || "",
          isUsageLimitEnabled: data.isUsageLimitEnabled ?? true,
          isDebugMode: data.isDebugMode ?? false,
          pwaName: data.pwaName || "",
          pwaShortName: data.pwaShortName || "",
          pwaDescription: data.pwaDescription || "",
          pwaThemeColor: data.pwaThemeColor || "#6D28D9",
          pwaBackgroundColor: data.pwaBackgroundColor || "#ffffff",
          pwaLogoData: data.pwaLogoData || "",
          pwaFaviconData: data.pwaFaviconData || "",
          pwaSplashData: data.pwaSplashData || "",
          smtpHost: data.smtpHost || "",
          smtpPort: data.smtpPort ? String(data.smtpPort) : "587",
          smtpSecure: data.smtpSecure ?? false,
          smtpUser: data.smtpUser || "",
          smtpPass: "",
          emailFromName: data.emailFromName || "",
          emailFromAddr: data.emailFromAddr || "",
          resendApiKey: "",
        });
      }
    } catch (error) {
      console.error("Failed to fetch payment settings:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSaveSystem = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await authFetch("/api/payment-info", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        toast({ title: "System Settings Saved", description: "Pricing and banking details updated." });
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to save settings." });
    } finally {
      setSaving(false);
    }
  };

  const handleSavePWA = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        pwaName: settings.pwaName,
        pwaShortName: settings.pwaShortName,
        pwaDescription: settings.pwaDescription,
        pwaThemeColor: settings.pwaThemeColor,
        pwaBackgroundColor: settings.pwaBackgroundColor,
        pwaLogoData: settings.pwaLogoData,
        pwaFaviconData: settings.pwaFaviconData,
        pwaSplashData: settings.pwaSplashData,
      };
      const res = await authFetch("/api/payment-info", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        toast({ title: "PWA Settings Saved", description: "App branding updated successfully." });
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to save PWA settings." });
    } finally {
      setSaving(false);
    }
  };

  const handleResetUsage = async () => {
    if (!confirm("This will reset tool usage counters for ALL users. Users who reached their limit will be able to use tools again. Proceed?")) return;

    setSaving(true);
    try {
      const res = await authFetch("/api/admin/reset-usage", { method: "POST" });
      if (res.ok) {
        toast({ title: "Usage Counters Reset", description: "All users have been given fresh usage credits." });
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to reset usage." });
    } finally {
      setSaving(false);
    }
  };

  const handleResetData = async () => {
    const confirmText = prompt("Type 'DELETE ALL DATA' to confirm this irreversible action:");
    if (confirmText !== "DELETE ALL DATA") {
      toast({ title: "Cancelled", description: "No changes were made." });
      return;
    }

    setSaving(true);
    try {
      const res = await authFetch("/api/admin/reset-database", { method: "POST" });
      if (res.ok) {
        toast({ title: "Database Wiped", description: "All system data has been cleared." });
      } else {
        throw new Error("Reset failed");
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to reset database." });
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (val: string) => {
    return val.replace("₦", currencySymbol);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground" style={{ fontFamily: "var(--font-serif)" }}>
            <span className="gold-shimmer">Settings</span>
          </h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium">Email delivery and security controls.</p>
        </div>
      </div>

      {/* ── Environment Info ── */}
      <Card className="rounded-2xl bg-muted/20 border-border overflow-hidden">
        <CardContent className="p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
              <Info size={14} className="text-primary" />
            </div>
            <div>
              <p className="text-xs font-bold">Environment</p>
              <p className="text-[10px] text-muted-foreground">
                {import.meta.env.DEV ? "Development" : "Production"} • API: {window.location.origin}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${settings.isDebugMode ? "bg-amber-500 animate-pulse" : "bg-emerald-500"}`} />
            <span className="text-[10px] font-mono text-muted-foreground">Debug Mode: {settings.isDebugMode ? "ON" : "OFF"}</span>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="appearance" className="w-full">
        <TabsList className="bg-primary/5 border border-primary/10 rounded-2xl p-1 mb-8 flex flex-wrap gap-1">
          <TabsTrigger value="appearance" className="rounded-xl px-5 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2 font-bold transition-all">
            <Palette className="w-4 h-4" /> Appearance
          </TabsTrigger>
          <TabsTrigger value="email" className="rounded-xl px-5 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2 font-bold transition-all">
            <Mail className="w-4 h-4" /> Email
          </TabsTrigger>
          <TabsTrigger value="security" className="rounded-xl px-5 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2 font-bold transition-all">
            <Lock className="w-4 h-4" /> Security & Controls
          </TabsTrigger>
        </TabsList>

        {/* ── Appearance ──────────────────────────────────────────── */}
        <TabsContent value="appearance" className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
          <section className="space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2 text-foreground">
              <Sun className="w-5 h-5 text-primary" /> Appearance Mode
            </h2>
            <Card className="rounded-3xl border-border bg-card overflow-hidden">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {(["light", "dark", "system"] as const).map((t) => (
                    <Button
                      key={t}
                      variant={theme === t ? "default" : "outline"}
                      className={cn("h-20 rounded-2xl flex-col gap-2 font-bold", theme === t ? "bg-primary text-primary-foreground" : "border-border hover:bg-primary/5")}
                      onClick={() => updateTheme(t)}
                    >
                      {t === "light" && <Sun className="w-5 h-5" />}
                      {t === "dark"  && <Moon className="w-5 h-5" />}
                      {t === "system" && <Monitor className="w-5 h-5" />}
                      {t.charAt(0).toUpperCase() + t.slice(1)} Theme
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </section>

        </TabsContent>


        <TabsContent value="email" className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
          <section className="space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2 text-foreground">
              <Mail className="w-5 h-5 text-primary" /> Email Configuration
            </h2>
            <p className="text-sm text-muted-foreground">Configure the outgoing email provider used for license delivery, payment confirmations, and password resets. Resend takes priority over SMTP if both are set.</p>

            <form onSubmit={async (e) => {
              e.preventDefault();
              setEmailSaving(true);
              try {
                const payload: Record<string, unknown> = {
                  emailFromName: settings.emailFromName,
                  emailFromAddr: settings.emailFromAddr,
                  smtpHost: settings.smtpHost,
                  smtpPort: settings.smtpPort,
                  smtpSecure: settings.smtpSecure,
                  smtpUser: settings.smtpUser,
                  isSmtpEnabled: (settings as any).isSmtpEnabled ?? true,
                  isResendEnabled: (settings as any).isResendEnabled ?? true,
                };
                if (settings.smtpPass?.trim()) payload.smtpPass = settings.smtpPass;
                if (settings.resendApiKey?.trim()) payload.resendApiKey = settings.resendApiKey;
                const res = await authFetch("/api/payment-info", {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(payload),
                });
                if (res.ok) {
                  toast({ title: "Email Settings Saved", description: "Email configuration updated successfully." });
                  setSettings((s) => ({ ...s, smtpPass: "", resendApiKey: "" }));
                } else {
                  throw new Error("Save failed");
                }
              } catch {
                toast({ variant: "destructive", title: "Error", description: "Failed to save email settings." });
              } finally {
                setEmailSaving(false);
              }
            }} className="space-y-6">

              {/* Test Email */}
              <TestEmailButton onSent={() => setLastEmailTest(new Date().toLocaleString())} />
              {lastEmailTest && (
                <p className="text-[10px] text-muted-foreground text-right">Last test: {lastEmailTest}</p>
              )}

              {/* Resend Section */}
              <Card className="rounded-3xl border-border bg-card overflow-hidden">
                <CardHeader className="px-6 pt-6 pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-black flex items-center gap-2">
                      <Zap className="w-4 h-4 text-primary" /> Resend (Recommended)
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Enabled</span>
                      <Switch
                        checked={(settings as any).isResendEnabled ?? true}
                        onCheckedChange={(v) => setSettings({ ...settings, isResendEnabled: v } as any)}
                      />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">Easiest setup. Get an API key from resend.com — free tier sends up to 3,000 emails/month.</p>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-wider text-primary/60 px-1 flex items-center gap-2">
                      Resend API Key
                      {settings.resendApiKey && settings.resendApiKey.length > 10 && (
                        <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle size={10} /> Key provided
                        </span>
                      )}
                    </label>
                    <div className="relative">
                      <Input
                        type={showResendKey ? "text" : "password"}
                        value={settings.resendApiKey}
                        onChange={(e) => setSettings({ ...settings, resendApiKey: e.target.value })}
                        placeholder="re_••••••••••••••••••••"
                        className="h-12 rounded-xl bg-muted/30 border-border font-mono text-foreground pr-12"
                      />
                      <button type="button" onClick={() => setShowResendKey((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                        {showResendKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-[11px] text-muted-foreground px-1">Get your API key from <a href="https://resend.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">resend.com</a>. Leave blank to keep existing key.</p>
                  </div>
                </CardContent>
              </Card>

              {/* Provider Priority Alert */}
              <Alert className="rounded-xl bg-primary/5 border-primary/20">
                <Info className="w-4 h-4 text-primary" />
                <AlertDescription className="text-xs text-muted-foreground">
                  <strong>Provider priority:</strong> Resend takes precedence over SMTP if both are configured and enabled. Disable Resend to force SMTP usage.
                </AlertDescription>
              </Alert>

              {/* SMTP Section */}
              <Card className="rounded-3xl border-border bg-card overflow-hidden">
                <CardHeader className="px-6 pt-6 pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-black flex items-center gap-2">
                      <Globe className="w-4 h-4 text-primary" /> SMTP (Custom Mail Server)
                      {smtpStatus?.tested && (
                        <Badge variant={smtpStatus.working ? "default" : "destructive"} className="text-[9px]">
                          {smtpStatus.working ? "Connected" : "Failed"}
                        </Badge>
                      )}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <TestSmtpButton onResult={(working) => setSmtpStatus({ tested: true, working })} />
                      <Switch
                        checked={(settings as any).isSmtpEnabled ?? true}
                        onCheckedChange={(v) => setSettings({ ...settings, isSmtpEnabled: v } as any)}
                      />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">Use your own mail server, Gmail SMTP, or any transactional provider. Used only if no Resend key is configured.</p>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-wider text-primary/60 px-1">SMTP Host</label>
                      <Input
                        value={settings.smtpHost}
                        onChange={(e) => setSettings({ ...settings, smtpHost: e.target.value })}
                        placeholder="smtp.gmail.com"
                        className="h-12 rounded-xl bg-muted/30 border-border font-mono text-foreground"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-wider text-primary/60 px-1">Port</label>
                      <div className="flex gap-3">
                        <Input
                          type="number"
                          value={settings.smtpPort}
                          onChange={(e) => setSettings({ ...settings, smtpPort: e.target.value })}
                          placeholder="587"
                          className="h-12 rounded-xl bg-muted/30 border-border font-mono text-foreground flex-1"
                        />
                        <button
                          type="button"
                          onClick={() => setSettings((s) => ({ ...s, smtpSecure: !s.smtpSecure }))}
                          className={cn(
                            "h-12 px-4 rounded-xl border font-bold text-xs transition-all",
                            settings.smtpSecure
                              ? "bg-primary/15 border-primary/40 text-primary"
                              : "bg-muted/30 border-border text-muted-foreground"
                          )}
                        >
                          {settings.smtpSecure ? "TLS/SSL" : "STARTTLS"}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-wider text-primary/60 px-1">SMTP Username / Email</label>
                      <Input
                        value={settings.smtpUser}
                        onChange={(e) => setSettings({ ...settings, smtpUser: e.target.value })}
                        placeholder="you@gmail.com"
                        className="h-12 rounded-xl bg-muted/30 border-border text-foreground"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-wider text-primary/60 px-1">SMTP Password / App Password</label>
                      <div className="relative">
                        <Input
                          type={showSmtpPass ? "text" : "password"}
                          value={settings.smtpPass}
                          onChange={(e) => setSettings({ ...settings, smtpPass: e.target.value })}
                          placeholder="Leave blank to keep existing"
                          className="h-12 rounded-xl bg-muted/30 border-border text-foreground pr-12"
                        />
                        <button type="button" onClick={() => setShowSmtpPass((v) => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                          {showSmtpPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-border/40">
                    <p className="text-[10px] font-black uppercase tracking-wider text-primary/60 px-1 mb-4">Sender Identity</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-wider text-primary/60 px-1">From Name</label>
                        <Input
                          value={settings.emailFromName}
                          onChange={(e) => setSettings({ ...settings, emailFromName: e.target.value })}
                          placeholder="OneTailor"
                          className="h-12 rounded-xl bg-muted/30 border-border text-foreground"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-wider text-primary/60 px-1">From Address</label>
                        <Input
                          value={settings.emailFromAddr}
                          onChange={(e) => setSettings({ ...settings, emailFromAddr: e.target.value })}
                          placeholder="noreply@yourdomain.com"
                          className="h-12 rounded-xl bg-muted/30 border-border text-foreground"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end">
                <Button type="submit" disabled={emailSaving} className="h-12 px-8 rounded-2xl font-bold">
                  {emailSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  Save Email Settings
                </Button>
              </div>
            </form>
          </section>
        </TabsContent>

        <TabsContent value="security" className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
          <section className="space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2 text-foreground">
              <ShieldAlert className="w-5 h-5 text-red-500" /> Security & Advanced Controls
            </h2>

            {/* Change Admin Password */}
            <ChangePasswordCard />

            <Card className="rounded-3xl border-amber-500/20 bg-amber-500/5 overflow-hidden">
              <CardContent className="p-8 space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="space-y-2 text-center md:text-left">
                    <h3 className="text-lg font-bold text-amber-600 flex items-center gap-2 justify-center md:justify-start">
                      <RefreshCw className="w-5 h-5" /> Reset Usage Counters
                    </h3>
                    <p className="text-sm text-muted-foreground font-medium max-w-md">
                      Give all users another {settings.globalUsageLimit} free actions. This will set everyone's usage back to 0.
                    </p>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={handleResetUsage}
                    disabled={saving}
                    className="rounded-2xl px-8 h-12 font-bold border-amber-500/20 hover:bg-amber-500/10 text-amber-600 shadow-lg shadow-amber-500/10"
                  >
                    {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                    Reset All User Usage
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-red-500/20 bg-red-500/5 overflow-hidden">
              <CardContent className="p-8 space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="space-y-2 text-center md:text-left">
                    <h3 className="text-lg font-bold text-red-500 flex items-center gap-2 justify-center md:justify-start">
                      <Trash2 className="w-5 h-5" /> Danger Zone: Reset All Data
                    </h3>
                    <p className="text-sm text-muted-foreground font-medium max-w-md">
                      This action will permanently delete all users, licenses, and transaction logs. This action cannot be undone.
                    </p>
                  </div>
                  <Button 
                    variant="destructive" 
                    onClick={handleResetData}
                    disabled={saving}
                    className="rounded-2xl px-8 h-12 font-bold shadow-lg shadow-red-500/20"
                  >
                    {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <AlertTriangle className="w-4 h-4 mr-2" />}
                    Wipe Database Clean
                  </Button>
                </div>
              </CardContent>
            </Card>
          </section>
        </TabsContent>
      </Tabs>
    </div>
  );
}
