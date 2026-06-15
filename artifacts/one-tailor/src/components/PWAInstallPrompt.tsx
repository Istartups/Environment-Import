import { useState, useEffect, useCallback } from "react";
import { useAppStore } from "@/store/useAppStore";

const DISMISS_KEY = "ot-pwa-install-dismissed";
const SNOOZE_MS = 3 * 24 * 60 * 60 * 1000; // 3 days

function isStandalone() {
  return window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as any).standalone === true;
}

function isIOSDevice() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
}

function wasDismissed() {
  try {
    const ts = localStorage.getItem(DISMISS_KEY);
    if (!ts) return false;
    return Date.now() - Number(ts) < SNOOZE_MS;
  } catch { return false; }
}

function dismiss() {
  try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch {}
}

const BENEFITS = [
  { icon: "⚡", text: "Works offline — no internet needed" },
  { icon: "🔒", text: "Keeps all your data safe & private" },
  { icon: "🚀", text: "Faster than any browser tab" },
];

const IOS_STEPS = [
  { icon: "↑", label: "Tap the Share button in Safari" },
  { icon: "＋", label: 'Scroll and tap "Add to Home Screen"' },
  { icon: "✓",  label: 'Tap "Add" to confirm' },
];

export default function PWAInstallPrompt() {
  const appName  = useAppStore((s) => s.appName);
  const appLogo  = useAppStore((s) => s.appLogo);

  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [visible, setVisible]   = useState(false);
  const [ios, setIos]           = useState(false);
  const [leaving, setLeaving]   = useState(false);

  useEffect(() => {
    if (isStandalone() || wasDismissed()) return;

    if (isIOSDevice()) {
      setIos(true);
      const t = setTimeout(() => setVisible(true), 4000);
      return () => clearTimeout(t);
    }

    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      const t = setTimeout(() => setVisible(true), 3500);
      return () => clearTimeout(t);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const close = useCallback(() => {
    setLeaving(true);
    dismiss();
    setTimeout(() => setVisible(false), 400);
  }, []);

  const handleInstall = useCallback(async () => {
    if (ios) { close(); return; }
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") dismiss();
    setDeferredPrompt(null);
    setVisible(false);
  }, [deferredPrompt, ios, close]);

  if (!visible) return null;

  const logoSrc = appLogo ?? "/onetailor-logo.png";
  const name    = appName || "OneTailor";

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={close}
        style={{
          position: "fixed", inset: 0, zIndex: 9990,
          background: "rgba(0,0,0,0.75)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          animation: leaving ? "fadeOut 0.4s forwards" : "fadeIn 0.3s forwards",
        }}
      />

      {/* Card - Fully rounded */}
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 9991,
          width: "calc(100% - 32px)",
          maxWidth: 400,
          animation: leaving ? "scaleDown 0.4s cubic-bezier(.4,0,.2,1) forwards" : "scaleUp 0.45s cubic-bezier(.34,1.2,.64,1) forwards",
        }}
      >
        <div style={{
          width: "100%",
          background: "linear-gradient(160deg, hsl(218,52%,10%) 0%, hsl(218,48%,14%) 100%)",
          border: "1px solid rgba(212,160,32,0.25)",
          borderRadius: "32px",
          padding: "28px 24px 32px",
          boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5), 0 0 0 1px rgba(212,160,32,0.08) inset",
          position: "relative",
        }}>
          {/* Close button - rounded */}
          <button
            onClick={close}
            style={{
              position: "absolute", top: 16, right: 16,
              background: "rgba(255,255,255,0.1)",
              border: "none", borderRadius: "100px",
              width: 32, height: 32, cursor: "pointer",
              color: "rgba(255,255,255,0.6)", fontSize: 16,
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.2)";
              e.currentTarget.style.color = "#fff";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.1)";
              e.currentTarget.style.color = "rgba(255,255,255,0.6)";
            }}
          >✕</button>

          {/* Header with logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
            <div style={{
              width: 64, height: 64, borderRadius: 20,
              overflow: "hidden",
              border: "2px solid rgba(212,160,32,0.5)",
              boxShadow: "0 0 24px rgba(212,160,32,0.3)",
              flexShrink: 0,
              background: "#fff",
            }}>
              <img src={logoSrc} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
            <div>
              <div style={{
                fontFamily: "'Playfair Display', serif",
                fontWeight: 800, fontSize: 22,
                background: "linear-gradient(135deg, #F0E8C8 0%, #d4a020 50%, #F0E8C8 100%)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}>{name}</div>
              <div style={{ fontSize: 12, color: "rgba(212,160,32,0.75)", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", marginTop: 4 }}>
                Install App
              </div>
            </div>
          </div>

          {/* Value headline */}
          <div style={{
            fontSize: 24, fontWeight: 800, color: "#F0E8C8",
            lineHeight: 1.25, marginBottom: 8,
            fontFamily: "'Playfair Display', serif",
          }}>
            Your tailoring empire,<br/>
            <span style={{ color: "#d4a020" }}>always at your fingertips.</span>
          </div>
          <p style={{ fontSize: 13, color: "rgba(226,232,240,0.7)", marginBottom: 24, lineHeight: 1.6 }}>
            Install {name} once — open it like a native app, no browser needed.
          </p>

          {!ios ? (
            <>
              {/* Benefits - rounded icons */}
              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 28 }}>
                {BENEFITS.map((b) => (
                  <div key={b.text} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 12,
                      background: "rgba(212,160,32,0.12)",
                      border: "1px solid rgba(212,160,32,0.3)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 16, flexShrink: 0,
                    }}>{b.icon}</div>
                    <span style={{ fontSize: 13, color: "rgba(226,232,240,0.9)", fontWeight: 500 }}>{b.text}</span>
                  </div>
                ))}
              </div>

              {/* Install button - fully rounded */}
              <button
                onClick={handleInstall}
                style={{
                  width: "100%", padding: "16px 0",
                  background: "linear-gradient(135deg, #d4a020 0%, #f0c040 50%, #d4a020 100%)",
                  backgroundSize: "200% 100%",
                  border: "none", borderRadius: "100px", cursor: "pointer",
                  color: "#000", fontWeight: 800, fontSize: 16,
                  letterSpacing: "0.02em",
                  boxShadow: "0 4px 20px rgba(212,160,32,0.4)",
                  animation: "shimmerBtn 2.5s ease-in-out infinite",
                  marginBottom: 12,
                  transition: "transform 0.2s ease, box-shadow 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "scale(1.02)";
                  e.currentTarget.style.boxShadow = "0 6px 25px rgba(212,160,32,0.5)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                  e.currentTarget.style.boxShadow = "0 4px 20px rgba(212,160,32,0.4)";
                }}
              >
                ⚡ Install App Now
              </button>
            </>
          ) : (
            <>
              {/* iOS Instructions */}
              <div style={{ marginBottom: 24 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: "rgba(212,160,32,0.9)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 16 }}>
                  Safari — follow these steps:
                </p>
                {IOS_STEPS.map((step, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 14,
                      background: "rgba(212,160,32,0.15)",
                      border: "1px solid rgba(212,160,32,0.35)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 18, fontWeight: 800, color: "#d4a020", flexShrink: 0,
                    }}>{step.icon}</div>
                    <span style={{ fontSize: 13, color: "rgba(226,232,240,0.9)", fontWeight: 500 }}>{step.label}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={close}
                style={{
                  width: "100%", padding: "16px 0",
                  background: "linear-gradient(135deg, #d4a020 0%, #f0c040 50%, #d4a020 100%)",
                  border: "none", borderRadius: "100px", cursor: "pointer",
                  color: "#000", fontWeight: 800, fontSize: 16,
                  boxShadow: "0 4px 20px rgba(212,160,32,0.4)",
                  marginBottom: 12,
                  transition: "transform 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "scale(1.02)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                }}
              >
                Got it, I'll install now!
              </button>
            </>
          )}

          {/* Remind later link */}
          <button
            onClick={close}
            style={{
              width: "100%", background: "none", border: "none", cursor: "pointer",
              color: "rgba(148,163,184,0.6)", fontSize: 12, padding: "8px 0",
              transition: "color 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "rgba(212,160,32,0.7)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "rgba(148,163,184,0.6)";
            }}
          >
            Remind me later
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }
        @keyframes fadeOut { from { opacity:1 } to { opacity:0 } }
        @keyframes scaleUp { 
          from { 
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.9);
          } 
          to { 
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
          } 
        }
        @keyframes scaleDown { 
          from { 
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
          } 
          to { 
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.95);
          } 
        }
        @keyframes shimmerBtn {
          0%,100% { background-position: 0% 50% }
          50% { background-position: 100% 50% }
        }
      `}</style>
    </>
  );
}