import { useState, useEffect } from "react";
import { Tag, RefreshCw, Share2, ArrowRight, Banknote, ChevronDown, X } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { useAppStore } from "@/store/useAppStore";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

type Complexity = "simple" | "standard" | "premium" | "luxury";

const COMPLEXITY_MULTIPLIER: Record<Complexity, { min: number; rec: number; prem: number }> = {
  simple:   { min: 1.10, rec: 1.30, prem: 1.55 },
  standard: { min: 1.15, rec: 1.40, prem: 1.70 },
  premium:  { min: 1.20, rec: 1.55, prem: 1.90 },
  luxury:   { min: 1.30, rec: 1.70, prem: 2.20 },
};

const COMPLEXITY_LABELS: Record<Complexity, { label: string; desc: string }> = {
  simple:   { label: "Simple",   desc: "Basic stitching, no embroidery" },
  standard: { label: "Standard", desc: "Regular tailoring work" },
  premium:  { label: "Premium",  desc: "Intricate details, embroidery" },
  luxury:   { label: "Luxury",   desc: "High-end, bespoke craftsmanship" },
};

// ─── Currency Options ──────────────────────────────────────────────────────

const DEFAULT_CURRENCIES = [
  { code: "NGN", symbol: "₦", label: "Nigerian Naira" },
  { code: "USD", symbol: "$", label: "US Dollar" },
  { code: "GBP", symbol: "£", label: "British Pound" },
  { code: "EUR", symbol: "€", label: "Euro" },
  { code: "GHS", symbol: "GH₵", label: "Ghanaian Cedi" },
  { code: "ZAR", symbol: "R", label: "South African Rand" },
  { code: "KES", symbol: "KSh", label: "Kenyan Shilling" },
];

interface CurrencyOption {
  code: string;
  symbol: string;
  label: string;
}

// ─── Garment Presets ───────────────────────────────────────────────────────

const GARMENT_PRESETS: { name: string; hours: number; complexity: Complexity }[] = [
  { name: "Shirt / Polo", hours: 2, complexity: "simple" },
  { name: "Trouser", hours: 2.5, complexity: "simple" },
  { name: "Senator", hours: 4, complexity: "standard" },
  { name: "Kaftan", hours: 5, complexity: "standard" },
  { name: "Suit (2-piece)", hours: 8, complexity: "premium" },
  { name: "Agbada (3-piece)", hours: 14, complexity: "luxury" },
  { name: "Gown (simple)", hours: 5, complexity: "standard" },
  { name: "Gown (evening)", hours: 10, complexity: "premium" },
  { name: "Wedding Dress", hours: 20, complexity: "luxury" },
];

export default function PriceSmartly() {
  const addRecentTool = useAppStore((s) => s.addRecentTool);
  const storeCurrencySymbol = useAppStore((s) => s.currencySymbol);
  const storeCurrencyCode = useAppStore((s) => s.currencyCode);
  const setCurrency = useAppStore((s) => s.setCurrency);
  const incrementUsage = useAppStore((s) => s.incrementUsage);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  useState(() => { addRecentTool("price-smartly"); });

  // ── Currency State ─────────────────────────────────────────────────────
  const [currencies, setCurrencies] = useState<CurrencyOption[]>(() => {
    const saved = localStorage.getItem("custom_currencies");
    return saved ? JSON.parse(saved) : DEFAULT_CURRENCIES;
  });
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const [showCustomCurrency, setShowCustomCurrency] = useState(false);
  const [customSymbol, setCustomSymbol] = useState("");
  const [customCode, setCustomCode] = useState("");
  const [currencyChecked, setCurrencyChecked] = useState(false);

  useEffect(() => {
    if (!currencyChecked && !storeCurrencySymbol) {
      setShowCurrencyPicker(true);
    }
    setCurrencyChecked(true);
  }, [storeCurrencySymbol, currencyChecked]);

  useEffect(() => {
    if (currencies !== DEFAULT_CURRENCIES) {
      localStorage.setItem("custom_currencies", JSON.stringify(currencies));
    }
  }, [currencies]);

  const handleSetCurrency = (code: string, symbol: string) => {
    setCurrency(code, symbol);
    setShowCurrencyPicker(false);
    toast({ title: "Currency set", description: `${symbol} (${code})` });
  };

  const addCustomCurrency = () => {
    const sym = customSymbol.trim();
    const code = customCode.trim().toUpperCase();
    if (!sym || !code) {
      toast({ title: "Fill both fields", description: "Enter symbol and code", variant: "destructive" });
      return;
    }
    const exists = currencies.find(c => c.code === code);
    if (exists) {
      handleSetCurrency(code, sym);
      setShowCustomCurrency(false);
      setCustomSymbol("");
      setCustomCode("");
      return;
    }
    const newCurrency: CurrencyOption = { code, symbol: sym, label: code };
    const updated = [...currencies, newCurrency];
    setCurrencies(updated);
    handleSetCurrency(code, sym);
    setShowCustomCurrency(false);
    setCustomSymbol("");
    setCustomCode("");
  };

  // ── Fixed display symbol logic ─────────────────────────────────────────
  const displaySymbol = (() => {
    if (!storeCurrencySymbol) return "₦";
    // If it's a short symbol (1-2 chars like ₦, $, €, R), use it directly
    if (storeCurrencySymbol.length <= 2) return storeCurrencySymbol;
    // If it's longer (like "KSh"), find the matching symbol
    const found = currencies.find(c => c.symbol === storeCurrencySymbol || c.code === storeCurrencySymbol);
    return found?.symbol || storeCurrencySymbol;
  })();

  // ── Form State ─────────────────────────────────────────────────────────
  const [fabricCost, setFabricCost] = useState("");
  const [accessoriesCost, setAccessoriesCost] = useState("");
  const [laborHours, setLaborHours] = useState("");
  const [hourlyRate, setHourlyRate] = useState("2000");
  const [complexity, setComplexity] = useState<Complexity>("standard");
  const [selectedPreset, setSelectedPreset] = useState<string>("");
  const [result, setResult] = useState<{ totalCost: number; min: number; rec: number; prem: number } | null>(null);

  const formatPrice = (n: number) => {
    return displaySymbol + Math.round(n).toLocaleString("en-NG");
  };

  const applyPreset = (preset: { name: string; hours: number; complexity: Complexity }) => {
    setLaborHours(String(preset.hours));
    setComplexity(preset.complexity);
    setSelectedPreset(preset.name);
    setResult(null);
  };

  const calculate = async () => {
    const fabric = parseFloat(fabricCost) || 0;
    const acc    = parseFloat(accessoriesCost) || 0;
    const hours  = parseFloat(laborHours) || 0;
    const rate   = parseFloat(hourlyRate) || 0;
    const totalCost = fabric + acc + hours * rate;
    if (totalCost <= 0) return;
    const mults = COMPLEXITY_MULTIPLIER[complexity];
    setResult({
      totalCost,
      min:  totalCost * mults.min,
      rec:  totalCost * mults.rec,
      prem: totalCost * mults.prem,
    });
    await incrementUsage();
  };

  const shareResult = () => {
    if (!result) return;
    const text = `🧵 *Price Estimate*\n\n💰 Base Cost: ${formatPrice(result.totalCost)}\n💵 Budget: ${formatPrice(result.min)}\n⭐ My Price: ${formatPrice(result.rec)}\n👑 Premium: ${formatPrice(result.prem)}\n\nComplexity: ${COMPLEXITY_LABELS[complexity].label}\n\n— Sent via OneTailor`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const inp = "w-full text-sm rounded-xl px-3 py-2.5 outline-none border border-border bg-background text-foreground";

  return (
    <div className="max-w-lg mx-auto">
      <PageHeader 
        title="Price Smartly" 
        subtitle="Quick price check for any garment" 
        backPath="/all-tools?cat=pricing"
        backLabel="Business Tools"
      />
      <div className="px-4 py-5 space-y-4">

        {/* ── Currency Selector (first-time prompt) ─────────────────────── */}
        {showCurrencyPicker && !storeCurrencySymbol && (
          <div className="bg-card border border-border rounded-2xl p-4 space-y-3 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center gap-2">
              <Banknote size={16} className="text-primary" />
              <p className="text-xs font-bold text-foreground">Select your currency to get started</p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {currencies.map((c) => (
                <button
                  key={c.code}
                  onClick={() => handleSetCurrency(c.code, c.symbol)}
                  className="py-3 px-2 rounded-xl text-xs font-bold border border-border hover:border-primary/40 hover:bg-primary/5 transition-all text-center"
                >
                  <span className="text-base block">{c.symbol}</span>
                  <span className="text-[10px] text-muted-foreground">{c.code}</span>
                </button>
              ))}
            </div>
            <button
              onClick={() => { setShowCurrencyPicker(false); setShowCustomCurrency(true); }}
              className="w-full py-2.5 rounded-xl border-2 border-dashed border-border text-xs font-bold text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all"
            >
              + Other Currency
            </button>
          </div>
        )}

        {/* ── Custom Currency Modal ─────────────────────────────────────── */}
        {showCustomCurrency && (
          <div className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-sm flex items-center justify-center p-5 animate-in fade-in duration-200">
            <div className="bg-card w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl border border-border animate-in zoom-in-95 duration-200">
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black">Add Custom Currency</h3>
                  <button onClick={() => { setShowCustomCurrency(false); setCustomSymbol(""); setCustomCode(""); }} className="w-8 h-8 flex items-center justify-center rounded-full bg-muted/50"><X size={14} /></button>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Currency Symbol</label>
                    <input value={customSymbol} onChange={e => setCustomSymbol(e.target.value)} placeholder="e.g. ₹, ¥, د.إ" className={inp} autoFocus />
                    <p className="text-[9px] text-muted-foreground mt-1">What you see in prices: {customSymbol || "?"}1,000</p>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Currency Code</label>
                    <input value={customCode} onChange={e => setCustomCode(e.target.value.toUpperCase())} placeholder="e.g. INR, JPY, AED" className={inp} maxLength={5} />
                    <p className="text-[9px] text-muted-foreground mt-1">3-5 letter international code</p>
                  </div>
                </div>
                <button onClick={addCustomCurrency} disabled={!customSymbol.trim() || !customCode.trim()}
                  className="w-full py-3.5 bg-primary text-primary-foreground rounded-2xl font-bold text-sm active:scale-[0.98] transition-all disabled:opacity-50">
                  Set Currency
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Currency indicator ────────────────────────────────────────── */}
        <div className="flex items-center justify-end">
          <button
            onClick={() => setShowCurrencyPicker(!showCurrencyPicker)}
            className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground hover:text-foreground transition-colors"
          >
            <Banknote size={11} />
            <span className="text-sm">{displaySymbol}</span>
            <span className="text-[10px]">{storeCurrencyCode || ""}</span>
            <ChevronDown size={10} className={showCurrencyPicker ? "rotate-180" : ""} />
          </button>
        </div>

        {/* Collapsed currency picker */}
        {showCurrencyPicker && storeCurrencySymbol && (
          <div className="bg-card border border-border rounded-2xl p-4 space-y-3 shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-muted-foreground">Change Currency</p>
              <button onClick={() => setShowCurrencyPicker(false)} className="text-[10px] text-muted-foreground">✕</button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {currencies.map((c) => (
                <button key={c.code} onClick={() => handleSetCurrency(c.code, c.symbol)}
                  className={`py-3 px-2 rounded-xl text-xs font-bold border transition-all text-center ${storeCurrencySymbol === c.symbol ? "bg-primary/10 border-primary text-primary" : "border-border hover:border-primary/40"}`}>
                  <span className="text-base block">{c.symbol}</span>
                  <span className="text-[10px] text-muted-foreground">{c.code}</span>
                </button>
              ))}
            </div>
            <button onClick={() => { setShowCurrencyPicker(false); setShowCustomCurrency(true); }}
              className="w-full py-2.5 rounded-xl border-2 border-dashed border-border text-xs font-bold text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all">
              + Other Currency
            </button>
          </div>
        )}

        {/* ── Quick garment presets ──────────────────────────────────────── */}
        <div className="bg-card border border-border rounded-2xl p-4 space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Quick Garment</p>
            <span className="text-[9px] text-muted-foreground">Tap to pre-fill</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {GARMENT_PRESETS.map((preset) => (
              <button key={preset.name} onClick={() => applyPreset(preset)}
                className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${selectedPreset === preset.name ? "bg-primary/10 border-primary text-primary" : "bg-muted/30 border-border text-muted-foreground hover:border-primary/30"}`}>
                {preset.name}
              </button>
            ))}
          </div>
        </div>

        {/* ── Inputs ─────────────────────────────────────────────────────── */}
        <div className="bg-card border border-border rounded-2xl p-4 space-y-4 shadow-sm">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1.5 block">Fabric Cost</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-bold w-5 text-center">{displaySymbol}</span>
                <input type="number" min={0} placeholder="e.g. 8000" value={fabricCost}
                  onChange={(e) => { setFabricCost(e.target.value); setResult(null); setSelectedPreset(""); }} className={`${inp} pl-9`} />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1.5 block">Accessories</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-bold w-5 text-center">{displaySymbol}</span>
                <input type="number" min={0} placeholder="e.g. 1500" value={accessoriesCost}
                  onChange={(e) => { setAccessoriesCost(e.target.value); setResult(null); setSelectedPreset(""); }} className={`${inp} pl-9`} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1.5 block">Labor Hours</label>
              <input type="number" min={0} step={0.5} placeholder="e.g. 6" value={laborHours}
                onChange={(e) => { setLaborHours(e.target.value); setResult(null); setSelectedPreset(""); }} className={inp} />
            </div>
            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1.5 block">Hourly Rate</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-bold w-5 text-center">{displaySymbol}</span>
                <input type="number" min={0} placeholder="2000" value={hourlyRate}
                  onChange={(e) => { setHourlyRate(e.target.value); setResult(null); setSelectedPreset(""); }} className={`${inp} pl-9`} />
              </div>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-muted-foreground uppercase mb-2 block">Work Complexity</label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.entries(COMPLEXITY_LABELS) as [Complexity, { label: string; desc: string }][]).map(([c, { label, desc }]) => (
                <button key={c} onClick={() => { setComplexity(c); setResult(null); }}
                  className={`text-left p-3 rounded-xl border transition-all active:scale-95 ${complexity === c ? "" : "border-border bg-transparent"}`}
                  style={complexity === c ? { background: "rgba(212,160,32,0.1)", borderColor: "rgba(212,160,32,0.4)" } : undefined}>
                  <p className="text-xs font-bold" style={{ color: complexity === c ? "hsl(43,82%,60%)" : "hsl(43,25%,70%)" }}>{label}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{desc}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Calculate / Result ─────────────────────────────────────────── */}
        {!result ? (
          <button onClick={calculate} disabled={!fabricCost && !laborHours}
            className="w-full py-4 bg-primary text-primary-foreground font-bold rounded-xl active:scale-[0.98] transition-all disabled:opacity-50">
            Calculate Price
          </button>
        ) : (
          <>
            <div className="bg-card border border-primary/20 rounded-2xl p-5 space-y-4 shadow-lg shadow-primary/5 animate-in fade-in zoom-in duration-300">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Base Cost</span>
                  <p className="text-2xl font-black text-foreground">{formatPrice(result.totalCost)}</p>
                </div>
                <div className="text-right">
                  <span className="text-[9px] text-muted-foreground block">{COMPLEXITY_LABELS[complexity].label}</span>
                  <span className="text-[10px] font-bold text-primary">
                    {laborHours || 0} hrs × {displaySymbol}{parseFloat(hourlyRate) || 0}/hr
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="p-3.5 rounded-xl bg-muted/20 border border-border">
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-[10px] font-black uppercase text-muted-foreground">💰 Budget</span>
                    <span className="text-sm font-bold text-foreground">{formatPrice(result.min)}</span>
                  </div>
                  <p className="text-[9px] text-muted-foreground">Family discount, quick turnaround, simple jobs.</p>
                </div>

                <div className="p-4 rounded-xl relative overflow-hidden" style={{ background: "rgba(212,160,32,0.08)", border: "1px solid rgba(212,160,32,0.3)" }}>
                  <div className="absolute top-0 right-0 bg-primary text-[8px] font-black px-2 py-0.5 rounded-bl-lg uppercase text-primary-foreground">⭐ My Price</div>
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-[10px] font-black uppercase text-primary">Recommended</span>
                    <span className="text-xl font-black text-foreground">{formatPrice(result.rec)}</span>
                  </div>
                  <p className="text-[9px] text-muted-foreground">Best balance for quality work and business growth. <strong className="text-primary">Charge this.</strong></p>
                </div>

                <div className="p-3.5 rounded-xl bg-muted/20 border border-border">
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-[10px] font-black uppercase text-muted-foreground">👑 Premium</span>
                    <span className="text-sm font-bold text-foreground">{formatPrice(result.prem)}</span>
                  </div>
                  <p className="text-[9px] text-muted-foreground">For high-end clients, special occasions, bespoke work.</p>
                </div>
              </div>

              <div className="px-3 py-2.5 rounded-xl bg-muted/30 text-[10px] text-muted-foreground leading-relaxed">
                <strong className="text-foreground">Why {formatPrice(result.rec)}?</strong>{" "}
                {displaySymbol}{Math.round(result.totalCost).toLocaleString()} base cost × {COMPLEXITY_MULTIPLIER[complexity].rec.toFixed(2)} ({COMPLEXITY_LABELS[complexity].label.toLowerCase()} markup) = your fair price.
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button onClick={shareResult}
                  className="py-3 rounded-xl bg-green-500/10 text-green-600 font-bold text-xs flex items-center justify-center gap-2 hover:bg-green-500/20 transition-colors">
                  <Share2 size={14} /> Share
                </button>
                <button onClick={() => setResult(null)}
                  className="py-3 rounded-xl border border-border text-muted-foreground font-bold text-xs flex items-center justify-center gap-2 hover:text-foreground transition-colors">
                  <RefreshCw size={14} /> Reset
                </button>
              </div>
            </div>

            <button
              onClick={() => setLocation("/fabric-cost")}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold text-muted-foreground hover:text-primary transition-colors"
            >
              Need a full breakdown? Open Quote Builder <ArrowRight size={12} />
            </button>
          </>
        )}

        {/* ── Tip ────────────────────────────────────────────────────────── */}
        <div className="rounded-xl px-4 py-3" style={{ background: "rgba(212,160,32,0.04)", border: "1px solid rgba(212,160,32,0.1)" }}>
          <p className="text-[10px] font-bold uppercase mb-1" style={{ color: "hsl(43,82%,60%)" }}>💡 Pricing Tip</p>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            These are industry-standard estimates. Adjust based on your location, competition, and brand reputation. Your skill is worth it.
          </p>
        </div>
      </div>
    </div>
  );
}