import React, { useState, useEffect } from "react";
import { authFetch } from "@/lib/authFetch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { 
  Send, 
  Loader2, 
  Bell, 
  Smartphone, 
  Monitor, 
  Info,
  ExternalLink,
  Image as ImageIcon,
  Users,
  Crown,
  Globe
} from "lucide-react";

type Segment = "all" | "premium" | "free";

interface SubStats {
  subscriberCount: number;
  premiumCount: number;
  freeCount: number;
  unlinkedCount: number;
}

export default function Broadcast() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [url, setUrl] = useState("/");
  const [ctaText, setCtaText] = useState("");
  const [ctaUrl, setCtaUrl] = useState("");
  const [promoImage, setPromoImage] = useState("");
  const [contentImage, setContentImage] = useState("");
  const [sending, setSending] = useState(false);
  const [segment, setSegment] = useState<Segment>("all");
  const [subStats, setSubStats] = useState<SubStats | null>(null);
  const [sendMode, setSendMode] = useState<"now" | "schedule">("now");
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [scheduledBroadcasts, setScheduledBroadcasts] = useState<any[]>([]);
  const [testEmail, setTestEmail] = useState("");
  const [sendingTest, setSendingTest] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const [history, setHistory] = useState<any[]>([]);
  const promoImageRef = React.useRef<HTMLInputElement>(null);
  const contentImageRef = React.useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    authFetch("/api/admin/notifications/broadcast")
      .then(r => r.json())
      .then(d => setSubStats(d))
      .catch(() => {});
    fetchScheduledBroadcasts();
    authFetch("/api/admin/notifications/history")
      .then(r => r.json())
      .then(d => setHistory(d))
      .catch(() => {});
  }, []);

  const fetchScheduledBroadcasts = async () => {
    try {
      const res = await authFetch("/api/admin/notifications/scheduled");
      if (res.ok) setScheduledBroadcasts(await res.json());
    } catch {}
  };

  const templates = [
    { name: "Feature Update", title: "✨ New Feature Available!", body: "We've added new tools to help you manage your tailoring business more efficiently. Check them out now!" },
    { name: "Premium Reminder", title: "⭐ Unlock Premium Features", body: "Upgrade to Premium today and get unlimited customers, branded cards, and priority support!" },
    { name: "Maintenance", title: "🔧 Scheduled Maintenance", body: "We'll be performing system maintenance. The app may be unavailable for a few minutes." },
  ];

  const applyTemplate = (t: typeof templates[0]) => {
    setTitle(t.title);
    setBody(t.body);
    setCharCount(t.body.length);
  };

  const targetCount = !subStats ? null
    : segment === "premium" ? subStats.premiumCount
    : segment === "free" ? subStats.freeCount
    : subStats.subscriberCount;

  const buildPayload = () => ({
    title, body, url, segment,
    ctaText: ctaText || null,
    ctaUrl: ctaUrl || null,
    promoImage: promoImage || null,
    contentImage: contentImage || null,
  });

  const clearForm = () => {
    setTitle(""); setBody(""); setUrl("/");
    setCtaText(""); setCtaUrl("");
    setPromoImage(""); setContentImage("");
    setCharCount(0);
    setScheduleDate(""); setScheduleTime("");
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !body) return;
    setSending(true);
    try {
      const res = await authFetch("/api/admin/notifications/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload()),
      });
      const data = await res.json();
      if (res.ok) {
        toast({ title: "Broadcast Sent", description: data.message });
        clearForm();
      } else {
        toast({ variant: "destructive", title: "Failed", description: data.message });
      }
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "Could not send broadcast" });
    } finally {
      setSending(false);
    }
  };

  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !body) return;
    if (!scheduleDate || !scheduleTime) {
      toast({ title: "Missing Date/Time", description: "Please select both date and time for scheduling." });
      return;
    }
    const scheduledAt = new Date(`${scheduleDate}T${scheduleTime}`);
    if (scheduledAt <= new Date()) {
      toast({ title: "Invalid Date", description: "Schedule time must be in the future." });
      return;
    }
    setSending(true);
    try {
      const res = await authFetch("/api/admin/notifications/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...buildPayload(), scheduledAt: scheduledAt.toISOString() }),
      });
      if (res.ok) {
        toast({ title: "Broadcast Scheduled", description: `Will send on ${scheduledAt.toLocaleString()}` });
        clearForm();
        fetchScheduledBroadcasts();
      } else {
        const data = await res.json();
        toast({ variant: "destructive", title: "Failed", description: data.message });
      }
    } catch {
      toast({ variant: "destructive", title: "Error" });
    } finally {
      setSending(false);
    }
  };

  const handleTestSend = async () => {
    if (!testEmail || !title || !body) return;
    setSendingTest(true);
    try {
      const res = await authFetch("/api/admin/notifications/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...buildPayload(), testEmail }),
      });
      if (res.ok) {
        toast({ title: "Test Sent", description: `Sent to ${testEmail}` });
      } else {
        toast({ variant: "destructive", title: "Failed", description: "Could not send test" });
      }
    } catch {
      toast({ variant: "destructive", title: "Error" });
    } finally {
      setSendingTest(false);
    }
  };

  return (
    <div className="space-y-8 pb-20 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-white">Push Notifications</h1>
        <p className="text-muted-foreground text-sm">Send "WhatsApp-style" notifications to all devices that have allowed notifications.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          <Card className="rounded-3xl border-none shadow-2xl bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="text-primary" size={20} />
                New Broadcast
              </CardTitle>
              <CardDescription>Compose your message below. It will be delivered to mobile and PC devices.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={sendMode === "now" ? handleSend : handleSchedule} className="space-y-4">
                {/* Send Mode Toggle */}
                <div className="flex gap-2 mb-2">
                  <button type="button" onClick={() => setSendMode("now")}
                    className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${sendMode === "now" ? "bg-primary text-primary-foreground" : "bg-muted/30 text-muted-foreground"}`}>
                    Send Now
                  </button>
                  <button type="button" onClick={() => setSendMode("schedule")}
                    className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${sendMode === "schedule" ? "bg-primary text-primary-foreground" : "bg-muted/30 text-muted-foreground"}`}>
                    Schedule Later
                  </button>
                </div>

                {/* Template Presets */}
                <div className="flex flex-wrap gap-2">
                  {templates.map((t) => (
                    <button key={t.name} type="button" onClick={() => applyTemplate(t)}
                      className="px-3 py-1.5 rounded-lg text-[10px] font-bold bg-muted/30 hover:bg-muted/50 text-muted-foreground transition-colors">
                      {t.name}
                    </button>
                  ))}
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-primary/60 px-1">Notification Title</label>
                  <Input
                    required
                    placeholder="e.g. New Feature Update!"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="h-12 rounded-xl bg-muted/20"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-primary/60 px-1">Message Body</label>
                  <Textarea
                    required
                    placeholder="Enter your notification message here..."
                    value={body}
                    onChange={(e) => { setBody(e.target.value); setCharCount(e.target.value.length); }}
                    className="rounded-xl bg-muted/20 min-h-[120px] resize-none"
                  />
                  <span className={`text-[10px] text-right block mt-1 ${charCount > 200 ? "text-red-400" : "text-muted-foreground"}`}>
                    {charCount} / 200 characters
                  </span>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-primary/60 px-1">Redirect URL (Optional)</label>
                  <Input 
                    placeholder="e.g. /pre-unlock or https://example.com" 
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="h-12 rounded-xl bg-muted/20"
                  />
                </div>
                {sendMode === "schedule" && (
                  <div className="rounded-2xl border border-primary/10 bg-primary/5 p-4 space-y-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-primary/60">Schedule Delivery</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground px-1">Date</label>
                        <input type="date" value={scheduleDate} onChange={e => setScheduleDate(e.target.value)}
                          min={new Date().toISOString().split("T")[0]}
                          className="w-full h-11 px-3 rounded-xl bg-muted/20 border border-border" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground px-1">Time</label>
                        <input type="time" value={scheduleTime} onChange={e => setScheduleTime(e.target.value)}
                          className="w-full h-11 px-3 rounded-xl bg-muted/20 border border-border" />
                      </div>
                    </div>
                  </div>
                )}

                <div className="rounded-2xl border border-primary/10 bg-primary/5 p-4 space-y-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-primary/60">Images (Optional)</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground px-1">Promo Image</label>
                      <input
                        type="file"
                        accept="image/*"
                        ref={promoImageRef}
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onload = () => setPromoImage(reader.result as string);
                          reader.readAsDataURL(file);
                        }}
                        className="hidden"
                        id="promo-img-input"
                      />
                      <label htmlFor="promo-img-input" className="flex items-center gap-2 h-11 px-3 rounded-xl bg-muted/20 border border-border cursor-pointer hover:bg-muted/30 transition-colors text-sm text-muted-foreground">
                        <ImageIcon size={14} />
                        {promoImage ? "Image selected ✓" : "Upload promo image"}
                      </label>
                      {promoImage && (
                        <div className="relative">
                          <img src={promoImage} alt="promo" className="w-full h-20 object-cover rounded-xl" />
                          <button type="button" onClick={() => { setPromoImage(""); if (promoImageRef.current) promoImageRef.current.value = ""; }}
                            className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center text-white text-xs">✕</button>
                        </div>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground px-1">Content Image</label>
                      <input
                        type="file"
                        accept="image/*"
                        ref={contentImageRef}
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onload = () => setContentImage(reader.result as string);
                          reader.readAsDataURL(file);
                        }}
                        className="hidden"
                        id="content-img-input"
                      />
                      <label htmlFor="content-img-input" className="flex items-center gap-2 h-11 px-3 rounded-xl bg-muted/20 border border-border cursor-pointer hover:bg-muted/30 transition-colors text-sm text-muted-foreground">
                        <ImageIcon size={14} />
                        {contentImage ? "Image selected ✓" : "Upload content image"}
                      </label>
                      {contentImage && (
                        <div className="relative">
                          <img src={contentImage} alt="content" className="w-full h-20 object-cover rounded-xl" />
                          <button type="button" onClick={() => { setContentImage(""); if (contentImageRef.current) contentImageRef.current.value = ""; }}
                            className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center text-white text-xs">✕</button>
                        </div>
                      )}
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground">Images are embedded in the notification for richer delivery.</p>
                </div>
                <div className="rounded-2xl border border-primary/10 bg-primary/5 p-4 space-y-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-primary/60">Call-to-Action Button (Optional)</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground px-1">Button Label</label>
                      <Input
                        placeholder="e.g. Upgrade Now"
                        value={ctaText}
                        onChange={(e) => setCtaText(e.target.value)}
                        className="h-11 rounded-xl bg-muted/20"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground px-1">Button URL</label>
                      <Input
                        placeholder="e.g. /pre-unlock"
                        value={ctaUrl}
                        onChange={(e) => setCtaUrl(e.target.value)}
                        className="h-11 rounded-xl bg-muted/20"
                      />
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground">Adds an action button users can tap directly from the notification.</p>
                </div>
                <Button
                  type="submit"
                  disabled={sending || !title || !body || (sendMode === "schedule" && (!scheduleDate || !scheduleTime))}
                  className="w-full h-14 rounded-2xl font-bold text-lg gap-2 mt-4"
                >
                  {sending ? <Loader2 className="animate-spin" /> : sendMode === "now" ? <Send size={20} /> : <Bell size={20} />}
                  {sendMode === "now"
                    ? `${segment === "all" ? "Send to All" : segment === "premium" ? "Send to Premium" : "Send to Free"} (${targetCount || 0})`
                    : `Schedule ${segment === "all" ? "for All" : segment === "premium" ? "for Premium" : "for Free"} (${targetCount || 0})`
                  }
                </Button>
              </form>

              {/* Test Broadcast Section */}
              <div className="rounded-2xl border border-primary/10 bg-primary/5 p-4 space-y-3 mt-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-primary/60">Send Test (Email)</p>
                <div className="flex gap-2">
                  <Input type="email" placeholder="your@email.com" value={testEmail}
                    onChange={e => setTestEmail(e.target.value)} className="h-11 rounded-xl bg-muted/20" />
                  <Button type="button" onClick={handleTestSend}
                    disabled={sendingTest || !testEmail || !title || !body}
                    variant="outline" className="h-11 px-4 rounded-xl gap-2">
                    {sendingTest ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                    Test
                  </Button>
                </div>
                <p className="text-[10px] text-muted-foreground">Sends a preview to your email for testing before broadcasting.</p>
              </div>

              {/* Scheduled Broadcasts */}
              {scheduledBroadcasts.length > 0 && (
                <div className="mt-6 space-y-3">
                  <h3 className="text-sm font-bold flex items-center gap-2">
                    <Bell size={14} className="text-primary" /> Scheduled Broadcasts
                  </h3>
                  <div className="space-y-2">
                    {scheduledBroadcasts.map((b: any) => (
                      <div key={b.id} className="p-3 rounded-xl bg-muted/20 border border-border flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold truncate">{b.title}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {new Date(b.scheduledAt).toLocaleString()} • {b.segment === "all" ? "All" : b.segment === "premium" ? "Premium" : "Free"}
                          </p>
                        </div>
                        <Button variant="ghost" size="sm"
                          onClick={async () => {
                            if (confirm("Cancel this scheduled broadcast?")) {
                              await authFetch(`/api/admin/notifications/schedule/${b.id}`, { method: "DELETE" });
                              fetchScheduledBroadcasts();
                              toast({ title: "Cancelled", description: "Broadcast removed from schedule." });
                            }
                          }}
                          className="text-red-500 hover:text-red-400">Cancel</Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Broadcast History */}
              {history.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-sm font-bold flex items-center gap-2 mb-3">
                    <Bell size={14} className="text-primary" /> Recent Broadcasts
                  </h3>
                  <div className="space-y-2">
                    {history.slice(0, 5).map((b: any) => (
                      <div key={b.id} className="p-3 rounded-xl bg-muted/10 border border-border/50">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-bold truncate flex-1">{b.title}</p>
                          <span className="text-[9px] text-muted-foreground">{new Date(b.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-1 line-clamp-1">{b.body}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[9px] text-primary">{b.segment === "all" ? "All Users" : b.segment === "premium" ? "Premium" : "Free"}</span>
                          <span className="text-[9px] text-green-500">{b.sentCount || "?"} delivered</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Subscriber Stats */}
          <Card className="rounded-3xl border-none shadow-2xl bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Users size={16} className="text-primary" />
                Subscribers
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {subStats === null ? (
                <div className="flex items-center justify-center py-4"><Loader2 size={18} className="animate-spin text-muted-foreground" /></div>
              ) : (
                <>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-2xl bg-muted/30 p-3">
                      <p className="text-lg font-black text-foreground">{subStats.subscriberCount}</p>
                      <p className="text-[9px] font-bold uppercase text-muted-foreground">Total</p>
                    </div>
                    <div className="rounded-2xl bg-amber-500/10 p-3">
                      <p className="text-lg font-black text-amber-500">{subStats.premiumCount}</p>
                      <p className="text-[9px] font-bold uppercase text-amber-500/70">Premium</p>
                    </div>
                    <div className="rounded-2xl bg-blue-500/10 p-3">
                      <p className="text-lg font-black text-blue-400">{subStats.freeCount}</p>
                      <p className="text-[9px] font-bold uppercase text-blue-400/70">Free</p>
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground text-center">
                    {subStats.unlinkedCount > 0 && `+${subStats.unlinkedCount} anonymous devices`}
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Audience selector */}
          <Card className="rounded-3xl border-none shadow-2xl bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Globe size={16} className="text-primary" />
                Target Audience
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {(["all", "premium", "free"] as Segment[]).map(s => (
                <button
                  key={s}
                  onClick={() => setSegment(s)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl border text-sm font-bold transition-all ${segment === s ? "bg-primary border-primary text-primary-foreground" : "bg-card border-border text-muted-foreground hover:bg-muted/20"}`}
                >
                  {s === "all" ? <Users size={14} /> : s === "premium" ? <Crown size={14} /> : <Globe size={14} />}
                  {s === "all" ? "All Subscribers" : s === "premium" ? "Premium Users Only" : "Free Users Only"}
                  {subStats && (
                    <span className={`ml-auto text-[11px] font-black px-2 py-0.5 rounded-full ${segment === s ? "bg-white/20" : "bg-muted/40"}`}>
                      {s === "all" ? subStats.subscriberCount : s === "premium" ? subStats.premiumCount : subStats.freeCount}
                    </span>
                  )}
                </button>
              ))}
              {targetCount !== null && (
                <p className="text-[10px] text-muted-foreground text-center pt-1">
                  This broadcast will reach <strong>{targetCount}</strong> subscriber{targetCount !== 1 ? "s" : ""}
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-none shadow-2xl bg-card">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Info size={16} className="text-primary" />
                Live Preview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-900 border border-white/5 shadow-inner">
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                    <ImageIcon size={20} className="text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-white truncate">{title || "Notification Title"}</p>
                    <p className="text-xs text-slate-400 line-clamp-2 mt-0.5">{body || "Your message will appear here. Keep it concise for better readability."}</p>
                  </div>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground text-center italic">This is how it will look on most devices.</p>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-none shadow-2xl bg-card">
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-start gap-3">
                <Smartphone className="text-primary shrink-0" size={20} />
                <div className="space-y-1">
                  <p className="text-sm font-bold">Mobile Delivery</p>
                  <p className="text-xs text-muted-foreground">Works on Android and iOS (PWA must be added to home screen on iOS).</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Monitor className="text-primary shrink-0" size={20} />
                <div className="space-y-1">
                  <p className="text-sm font-bold">PC Delivery</p>
                  <p className="text-xs text-muted-foreground">Works on Chrome, Edge, and Safari even if the browser is closed.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
