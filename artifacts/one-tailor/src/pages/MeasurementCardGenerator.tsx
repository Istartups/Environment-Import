import { useState, useRef } from "react";
import {
  Phone, MessageCircle, Mail, MapPin,
  Instagram, Facebook, Youtube, Users,
  Quote, Download, Printer, Copy, Share2, ShieldCheck
} from "lucide-react";
import { useLocation } from "wouter";
import { useAppStore } from "@/store/useAppStore";
import { useToast } from "@/hooks/use-toast";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";

const DEFAULT_GLOBAL_NOTE = "Measurements are taken with care. Please confirm before cutting.";

function getUnitSymbol(unit: "inches" | "cm" | undefined): string {
  if (unit === "cm") return "cm";
  return '"';
}

type Step = "select_customer" | "select_record" | "preview_card";

interface CardTheme {
  name: string;
  bg: string;
  fg: string;
  hexAccent: string;
  cardBg: string;
}

const THEMES: CardTheme[] = [
  { name: "Midnight Gold",  bg: "#0f0f1a", fg: "#f5f0e8", hexAccent: "#c9a84c", cardBg: "#1a1a2e" },
  { name: "Ivory & Slate",  bg: "#f8f7f4", fg: "#1c1c1c", hexAccent: "#3d5a80", cardBg: "#ffffff" },
  { name: "Forest",         bg: "#0d1f15", fg: "#e8f5e9", hexAccent: "#4caf7d", cardBg: "#152a1e" },
  { name: "Rose Quartz",    bg: "#fff0f3", fg: "#2d1b20", hexAccent: "#c75b7a", cardBg: "#ffffff" },
  { name: "Obsidian",       bg: "#111111", fg: "#eeeeee", hexAccent: "#888888", cardBg: "#1a1a1a" },
];

export default function MeasurementCardGenerator() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const customers        = useAppStore(s => s.customers);
  const measurements     = useAppStore(s => s.measurements);
  const businessProfile  = useAppStore(s => s.businessProfile);
  const appName          = useAppStore(s => s.appName);
  const appLogo          = useAppStore(s => s.appLogo);

  const [step, setStep]                       = useState<Step>("select_customer");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [selectedRecordId, setSelectedRecordId]     = useState<string | null>(null);
  const [themeIndex, setThemeIndex]           = useState(0);
  const [customNote, setCustomNote]           = useState("");
  const [loading, setLoading]                 = useState(false);
  const [sharing, setSharing]                 = useState(false);
  const [search, setSearch]                   = useState("");

  const cardRef = useRef<HTMLDivElement>(null);

  const theme          = THEMES[themeIndex];
  const selectedCustomer = customers.find(c => c.id === selectedCustomerId) ?? null;
  const customerRecords  = measurements.filter(m => m.customerId === selectedCustomerId);
  const selectedRecord   = customerRecords.find(r => r.id === selectedRecordId) ?? null;

  const entries = selectedRecord
    ? Object.entries(selectedRecord.measurements).filter(([k]) => !k.startsWith("_"))
    : [];

  const socials       = businessProfile?.socials;
  const addrDetails   = businessProfile?.addressDetails;
  const addrLandmark  = addrDetails?.landmark;
  const addrState     = addrDetails?.state;
  const addrCountry   = addrDetails?.country;
  const addrStateCountry = [addrState, addrCountry].filter(Boolean).join(", ");

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search)
  );

  async function captureCardBlob(): Promise<Blob | null> {
    const el = cardRef.current;
    if (!el) return null;
    try {
      const { default: html2canvas } = await import("html2canvas");
      const canvas = await html2canvas(el, { useCORS: true, scale: 2, backgroundColor: null });
      return new Promise(resolve => canvas.toBlob(b => resolve(b), "image/png", 1.0));
    } catch {
      return null;
    }
  }

  async function handleDownload() {
    setLoading(true);
    try {
      const blob = await captureCardBlob();
      if (!blob) { toast({ title: "Error", description: "Could not capture card." }); return; }
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `${selectedCustomer?.name ?? "card"}-measurement-card.png`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "Saved!", description: "Measurement card saved to your device." });
    } finally {
      setLoading(false);
    }
  }

  function handlePrint() {
    window.print();
  }

  function copyCardAsText() {
    if (!selectedRecord || !selectedCustomer) return;
    const lines: string[] = [];
    lines.push(`${businessProfile?.name ?? appName}`);
    lines.push(`${selectedRecord.category} — ${selectedCustomer.name}`);
    lines.push("");
    entries.forEach(([k, v]) => lines.push(`${k}: ${v}${getUnitSymbol(selectedRecord.unit)}`));
    if (customNote || DEFAULT_GLOBAL_NOTE) lines.push("", customNote || DEFAULT_GLOBAL_NOTE);
    navigator.clipboard.writeText(lines.join("\n")).then(() =>
      toast({ title: "Copied", description: "Card text copied to clipboard." })
    );
  }

  async function handleShareToCustomer() {
    setSharing(true);
    try {
      const blob = await captureCardBlob();
      if (blob && navigator.canShare?.({ files: [new File([blob], "card.png", { type: "image/png" })] })) {
        await navigator.share({
          title: "Your Measurement Card",
          files: [new File([blob], `${selectedCustomer?.name}-card.png`, { type: "image/png" })],
        });
      } else {
        const lines: string[] = [];
        lines.push(`${businessProfile?.name ?? appName} — Measurement Card`);
        lines.push(`Customer: ${selectedCustomer?.name}`);
        lines.push(`Category: ${selectedRecord?.category}`);
        lines.push("");
        entries.forEach(([k, v]) => lines.push(`${k}: ${v}${getUnitSymbol(selectedRecord?.unit)}`));
        const text = encodeURIComponent(lines.join("\n"));
        const phone = selectedCustomer?.phone?.replace(/\D/g, "") ?? "";
        window.open(`https://wa.me/${phone}?text=${text}`, "_blank");
      }
    } catch {
      toast({ title: "Share cancelled" });
    } finally {
      setSharing(false);
    }
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <PageHeader title="Measurement Card" onBack={() => setLocation("/")} />

      <div className="max-w-lg mx-auto px-4 pt-4 space-y-6">

        {/* ── STEP 1: SELECT CUSTOMER ── */}
        {step === "select_customer" && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground px-1">Select a customer to generate their card.</p>
            <input
              placeholder="Search by name or phone…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full text-sm rounded-2xl px-4 py-3 bg-card border border-border focus:border-primary/50 outline-none"
            />
            {filteredCustomers.length === 0 ? (
              <p className="text-center text-muted-foreground text-sm py-8">No customers found.</p>
            ) : (
              <div className="space-y-2">
                {filteredCustomers.map(c => (
                  <button key={c.id}
                    onClick={() => { setSelectedCustomerId(c.id); setStep("select_record"); }}
                    className="w-full flex items-center gap-3 bg-card border border-border rounded-2xl px-4 py-3 text-left hover:border-primary/40 transition-colors active:scale-[0.99]">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-black text-primary text-sm">
                      {c.name[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate">{c.name}</p>
                      <p className="text-xs text-muted-foreground">{c.phone}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── STEP 2: SELECT RECORD ── */}
        {step === "select_record" && selectedCustomer && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 bg-card border border-border rounded-2xl px-4 py-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-black text-primary text-sm">
                {selectedCustomer.name[0]?.toUpperCase()}
              </div>
              <div>
                <p className="font-bold text-sm">{selectedCustomer.name}</p>
                <p className="text-xs text-muted-foreground">{selectedCustomer.phone}</p>
              </div>
            </div>

            <p className="text-sm text-muted-foreground px-1">Select a measurement record:</p>

            {customerRecords.length === 0 ? (
              <p className="text-center text-muted-foreground text-sm py-8">No measurements found for this customer.</p>
            ) : (
              <div className="space-y-2">
                {customerRecords.map(r => (
                  <button key={r.id}
                    onClick={() => { setSelectedRecordId(r.id); setStep("preview_card"); }}
                    className="w-full flex items-center justify-between bg-card border border-border rounded-2xl px-4 py-3 text-left hover:border-primary/40 transition-colors active:scale-[0.99]">
                    <div>
                      <p className="font-bold text-sm">{r.category}</p>
                      <p className="text-xs text-muted-foreground">{Object.keys(r.measurements).filter(k => !k.startsWith("_")).length} fields · {r.unit}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">{new Date(r.createdAt).toLocaleDateString()}</p>
                  </button>
                ))}
              </div>
            )}

            <button onClick={() => { setStep("select_customer"); setSelectedCustomerId(null); }}
              className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-primary transition-colors w-full text-center pt-2">
              ← Back to customers
            </button>
          </div>
        )}

        {/* ── STEP 3: CARD PREVIEW ── */}
        {step === "preview_card" && selectedCustomer && selectedRecord && (
          <div className="space-y-6">
            {/* Theme switcher */}
            <div className="flex gap-2 overflow-x-auto pb-1">
              {THEMES.map((t, i) => (
                <button key={t.name} onClick={() => setThemeIndex(i)}
                  style={{ background: t.bg, border: i === themeIndex ? `2px solid ${t.hexAccent}` : "2px solid transparent" }}
                  className="flex-shrink-0 w-8 h-8 rounded-full transition-transform active:scale-90"
                  title={t.name} />
              ))}
            </div>

            {/* Card preview */}
            <div ref={cardRef}
              style={{ background: theme.bg, color: theme.fg, fontFamily: "serif" }}
              className="rounded-3xl p-6 shadow-2xl relative overflow-hidden">

              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-6">
                  <div className="flex-1 h-px" style={{background:`${theme.hexAccent}30`}} />
                  <span style={{color:theme.hexAccent,fontSize:9,opacity:0.65,letterSpacing:4}}>◆ ◆ ◆</span>
                  <div className="flex-1 h-px" style={{background:`${theme.hexAccent}30`}} />
                </div>
                <div className="flex flex-col items-center text-center space-y-2 pb-5">
                  {appLogo && (
                    <div className="w-16 h-16 rounded-full overflow-hidden" style={{border:`1px solid ${theme.hexAccent}40`}}>
                      <img src={appLogo} className="w-full h-full object-cover" alt="Logo" crossOrigin="anonymous" />
                    </div>
                  )}
                  <h2 className="text-lg font-black uppercase tracking-[0.2em]">{businessProfile?.name || appName}</h2>
                  {businessProfile?.tagline && <p className="text-[9px] italic opacity-45">{businessProfile.tagline}</p>}
                  <div className="flex items-center gap-4 justify-center opacity-45 text-[10px]">
                    {businessProfile?.phone && <span className="flex items-center gap-1"><Phone size={8} />{businessProfile.phone}</span>}
                    {socials?.whatsapp && <span className="flex items-center gap-1"><MessageCircle size={8} />{socials.whatsapp}</span>}
                    {businessProfile?.email && <span className="flex items-center gap-1"><Mail size={8} />{businessProfile.email}</span>}
                  </div>
                  {addrLandmark && <p className="text-[10px] opacity-38 flex items-center justify-center gap-1"><MapPin size={8} />{addrLandmark}{addrStateCountry ? `, ${addrStateCountry}` : ""}</p>}
                  {!addrLandmark && addrStateCountry && <p className="text-[10px] opacity-28 text-center">{addrStateCountry}</p>}
                  {!addrLandmark && !addrStateCountry && businessProfile?.address && <p className="text-[10px] opacity-38 flex items-center justify-center gap-1"><MapPin size={8} />{businessProfile.address}</p>}
                  {(socials?.instagram || socials?.facebook || socials?.tiktok || socials?.youtube) && (
                    <div className="flex flex-wrap gap-1.5 justify-center pt-1">
                      {socials?.instagram && <span style={{background:"rgba(255,255,255,0.08)",borderRadius:999,padding:"1px 5px",display:"inline-flex",alignItems:"center",gap:2}}><Instagram size={7} style={{opacity:0.7}} /><span style={{fontSize:7,fontWeight:700,opacity:0.7}}>@{socials.instagram}</span></span>}
                      {socials?.facebook && <span style={{background:"rgba(255,255,255,0.08)",borderRadius:999,padding:"1px 5px",display:"inline-flex",alignItems:"center",gap:2}}><Facebook size={7} style={{opacity:0.7}} /><span style={{fontSize:7,fontWeight:700,opacity:0.7}}>{socials.facebook}</span></span>}
                      {socials?.tiktok && <span style={{background:"rgba(255,255,255,0.08)",borderRadius:999,padding:"1px 5px",display:"inline-flex",alignItems:"center",gap:2}}><Users size={7} style={{opacity:0.7}} /><span style={{fontSize:7,fontWeight:700,opacity:0.7}}>@{socials.tiktok}</span></span>}
                      {socials?.youtube && <span style={{background:"rgba(255,255,255,0.08)",borderRadius:999,padding:"1px 5px",display:"inline-flex",alignItems:"center",gap:2}}><Youtube size={7} style={{opacity:0.7}} /><span style={{fontSize:7,fontWeight:700,opacity:0.7}}>{socials.youtube}</span></span>}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 my-3">
                  <div className="flex-1 h-px" style={{background:`${theme.hexAccent}20`}} />
                  <div className="w-1 h-1 rotate-45" style={{background:`${theme.hexAccent}60`}} />
                  <div className="flex-1 h-px" style={{background:`${theme.hexAccent}20`}} />
                </div>
                <div className="text-center py-3">
                  <p className="text-[9px] opacity-28 uppercase tracking-[0.25em]">{selectedRecord.category}</p>
                  <p className="text-sm font-black uppercase tracking-[0.1em] mt-0.5">{selectedRecord.category}</p>
                  <div className="flex justify-center gap-6 mt-2 text-[9px] opacity-35">
                    <span>{selectedCustomer.name}</span>
                    <span>·</span>
                    <span>{new Date().toLocaleDateString("en-GB", {day:"2-digit",month:"short",year:"numeric"})}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-x-8 gap-y-6 py-5">
                  {entries.map(([k, v]) => (
                    <div key={k} className="text-center space-y-0.5">
                      <p className="text-[8px] font-black uppercase tracking-widest opacity-28">{k}</p>
                      <p className="text-xl font-black" style={{color:theme.hexAccent}}>{v}<span className="text-[9px] opacity-35 ml-0.5">{getUnitSymbol(selectedRecord.unit)}</span></p>
                      <div className="h-px w-8 mx-auto" style={{background:`${theme.hexAccent}30`}} />
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2 mt-4 mb-3">
                  <div className="flex-1 h-px" style={{background:`${theme.hexAccent}18`}} />
                  <div className="w-1 h-1 rotate-45" style={{background:`${theme.hexAccent}45`}} />
                  <div className="flex-1 h-px" style={{background:`${theme.hexAccent}18`}} />
                </div>
                <p className="text-[9px] opacity-28 italic text-center px-4">{customNote || DEFAULT_GLOBAL_NOTE}</p>
                <p className="text-[7px] opacity-15 uppercase tracking-[0.3em] text-center mt-2">{businessProfile?.name || appName}</p>
              </div>
            </div>

            {/* ── ACTIONS ── */}
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2 px-1 mb-1.5">
                  <Quote size={14} className="text-primary" />
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Card Note (Optional)</label>
                </div>
                <textarea
                  placeholder="Enter a custom instruction for this client..."
                  value={customNote}
                  onChange={e => setCustomNote(e.target.value)}
                  className="w-full text-sm rounded-2xl px-4 py-3 bg-card border border-border focus:border-primary/50 outline-none min-h-[80px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button onClick={handleDownload} disabled={loading || sharing}
                  className="h-14 bg-primary text-primary-foreground rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/20 active:scale-[0.98] transition-all disabled:opacity-50">
                  {loading ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Saving…</> : <><Download size={18} /> Save To Device</>}
                </button>
                <button onClick={handlePrint} disabled={loading || sharing}
                  className="h-14 bg-card border border-border rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-muted transition-colors active:scale-[0.98] disabled:opacity-50">
                  {loading ? <><span className="w-4 h-4 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" /> Preparing…</> : <><Printer size={18} /> Print Card</>}
                </button>
              </div>

              <button onClick={copyCardAsText}
                className="w-full h-12 bg-card border border-border rounded-2xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-muted transition-colors active:scale-[0.98]">
                <Copy size={14} /> Copy as Text
              </button>

              <button onClick={handleShareToCustomer} disabled={sharing || loading}
                className="w-full h-14 bg-green-500/10 border border-green-500/30 text-green-600 dark:text-green-400 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-green-500/20 transition-colors active:scale-[0.98] disabled:opacity-50">
                {sharing ? <><span className="w-4 h-4 border-2 border-green-500/40 border-t-green-500 rounded-full animate-spin" /> Preparing…</> : <><Share2 size={18} /> Share with {selectedCustomer.name}</>}
              </button>

              <Button onClick={() => setLocation("/invite")} variant="outline"
                className="w-full h-14 rounded-2xl border-primary/20 bg-primary/5 hover:bg-primary/10 font-bold text-primary transition-all">
                <Users className="w-5 h-5 mr-2" /> Invite Another Tailor
              </Button>

              <div className="flex flex-col gap-3 items-center pt-2">
                <button onClick={() => setStep("select_record")} className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-primary transition-colors">Back to Records</button>
                <div className="flex items-center gap-2 opacity-30">
                  <div className="h-px w-8 bg-muted-foreground" /><ShieldCheck size={12} /><div className="h-px w-8 bg-muted-foreground" />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
