import { useLocation } from "wouter";
import { Clock, AlertTriangle, XCircle, Loader2, ChevronRight, MessageCircle, Sparkles } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";

const DEFAULTS = {
  payment_submitted: {
    icon: Clock,
    iconColor: "#60a5fa",
    bg: "linear-gradient(135deg, rgba(59,130,246,0.08) 0%, rgba(59,130,246,0.04) 100%)",
    border: "rgba(59,130,246,0.3)",
    label: "Under Review",
    message: "Your payment proof is in the queue — our team is on it! 🎉",
    next: "You'll get an email confirmation once approved. Usually within a few hours.",
    action: null as string | null,
  },
  pending: {
    icon: AlertTriangle,
    iconColor: "#f59e0b",
    bg: "linear-gradient(135deg, rgba(245,158,11,0.08) 0%, rgba(245,158,11,0.04) 100%)",
    border: "rgba(245,158,11,0.3)",
    label: "Complete Your Upgrade",
    message: "You're one step away from unlocking the full power of OneTailor Premium! ⭐",
    next: "Tap below to finish your payment and activate your premium tools.",
    action: "Finish Upgrade — Resume Now" as string | null,
  },
  rejected: {
    icon: XCircle,
    iconColor: "#f87171",
    bg: "linear-gradient(135deg, rgba(239,68,68,0.08) 0%, rgba(239,68,68,0.04) 100%)",
    border: "rgba(239,68,68,0.3)",
    label: "Payment Not Verified",
    message: "We couldn't confirm your last payment. No worries — let's sort it out.",
    next: "Please retry with a clear receipt image, or use Paystack for instant activation.",
    action: "Retry Payment" as string | null,
  },
};

export function PremiumStatusBanner() {
  const account                  = useAppStore((s) => s.account);
  const isPremium                = useAppStore((s) => s.isPremium);
  const pendingPremiumRequest    = useAppStore((s) => s.pendingPremiumRequest);
  const premiumRequestStatus     = useAppStore((s) => s.premiumRequestStatus);
  const pendingTitle             = useAppStore((s) => s.pendingTitle);
  const pendingBody              = useAppStore((s) => s.pendingBody);
  const pendingCTA               = useAppStore((s) => s.pendingCTA);
  const adminNotificationPhone   = useAppStore((s) => s.adminNotificationPhone);
  const adminNotificationMessage = useAppStore((s) => s.adminNotificationMessage);
  const [, navigate]             = useLocation();

  if (!account || isPremium || !pendingPremiumRequest) return null;

  const baseConfig = premiumRequestStatus && premiumRequestStatus in DEFAULTS
    ? DEFAULTS[premiumRequestStatus as keyof typeof DEFAULTS]
    : DEFAULTS.pending;

  const config = premiumRequestStatus === "pending"
    ? {
        ...baseConfig,
        label: pendingTitle || baseConfig.label,
        message: pendingBody || baseConfig.message,
        action: pendingCTA || baseConfig.action,
      }
    : baseConfig;

  const Icon = config.icon;

  const buildAdminWhatsApp = () => {
    if (!adminNotificationPhone) return null;
    const phone = adminNotificationPhone.replace(/\D/g, "");
    const rawMsg = adminNotificationMessage || "Hello, I submitted my payment proof for OneTailor Premium. Please review my account — {{name}}.";
    const msg = rawMsg.replace(/\{\{name\}\}/g, account.businessName || "");
    return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
  };

  const adminWaLink = buildAdminWhatsApp();

  return (
    <div
      className="mb-5 rounded-2xl p-4 flex gap-3 relative overflow-hidden"
      style={{ 
        background: config.bg, 
        border: `1px solid ${config.border}`,
        borderRadius: "20px",
        backdropFilter: "blur(10px)",
      }}
    >
      {/* Animated gradient overlay for pending status */}
      {premiumRequestStatus === "pending" && (
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            background: "linear-gradient(90deg, transparent, rgba(245,158,11,0.2), transparent)",
            animation: "shimmer 2s infinite",
          }}
        />
      )}

      {/* Icon with rounded container */}
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
        style={{ 
          background: config.bg, 
          border: `1px solid ${config.border}`,
          borderRadius: "14px",
        }}
      >
        {premiumRequestStatus === "payment_submitted" ? (
          <Loader2 size={20} style={{ color: config.iconColor }} className="animate-spin" />
        ) : (
          <Icon size={20} style={{ color: config.iconColor }} />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <p className="text-xs font-black uppercase tracking-wider" style={{ color: config.iconColor }}>
            {config.label}
          </p>
          {premiumRequestStatus === "pending" && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20">
              <Sparkles size={10} className="text-amber-500" />
              <span className="text-[9px] font-bold text-amber-500">ACTION REQUIRED</span>
            </div>
          )}
        </div>

        <p className="text-sm font-medium text-foreground/85 leading-relaxed">{config.message}</p>

        {premiumRequestStatus !== "pending" && (
          <p className="text-xs text-muted-foreground leading-relaxed mt-1.5">{baseConfig.next}</p>
        )}

        <div className="flex flex-wrap gap-4 mt-3">
          {config.action && (
            <button
              onClick={() => navigate("/pre-unlock")}
              className="flex items-center gap-1.5 text-xs font-bold transition-all duration-200 hover:gap-2 active:scale-95"
              style={{ color: config.iconColor }}
            >
              <span>{config.action}</span>
              <ChevronRight size={12} className="transition-transform group-hover:translate-x-0.5" />
            </button>
          )}

          {premiumRequestStatus === "payment_submitted" && adminWaLink && (
            <a
              href={adminWaLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full transition-all duration-200 hover:gap-2 active:scale-95"
              style={{ 
                background: "rgba(37,211,102,0.15)",
                color: "#25d366",
                borderRadius: "100px",
              }}
            >
              <MessageCircle size={12} /> 
              <span>Notify Admin on WhatsApp</span>
            </a>
          )}
        </div>
      </div>

      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}