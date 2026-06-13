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
        toast({ title: "Success!", description: "Referral code applied. Complete 1 tool action to unlock rewards for your friend!" });
        setRedeemCode("");
      } else {
        toast({ title: "Error", description: result.message, variant: "destructive" });
      }
    } finally {
      setRedeeming(false);
    }
  };

  const shareLink = `${window.location.origin}?ref=${referralCode}`;
  const shareMessage = `I'm using ${appDisplayName} to manage measurements, pricing, and customer records for my tailoring business.

Try it free here:
${shareLink}

My Referral Code: ${referralCode}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareMessage);
    setCopied(true);
    toast({ title: "Copied!", description: "Invitation message copied to clipboard." });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(referralCode || "");
    setCopiedCode(true);
    toast({ title: "Code Copied!", description: `Referral code ${referralCode} copied.` });
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleWhatsAppShare = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(shareMessage)}`;
    window.open(url, "_blank");
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join ${appDisplayName}`,
          text: shareMessage,
          url: shareLink,
        });
      } catch (err) {
        console.error("Error sharing:", err);
      }
    } else {
      handleCopy();
    }
  };

  const card = "bg-card border border-border rounded-3xl p-6 shadow-sm";

  return (
    <div className="max-w-2xl mx-auto pb-20">
      <PageHeader 
        title="Earn Credit" 
        subtitle="Grow the community & unlock rewards" 
        backPath="/all-tools"
      />

      <div className="px-4 py-5 space-y-6">

        {/* Invited By */}
        {referredBy && (
          <div className="rounded-2xl px-4 py-3 flex items-center gap-3" style={{ background: "rgba(212,160,32,0.06)", border: "1px solid rgba(212,160,32,0.2)" }}>
            <Sparkles size={16} style={{ color: "hsl(43,82%,55%)" }} />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "hsl(43,82%,60%)" }}>Invited by {referredBy}</p>
              <p className="text-[9px] text-muted-foreground">You joined via a referral link</p>
            </div>
          </div>
        )}

        {/* Redeem Code Section */}
        {!redeemed && (
          <div className={card + " space-y-3"}>
            {!showRedeem ? (
              <button
                onClick={() => setShowRedeem(true)}
                className="w-full flex items-center justify-between text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Gift size={18} className="text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-bold">Have a referral code?</p>
                    <p className="text-[10px] text-muted-foreground">Enter it here to unlock rewards</p>
                  </div>
                </div>
                <ArrowRight size={16} className="text-muted-foreground" />
              </button>
            ) : (
              <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Gift size={16} className="text-primary" />
                    <p className="text-sm font-bold">Redeem a Code</p>
                  </div>
                  <button onClick={() => { setShowRedeem(false); setRedeemCode(""); }} className="text-[10px] font-bold text-muted-foreground hover:text-foreground">Cancel</button>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter referral code"
                    value={redeemCode}
                    onChange={e => setRedeemCode(e.target.value.toUpperCase())}
                    onKeyDown={e => { if (e.key === "Enter") handleRedeem(); }}
                    className="flex-1 px-4 py-3 rounded-xl bg-muted/30 border border-border outline-none focus:border-primary text-sm font-bold tracking-wider uppercase placeholder:text-muted-foreground/50"
                    maxLength={20}
                    autoFocus
                  />
                  <button
                    onClick={handleRedeem}
                    disabled={!redeemCode.trim() || redeeming}
                    className="px-5 py-3 bg-primary text-primary-foreground rounded-xl font-bold text-sm active:scale-95 transition-all disabled:opacity-50 flex items-center gap-2"
                  >
                    {redeeming ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                    Apply
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {redeemed && (
          <div className="rounded-2xl px-4 py-3 flex items-center gap-3" style={{ background: "rgba(74,222,128,0.06)", border: "1px solid rgba(74,222,128,0.2)" }}>
            <Check size={16} className="text-green-500" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-green-500">Code Redeemed!</p>
              <p className="text-[9px] text-muted-foreground">Complete a tool action to activate rewards</p>
            </div>
          </div>
        )}

        {/* Referral Status */}
        <div className="grid grid-cols-2 gap-4">
          <div className={card + " flex flex-col items-center justify-center text-center py-8"}>
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-3">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Successful Invites</p>
            <p className="text-3xl font-black mt-1">{successfulInvites}</p>
            {successfulInvites === 0 && (
              <p className="text-[9px] text-muted-foreground mt-1">Start inviting to earn!</p>
            )}
          </div>
          <div className={card + " flex flex-col items-center justify-center text-center py-8 relative overflow-hidden"}>
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-3">
              <Zap className="w-6 h-6 text-amber-500" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Bonus Credits</p>
            <p className="text-3xl font-black mt-1">+{bonusUsageLimit}</p>
          </div>
        </div>

        {/* Share Section */}
        <div className={card + " space-y-6 relative overflow-hidden"}>
          <div className="absolute top-0 right-0 p-8 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />

          <div className="relative space-y-4">
            <div className="text-center space-y-2">
              <h3 className="text-lg font-bold">Share your link</h3>
              <p className="text-sm text-muted-foreground font-medium">
                When a tailor uses your code and completes their first tool action, you both grow!
              </p>
            </div>

            <div className="bg-muted/30 rounded-2xl p-4 border border-border space-y-3">
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-primary uppercase tracking-wider mb-0.5">Your Referral Code</p>
                  {referralCode ? (
                    <p className="text-lg font-black tracking-widest truncate">{referralCode}</p>
                  ) : (
                    <div className="flex items-center gap-2 mt-1">
                      <Loader2 size={16} className="animate-spin text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Generating...</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={handleCopyCode}
                    disabled={!referralCode}
                    className="rounded-xl h-10 px-3 text-xs font-bold border border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary transition-colors"
                  >
                    {copiedCode ? <Check className="w-3.5 h-3.5" /> : "Code"}
                  </button>
                  <button 
                    onClick={handleCopy}
                    disabled={!referralCode}
                    className="rounded-xl h-10 px-3 text-xs font-bold border border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary transition-colors"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : "Share"}
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 pt-2">
              <button 
                onClick={handleWhatsAppShare}
                className="w-full h-14 rounded-2xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-sm shadow-lg shadow-[#25D366]/20 flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
              >
                <MessageCircle className="w-5 h-5" />
                Invite on WhatsApp
              </button>
              <button 
                onClick={handleNativeShare}
                className="w-full h-14 rounded-2xl bg-card border border-border font-bold text-sm flex items-center justify-center gap-2 hover:bg-muted transition-colors active:scale-[0.98]"
              >
                <Share2 className="w-5 h-5" />
                Share Invite Link
              </button>
            </div>
          </div>
        </div>

        {/* Reward Levels */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Community Rewards</h3>
          </div>

          <div className="space-y-3">
            <RewardItem 
              invites={1} 
              title="Kickstart Bonus" 
              reward="+5 Bonus Credits" 
              active={successfulInvites >= 1} 
              icon={<Zap className="w-5 h-5" />}
              current={successfulInvites}
            />
            <RewardItem 
              invites={3} 
              title="Tailor Pro" 
              reward="7 Days Premium Access" 
              active={successfulInvites >= 3} 
              icon={<Crown className="w-5 h-5" />}
              current={successfulInvites}
            />
            <RewardItem 
              invites={10} 
              title="Community Ambassador" 
              reward="30 Days Premium Access" 
              active={successfulInvites >= 10} 
              icon={<Gift className="w-5 h-5" />}
              current={successfulInvites}
            />
          </div>
        </div>

        {/* How it works */}
        <div className="rounded-3xl p-6 flex gap-4" style={{ background: "rgba(212,160,32,0.04)", border: "1px solid rgba(212,160,32,0.1)" }}>
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Info className="w-5 h-5 text-primary" />
          </div>
          <div className="space-y-1">
            <p className="font-bold text-sm">How do invites count?</p>
            <p className="text-xs text-muted-foreground leading-relaxed font-medium">
              An invite is successful when the tailor you invited installs {appDisplayName}, enters your code, and successfully completes their first tool action.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function RewardItem({ invites, title, reward, active, icon, current }: { invites: number, title: string, reward: string, active: boolean, icon: React.ReactNode, current: number }) {
  const progress = Math.min(current, invites);
  const percent = Math.round((progress / invites) * 100);
  const remaining = invites - current;

  return (
    <div className={`p-5 rounded-3xl border transition-all ${active ? "bg-primary/5 border-primary/30" : "bg-card border-border"}`}>
      <div className="flex items-center gap-4 mb-3">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-black text-sm">{title}</p>
            {active && <Check className="w-4 h-4 text-primary" />}
          </div>
          <p className={`text-xs font-bold ${active ? "text-primary" : "text-muted-foreground"}`}>{reward}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{active ? "Unlocked" : remaining > 0 ? `${remaining} to go` : "Complete"}</p>
          <p className="text-sm font-black">{progress}/{invites}</p>
        </div>
      </div>
      {/* Progress bar */}
      <div className="h-1.5 rounded-full bg-muted/50 overflow-hidden">
        <div 
          className={`h-full rounded-full transition-all duration-500 ${active ? "bg-primary" : "bg-primary/30"}`}
          style={{ width: `${percent}%` }}
        />
      </div>
      {!active && remaining > 0 && (
        <p className="text-[9px] text-muted-foreground mt-1.5">
          Invite {remaining} more tailor{remaining !== 1 ? "s" : ""} to unlock
        </p>
      )}
    </div>
  );
}