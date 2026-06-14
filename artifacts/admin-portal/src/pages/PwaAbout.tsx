import React, { useState, useEffect } from "react";
import { authFetch } from "@/lib/authFetch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2, Save, Info, Globe, Shield, FileText, Phone, Star, ExternalLink, Smartphone, ArrowLeft,
} from "lucide-react";
import { useLocation } from "wouter";

interface AboutInfo {
  pwaName: string;
  pwaThemeColor: string;
  pwaLogoData: string;
  pwaAboutTagline: string;
  pwaAboutVersion: string;
  pwaAboutPrivacyUrl: string;
  pwaAboutTermsUrl: string;
  pwaAboutContactUrl: string;
  pwaAboutRateUrl: string;
  pwaAboutCopyright: string;
}

const DEFAULT: AboutInfo = {
  pwaName: "",
  pwaThemeColor: "#6D28D9",
  pwaLogoData: "",
  pwaAboutTagline: "",
  pwaAboutVersion: "",
  pwaAboutPrivacyUrl: "",
  pwaAboutTermsUrl: "",
  pwaAboutContactUrl: "",
  pwaAboutRateUrl: "",
  pwaAboutCopyright: "",
};

export default function PwaAbout() {
  const [settings, setSettings] = useState<AboutInfo>(DEFAULT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const [, navigate] = useLocation();

  useEffect(() => {
    fetch("/api/payment-info")
      .then(r => r.json())
      .then(data => {
        setSettings({
          pwaName: data.pwaName || "",
          pwaThemeColor: data.pwaThemeColor || "#6D28D9",
          pwaLogoData: data.pwaLogoData || "",
          pwaAboutTagline: data.pwaAboutTagline || "",
          pwaAboutVersion: data.pwaAboutVersion || "",
          pwaAboutPrivacyUrl: data.pwaAboutPrivacyUrl || "",
          pwaAboutTermsUrl: data.pwaAboutTermsUrl || "",
          pwaAboutContactUrl: data.pwaAboutContactUrl || "",
          pwaAboutRateUrl: data.pwaAboutRateUrl || "",
          pwaAboutCopyright: data.pwaAboutCopyright || "",
        });
      })
      .catch(() => toast({ variant: "destructive", title: "Error", description: "Failed to load settings." }))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await authFetch("/api/payment-info", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pwaAboutTagline: settings.pwaAboutTagline,
          pwaAboutVersion: settings.pwaAboutVersion,
          pwaAboutPrivacyUrl: settings.pwaAboutPrivacyUrl,
          pwaAboutTermsUrl: settings.pwaAboutTermsUrl,
          pwaAboutContactUrl: settings.pwaAboutContactUrl,
          pwaAboutRateUrl: settings.pwaAboutRateUrl,
          pwaAboutCopyright: settings.pwaAboutCopyright,
        }),
      });
      if (res.ok) {
        toast({ title: "About Page Saved", description: "About page content updated successfully." });
      } else {
        throw new Error("Save failed");
      }
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Failed to save." });
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
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate("/settings")}
          className="w-9 h-9 rounded-xl border border-border flex items-center justify-center hover:bg-muted/50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground" style={{ fontFamily: "var(--font-serif)" }}>
            <span className="gold-shimmer">About Page</span>
          </h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium">Control the About screen displayed inside the PWA.</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">

        {/* Preview */}
        <div className="lg:sticky lg:top-6 shrink-0 w-full lg:w-72">
          <p className="text-[10px] font-black uppercase tracking-wider text-primary/60 mb-3">About Page Preview</p>
          <div className="rounded-2xl border border-border bg-muted/20 p-6 space-y-5">
            <div className="flex flex-col items-center gap-2 text-center">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center overflow-hidden shadow-md border border-white/10"
                style={{ background: settings.pwaThemeColor || "#6D28D9" }}
              >
                {settings.pwaLogoData ? (
                  <img src={settings.pwaLogoData} className="w-full h-full object-contain p-1" alt="logo" />
                ) : (
                  <Smartphone className="w-8 h-8 text-white" />
                )}
              </div>
              <div>
                <p className="font-black text-lg text-foreground leading-tight">{settings.pwaName || "OneTailor"}</p>
                {settings.pwaAboutTagline && (
                  <p className="text-xs text-muted-foreground mt-0.5">{settings.pwaAboutTagline}</p>
                )}
                {settings.pwaAboutVersion && (
                  <span className="inline-block mt-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary/80">
                    v{settings.pwaAboutVersion}
                  </span>
                )}
              </div>
            </div>
            <div className="space-y-2">
              {[
                { icon: Shield, label: "Privacy Policy", url: settings.pwaAboutPrivacyUrl },
                { icon: FileText, label: "Terms of Service", url: settings.pwaAboutTermsUrl },
                { icon: Phone, label: "Contact Support", url: settings.pwaAboutContactUrl },
                { icon: Star, label: "Rate App", url: settings.pwaAboutRateUrl },
              ].map(({ icon: Icon, label, url }) => (
                <div
                  key={label}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${url ? "border-border bg-card" : "border-dashed border-border/40 bg-muted/10 opacity-40"}`}
                >
                  <Icon className="w-4 h-4 text-primary shrink-0" />
                  <span className="text-xs font-medium flex-1 text-foreground">{label}</span>
                  {url && <ExternalLink className="w-3 h-3 text-muted-foreground" />}
                </div>
              ))}
            </div>
            {settings.pwaAboutCopyright && (
              <p className="text-[9px] text-center text-muted-foreground/60 pt-2 border-t border-border/30">
                {settings.pwaAboutCopyright}
              </p>
            )}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="flex-1 min-w-0 space-y-6">
          <Card className="rounded-3xl border-border bg-card overflow-hidden">
            <CardHeader className="px-6 pt-6 pb-2">
              <CardTitle className="text-base font-black flex items-center gap-2">
                <Info className="w-4 h-4 text-primary" /> App Identity
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-wider text-primary/60 px-1">App Tagline</label>
                  <Input
                    value={settings.pwaAboutTagline}
                    onChange={(e) => setSettings({ ...settings, pwaAboutTagline: e.target.value })}
                    placeholder="Tailors Toolkit"
                    className="h-12 rounded-xl bg-muted/30 border-border font-bold text-foreground"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-wider text-primary/60 px-1">Version</label>
                  <Input
                    value={settings.pwaAboutVersion}
                    onChange={(e) => setSettings({ ...settings, pwaAboutVersion: e.target.value })}
                    placeholder="2.0.0"
                    className="h-12 rounded-xl bg-muted/30 border-border font-bold text-foreground"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-border bg-card overflow-hidden">
            <CardHeader className="px-6 pt-6 pb-2">
              <CardTitle className="text-base font-black flex items-center gap-2">
                <Globe className="w-4 h-4 text-primary" /> Links
              </CardTitle>
              <p className="text-xs text-muted-foreground">Links shown on the About screen. Leave blank to hide a link.</p>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-wider text-primary/60 px-1 flex items-center gap-1.5">
                  <Shield className="w-3 h-3" /> Privacy Policy URL
                </label>
                <Input
                  value={settings.pwaAboutPrivacyUrl}
                  onChange={(e) => setSettings({ ...settings, pwaAboutPrivacyUrl: e.target.value })}
                  placeholder="https://onetailor.com/privacy"
                  className="h-12 rounded-xl bg-muted/30 border-border font-mono text-sm text-foreground"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-wider text-primary/60 px-1 flex items-center gap-1.5">
                  <FileText className="w-3 h-3" /> Terms of Service URL
                </label>
                <Input
                  value={settings.pwaAboutTermsUrl}
                  onChange={(e) => setSettings({ ...settings, pwaAboutTermsUrl: e.target.value })}
                  placeholder="https://onetailor.com/terms"
                  className="h-12 rounded-xl bg-muted/30 border-border font-mono text-sm text-foreground"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-wider text-primary/60 px-1 flex items-center gap-1.5">
                  <Phone className="w-3 h-3" /> Contact Support URL
                </label>
                <Input
                  value={settings.pwaAboutContactUrl}
                  onChange={(e) => setSettings({ ...settings, pwaAboutContactUrl: e.target.value })}
                  placeholder="https://wa.me/234..."
                  className="h-12 rounded-xl bg-muted/30 border-border font-mono text-sm text-foreground"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-wider text-primary/60 px-1 flex items-center gap-1.5">
                  <Star className="w-3 h-3" /> Rate App URL
                </label>
                <Input
                  value={settings.pwaAboutRateUrl}
                  onChange={(e) => setSettings({ ...settings, pwaAboutRateUrl: e.target.value })}
                  placeholder="https://play.google.com/store/..."
                  className="h-12 rounded-xl bg-muted/30 border-border font-mono text-sm text-foreground"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-border bg-card overflow-hidden">
            <CardContent className="p-6 space-y-2">
              <label className="text-[10px] font-black uppercase tracking-wider text-primary/60 px-1">Copyright Text</label>
              <Input
                value={settings.pwaAboutCopyright}
                onChange={(e) => setSettings({ ...settings, pwaAboutCopyright: e.target.value })}
                placeholder="© 2026 OneTailor Digital Services"
                className="h-12 rounded-xl bg-muted/30 border-border font-bold text-foreground"
              />
            </CardContent>
          </Card>

          <div className="flex justify-end pt-2">
            <Button type="submit" disabled={saving} className="rounded-2xl px-8 h-12 bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/20">
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Save About Page
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
