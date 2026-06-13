import { useState } from "react";
import { CalendarClock, RefreshCw, Copy, Check, Sun, Calendar } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { useAppStore } from "@/store/useAppStore";
import { useToast } from "@/hooks/use-toast";

type Complexity = "simple" | "medium" | "complex";

const HOURS: Record<Complexity, number> = { simple: 3, medium: 6, complex: 10 };
const COMPLEXITY_LABELS: Record<Complexity, string> = { simple: "Simple", medium: "Medium", complex: "Complex" };
const COMPLEXITY_EXAMPLES: Record<Complexity, string> = {
  simple: "Shirt, Polo, T-Shirt, Trouser",
  medium: "Senator, Kaftan, 2-piece Suit, Gown",
  complex: "Agbada, Wedding Dress, 3-piece, Ball Gown",
};

function addDays(date: Date, days: number, skipSundays: boolean): Date {
  const d = new Date(date);
  let remaining = days;
  while (remaining > 0) {
    d.setDate(d.getDate() + 1);
    if (skipSundays && d.getDay() === 0) continue; // Skip Sunday
    remaining--;
  }
  return d;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-NG", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

export default function DeliveryDateCalculator() {
  const addRecentTool = useAppStore((s) => s.addRecentTool);
  const incrementUsage = useAppStore((s) => s.incrementUsage);
  const { toast } = useToast();
  useState(() => { addRecentTool("delivery-date"); });

  const [outfits, setOutfits] = useState(3);
  const [complexity, setComplexity] = useState<Complexity>("medium");
  const [tailors, setTailors] = useState(1);
  const [queueJobs, setQueueJobs] = useState(0);
  const [skipSundays, setSkipSundays] = useState(true);
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [hoursPerDay, setHoursPerDay] = useState(8);
  const [result, setResult] = useState<{
    date: Date;
    workloadHours: number;
    productionDays: number;
    queueDays: number;
    bufferDays: number;
    totalDays: number;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const calculate = async () => {
    const totalHours = outfits * HOURS[complexity];
    const workingHoursPerDay = tailors * hoursPerDay;
    const productionDays = Math.ceil(totalHours / workingHoursPerDay);
    const queueDelay = Math.floor(queueJobs * 0.5);
    const bufferDays = 2;
    const totalDays = productionDays + queueDelay + bufferDays;
    const start = startDate ? new Date(startDate + "T00:00:00") : new Date();
    const date = addDays(start, totalDays, skipSundays);
    setResult({ date, workloadHours: totalHours, productionDays, queueDays: queueDelay, bufferDays, totalDays });
    await incrementUsage();
  };

  const copyResult = () => {
    if (!result) return;
    const text = `Your order (${outfits} outfit${outfits !== 1 ? "s" : ""}, ${COMPLEXITY_LABELS[complexity].toLowerCase()} complexity) will be ready by ${formatDate(result.date)}.\n\n📅 Production: ${result.productionDays} day${result.productionDays !== 1 ? "s" : ""}\n⏳ Queue wait: ${result.queueDays} day${result.queueDays !== 1 ? "s" : ""}\n🛡️ Safety buffer: ${result.bufferDays} days\n━━━━━━━━━━━━━━\n📦 Estimated delivery: ${formatDate(result.date)}`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      toast({ title: "Copied", description: "Delivery estimate copied to clipboard" });
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const inp = "w-full text-sm rounded-xl px-3 py-2.5 outline-none border border-border bg-background text-foreground";
  const card = "bg-card border border-border rounded-2xl p-4";

  return (
    <div className="max-w-lg mx-auto">
      <PageHeader 
        title="Delivery Date Calculator" 
        subtitle="Stop guessing delivery dates" 
        backPath="/all-tools?cat=fabric"
        backLabel="Tailoring Tools"
      />

      <div className="px-4 py-5 space-y-4">
        <div className={card + " space-y-4"}>
          {/* Start Date */}
          <div>
            <label className="text-xs text-muted-foreground block mb-1.5">Start Date</label>
            <div className="relative">
              <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={`${inp} pl-9`}
              />
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">Defaults to today</p>
          </div>

          {/* Outfits */}
          <div>
            <label className="text-xs text-muted-foreground block mb-1.5">Number of Outfits</label>
            <div className="flex items-center gap-3">
              <button onClick={() => setOutfits(Math.max(1, outfits - 1))}
                className="w-10 h-10 rounded-xl border border-border bg-muted/30 flex items-center justify-center text-lg font-bold text-foreground active:scale-95">−</button>
              <span className="flex-1 text-center text-2xl font-bold text-foreground">{outfits}</span>
              <button onClick={() => setOutfits(Math.min(50, outfits + 1))}
                className="w-10 h-10 rounded-xl border border-border bg-muted/30 flex items-center justify-center text-lg font-bold text-foreground active:scale-95">+</button>
            </div>
          </div>

          {/* Complexity */}
          <div>
            <label className="text-xs text-muted-foreground block mb-1.5">Outfit Complexity</label>
            <div className="grid grid-cols-3 gap-2">
              {(["simple", "medium", "complex"] as Complexity[]).map((c) => (
                <button key={c} onClick={() => setComplexity(c)}
                  className={`py-2.5 rounded-xl text-xs font-semibold border transition-all active:scale-95 ${complexity === c ? "" : "border-border bg-transparent text-muted-foreground"}`}
                  style={complexity === c ? { background: "rgba(212,160,32,0.15)", borderColor: "rgba(212,160,32,0.4)", color: "hsl(43,82%,60%)" } : undefined}>
                  {COMPLEXITY_LABELS[c]}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1.5">
              ~{HOURS[complexity]} hrs/outfit · {COMPLEXITY_EXAMPLES[complexity]}
            </p>
          </div>

          {/* Tailors */}
          <div>
            <label className="text-xs text-muted-foreground block mb-1.5">Number of Tailors Working</label>
            <div className="flex items-center gap-3">
              <button onClick={() => setTailors(Math.max(1, tailors - 1))}
                className="w-10 h-10 rounded-xl border border-border bg-muted/30 flex items-center justify-center text-lg font-bold text-foreground active:scale-95">−</button>
              <span className="flex-1 text-center text-2xl font-bold text-foreground">{tailors}</span>
              <button onClick={() => setTailors(Math.min(10, tailors + 1))}
                className="w-10 h-10 rounded-xl border border-border bg-muted/30 flex items-center justify-center text-lg font-bold text-foreground active:scale-95">+</button>
            </div>
          </div>

          {/* Hours per day */}
          <div>
            <label className="text-xs text-muted-foreground block mb-1.5">Hours Per Day: <span className="font-bold text-foreground">{hoursPerDay}h</span></label>
            <input
              type="range"
              min={4}
              max={12}
              step={1}
              value={hoursPerDay}
              onChange={(e) => setHoursPerDay(parseInt(e.target.value))}
              className="w-full accent-primary"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>4h</span><span>8h</span><span>12h</span>
            </div>
          </div>

          {/* Queue */}
          <div>
            <label className="text-xs text-muted-foreground block mb-1.5">Existing Jobs in Queue</label>
            <div className="flex gap-2 mb-2">
              {[0, 2, 5, 10].map((v) => (
                <button key={v} onClick={() => setQueueJobs(v)}
                  className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${queueJobs === v ? "bg-primary/10 border-primary text-primary" : "bg-card border-border text-muted-foreground hover:border-primary/30"}`}>
                  {v}
                </button>
              ))}
            </div>
            <input
              type="number"
              min={0}
              max={100}
              value={queueJobs}
              onFocus={(e) => e.target.select()}
              onChange={(e) => {
                const val = e.target.value;
                if (val === "") {
                  setQueueJobs(0);
                } else {
                  setQueueJobs(Math.max(0, parseInt(val, 10) || 0));
                }
              }}
              className={inp}
              placeholder="Or type custom number"
            />
          </div>

          {/* Skip Sundays toggle */}
          <div className="flex items-center justify-between py-1">
            <div className="flex items-center gap-2">
              <Sun size={14} className="text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Skip Sundays</span>
            </div>
            <button
              onClick={() => setSkipSundays(!skipSundays)}
              className={`w-11 h-6 rounded-full transition-all relative ${skipSundays ? "bg-primary" : "bg-muted-foreground/30"}`}
            >
              <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all shadow-sm ${skipSundays ? "right-0.5" : "left-0.5"}`} />
            </button>
          </div>
        </div>

        {/* Calculate button */}
        <button onClick={calculate}
          className="w-full py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.97]"
          style={{ background: "linear-gradient(135deg, hsl(43,82%,50%), hsl(43,90%,62%))", color: "hsl(218,50%,8%)" }}>
          <CalendarClock size={16} /> Calculate Delivery Date
        </button>

        {/* Result */}
        {result && (
          <div className="rounded-2xl p-5 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300" style={{ background: "rgba(212,160,32,0.06)", border: "1px solid rgba(212,160,32,0.25)" }}>
            {/* Header with copy */}
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "hsl(43,82%,60%)" }}>Delivery Estimate</p>
              <button onClick={copyResult} className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground hover:text-white transition-colors">
                {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>

            {/* Date */}
            <div className="text-center py-3">
              <p className="text-2xl font-extrabold" style={{ color: "hsl(43,82%,60%)", fontFamily: "'Playfair Display', serif" }}>
                {formatDate(result.date)}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {result.totalDays} total day{result.totalDays !== 1 ? "s" : ""}{skipSundays ? " (excluding Sundays)" : ""}
              </p>
            </div>

            {/* Breakdown */}
            <div className="space-y-2">
              <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-muted/20">
                <span className="text-xs text-muted-foreground">📅 Production</span>
                <span className="text-xs font-bold text-foreground">{result.productionDays} day{result.productionDays !== 1 ? "s" : ""} ({result.workloadHours} hrs ÷ {tailors} tailor{tailors !== 1 ? "s" : ""} × {hoursPerDay}h)</span>
              </div>
              <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-muted/20">
                <span className="text-xs text-muted-foreground">⏳ Queue wait</span>
                <span className="text-xs font-bold text-foreground">{result.queueDays} day{result.queueDays !== 1 ? "s" : ""} ({queueJobs} job{queueJobs !== 1 ? "s" : ""} ahead)</span>
              </div>
              <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-muted/20">
                <span className="text-xs text-muted-foreground">🛡️ Safety buffer</span>
                <span className="text-xs font-bold text-foreground">{result.bufferDays} days</span>
              </div>
              <div className="flex items-center justify-between px-3 py-2 rounded-xl font-bold" style={{ background: "rgba(212,160,32,0.1)" }}>
                <span className="text-xs" style={{ color: "hsl(43,82%,60%)" }}>📦 Total</span>
                <span className="text-xs" style={{ color: "hsl(43,82%,60%)" }}>{result.totalDays} days</span>
              </div>
            </div>

            {startDate !== new Date().toISOString().split('T')[0] && (
              <p className="text-[10px] text-muted-foreground text-center">Starting from {formatDate(new Date(startDate + "T00:00:00"))}</p>
            )}

            {/* Reset */}
            <button onClick={() => setResult(null)}
              className="w-full flex items-center justify-center gap-1.5 text-xs font-medium text-muted-foreground py-1 active:scale-95 hover:text-white transition-colors">
              <RefreshCw size={11} /> Reset
            </button>
          </div>
        )}

        {/* Empty state */}
        {!result && (
          <div className="text-center py-8 rounded-2xl border border-dashed border-border">
            <CalendarClock size={28} className="mx-auto text-muted-foreground/20 mb-3" />
            <p className="text-xs text-muted-foreground">Fill in the details and press Calculate</p>
            <p className="text-[10px] text-muted-foreground/50 mt-1">Get a realistic delivery estimate</p>
          </div>
        )}
      </div>
    </div>
  );
}