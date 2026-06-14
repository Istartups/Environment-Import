import { useState, useCallback, useEffect } from "react";
import { Plus, Trash2, Save, FileText, Crown, ChevronDown, ChevronUp, Layers, Calculator, Info, Banknote, Share2, Copy, Check, X, LayoutGrid, List } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { PremiumLockedOverlay } from "@/components/shared/PremiumBadge";
import { useAppStore } from "@/store/useAppStore";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import type { FabricItem, NotionItem, FabricQuote } from "@/store/useAppStore";
import { validateName } from "@/lib/utils";

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

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

// ─── Common Notions (quick-add) ───────────────────────────────────────────

const COMMON_NOTIONS = [
  { name: "Zip", cost: 500 },
  { name: "Buttons", cost: 1500 },
  { name: "Lining", cost: 3000 },
  { name: "Thread", cost: 300 },
  { name: "Interfacing", cost: 800 },
  { name: "Stiffener", cost: 600 },
  { name: "Elastic", cost: 400 },
  { name: "Hook & Eye", cost: 200 },
];

// ─── Common Garment Labor Prices ──────────────────────────────────────────

const GARMENT_LABOR: { name: string; hours: number; flatRate: number }[] = [
  { name: "Shirt / Polo", hours: 2, flatRate: 5000 },
  { name: "Trouser", hours: 2.5, flatRate: 7000 },
  { name: "Senator", hours: 4, flatRate: 15000 },
  { name: "Kaftan", hours: 5, flatRate: 18000 },
  { name: "Suit (2-piece)", hours: 8, flatRate: 25000 },
  { name: "Agbada (3-piece)", hours: 14, flatRate: 50000 },
  { name: "Gown (simple)", hours: 5, flatRate: 15000 },
  { name: "Gown (evening)", hours: 10, flatRate: 35000 },
  { name: "Wedding Dress", hours: 20, flatRate: 80000 },
];

type ViewMode = "simple" | "detailed";

// ─── Calculations ──────────────────────────────────────────────────────────

function calcTotals(
  fabrics: FabricItem[],
  notions: NotionItem[],
  effectiveLaborCost: number,
  overheadPercent: number
) {
  const fabricCost = fabrics.reduce((s, f) => s + f.pricePerUnit * f.quantity, 0);
  const notionCost = notions.reduce((s, n) => s + n.cost, 0);
  const subTotal = fabricCost + notionCost + effectiveLaborCost;
  const overhead = (subTotal * overheadPercent) / 100;
  const total = subTotal + overhead;
  return { fabricCost, notionCost, laborCost: effectiveLaborCost, overhead, total };
}

function getTotalFabricQuantity(fabrics: FabricItem[]): string {
  const byUnit: Record<string, number> = {};
  fabrics.forEach(f => {
    if (f.quantity > 0) byUnit[f.unit] = (byUnit[f.unit] || 0) + f.quantity;
  });
  return Object.entries(byUnit).map(([unit, qty]) => `${qty} ${unit}${qty > 1 ? "s" : ""}`).join(" + ") || "—";
}

export default function FabricCost() {
  const isPremium = useAppStore((s) => s.isPremium);
  const storeCurrencySymbol = useAppStore((s) => s.currencySymbol);
  const storeCurrencyCode = useAppStore((s) => s.currencyCode);
  const setCurrency = useAppStore((s) => s.setCurrency);
  const addFabricQuote = useAppStore((s) => s.addFabricQuote);
  const fabricQuotes = useAppStore((s) => s.fabricQuotes);
  const deleteFabricQuote = useAppStore((s) => s.deleteFabricQuote);
  const incrementUsage = useAppStore((s) => s.incrementUsage);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // ── Mode ────────────────────────────────────────────────────────────────
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    return (localStorage.getItem("fabric-cost-mode") as ViewMode) || "simple";
  });

  const setMode = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem("fabric-cost-mode", mode);
  };

  // ── Currency ────────────────────────────────────────────────────────────
  const [currencies, setCurrencies] = useState<CurrencyOption[]>(() => {
    const saved = localStorage.getItem("custom_currencies");
    return saved ? JSON.parse(saved) : DEFAULT_CURRENCIES;
  });
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const [showCustomCurrency, setShowCustomCurrency] = useState(false);
  const [customSymbol, setCustomSymbol] = useState("");
  const [customCode, setCustomCode] = useState("");
  const [currencyChecked, setCurrencyChecked] = useState(false);

  const displaySymbol = storeCurrencySymbol || "₦";

  useEffect(() => {
    if (!currencyChecked && !storeCurrencySymbol) {
      setShowCurrencyPicker(true);
    }
    setCurrencyChecked(true);
  }, [storeCurrencySymbol, currencyChecked]);

  // Sync custom currencies to localStorage
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

  // ── Form State ──────────────────────────────────────────────────────────
  const [fabrics, setFabrics] = useState<FabricItem[]>([
    { id: uid(), name: "Main Fabric", pricePerUnit: 0, quantity: 1, unit: "meter" },
  ]);
  const [notions, setNotions] = useState<NotionItem[]>([]);
  const [laborHours, setLaborHours] = useState(3);
  const [hourlyRate, setHourlyRate] = useState(2000);
  const [overheadPercent, setOverheadPercent] = useState(10);
  const [profitPercent, setProfitPercent] = useState(30);
  const [clientName, setClientName] = useState("");
  const [garmentType, setGarmentType] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [laborMode, setLaborMode] = useState<"hourly" | "flat">("flat");
  const [flatLaborCost, setFlatLaborCost] = useState(0);
  const [copiedQuoteId, setCopiedQuoteId] = useState<string | null>(null);
  const [activeDetailTab, setActiveDetailTab] = useState<"fabrics" | "notions" | "labor">("fabrics");

  const effectiveLaborCost = laborMode === "flat" ? flatLaborCost : laborHours * hourlyRate;

  const { fabricCost, notionCost, overhead, total } = calcTotals(
    fabrics, notions, effectiveLaborCost, overheadPercent
  );

  const sellingPrice = Math.round(total * (1 + profitPercent / 100));

  // ── Fabric & Notion handlers ───────────────────────────────────────────
  const addFabric = () => setFabrics((f) => [...f, { id: uid(), name: "", pricePerUnit: 0, quantity: 1, unit: "meter" }]);
  const updateFabric = (id: string, field: keyof FabricItem, value: string | number) =>
    setFabrics((f) => f.map((item) => item.id === id ? { ...item, [field]: value } : item));
  const removeFabric = (id: string) => setFabrics((f) => f.filter((item) => item.id !== id));

  const addNotion = () => setNotions((n) => [...n, { id: uid(), name: "", cost: 0 }]);
  const addCommonNotion = (notion: { name: string; cost: number }) => {
    setNotions((n) => [...n, { id: uid(), name: notion.name, cost: notion.cost }]);
  };
  const updateNotion = (id: string, field: keyof NotionItem, value: string | number) =>
    setNotions((n) => n.map((item) => item.id === id ? { ...item, [field]: value } : item));
  const removeNotion = (id: string) => setNotions((n) => n.filter((item) => item.id !== id));

  const applyGarmentLabor = (garment: { name: string; hours: number; flatRate: number }) => {
    setGarmentType(garment.name);
    setLaborHours(garment.hours);
    setFlatLaborCost(garment.flatRate);
    setLaborMode("flat");
    toast({ title: "Labor set", description: `${garment.name}: ${displaySymbol}${garment.flatRate.toLocaleString()}` });
  };

  // ── Save & Share ──────────────────────────────────────────────────────
  const saveQuote = useCallback(async () => {
    if (total === 0) { toast({ title: "Add some costs first!", variant: "destructive" }); return; }
    if (clientName) {
      const v = validateName(clientName);
      if (!v.valid) { toast({ title: "Invalid Client Name", description: v.message, variant: "destructive" }); return; }
    }
    if (garmentType) {
      const v = validateName(garmentType);
      if (!v.valid) { toast({ title: "Invalid Garment Type", description: v.message, variant: "destructive" }); return; }
    }
    const quote: FabricQuote = {
      id: uid(),
      clientName: clientName || "Unnamed",
      garmentType: garmentType || "Garment",
      fabrics,
      notions,
      laborHours: laborMode === "flat" ? Math.round(flatLaborCost / (hourlyRate || 2000)) : laborHours,
      hourlyRate,
      overheadPercent,
      totalCost: total,
      suggestedPrice: sellingPrice,
      profitPercent,
      date: new Date().toISOString(),
    };
    addFabricQuote(quote);
    await incrementUsage();
    toast({ title: "Quote saved!", description: `${quote.clientName} — ${displaySymbol}${sellingPrice.toLocaleString()}` });
    setClientName("");
    setGarmentType("");
    setFabrics([{ id: uid(), name: "Main Fabric", pricePerUnit: 0, quantity: 1, unit: "meter" }]);
    setNotions([]);
    setLaborHours(3);
    setHourlyRate(2000);
    setOverheadPercent(10);
    setProfitPercent(30);
    setFlatLaborCost(0);
    setLaborMode("flat");
  }, [total, sellingPrice, profitPercent, clientName, garmentType, fabrics, notions, laborHours, hourlyRate, flatLaborCost, laborMode, overheadPercent, addFabricQuote, toast, incrementUsage, displaySymbol]);

  const shareQuote = (quote?: FabricQuote) => {
    const q = quote || { clientName: clientName || "Client", garmentType: garmentType || "Garment", totalCost: total, suggestedPrice: sellingPrice, profitPercent };
    const text = `🧵 *Fabric Cost Quote*\n\n👤 ${q.clientName}\n👗 ${q.garmentType}\n\n💰 Cost: ${displaySymbol}${typeof q.totalCost === 'number' ? Math.round(q.totalCost).toLocaleString() : q.totalCost}\n💵 My Price: ${displaySymbol}${typeof q.suggestedPrice === 'number' ? Math.round(q.suggestedPrice).toLocaleString() : q.suggestedPrice}\n📈 Margin: ${q.profitPercent || profitPercent}%\n\n— Sent via OneTailor`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const copyQuoteText = (q: FabricQuote) => {
    const text = `🧵 Fabric Cost Quote\n\n👤 ${q.clientName}\n👗 ${q.garmentType}\n\n💰 Cost: ${displaySymbol}${Math.round(q.totalCost).toLocaleString()}\n💵 Price: ${displaySymbol}${Math.round(q.suggestedPrice).toLocaleString()}\n📈 Margin: ${q.profitPercent || 30}%\n📅 ${new Date(q.date).toLocaleDateString()}\n\n— OneTailor`;
    navigator.clipboard.writeText(text).then(() => {
      setCopiedQuoteId(q.id);
      toast({ title: "Copied" });
      setTimeout(() => setCopiedQuoteId(null), 2000);
    });
  };

  const inputStyle = "w-full rounded-xl px-3 py-2.5 text-sm outline-none border border-border bg-background text-foreground focus:border-primary/50 transition-colors";

  // ──────────────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-lg mx-auto relative min-h-screen pb-10">
      <PageHeader 
        title="Quote Builder" 
        subtitle="Quote materials fast and accurately" 
        backPath="/all-tools?cat=pricing"
        backLabel="Tailoring Tools"
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
                    <input
                      value={customSymbol}
                      onChange={e => setCustomSymbol(e.target.value)}
                      placeholder="e.g. ₹, ¥, د.إ"
                      className={inputStyle}
                      autoFocus
                    />
                    <p className="text-[9px] text-muted-foreground mt-1">What you see in prices: {customSymbol || "?"}1,000</p>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Currency Code</label>
                    <input
                      value={customCode}
                      onChange={e => setCustomCode(e.target.value.toUpperCase())}
                      placeholder="e.g. INR, JPY, AED"
                      className={inputStyle}
                      maxLength={5}
                    />
                    <p className="text-[9px] text-muted-foreground mt-1">3-5 letter international code</p>
                  </div>
                </div>
                <button
                  onClick={addCustomCurrency}
                  disabled={!customSymbol.trim() || !customCode.trim()}
                  className="w-full py-3.5 bg-primary text-primary-foreground rounded-2xl font-bold text-sm active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  Set Currency
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Currency indicator + Mode toggle ──────────────────────────── */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowCurrencyPicker(!showCurrencyPicker)}
            className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground hover:text-foreground transition-colors"
          >
            <Banknote size={11} />
            {displaySymbol} {storeCurrencyCode || ""}
            <ChevronDown size={10} className={showCurrencyPicker ? "rotate-180" : ""} />
          </button>
          <div className="flex bg-muted/50 rounded-xl p-1 gap-1">
            <button
              onClick={() => setMode("simple")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${viewMode === "simple" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"}`}
            >
              <LayoutGrid size={11} /> Simple
            </button>
            <button
              onClick={() => setMode("detailed")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${viewMode === "detailed" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"}`}
            >
              <List size={11} /> Detailed
            </button>
          </div>
        </div>

        {/* Collapsed currency picker (when already set) */}
        {showCurrencyPicker && storeCurrencySymbol && (
          <div className="bg-card border border-border rounded-2xl p-4 space-y-3 shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-muted-foreground">Change Currency</p>
              <button onClick={() => setShowCurrencyPicker(false)} className="text-[10px] text-muted-foreground">✕</button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {currencies.map((c) => (
                <button
                  key={c.code}
                  onClick={() => handleSetCurrency(c.code, c.symbol)}
                  className={`py-3 px-2 rounded-xl text-xs font-bold border transition-all text-center ${storeCurrencySymbol === c.symbol ? "bg-primary/10 border-primary text-primary" : "border-border hover:border-primary/40"}`}
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

        {/* ── SIMPLE MODE ────────────────────────────────────────────────── */}
        {viewMode === "simple" && (
          <div className="space-y-4 animate-in fade-in duration-300">
            {/* Client & Garment */}
            <div className="bg-card border border-border rounded-2xl p-4 space-y-3 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <Layers size={16} className="text-primary" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Client & Garment</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input type="text" placeholder="Client name" value={clientName} onChange={(e) => setClientName(e.target.value)} className={inputStyle} />
                <input type="text" placeholder="Garment type" value={garmentType} onChange={(e) => setGarmentType(e.target.value)} className={inputStyle} />
              </div>
            </div>

            {/* Quick Labor */}
            <div className="bg-card border border-border rounded-2xl p-4 space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Quick Labor</p>
                <span className="text-[9px] text-muted-foreground">Tap to set</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {GARMENT_LABOR.map((g) => (
                  <button
                    key={g.name}
                    onClick={() => applyGarmentLabor(g)}
                    className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${garmentType === g.name ? "bg-primary/10 border-primary text-primary" : "bg-muted/30 border-border text-muted-foreground hover:border-primary/30"}`}
                  >
                    {g.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Profit Margin */}
            <div className="bg-card border border-border rounded-2xl p-4 space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Profit Margin</h3>
                <span className="text-sm font-black text-primary">{profitPercent}%</span>
              </div>
              <input type="range" min={5} max={100} step={5} value={profitPercent}
                onChange={(e) => setProfitPercent(Number(e.target.value))}
                className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary" />
              <div className="flex gap-1.5">
                {[10, 20, 30, 50, 75].map((p) => (
                  <button key={p} onClick={() => setProfitPercent(p)}
                    className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${profitPercent === p ? "bg-primary/10 border-primary text-primary" : "bg-muted/30 border-border text-muted-foreground hover:border-primary/30"}`}
                  >{p}%</button>
                ))}
              </div>
            </div>

            {/* Fabric summary line (simple) */}
            {fabrics.some(f => f.quantity > 0 && f.pricePerUnit > 0) && (
              <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-muted/20 text-xs">
                <span className="text-muted-foreground">Fabric: {getTotalFabricQuantity(fabrics)}</span>
                <span className="font-bold text-foreground">{displaySymbol}{fabricCost.toLocaleString()}</span>
              </div>
            )}

            {/* Price Result */}
            <div className="bg-primary text-primary-foreground rounded-2xl p-6 space-y-4 shadow-lg shadow-primary/20">
              <div className="text-center space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">My Price ({profitPercent}% margin)</p>
                <p className="text-4xl font-black">{displaySymbol}{sellingPrice.toLocaleString()}</p>
                <p className="text-[10px] opacity-70">Cost: {displaySymbol}{Math.round(total).toLocaleString()}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={saveQuote} className="py-3 bg-white text-primary font-black rounded-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-sm">
                  <Save size={16} /> Save
                </button>
                <button onClick={() => shareQuote()} className="py-3 bg-white/20 text-white font-black rounded-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                  <Share2 size={16} /> Share
                </button>
              </div>
            </div>

            {/* Detail Tabs for Simple mode */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
              <div className="flex bg-muted/30 p-1 gap-1">
                {(["fabrics", "notions", "labor"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveDetailTab(tab)}
                    className={`flex-1 py-2 rounded-lg text-[10px] font-bold capitalize transition-all ${activeDetailTab === tab ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"}`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
              <div className="p-4">
                {activeDetailTab === "fabrics" && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-muted-foreground">Fabrics</p>
                      <button onClick={addFabric} className="flex items-center gap-1 text-[10px] font-bold text-primary"><Plus size={12} /> Add</button>
                    </div>
                    {fabrics.map((item) => (
                      <div key={item.id} className="flex gap-2 items-center">
                        <input type="text" placeholder="Name" value={item.name} onChange={(e) => updateFabric(item.id, "name", e.target.value)} className={`${inputStyle} flex-1 text-xs`} />
                        <div className="relative w-24">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">{displaySymbol}</span>
                          <input type="number" placeholder="Price" value={item.pricePerUnit || ""} onChange={(e) => updateFabric(item.id, "pricePerUnit", parseFloat(e.target.value) || 0)} className={`${inputStyle} pl-6 text-xs`} />
                        </div>
                        <input type="number" placeholder="Qty" value={item.quantity || ""} onChange={(e) => updateFabric(item.id, "quantity", parseFloat(e.target.value) || 0)} className={`${inputStyle} w-16 text-xs`} />
                        <button onClick={() => removeFabric(item.id)} className="text-red-400"><Trash2 size={14} /></button>
                      </div>
                    ))}
                  </div>
                )}
                {activeDetailTab === "notions" && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-muted-foreground">Notions</p>
                      <button onClick={addNotion} className="flex items-center gap-1 text-[10px] font-bold text-primary"><Plus size={12} /> Add</button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {COMMON_NOTIONS.map((n) => (
                        <button key={n.name} onClick={() => addCommonNotion(n)} className="px-2 py-1 rounded-lg text-[9px] font-bold border border-border text-muted-foreground hover:border-primary/30">+ {n.name}</button>
                      ))}
                    </div>
                    {notions.map((item) => (
                      <div key={item.id} className="flex gap-2 items-center">
                        <input type="text" placeholder="Name" value={item.name} onChange={(e) => updateNotion(item.id, "name", e.target.value)} className={`${inputStyle} flex-1 text-xs`} />
                        <div className="relative w-24">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">{displaySymbol}</span>
                          <input type="number" placeholder="Cost" value={item.cost || ""} onChange={(e) => updateNotion(item.id, "cost", parseFloat(e.target.value) || 0)} className={`${inputStyle} pl-6 text-xs`} />
                        </div>
                        <button onClick={() => removeNotion(item.id)} className="text-red-400"><Trash2 size={14} /></button>
                      </div>
                    ))}
                  </div>
                )}
                {activeDetailTab === "labor" && (
                  <div className="space-y-3">
                    <p className="text-xs font-bold text-muted-foreground">Labor Details</p>
                    <div className="flex bg-muted/30 rounded-lg p-1 gap-1">
                      <button onClick={() => setLaborMode("hourly")} className={`flex-1 py-1.5 rounded-md text-[10px] font-bold ${laborMode === "hourly" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"}`}>Per Hour</button>
                      <button onClick={() => setLaborMode("flat")} className={`flex-1 py-1.5 rounded-md text-[10px] font-bold ${laborMode === "flat" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"}`}>Flat Rate</button>
                    </div>
                    {laborMode === "hourly" ? (
                      <div className="grid grid-cols-2 gap-2">
                        <input type="number" placeholder="Hours" value={laborHours || ""} onChange={(e) => setLaborHours(parseFloat(e.target.value) || 0)} className={`${inputStyle} text-xs`} />
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">{displaySymbol}</span>
                          <input type="number" placeholder="Rate/hr" value={hourlyRate || ""} onChange={(e) => setHourlyRate(parseFloat(e.target.value) || 0)} className={`${inputStyle} pl-6 text-xs`} />
                        </div>
                      </div>
                    ) : (
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-bold">{displaySymbol}</span>
                        <input type="number" placeholder="Flat labor cost" value={flatLaborCost || ""} onChange={(e) => setFlatLaborCost(parseFloat(e.target.value) || 0)} className={`${inputStyle} pl-10 text-xs`} />
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-muted-foreground">Overhead</span>
                      <span className="text-xs font-bold text-primary">{overheadPercent}%</span>
                    </div>
                    <input type="range" min={0} max={50} value={overheadPercent} onChange={(e) => setOverheadPercent(Number(e.target.value))} className="w-full h-2 bg-muted rounded-lg accent-primary" />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── DETAILED MODE ───────────────────────────────────────────────── */}
        {viewMode === "detailed" && (
          <div className="space-y-4 animate-in fade-in duration-300">
            {/* Quick Labor Presets */}
            <div className="bg-card border border-border rounded-2xl p-4 space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Quick Labor</p>
                <span className="text-[9px] text-muted-foreground">Tap to set garment + labor</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {GARMENT_LABOR.map((g) => (
                  <button key={g.name} onClick={() => applyGarmentLabor(g)}
                    className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${garmentType === g.name ? "bg-primary/10 border-primary text-primary" : "bg-muted/30 border-border text-muted-foreground hover:border-primary/30"}`}
                  >{g.name}</button>
                ))}
              </div>
            </div>

            {/* Client info */}
            <div className="bg-card border border-border rounded-2xl p-4 space-y-3 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <Layers size={16} className="text-primary" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Client & Garment</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input type="text" placeholder="Client name" value={clientName} onChange={(e) => setClientName(e.target.value)} className={inputStyle} />
                <input type="text" placeholder="Garment type" value={garmentType} onChange={(e) => setGarmentType(e.target.value)} className={inputStyle} />
              </div>
            </div>

            {/* Fabric items */}
            <div className="bg-card border border-border rounded-2xl p-4 space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calculator size={16} className="text-primary" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Fabric & Materials</h3>
                </div>
                <button onClick={addFabric} className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-colors"><Plus size={14} /> Add</button>
              </div>
              {fabrics.some(f => f.quantity > 0) && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted/20 text-[10px] font-bold text-muted-foreground">
                  <Info size={11} /> Total: {getTotalFabricQuantity(fabrics)}
                </div>
              )}
              <div className="space-y-3">
                {fabrics.map((item) => (
                  <div key={item.id} className="space-y-2 pb-3 border-b border-border/50 last:border-0 last:pb-0">
                    <div className="flex gap-2">
                      <input type="text" placeholder="Fabric name" value={item.name} onChange={(e) => updateFabric(item.id, "name", e.target.value)} className={`${inputStyle} flex-1`} />
                      <button onClick={() => removeFabric(item.id)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-red-50 dark:bg-red-900/20 text-red-500 hover:bg-red-100 transition-colors shrink-0"><Trash2 size={16} /></button>
                    </div>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-bold">{displaySymbol}</span>
                        <input type="number" placeholder="Price" value={item.pricePerUnit || ""} onChange={(e) => updateFabric(item.id, "pricePerUnit", parseFloat(e.target.value) || 0)} className={`${inputStyle} pl-7`} />
                      </div>
                      <input type="number" placeholder="Qty" value={item.quantity || ""} onChange={(e) => updateFabric(item.id, "quantity", parseFloat(e.target.value) || 0)} className={`${inputStyle} w-20`} />
                      <select value={item.unit} onChange={(e) => updateFabric(item.id, "unit", e.target.value)} className="rounded-xl px-2 py-2 text-xs outline-none border border-border bg-background text-foreground w-20">
                        <option>meter</option><option>yard</option><option>piece</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between text-xs pt-2 font-bold">
                <span className="text-muted-foreground">Fabric subtotal</span>
                <span className="text-primary">{displaySymbol}{fabricCost.toLocaleString()}</span>
              </div>
            </div>

            {/* Notions */}
            <div className="bg-card border border-border rounded-2xl p-4 space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2"><Info size={16} className="text-primary" /><h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Notions & Trims</h3></div>
                <button onClick={addNotion} className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-colors"><Plus size={14} /> Add</button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {COMMON_NOTIONS.map((n) => (
                  <button key={n.name} onClick={() => addCommonNotion(n)} className="px-2.5 py-1 rounded-lg text-[10px] font-bold border border-border bg-muted/30 text-muted-foreground hover:border-primary/30 hover:text-primary transition-all">+ {n.name}</button>
                ))}
              </div>
              <div className="space-y-3">
                {notions.map((item) => (
                  <div key={item.id} className="flex gap-2">
                    <input type="text" placeholder="e.g. Zip" value={item.name} onChange={(e) => updateNotion(item.id, "name", e.target.value)} className={`${inputStyle} flex-1`} />
                    <div className="relative w-32">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-bold">{displaySymbol}</span>
                      <input type="number" placeholder="Cost" value={item.cost || ""} onChange={(e) => updateNotion(item.id, "cost", parseFloat(e.target.value) || 0)} className={`${inputStyle} pl-7`} />
                    </div>
                    <button onClick={() => removeNotion(item.id)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-red-50 dark:bg-red-900/20 text-red-500 hover:bg-red-100 transition-colors shrink-0"><Trash2 size={16} /></button>
                  </div>
                ))}
              </div>
              {notions.length > 0 && (
                <div className="flex items-center justify-between text-xs pt-2 font-bold">
                  <span className="text-muted-foreground">Notions subtotal</span>
                  <span className="text-primary">{displaySymbol}{notionCost.toLocaleString()}</span>
                </div>
              )}
            </div>

            {/* Labor & Overhead */}
            <div className="bg-card border border-border rounded-2xl p-4 space-y-4 shadow-sm">
              <div className="flex items-center gap-2"><Calculator size={16} className="text-primary" /><h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Labor & Overhead</h3></div>
              <div className="flex bg-muted/50 rounded-xl p-1 gap-1">
                <button onClick={() => setLaborMode("hourly")} className={`flex-1 py-2 rounded-lg text-[10px] font-bold transition-all ${laborMode === "hourly" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"}`}>Per Hour</button>
                <button onClick={() => setLaborMode("flat")} className={`flex-1 py-2 rounded-lg text-[10px] font-bold transition-all ${laborMode === "flat" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"}`}>Flat Rate</button>
              </div>
              {laborMode === "hourly" ? (
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-[10px] font-bold text-muted-foreground uppercase mb-1.5 block">Labor Hours</label><input type="number" placeholder="3" value={laborHours || ""} onChange={(e) => setLaborHours(parseFloat(e.target.value) || 0)} className={inputStyle} /></div>
                  <div><label className="text-[10px] font-bold text-muted-foreground uppercase mb-1.5 block">Rate ({displaySymbol}/hr)</label><input type="number" placeholder="2000" value={hourlyRate || ""} onChange={(e) => setHourlyRate(parseFloat(e.target.value) || 0)} className={inputStyle} /></div>
                </div>
              ) : (
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1.5 block">Flat Labor Cost</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-bold">{displaySymbol}</span>
                    <input type="number" placeholder="e.g. 15000" value={flatLaborCost || ""} onChange={(e) => setFlatLaborCost(parseFloat(e.target.value) || 0)} className={`${inputStyle} pl-10`} />
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <div className="flex justify-between items-center"><label className="text-[10px] font-bold text-muted-foreground uppercase">Overhead</label><span className="text-xs font-bold text-primary">{overheadPercent}%</span></div>
                <input type="range" min={0} max={50} value={overheadPercent} onChange={(e) => setOverheadPercent(Number(e.target.value))} className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary" />
              </div>
            </div>

            {/* Profit Margin */}
            <div className="bg-card border border-border rounded-2xl p-4 space-y-3 shadow-sm">
              <div className="flex items-center justify-between"><h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Profit Margin</h3><span className="text-sm font-black text-primary">{profitPercent}%</span></div>
              <input type="range" min={5} max={100} step={5} value={profitPercent} onChange={(e) => setProfitPercent(Number(e.target.value))} className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary" />
              <div className="flex gap-1.5">
                {[10, 20, 30, 50, 75].map((p) => (
                  <button key={p} onClick={() => setProfitPercent(p)} className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${profitPercent === p ? "bg-primary/10 border-primary text-primary" : "bg-muted/30 border-border text-muted-foreground hover:border-primary/30"}`}>{p}%</button>
                ))}
              </div>
            </div>

            {/* Results */}
            <div className="bg-primary text-primary-foreground rounded-2xl p-6 space-y-4 shadow-lg shadow-primary/20">
              <div className="text-center space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">Cost Price</p>
                <p className="text-4xl font-black">{displaySymbol}{Math.round(total).toLocaleString()}</p>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10">
                  <p className="text-[9px] font-bold uppercase opacity-80">My Price ({profitPercent}%)</p>
                  <p className="text-lg font-bold">{displaySymbol}{sellingPrice.toLocaleString()}</p>
                  <p className="text-[8px] opacity-70">Profit: {displaySymbol}{(sellingPrice - Math.round(total)).toLocaleString()}</p>
                </div>
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10 text-center flex flex-col justify-center">
                  <p className="text-[9px] font-bold uppercase opacity-80">Quick Share</p>
                  <button onClick={() => shareQuote()} className="mt-1.5 mx-auto flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/20 text-white text-xs font-bold hover:bg-white/30 transition-colors"><Share2 size={13} /> WhatsApp</button>
                </div>
              </div>
              <button onClick={saveQuote} className="w-full py-3.5 bg-white text-primary font-black rounded-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-sm"><Save size={18} /> Save This Quote</button>
            </div>
          </div>
        )}

        {/* ── History ──────────────────────────────────────────────────────── */}
        <button onClick={() => setShowHistory(!showHistory)}
          className="w-full flex items-center justify-between px-4 py-3 bg-card border border-border rounded-2xl text-sm font-bold text-muted-foreground hover:text-foreground transition-colors shadow-sm">
          <div className="flex items-center gap-2"><FileText size={18} />Saved Quotes ({fabricQuotes.length})</div>
          {showHistory ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>

        {showHistory && (
          <div className="space-y-3">
            {fabricQuotes.length === 0 ? (
              <div className="text-center py-10 bg-muted/20 rounded-2xl border border-dashed border-border"><p className="text-sm text-muted-foreground">No saved quotes yet</p></div>
            ) : (
              [...fabricQuotes].reverse().map((q) => (
                <div key={q.id} className="bg-card border border-border rounded-2xl p-4 shadow-sm">
                  <div className="flex items-start justify-between mb-3">
                    <div><h4 className="font-bold text-foreground">{q.clientName}</h4><p className="text-xs text-muted-foreground">{q.garmentType} • {new Date(q.date).toLocaleDateString()}</p></div>
                    <div className="text-right">
                      <p className="text-lg font-black text-primary">{displaySymbol}{Math.round(q.suggestedPrice || q.totalCost * 1.3).toLocaleString()}</p>
                      <p className="text-[10px] text-muted-foreground">Cost: {displaySymbol}{Math.round(q.totalCost).toLocaleString()} · Margin: {q.profitPercent || 30}%</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => copyQuoteText(q)} className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-muted/30 text-foreground text-xs font-bold hover:bg-muted transition-colors">
                      {copiedQuoteId === q.id ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}{copiedQuoteId === q.id ? "Copied" : "Copy"}
                    </button>
                    <button onClick={() => shareQuote(q)} className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-green-500/10 text-green-600 text-xs font-bold hover:bg-green-500/20 transition-colors"><Share2 size={14} /> Share</button>
                    <button onClick={() => deleteFabricQuote(q.id)} className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-red-50 dark:bg-red-900/10 text-red-500 text-xs font-bold hover:bg-red-100 transition-colors"><Trash2 size={14} /></button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}