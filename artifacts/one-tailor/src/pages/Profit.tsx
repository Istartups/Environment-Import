import { useState, useCallback, useEffect } from "react";
import { History, RotateCcw, Share2, Banknote, ChevronDown, X, ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { PremiumBadge, PremiumLockedOverlay } from "@/components/shared/PremiumBadge";
import { useAppStore } from "@/store/useAppStore";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

const PRESETS = [10, 20, 30, 50];
const COST_PRESETS = [5000, 10000, 15000, 20000, 25000, 50000];

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

function formatCurrency(n: number): string {
  return new Intl.NumberFormat("en-NG", { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
}

export default function Profit() {
  const [cost, setCost] = useState("");
  const [profitPct, setProfitPct] = useState<number | null>(null);
  const [customPct, setCustomPct] = useState("");
  const isPremium = useAppStore((s) => s.isPremium);
  const storeCurrencySymbol = useAppStore((s) => s.currencySymbol);
  const storeCurrencyCode = useAppStore((s) => s.currencyCode);
  const setCurrency = useAppStore((s) => s.setCurrency);
  const calculationHistory = useAppStore((s) => s.calculationHistory);
  const addCalculationHistory = useAppStore((s) => s.addCalculationHistory);
  const incrementUsage = useAppStore((s) => s.incrementUsage);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

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

  const displaySymbol = (() => {
    if (!storeCurrencySymbol) return "₦";
    if (storeCurrencySymbol.length <= 2) return storeCurrencySymbol;
    const found = currencies.find(c => c.symbol === storeCurrencySymbol || c.code === storeCurrencySymbol);
    return found?.symbol || storeCurrencySymbol;
  })();

  const activePct = profitPct ?? (customPct ? parseFloat(customPct) : null);
  const costNum = parseFloat(cost) || 0;
  const profitAmount = activePct !== null ? (costNum * activePct) / 100 : null;
  const sellingPrice = profitAmount !== null ? costNum + profitAmount : null;

  const handleSave = useCallback(async () => {
    if (sellingPrice === null || !cost || activePct === null) return;
    addCalculationHistory({
      cost: costNum,
      profit: activePct,
      selling: sellingPrice,
      date: new Date().toISOString(),
    });
    await incrementUsage();
    toast({ title: "Saved!", description: "Calculation added to history." });
  }, [sellingPrice, cost, costNum, activePct, addCalculationHistory, toast, incrementUsage]);

  const handleReset = () => {
    setCost("");
    setProfitPct(null);
    setCustomPct("");
  };

  const shareResult = () => {
    if (sellingPrice === null || activePct === null) return;
    const text = `💰 *Profit Calculation*\n\n📦 Cost: ${displaySymbol}${formatCurrency(costNum)}\n📈 Margin: ${activePct}%\n💵 Profit: ${displaySymbol}${formatCurrency(profitAmount!)}\n\n💲 *Selling Price: ${displaySymbol}${formatCurrency(sellingPrice)}*\n\n— Calculated on OneTailor`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const loadFromHistory = (item: { cost: number; profit: number; selling: number; date: string }) => {
    setCost(String(item.cost));
    setProfitPct(item.profit);
    setCustomPct("");
    toast({ title: "Loaded", description: `Cost: ${displaySymbol}${formatCurrency(item.cost)} at ${item.profit}%` });
  };

  const inp = "w-full text-sm rounded-xl px-3 py-2.5 outline-none border border-border bg-background text-foreground";

  return (
    <div className="max-w-lg mx-auto">
      <PageHeader
        title="Profit Calculator"
        subtitle="Avoid underpricing your work"
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

        {/* Cost input */}
        <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">Cost Price</label>
          <div className="flex items-center gap-2 bg-muted/50 rounded-xl px-4 py-3 border border-border focus-within:ring-2 focus-within:ring-primary">
            <span className="text-xl font-bold text-muted-foreground">{displaySymbol}</span>
            <input
              type="number"
              inputMode="numeric"
              placeholder="0"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              className="flex-1 bg-transparent text-2xl font-bold text-foreground outline-none"
              data-testid="input-cost"
            />
          </div>
          {/* Quick cost presets */}
          <div className="flex flex-wrap gap-1.5">
            {COST_PRESETS.map((preset) => (
              <button
                key={preset}
                onClick={() => setCost(String(preset))}
                className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${cost === String(preset) ? "bg-primary/10 border-primary text-primary" : "bg-muted/30 border-border text-muted-foreground hover:border-primary/30"}`}
              >
                {displaySymbol}{formatCurrency(preset)}
              </button>
            ))}
          </div>
        </div>

        {/* Profit % presets */}
        <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">Profit Margin</label>
          <div className="grid grid-cols-4 gap-2">
            {PRESETS.map((pct) => (
              <button
                key={pct}
                onClick={() => { setProfitPct(pct); setCustomPct(""); }}
                className={`py-3.5 rounded-xl font-bold text-sm transition-all active:scale-95 ${
                  profitPct === pct
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "bg-muted/50 text-foreground border border-border hover:bg-muted"
                }`}
                data-testid={`button-pct-${pct}`}
              >
                {pct}%
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground shrink-0">Custom:</span>
            <div className="flex-1 flex items-center gap-1 bg-muted/50 rounded-xl px-3 py-2 border border-border focus-within:ring-2 focus-within:ring-primary">
              <input
                type="number"
                inputMode="numeric"
                placeholder="e.g. 40"
                value={customPct}
                onChange={(e) => { setCustomPct(e.target.value); setProfitPct(null); }}
                className="flex-1 bg-transparent text-sm font-semibold text-foreground outline-none"
                data-testid="input-custom-pct"
              />
              <span className="text-sm text-muted-foreground">%</span>
            </div>
          </div>
        </div>

        {/* Result */}
        {sellingPrice !== null && costNum > 0 && (
          <div className="rounded-2xl p-5 space-y-3 animate-in fade-in zoom-in duration-300" style={{ background: "linear-gradient(135deg, hsl(43,82%,50%), hsl(43,90%,62%))", color: "hsl(218,50%,8%)" }}>
            <p className="text-sm font-semibold opacity-70 uppercase tracking-wider">Result</p>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-xs opacity-60">Selling Price</p>
                <p className="text-4xl font-extrabold tracking-tight">{displaySymbol}{formatCurrency(sellingPrice)}</p>
              </div>
              <div className="text-right">
                <p className="text-xs opacity-60">Profit</p>
                <p className="text-xl font-bold">+{displaySymbol}{formatCurrency(profitAmount!)}</p>
              </div>
            </div>
            <div className="border-t border-black/10 pt-3 flex justify-between text-sm">
              <span className="opacity-70">Cost: {displaySymbol}{formatCurrency(costNum)}</span>
              <span className="font-bold">{activePct}% markup</span>
            </div>
          </div>
        )}

        {sellingPrice !== null && (
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleSave}
              className="py-3.5 bg-primary text-primary-foreground font-bold text-sm rounded-xl active:scale-[0.98] transition-all"
              data-testid="button-save-calculation"
            >
              Save
            </button>
            <button
              onClick={shareResult}
              className="py-3.5 bg-green-500/10 border border-green-500/30 text-green-600 font-bold text-sm rounded-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <Share2 size={15} /> Share
            </button>
          </div>
        )}

        {/* History (Premium) */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="px-4 py-3 flex items-center justify-between border-b border-border">
            <div className="flex items-center gap-2">
              <History size={16} className="text-muted-foreground" />
              <span className="text-sm font-bold text-foreground">Recent Calculations</span>
            </div>
            {!isPremium && <PremiumBadge />}
          </div>

          {isPremium ? (
            <div className="divide-y divide-border max-h-56 overflow-y-auto">
              {calculationHistory.length === 0 ? (
                <div className="py-10 text-center text-xs text-muted-foreground">
                  No saved history yet
                </div>
              ) : (
                [...calculationHistory].reverse().map((h, i) => (
                  <button
                    key={i}
                    onClick={() => loadFromHistory(h)}
                    className="w-full px-4 py-3 flex justify-between items-center hover:bg-muted/30 transition-colors text-left"
                  >
                    <div>
                      <p className="text-xs font-bold text-foreground">{displaySymbol}{formatCurrency(h.selling)}</p>
                      <p className="text-[10px] text-muted-foreground">{h.profit}% profit from {displaySymbol}{formatCurrency(h.cost)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] text-muted-foreground">{new Date(h.date).toLocaleDateString()}</span>
                      <ArrowRight size={12} className="text-muted-foreground/40" />
                    </div>
                  </button>
                ))
              )}
            </div>
          ) : (
            <PremiumLockedOverlay onUnlock={() => setLocation("/pre-unlock")}>
              <div className="py-10 text-center space-y-2 opacity-30">
                <History size={24} className="mx-auto text-muted-foreground" />
                <p className="text-xs font-medium">Calculation history is a Premium feature</p>
              </div>
            </PremiumLockedOverlay>
          )}
        </div>

        {/* Link to Quote Builder */}
        <button
          onClick={() => setLocation("/fabric-cost")}
          className="w-full flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold text-muted-foreground hover:text-primary transition-colors"
        >
          Need a full breakdown? Open Quote Builder <ArrowRight size={12} />
        </button>
      </div>
    </div>
  );
}