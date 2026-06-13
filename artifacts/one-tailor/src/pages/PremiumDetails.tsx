import { useState, useEffect } from "react";
import {
  Crown, Loader2, Check, Users, Palette, Zap, Video, ShieldCheck, Database,
  LogIn, ChevronRight, Star, Smartphone, ChevronDown, ChevronUp, Lock, Infinity,
  ArrowRight, TrendingUp, BadgeCheck, Sparkles
} from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

const PREMIUM_FEATURES = [
  { 
    title: "Unlimited Client Database",  
    desc: "Store unlimited customers and their complete measurement history — no cap, ever.",
    icon: Users,
    highlight: true,
  },
  { 
    title: "Cloud Backup & Restore",     
    desc: "Export all your customers, measurements, and notes as a backup file you can restore anytime.",
    icon: Database,
    highlight: true,
  },
  { 
    title: "Multi-Device Access",        
    desc: "Log in with your email on any phone or tablet and your full data is always synced and waiting.",
    icon: Smartphone,
    highlight: true,
  },
  { 
    title: "Custom Measurement Templates", 
    desc: "Create and save your own measurement templates for any garment type your workshop handles.",
    icon: Zap,
    highlight: false,
  },
  { 
    title: "Professional BrandKit",      
    desc: "Set your business logo, colours, and name — every receipt and card reflects your brand.",
    icon: Palette,
    highlight: false,
  },
  { 
    title: "Push Notification Alerts",   
    desc: "Receive important updates and announcements directly on your device even when the app is closed.",
    icon: ShieldCheck,
    highlight: false,
  },
  { 
    title: "Priority Support",           
    desc: "Get dedicated help from the OneTailor team whenever you need assistance or have questions.",
    icon: LogIn,
    highlight: false,
  },
];

const FREE_VS_PREMIUM = [
  { feature: "Client Records", free: "Limited", premium: "Unlimited", icon: Users },
  { feature: "Measurement History", free: "Recent only", premium: "Full history", icon: Database },
  { feature: "Message Templates", free: "5 templates", premium: "Unlimited", icon: Zap },
  { feature: "Bulk Messaging", free: "Limited batches", premium: "Send to all", icon: Sparkles },
  { feature: "Customer Groups", free: "1 group", premium: "Unlimited", icon: Users },
  { feature: "Drafts", free: "2 drafts", premium: "Unlimited", icon: ShieldCheck },
  { feature: "Card Styles", free: "1 style", premium: "7 styles", icon: Palette },
  { feature: "Brand Colors", free: "Default only", premium: "Custom colors", icon: Palette },
  { feature: "Export Data", free: "❌", premium: "✅", icon: TrendingUp },
  { feature: "Message History", free: "20 records", premium: "Full history", icon: Database },
];

const FAQS = [
  {
    q: "Is this really a one-time payment?",
    a: "Yes! You pay once and get lifetime access to all Premium features. No monthly subscriptions, no hidden fees.",
  },
  {
    q: "Can I switch devices later?",
    a: "Absolutely. Just log in with your email on any new device and your Premium access follows you. Your device count determines how many can be active simultaneously.",
  },
  {
    q: "What if I change my phone?",
    a: "Simply install OneTailor on your new phone, log in with your email, and everything syncs. Your data and Premium status are tied to your account, not your device.",
  },
  {
    q: "How do I get support?",
    a: "Premium users get priority support. You can reach us via WhatsApp from the settings page, or email us. We typically respond within a few hours.",
  },
  {
    q: "Is my data safe?",
    a: "Yes. Your data is stored securely and can be exported anytime. We use encryption and industry-standard security practices.",
  },
];

interface PaymentSettings {
  price: number;
  price2Device?: number;
  price3Device?: number;
  price5Device?: number;
  currencyCode?: string;
  currencySymbol?: string;
  isPaystackEnabled: boolean;
  isManualEnabled: boolean;
}

const DEVICE_TIERS = [
  { count: 1, label: "1 Device",   sub: "Just you" },
  { count: 2, label: "2 Devices",  sub: "You + 1 more" },
  { count: 3, label: "3 Devices",  sub: "Small team" },
  { count: 5, label: "5 Devices",  sub: "Full workshop", badge: "BEST" },
];

export default function PremiumDetails() {
  const account              = useAppStore((s) => s.account);
  const isPremium            = useAppStore((s) => s.isPremium);
  const selectedDeviceCount  = useAppStore((s) => s.selectedDeviceCount);
  const setSelectedDeviceCount = useAppStore((s) => s.setSelectedDeviceCount);

  const { toast }    = useToast();
  const [, navigate] = useLocation();

  const [settings, setSettings] = useState<PaymentSettings | null>(null);
  const [loading, setLoading]   = useState(true);
  const [openFaq, setOpenFaq]   = useState<number | null>(null);
  const [priceChanging, setPriceChanging] = useState(false);

  useEffect(() => {
    if (isPremium) { navigate("/premium-activated"); return; }
    fetch("/api/payment-info")
      .then(r => r.json())
      .then(d => setSettings(d))
      .catch(() => toast({ title: "Error", description: "Could not load payment info.", variant: "destructive" }))
      .finally(() => setLoading(false));
  }, [isPremium]);

  const priceForCount = (count: number): number => {
    if (!settings) return 0;
    if (count === 2) return settings.price2Device || settings.price;
    if (count === 3) return settings.price3Device || settings.price;
    if (count === 5) return settings.price5Device || settings.price;
    return settings.price;
  };

  const formatPrice = (p: number) =>
    new Intl.NumberFormat("en-NG", { style: "currency", currency: settings?.currencyCode || "NGN", maximumFractionDigits: 0 })
      .format(p)
      .replace(settings?.currencyCode || "NGN", settings?.currencySymbol || "₦");

  const effectivePrice = priceForCount(selectedDeviceCount);

  const handleDeviceSelect = (count: number) => {
    if (count !== selectedDeviceCount) {
      setPriceChanging(true);
      setSelectedDeviceCount(count);
      setTimeout(() => setPriceChanging(false), 300);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading premium details...</p>
      </div>
    );
  }

  const displayName = account?.businessName || account?.email || "";

  return (
    <div className="max-w-xl mx-auto px-4 pb-24 pt-6 space-y-6">

      {/* Hero Banner */}
      <div className="relative overflow-hidden px-6 py-8 rounded-3xl bg-slate-950 border border-primary/20 shadow-2xl">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
        <div className="relative text-center space-y-3">
          <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto border border-primary/40">
            <Crown size={32} className="text-primary" />
          </div>
          <div className="flex items-center justify-center gap-1 text-primary/80">
            {[...Array(5)].map((_, i) => <Star key={i} size={12} fill="currentColor" />)}
          </div>
          <h1 className="text-2xl font-bold text-white">Unlock Premium</h1>
          <p className="text-slate-400 text-sm">Professional tools for serious tailors.</p>
          <div className={`text-4xl font-black text-primary transition-all duration-300 ${priceChanging ? "scale-110" : "scale-100"}`}>
            {settings ? formatPrice(effectivePrice) : "₦15,000"}
          </div>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
            One-time payment · Lifetime access · No subscriptions
          </p>
        </div>
      </div>

      {/* Social Proof */}
      <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <BadgeCheck size={14} className="text-emerald-500" />
          <span>500+ Tailors</span>
        </div>
        <div className="flex items-center gap-1.5">
          <TrendingUp size={14} className="text-primary" />
          <span>Trusted</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Sparkles size={14} className="text-amber-500" />
          <span>Lifetime</span>
        </div>
      </div>

      {/* Device Tier Selector */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Smartphone size={14} className="text-muted-foreground" />
          <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Choose Your Device Plan</p>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {DEVICE_TIERS.map(({ count, label, sub, badge }) => {
            const price    = priceForCount(count);
            const selected = selectedDeviceCount === count;
            return (
              <button
                key={count}
                onClick={() => handleDeviceSelect(count)}
                className={`relative flex flex-col items-center justify-center gap-1 py-4 px-1 rounded-2xl border-2 transition-all active:scale-95 text-center ${
                  selected
                    ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/25"
                    : "bg-card border-border hover:border-primary/40"
                }`}
              >
                {badge && (
                  <span className={`absolute -top-2 right-1 text-[8px] font-black px-1.5 py-0.5 rounded-full ${selected ? "bg-white text-primary" : "bg-amber-500/15 text-amber-600 border border-amber-500/20"}`}>
                    {badge}
                  </span>
                )}
                <span className="text-[10px] font-black">{label}</span>
                <span className={`text-[9px] ${selected ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{sub}</span>
                <span className={`text-[10px] font-bold mt-0.5 ${selected ? "text-primary-foreground" : "text-primary"}`}>
                  {settings ? formatPrice(price) : "—"}
                </span>
                {selected && <Check size={12} className="text-primary-foreground mt-0.5" />}
              </button>
            );
          })}
        </div>
        <p className="text-[10px] text-muted-foreground text-center">
          {selectedDeviceCount > 1
            ? `${selectedDeviceCount} devices share one license — log in with your email on each.`
            : "Use premium on 1 device. Upgrade anytime to add more."}
        </p>
      </div>

      {/* CTA */}
      <div className="space-y-3 pt-2">
        {!account ? (
          <>
            <div className="p-4 bg-primary/5 border border-primary/15 rounded-2xl text-center space-y-2">
              <p className="text-sm font-semibold">Create a free account to proceed</p>
              <p className="text-xs text-muted-foreground">Takes under 2 minutes. Your account lets you restore access on any device.</p>
            </div>
            <button
              onClick={() => navigate("/pre-unlock")}
              className="w-full py-4 bg-primary text-primary-foreground rounded-2xl font-bold text-base shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
            >
              Get Started — Create Account <ChevronRight size={18} />
            </button>
            <button
              onClick={() => navigate("/account-login")}
              className="w-full py-2 text-sm font-semibold text-muted-foreground flex items-center justify-center gap-2"
            >
              <LogIn size={14} /> Already have an account? Login
            </button>
          </>
        ) : (
          <>
            <div className="flex items-center justify-center gap-1.5 bg-emerald-500/10 text-emerald-500 text-xs font-bold px-3 py-1.5 rounded-full border border-emerald-500/20 w-fit mx-auto">
              <Check size={12} /> {displayName ? `Logged in as: ${displayName}` : `Logged in as: ${account.email}`}
            </div>
            {!settings?.isPaystackEnabled && !settings?.isManualEnabled ? (
              <div className="p-5 text-center text-sm text-muted-foreground bg-muted/20 rounded-3xl border border-border">
                Payment methods are currently unavailable. Please check back soon.
              </div>
            ) : (
              <button
                onClick={() => navigate("/payment-method")}
                className="w-full py-5 bg-primary text-primary-foreground rounded-2xl font-bold text-lg shadow-xl shadow-primary/25 flex items-center justify-center gap-3 active:scale-[0.98] transition-all"
              >
                <Crown size={22} />
                Choose Payment Method
                <ChevronRight size={20} />
              </button>
            )}
            <p className="text-[10px] text-center text-muted-foreground">
              Secure · One-time · No hidden charges
            </p>
          </>
        )}
      </div>

      {/* Trust Badges */}
      <div className="flex items-center justify-center gap-4 text-[9px] text-muted-foreground font-bold">
        <span className="flex items-center gap-1"><BadgeCheck size={11} className="text-emerald-500" /> SSL Encrypted</span>
        <span className="flex items-center gap-1"><ShieldCheck size={11} className="text-primary" /> Secure Payment</span>
        <span className="flex items-center gap-1"><Zap size={11} className="text-amber-500" /> Instant Activation</span>
      </div>

      {/* Features */}
      <div className="space-y-2">
        <p className="text-xs font-black uppercase tracking-widest text-muted-foreground px-1 mb-3">What you get</p>
        {PREMIUM_FEATURES.map((f, i) => (
          <div 
            key={i} 
            className={`flex items-start gap-4 p-4 rounded-2xl border transition-colors ${
              f.highlight 
                ? "bg-primary/5 border-primary/15" 
                : "bg-card border-border hover:border-primary/30"
            }`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${f.highlight ? "bg-primary/15 text-primary" : "bg-primary/10 text-primary"}`}>
              <f.icon size={20} />
            </div>
            <div className="flex-1 text-left">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold">{f.title}</h3>
                {f.highlight && (
                  <span className="text-[8px] font-black px-1.5 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30 uppercase">
                    Essential
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{f.desc}</p>
            </div>
            <Check size={15} className="text-emerald-500 shrink-0 mt-1 ml-auto" />
          </div>
        ))}
      </div>

      {/* Free vs Premium Comparison */}
      <div className="space-y-3">
        <p className="text-xs font-black uppercase tracking-widest text-muted-foreground px-1">Free vs Premium</p>
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-[1fr_80px_80px] gap-2 px-4 py-3 bg-muted/30 border-b border-border">
            <span className="text-[10px] font-bold text-muted-foreground">Feature</span>
            <span className="text-[10px] font-bold text-muted-foreground text-center">Free</span>
            <span className="text-[10px] font-bold text-primary text-center flex items-center justify-center gap-1">
              <Crown size={9} /> Premium
            </span>
          </div>
          {/* Rows */}
          <div className="divide-y divide-border">
            {FREE_VS_PREMIUM.map((row, i) => (
              <div key={i} className="grid grid-cols-[1fr_80px_80px] gap-2 px-4 py-3 items-center">
                <div className="flex items-center gap-2">
                  <row.icon size={11} className="text-muted-foreground shrink-0" />
                  <span className="text-[10px] font-medium text-foreground">{row.feature}</span>
                </div>
                <span className="text-[10px] text-muted-foreground text-center">{row.free}</span>
                <span className="text-[10px] font-bold text-primary text-center flex items-center justify-center gap-1">
                  <Infinity size={10} /> {row.premium === "Unlimited" ? "" : row.premium}
                  {row.premium === "Unlimited" && <span className="text-[9px]">Unlimited</span>}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="space-y-3">
        <p className="text-xs font-black uppercase tracking-widest text-muted-foreground px-1">Frequently Asked Questions</p>
        <div className="space-y-2">
          {FAQS.map((faq, i) => (
            <div key={i} className="bg-card border border-border rounded-2xl overflow-hidden">
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between px-4 py-3.5 text-left"
              >
                <span className="text-sm font-bold pr-4">{faq.q}</span>
                {openFaq === i ? <ChevronUp size={16} className="text-muted-foreground shrink-0" /> : <ChevronDown size={16} className="text-muted-foreground shrink-0" />}
              </button>
              {openFaq === i && (
                <div className="px-4 pb-4 animate-in fade-in slide-in-from-top-2 duration-200">
                  <p className="text-xs text-muted-foreground leading-relaxed">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Money-Back / Guarantee */}
      <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 text-center space-y-2">
        <BadgeCheck size={20} className="text-primary mx-auto" />
        <p className="text-xs font-bold text-primary">30-Day Satisfaction Guarantee</p>
        <p className="text-[10px] text-muted-foreground">Not satisfied? Contact us within 30 days for a full refund. No questions asked.</p>
      </div>

    </div>
  );
}