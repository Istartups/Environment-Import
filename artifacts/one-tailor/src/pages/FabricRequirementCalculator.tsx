import { useState } from "react";
import { Shirt, RefreshCw, ChevronDown, ChevronUp, Copy, Check } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { useAppStore } from "@/store/useAppStore";
import { useToast } from "@/hooks/use-toast";

type Gender = "male" | "female";
type Height = "short" | "medium" | "tall";
type BodySize = "S" | "M" | "L" | "XL" | "XXL";

interface FabricOutput {
  main: number;
  lining: number;
  interfacing: number;
  extra: { name: string; yards: number }[];
}

// ─── Expanded Garment List ──────────────────────────────────────────────────

const GARMENT_CATEGORIES = [
  {
    name: "Male Nigerian",
    garments: [
      { id: "senator", label: "Senator", gender: "male" as const },
      { id: "agbada", label: "Agbada (3-piece)", gender: "male" as const },
      { id: "buba-sokoto", label: "Buba & Sokoto", gender: "male" as const },
      { id: "kaftan", label: "Kaftan", gender: "male" as const },
      { id: "jalabia", label: "Jalabia", gender: "male" as const },
      { id: "babban-riga", label: "Babban Riga", gender: "male" as const },
      { id: "isi-agu", label: "Isi Agu Set", gender: "male" as const },
      { id: "danshiki", label: "Danshiki (3-piece)", gender: "male" as const },
      { id: "igbo-chief", label: "Igbo Chief Outfit", gender: "male" as const },
      { id: "yoruba-set", label: "Yoruba Traditional Set", gender: "male" as const },
      { id: "short-native", label: "Short Sleeve Native", gender: "male" as const },
      { id: "long-native", label: "Long Sleeve Native", gender: "male" as const },
      { id: "kaftan-emirate", label: "Kaftan (Emirate Style)", gender: "male" as const },
      { id: "gambari", label: "Gambari Gown", gender: "male" as const },
    ],
  },
  {
    name: "Female Nigerian",
    garments: [
      { id: "iro-buba", label: "Iro & Buba", gender: "female" as const },
      { id: "wrapper-blouse", label: "Wrapper & Blouse", gender: "female" as const },
      { id: "ankara-gown", label: "Ankara Gown", gender: "female" as const },
      { id: "lace-gown", label: "Lace Gown", gender: "female" as const },
      { id: "aso-ebi", label: "Aso Ebi Set", gender: "female" as const },
      { id: "boubou", label: "Boubou Gown", gender: "female" as const },
      { id: "abaya", label: "Abaya", gender: "female" as const },
      { id: "kaba-slit", label: "Kaba & Slit", gender: "female" as const },
      { id: "peplum-set", label: "Peplum Top & Skirt", gender: "female" as const },
      { id: "gele", label: "Gele (Headwrap)", gender: "female" as const },
      { id: "ankara-skirt-blouse", label: "Ankara Skirt & Blouse", gender: "female" as const },
    ],
  },
  {
    name: "Wedding & Occasion",
    garments: [
      { id: "wedding-dress", label: "Wedding Dress", gender: "female" as const },
      { id: "traditional-bride", label: "Traditional Bride", gender: "female" as const },
      { id: "groom-agbada", label: "Groom's Agbada", gender: "male" as const },
      { id: "aso-ebi-guest-f", label: "Aso Ebi Guest (Female)", gender: "female" as const },
      { id: "aso-ebi-guest-m", label: "Aso Ebi Guest (Male)", gender: "male" as const },
      { id: "mermaid-gown", label: "Mermaid Gown", gender: "female" as const },
      { id: "ball-gown", label: "Ball Gown", gender: "female" as const },
      { id: "evening-gown", label: "Evening Gown", gender: "female" as const },
      { id: "chieftaincy", label: "Chieftaincy Outfit", gender: "male" as const },
    ],
  },
  {
    name: "Formal & Work",
    garments: [
      { id: "suit", label: "Suit (2-piece)", gender: "both" as const },
      { id: "blazer", label: "Blazer", gender: "both" as const },
      { id: "shirt", label: "Shirt", gender: "both" as const },
      { id: "corporate-dress", label: "Corporate Dress", gender: "female" as const },
      { id: "shift-dress", label: "Shift Dress", gender: "female" as const },
      { id: "tunic-trouser", label: "Tunic & Trouser Set", gender: "female" as const },
      { id: "shirt-trouser", label: "Shirt & Trouser Combo", gender: "male" as const },
    ],
  },
  {
    name: "Casual",
    garments: [
      { id: "polo", label: "Polo", gender: "both" as const },
      { id: "tshirt", label: "T-Shirt", gender: "both" as const },
      { id: "hoodie", label: "Hoodie", gender: "both" as const },
      { id: "jeans", label: "Jeans", gender: "both" as const },
      { id: "skirt", label: "Skirt", gender: "female" as const },
      { id: "jumpsuit", label: "Jumpsuit", gender: "female" as const },
      { id: "co-ord-set", label: "Co-Ord Set", gender: "female" as const },
      { id: "kimono", label: "Kimono Style", gender: "both" as const },
      { id: "caftan-casual", label: "Caftan", gender: "both" as const },
      { id: "off-shoulder", label: "Off-Shoulder Gown", gender: "female" as const },
      { id: "corset-dress", label: "Corset Dress", gender: "female" as const },
    ],
  },
  {
    name: "Children",
    garments: [
      { id: "kids-native-m", label: "Kids Native (Boy)", gender: "male" as const },
      { id: "kids-native-f", label: "Kids Native (Girl)", gender: "female" as const },
      { id: "school-uniform-m", label: "School Uniform (Boy)", gender: "male" as const },
      { id: "school-uniform-f", label: "School Uniform (Girl)", gender: "female" as const },
      { id: "flower-girl", label: "Flower Girl Dress", gender: "female" as const },
      { id: "page-boy", label: "Page Boy Outfit", gender: "male" as const },
    ],
  },
  {
    name: "Other",
    garments: [
      { id: "trouser-only", label: "Trouser Only", gender: "both" as const },
      { id: "african-suit", label: "African Suit", gender: "male" as const },
      { id: "dashiki", label: "Dashiki Outfit", gender: "both" as const },
      { id: "kente", label: "Kente Outfit", gender: "both" as const },
      { id: "kitenge", label: "Kitenge Dress", gender: "female" as const },
    ],
  },
];

const SIZE_FACTOR: Record<BodySize, number> = { S: -0.25, M: 0, L: 0.25, XL: 0.5, XXL: 0.75 };
const HEIGHT_FACTOR: Record<Height, number> = { short: -0.25, medium: 0, tall: 0.5 };

function calculateFabric(garment: string, height: Height, bodySize: BodySize): FabricOutput {
  const hf = HEIGHT_FACTOR[height];
  const sf = SIZE_FACTOR[bodySize];
  const adj = hf + sf;

  const lookup: Record<string, FabricOutput> = {
    // Male Nigerian
    "senator":              { main: 4 + adj,  lining: 2,             interfacing: 0.5, extra: [] },
    "agbada":               { main: 12 + adj, lining: 4 + adj * 0.5, interfacing: 1,   extra: [{ name: "Embroidery thread", yards: 2 }] },
    "buba-sokoto":          { main: 5 + adj,  lining: 0,             interfacing: 0.25, extra: [] },
    "kaftan":               { main: 6 + adj,  lining: 2,             interfacing: 0.5,  extra: [] },
    "jalabia":              { main: 5 + adj,  lining: 0,             interfacing: 0.25, extra: [] },
    "babban-riga":          { main: 10 + adj, lining: 3,             interfacing: 1,    extra: [] },
    "isi-agu":              { main: 5 + adj,  lining: 2,             interfacing: 0.5,  extra: [{ name: "Cap", yards: 0.5 }] },
    "danshiki":             { main: 10 + adj, lining: 3,             interfacing: 1,    extra: [] },
    "igbo-chief":           { main: 8 + adj,  lining: 3,             interfacing: 0.75, extra: [{ name: "Wrapper", yards: 3 }, { name: "Cap", yards: 0.5 }] },
    "yoruba-set":           { main: 6 + adj,  lining: 0,             interfacing: 0.25, extra: [{ name: "Fila Cap", yards: 0.5 }] },
    "short-native":         { main: 3.5 + adj, lining: 1.5,         interfacing: 0.25, extra: [] },
    "long-native":          { main: 4.5 + adj, lining: 2,           interfacing: 0.5,  extra: [] },
    "kaftan-emirate":       { main: 7 + adj,  lining: 2.5,         interfacing: 0.75, extra: [] },
    "gambari":              { main: 8 + adj,  lining: 2,           interfacing: 0.5,  extra: [] },

    // Female Nigerian
    "iro-buba":             { main: 6 + adj,  lining: 0,             interfacing: 0,    extra: [{ name: "Gele", yards: 2 }] },
    "wrapper-blouse":       { main: 5 + adj,  lining: 0,             interfacing: 0,    extra: [{ name: "Gele", yards: 2 }] },
    "ankara-gown":          { main: 6 + adj,  lining: 2.5 + adj * 0.5, interfacing: 0.5, extra: [] },
    "lace-gown":            { main: 6 + adj,  lining: 3,             interfacing: 0.5,  extra: [] },
    "aso-ebi":              { main: 6 + adj,  lining: 2.5,           interfacing: 0.5,  extra: [{ name: "Gele", yards: 2 }] },
    "boubou":               { main: 7 + adj,  lining: 2,             interfacing: 0.25, extra: [] },
    "abaya":                { main: 5 + adj,  lining: 0,             interfacing: 0,    extra: [] },
    "kaba-slit":            { main: 5 + adj,  lining: 2,             interfacing: 0.5,  extra: [] },
    "peplum-set":           { main: 4.5 + adj, lining: 2,           interfacing: 0.5,  extra: [] },
    "gele":                 { main: 2,        lining: 0,             interfacing: 0,    extra: [] },
    "ankara-skirt-blouse":  { main: 4 + adj,  lining: 1.5,           interfacing: 0.25, extra: [] },

    // Wedding & Occasion
    "wedding-dress":        { main: 12 + adj * 2, lining: 8 + adj,  interfacing: 1,    extra: [{ name: "Tulle/Veil", yards: 5 }] },
    "traditional-bride":    { main: 8 + adj,  lining: 4,             interfacing: 0.75, extra: [{ name: "Gele", yards: 2.5 }, { name: "Wrapper", yards: 4 }] },
    "groom-agbada":         { main: 14 + adj, lining: 5,             interfacing: 1.5,  extra: [{ name: "Embroidery", yards: 2.5 }] },
    "aso-ebi-guest-f":      { main: 5 + adj,  lining: 2,             interfacing: 0.5,  extra: [{ name: "Gele", yards: 2 }] },
    "aso-ebi-guest-m":      { main: 5 + adj,  lining: 2,             interfacing: 0.5,  extra: [] },
    "mermaid-gown":         { main: 5 + adj,  lining: 3,             interfacing: 0.75, extra: [] },
    "ball-gown":            { main: 10 + adj, lining: 6,             interfacing: 1,    extra: [] },
    "evening-gown":         { main: 6 + adj * 1.5, lining: 4 + adj, interfacing: 0.5, extra: [] },
    "chieftaincy":          { main: 10 + adj, lining: 4,             interfacing: 1,    extra: [{ name: "Cap", yards: 0.5 }] },

    // Formal & Work
    "suit":                 { main: 4 + adj,  lining: 3 + adj * 0.5, interfacing: 1.5, extra: [{ name: "Trouser", yards: 2 + adj * 0.5 }] },
    "blazer":               { main: 2.5 + adj, lining: 2 + adj * 0.5, interfacing: 1,   extra: [] },
    "shirt":                { main: 2.5 + adj, lining: 0,             interfacing: 0.25, extra: [] },
    "corporate-dress":      { main: 3.5 + adj, lining: 2,             interfacing: 0.5,  extra: [] },
    "shift-dress":          { main: 3 + adj,  lining: 1.5,            interfacing: 0.25, extra: [] },
    "tunic-trouser":        { main: 4 + adj,  lining: 2,              interfacing: 0.5,  extra: [] },
    "shirt-trouser":        { main: 4 + adj,  lining: 1.5,            interfacing: 0.5,  extra: [] },

    // Casual
    "polo":                 { main: 1.5 + adj, lining: 0,             interfacing: 0,    extra: [] },
    "tshirt":               { main: 1.5 + adj, lining: 0,             interfacing: 0,    extra: [] },
    "hoodie":               { main: 2.5 + adj, lining: 0,             interfacing: 0,    extra: [] },
    "jeans":                { main: 2.5 + adj, lining: 0,             interfacing: 0,    extra: [] },
    "skirt":                { main: 2.5 + adj * 0.3, lining: 1.5,     interfacing: 0.5,  extra: [] },
    "jumpsuit":             { main: 4.5 + adj, lining: 2,             interfacing: 0.5,  extra: [] },
    "co-ord-set":           { main: 4 + adj,  lining: 2,              interfacing: 0.5,  extra: [] },
    "kimono":               { main: 3 + adj,  lining: 0,              interfacing: 0,    extra: [] },
    "caftan-casual":        { main: 5 + adj,  lining: 1.5,            interfacing: 0.25, extra: [] },
    "off-shoulder":         { main: 4.5 + adj, lining: 2,             interfacing: 0.5,  extra: [] },
    "corset-dress":         { main: 3.5 + adj, lining: 2.5,           interfacing: 1,    extra: [] },

    // Children (half adult fabric)
    "kids-native-m":        { main: 2.5 + adj * 0.5, lining: 1,       interfacing: 0.25, extra: [] },
    "kids-native-f":        { main: 2.5 + adj * 0.5, lining: 1,       interfacing: 0.25, extra: [] },
    "school-uniform-m":     { main: 2 + adj * 0.5,   lining: 0,       interfacing: 0,    extra: [] },
    "school-uniform-f":     { main: 2 + adj * 0.5,   lining: 0,       interfacing: 0,    extra: [] },
    "flower-girl":          { main: 3 + adj * 0.5,   lining: 2,       interfacing: 0.25, extra: [] },
    "page-boy":             { main: 2.5 + adj * 0.5, lining: 1.5,     interfacing: 0.25, extra: [] },

    // Other
    "trouser-only":         { main: 2 + adj,  lining: 1,               interfacing: 0.5,  extra: [] },
    "african-suit":         { main: 5 + adj,  lining: 3,               interfacing: 1.5,  extra: [] },
    "dashiki":              { main: 4 + adj,  lining: 0,               interfacing: 0.25, extra: [] },
    "kente":                { main: 8 + adj,  lining: 2,               interfacing: 0.5,  extra: [] },
    "kitenge":              { main: 6 + adj,  lining: 2,               interfacing: 0.5,  extra: [] },
  };

  const base = lookup[garment] ?? { main: 4, lining: 2, interfacing: 0.5, extra: [] };
  const round = (n: number) => Math.max(0.25, Math.round(n * 4) / 4);
  return {
    main: round(base.main),
    lining: round(base.lining),
    interfacing: round(base.interfacing),
    extra: base.extra.map((e) => ({ ...e, yards: round(e.yards) })),
  };
}

export default function FabricRequirementCalculator() {
  const addRecentTool = useAppStore((s) => s.addRecentTool);
  const incrementUsage = useAppStore((s) => s.incrementUsage);
  const { toast } = useToast();
  useState(() => { addRecentTool("fabric-requirement"); });

  const [gender, setGender] = useState<Gender>("male");
  const [garment, setGarment] = useState<string>("");
  const [height, setHeight] = useState<Height>("medium");
  const [bodySize, setBodySize] = useState<BodySize>("M");
  const [result, setResult] = useState<FabricOutput | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const filteredCategories = GARMENT_CATEGORIES.map((cat) => ({
    ...cat,
    garments: cat.garments.filter((g) => g.gender === gender || g.gender === "both"),
  })).filter((cat) => cat.garments.length > 0);

  const selectedGarmentLabel = GARMENT_CATEGORIES
    .flatMap((c) => c.garments)
    .find((g) => g.id === garment)?.label || "Select garment";

  const handleCalculate = async () => {
    if (!garment) return;
    setResult(calculateFabric(garment, height, bodySize));
    await incrementUsage();
  };

  const copyResult = () => {
    if (!result) return;
    let text = `${selectedGarmentLabel}: ${result.main} yds main fabric`;
    if (result.lining > 0) text += `, ${result.lining} yds lining`;
    if (result.interfacing > 0) text += `, ${result.interfacing} yds interfacing`;
    result.extra.forEach((e) => { text += `, ${e.yards} yds ${e.name}`; });
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      toast({ title: "Copied", description: text });
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const chip = (active: boolean) =>
    `px-3 py-2 rounded-xl text-xs font-semibold border transition-all active:scale-95 ${active ? "" : "border-border bg-transparent text-muted-foreground"}`;
  const chipStyle = (active: boolean) =>
    active ? { background: "rgba(212,160,32,0.15)", borderColor: "rgba(212,160,32,0.4)", color: "hsl(43,82%,60%)" } : undefined;

  return (
    <div className="max-w-lg mx-auto">
      <PageHeader 
        title="Fabric Requirement" 
        subtitle="Estimate fabric needs instantly" 
        backPath="/all-tools?cat=fabric"
        backLabel="Tailoring Tools"
      />
      <div className="px-4 py-5 space-y-4">
        <div className="bg-card border border-border rounded-2xl p-4 space-y-4">
          {/* Gender */}
          <div>
            <label className="text-xs text-muted-foreground block mb-2">Gender</label>
            <div className="flex gap-2">
              {(["male", "female"] as Gender[]).map((g) => (
                <button key={g} onClick={() => { setGender(g); setGarment(""); setExpandedCategory(null); setResult(null); }}
                  className={`flex-1 ${chip(gender === g)}`} style={chipStyle(gender === g)}>
                  {g === "male" ? "Male" : "Female"}
                </button>
              ))}
            </div>
          </div>

          {/* Garment Style — Accordion */}
          <div>
            <label className="text-xs text-muted-foreground block mb-2">
              Garment Style
              {garment && (
                <span className="ml-2 text-[10px] font-bold" style={{ color: "hsl(43,82%,60%)" }}>
                  — {selectedGarmentLabel}
                </span>
              )}
            </label>
            <div className="space-y-2">
              {filteredCategories.map((cat) => {
                const isExpanded = expandedCategory === cat.name;
                return (
                  <div key={cat.name} className="border border-border rounded-xl overflow-hidden">
                    <button
                      onClick={() => setExpandedCategory(isExpanded ? null : cat.name)}
                      className="w-full flex items-center justify-between px-3 py-2.5 bg-muted/20 text-xs font-bold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        {cat.name}
                        <span className="text-[10px] font-medium normal-case tracking-normal text-muted-foreground/60">({cat.garments.length})</span>
                      </span>
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                    {isExpanded && (
                      <div className="p-2.5 flex flex-wrap gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
                        {cat.garments.map((g) => (
                          <button key={g.id} onClick={() => { setGarment(g.id); setExpandedCategory(null); setResult(null); }}
                            className={chip(garment === g.id)} style={chipStyle(garment === g.id)}>
                            {g.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Height */}
          <div>
            <label className="text-xs text-muted-foreground block mb-2">Customer Height</label>
            <div className="grid grid-cols-3 gap-2">
              {([["short", "Short"], ["medium", "Medium"], ["tall", "Tall"]] as [Height, string][]).map(([h, label]) => (
                <button key={h} onClick={() => { setHeight(h); setResult(null); }}
                  className={chip(height === h)} style={chipStyle(height === h)}>{label}</button>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1.5">Short &lt;5′4″ · Medium 5′4″–5′10″ · Tall &gt;5′10″</p>
          </div>

          {/* Body Size */}
          <div>
            <label className="text-xs text-muted-foreground block mb-2">Body Size</label>
            <div className="flex gap-2">
              {(["S", "M", "L", "XL", "XXL"] as BodySize[]).map((s) => (
                <button key={s} onClick={() => { setBodySize(s); setResult(null); }}
                  className={`flex-1 ${chip(bodySize === s)}`} style={chipStyle(bodySize === s)}>{s}</button>
              ))}
            </div>
          </div>
        </div>

        {/* Calculate Button */}
        <button onClick={handleCalculate} disabled={!garment}
          className="w-full py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.97] disabled:opacity-40"
          style={{ background: "linear-gradient(135deg, hsl(43,82%,50%), hsl(43,90%,62%))", color: "hsl(218,50%,8%)" }}>
          <Shirt size={16} /> Calculate Fabric Requirement
        </button>

        {/* Result */}
        {result && (
          <div className="rounded-2xl p-5 space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300" style={{ background: "rgba(212,160,32,0.06)", border: "1px solid rgba(212,160,32,0.25)" }}>
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "hsl(43,82%,60%)" }}>Fabric Requirement</p>
              <button onClick={copyResult} className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground hover:text-white transition-colors">
                {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <div className="space-y-2">
              <FabricRow label="Main Fabric" yards={result.main} />
              {result.lining > 0 && <FabricRow label="Lining" yards={result.lining} />}
              {result.interfacing > 0 && <FabricRow label="Interfacing" yards={result.interfacing} />}
              {result.extra.map((e) => <FabricRow key={e.name} label={e.name} yards={e.yards} />)}
            </div>
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              Estimates for 45″ width fabric. Add 0.5–1 yd for patterns/nap or one-way designs.
            </p>
            <button onClick={() => { setGarment(""); setResult(null); }}
              className="w-full flex items-center justify-center gap-1.5 text-xs font-medium text-muted-foreground pt-1 active:scale-95 hover:text-white transition-colors">
              <RefreshCw size={11} /> Reset Selection
            </button>
          </div>
        )}

        {/* No selection hint */}
        {!garment && (
          <div className="text-center py-8 rounded-2xl border border-dashed border-border">
            <Shirt size={28} className="mx-auto text-muted-foreground/20 mb-3" />
            <p className="text-xs text-muted-foreground">Select gender, tap a category, choose a garment</p>
            <p className="text-[10px] text-muted-foreground/50 mt-1">Then press Calculate</p>
          </div>
        )}
      </div>
    </div>
  );
}

function FabricRow({ label, yards }: { label: string; yards: number }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
      <span className="text-sm text-foreground/80">{label}</span>
      <span className="font-bold text-sm" style={{ color: "hsl(43,82%,60%)" }}>{yards} yards</span>
    </div>
  );
}