import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAppStore } from "@/store/useAppStore";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Smartphone, ChevronRight, Check, ArrowLeft, ShoppingBag } from "lucide-react";
import { motion } from "framer-motion";

interface DevicePlan {
  id: number;
  name: string;
  description: string | null;
  deviceCount: number;
  price: number;
  isActive: boolean;
  sortOrder: number;
}

export default function DevicePlans() {
  const [plans, setPlans] = useState<DevicePlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const currencySymbol = useAppStore((s) => s.currencySymbol);
  const currencyCode   = useAppStore((s) => s.currencyCode);
  const setSelectedPlan = useAppStore((s) => s.setSelectedPlan);
  const account = useAppStore((s) => s.account);

  useEffect(() => {
    if (!account) { navigate("/pre-unlock"); return; }
    fetch("/api/device-plans")
      .then(r => r.json())
      .then(data => setPlans(Array.isArray(data) ? data : []))
      .catch(() => toast({ title: "Error", description: "Could not load plans.", variant: "destructive" }))
      .finally(() => setLoading(false));
  }, []);

  const formatPrice = (p: number) =>
    new Intl.NumberFormat("en-NG", { style: "currency", currency: currencyCode || "NGN" })
      .format(p)
      .replace(currencyCode || "NGN", currencySymbol || "₦");

  const handleSelect = (plan: DevicePlan) => {
    setSelectedId(plan.id);
    setSelectedPlan({ id: plan.id, name: plan.name, price: plan.price, deviceCount: plan.deviceCount });
    setTimeout(() => navigate("/payment-method"), 250);
  };

  return (
    <div className="max-w-xl mx-auto px-4 pb-24 pt-6 space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate("/premium-activated")}
          className="w-9 h-9 rounded-xl border border-border flex items-center justify-center hover:bg-muted/50 transition-colors"
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 className="text-2xl font-black">Device Plans</h1>
          <p className="text-xs text-muted-foreground">Choose a plan to expand your license</p>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading plans…</p>
        </div>
      ) : plans.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4 text-center px-6">
          <div className="w-20 h-20 bg-muted/30 rounded-3xl flex items-center justify-center">
            <ShoppingBag size={36} className="text-muted-foreground/40" />
          </div>
          <div>
            <p className="font-bold text-foreground">No Plans Available</p>
            <p className="text-sm text-muted-foreground mt-1">Device expansion plans haven't been set up yet. Contact support for assistance.</p>
          </div>
          <button
            onClick={() => navigate("/premium-activated")}
            className="px-6 py-3 bg-card border border-border rounded-xl font-bold text-sm flex items-center gap-2"
          >
            <ArrowLeft size={14} /> Go Back
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground px-1">Select a plan to continue to payment.</p>
          {plans.map((plan, i) => (
            <motion.button
              key={plan.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              onClick={() => handleSelect(plan)}
              className={`w-full p-5 rounded-3xl border-2 text-left flex items-center gap-4 transition-all active:scale-[0.98] group ${
                selectedId === plan.id
                  ? "border-primary bg-primary/5"
                  : "border-border bg-card hover:border-primary/40"
              }`}
            >
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${
                selectedId === plan.id ? "bg-primary/20" : "bg-primary/10 group-hover:bg-primary/15"
              }`}>
                {selectedId === plan.id
                  ? <Check size={24} className="text-primary" />
                  : <Smartphone size={24} className="text-primary" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-black text-base text-foreground">{plan.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {plan.deviceCount} device{plan.deviceCount !== 1 ? "s" : ""} — lifetime access
                </p>
                {plan.description && (
                  <p className="text-[11px] text-muted-foreground/80 mt-1 leading-relaxed">{plan.description}</p>
                )}
              </div>
              <div className="text-right shrink-0">
                <p className="text-lg font-black text-primary">{formatPrice(plan.price)}</p>
                <p className="text-[9px] text-muted-foreground mt-0.5">one-time</p>
              </div>
              <ChevronRight size={16} className={`shrink-0 transition-colors ${
                selectedId === plan.id ? "text-primary" : "text-muted-foreground group-hover:text-primary"
              }`} />
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );
}
