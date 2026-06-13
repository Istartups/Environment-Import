import { useLocation } from "wouter";
import { AlertCircle, Home, ArrowRight, Grid3X3, MessageSquareText, Ruler } from "lucide-react";

export default function NotFound() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen w-full flex items-center justify-center px-4" style={{ background: "hsl(var(--background))" }}>
      <div className="w-full max-w-md text-center space-y-6">

        {/* App Logo / Name */}
        <div className="space-y-2">
          <div className="w-20 h-20 rounded-3xl mx-auto flex items-center justify-center" 
            style={{ background: "rgba(212,160,32,0.1)", border: "2px solid rgba(212,160,32,0.25)" }}>
            <span className="text-3xl font-black" style={{ color: "hsl(43,82%,55%)", fontFamily: "'Playfair Display', serif" }}>
              OT
            </span>
          </div>
          <p className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground">OneTailor</p>
        </div>

        {/* Error Message */}
        <div className="space-y-3">
          <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center"
            style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
            <AlertCircle size={32} className="text-red-400" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-foreground">Page Not Found</h1>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed px-4">
              The page you're looking for doesn't exist or may have been moved.
            </p>
            <p className="text-[10px] text-muted-foreground/50 mt-1 font-mono">Error 404</p>
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="space-y-3 pt-2">
          <button
            onClick={() => setLocation("/")}
            className="w-full py-4 bg-primary text-primary-foreground rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/20 active:scale-[0.98] transition-all"
          >
            <Home size={18} />
            Go to Dashboard
            <ArrowRight size={16} />
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setLocation("/all-tools")}
              className="py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
              style={{ background: "hsl(218,44%,11%)", border: "1px solid hsl(218,38%,18%)", color: "hsl(43,25%,88%)" }}
            >
              <Grid3X3 size={15} />
              Browse Tools
            </button>
            <button
              onClick={() => setLocation("/message-center")}
              className="py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
              style={{ background: "hsl(218,44%,11%)", border: "1px solid hsl(218,38%,18%)", color: "hsl(43,25%,88%)" }}
            >
              <MessageSquareText size={15} />
              Message Center
            </button>
          </div>

          <button
            onClick={() => setLocation("/add-customer")}
            className="w-full py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
            style={{ background: "hsl(218,44%,11%)", border: "1px solid hsl(218,38%,18%)", color: "hsl(43,25%,88%)" }}
          >
            <Ruler size={15} />
            Client Measurements
          </button>
        </div>

        <p className="text-[10px] text-muted-foreground/40">
          If you believe this is a mistake, please contact support.
        </p>
      </div>
    </div>
  );
}