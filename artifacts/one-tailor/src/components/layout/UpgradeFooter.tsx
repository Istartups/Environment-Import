import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Crown, ChevronRight, X, ExternalLink } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";

const PRO_TEASER_KEY = "pro_teaser_last_shown";

function shouldShowNow(frequency: string): boolean {
  if (!frequency || frequency === "always") return true;
  const raw = localStorage.getItem(PRO_TEASER_KEY);
  if (!raw) return true;
  const last = parseInt(raw, 10);
  if (isNaN(last)) return true;
  const elapsed = Date.now() - last;
  if (frequency === "daily")   return elapsed > 86_400_000;
  if (frequency === "weekly")  return elapsed > 7 * 86_400_000;
  if (frequency === "monthly") return elapsed > 30 * 86_400_000;
  return true;
}

export default function UpgradeFooter() {
  const [, setLocation] = useLocation();
  const [showProPopup, setShowProPopup] = useState(false);
  const [proTeaserVisible, setProTeaserVisible] = useState(false);

  const isPremium          = useAppStore(s => s.isPremium);
  const pendingPremiumRequest = useAppStore(s => s.pendingPremiumRequest);
  const freeUpgradeTitle   = useAppStore(s => s.freeUpgradeTitle);
  const freeUpgradeMessage = useAppStore(s => s.freeUpgradeMessage);
  const freeUpgradeCTA     = useAppStore(s => s.freeUpgradeCTA);
  const proUpgradeTitle    = useAppStore(s => s.proUpgradeTitle);
  const proUpgradeMessage  = useAppStore(s => s.proUpgradeMessage);
  const proUpgradeLink     = useAppStore(s => s.proUpgradeLink);
  const proUpgradeButtonText = useAppStore(s => s.proUpgradeButtonText);
  const proTeaserFrequency = useAppStore(s => s.proTeaserFrequency);

  useEffect(() => {
    if (isPremium && proUpgradeMessage) {
      const visible = shouldShowNow(proTeaserFrequency);
      setProTeaserVisible(visible);
      if (visible) {
        localStorage.setItem(PRO_TEASER_KEY, String(Date.now()));
      }
    }
  }, [isPremium, proUpgradeMessage, proTeaserFrequency]);

  if (!isPremium) {
    return (
      <div className="px-4 pb-4 pt-2">
        <div
          onClick={() => setLocation(pendingPremiumRequest ? "/pre-unlock" : "/premium-details")}
          className="relative overflow-hidden p-6 rounded-[2.5rem] cursor-pointer active:scale-[0.98] transition-all group"
          style={{ background: "hsl(218,44%,11%)", border: "1px solid rgba(212,160,32,0.2)" }}
        >
          <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full blur-3xl group-hover:opacity-80 transition-opacity" style={{ background: "rgba(212,160,32,0.08)" }} />
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center border group-hover:scale-110 transition-transform shrink-0" style={{ background: "rgba(212,160,32,0.12)", borderColor: "rgba(212,160,32,0.25)" }}>
              <Crown size={28} style={{ color: "hsl(43,82%,55%)" }} />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-black text-white leading-tight">
                ⭐ {pendingPremiumRequest ? "Resume Upgrade" : (freeUpgradeTitle || "Unlock Premium")}
              </h3>
              <p className="text-xs text-white/70 mt-1 line-clamp-2">
                {pendingPremiumRequest
                  ? "Finish your payment to activate Premium"
                  : (freeUpgradeMessage || "Unlock professional features: unlimited client records, full measurement history, custom templates, and advanced tailoring tools.")}
              </p>
              {!pendingPremiumRequest && (
                <span className="inline-flex items-center justify-center mt-3 px-6 py-2.5 rounded-xl text-xs font-black text-black active:scale-95 transition-all" style={{ background: "hsl(43,82%,55%)" }}>
                  {freeUpgradeCTA || "Unlock Premium Now"} →
                </span>
              )}
            </div>
            <ChevronRight style={{ color: "hsl(43,82%,55%)" }} className="shrink-0" />
          </div>
        </div>
      </div>
    );
  }

  if (isPremium && proUpgradeMessage && proTeaserVisible) {
    return (
      <>
        <div className="px-4 pb-4 pt-2">
          <div
            onClick={() => setShowProPopup(true)}
            className="relative overflow-hidden p-6 rounded-[2.5rem] cursor-pointer active:scale-[0.98] transition-all group"
            style={{ background: "hsl(218,44%,11%)", border: "1px solid rgba(212,160,32,0.2)" }}
          >
            <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full blur-3xl group-hover:opacity-80 transition-opacity" style={{ background: "rgba(212,160,32,0.08)" }} />
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center border group-hover:scale-110 transition-transform shrink-0" style={{ background: "rgba(212,160,32,0.12)", borderColor: "rgba(212,160,32,0.25)" }}>
                <Crown size={28} style={{ color: "hsl(43,82%,55%)" }} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-black text-white leading-tight">⭐ {proUpgradeTitle || "Unlock OneTailor Pro"}</h3>
                <p className="text-xs text-white/70 mt-1 line-clamp-2">{proUpgradeMessage}</p>
              </div>
              <ChevronRight style={{ color: "hsl(43,82%,55%)" }} className="shrink-0" />
            </div>
          </div>
        </div>

        {showProPopup && (
          <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-card w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl border border-primary/20 animate-in zoom-in-95 duration-200">
              <div className="p-4 flex items-center justify-between border-b border-border bg-muted/20">
                <div className="flex items-center gap-2 text-primary">
                  <Crown size={18} />
                  <h3 className="text-sm font-black uppercase tracking-wider">{proUpgradeTitle || "OneTailor Pro"}</h3>
                </div>
                <button onClick={() => setShowProPopup(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-muted/50 hover:bg-muted transition-colors">
                  <X size={16} />
                </button>
              </div>
              <div className="p-6 space-y-6">
                <p className="text-sm text-foreground font-medium leading-relaxed">{proUpgradeMessage}</p>
                <div className="space-y-3">
                  <a
                    href={proUpgradeLink || "#"}
                    target={proUpgradeLink ? "_blank" : "_self"}
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center w-full py-4 bg-primary text-primary-foreground rounded-2xl font-bold text-sm active:scale-[0.98] transition-all shadow-lg shadow-primary/20 gap-2"
                  >
                    <ExternalLink size={16} />
                    {proUpgradeButtonText}
                  </a>
                  <button onClick={() => setShowProPopup(false)} className="w-full py-3 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors">
                    Maybe Later
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
}
