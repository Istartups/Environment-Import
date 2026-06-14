import React, { useState, useEffect, useRef } from "react";
import { authFetch } from "@/lib/authFetch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  Save,
  Globe,
  Lock,
  Zap,
  Crown,
  Link as LinkIcon,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  ImageIcon,
  Upload,
  X,
  Info,
  Star,
  Shield,
  FileText,
  Phone,
  ExternalLink,
} from "lucide-react";

interface PwaInfo {
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
  pwaLogoData: string;
  pwaFaviconData: string;
  pwaSplashData: string;
  pwaAboutTagline: string;
  pwaAboutVersion: string;
  pwaAboutPrivacyUrl: string;
  pwaAboutTermsUrl: string;
  pwaAboutContactUrl: string;
  pwaAboutRateUrl: string;
  pwaAboutCopyright: string;
}

const DEFAULT: PwaInfo = {
  globalUsageLimit: 25,
  measurementLimit: 25,
  proUpgradeMessage: "",
  proUpgradeLink: "",
  proUpgradeButtonText: "",
  proUpgradeTitle: "",
  proTeaserFrequency: "always",
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
  pwaAboutTagline: "",
  pwaAboutVersion: "",
  pwaAboutPrivacyUrl: "",
  pwaAboutTermsUrl: "",
  pwaAboutContactUrl: "",
  pwaAboutRateUrl: "",
  pwaAboutCopyright: "",
};

function PhonePreview({ settings }: { settings: PwaInfo }) {
  return (
    <div className="relative select-none">
      <div className="w-48 h-96 rounded-[2.5rem] border-[6px] border-slate-700 bg-slate-800 shadow-2xl overflow-hidden flex flex-col">
        <div className="h-7 bg-slate-900 flex items-center justify-between px-4 shrink-0">
          <span className="text-[8px] text-white font-bold">9:41</span>
          <div className="flex items-center gap-1">
            <div className="w-3 h-1.5 rounded-sm bg-white/60" />
            <div className="w-1.5 h-1.5 rounded-full bg-white/60" />
            <div className="w-2 h-1.5 rounded-sm border border-white/60 flex items-center pr-px">
              <div className="w-full h-full bg-white/60 rounded-sm" />
            </div>
          </div>
        </div>
        <div
          className="flex-1 p-4 flex flex-col items-start gap-4 relative"
          style={{ background: settings.pwaBackgroundColor || "#1a1a2e" }}
        >
          <div
            className="absolute inset-0 opacity-5 pointer-events-none"
            style={{
              backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)",
              backgroundSize: "12px 12px",
            }}
          />
          <div className="flex flex-wrap gap-3 mt-2 relative z-10">
            <div className="flex flex-col items-center gap-1">
              <div
                className="w-12 h-12 rounded-[14px] flex items-center justify-center overflow-hidden shadow-lg border border-white/10"
                style={{ background: settings.pwaThemeColor || "#6D28D9" }}
              >
                {settings.pwaLogoData ? (
                  <img src={settings.pwaLogoData} className="w-full h-full object-contain p-1" alt="app icon" />
                ) : (
                  <Smartphone className="w-6 h-6 text-white" />
                )}
              </div>
              <span className="text-[7px] text-white font-semibold text-center leading-tight max-w-[48px] truncate drop-shadow">
                {settings.pwaShortName || settings.pwaName || "OneTailor"}
              </span>
            </div>
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <div className="w-12 h-12 rounded-[14px] bg-slate-600/50" />
                <div className="w-8 h-1.5 bg-white/20 rounded-full" />
              </div>
            ))}
          </div>
          <div className="absolute bottom-3 left-3 right-3 h-16 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10 flex items-center justify-around px-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="w-10 h-10 rounded-[12px] bg-white/20" />
            ))}
          </div>
        </div>
      </div>
      <div className="absolute top-[6px] left-1/2 -translate-x-1/2 w-16 h-4 bg-slate-900 rounded-b-2xl z-10" />
      <div className="absolute right-[-10px] top-20 w-1.5 h-12 bg-slate-600 rounded-r-full" />
      <div className="absolute left-[-10px] top-16 w-1.5 h-8 bg-slate-600 rounded-l-full" />
      <div className="absolute left-[-10px] top-28 w-1.5 h-8 bg-slate-600 rounded-l-full" />
    </div>
  );
}

export default function PwaSettings() {
  const [settings, setSettings] = useState<PwaInfo>(DEFAULT);
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
        setSettings({
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
          pwaAboutTagline: data.pwaAboutTagline || "",
          pwaAboutVersion: data.pwaAboutVersion || "",
          pwaAboutPrivacyUrl: data.pwaAboutPrivacyUrl || "",
          pwaAboutTermsUrl: data.pwaAboutTermsUrl || "",
          pwaAboutContactUrl: data.pwaAboutContactUrl || "",
          pwaAboutRateUrl: data.pwaAboutRateUrl || "",
          pwaAboutCopyright: data.pwaAboutCopyright || "",
        });
      }
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Failed to load settings." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSettings(); }, []);

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
        toast({ title: "PWA Settings Saved", description: "Configuration updated." });
      }
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Failed to save." });
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
        pwaAboutTagline: settings.pwaAboutTagline,
        pwaAboutVersion: settings.pwaAboutVersion,
        pwaAboutPrivacyUrl: settings.pwaAboutPrivacyUrl,
        pwaAboutTermsUrl: settings.pwaAboutTermsUrl,
        pwaAboutContactUrl: settings.pwaAboutContactUrl,
        pwaAboutRateUrl: settings.pwaAboutRateUrl,
        pwaAboutCopyright: settings.pwaAboutCopyright,
      };
      const res = await authFetch("/api/payment-info", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        toast({ title: "PWA Branding Saved", description: "App branding updated successfully." });
      }
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Failed to save PWA settings." });
    } finally {
      setSaving(false);
    }
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
            PWA <span className="gold-shimmer">Setup</span>
          </h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium">System configuration and PWA branding.</p>
        </div>
      </div>

      <Tabs defaultValue="system" className="w-full">
        <TabsList className="bg-primary/5 border border-primary/10 rounded-2xl p-1 mb-8 flex flex-wrap gap-1">
          <TabsTrigger value="system" className="rounded-xl px-5 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2 font-bold transition-all">
            <Globe className="w-4 h-4" /> System Config
          </TabsTrigger>
          <TabsTrigger value="pwa" className="rounded-xl px-5 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2 font-bold transition-all">
            <Smartphone className="w-4 h-4" /> PWA
          </TabsTrigger>
        </TabsList>

        {/* ── System Config ──────────────────────────────────────── */}
        <TabsContent value="system" className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
          <section className="space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2 text-foreground">
              <Globe className="w-5 h-5 text-primary" /> System Configuration
            </h2>
            <form onSubmit={handleSaveSystem} className="space-y-6">
              <Card className="rounded-3xl border-border bg-card overflow-hidden">
                <CardContent className="p-6 space-y-6">

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between px-1">
                        <label className="text-[10px] font-black uppercase tracking-wider text-primary/60">Global Usage Limit</label>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-muted-foreground">{settings.isUsageLimitEnabled ? "Enabled" : "Disabled"}</span>
                          <input
                            type="checkbox"
                            checked={settings.isUsageLimitEnabled}
                            onChange={(e) => setSettings({ ...settings, isUsageLimitEnabled: e.target.checked })}
                            className="w-4 h-4 accent-primary"
                          />
                        </div>
                      </div>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/40" />
                        <Input
                          type="number"
                          value={settings.globalUsageLimit || 0}
                          onChange={(e) => setSettings({ ...settings, globalUsageLimit: parseInt(e.target.value) || 0 })}
                          className="h-12 pl-11 rounded-xl bg-muted/30 border-border font-bold text-foreground"
                          disabled={!settings.isUsageLimitEnabled}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between px-1">
                        <label className="text-[10px] font-black uppercase tracking-wider text-primary/60">Debug Mode</label>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-muted-foreground">{settings.isDebugMode ? "ON" : "OFF"}</span>
                          <input
                            type="checkbox"
                            checked={settings.isDebugMode}
                            onChange={(e) => setSettings({ ...settings, isDebugMode: e.target.checked })}
                            className="w-4 h-4 accent-red-500"
                          />
                        </div>
                      </div>
                      <div className="relative">
                        <ShieldAlert className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-red-500/40" />
                        <div className="h-12 pl-11 flex items-center rounded-xl bg-muted/10 border border-border text-[10px] font-medium text-muted-foreground">
                          Shows detailed server errors in the PWA for debugging.
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-wider text-primary/60 px-1">Measurement Limit (Free Users)</label>
                      <Input
                        type="number"
                        value={settings.measurementLimit || 0}
                        onChange={(e) => setSettings({ ...settings, measurementLimit: parseInt(e.target.value) || 0 })}
                        className="h-12 rounded-xl bg-muted/30 border-border font-bold text-foreground"
                      />
                    </div>
                  </div>

                  <div className="border-t border-border/50 pt-6 space-y-4">
                    <h3 className="text-sm font-bold text-primary flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-amber-400" /> Free User Upgrade Teaser
                    </h3>
                    <p className="text-xs text-muted-foreground -mt-1">Teaser card shown to <strong>Free users only</strong> — encouraging upgrade to Premium. Leave blank to use defaults.</p>
                    <div className="grid grid-cols-1 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-wider text-primary/60 px-1">Title</label>
                        <Input value={settings.freeUpgradeTitle || ""} onChange={(e) => setSettings({ ...settings, freeUpgradeTitle: e.target.value })} placeholder="e.g. Unlock Premium" className="h-12 rounded-xl bg-muted/30 border-border font-bold text-foreground" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-wider text-primary/60 px-1">Body Text</label>
                        <Textarea value={settings.freeUpgradeMessage || ""} onChange={(e) => setSettings({ ...settings, freeUpgradeMessage: e.target.value })} className="min-h-[80px] rounded-xl bg-muted/30 border-border font-medium leading-relaxed text-foreground" placeholder="e.g. Unlock professional features..." />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-wider text-primary/60 px-1">CTA Button Text</label>
                        <Input value={settings.freeUpgradeCTA || ""} onChange={(e) => setSettings({ ...settings, freeUpgradeCTA: e.target.value })} placeholder="e.g. Unlock Premium Now" className="h-12 rounded-xl bg-muted/30 border-border font-bold text-foreground" />
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-border/50 pt-6 space-y-4">
                    <h3 className="text-sm font-bold text-primary flex items-center gap-2">
                      <Crown className="w-4 h-4 text-amber-500" /> Premium Welcome Message
                    </h3>
                    <p className="text-xs text-muted-foreground -mt-1">Banner shown once to <strong>newly activated Premium users</strong>. Leave blank to hide.</p>
                    <div className="grid grid-cols-1 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-wider text-primary/60 px-1">Banner Title</label>
                        <Input value={settings.premiumUserTitle || ""} onChange={(e) => setSettings({ ...settings, premiumUserTitle: e.target.value })} placeholder="e.g. Welcome, Premium Member!" className="h-12 rounded-xl bg-muted/30 border-border font-bold text-foreground" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-wider text-primary/60 px-1">Banner Message</label>
                        <Textarea value={settings.premiumUserMessage || ""} onChange={(e) => setSettings({ ...settings, premiumUserMessage: e.target.value })} className="min-h-[80px] rounded-xl bg-muted/30 border-border font-medium leading-relaxed text-foreground" placeholder="e.g. Thank you for upgrading!" />
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-border/50 pt-6 space-y-4">
                    <h3 className="text-sm font-bold text-primary flex items-center gap-2">
                      <Zap className="w-4 h-4" /> Pro Upgrade Teaser
                    </h3>
                    <p className="text-xs text-muted-foreground -mt-1">Teaser shown to <strong>Premium users only</strong> — encouraging upgrade to the Pro plan.</p>
                    <div className="grid grid-cols-1 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-wider text-primary/60 px-1">Teaser Title</label>
                        <Input value={settings.proUpgradeTitle || ""} onChange={(e) => setSettings({ ...settings, proUpgradeTitle: e.target.value })} placeholder="e.g. Unlock Pro" className="h-12 rounded-xl bg-muted/30 border-border font-bold text-foreground" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-wider text-primary/60 px-1">Body Text</label>
                        <Textarea value={settings.proUpgradeMessage || ""} onChange={(e) => setSettings({ ...settings, proUpgradeMessage: e.target.value })} className="min-h-[100px] rounded-xl bg-muted/30 border-border font-medium leading-relaxed text-foreground" placeholder="e.g. Unlock professional features..." />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-wider text-primary/60 px-1">Button Link (optional)</label>
                          <div className="relative">
                            <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/40" />
                            <Input value={settings.proUpgradeLink || ""} onChange={(e) => setSettings({ ...settings, proUpgradeLink: e.target.value })} placeholder="https://wa.me/..." className="h-12 pl-11 rounded-xl bg-muted/30 border-border font-bold text-foreground" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-wider text-primary/60 px-1">CTA Button Text</label>
                          <Input value={settings.proUpgradeButtonText || ""} onChange={(e) => setSettings({ ...settings, proUpgradeButtonText: e.target.value })} placeholder="e.g. ⭐ Unlock Pro" className="h-12 rounded-xl bg-muted/30 border-border font-bold text-foreground" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-wider text-primary/60 px-1">Teaser Frequency</label>
                        <Select value={settings.proTeaserFrequency || "always"} onValueChange={(val) => setSettings({ ...settings, proTeaserFrequency: val })}>
                          <SelectTrigger className="h-12 rounded-xl bg-muted/30 border-border font-bold text-foreground">
                            <SelectValue placeholder="Select frequency" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="always">Always (every page load)</SelectItem>
                            <SelectItem value="daily">Once per day</SelectItem>
                            <SelectItem value="weekly">Once per week</SelectItem>
                            <SelectItem value="monthly">Once per month</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-[10px] text-muted-foreground px-1">Controls how often the Pro teaser footer shows for Premium users.</p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-border/50 pt-6 space-y-4">
                    <h3 className="text-sm font-bold text-primary flex items-center gap-2">
                      <Zap className="w-4 h-4" /> Payment Pending Banner
                    </h3>
                    <p className="text-xs text-muted-foreground">Shown to users who have started the upgrade process but haven't completed payment.</p>
                    <div className="grid grid-cols-1 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-wider text-primary/60 px-1">Banner Title</label>
                        <Input value={settings.pendingTitle || ""} onChange={(e) => setSettings({ ...settings, pendingTitle: e.target.value })} placeholder="e.g. Complete Your Upgrade" className="h-12 rounded-xl bg-muted/30 border-border font-bold text-foreground" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-wider text-primary/60 px-1">Banner Body</label>
                        <Textarea value={settings.pendingBody || ""} onChange={(e) => setSettings({ ...settings, pendingBody: e.target.value })} className="min-h-[80px] rounded-xl bg-muted/30 border-border font-medium leading-relaxed text-foreground" placeholder="e.g. You're one step away!" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-wider text-primary/60 px-1">CTA Button Text</label>
                        <Input value={settings.pendingCTA || ""} onChange={(e) => setSettings({ ...settings, pendingCTA: e.target.value })} placeholder="e.g. Finish Upgrade — Resume Now" className="h-12 rounded-xl bg-muted/30 border-border font-bold text-foreground" />
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-border/50 pt-6 space-y-4">
                    <h3 className="text-sm font-bold text-primary flex items-center gap-2">
                      <Zap className="w-4 h-4" /> Admin Payment Notification
                    </h3>
                    <p className="text-xs text-muted-foreground">When a user submits manual payment, notify this WhatsApp number.</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-wider text-primary/60 px-1">Admin WhatsApp Number</label>
                        <Input value={settings.adminNotificationPhone || ""} onChange={(e) => setSettings({ ...settings, adminNotificationPhone: e.target.value })} placeholder="+2348012345678" className="h-12 rounded-xl bg-muted/30 border-border font-bold text-foreground" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-wider text-primary/60 px-1">Notification Message Template</label>
                      <Textarea value={settings.adminNotificationMessage || ""} onChange={(e) => setSettings({ ...settings, adminNotificationMessage: e.target.value })} className="min-h-[80px] rounded-xl bg-muted/30 border-border font-medium leading-relaxed text-foreground" placeholder="e.g. New payment submitted by {name}." />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end pt-2">
                <Button type="submit" disabled={saving} className="rounded-2xl px-8 h-12 bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all">
                  {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Globe className="w-4 h-4 mr-2" />}
                  Save System Config
                </Button>
              </div>
            </form>
          </section>
        </TabsContent>

        {/* ── PWA Tab ─────────────────────────────────────────────── */}
        <TabsContent value="pwa" className="animate-in fade-in slide-in-from-bottom-2">
          <form onSubmit={handleSavePWA}>
            {/* Two-column: phone on left, tabs on right */}
            <div className="flex flex-col lg:flex-row gap-8 items-start">

              {/* Phone Preview — sticky on desktop */}
              <div className="lg:sticky lg:top-6 shrink-0 flex flex-col items-center gap-4">
                <p className="text-[10px] font-black uppercase tracking-wider text-primary/60">Home Screen Preview</p>
                <PhonePreview settings={settings} />
                <p className="text-[10px] text-muted-foreground text-center max-w-[12rem] leading-relaxed">
                  Updates live as you edit the fields on the right.
                </p>
              </div>

              {/* Right: inner tabs */}
              <div className="flex-1 min-w-0">
                <Tabs defaultValue="app-info" className="w-full">
                  <TabsList className="bg-muted/40 border border-border rounded-2xl p-1 mb-6 flex gap-1">
                    <TabsTrigger value="app-info" className="flex-1 rounded-xl px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center justify-center gap-2 font-bold text-sm transition-all">
                      <Globe className="w-3.5 h-3.5" /> App Info
                    </TabsTrigger>
                    <TabsTrigger value="app-brand" className="flex-1 rounded-xl px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center justify-center gap-2 font-bold text-sm transition-all">
                      <ImageIcon className="w-3.5 h-3.5" /> App Brand
                    </TabsTrigger>
                    <TabsTrigger value="about" className="flex-1 rounded-xl px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center justify-center gap-2 font-bold text-sm transition-all">
                      <Info className="w-3.5 h-3.5" /> About
                    </TabsTrigger>
                  </TabsList>

                  {/* ── Tab 1: App Info ── */}
                  <TabsContent value="app-info" className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                    <Card className="rounded-3xl border-border bg-card overflow-hidden">
                      <CardContent className="p-6 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-wider text-primary/60 px-1">App Name</label>
                            <Input
                              value={settings.pwaName}
                              onChange={(e) => setSettings({ ...settings, pwaName: e.target.value })}
                              placeholder="OneTailor Toolkit"
                              className="h-12 rounded-xl bg-muted/30 border-border font-bold text-foreground"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-wider text-primary/60 px-1">Short Name (home screen)</label>
                            <Input
                              value={settings.pwaShortName}
                              onChange={(e) => setSettings({ ...settings, pwaShortName: e.target.value })}
                              placeholder="OneTailor"
                              className="h-12 rounded-xl bg-muted/30 border-border font-bold text-foreground"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-wider text-primary/60 px-1">Theme Colour</label>
                            <div className="flex items-center gap-3">
                              <input
                                type="color"
                                value={settings.pwaThemeColor || "#6D28D9"}
                                onChange={(e) => setSettings({ ...settings, pwaThemeColor: e.target.value })}
                                className="w-12 h-12 rounded-xl border border-border cursor-pointer bg-transparent"
                              />
                              <Input
                                value={settings.pwaThemeColor}
                                onChange={(e) => setSettings({ ...settings, pwaThemeColor: e.target.value })}
                                placeholder="#6D28D9"
                                className="h-12 rounded-xl bg-muted/30 border-border font-mono font-bold text-foreground flex-1"
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-wider text-primary/60 px-1">Background Colour (splash)</label>
                            <div className="flex items-center gap-3">
                              <input
                                type="color"
                                value={settings.pwaBackgroundColor || "#ffffff"}
                                onChange={(e) => setSettings({ ...settings, pwaBackgroundColor: e.target.value })}
                                className="w-12 h-12 rounded-xl border border-border cursor-pointer bg-transparent"
                              />
                              <Input
                                value={settings.pwaBackgroundColor}
                                onChange={(e) => setSettings({ ...settings, pwaBackgroundColor: e.target.value })}
                                placeholder="#ffffff"
                                className="h-12 rounded-xl bg-muted/30 border-border font-mono font-bold text-foreground flex-1"
                              />
                            </div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-wider text-primary/60 px-1">App Description</label>
                          <Textarea
                            value={settings.pwaDescription}
                            onChange={(e) => setSettings({ ...settings, pwaDescription: e.target.value })}
                            placeholder="All the tools a tailor needs, in one place."
                            className="min-h-[80px] rounded-xl bg-muted/30 border-border font-medium leading-relaxed text-foreground"
                          />
                        </div>
                        <div className="rounded-2xl bg-primary/5 border border-primary/10 p-4 text-xs text-muted-foreground">
                          <span className="font-bold text-primary">Live manifest URL: </span>
                          <code className="font-mono">/api/pwa-manifest</code> — browsers fetch this dynamically on each install.
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* ── Tab 2: App Brand ── */}
                  <TabsContent value="app-brand" className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                    <Card className="rounded-3xl border-border bg-card overflow-hidden">
                      <CardHeader className="px-6 pt-6 pb-2">
                        <CardTitle className="text-base font-black flex items-center gap-2">
                          <ImageIcon className="w-4 h-4 text-primary" /> App Brand
                        </CardTitle>
                        <p className="text-xs text-muted-foreground">Upload a logo, favicon, and splash screen for the PWA.</p>
                      </CardHeader>
                      <CardContent className="p-6 space-y-6">
                        {/* App Logo */}
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-wider text-primary/60 px-1">App Logo (512×512 recommended)</label>
                          <div className="flex items-center gap-4">
                            <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-border bg-muted/30 flex items-center justify-center overflow-hidden shrink-0">
                              {settings.pwaLogoData ? <img src={settings.pwaLogoData} className="w-full h-full object-contain" /> : <ImageIcon className="w-8 h-8 text-muted-foreground/30" />}
                            </div>
                            <div className="flex flex-col gap-2">
                              <Button type="button" variant="outline" size="sm" onClick={() => logoFileRef.current?.click()} className="rounded-xl h-9 font-bold">
                                <Upload className="w-4 h-4 mr-2" /> Upload Logo
                              </Button>
                              {settings.pwaLogoData && (
                                <Button type="button" variant="ghost" size="sm" onClick={() => setSettings({ ...settings, pwaLogoData: "" })} className="rounded-xl h-9 text-destructive hover:text-destructive font-bold">
                                  <X className="w-4 h-4 mr-2" /> Remove
                                </Button>
                              )}
                            </div>
                          </div>
                          <input ref={logoFileRef} type="file" accept="image/*" className="hidden" onChange={async (e) => {
                            const f = e.target.files?.[0]; if (!f) return;
                            try { setSettings({ ...settings, pwaLogoData: await compressImage(f, 512) }); } catch {}
                            e.target.value = "";
                          }} />
                        </div>

                        {/* Favicon */}
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-wider text-primary/60 px-1">Favicon (32×32 or 64×64)</label>
                          <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-xl border-2 border-dashed border-border bg-muted/30 flex items-center justify-center overflow-hidden shrink-0">
                              {settings.pwaFaviconData ? <img src={settings.pwaFaviconData} className="w-full h-full object-contain" /> : <ImageIcon className="w-6 h-6 text-muted-foreground/30" />}
                            </div>
                            <div className="flex flex-col gap-2">
                              <Button type="button" variant="outline" size="sm" onClick={() => faviconFileRef.current?.click()} className="rounded-xl h-9 font-bold">
                                <Upload className="w-4 h-4 mr-2" /> Upload Favicon
                              </Button>
                              {settings.pwaFaviconData && (
                                <Button type="button" variant="ghost" size="sm" onClick={() => setSettings({ ...settings, pwaFaviconData: "" })} className="rounded-xl h-9 text-destructive hover:text-destructive font-bold">
                                  <X className="w-4 h-4 mr-2" /> Remove
                                </Button>
                              )}
                            </div>
                          </div>
                          <input ref={faviconFileRef} type="file" accept="image/*" className="hidden" onChange={async (e) => {
                            const f = e.target.files?.[0]; if (!f) return;
                            try { setSettings({ ...settings, pwaFaviconData: await compressImage(f, 64) }); } catch {}
                            e.target.value = "";
                          }} />
                        </div>

                        {/* Splash Screen */}
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-wider text-primary/60 px-1">Splash Screen (1080×1920 recommended)</label>
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-20 rounded-xl border-2 border-dashed border-border bg-muted/30 flex items-center justify-center overflow-hidden shrink-0">
                              {settings.pwaSplashData ? <img src={settings.pwaSplashData} className="w-full h-full object-cover" /> : <ImageIcon className="w-5 h-8 text-muted-foreground/30" />}
                            </div>
                            <div className="flex flex-col gap-2">
                              <Button type="button" variant="outline" size="sm" onClick={() => splashFileRef.current?.click()} className="rounded-xl h-9 font-bold">
                                <Upload className="w-4 h-4 mr-2" /> Upload Splash
                              </Button>
                              {settings.pwaSplashData && (
                                <Button type="button" variant="ghost" size="sm" onClick={() => setSettings({ ...settings, pwaSplashData: "" })} className="rounded-xl h-9 text-destructive hover:text-destructive font-bold">
                                  <X className="w-4 h-4 mr-2" /> Remove
                                </Button>
                              )}
                            </div>
                          </div>
                          <input ref={splashFileRef} type="file" accept="image/*" className="hidden" onChange={async (e) => {
                            const f = e.target.files?.[0]; if (!f) return;
                            try { setSettings({ ...settings, pwaSplashData: await compressImage(f, 1920) }); } catch {}
                            e.target.value = "";
                          }} />
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* ── Tab 3: About ── */}
                  <TabsContent value="about" className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                    <Card
                      className="rounded-3xl border-border bg-card overflow-hidden hover:border-primary/30 transition-colors cursor-pointer"
                      onClick={() => { window.location.href = window.location.pathname.split("/pwa-settings")[0] + "/pwa-about"; }}
                    >
                      <CardContent className="p-6 flex items-center gap-5">
                        <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center shrink-0">
                          <Info className="w-6 h-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-foreground">Edit About Page Content</p>
                          <p className="text-sm text-muted-foreground mt-0.5">Manage tagline, version, links, and copyright shown in the PWA About screen.</p>
                        </div>
                        <ExternalLink className="w-4 h-4 text-muted-foreground shrink-0" />
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>

                <div className="flex justify-end pt-4">
                  <Button type="submit" disabled={saving} className="rounded-2xl px-8 h-12 bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all">
                    {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    Save PWA Settings
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </TabsContent>
      </Tabs>
    </div>
  );
}
