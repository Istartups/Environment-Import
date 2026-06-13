import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Eye, EyeOff, Loader2, Lock, CheckCircle2, Check, AlertCircle, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PageHeader } from "@/components/shared/PageHeader";

function getPasswordStrength(pw: string): { score: number; label: string; color: string } {
  if (!pw) return { score: 0, label: "", color: "bg-muted" };
  let score = 0;
  if (pw.length >= 6) score++;
  if (pw.length >= 10) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;

  if (score <= 1) return { score: 1, label: "Weak", color: "bg-red-500" };
  if (score <= 2) return { score: 2, label: "Fair", color: "bg-orange-500" };
  if (score <= 3) return { score: 3, label: "Good", color: "bg-yellow-500" };
  if (score <= 4) return { score: 4, label: "Strong", color: "bg-emerald-500" };
  return { score: 5, label: "Very Strong", color: "bg-emerald-600" };
}

export default function ResetPassword() {
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("token");
    if (t) {
      setToken(t);
    } else {
      setError("Invalid or missing reset link. Please request a new one.");
    }
  }, []);

  // Auto-redirect countdown
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
    if (countdown === 0 && success) {
      navigate("/account-login");
    }
  }, [countdown, success]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast({ title: "Weak Password", description: "Password must be at least 6 characters.", variant: "destructive" });
      return;
    }
    if (password !== confirmPassword) {
      toast({ title: "Passwords Don't Match", description: "Please re-enter your new password.", variant: "destructive" });
      return;
    }

    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        const msg = data.message || "Reset failed. The link may have expired.";
        setError(msg);
        return;
      }

      setSuccess(true);
      setCountdown(5);
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const isTokenExpired = error.toLowerCase().includes("expired") || error.toLowerCase().includes("invalid");

  const inputClass = "w-full pl-11 pr-11 py-3.5 rounded-2xl bg-card border border-border outline-none focus:border-primary transition-colors text-sm";
  const passwordStrength = getPasswordStrength(password);
  const passwordsMatch = password && confirmPassword && password === confirmPassword && password.length >= 6;

  return (
    <div className="min-h-screen bg-background">
      <PageHeader title="Reset Password" />
      <div className="max-w-md mx-auto px-4 py-10 space-y-8">

        {success ? (
          <div className="text-center space-y-6 pt-8">
            <div className="w-20 h-20 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto border border-emerald-500/20">
              <CheckCircle2 size={40} className="text-emerald-500" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Password Reset!</h2>
              <p className="text-sm text-muted-foreground mt-2">Your password has been updated successfully.</p>
              <p className="text-xs text-muted-foreground mt-1">
                Redirecting to login in {countdown} second{countdown !== 1 ? "s" : ""}...
              </p>
            </div>
            <button
              onClick={() => navigate("/account-login")}
              className="w-full py-4 bg-primary text-primary-foreground rounded-2xl font-bold"
            >
              Go to Login Now
            </button>
          </div>
        ) : error && !token ? (
          <div className="text-center space-y-4 pt-8">
            <div className="p-5 bg-red-500/10 border border-red-500/20 rounded-2xl space-y-3">
              <AlertCircle size={24} className="text-red-400 mx-auto" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
            <button
              onClick={() => navigate("/account-login")}
              className="w-full py-3 flex items-center justify-center gap-2 text-sm font-semibold text-primary"
            >
              <ArrowLeft size={14} /> Back to Login
            </button>
          </div>
        ) : (
          <>
            <div className="space-y-1">
              <h2 className="text-2xl font-bold">Create New Password</h2>
              <p className="text-sm text-muted-foreground">Enter and confirm your new password below.</p>
            </div>

            {error && (
              <div className={`p-4 rounded-xl text-sm space-y-3 ${isTokenExpired ? "bg-amber-500/10 border border-amber-500/20" : "bg-red-500/10 border border-red-500/20"}`}>
                <div className="flex items-start gap-2">
                  <AlertCircle size={16} className={isTokenExpired ? "text-amber-500 mt-0.5 shrink-0" : "text-red-400 mt-0.5 shrink-0"} />
                  <p className={isTokenExpired ? "text-amber-500" : "text-red-400"}>{error}</p>
                </div>
                {isTokenExpired && (
                  <button
                    onClick={() => navigate("/account-login?forgot=1")}
                    className="w-full py-2.5 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-xl text-xs font-bold hover:bg-amber-500/20 transition-colors"
                  >
                    Request New Reset Link
                  </button>
                )}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className={inputClass}
                    required
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {/* Password strength indicator */}
                {password && (
                  <div className="mt-2 space-y-1">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className={`flex-1 h-1 rounded-full transition-all ${i <= passwordStrength.score ? passwordStrength.color : "bg-muted"}`} />
                      ))}
                    </div>
                    <p className="text-[10px] font-bold" style={{ 
                      color: passwordStrength.color === "bg-red-500" ? "#ef4444" : 
                             passwordStrength.color === "bg-orange-500" ? "#f97316" : 
                             passwordStrength.color === "bg-yellow-500" ? "#eab308" : "#10b981" 
                    }}>
                      {passwordStrength.label}
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                    className={`${inputClass} ${confirmPassword && !passwordsMatch && password !== confirmPassword ? "border-red-500" : passwordsMatch ? "border-emerald-500" : ""}`}
                    required
                  />
                  {passwordsMatch && (
                    <Check size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-emerald-500" />
                  )}
                </div>
                {confirmPassword && password !== confirmPassword && (
                  <p className="text-xs text-red-500 ml-1">Passwords don't match</p>
                )}
                {passwordsMatch && (
                  <p className="text-xs text-emerald-500 ml-1">✓ Passwords match</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || !token}
                className="w-full py-4 bg-primary text-primary-foreground rounded-2xl font-bold flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin" size={18} /> : "Reset Password"}
              </button>

              <button type="button" onClick={() => navigate("/account-login")} className="w-full py-2 text-sm text-muted-foreground flex items-center justify-center gap-1.5">
                <ArrowLeft size={14} /> Back to Login
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}