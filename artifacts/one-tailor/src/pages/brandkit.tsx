import { useState, useRef } from "react";
import { 
  Palette, Upload, Monitor, User, Phone, MessageCircle, Mail,
  Instagram, Facebook, Save, ShieldCheck, Crown, Pipette, Loader2
} from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { useToast } from "@/hooks/use-toast";
import { PageHeader } from "@/components/shared/PageHeader";
import { validateName, validatePhone } from "@/lib/utils";

// ─── Image compression ────────────────────────────────────────────────────

function compressImageToBase64(file: File, maxSize = 256): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext("2d");
      if (!ctx) { reject(new Error("No canvas")); return; }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/png", 0.9));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Load failed")); };
    img.src = url;
  });
}

// ─── Color extraction ─────────────────────────────────────────────────────

function rgbToHex(r: number, g: number, b: number): string {
  return "#" + [r, g, b].map(v => {
    const hex = Math.round(v).toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  }).join("");
}

function isNearWhite(r: number, g: number, b: number): boolean {
  return r > 240 && g > 240 && b > 240;
}

function isNearBlack(r: number, g: number, b: number): boolean {
  return r < 20 && g < 20 && b < 20;
}

function isGray(r: number, g: number, b: number): boolean {
  const avg = (r + g + b) / 3;
  return Math.abs(r - avg) < 15 && Math.abs(g - avg) < 15 && Math.abs(b - avg) < 15 && avg > 30 && avg < 225;
}

function colorDistance(a: number[], b: number[]): number {
  const rMean = (a[0] + b[0]) / 2;
  const dR = a[0] - b[0];
  const dG = a[1] - b[1];
  const dB = a[2] - b[2];
  return Math.sqrt((2 + rMean / 256) * dR * dR + 4 * dG * dG + (2 + (255 - rMean) / 256) * dB * dB);
}

async function extractColorsFromImage(base64: string): Promise<{ primary: string; secondary: string; accent: string }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const size = 100;
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");

      if (!ctx) { 
        resolve({ primary: "#0f0f0f", secondary: "#d4a020", accent: "#f5d76e" }); 
        return; 
      }

      ctx.drawImage(img, 0, 0, size, size);
      const imageData = ctx.getImageData(0, 0, size, size);
      const data = imageData.data;

      const pixels: [number, number, number][] = [];

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];

        if (a < 128) continue;
        if (isNearWhite(r, g, b)) continue;
        if (isNearBlack(r, g, b)) continue;

        pixels.push([r, g, b]);
      }

      if (pixels.length === 0) {
        resolve({ primary: "#0f0f0f", secondary: "#d4a020", accent: "#f5d76e" });
        return;
      }

      const clusters: { color: [number, number, number]; count: number }[] = [];

      for (const pixel of pixels) {
        let added = false;

        for (const cluster of clusters) {
          if (colorDistance(pixel, cluster.color) < 50) {
            const total = cluster.count + 1;
            cluster.color[0] = (cluster.color[0] * cluster.count + pixel[0]) / total;
            cluster.color[1] = (cluster.color[1] * cluster.count + pixel[1]) / total;
            cluster.color[2] = (cluster.color[2] * cluster.count + pixel[2]) / total;
            cluster.count = total;
            added = true;
            break;
          }
        }

        if (!added) {
          clusters.push({ color: [...pixel] as [number, number, number], count: 1 });
        }
      }

      clusters.sort((a, b) => b.count - a.count);

      const primary = clusters[0]?.color || [15, 15, 15];

      let secondary: [number, number, number] = [212, 160, 32];
      let accent: [number, number, number] = [245, 215, 110];

      const nonGrayClusters = clusters.filter(c => !isGray(c.color[0], c.color[1], c.color[2]));

      if (nonGrayClusters.length >= 2) {
        secondary = nonGrayClusters[0]?.color || secondary;
        accent = nonGrayClusters[1]?.color || accent;
      } else if (clusters.length >= 2) {
        secondary = clusters[1]?.color || secondary;
        if (clusters.length >= 3) {
          accent = clusters[2]?.color || accent;
        }
      }

      resolve({
        primary: rgbToHex(primary[0], primary[1], primary[2]),
        secondary: rgbToHex(secondary[0], secondary[1], secondary[2]),
        accent: rgbToHex(accent[0], accent[1], accent[2]),
      });
    };

    img.onerror = () => resolve({ primary: "#0f0f0f", secondary: "#d4a020", accent: "#f5d76e" });
    img.src = base64;
  });
}

// ─── Component ────────────────────────────────────────────────────────────

export default function BrandKit() {
  const appName = useAppStore((s) => s.appName);
  const appLogo = useAppStore((s) => s.appLogo);
  const splashImage = useAppStore((s) => s.splashImage);
  const businessProfile = useAppStore((s) => s.businessProfile);
  const setBusinessProfile = useAppStore((s) => s.setBusinessProfile);
  const setAppName = useAppStore((s) => s.setAppName);
  const setAppLogo = useAppStore((s) => s.setAppLogo);
  const setSplashImage = useAppStore((s) => s.setSplashImage);
  const isPremium = useAppStore((s) => s.isPremium);
  const { toast } = useToast();

  const [brandForm, setBrandForm] = useState({
    name: businessProfile?.name || appName || "",
    tagline: businessProfile?.tagline || "",
    clientIdPrefix: businessProfile?.clientIdPrefix || "",
    phone: businessProfile?.phone || "",
    email: businessProfile?.email || "",
    street: businessProfile?.addressDetails?.street || "",
    city: businessProfile?.addressDetails?.city || "",
    state: businessProfile?.addressDetails?.state || "",
    landmark: businessProfile?.addressDetails?.landmark || "",
    country: businessProfile?.addressDetails?.country || "Nigeria",
    instagram: businessProfile?.socials?.instagram || "",
    facebook: businessProfile?.socials?.facebook || "",
    whatsapp: businessProfile?.socials?.whatsapp || "",
    tiktok: businessProfile?.socials?.tiktok || "",
    youtube: businessProfile?.socials?.youtube || "",
    primaryColor: businessProfile?.brandColors?.primary || "#0f0f0f",
    secondaryColor: businessProfile?.brandColors?.secondary || "#d4a020",
    accentColor: businessProfile?.brandColors?.accent || "#f5d76e"
  });

  const [logoInput, setLogoInput] = useState<string | null>(appLogo);
  const [splashInput, setSplashInput] = useState<string | null>(splashImage);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingSplash, setUploadingSplash] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const splashInputRef = useRef<HTMLInputElement>(null);

  const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());

  const handleLogoUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) return;
    setUploadingLogo(true);
    try {
      const b64 = await compressImageToBase64(file, 512);
      setLogoInput(b64);

      if (isPremium) {
        setExtracting(true);
        toast({ title: "Analyzing colors...", description: "Extracting brand palette from your logo." });
        const colors = await extractColorsFromImage(b64);
        setBrandForm(prev => ({
          ...prev,
          primaryColor: colors.primary,
          secondaryColor: colors.secondary,
          accentColor: colors.accent
        }));
        setExtracting(false);
        toast({ title: "Colors Extracted!", description: "Brand colors updated from your logo." });
      }
    } catch {
      toast({ title: "Failed to load image", variant: "destructive" });
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSplashUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) return;
    setUploadingSplash(true);
    try {
      const b64 = await compressImageToBase64(file, 1080);
      setSplashInput(b64);
    } catch {
      toast({ title: "Failed to load image", variant: "destructive" });
    } finally {
      setUploadingSplash(false);
    }
  };

  const handleExtractFromLogo = async () => {
    if (!logoInput) return;
    setExtracting(true);
    try {
      const colors = await extractColorsFromImage(logoInput);
      setBrandForm(prev => ({
        ...prev,
        primaryColor: colors.primary,
        secondaryColor: colors.secondary,
        accentColor: colors.accent
      }));
      toast({ title: "Colors Extracted!", description: "Brand colors updated from your logo." });
    } catch {
      toast({ title: "Extraction failed", variant: "destructive" });
    } finally {
      setExtracting(false);
    }
  };

  const handleSave = () => {
    const nameVal = validateName(brandForm.name);
    if (!nameVal.valid) { toast({ title: "Invalid Name", description: nameVal.message, variant: "destructive" }); return; }
    if (!brandForm.phone && !brandForm.whatsapp) {
      toast({ title: "Contact Required", description: "Please enter a Business Phone or WhatsApp number.", variant: "destructive" });
      return;
    }
    if (brandForm.phone) {
      const pv = validatePhone(brandForm.phone);
      if (!pv.valid) { toast({ title: "Invalid Phone", description: pv.message, variant: "destructive" }); return; }
    }
    if (brandForm.whatsapp) {
      const wv = validatePhone(brandForm.whatsapp);
      if (!wv.valid) { toast({ title: "Invalid WhatsApp", description: wv.message, variant: "destructive" }); return; }
    }
    if (brandForm.email && !isValidEmail(brandForm.email)) {
      toast({ title: "Invalid Email", variant: "destructive" }); return;
    }

    const combinedAddress = [
      brandForm.street,
      brandForm.city,
      brandForm.state,
      brandForm.landmark ? `(Near ${brandForm.landmark})` : "",
      brandForm.country
    ].filter(Boolean).join(", ");

    setAppName(brandForm.name.trim());
    setAppLogo(logoInput);
    setSplashImage(splashInput);
    setBusinessProfile({
      name: brandForm.name.trim(),
      tagline: brandForm.tagline.trim(),
      clientIdPrefix: brandForm.clientIdPrefix ? brandForm.clientIdPrefix.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 5) : "",
      phone: brandForm.phone,
      email: brandForm.email,
      address: combinedAddress,
      addressDetails: {
        street: brandForm.street,
        city: brandForm.city,
        state: brandForm.state,
        landmark: brandForm.landmark,
        country: brandForm.country
      },
      socials: {
        instagram: brandForm.instagram,
        facebook: brandForm.facebook,
        whatsapp: brandForm.whatsapp,
        tiktok: brandForm.tiktok,
        youtube: brandForm.youtube
      },
      brandColors: {
        primary: brandForm.primaryColor,
        secondary: brandForm.secondaryColor,
        accent: brandForm.accentColor
      }
    });

    document.title = brandForm.name.trim();
    toast({ title: "Brand Kit Saved!", description: `Your business identity has been updated.` });
  };

  const inputClass = "w-full px-4 py-3.5 rounded-2xl bg-muted/30 border border-border outline-none focus:border-primary text-sm";
  const labelClass = "text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1";

  return (
    <div className="max-w-xl mx-auto pb-24">
      <PageHeader title="Brand Kit" subtitle="Configure your professional branding" backPath="/settings" />

      <div className="px-4 py-5 space-y-6">
        <div className="bg-card border border-border rounded-3xl p-6 space-y-6">

          {/* ── Logo & Splash ──────────────────────────────────────────── */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className={labelClass}>Logo</label>
              <div 
                onClick={() => logoInputRef.current?.click()}
                className="aspect-square rounded-2xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-muted/30 transition-all overflow-hidden relative group"
              >
                {uploadingLogo ? (
                  <Loader2 size={24} className="animate-spin text-muted-foreground" />
                ) : logoInput ? (
                  <>
                    <img src={logoInput} className="w-full h-full object-contain p-2" alt="Logo" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <Upload size={20} className="text-white" />
                    </div>
                  </>
                ) : (
                  <>
                    <Upload size={20} className="text-muted-foreground" />
                    <span className="text-[9px] font-bold text-muted-foreground">UPLOAD</span>
                  </>
                )}
              </div>
              <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleLogoUpload(f); e.target.value = ""; }} />
            </div>

            <div className="space-y-2">
              <label className={labelClass}>Splash Screen</label>
              <div 
                onClick={() => splashInputRef.current?.click()}
                className="aspect-square rounded-2xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-muted/30 transition-all overflow-hidden relative group"
              >
                {uploadingSplash ? (
                  <Loader2 size={24} className="animate-spin text-muted-foreground" />
                ) : splashInput ? (
                  <>
                    <img src={splashInput} className="w-full h-full object-cover" alt="Splash" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <Monitor size={20} className="text-white" />
                    </div>
                  </>
                ) : (
                  <>
                    <Monitor size={20} className="text-muted-foreground" />
                    <span className="text-[9px] font-bold text-muted-foreground">UPLOAD</span>
                  </>
                )}
              </div>
              <input ref={splashInputRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleSplashUpload(f); e.target.value = ""; }} />
            </div>
          </div>

          {/* ── Business Name ──────────────────────────────────────────── */}
          <div className="space-y-1.5">
            <label className={labelClass}>Business Name *</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/50" size={16} />
              <input 
                type="text" 
                placeholder="e.g. Royal Stitches" 
                value={brandForm.name} 
                onChange={e => setBrandForm({...brandForm, name: e.target.value})} 
                className={`${inputClass} pl-12 font-bold`}
              />
            </div>
          </div>

          {/* ── Tagline ────────────────────────────────────────────────── */}
          <div className="space-y-1.5">
            <label className={labelClass}>Tagline (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Tailored for excellence"
              value={brandForm.tagline}
              onChange={e => setBrandForm({...brandForm, tagline: e.target.value})}
              maxLength={60}
              className={`${inputClass} font-medium`}
            />
            <p className="text-[9px] text-muted-foreground ml-1">Shown below your business name on measurement cards</p>
          </div>

          {/* ── Client ID Prefix + Business Phone ───────────────────────── */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className={labelClass}>Client ID Prefix</label>
              <input
                type="text"
                placeholder="e.g. RS"
                value={brandForm.clientIdPrefix}
                onChange={e => setBrandForm({...brandForm, clientIdPrefix: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 5)})}
                maxLength={5}
                className={`${inputClass} font-mono font-bold`}
              />
              <p className="text-[9px] text-muted-foreground ml-1">Prefix for client IDs (default: OT)</p>
            </div>
            <div className="space-y-1.5">
              <label className={labelClass}>Business Phone</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/50" size={16} />
                <input 
                  type="tel" 
                  placeholder="e.g. +2348012345678" 
                  value={brandForm.phone} 
                  onChange={e => setBrandForm({...brandForm, phone: e.target.value.replace(/[^0-9+]/g, "")})}
                  maxLength={20}
                  className={`${inputClass} pl-12 font-bold`}
                />
              </div>
            </div>
          </div>

          {/* ── WhatsApp + Email ────────────────────────────────────────── */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className={labelClass}>WhatsApp Number</label>
              <div className="relative">
                <MessageCircle className="absolute left-4 top-1/2 -translate-y-1/2 text-green-500/70" size={16} />
                <input
                  type="tel"
                  placeholder="e.g. +2348012345678"
                  value={brandForm.whatsapp}
                  onChange={e => setBrandForm({...brandForm, whatsapp: e.target.value.replace(/[^0-9+]/g, "")})}
                  maxLength={20}
                  className={`${inputClass} pl-12 font-bold`}
                />
              </div>
              <p className="text-[9px] text-muted-foreground ml-1">Phone or WhatsApp required</p>
            </div>
            <div className="space-y-1.5">
              <label className={labelClass}>Email (Optional)</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/50" size={16} />
                <input 
                  type="email" 
                  placeholder="business@example.com" 
                  value={brandForm.email} 
                  onChange={e => {
                    setBrandForm({...brandForm, email: e.target.value});
                    if (e.target.value && !isValidEmail(e.target.value)) setEmailError("Enter a valid email address");
                    else setEmailError(null);
                  }}
                  className={`${inputClass} pl-12 font-bold ${emailError ? "border-red-500" : ""}`}
                />
              </div>
              {emailError && <p className="text-[10px] text-red-500 font-semibold ml-1">{emailError}</p>}
            </div>
          </div>

          {/* ── Location Details ────────────────────────────────────────── */}
          <div className="space-y-3">
            <label className={labelClass}>Location Details</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[8px] font-black uppercase tracking-widest text-muted-foreground ml-1">Street / Bus Stop</label>
                <input type="text" placeholder="e.g. 12 Fashion Ave" value={brandForm.street} onChange={e => setBrandForm({...brandForm, street: e.target.value})} className={inputClass} />
              </div>
              <div className="space-y-1.5">
                <label className="text-[8px] font-black uppercase tracking-widest text-muted-foreground ml-1">City *</label>
                <input type="text" placeholder="e.g. Ikeja" value={brandForm.city} onChange={e => setBrandForm({...brandForm, city: e.target.value})} className={inputClass} />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[8px] font-black uppercase tracking-widest text-muted-foreground ml-1">Landmark</label>
              <input type="text" placeholder="e.g. Near City Mall" value={brandForm.landmark} onChange={e => setBrandForm({...brandForm, landmark: e.target.value})} className={inputClass} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[8px] font-black uppercase tracking-widest text-muted-foreground ml-1">State *</label>
                <input type="text" placeholder="e.g. Lagos" value={brandForm.state} onChange={e => setBrandForm({...brandForm, state: e.target.value})} className={inputClass} />
              </div>
              <div className="space-y-1.5">
                <label className="text-[8px] font-black uppercase tracking-widest text-muted-foreground ml-1">Country *</label>
                <input type="text" placeholder="Nigeria" value={brandForm.country} onChange={e => setBrandForm({...brandForm, country: e.target.value})} className={inputClass} />
              </div>
            </div>
          </div>

          {/* ── Social Media ────────────────────────────────────────────── */}
          <div className="space-y-3 pt-2">
            <label className={labelClass}>Social Media</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="relative">
                <Instagram className="absolute left-4 top-1/2 -translate-y-1/2 text-pink-500" size={16} />
                <input type="text" placeholder="Instagram handle" value={brandForm.instagram} onChange={e => setBrandForm({...brandForm, instagram: e.target.value})} className={`${inputClass} pl-12 text-xs`} />
              </div>
              <div className="relative">
                <Facebook className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-600" size={16} />
                <input type="text" placeholder="Facebook page" value={brandForm.facebook} onChange={e => setBrandForm({...brandForm, facebook: e.target.value})} className={`${inputClass} pl-12 text-xs`} />
              </div>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-black dark:text-white">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.84 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/></svg>
                </div>
                <input type="text" placeholder="TikTok handle" value={brandForm.tiktok} onChange={e => setBrandForm({...brandForm, tiktok: e.target.value})} className={`${inputClass} pl-12 text-xs`} />
              </div>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-red-600">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                </div>
                <input type="text" placeholder="YouTube channel" value={brandForm.youtube} onChange={e => setBrandForm({...brandForm, youtube: e.target.value})} className={`${inputClass} pl-12 text-xs`} />
              </div>
            </div>
            <p className="text-[9px] text-muted-foreground ml-1">These handles appear as icons on your measurement cards</p>
          </div>

          {/* ── Brand Colors ────────────────────────────────────────────── */}
          <div className="space-y-4 pt-4 border-t border-border">
            <div className="flex items-center justify-between">
              <label className={labelClass + " flex items-center gap-2"}>
                Brand Colors {isPremium ? <ShieldCheck size={12} className="text-emerald-500" /> : <Crown size={12} className="text-primary" />}
              </label>
              {isPremium && logoInput && (
                <button 
                  onClick={handleExtractFromLogo}
                  disabled={extracting}
                  className="text-[10px] font-bold text-primary flex items-center gap-1 active:scale-95"
                >
                  {extracting ? <Loader2 size={10} className="animate-spin" /> : <Pipette size={10} />}
                  Extract from Logo
                </button>
              )}
            </div>

            <div className="space-y-2">
              {([
                { key: "primaryColor" as const, label: "Primary", value: brandForm.primaryColor },
                { key: "secondaryColor" as const, label: "Secondary", value: brandForm.secondaryColor },
                { key: "accentColor" as const, label: "Accent", value: brandForm.accentColor },
              ]).map(({ key, label, value }) => (
                <div key={key} className="flex items-center gap-3 p-3 rounded-2xl bg-muted/30 border border-border">
                  <div className="w-10 h-10 rounded-xl flex-shrink-0 border border-border/50" style={{ background: value }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold">{label} Color</p>
                    <p className="text-[10px] text-muted-foreground font-mono">{value}</p>
                  </div>
                  <input
                    type="color"
                    disabled={!isPremium}
                    value={value}
                    onChange={e => setBrandForm({ ...brandForm, [key]: e.target.value })}
                    className={`w-9 h-9 rounded-xl border-none bg-transparent flex-shrink-0 ${isPremium ? "cursor-pointer" : "opacity-50 cursor-not-allowed"}`}
                    title={!isPremium ? "Unlock Premium to customize" : `Change ${label} color`}
                  />
                </div>
              ))}
            </div>
            {!isPremium && (
              <p className="text-[9px] text-primary font-bold text-center">Unlock Premium to customize and auto-extract brand colors!</p>
            )}
          </div>

          {/* ── Save Button ─────────────────────────────────────────────── */}
          <button
            onClick={handleSave}
            className="w-full py-4 rounded-2xl text-sm font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl shadow-primary/20 transition-all active:scale-[0.98] bg-primary text-primary-foreground"
          >
            <Save className="w-4 h-4" /> Save Brand Kit
          </button>

        </div>
      </div>
    </div>
  );
}