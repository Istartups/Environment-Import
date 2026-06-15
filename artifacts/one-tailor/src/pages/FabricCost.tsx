import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import {
  Layers, Calculator, Share2, Save, FileText,
  ChevronUp, ChevronDown, Check, Copy, Trash2,
} from "lucide-react";
import { useAppStore, type FabricQuote, type NotionItem } from "@/store/useAppStore";
import { PageHeader } from "@/components/shared/PageHeader";

interface FabricSwatch {
  id: string;
  name: string;
  costPerUnit: number;
}

const inputStyle =
  "w-full text-sm rounded-xl px-3 py-2.5 bg-muted/30 border border-border focus:border-primary/50 focus:outline-none transition-colors";

export default function FabricCost() {
  const [, navigate] = useLocation();
  const fabricQuotes      = useAppStore(s => s.fabricQuotes);
  const addFabricQuote    = useAppStore(s => s.addFabricQuote);
  const deleteFabricQuote = useAppStore(s => s.deleteFabricQuote);
  const displaySymbol     = useAppStore(s => s.currencySymbol);

  const [clientName,      setClientName]      = useState("");
  const [garmentType,     setGarmentType]     = useState("");
  const [selectedFabric,  setSelectedFabric]  = useState<FabricSwatch | null>(null);
  const [notions,         setNotions]         = useState<NotionItem[]>([{ id: "1", name: "", cost: 0 }]);
  const [laborMode,       setLaborMode]       = useState<"hourly" | "flat">("hourly");
  const [laborHours,      setLaborHours]      = useState(0);
  const [hourlyRate,      setHourlyRate]      = useState(0);
  const [flatLaborCost,   setFlatLaborCost]   = useState(0);
  const [overheadPercent, setOverheadPercent] = useState(10);
  const [profitPercent,   setProfitPercent]   = useState(30);
  const [showHistory,     setShowHistory]     = useState(false);
  const [copiedQuoteId,   setCopiedQuoteId]   = useState<string | null>(null);

  const fabricSwatches = useMemo<FabricSwatch[]>(() => {
    const map = new Map<string, FabricSwatch>();
    fabricQuotes.forEach(q => {
      (q.fabrics || []).forEach(f => {
        if (!map.has(f.name)) {
          map.set(f.name, { id: f.id, name: f.name, costPerUnit: f.pricePerUnit });
        }
      });
    });
    return Array.from(map.values());
  }, [fabricQuotes]);

  const notionCost   = notions.reduce((s, n) => s + (n.cost || 0), 0);
  const laborCost    = laborMode === "hourly" ? laborHours * hourlyRate : flatLaborCost;
  const fabricCost   = selectedFabric?.costPerUnit ?? 0;
  const subtotal     = fabricCost + notionCost + laborCost;
  const total        = subtotal * (1 + overheadPercent / 100);
  const sellingPrice = Math.round(total * (1 + profitPercent / 100));

  const updateNotion = (id: string, field: string, value: any) =>
    setNotions(prev => prev.map(n => n.id === id ? { ...n, [field]: value } : n));
  const removeNotion = (id: string) =>
    setNotions(prev => prev.filter(n => n.id !== id));

  const shareQuote = (q?: FabricQuote) => {
    const lines = [
      `${q?.garmentType ?? garmentType} Quote`,
      `Cost: ${displaySymbol}${Math.round(q?.totalCost ?? total).toLocaleString()}`,
      `Selling Price: ${displaySymbol}${Math.round(q?.suggestedPrice ?? sellingPrice).toLocaleString()}`,
    ];
    window.open(`https://wa.me/?text=${encodeURIComponent(lines.join("\n"))}`, "_blank");
  };

  const saveQuote = () => {
    if (!garmentType) return;
    addFabricQuote({
      id: Date.now().toString(),
      clientName: clientName || "Client",
      garmentType,
      fabrics: selectedFabric
        ? [{ id: selectedFabric.id, name: selectedFabric.name, pricePerUnit: selectedFabric.costPerUnit, quantity: 1, unit: "unit" }]
        : [],
      notions,
      laborHours,
      hourlyRate: laborMode === "hourly" ? hourlyRate : 0,
      overheadPercent,
      totalCost: total,
      suggestedPrice: sellingPrice,
      date: new Date().toISOString(),
    });
  };

  const copyQuoteText = (q: FabricQuote) => {
    const text = [
      q.garmentType,
      `Client: ${q.clientName}`,
      `Cost: ${displaySymbol}${Math.round(q.totalCost).toLocaleString()}`,
      `Price: ${displaySymbol}${Math.round(q.suggestedPrice ?? q.totalCost * 1.3).toLocaleString()}`,
    ].join("\n");
    navigator.clipboard.writeText(text).then(() => {
      setCopiedQuoteId(q.id);
      setTimeout(() => setCopiedQuoteId(null), 2000);
    });
  };

  return (
    <div className="min-h-screen bg-background pb-28">
      <PageHeader title="Fabric Cost Calculator" onBack={() => navigate("/")} />
      <div className="max-w-lg mx-auto px-4 pt-4 space-y-4">

        {/* Quote Details */}
        <div className="bg-card border border-border rounded-2xl p-4 space-y-3 shadow-sm">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Quote Details</h3>
          <input
            placeholder="Client name (optional)"
            value={clientName}
            onChange={e => setClientName(e.target.value)}
            className={inputStyle}
          />
          <input
            placeholder="Garment type, e.g. Agbada, Suit, Dress *"
            value={garmentType}
            onChange={e => setGarmentType(e.target.value)}
            className={inputStyle}
          />
        </div>

        {garmentType && (
          <>
            {/* Fabric Swatch Selection */}
            <div className="bg-card border border-border rounded-2xl p-4 space-y-3 shadow-sm">
              <div className="flex items-center gap-2">
                <Layers size={16} className="text-primary" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Fabric Selection</h3>
              </div>

              {fabricSwatches.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground text-sm">
                  No fabric swatches yet — save a quote first to reuse fabrics.
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {fabricSwatches.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => setSelectedFabric(prev => prev?.id === n.id ? null : n)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${selectedFabric?.id === n.id ? "bg-primary/10 border-primary text-primary" : "bg-muted/30 border-border text-muted-foreground hover:border-primary/30"}`}
                    >
                      {n.name}
                    </button>
                  ))}
                </div>
              )}

              {selectedFabric && (
                <div className="mt-2 p-2 rounded-lg bg-muted/20">
                  <p className="text-xs font-medium">Selected: <span className="text-primary">{selectedFabric.name}</span></p>
                  <p className="text-[10px] text-muted-foreground">Cost per unit: {displaySymbol}{selectedFabric.costPerUnit.toLocaleString()}</p>
                </div>
              )}
            </div>

            {/* Notions */}
            <div className="bg-card border border-border rounded-2xl p-4 space-y-3 shadow-sm">
              <div className="flex items-center gap-2">
                <Layers size={16} className="text-primary" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Notions</h3>
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
              <button
                onClick={() => setNotions(prev => [...prev, { id: Date.now().toString(), name: "", cost: 0 }])}
                className="text-xs text-primary font-bold hover:underline"
              >
                + Add notion
              </button>
              {notions.length > 0 && notionCost > 0 && (
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
          </>
        )}

        {/* ── History ──────────────────────────────────────────────────────────── */}
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="w-full flex items-center justify-between px-4 py-3 bg-card border border-border rounded-2xl text-sm font-bold text-muted-foreground hover:text-foreground transition-colors shadow-sm"
        >
          <div className="flex items-center gap-2"><FileText size={18} />Saved Quotes ({fabricQuotes.length})</div>
          {showHistory ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>

        {showHistory && (
          <div className="space-y-3">
            {fabricQuotes.length === 0 ? (
              <div className="text-center py-10 bg-muted/20 rounded-2xl border border-dashed border-border">
                <p className="text-sm text-muted-foreground">No saved quotes yet</p>
              </div>
            ) : (
              [...fabricQuotes].reverse().map((q) => (
                <div key={q.id} className="bg-card border border-border rounded-2xl p-4 shadow-sm">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-bold text-foreground">{q.clientName}</h4>
                      <p className="text-xs text-muted-foreground">{q.garmentType} • {new Date(q.date).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-black text-primary">{displaySymbol}{Math.round(q.suggestedPrice || q.totalCost * 1.3).toLocaleString()}</p>
                      <p className="text-[10px] text-muted-foreground">
                        Cost: {displaySymbol}{Math.round(q.totalCost).toLocaleString()} · Margin: {q.suggestedPrice && q.totalCost ? Math.round((q.suggestedPrice / q.totalCost - 1) * 100) : 30}%
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => copyQuoteText(q)} className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-muted/30 text-foreground text-xs font-bold hover:bg-muted transition-colors">
                      {copiedQuoteId === q.id ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                      {copiedQuoteId === q.id ? "Copied" : "Copy"}
                    </button>
                    <button onClick={() => shareQuote(q)} className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-green-500/10 text-green-600 text-xs font-bold hover:bg-green-500/20 transition-colors">
                      <Share2 size={14} /> Share
                    </button>
                    <button onClick={() => deleteFabricQuote(q.id)} className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-red-50 dark:bg-red-900/10 text-red-500 text-xs font-bold hover:bg-red-100 transition-colors">
                      <Trash2 size={14} />
                    </button>
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
