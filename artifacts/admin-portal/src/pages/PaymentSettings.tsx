import React, { useState, useEffect } from "react";
import { authFetch } from "@/lib/authFetch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { 
  Loader2, 
  Save, 
  RefreshCw, 
  CreditCard, 
  Building2, 
  Banknote,
  ShieldCheck,
  Zap,
  Globe,
  Copy,
  AlertTriangle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface PaymentInfo {
  price: number;
  bankName: string;
  accountNumber: string;
  accountName: string;
  instructions: string;
  isPaystackEnabled: boolean;
  isManualEnabled: boolean;
  paystackPublicKey: string;
  paystackSecretKey: string;
  currencyCode: string;
  currencySymbol: string;
}

export default function PaymentSettings() {
  const [settings, setSettings] = useState<PaymentInfo>({
    price: 15000,
    bankName: "",
    accountNumber: "",
    accountName: "",
    instructions: "",
    isPaystackEnabled: true,
    isManualEnabled: true,
    paystackPublicKey: "",
    paystackSecretKey: "",
    currencyCode: "NGN",
    currencySymbol: "₦",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [priceTiers, setPriceTiers] = useState({
    singleDevice: 15000,
    twoDevice: 25000,
    threeDevice: 35000,
    fiveDevice: 55000,
  });
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [testMode, setTestMode] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/payment-info");
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
        if (data.updatedAt) setLastUpdated(data.updatedAt);
      } else {
        throw new Error("Failed to load");
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Could not fetch settings" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await authFetch("/api/payment-info", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        toast({ title: "Settings Saved", description: "Payment information updated successfully." });
      } else {
        toast({ variant: "destructive", title: "Save Failed" });
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error" });
    } finally {
      setSaving(false);
    }
  };

  const getValidationWarnings = () => {
    const warnings = [];
    if (settings.isPaystackEnabled && !settings.paystackPublicKey) {
      warnings.push("Paystack is enabled but Public Key is missing");
    }
    if (settings.isManualEnabled && (!settings.bankName || !settings.accountNumber || !settings.accountName)) {
      warnings.push("Manual bank transfer is enabled but bank details are incomplete");
    }
    if (!settings.isPaystackEnabled && !settings.isManualEnabled) {
      warnings.push("No payment methods are enabled. Users won't be able to upgrade.");
    }
    if (settings.price <= 0) {
      warnings.push("License price is set to 0 or negative. Users can get premium for free!");
    }
    return warnings;
  };

  const resetToDefaults = () => {
    if (!confirm("Reset all payment settings to defaults?")) return;
    setSettings({
      price: 15000,
      bankName: "",
      accountNumber: "",
      accountName: "",
      instructions: "",
      isPaystackEnabled: true,
      isManualEnabled: true,
      paystackPublicKey: "",
      paystackSecretKey: "",
      currencyCode: "NGN",
      currencySymbol: "₦",
    });
    setPriceTiers({ singleDevice: 15000, twoDevice: 25000, threeDevice: 35000, fiveDevice: 55000 });
    toast({ title: "Reset to defaults", description: "Settings have been reset." });
  };

  const exportSettings = () => {
    const exportData = { settings, priceTiers, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payment_settings_${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Exported", description: "Settings exported to JSON file." });
  };

  const importSettings = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (data.settings) setSettings(data.settings);
        if (data.priceTiers) setPriceTiers(data.priceTiers);
        toast({ title: "Imported", description: "Settings restored from backup." });
      } catch {
        toast({ variant: "destructive", title: "Error", description: "Invalid backup file." });
      }
    };
    reader.readAsText(file);
  };

  const cardStyle = {};
  const inputStyle = {};

  if (loading) return <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto w-10 h-10 text-primary" /></div>;

  return (
    <div className="space-y-8 pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Payment Configuration</h1>
          <p className="text-muted-foreground text-sm">Manage how users pay for Premium access.</p>
          {lastUpdated && (
            <p className="text-[10px] text-muted-foreground mt-1">Last updated: {new Date(lastUpdated).toLocaleString()}</p>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportSettings} className="rounded-xl h-12 px-4">
            <Save size={16} className="rotate-90" /> Export
          </Button>
          <Button variant="outline" onClick={() => document.getElementById("import-file")?.click()} className="rounded-xl h-12 px-4">
            <RefreshCw size={16} /> Import
          </Button>
          <input id="import-file" type="file" accept=".json" className="hidden" onChange={(e) => e.target.files?.[0] && importSettings(e.target.files[0])} />
          <Button variant="outline" onClick={resetToDefaults} className="rounded-xl h-12 px-4 font-bold">
            Reset to Defaults
          </Button>
          <Button onClick={handleSave} disabled={saving} className="rounded-xl h-12 px-8 font-bold gap-2">
            {saving ? <Loader2 className="animate-spin w-4 h-4" /> : <Save size={18} />}
            Save Changes
          </Button>
        </div>
      </div>

      {/* ── Validation Warnings ── */}
      {getValidationWarnings().length > 0 && (
        <div className="rounded-2xl bg-amber-500/10 border border-amber-500/20 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-amber-500">Configuration Warnings</p>
              <ul className="text-xs text-amber-400/80 mt-1 space-y-0.5">
                {getValidationWarnings().map((w, i) => (
                  <li key={i}>• {w}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* GENERAL SETTINGS */}
        <Card style={cardStyle} className="rounded-3xl border-none shadow-2xl lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                <Globe className="text-primary" />
              </div>
              <div>
                <CardTitle>Global Payment Settings</CardTitle>
                <CardDescription>Configure currency and pricing across the platform.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-primary/60 px-1">Currency Code (e.g. NGN, USD)</label>
              <Input 
                value={settings.currencyCode} 
                onChange={(e) => setSettings({...settings, currencyCode: e.target.value.toUpperCase()})} 
                style={inputStyle}
                className="h-12 rounded-xl border-none font-bold"
                placeholder="NGN"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-primary/60 px-1">Currency Symbol (e.g. ₦, $)</label>
              <Input 
                value={settings.currencySymbol} 
                onChange={(e) => setSettings({...settings, currencySymbol: e.target.value})} 
                style={inputStyle}
                className="h-12 rounded-xl border-none font-bold"
                placeholder="₦"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-primary/60 px-1">License Price (in Naira, e.g. 15000 = ₦15,000)</label>
              <Input 
                type="number"
                value={settings.price} 
                onChange={(e) => setSettings({...settings, price: parseInt(e.target.value)})} 
                style={inputStyle}
                className="h-12 rounded-xl border-none font-bold"
              />
            </div>
            <div className="md:col-span-3">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center gap-2 text-xs font-bold text-primary hover:text-primary/80 transition-colors"
              >
                <Zap size={12} />
                {showAdvanced ? "Hide" : "Show"} Multi-Device Pricing
              </button>
            </div>
            {showAdvanced && (
              <div className="md:col-span-3 space-y-4 pt-2 border-t border-border/50">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Device Plan Pricing</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { key: "singleDevice", label: "1 Device", default: 15000 },
                    { key: "twoDevice", label: "2 Devices", default: 25000 },
                    { key: "threeDevice", label: "3 Devices", default: 35000 },
                    { key: "fiveDevice", label: "5 Devices", default: 55000 },
                  ].map(tier => (
                    <div key={tier.key} className="space-y-2">
                      <label className="text-[10px] font-bold text-muted-foreground">{tier.label}</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">{settings.currencySymbol}</span>
                        <Input
                          type="number"
                          value={(priceTiers as any)[tier.key]}
                          onChange={(e) => setPriceTiers({...priceTiers, [tier.key]: parseInt(e.target.value) || 0})}
                          className="pl-7 h-12 rounded-xl"
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-muted-foreground">These prices will be used when users select device plans in the upgrade flow.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* PAYSTACK SETTINGS */}
        <Card style={cardStyle} className="rounded-3xl border-none shadow-2xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                  <CreditCard className="text-emerald-500" />
                </div>
                <div>
                  <CardTitle>Paystack Integration</CardTitle>
                  <CardDescription>Automated payment processing.</CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-muted-foreground">Test Mode</span>
                  <Switch
                    checked={testMode}
                    onCheckedChange={setTestMode}
                    className="data-[state=checked]:bg-amber-500"
                  />
                </div>
                <Switch
                  checked={settings.isPaystackEnabled}
                  onCheckedChange={(val) => setSettings({...settings, isPaystackEnabled: val})}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-primary/60 px-1 flex items-center gap-2">
                Public Key {testMode && <Badge variant="outline" className="text-[9px] bg-amber-500/10 text-amber-500">Test Key</Badge>}
              </label>
              <Input
                value={settings.paystackPublicKey}
                onChange={(e) => setSettings({...settings, paystackPublicKey: e.target.value})}
                style={inputStyle}
                className="h-12 rounded-xl border-none font-mono text-xs"
                placeholder={testMode ? "pk_test_..." : "pk_live_..."}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-primary/60 px-1">Secret Key</label>
              <Input 
                type="password"
                value={settings.paystackSecretKey} 
                onChange={(e) => setSettings({...settings, paystackSecretKey: e.target.value})} 
                style={inputStyle}
                className="h-12 rounded-xl border-none font-mono text-xs"
                placeholder="sk_live_••••••••  (leave blank to keep existing)"
              />
              <p className="text-xs text-muted-foreground px-1">Leave blank to keep the existing secret key. Only enter a new value to replace it.</p>
            </div>
          </CardContent>
        </Card>

        {/* MANUAL PAYMENT SETTINGS */}
        <Card style={cardStyle} className="rounded-3xl border-none shadow-2xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                  <Building2 className="text-blue-500" />
                </div>
                <div>
                  <CardTitle>Manual Bank Transfer</CardTitle>
                  <CardDescription>User transfers and uploads proof.</CardDescription>
                </div>
              </div>
              <Switch 
                checked={settings.isManualEnabled} 
                onCheckedChange={(val) => setSettings({...settings, isManualEnabled: val})} 
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-primary/60 px-1">Bank Name</label>
                <Input value={settings.bankName} onChange={(e) => setSettings({...settings, bankName: e.target.value})} style={inputStyle} className="h-12 rounded-xl border-none font-bold" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-primary/60 px-1">Account Number</label>
                <Input value={settings.accountNumber} onChange={(e) => setSettings({...settings, accountNumber: e.target.value})} style={inputStyle} className="h-12 rounded-xl border-none font-mono font-bold tracking-widest" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-primary/60 px-1">Account Name</label>
              <Input value={settings.accountName} onChange={(e) => setSettings({...settings, accountName: e.target.value})} style={inputStyle} className="h-12 rounded-xl border-none font-bold" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-primary/60 px-1">User Instructions</label>
              <Textarea value={settings.instructions} onChange={(e) => setSettings({...settings, instructions: e.target.value})} style={inputStyle} className="rounded-xl border-none min-h-[100px] resize-none text-sm" />
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const details = `Bank: ${settings.bankName}\nAccount: ${settings.accountNumber}\nName: ${settings.accountName}\n\n${settings.instructions}`;
                  navigator.clipboard.writeText(details);
                  toast({ title: "Copied!", description: "Bank details copied to clipboard." });
                }}
                className="rounded-xl text-xs gap-1"
                disabled={!settings.bankName || !settings.accountNumber}
              >
                <Copy size={12} /> Copy Details
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* ── Live Preview ── */}
        {settings.isManualEnabled && (settings.bankName || settings.accountNumber) && (
          <Card style={cardStyle} className="rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 lg:col-span-2">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                  <ShieldCheck className="text-primary" size={18} />
                </div>
                <div>
                  <CardTitle className="text-sm">Live Preview</CardTitle>
                  <CardDescription>How users will see your bank details</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-2xl bg-background/50 p-4 space-y-3">
                <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                  <span className="text-xs text-muted-foreground">Bank</span>
                  <span className="font-bold text-sm">{settings.bankName || "—"}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                  <span className="text-xs text-muted-foreground">Account Number</span>
                  <span className="font-mono font-bold text-sm">{settings.accountNumber || "—"}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                  <span className="text-xs text-muted-foreground">Account Name</span>
                  <span className="font-bold text-sm">{settings.accountName || "—"}</span>
                </div>
                {settings.instructions && (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                    <p className="text-xs text-amber-400">{settings.instructions}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
    </div>
  );
}
