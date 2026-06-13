import { useState, useEffect } from "react";
import { ScanLine, AlertTriangle, CheckCircle2, RefreshCw, Users, ChevronRight, Search, X } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { useAppStore } from "@/store/useAppStore";
import { getDeviceId } from "@/lib/utils";

interface Measurements {
  chest: string;
  waist: string;
  hip: string;
  shoulder: string;
  sleeveLeft: string;
  sleeveRight: string;
  length: string;
  collar: string;
  cuff: string;
  thigh: string;
  knee: string;
  inseam: string;
  bust: string;
  flare: string;
}

interface Warning {
  field: string;
  message: string;
  suggestion: string;
  severity: "error" | "warning";
}

interface Customer {
  id: number;
  name: string;
  phone: string;
}

interface MeasurementRecord {
  id: number;
  customerId: number;
  label: string;
  category: string;
  values: string;
  unit?: string;
  createdAt: string;
}

type GarmentType = "all" | "senator" | "suit" | "suitJacket" | "shirt" | "longSleeveShirt" | "shortSleeveShirt" | "trousers" | "waistcoat" | "traditional" | "agbada" | "kaftan";

const GARMENT_LABELS: Record<GarmentType, string> = {
  all:              "All Fields",
  senator:          "Senator / Native",
  suit:             "Suit",
  suitJacket:       "Suit Jacket",
  shirt:            "Shirt",
  longSleeveShirt:  "Long Sleeve Shirt",
  shortSleeveShirt: "Short Sleeve Shirt",
  trousers:         "Trousers",
  waistcoat:        "Waistcoat",
  traditional:      "Traditional Wear",
  agbada:           "Agbada",
  kaftan:           "Kaftan",
};

const GARMENT_FIELDS: Record<GarmentType, (keyof Measurements)[]> = {
  all:              ["chest", "waist", "hip", "shoulder", "sleeveLeft", "sleeveRight", "length", "collar", "cuff", "thigh", "knee", "inseam", "bust", "flare"],
  senator:          ["chest", "waist", "hip", "shoulder", "sleeveLeft", "sleeveRight", "length", "collar", "cuff"],
  suit:             ["chest", "waist", "hip", "shoulder", "sleeveLeft", "sleeveRight", "length", "thigh", "knee", "inseam"],
  suitJacket:       ["chest", "waist", "shoulder", "sleeveLeft", "sleeveRight", "length", "collar"],
  shirt:            ["chest", "waist", "shoulder", "sleeveLeft", "sleeveRight", "length", "collar", "cuff"],
  longSleeveShirt:  ["chest", "waist", "shoulder", "sleeveLeft", "sleeveRight", "length", "collar", "cuff"],
  shortSleeveShirt: ["chest", "waist", "shoulder", "sleeveLeft", "sleeveRight", "length", "collar"],
  trousers:         ["waist", "hip", "thigh", "knee", "inseam", "length"],
  waistcoat:        ["chest", "waist", "shoulder", "length"],
  traditional:      ["chest", "waist", "hip", "shoulder", "sleeveLeft", "sleeveRight", "length"],
  agbada:           ["chest", "shoulder", "sleeveLeft", "sleeveRight", "length"],
  kaftan:           ["chest", "waist", "shoulder", "sleeveLeft", "sleeveRight", "length", "cuff"],
};

const FIELD_LABELS: Record<keyof Measurements, string> = {
  chest: "Chest", waist: "Waist", hip: "Hip", shoulder: "Shoulder",
  sleeveLeft: "Left Sleeve", sleeveRight: "Right Sleeve", length: "Length",
  collar: "Collar", cuff: "Cuff", thigh: "Thigh", knee: "Knee",
  inseam: "Inseam", bust: "Bust", flare: "Flare",
};

const FIELD_PLACEHOLDERS: Record<keyof Measurements, string> = {
  chest: "e.g. 38", waist: "e.g. 32", hip: "e.g. 40", shoulder: "e.g. 16",
  sleeveLeft: "e.g. 24", sleeveRight: "e.g. 24", length: "e.g. 45",
  collar: "e.g. 15", cuff: "e.g. 8", thigh: "e.g. 22", knee: "e.g. 16",
  inseam: "e.g. 30", bust: "e.g. 36", flare: "e.g. 50",
};

// Map measurement field names from the system to our internal keys
const FIELD_KEY_MAP: Record<string, keyof Measurements> = {
  "chest": "chest", "chest/bust": "chest", "bust": "bust",
  "waist": "waist", "hip": "hip", "hips": "hip",
  "shoulder": "shoulder", "shoulders": "shoulder",
  "sleeve": "sleeveLeft", "left sleeve": "sleeveLeft", "right sleeve": "sleeveRight",
  "sleeve left": "sleeveLeft", "sleeve right": "sleeveRight",
  "length": "length", "full length": "length",
  "collar": "collar", "neck": "collar",
  "cuff": "cuff", "cuffs": "cuff",
  "thigh": "thigh", "knee": "knee",
  "inseam": "inseam", "flare": "flare",
};

function parseMeasurements(raw: string): Record<string, string> {
  if (!raw) return {};
  try {
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (typeof parsed === "object" && parsed !== null) return parsed as Record<string, string>;
    return {};
  } catch { return {}; }
}

function checkMeasurements(m: Measurements, unit: "inches" | "cm"): Warning[] {
  const factor = unit === "cm" ? 2.54 : 1;
  const parse = (v: string) => {
    const n = parseFloat(v);
    return isNaN(n) ? 0 : n / factor;
  };
  const chest      = parse(m.chest);
  const waist      = parse(m.waist);
  const hip        = parse(m.hip);
  const shoulder   = parse(m.shoulder);
  const sleeveL    = parse(m.sleeveLeft);
  const sleeveR    = parse(m.sleeveRight);
  const length     = parse(m.length);
  const collar     = parse(m.collar);
  const thigh      = parse(m.thigh);
  const knee       = parse(m.knee);
  const inseam     = parse(m.inseam);
  const bust       = parse(m.bust);
  const flare      = parse(m.flare);
  const warnings: Warning[] = [];

  if (chest > 0 && waist > 0 && waist > chest * 0.95)
    warnings.push({ field: "Waist", message: "Waist appears unusually large compared to chest.", suggestion: "Verify waist measurement. Possible swap with hip?", severity: "error" });

  if (hip > 0 && waist > 0 && hip < waist * 0.9)
    warnings.push({ field: "Hip", message: "Hip appears smaller than waist — this is unusual.", suggestion: "Check if waist and hip values were swapped.", severity: "warning" });

  if (chest > 0 && shoulder > 0 && shoulder < chest * 0.25)
    warnings.push({ field: "Shoulder", message: "Shoulder width seems very narrow for this chest size.", suggestion: "Verify shoulder measurement. Measured across back?", severity: "warning" });
  if (chest > 0 && shoulder > 0 && shoulder > chest * 0.65)
    warnings.push({ field: "Shoulder", message: "Shoulder width seems very wide for this chest size.", suggestion: "Verify shoulder measurement. May include arm?", severity: "warning" });

  if (sleeveL > 0 && sleeveL > 36)
    warnings.push({ field: "Left Sleeve", message: "Sleeve length is unusually long (over 36 inches).", suggestion: "Check if measurement includes shoulder to wrist correctly.", severity: "warning" });

  if (sleeveL > 0 && sleeveR > 0 && Math.abs(sleeveL - sleeveR) > 0.5)
    warnings.push({ field: "Sleeves", message: `Left (${sleeveL}") and right (${sleeveR}") sleeves differ by more than 0.5".`, suggestion: "Arms should be nearly equal. Re-measure both.", severity: "error" });

  if (length > 0 && length < 15)
    warnings.push({ field: "Length", message: "Length seems very short (under 15 inches).", suggestion: "Verify if this is full length or just bodice length.", severity: "warning" });

  if (chest > 0 && chest < 28)
    warnings.push({ field: "Chest", message: "Chest measurement seems very small.", suggestion: "Check if this is a child's measurement or measured incorrectly.", severity: "warning" });
  if (chest > 0 && chest > 60)
    warnings.push({ field: "Chest", message: "Chest measurement seems very large.", suggestion: "Verify measurement. Measured around fullest part?", severity: "warning" });

  if (collar > 0 && chest > 0 && collar > chest * 0.55)
    warnings.push({ field: "Collar", message: "Collar seems large relative to chest.", suggestion: "Collar should be about 40-50% of chest measurement.", severity: "warning" });

  if (thigh > 0 && knee > 0 && knee > thigh)
    warnings.push({ field: "Knee", message: "Knee measurement is larger than thigh — unusual.", suggestion: "Thigh should be wider than knee. Check if values are swapped.", severity: "error" });

  if (inseam > 0 && length > 0 && inseam > length * 0.8)
    warnings.push({ field: "Inseam", message: "Inseam is very close to total length.", suggestion: "Inseam is inner leg only. Length is total. Verify both.", severity: "warning" });

  if (bust > 0 && chest > 0 && Math.abs(bust - chest) > 8)
    warnings.push({ field: "Bust/Chest", message: "Bust and chest measurements differ significantly.", suggestion: "For male clients, these should be similar. Verify.", severity: "warning" });

  if (flare > 0 && hip > 0 && flare < hip * 0.8)
    warnings.push({ field: "Flare", message: "Flare is narrower than hip — garment won't fit over hips.", suggestion: "Flare should be wider than hip for dresses/gowns.", severity: "error" });

  if (chest > 0 && length > 0) {
    const ratio = chest / length;
    if (ratio > 1.3)
      warnings.push({ field: "Proportion", message: "Chest is very large compared to length.", suggestion: "Verify both measurements. Possible unit mismatch?", severity: "warning" });
    if (ratio < 0.5 && chest < 30)
      warnings.push({ field: "Proportion", message: "Very long garment relative to chest size.", suggestion: "Check if this is a child or if length was measured correctly.", severity: "warning" });
  }

  return warnings;
}

export default function MeasurementChecker() {
  const addRecentTool = useAppStore((s) => s.addRecentTool);
  const incrementUsage = useAppStore((s) => s.incrementUsage);
  useState(() => { addRecentTool("measurement-checker"); });

  const [unit, setUnit] = useState<"inches" | "cm">("inches");
  const [garmentType, setGarmentType] = useState<GarmentType>("all");
  const [measurements, setMeasurements] = useState<Measurements>({
    chest: "", waist: "", hip: "", shoulder: "",
    sleeveLeft: "", sleeveRight: "", length: "",
    collar: "", cuff: "", thigh: "", knee: "", inseam: "", bust: "", flare: "",
  });
  const [warnings, setWarnings] = useState<Warning[] | null>(null);
  const [loadedCustomerName, setLoadedCustomerName] = useState<string | null>(null);

  // Load from customer
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [loadingMeasurement, setLoadingMeasurement] = useState(false);

  useEffect(() => {
    if (showCustomerModal && customers.length === 0) {
      setLoadingCustomers(true);
      fetch(`/api/tailoring/customers?deviceId=${getDeviceId()}`)
        .then(r => r.json())
        .then(data => setCustomers(Array.isArray(data) ? data : []))
        .catch(() => setCustomers([]))
        .finally(() => setLoadingCustomers(false));
    }
  }, [showCustomerModal]);

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.phone.includes(customerSearch)
  );

  const loadCustomerMeasurement = async (customer: Customer) => {
    setLoadingMeasurement(true);
    try {
      const res = await fetch(`/api/tailoring/measurements/${customer.id}`);
      if (res.ok) {
        const records: MeasurementRecord[] = await res.json();
        if (records.length === 0) {
          toast({ title: "No measurements", description: `No measurements found for ${customer.name}.` });
        } else {
          // Get the most recent measurement
          const latest = records.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
          const vals = parseMeasurements(latest.values);

          // Detect unit
          if (latest.unit?.toUpperCase() === "CM" || latest.unit?.toUpperCase() === "CENTIMETERS") {
            setUnit("cm");
          } else {
            setUnit("inches");
          }

          // Try to match garment type from category
          const categoryLower = latest.category?.toLowerCase() || "";
          let matchedGarment: GarmentType = "all";
          if (categoryLower.includes("senator") || categoryLower.includes("native")) matchedGarment = "senator";
          else if (categoryLower.includes("suit jacket") || categoryLower.includes("blazer")) matchedGarment = "suitJacket";
          else if (categoryLower.includes("suit")) matchedGarment = "suit";
          else if (categoryLower.includes("long sleeve")) matchedGarment = "longSleeveShirt";
          else if (categoryLower.includes("short sleeve")) matchedGarment = "shortSleeveShirt";
          else if (categoryLower.includes("shirt")) matchedGarment = "shirt";
          else if (categoryLower.includes("trouser") || categoryLower.includes("pant")) matchedGarment = "trousers";
          else if (categoryLower.includes("waistcoat")) matchedGarment = "waistcoat";
          else if (categoryLower.includes("traditional")) matchedGarment = "traditional";
          else if (categoryLower.includes("agbada")) matchedGarment = "agbada";
          else if (categoryLower.includes("kaftan")) matchedGarment = "kaftan";
          setGarmentType(matchedGarment);

          // Map values to our fields
          const emptyMeasurements: Measurements = {
            chest: "", waist: "", hip: "", shoulder: "",
            sleeveLeft: "", sleeveRight: "", length: "",
            collar: "", cuff: "", thigh: "", knee: "", inseam: "", bust: "", flare: "",
          };

          Object.entries(vals).forEach(([k, v]) => {
            const key = k.toLowerCase().trim();
            // Try exact match first
            if (key in FIELD_KEY_MAP) {
              const mappedKey = FIELD_KEY_MAP[key];
              (emptyMeasurements as any)[mappedKey] = String(v);
            } else {
              // Try partial match
              for (const [mapKey, fieldKey] of Object.entries(FIELD_KEY_MAP)) {
                if (key.includes(mapKey) || mapKey.includes(key)) {
                  (emptyMeasurements as any)[fieldKey] = String(v);
                  break;
                }
              }
            }
          });

          setMeasurements(emptyMeasurements);
          setWarnings(null);
          setLoadedCustomerName(customer.name);
        }
      }
    } catch { /* silent */ }
    finally {
      setLoadingMeasurement(false);
      setShowCustomerModal(false);
      setCustomerSearch("");
    }
  };

  const visibleFields = GARMENT_FIELDS[garmentType];
  const inp = "w-full text-sm rounded-xl px-3 py-2.5 outline-none border border-border bg-background text-foreground";

  const check = async () => {
    setWarnings(checkMeasurements(measurements, unit));
    await incrementUsage();
  };

  const reset = () => {
    setMeasurements({ chest: "", waist: "", hip: "", shoulder: "", sleeveLeft: "", sleeveRight: "", length: "", collar: "", cuff: "", thigh: "", knee: "", inseam: "", bust: "", flare: "" });
    setWarnings(null);
    setLoadedCustomerName(null);
    setGarmentType("all");
  };

  const hasAnyValue = Object.values(measurements).some((v) => v.trim() !== "");

  return (
    <div className="max-w-lg mx-auto">
      <PageHeader 
        title="Measurement Checker" 
        subtitle="Catch measurement mistakes before production" 
        backPath="/all-tools?cat=measurements"
        backLabel="Tailoring Tools"
      />

      <div className="px-4 py-5 space-y-4">
        {/* Load from Customer */}
        <div className="space-y-2">
          <button
            onClick={() => setShowCustomerModal(true)}
            className="w-full flex items-center justify-between px-4 py-3 bg-card border border-border rounded-2xl text-sm font-bold text-muted-foreground hover:text-foreground transition-colors shadow-sm"
          >
            <div className="flex items-center gap-2">
              <Users size={16} className="text-primary" />
              <span>Load from Customer</span>
            </div>
            <ChevronRight size={16} />
          </button>
          {loadedCustomerName && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-primary/5 border border-primary/10">
              <Users size={12} className="text-primary" />
              <p className="text-[10px] font-bold text-primary">Loaded: {loadedCustomerName}</p>
              <button onClick={() => { setLoadedCustomerName(null); }} className="ml-auto text-muted-foreground hover:text-foreground">
                <X size={12} />
              </button>
            </div>
          )}
        </div>

        {/* Customer Selection Modal */}
        {showCustomerModal && (
          <div className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-sm flex items-end justify-center animate-in fade-in duration-200" onClick={() => setShowCustomerModal(false)}>
            <div className="bg-card w-full max-w-lg rounded-t-3xl overflow-hidden shadow-2xl border border-border border-b-0 animate-in slide-in-from-bottom-4 duration-300 pb-safe" onClick={e => e.stopPropagation()}>
              <div className="flex justify-center pt-3 pb-1"><div className="w-10 h-1 rounded-full bg-border" /></div>
              <div className="px-5 pb-5 pt-2">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-black">Load Customer Measurement</h3>
                  <button onClick={() => { setShowCustomerModal(false); setCustomerSearch(""); }} className="w-8 h-8 flex items-center justify-center rounded-full bg-muted/50"><X size={14} /></button>
                </div>
                <p className="text-[10px] text-muted-foreground mb-3">Select a customer to auto-fill their latest measurement record.</p>
                <div className="relative mb-3">
                  <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
                  <input autoFocus placeholder="Search customers..." value={customerSearch} onChange={e => setCustomerSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none bg-muted/30 border border-border focus:border-primary/50 transition-all" />
                </div>
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {loadingCustomers || loadingMeasurement ? (
                    <div className="flex items-center justify-center py-8"><div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin border-primary" /></div>
                  ) : filteredCustomers.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-8">{customerSearch ? "No matching customers" : "No customers yet"}</p>
                  ) : filteredCustomers.map(c => (
                    <button key={c.id} onClick={() => loadCustomerMeasurement(c)}
                      className="w-full flex items-center gap-3 p-3 rounded-2xl bg-muted/20 border border-border hover:border-primary/30 active:scale-[0.98] transition-all text-left">
                      <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">{c.name.charAt(0)}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate">{c.name}</p>
                        <p className="text-[10px] text-muted-foreground">{c.phone}</p>
                      </div>
                      <ChevronRight size={14} className="text-muted-foreground" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Unit + Garment Type */}
        <div className="bg-card border border-border rounded-2xl p-4 space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Unit</label>
            <div className="flex rounded-xl overflow-hidden border border-border">
              {(["inches", "cm"] as const).map((u) => (
                <button key={u} onClick={() => setUnit(u)}
                  className="px-4 py-1.5 text-xs font-semibold transition-all"
                  style={unit === u ? { background: "rgba(212,160,32,0.15)", color: "hsl(43,82%,60%)" } : { color: "hsl(218,20%,55%)" }}>
                  {u}
                </button>
              ))}
            </div>
          </div>

          {/* Garment Type Filter — 2 rows for all 11 types */}
          <div>
            <label className="text-[10px] font-bold text-muted-foreground uppercase mb-2 block">Garment Type</label>
            <div className="flex flex-wrap gap-1.5">
              {(Object.entries(GARMENT_LABELS) as [GarmentType, string][]).map(([gt, label]) => (
                <button key={gt} onClick={() => { setGarmentType(gt); setWarnings(null); }}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${garmentType === gt ? "bg-primary/10 border-primary text-primary" : "bg-muted/30 border-border text-muted-foreground hover:border-primary/30"}`}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Measurement Fields */}
          <div className="grid grid-cols-2 gap-3">
            {visibleFields.map((key) => (
              <div key={key}>
                <label className="text-[11px] text-muted-foreground block mb-1">{FIELD_LABELS[key]} ({unit})</label>
                <input type="number" min={0} step={0.5} placeholder={FIELD_PLACEHOLDERS[key]} value={measurements[key]}
                  onChange={(e) => setMeasurements((prev) => ({ ...prev, [key]: e.target.value }))}
                  className={inp} />
              </div>
            ))}
          </div>
        </div>

        <button onClick={check} disabled={!hasAnyValue}
          className="w-full py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.97] disabled:opacity-40"
          style={{ background: "linear-gradient(135deg, hsl(43,82%,50%), hsl(43,90%,62%))", color: "hsl(218,50%,8%)" }}>
          <ScanLine size={16} /> Check Measurements
        </button>

        {warnings !== null && (
          <div className="space-y-3">
            {warnings.length === 0 ? (
              <div className="rounded-2xl p-5 flex items-center gap-3" style={{ background: "rgba(212,160,32,0.06)", border: "1px solid rgba(212,160,32,0.25)" }}>
                <CheckCircle2 size={22} style={{ color: "hsl(43,82%,55%)" }} className="shrink-0" />
                <div>
                  <p className="font-bold text-sm text-foreground">All measurements look good!</p>
                  <p className="text-xs text-muted-foreground mt-0.5">No unusual combinations detected.</p>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 px-1">
                  <AlertTriangle size={14} style={{ color: "hsl(349,85%,65%)" }} />
                  <p className="text-xs font-semibold" style={{ color: "hsl(349,85%,65%)" }}>
                    {warnings.length} possible issue{warnings.length > 1 ? "s" : ""} found
                  </p>
                </div>
                {warnings.map((w, i) => (
                  <div key={i} className="rounded-xl p-4 flex items-start gap-3"
                    style={{ background: w.severity === "error" ? "rgba(224,85,85,0.08)" : "rgba(251,191,36,0.08)", border: `1px solid ${w.severity === "error" ? "rgba(224,85,85,0.25)" : "rgba(251,191,36,0.25)"}` }}>
                    <AlertTriangle size={16} style={{ color: w.severity === "error" ? "#e05555" : "hsl(43,95%,58%)", flexShrink: 0, marginTop: 1 }} />
                    <div className="space-y-1">
                      <p className="text-xs font-bold" style={{ color: w.severity === "error" ? "#e05555" : "hsl(43,95%,55%)" }}>{w.field}</p>
                      <p className="text-xs text-muted-foreground">{w.message}</p>
                      <p className="text-[10px] font-medium italic" style={{ color: "hsl(43,82%,60%)" }}>💡 {w.suggestion}</p>
                    </div>
                  </div>
                ))}
              </>
            )}
            <button onClick={reset} className="w-full flex items-center justify-center gap-1.5 text-xs font-medium text-muted-foreground py-1 active:scale-95 hover:text-foreground transition-colors">
              <RefreshCw size={11} /> Clear & Reset
            </button>
          </div>
        )}
      </div>
    </div>
  );
}