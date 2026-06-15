import React, { useState } from "react";
import { 
  Users, 
  Share2, 
  Copy, 
  Check, 
  Gift, 
  Zap, 
  Crown, 
  MessageCircle, 
  Trophy,
  Info,
  Loader2,
  ArrowRight,
  Sparkles
} from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { useAppStore } from "@/store/useAppStore";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function InviteTailors() {
  const { referralCode, successfulInvites, bonusUsageLimit, referredBy, applyReferralCode, appName } = useAppStore();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [redeemCode, setRedeemCode] = useState("");
  const [redeeming, setRedeeming] = useState(false);
  const [redeemed, setRedeemed] = useState(false);
  const [showRedeem, setShowRedeem] = useState(false);

  const appDisplayName = appName || "OneTailor";

  const handleRedeem = async () => {
    if (!redeemCode.trim()) return;
    setRedeeming(true);
    try {
      const result = await applyReferralCode(redeemCode.trim().toUpperCase());
      if (result.success) {
        setRedeemed(true);
        toast({ title: "Success!", description: "Referral code applied." });
        setRedeemCode("");
      } else {
        toast({ title: "Error", description: result.message, variant: "destructive" });
      }
    } finally {
      setRedeeming(false);
    }
  };

  const shareLink = `${window.location.origin}?ref=${referralCode}`;
  const shareMessage = `I'm using ${appDisplayName} for my tailoring business. Try it free! ${shareLink} Code: ${referralCode}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareMessage);
    setCopied(true);
    toast({ title: "Copied!" });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(referralCode || "");
    setCopiedCode(true);
    toast({ title: "Code Copied!" });
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleWhatsAppShare = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(shareMessage)}`, "_blank");
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: `Join ${appDisplayName}`, text: shareMessage, url: shareLink });
      } catch (err) {}
    } else {
      handleCopy();
    }
  };

  return (
    <div className="max-w-2xl mx-auto pb-20">
      <PageHeader title="Invite & Earn" subtitle="Share your code" backPath="/all-tools" />

      <div className="px-4 py-4 space-y-4">

        {/* Referred by banner - compact */}
        {referredBy && (
          <div className="rounded-xl px-3 py-2 flex items-center gap-2 text-xs" style={{ background: "rgba(212,160,32,0.08)" }}>
            <Sparkles size={12} style={{ color: "hsl(43,82%,55%)" }} />
            <span>Invited by <strong>{referredBy}</strong></span>
          </div>
        )}

        {/* Stats row - compact */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-card border border-border rounded-xl p-3 text-center">
            <Users size={16} className="text-primary mx-auto mb-1" />
            <p className="text-2xl font-black">{successfulInvites}</p>
            <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Invites</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-3 text-center">
            <Zap size={16} className="text-amber-500 mx-auto mb-1" />
            <p className="text-2xl font-black">+{bonusUsageLimit}</p>
            <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Credits</p>
          </div>
        </div>

        {/* Redeem code - compact */}
        {!redeemed && (
          <div className="bg-card border border-border rounded-xl">
            {!showRedeem ? (
              <button
                onClick={() => setShowRedeem(true)}
                className="w-full p-3 flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <Gift size={14} className="text-primary" />
                  <span className="text-xs font-medium">Have a referral code?</span>
                </div>
                <ArrowRight size={14} className="text-muted-foreground" />
              </button>
            ) : (
              <div className="p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold">Enter code</span>
                  <button onClick={() => { setShowRedeem(false); setRedeemCode(""); }} className="text-[10px] text-muted-foreground">Cancel</button>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="REFERRAL CODE"
                    value={redeemCode}
                    onChange={e => setRedeemCode(e.target.value.toUpperCase())}
                    onKeyDown={e => e.key === "Enter" && handleRedeem()}
                    className="flex-1 px-3 py-2 rounded-lg bg-muted/30 border border-border outline-none focus:border-primary text-xs font-bold uppercase"
                    maxLength={20}
                    autoFocus
                  />
                  <button
                    onClick={handleRedeem}
                    disabled={!redeemCode.trim() || redeeming}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-bold text-xs active:scale-95 disabled:opacity-50"
                  >
                    {redeeming ? <Loader2 size={12} className="animate-spin" /> : "Apply"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {redeemed && (
          <div className="rounded-xl px-3 py-2 flex items-center gap-2 text-xs bg-green-500/10 border border-green-500/20">
            <Check size={12} className="text-green-500" />
            <span>Code redeemed! Complete a tool action to activate rewards</span>
          </div>
        )}

        {/* Share section - compact */}
        <div className="bg-card border border-border rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2 justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-[9px] font-bold text-primary uppercase tracking-wider">Your Code</p>
              <p className="text-base font-black tracking-widest">{referralCode || "Loading..."}</p>
            </div>
            <div className="flex gap-1">
              <button onClick={handleCopyCode} className="rounded-lg px-3 py-1.5 text-xs font-bold bg-primary/5 border border-primary/20 text-primary">
                {copiedCode ? <Check size={12} /> : "Copy"}
              </button>
              <button onClick={handleCopy} className="rounded-lg px-3 py-1.5 text-xs font-bold bg-primary/5 border border-primary/20 text-primary">
                {copied ? <Check size={12} /> : "Share"}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button onClick={handleWhatsAppShare} className="py-2.5 rounded-xl bg-[#25D366] text-white text-xs font-bold flex items-center justify-center gap-1">
              <MessageCircle size={12} /> WhatsApp
            </button>
            <button onClick={handleNativeShare} className="py-2.5 rounded-xl bg-card border border-border text-xs font-bold flex items-center justify-center gap-1">
              <Share2 size={12} /> Invite
            </button>
          </div>
        </div>

        {/* Rewards - compact list */}
        <div className="space-y-2">
          <div className="flex items-center gap-1 px-1">
            <Trophy size={12} className="text-amber-500" />
            <h3 className="text-[9px] font-black uppercase tracking-wider text-muted-foreground">Rewards</h3>
          </div>

          <div className="space-y-1.5">
            <RewardItemCompact invites={1} title="Kickstart" reward="+5 Credits" active={successfulInvites >= 1} current={successfulInvites} />
            <RewardItemCompact invites={3} title="Tailor Pro" reward="7 Days Premium" active={successfulInvites >= 3} current={successfulInvites} />
            <RewardItemCompact invites={10} title="Ambassador" reward="30 Days Premium" active={successfulInvites >= 10} current={successfulInvites} />
          </div>
        </div>

        {/* How it works - compact */}
        <div className="rounded-xl px-3 py-2.5 flex gap-2" style={{ background: "rgba(212,160,32,0.04)" }}>
          <Info size={12} className="text-primary shrink-0 mt-0.5" />
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            Invite counts when your friend installs, enters your code, and completes their first tool action.
          </p>
        </div>
      </div>
    </div>
  );
}

// Compact reward item component
function RewardItemCompact({ invites, title, reward, active, current }: { invites: number; title: string; reward: string; active: boolean; current: number }) {
  const progress = Math.min(current, invites);
  const percent = (progress / invites) * 100;

  return (
    <div className={`flex items-center gap-2 p-2 rounded-xl border ${active ? "bg-primary/5 border-primary/30" : "bg-card border-border"}`}>
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${active ? "bg-primary text-white" : "bg-muted text-muted-foreground"}`}>
        {active ? <Check size={14} /> : <Gift size={14} />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-bold text-xs">{title}</span>
          <span className={`text-[9px] font-medium ${active ? "text-primary" : "text-muted-foreground"}`}>{reward}</span>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <div className="flex-1 h-1 rounded-full bg-muted overflow-hidden">
            <div className={`h-full rounded-full transition-all ${active ? "bg-primary" : "bg-primary/40"}`} style={{ width: `${percent}%` }} />
          </div>
          <span className="text-[9px] text-muted-foreground tabular-nums">{progress}/{invites}</span>
        </div>
      </div>
    </div>
  );
}