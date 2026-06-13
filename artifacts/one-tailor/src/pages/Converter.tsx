import { useState, useCallback } from "react";
import { ArrowLeftRight, History, Copy, Check, X, Ruler } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { PremiumBadge, PremiumLockedOverlay } from "@/components/shared/PremiumBadge";
import { useAppStore } from "@/store/useAppStore";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

type Unit = "inch" | "cm" | "meter" | "yard";

const UNITS: { value: Unit; label: string; symbol: string }[] = [
  { value: "inch", label: "Inches", symbol: "in" },
  { value: "cm", label: "Centimeters", symbol: "cm" },
  { value: "meter", label: "Meters", symbol: "m" },
  { value: "yard", label: "Yards", symbol: "yd" },
];

const TO_METERS: Record<Unit, number> = {
  inch: 0.0254,
  cm: 0.01,
  meter: 1,
  yard: 0.9144,
};

// Tailor-specific quick conversions
const TAILOR_QUICK = [
  { label: "36″ = 1 yd", from: "inch", value: 36, to: "yard", result: 1 },
  { label: "45″ = 1.25 yd", from: "inch", value: 45, to: "yard", result: 1.25 },
  { label: "60″ = 1.67 yd", from: "inch", value: 60, to: "yard", result: 1.67 },
  { label: "1m = 39.37″", from: "meter", value: 1, to: "inch", result: 39.37 },
  { label: "1 yd = 36″", from: "yard", value: 1, to: "inch", result: 36 },
  { label: "1 yd = 0.91m", from: "yard", value: 1, to: "meter", result: 0.91 },
];

function convert(value: number, from: Unit, to: Unit): number {
  const meters = value * TO_METERS[from];
  return meters / TO_METERS[to];
}

function formatResult(n: number): string {
  if (isNaN(n) || !isFinite(n)) return "0";
  if (n === 0) return "0";
  if (Math.abs(n) >= 1000) return n.toFixed(2);
  if (Math.abs(n) >= 10) return n.toFixed(3);
  if (Number.isInteger(n)) return n.toString();
  return n.toFixed(4);
}

function toFraction(decimal: number): string {
  if (decimal === 0) return "";
  const whole = Math.floor(decimal);
  const frac = decimal - whole;
  if (frac === 0) return whole.toString();
  const fractions: [number, string][] = [
    [0.25, "¼"], [0.5, "½"], [0.75, "¾"],
    [0.125, "⅛"], [0.375, "⅜"], [0.625, "⅝"], [0.875, "⅞"],
    [0.33, "⅓"], [0.67, "⅔"],
  ];
  const match = fractions.find(([v]) => Math.abs(frac - v) < 0.02);
  if (match) return whole > 0 ? `${whole} ${match[1]}` : match[1];
  return "";
}

export default function Converter() {
  const [fromValue, setFromValue] = useState("");
  const [fromUnit, setFromUnit] = useState<Unit>("inch");
  const [toUnit, setToUnit] = useState<Unit>("cm");
  const [copied, setCopied] = useState(false);
  const isPremium = useAppStore((s) => s.isPremium);
  const incrementUsage = useAppStore((s) => s.incrementUsage);
  const measurementHistory = useAppStore((s) => s.measurementHistory);
  const addMeasurementHistory = useAppStore((s) => s.addMeasurementHistory);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const numValue = parseFloat(fromValue) || 0;
  const result = fromValue ? convert(numValue, fromUnit, toUnit) : null;

  const handleSwap = useCallback(() => {
    setFromUnit(toUnit);
    setToUnit(fromUnit);
    if (result !== null) setFromValue(formatResult(result));
  }, [fromUnit, toUnit, result]);

  const handleConvert = useCallback(async () => {
    if (result === null || !fromValue) return;
    if (isPremium) {
      addMeasurementHistory({
        from: fromUnit,
        to: toUnit,
        value: numValue,
        result,
        date: new Date().toISOString(),
      });
    }
    await incrementUsage();
  }, [result, fromValue, fromUnit, toUnit, numValue, isPremium, addMeasurementHistory, incrementUsage]);

  const handleQuickConvert = (v: number, f: Unit, t: Unit) => {
    setFromValue(String(v));
    setFromUnit(f);
    setToUnit(t);
  };

  const copyResult = () => {
    if (result === null) return;
    const text = `${fromValue} ${UNITS.find(u => u.value === fromUnit)?.symbol} = ${formatResult(result)} ${UNITS.find(u => u.value === toUnit)?.symbol}`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      toast({ title: "Copied", description: text });
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const fromSymbol = UNITS.find((u) => u.value === fromUnit)?.symbol ?? "";
  const toSymbol = UNITS.find((u) => u.value === toUnit)?.symbol ?? "";
  const fractionDisplay = result !== null ? toFraction(parseFloat(formatResult(result))) : "";

  // Auto-save on value change when Premium
  const handleValueChange = (val: string) => {
    setFromValue(val);
    if (val && isPremium) {
      const n = parseFloat(val) || 0;
      const r = convert(n, fromUnit, toUnit);
      if (r !== null) {
        setTimeout(() => {
          addMeasurementHistory({
            from: fromUnit,
            to: toUnit,
            value: n,
            result: r,
            date: new Date().toISOString(),
          });
        }, 500);
      }
    }
  };

  return (
    <div className="max-w-lg mx-auto">
      <PageHeader 
        title="Measurement Converter" 
        subtitle="Convert inches, cm, meters & yards instantly" 
        backPath="/all-tools?cat=measurements"
        backLabel="Tailoring Tools"
      />

      <div className="px-4 py-5 space-y-4">
        {/* From */}
        <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">From</label>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <input
                type="number"
                inputMode="decimal"
                placeholder="0"
                value={fromValue}
                onChange={(e) => handleValueChange(e.target.value)}
                className="w-full bg-muted/50 text-foreground text-2xl font-bold rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary border border-border min-w-0 pr-10"
                data-testid="input-from-value"
              />
              {fromValue && (
                <button
                  onClick={() => { setFromValue(""); setCopied(false); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-muted-foreground/20 flex items-center justify-center hover:bg-muted-foreground/40 transition-colors"
                >
                  <X size={12} className="text-muted-foreground" />
                </button>
              )}
            </div>
            <select
              value={fromUnit}
              onChange={(e) => setFromUnit(e.target.value as Unit)}
              className="bg-primary text-primary-foreground font-semibold text-sm px-3 py-3 rounded-xl border-none outline-none cursor-pointer"
              data-testid="select-from-unit"
            >
              {UNITS.map((u) => (
                <option key={u.value} value={u.value}>{u.symbol}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Swap button */}
        <div className="flex justify-center">
          <button
            onClick={handleSwap}
            className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg active:scale-90 transition-transform hover:scale-105"
            data-testid="button-swap"
          >
            <ArrowLeftRight size={20} />
          </button>
        </div>

        {/* To / Result */}
        <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">To</label>
            {result !== null && (
              <button onClick={copyResult} className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground hover:text-white transition-colors">
                {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
                {copied ? "Copied" : "Copy"}
              </button>
            )}
          </div>
          <div className="flex gap-2 items-center">
            <div className="flex-1 bg-muted/50 rounded-xl px-4 py-3 min-w-0">
              <span className="text-2xl font-bold text-primary block">
                {result !== null ? formatResult(result) : "0"}
              </span>
              {fractionDisplay && (
                <span className="text-xs text-muted-foreground mt-0.5 block">
                  ≈ {fractionDisplay} {toSymbol}
                </span>
              )}
            </div>
            <select
              value={toUnit}
              onChange={(e) => setToUnit(e.target.value as Unit)}
              className="bg-primary text-primary-foreground font-semibold text-sm px-3 py-3 rounded-xl border-none outline-none cursor-pointer"
              data-testid="select-to-unit"
            >
              {UNITS.map((u) => (
                <option key={u.value} value={u.value}>{u.symbol}</option>
              ))}
            </select>
          </div>
          {result !== null && (
            <p className="text-sm text-muted-foreground">
              {fromValue} {fromSymbol} = <strong className="text-foreground">{formatResult(result)} {toSymbol}</strong>
            </p>
          )}
        </div>

        {/* Quick number inputs */}
        <div className="grid grid-cols-3 gap-2">
          {[1, 5, 10, 20, 36, 100].map((v) => (
            <button
              key={v}
              onClick={() => handleValueChange(String(v))}
              className="bg-muted/50 text-foreground text-sm font-semibold py-3 rounded-xl active:scale-95 transition-transform border border-border hover:bg-muted"
              data-testid={`button-quick-${v}`}
            >
              {v} {fromSymbol}
            </button>
          ))}
        </div>

        {/* Tailor Quick Reference */}
        <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Ruler size={14} className="text-primary" />
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tailor Quick Reference</label>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {TAILOR_QUICK.map((q, i) => (
              <button
                key={i}
                onClick={() => handleQuickConvert(q.value, q.from as Unit, q.to as Unit)}
                className="text-left px-3 py-2.5 rounded-xl text-xs font-semibold bg-muted/30 border border-border hover:border-primary/40 hover:bg-muted/50 transition-all active:scale-95"
              >
                <span className="text-foreground">{q.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* History (Premium) */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="px-4 py-3 flex items-center justify-between border-b border-border">
            <div className="flex items-center gap-2">
              <History size={16} className="text-muted-foreground" />
              <span className="text-sm font-bold text-foreground">Recent Conversions</span>
            </div>
            {!isPremium && <PremiumBadge />}
          </div>

          {isPremium ? (
            <div className="divide-y divide-border max-h-48 overflow-y-auto">
              {measurementHistory.length === 0 ? (
                <div className="py-10 text-center text-xs text-muted-foreground">
                  Conversions will appear here automatically
                </div>
              ) : (
                measurementHistory.slice(0, 20).map((h, i) => (
                  <button
                    key={i}
                    onClick={() => handleQuickConvert(h.value, h.from as Unit, h.to as Unit)}
                    className="w-full px-4 py-3 flex justify-between items-center hover:bg-muted/30 transition-colors text-left"
                    data-testid={`history-item-${i}`}
                  >
                    <div>
                      <p className="text-xs font-bold text-foreground">
                        {h.value}{UNITS.find(u => u.value === h.from)?.symbol || h.from} → {formatResult(h.result)}{UNITS.find(u => u.value === h.to)?.symbol || h.to}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {new Date(h.date).toLocaleDateString()}
                      </p>
                    </div>
                    <ArrowLeftRight size={12} className="text-muted-foreground/40" />
                  </button>
                ))
              )}
            </div>
          ) : (
            <PremiumLockedOverlay onUnlock={() => setLocation("/pre-unlock")}>
              <div className="py-10 text-center space-y-2 opacity-30">
                <History size={24} className="mx-auto text-muted-foreground" />
                <p className="text-xs font-medium">Auto-save history is Premium</p>
              </div>
            </PremiumLockedOverlay>
          )}
        </div>
      </div>
    </div>
  );
}