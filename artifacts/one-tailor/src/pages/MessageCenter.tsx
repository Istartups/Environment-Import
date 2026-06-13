import { useState, useEffect, useMemo } from "react";
import {
  MessageSquareText, Mail, Phone, Send, Plus, Pencil, Trash2,
  X, Check, ChevronRight, Crown, Users, Search, CheckSquare, Square,
  ChevronDown, ChevronUp, Sparkles, Zap, Clock, BarChart3, Copy,
  AlertCircle, History, Save, FolderOpen, Star, Download, Upload,
  Bell, Tag, Filter, MoreVertical, Bookmark
} from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { useAppStore } from "@/store/useAppStore";
import { useToast } from "@/hooks/use-toast";
import { getDeviceId } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type Channel = "whatsapp" | "sms" | "email";

interface MCCustomer {
  id: number;
  name: string;
  phone: string;
  email: string;
  gender: "male" | "female" | "others";
}

interface Template {
  id: string;
  title: string;
  body: string;
  subject?: string;
  category?: string;
  isQuickReply?: boolean;
}

interface MessageRecord {
  id: string;
  channel: Channel;
  message: string;
  subject?: string;
  recipientCount: number;
  recipientNames: string[];
  templateUsed?: string;
  sentAt: string;
}

interface Draft {
  id: string;
  channel: Channel;
  message: string;
  subject?: string;
  recipientIds: number[];
  savedAt: string;
  label?: string;
}

interface CustomerGroup {
  id: string;
  name: string;
  customerIds: number[];
  createdAt: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const FREE_LIMITS: Record<Channel, number> = {
  sms: 3,
  email: 5,
  whatsapp: 1,
};

const MAX_FREE_TEMPLATES = 5;
const MAX_FREE_DRAFTS = 2;
const MAX_FREE_GROUPS = 1;
const MAX_FREE_HISTORY = 20;

const SMS_CHAR_LIMIT = 160;

const DEFAULT_TEMPLATES: Record<Channel, Template[]> = {
  whatsapp: [
    { id: "wa1", title: "Check-in", body: "Hello {name}! 😊 Just checking in from your tailor. Hope you're doing great!", category: "Follow-up" },
    { id: "wa2", title: "Order Ready", body: "Hi {name}, great news! 🎉 Your order is ready for pickup.", category: "Order" },
    { id: "wa3", title: "Promo", body: "Dear {name}, special offer this season! 🧵 Contact us for details.", category: "Promotion" },
  ],
  sms: [
    { id: "sms1", title: "Check-in", body: "Hi {name}, your tailor checking in. Hope all is well!", category: "Follow-up" },
    { id: "sms2", title: "Order Ready", body: "Hi {name}, your order is ready for pickup. Thank you!", category: "Order" },
    { id: "sms3", title: "Reminder", body: "Hi {name}, reminder about your fitting. Please confirm.", category: "Appointment" },
  ],
  email: [
    { id: "em1", title: "Order Ready", subject: "Your Order is Ready", body: "Dear {name},\n\nYour order is ready for pickup.\n\nBest regards,\nYour Tailor", category: "Order" },
    { id: "em2", title: "Reminder", subject: "Fitting Reminder", body: "Dear {name},\n\nReminder about your fitting appointment.\n\nBest regards,\nYour Tailor", category: "Appointment" },
    { id: "em3", title: "Offer", subject: "Special Offer", body: "Dear {name},\n\nExclusive offer for our valued customers!\n\nBest regards,\nYour Tailor", category: "Promotion" },
  ],
};

const PREMIUM_FEATURES = [
  { icon: Zap, text: "Send to ALL contacts in one tap" },
  { icon: Sparkles, text: "Full personalization for every recipient" },
  { icon: Clock, text: "Schedule messages for later" },
  { icon: BarChart3, text: "Track opens and responses" },
  { icon: Users, text: "Unlimited templates, drafts & groups" },
  { icon: History, text: "Full message history" },
  { icon: Download, text: "Export & import templates" },
];

const CHANNEL_META: Record<Channel, { label: string; color: string; bg: string; border: string; icon: React.FC<{ size?: number }> }> = {
  whatsapp: {
    label: "WhatsApp", color: "#22c55e", bg: "rgba(34,197,94,0.1)", border: "rgba(34,197,94,0.25)",
    icon: ({ size = 16 }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="#22c55e">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
        <path d="M12 0C5.373 0 0 5.373 0 12c0 2.134.558 4.134 1.535 5.867L0 24l6.335-1.66A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.885 0-3.655-.502-5.186-1.381l-.372-.221-3.863 1.013 1.032-3.764-.242-.389A9.937 9.937 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
      </svg>
    ),
  },
  sms: { label: "SMS", color: "#60a5fa", bg: "rgba(96,165,250,0.1)", border: "rgba(96,165,250,0.25)", icon: ({ size = 16 }) => <MessageSquareText size={size} color="#60a5fa" /> },
  email: { label: "Email", color: "#a78bfa", bg: "rgba(167,139,250,0.1)", border: "rgba(167,139,250,0.25)", icon: ({ size = 16 }) => <Mail size={size} color="#a78bfa" /> },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function storageKey(key: string) {
  return `mc_${key}_${getDeviceId()}`;
}

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(storageKey(key));
    if (raw) return JSON.parse(raw);
  } catch {}
  return fallback;
}

function saveToStorage(key: string, data: any) {
  localStorage.setItem(storageKey(key), JSON.stringify(data));
}

function loadTemplates(channel: Channel): Template[] {
  return loadFromStorage<Template[]>(`templates_${channel}`, DEFAULT_TEMPLATES[channel]);
}

function saveTemplates(channel: Channel, templates: Template[]) {
  saveToStorage(`templates_${channel}`, templates);
}

function loadHistory(): MessageRecord[] {
  return loadFromStorage<MessageRecord[]>("history", []);
}

function saveHistory(history: MessageRecord[]) {
  saveToStorage("history", history);
}

function loadDrafts(): Draft[] {
  return loadFromStorage<Draft[]>("drafts", []);
}

function saveDrafts(drafts: Draft[]) {
  saveToStorage("drafts", drafts);
}

function loadGroups(): CustomerGroup[] {
  return loadFromStorage<CustomerGroup[]>("groups", []);
}

function saveGroups(groups: CustomerGroup[]) {
  saveToStorage("groups", groups);
}

function applyName(text: string, name: string) {
  return text.replace(/\{name\}/gi, name);
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function MessageCenter() {
  const isPremium = useAppStore(s => s.isPremium);
  const { toast } = useToast();

  const [channel, setChannel] = useState<Channel>("whatsapp");
  const [templates, setTemplates] = useState<Record<Channel, Template[]>>({
    whatsapp: loadTemplates("whatsapp"),
    sms: loadTemplates("sms"),
    email: loadTemplates("email"),
  });
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [compose, setCompose] = useState("");
  const [subject, setSubject] = useState("");

  const [customers, setCustomers] = useState<MCCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectMode, setSelectMode] = useState<"all" | "select" | "group">("all");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [showCustomers, setShowCustomers] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendProgress, setSendProgress] = useState({ current: 0, total: 0 });

  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");
  const [editSubject, setEditSubject] = useState("");
  const [editCategory, setEditCategory] = useState("");

  const [messageHistory, setMessageHistory] = useState<MessageRecord[]>(loadHistory());
  const [drafts, setDrafts] = useState<Draft[]>(loadDrafts());
  const [customerGroups, setCustomerGroups] = useState<CustomerGroup[]>(loadGroups());
  const [showHistory, setShowHistory] = useState(false);
  const [showDrafts, setShowDrafts] = useState(false);
  const [showGroups, setShowGroups] = useState(false);
  const [activeGroup, setActiveGroup] = useState<CustomerGroup | null>(null);
  const [newGroupName, setNewGroupName] = useState("");
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [draftLabel, setDraftLabel] = useState("");
  const [showSaveDraft, setShowSaveDraft] = useState(false);
  const [templateFilter, setTemplateFilter] = useState<string>("all");

  const [showPremiumUpsell, setShowPremiumUpsell] = useState(false);
  const [upsellReason, setUpsellReason] = useState("");
  const [showSendConfirm, setShowSendConfirm] = useState(false);

  useEffect(() => {
    setLoading(true);
    const did = getDeviceId();
    fetch(`/api/tailoring/customers?deviceId=${did}&limit=9999`)
      .then(r => r.ok ? r.json() : [])
      .then((data: MCCustomer[]) => { setCustomers(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const reachable = useMemo(() => {
    if (channel === "email") return customers.filter(c => !!c.email);
    return customers.filter(c => !!c.phone);
  }, [customers, channel]);

  const filtered = useMemo(() =>
    reachable.filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()) || (c.phone || "").includes(search)),
  [reachable, search]);

  const targetCustomers = useMemo(() => {
    if (selectMode === "group" && activeGroup) return reachable.filter(c => activeGroup.customerIds.includes(c.id));
    if (selectMode === "select") return reachable.filter(c => selected.has(c.id));
    return reachable;
  }, [selectMode, reachable, selected, activeGroup]);

  const channelTemplates = templates[channel];
  const freeLimit = FREE_LIMITS[channel];
  const exceedsFreeLimit = !isPremium && targetCustomers.length > freeLimit;

  const categories = useMemo(() => {
    const cats = new Set(channelTemplates.map(t => t.category || "Uncategorized"));
    return ["all", ...Array.from(cats)];
  }, [channelTemplates]);

  const filteredTemplates = useMemo(() => {
    if (templateFilter === "all") return channelTemplates;
    return channelTemplates.filter(t => (t.category || "Uncategorized") === templateFilter);
  }, [channelTemplates, templateFilter]);

  const quickReplies = useMemo(() => {
    if (!isPremium) return [];
    return channelTemplates.filter(t => t.isQuickReply);
  }, [channelTemplates, isPremium]);

  const smsCharCount = compose.length;
  const smsExceedsLimit = channel === "sms" && smsCharCount > SMS_CHAR_LIMIT;
  const smsSegmentCount = channel === "sms" ? Math.ceil(smsCharCount / 153) : 1; // 153 for multi-part SMS

  const allSelected = filtered.length > 0 && filtered.every(c => selected.has(c.id));

  function toggleSelectAll() {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map(c => c.id)));
    }
  }

  function pickTemplate(t: Template) {
    setSelectedTemplate(t);
    setCompose(t.body);
    if (t.subject) setSubject(t.subject);
  }

  function openNewTemplate() {
    if (!isPremium && channelTemplates.length >= MAX_FREE_TEMPLATES) {
      toast({ title: "Template limit reached", description: "Upgrade to OneTailor Premium for unlimited templates." });
      return;
    }
    setEditingTemplate(null);
    setEditTitle("");
    setEditBody("");
    setEditSubject("");
    setEditCategory("");
    setShowTemplateEditor(true);
  }

  function openEditTemplate(t: Template) {
    setEditingTemplate(t);
    setEditTitle(t.title);
    setEditBody(t.body);
    setEditSubject(t.subject || "");
    setEditCategory(t.category || "");
    setShowTemplateEditor(true);
  }

  function saveTemplate() {
    if (!editTitle.trim() || !editBody.trim()) return;
    const updated = { ...templates };
    if (editingTemplate) {
      updated[channel] = updated[channel].map(t =>
        t.id === editingTemplate.id ? { ...t, title: editTitle.trim(), body: editBody.trim(), subject: editSubject.trim() || undefined, category: editCategory.trim() || undefined } : t
      );
    } else {
      updated[channel] = [...updated[channel], {
        id: `${channel}_${Date.now()}`,
        title: editTitle.trim(),
        body: editBody.trim(),
        subject: editSubject.trim() || undefined,
        category: editCategory.trim() || undefined,
      }];
    }
    setTemplates(updated);
    saveTemplates(channel, updated[channel]);
    setShowTemplateEditor(false);
  }

  function deleteTemplate(id: string) {
    const updated = { ...templates };
    updated[channel] = updated[channel].filter(t => t.id !== id);
    setTemplates(updated);
    saveTemplates(channel, updated[channel]);
    if (selectedTemplate?.id === id) { setSelectedTemplate(null); setCompose(""); }
  }

  function toggleQuickReply(t: Template) {
    if (!isPremium) {
      toast({ title: "OneTailor Premium feature", description: "Upgrade for quick replies." });
      return;
    }
    const updated = { ...templates };
    updated[channel] = updated[channel].map(tmpl =>
      tmpl.id === t.id ? { ...tmpl, isQuickReply: !tmpl.isQuickReply } : tmpl
    );
    setTemplates(updated);
    saveTemplates(channel, updated[channel]);
  }

  function exportTemplates() {
    if (!isPremium) return;
    const data = JSON.stringify(templates, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `message-templates-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Templates exported" });
  }

  function importTemplates() {
    if (!isPremium) return;
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const imported = JSON.parse(ev.target?.result as string);
          if (imported.whatsapp && imported.sms && imported.email) {
            setTemplates(imported);
            saveTemplates("whatsapp", imported.whatsapp);
            saveTemplates("sms", imported.sms);
            saveTemplates("email", imported.email);
            toast({ title: "Templates imported" });
          }
        } catch { toast({ title: "Invalid file", variant: "destructive" }); }
      };
      reader.readAsText(file);
    };
    input.click();
  }

  function saveDraft() {
    if (!isPremium && drafts.length >= MAX_FREE_DRAFTS) {
      toast({ title: "Draft limit reached", description: "Upgrade to OneTailor Premium for unlimited drafts." });
      return;
    }
    if (!compose.trim()) return;
    const draft: Draft = {
      id: `draft_${Date.now()}`,
      channel,
      message: compose,
      subject: subject || undefined,
      recipientIds: selectMode === "select" ? Array.from(selected) : [],
      savedAt: new Date().toISOString(),
      label: draftLabel.trim() || undefined,
    };
    const updated = [...drafts, draft];
    setDrafts(updated);
    saveDrafts(updated);
    setShowSaveDraft(false);
    setDraftLabel("");
    toast({ title: "Draft saved" });
  }

  function loadDraft(draft: Draft) {
    setChannel(draft.channel);
    setCompose(draft.message);
    if (draft.subject) setSubject(draft.subject);
    if (draft.recipientIds.length > 0) {
      setSelectMode("select");
      setSelected(new Set(draft.recipientIds));
    }
    setShowDrafts(false);
    toast({ title: "Draft loaded" });
  }

  function deleteDraft(id: string) {
    setDrafts(drafts.filter(d => d.id !== id));
    saveDrafts(drafts);
  }

  function createGroup() {
    if (!isPremium && customerGroups.length >= MAX_FREE_GROUPS) {
      toast({ title: "Group limit reached", description: "Upgrade to OneTailor Premium for unlimited groups." });
      return;
    }
    if (!newGroupName.trim() || selected.size === 0) return;
    const group: CustomerGroup = {
      id: `group_${Date.now()}`,
      name: newGroupName.trim(),
      customerIds: Array.from(selected),
      createdAt: new Date().toISOString(),
    };
    const updated = [...customerGroups, group];
    setCustomerGroups(updated);
    saveGroups(updated);
    setNewGroupName("");
    setShowNewGroup(false);
    setActiveGroup(group);
    setSelectMode("group");
    toast({ title: `Group "${group.name}" created` });
  }

  function deleteGroup(id: string) {
    const updated = customerGroups.filter(g => g.id !== id);
    setCustomerGroups(updated);
    saveGroups(updated);
    if (activeGroup?.id === id) { setActiveGroup(null); setSelectMode("all"); }
  }

  function addToHistory(recipientCount: number, names: string[]) {
    if (!isPremium && messageHistory.length >= MAX_FREE_HISTORY) return;
    const record: MessageRecord = {
      id: `hist_${Date.now()}`,
      channel,
      message: compose,
      subject: subject || undefined,
      recipientCount,
      recipientNames: names.slice(0, 5),
      templateUsed: selectedTemplate?.title,
      sentAt: new Date().toISOString(),
    };
    const updated = [record, ...messageHistory].slice(0, isPremium ? 500 : MAX_FREE_HISTORY);
    setMessageHistory(updated);
    saveHistory(updated);
  }

  function toggleSelect(id: number) {
    const s = new Set(selected);
    s.has(id) ? s.delete(id) : s.add(id);
    setSelected(s);
  }

  function sendOne(c: MCCustomer) {
    const msg = applyName(compose, c.name);
    if (channel === "whatsapp") {
      const phone = (c.phone || "").replace(/\D/g, "");
      if (!phone) return;
      window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, "_blank");
    } else if (channel === "sms") {
      const phone = (c.phone || "").replace(/\D/g, "");
      if (!phone) return;
      window.open(`sms:${phone}?body=${encodeURIComponent(msg)}`, "_blank");
    } else {
      if (!c.email) return;
      const sub = applyName(subject, c.name);
      window.open(`mailto:${c.email}?subject=${encodeURIComponent(sub)}&body=${encodeURIComponent(msg)}`, "_blank");
    }
  }

  function sendBatch() {
    if (!compose.trim() || targetCustomers.length === 0) return;
    if (isPremium || !exceedsFreeLimit) {
      // Show confirmation before sending
      setShowSendConfirm(true);
      return;
    }
    setUpsellReason(`Free plan limited to ${freeLimit} recipients. Upgrade to OneTailor Premium for unlimited bulk messaging.`);
    setShowPremiumUpsell(true);
  }

  function confirmAndSend() {
    setShowSendConfirm(false);
    executeSend();
  }

  function executeSend() {
    addToHistory(targetCustomers.length, targetCustomers.map(c => c.name));
    if (channel === "email" && targetCustomers.length > 1) sendBulkEmail();
    else if (channel === "sms" && targetCustomers.length > 1) sendBulkSMS();
    else sendIndividual();
  }

  function sendBulkEmail() {
    const emails = targetCustomers.map(c => c.email).filter(e => !!e);
    if (!emails.length) { toast({ title: "No email addresses", variant: "destructive" }); return; }
    const msg = compose.replace(/\{name\}/gi, "Valued Customer");
    const sub = subject.replace(/\{name\}/gi, "Valued Customer");
    window.open(`mailto:?bcc=${encodeURIComponent(emails.join(","))}&subject=${encodeURIComponent(sub)}&body=${encodeURIComponent(msg)}`, "_blank");
    toast({ title: `Email ready for ${emails.length} recipients` });
  }

  function sendBulkSMS() {
    const phones = targetCustomers.map(c => (c.phone || "").replace(/\D/g, "")).filter(p => p);
    if (!phones.length) { toast({ title: "No phone numbers", variant: "destructive" }); return; }
    const msg = compose.replace(/\{name\}/gi, "Valued Customer");
    const BATCH = isPremium ? 20 : 3;
    for (let i = 0; i < phones.length; i += BATCH) {
      setTimeout(() => window.open(`sms:${phones.slice(i, i + BATCH).join(",")}?body=${encodeURIComponent(msg)}`, "_blank"), (i / BATCH) * 500);
    }
    toast({ title: `SMS ready for ${phones.length} recipients` });
  }

  function sendIndividual() {
    setSending(true);
    setSendProgress({ current: 0, total: targetCustomers.length });
    targetCustomers.forEach((c, i) => setTimeout(() => {
      sendOne(c);
      setSendProgress({ current: i + 1, total: targetCustomers.length });
      if (i === targetCustomers.length - 1) {
        setSending(false);
        toast({ title: `${targetCustomers.length} messages opened` });
      }
    }, i * 700));
  }

  function trackManualSend(count: number) {
    try {
      const key = storageKey("manual_sends");
      const d = JSON.parse(localStorage.getItem(key) || '{"total":0}');
      d.total += count;
      localStorage.setItem(key, JSON.stringify(d));
    } catch {}
  }

  function copyMessageToClipboard() {
    navigator.clipboard.writeText(compose.replace(/\{name\}/gi, "Customer")).then(() => toast({ title: "Message copied" }));
  }

  function proceedFreeAnyway() {
    setShowPremiumUpsell(false);
    setShowSendConfirm(true);
  }

  const meta = CHANNEL_META[channel];
  const Icon = meta.icon;

  return (
    <div className="min-h-screen pb-24" style={{ background: "hsl(var(--background))" }}>
      <PageHeader title="Message Center" subtitle="Send messages to your clients" />
      <div className="max-w-xl mx-auto px-4 pt-4 space-y-4">

        {/* ── OneTailor Premium Banner ─────────────────────────────────────── */}
        {!isPremium && (
          <div className="rounded-2xl border p-4 flex items-center gap-3" style={{ background: "linear-gradient(135deg, rgba(212,160,32,0.12), rgba(212,160,32,0.05))", borderColor: "rgba(212,160,32,0.25)" }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(212,160,32,0.15)" }}>
              <Crown size={18} style={{ color: "hsl(43,82%,55%)" }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black" style={{ color: "hsl(43,82%,55%)" }}>OneTailor Premium</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Unlimited bulk send · Groups · Drafts · History</p>
            </div>
            <a href="/pre-unlock" className="shrink-0 px-4 py-2 rounded-xl text-[10px] font-bold text-black" style={{ background: "hsl(43,82%,55%)" }}>Upgrade</a>
          </div>
        )}

        {/* ── Premium Tabs ────────────────────────────────────────────────── */}
        {isPremium && (
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
            {[
              { id: "templates", icon: Star, label: "Templates" },
              { id: "drafts", icon: Save, label: `Drafts (${drafts.length})` },
              { id: "groups", icon: FolderOpen, label: `Groups (${customerGroups.length})` },
              { id: "history", icon: History, label: `History (${messageHistory.length})` },
            ].map(tab => (
              <button key={tab.id} onClick={() => {
                setShowHistory(tab.id === "history" ? !showHistory : false);
                setShowDrafts(tab.id === "drafts" ? !showDrafts : false);
                setShowGroups(tab.id === "groups" ? !showGroups : false);
              }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold" style={{ background: "hsl(218,44%,11%)", border: "1px solid hsl(218,38%,18%)", color: "hsl(218,20%,65%)" }}>
                <tab.icon size={11} />{tab.label}
              </button>
            ))}
            <button onClick={exportTemplates} className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[10px] font-bold" style={{ background: "hsl(218,44%,11%)", border: "1px solid hsl(218,38%,18%)", color: "hsl(218,20%,65%)" }}><Download size={11} /></button>
            <button onClick={importTemplates} className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[10px] font-bold" style={{ background: "hsl(218,44%,11%)", border: "1px solid hsl(218,38%,18%)", color: "hsl(218,20%,65%)" }}><Upload size={11} /></button>
          </div>
        )}

        {/* ── History Panel ───────────────────────────────────────────────── */}
        {showHistory && isPremium && (
          <div className="rounded-2xl border p-3 space-y-2" style={{ background: "hsl(218,44%,11%)", borderColor: "hsl(218,38%,18%)" }}>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: "rgba(212,160,32,0.6)" }}>Message History</p>
            {messageHistory.length === 0 ? <p className="text-xs text-muted-foreground text-center py-4">No messages sent yet.</p> : (
              <div className="max-h-48 overflow-y-auto space-y-1.5">
                {messageHistory.map(r => (
                  <div key={r.id} className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: "hsl(218,44%,8%)", border: "1px solid hsl(218,38%,16%)" }}>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-bold truncate" style={{ color: "hsl(43,25%,88%)" }}>{r.templateUsed || "Custom"}</p>
                      <p className="text-[9px] text-muted-foreground">{CHANNEL_META[r.channel].label} · {r.recipientCount} recipients · {new Date(r.sentAt).toLocaleDateString()}</p>
                    </div>
                    <button onClick={() => { setChannel(r.channel); setCompose(r.message); if (r.subject) setSubject(r.subject); setShowHistory(false); }} className="text-[9px] font-bold px-2 py-1 rounded-lg" style={{ color: meta.color }}>Reuse</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Drafts Panel ────────────────────────────────────────────────── */}
        {showDrafts && (
          <div className="rounded-2xl border p-3 space-y-2" style={{ background: "hsl(218,44%,11%)", borderColor: "hsl(218,38%,18%)" }}>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: "rgba(212,160,32,0.6)" }}>Saved Drafts</p>
            {drafts.length === 0 ? <p className="text-xs text-muted-foreground text-center py-4">No drafts.</p> : (
              <div className="max-h-48 overflow-y-auto space-y-1.5">
                {drafts.map(d => (
                  <div key={d.id} className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: "hsl(218,44%,8%)", border: "1px solid hsl(218,38%,16%)" }}>
                    <Bookmark size={12} style={{ color: CHANNEL_META[d.channel].color }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-bold truncate" style={{ color: "hsl(43,25%,88%)" }}>{d.label || "Draft"}</p>
                      <p className="text-[9px] text-muted-foreground truncate">{d.message.slice(0, 50)}{d.message.length > 50 ? "…" : ""}</p>
                      <p className="text-[8px] text-muted-foreground/50">{CHANNEL_META[d.channel].label} · {new Date(d.savedAt).toLocaleDateString()}</p>
                    </div>
                    <button onClick={() => loadDraft(d)} className="text-[9px] font-bold px-2 py-1 rounded-lg" style={{ color: meta.color }}>Load</button>
                    <button onClick={() => deleteDraft(d.id)} className="text-[9px] text-red-400">✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Groups Panel ────────────────────────────────────────────────── */}
        {showGroups && (
          <div className="rounded-2xl border p-3 space-y-2" style={{ background: "hsl(218,44%,11%)", borderColor: "hsl(218,38%,18%)" }}>
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: "rgba(212,160,32,0.6)" }}>Customer Groups</p>
              <button onClick={() => { if (!isPremium && customerGroups.length >= MAX_FREE_GROUPS) { toast({ title: "Group limit", description: "Upgrade to OneTailor Premium." }); return; } setShowNewGroup(true); setSelectMode("select"); }} className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg" style={{ color: meta.color, background: meta.bg }}><Plus size={10} /> New</button>
            </div>
            {customerGroups.length === 0 ? <p className="text-xs text-muted-foreground text-center py-4">No groups.</p> : (
              <div className="space-y-1.5">
                {customerGroups.map(g => (
                  <div key={g.id} className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: activeGroup?.id === g.id ? meta.bg : "hsl(218,44%,8%)", border: `1px solid ${activeGroup?.id === g.id ? meta.border : "hsl(218,38%,16%)"}` }}>
                    <FolderOpen size={12} style={{ color: meta.color }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-bold" style={{ color: "hsl(43,25%,88%)" }}>{g.name}</p>
                      <p className="text-[9px] text-muted-foreground">{g.customerIds.length} customers</p>
                    </div>
                    <button onClick={() => { setActiveGroup(g); setSelectMode("group"); setShowGroups(false); }} className="text-[9px] font-bold px-2 py-1 rounded-lg" style={{ color: meta.color }}>Select</button>
                    <button onClick={() => deleteGroup(g.id)} className="text-[9px] text-red-400">✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── New Group Input ─────────────────────────────────────────────── */}
        {showNewGroup && selectMode === "select" && (
          <div className="rounded-xl border p-3 space-y-2" style={{ background: "hsl(218,44%,11%)", borderColor: meta.border }}>
            <p className="text-[10px] font-bold" style={{ color: meta.color }}>Create Group</p>
            <input value={newGroupName} onChange={e => setNewGroupName(e.target.value)} placeholder="Group name (e.g. VIP)" className="w-full bg-transparent text-xs outline-none border rounded-lg px-3 py-2" style={{ borderColor: "hsl(218,38%,22%)", color: "hsl(43,25%,88%)" }} />
            <div className="flex gap-2">
              <button onClick={createGroup} disabled={!newGroupName.trim() || selected.size === 0} className="flex-1 py-2 rounded-xl text-[10px] font-bold disabled:opacity-50" style={{ background: meta.bg, color: meta.color }}>Save</button>
              <button onClick={() => { setShowNewGroup(false); setNewGroupName(""); }} className="py-2 px-4 rounded-xl text-[10px] font-bold" style={{ color: "hsl(218,20%,50%)" }}>Cancel</button>
            </div>
          </div>
        )}

        {/* ── Channel Tabs ────────────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-2">
          {(["whatsapp", "sms", "email"] as Channel[]).map(ch => {
            const m = CHANNEL_META[ch]; const MI = m.icon; const active = channel === ch;
            return (
              <button key={ch} onClick={() => { setChannel(ch); setSelectedTemplate(null); setCompose(""); setSubject(""); }} className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-2xl border transition-all active:scale-[0.97]" style={active ? { background: m.bg, borderColor: m.border } : { background: "hsl(218,44%,11%)", borderColor: "hsl(218,38%,18%)" }}>
                <MI size={20} />
                <p className="text-[11px] font-black" style={{ color: active ? m.color : "hsl(218,20%,55%)" }}>{m.label}</p>
                {!isPremium && <span className="text-[8px] font-black px-1.5 py-0.5 rounded-full" style={{ background: "rgba(212,160,32,0.12)", color: "hsl(43,82%,55%)" }}>LIMITED</span>}
              </button>
            );
          })}
        </div>

        {/* ── Reachable Count ─────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-3 py-2 rounded-xl" style={{ background: meta.bg, border: `1px solid ${meta.border}` }}>
          <div className="flex items-center gap-2">
            <Users size={13} style={{ color: meta.color }} />
            <p className="text-xs font-bold" style={{ color: meta.color }}>{loading ? "Loading…" : `${reachable.length} reachable via ${meta.label}`}</p>
          </div>
          {!isPremium && <span className="text-[9px] font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(0,0,0,0.2)", color: meta.color }}>Max {freeLimit} bulk</span>}
          {activeGroup && <span className="text-[9px] font-bold px-2 py-0.5 rounded-full" style={{ background: meta.bg, color: meta.color }}>Group: {activeGroup.name}</span>}
        </div>

        {/* ── Quick Replies Row ────────────────────────────────────────────── */}
        {isPremium && quickReplies.length > 0 && (
          <div>
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
              {quickReplies.map(qr => (
                <button key={qr.id} onClick={() => pickTemplate(qr)} className="shrink-0 text-[10px] font-bold px-3 py-1.5 rounded-xl" style={{ background: "rgba(212,160,32,0.08)", color: "hsl(43,82%,55%)", border: "1px solid rgba(212,160,32,0.15)" }}>
                  <Zap size={9} className="inline mr-1" />{qr.title}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Templates ───────────────────────────────────────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: "rgba(212,160,32,0.6)" }}>Templates</p>
            <button onClick={openNewTemplate} className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg active:scale-95" style={{ color: meta.color, background: meta.bg, border: `1px solid ${meta.border}` }}><Plus size={12} /> New</button>
          </div>
          {isPremium && categories.length > 2 && (
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar mb-2">
              {categories.map(cat => (
                <button key={cat} onClick={() => setTemplateFilter(cat)} className="shrink-0 text-[9px] font-bold px-2.5 py-1 rounded-lg" style={templateFilter === cat ? { background: meta.bg, color: meta.color, border: `1px solid ${meta.border}` } : { color: "hsl(218,20%,50%)", border: "1px solid hsl(218,38%,18%)" }}>{cat === "all" ? "All" : cat}</button>
              ))}
            </div>
          )}
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {filteredTemplates.map(t => (
              <div key={t.id} className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-2xl border cursor-pointer group relative" style={selectedTemplate?.id === t.id ? { background: meta.bg, borderColor: meta.border } : { background: "hsl(218,44%,11%)", borderColor: "hsl(218,38%,18%)" }} onClick={() => pickTemplate(t)}>
                {t.isQuickReply && <Zap size={10} style={{ color: "hsl(43,82%,55%)" }} />}
                <p className="text-[11px] font-bold whitespace-nowrap" style={{ color: selectedTemplate?.id === t.id ? meta.color : "hsl(218,20%,65%)" }}>{t.title}</p>
                <button onClick={e => { e.stopPropagation(); openEditTemplate(t); }} className="ml-1 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors"><Pencil size={10} /></button>
                {isPremium && <button onClick={e => { e.stopPropagation(); toggleQuickReply(t); }} className="text-muted-foreground/50 group-hover:text-muted-foreground transition-colors"><Star size={10} className={t.isQuickReply ? "text-yellow-400" : ""} /></button>}
                <button onClick={e => { e.stopPropagation(); deleteTemplate(t.id); }} className="text-red-400/50 group-hover:text-red-400 transition-colors"><Trash2 size={10} /></button>
              </div>
            ))}
          </div>
        </div>

        {/* ── Compose ─────────────────────────────────────────────────────── */}
        <div className="rounded-2xl border overflow-hidden" style={{ background: "hsl(218,44%,11%)", borderColor: "hsl(218,38%,18%)" }}>
          <div className="px-3 pt-3 pb-1">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: "rgba(212,160,32,0.6)" }}>Compose</p>
              {compose.trim() && <button onClick={() => setShowSaveDraft(true)} className="flex items-center gap-1 text-[9px] font-bold" style={{ color: meta.color }}><Save size={9} /> Save Draft</button>}
            </div>
            {channel === "email" && <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Subject…" className="w-full bg-transparent text-sm font-bold outline-none border-b mb-2 pb-2" style={{ borderColor: "hsl(218,38%,22%)", color: "hsl(43,25%,88%)" }} />}
            <textarea value={compose} onChange={e => setCompose(e.target.value)} rows={4} placeholder="Type your message… Use {name} to personalise." className="w-full bg-transparent text-sm outline-none resize-none" style={{ color: "hsl(43,25%,88%)" }} />
          </div>
          <div className="px-3 pb-2 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <p className="text-[9px] text-muted-foreground">{compose.length} chars · <span style={{ color: meta.color }}>{"{name}"}</span> = client name</p>
              {channel === "sms" && (
                <span className={`text-[9px] font-bold ${smsExceedsLimit ? "text-red-400" : "text-muted-foreground"}`}>
                  {smsSegmentCount > 1 ? `${smsSegmentCount} SMS segments` : `${smsCharCount}/${SMS_CHAR_LIMIT}`}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {compose && <button onClick={copyMessageToClipboard} className="text-[9px] flex items-center gap-1 text-muted-foreground"><Copy size={9} /> Copy</button>}
              {compose && <button onClick={() => { setCompose(""); setSelectedTemplate(null); }} className="text-[9px] text-red-400">Clear</button>}
            </div>
          </div>
          {showSaveDraft && (
            <div className="px-3 pb-3 flex items-center gap-2">
              <input value={draftLabel} onChange={e => setDraftLabel(e.target.value)} placeholder="Draft name (optional)" className="flex-1 bg-transparent text-xs outline-none border rounded-lg px-3 py-1.5" style={{ borderColor: "hsl(218,38%,22%)", color: "hsl(43,25%,88%)" }} autoFocus />
              <button onClick={saveDraft} className="text-[10px] font-bold px-3 py-1.5 rounded-lg" style={{ background: meta.bg, color: meta.color }}>Save</button>
              <button onClick={() => setShowSaveDraft(false)} className="text-[10px] text-muted-foreground">✕</button>
            </div>
          )}
        </div>

        {/* ── Limit Warning ───────────────────────────────────────────────── */}
        {exceedsFreeLimit && (
          <div className="rounded-xl border p-3 text-center" style={{ background: "rgba(212,160,32,0.05)", borderColor: "rgba(212,160,32,0.2)" }}>
            <p className="text-[11px] font-bold" style={{ color: "hsl(43,82%,55%)" }}>{targetCustomers.length} selected — Free limited to {freeLimit}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Upgrade to OneTailor Premium for unlimited bulk messaging.</p>
          </div>
        )}

        {/* ── Recipients ──────────────────────────────────────────────────── */}
        <div className="rounded-2xl border overflow-hidden" style={{ background: "hsl(218,44%,11%)", borderColor: "hsl(218,38%,18%)" }}>
          <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "hsl(218,38%,18%)" }}>
            <div className="flex items-center gap-2"><Users size={14} className="text-muted-foreground" /><p className="text-xs font-black">Recipients</p></div>
            <div className="flex items-center gap-1.5">
              <button onClick={() => { setSelectMode("all"); setActiveGroup(null); }} className="text-[10px] font-bold px-2.5 py-1 rounded-lg" style={selectMode === "all" && !activeGroup ? { background: meta.bg, color: meta.color, border: `1px solid ${meta.border}` } : { color: "hsl(218,20%,50%)", border: "1px solid hsl(218,38%,18%)" }}>All ({reachable.length})</button>
              <button onClick={() => { setSelectMode("select"); setActiveGroup(null); }} className="text-[10px] font-bold px-2.5 py-1 rounded-lg" style={selectMode === "select" && !activeGroup ? { background: meta.bg, color: meta.color, border: `1px solid ${meta.border}` } : { color: "hsl(218,20%,50%)", border: "1px solid hsl(218,38%,18%)" }}>Select</button>
              {customerGroups.length > 0 && <button onClick={() => { setSelectMode("group"); setShowGroups(true); }} className="text-[10px] font-bold px-2.5 py-1 rounded-lg" style={selectMode === "group" ? { background: meta.bg, color: meta.color, border: `1px solid ${meta.border}` } : { color: "hsl(218,20%,50%)", border: "1px solid hsl(218,38%,18%)" }}>Groups</button>}
            </div>
          </div>
          {selectMode === "select" && !activeGroup && (
            <div>
              <div className="px-4 py-2 border-b flex items-center justify-between" style={{ borderColor: "hsl(218,38%,18%)" }}>
                <div className="relative flex-1 mr-2">
                  <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…" className="w-full pl-7 pr-3 py-1.5 rounded-xl text-xs outline-none bg-transparent border" style={{ borderColor: "hsl(218,38%,22%)", color: "hsl(43,25%,88%)" }} />
                </div>
                <button onClick={toggleSelectAll} className="shrink-0 text-[9px] font-bold px-2 py-1 rounded-lg border" style={{ borderColor: "hsl(218,38%,18%)", color: allSelected ? meta.color : "hsl(218,20%,50%)" }}>
                  {allSelected ? "Deselect All" : "Select All"}
                </button>
              </div>
              <div className="max-h-56 overflow-y-auto">
                {filtered.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-6">No matching clients.</p>
                ) : (
                  filtered.map(c => (
                    <button key={c.id} onClick={() => toggleSelect(c.id)} className="w-full flex items-center gap-3 px-4 py-2.5 border-b last:border-b-0 text-left" style={{ borderColor: "hsl(218,38%,16%)" }}>
                      {selected.has(c.id) ? <CheckSquare size={15} style={{ color: meta.color }} /> : <Square size={15} className="text-muted-foreground" />}
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${c.gender === "female" ? "bg-pink-500/10 text-pink-400" : "bg-blue-500/10 text-blue-400"}`}>{c.name.charAt(0)}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold truncate" style={{ color: "hsl(43,25%,88%)" }}>{c.name}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{channel === "email" ? c.email : c.phone}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
              {selected.size > 0 && (
                <div className="px-4 py-2 border-t flex items-center justify-between" style={{ borderColor: "hsl(218,38%,18%)" }}>
                  <p className="text-[10px] font-bold" style={{ color: meta.color }}>{selected.size} selected</p>
                  {showNewGroup && (
                    <button onClick={createGroup} disabled={!newGroupName.trim()} className="text-[10px] font-bold px-2 py-1 rounded-lg disabled:opacity-50" style={{ background: meta.bg, color: meta.color }}>Create Group</button>
                  )}
                </div>
              )}
            </div>
          )}
          {selectMode === "group" && activeGroup && (
            <div className="px-4 py-3 text-center">
              <p className="text-xs font-bold" style={{ color: meta.color }}>{activeGroup.name}</p>
              <p className="text-[10px] text-muted-foreground">{activeGroup.customerIds.length} customers</p>
            </div>
          )}
        </div>

        {/* ── Send Button ──────────────────────────────────────────────────── */}
        <button onClick={sendBatch} disabled={!compose.trim() || targetCustomers.length === 0 || sending} className="w-full py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50" style={{ background: exceedsFreeLimit ? "linear-gradient(135deg, hsl(43,82%,55%), hsl(43,90%,68%))" : meta.bg, color: exceedsFreeLimit ? "#000" : meta.color, border: `1px solid ${exceedsFreeLimit ? "rgba(212,160,32,0.3)" : meta.border}` }}>
          {sending ? <><span className="animate-spin">⏳</span> {sendProgress.current}/{sendProgress.total}</> : exceedsFreeLimit ? <><Crown size={16} /> Upgrade to OneTailor Premium</> : <><Icon size={16} /> Send via {meta.label} to {targetCustomers.length} client{targetCustomers.length !== 1 ? "s" : ""}</>}
        </button>

        {/* ── Individual Quick-Send ────────────────────────────────────────── */}
        {compose.trim() && reachable.length > 0 && (
          <div>
            <button onClick={() => setShowCustomers(v => !v)} className="flex items-center gap-1.5 text-[10px] font-bold mb-2" style={{ color: "rgba(212,160,32,0.6)" }}>{showCustomers ? <ChevronUp size={12} /> : <ChevronDown size={12} />} {showCustomers ? "Hide" : "Show"} all — send individually</button>
            {showCustomers && (
              <div className="space-y-2">
                {reachable.map(c => (
                  <div key={c.id} className="flex items-center gap-3 p-3 rounded-2xl border" style={{ background: "hsl(218,44%,11%)", borderColor: "hsl(218,38%,18%)" }}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${c.gender === "female" ? "bg-pink-500/10 text-pink-400" : "bg-blue-500/10 text-blue-400"}`}>{c.name.charAt(0)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold truncate" style={{ color: "hsl(43,25%,88%)" }}>{c.name}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{channel === "email" ? c.email : c.phone}</p>
                    </div>
                    <button onClick={() => sendOne(c)} className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center" style={{ background: meta.bg }}><Send size={12} style={{ color: meta.color }} /></button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Send Confirmation Modal ─────────────────────────────────────── */}
      {showSendConfirm && (
        <div className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-sm flex items-center justify-center p-5 animate-in fade-in duration-200">
          <div className="bg-card w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl border border-border animate-in zoom-in-95 duration-200">
            <div className="p-6 space-y-4">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto" style={{ background: meta.bg }}>
                <Icon size={28} style={{ color: meta.color }} />
              </div>
              <div className="text-center space-y-1.5">
                <h3 className="text-base font-black">Send Message{targetCustomers.length > 1 ? "s" : ""}?</h3>
                <p className="text-sm text-muted-foreground">
                  This will open {targetCustomers.length} {CHANNEL_META[channel].label} message{targetCustomers.length !== 1 ? "s" : ""}
                  {channel === "whatsapp" ? " — you'll need to press Send in each chat." : "."}
                </p>
                {channel === "sms" && smsExceedsLimit && (
                  <p className="text-xs text-red-400 font-bold">Message exceeds {SMS_CHAR_LIMIT} characters and will be split into {smsSegmentCount} SMS.</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => setShowSendConfirm(false)}
                  className="py-3 rounded-2xl border border-border text-sm font-bold text-muted-foreground hover:bg-muted transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmAndSend}
                  className="py-3 rounded-2xl text-sm font-bold active:scale-[0.98] transition-all"
                  style={{ background: meta.bg, color: meta.color, border: `1px solid ${meta.border}` }}
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Upsell Modal ──────────────────────────────────────────────────── */}
      {showPremiumUpsell && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-end md:items-center justify-center" onClick={() => setShowPremiumUpsell(false)}>
          <div className="bg-card w-full max-w-md rounded-t-3xl md:rounded-3xl border border-border shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-center pt-3 pb-1 md:hidden"><div className="w-10 h-1 rounded-full bg-border" /></div>
            <div className="px-6 pb-6 pt-4 text-center">
              <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-4" style={{ background: "rgba(212,160,32,0.12)", border: "2px solid rgba(212,160,32,0.25)" }}><Crown size={28} style={{ color: "hsl(43,82%,55%)" }} /></div>
              <h3 className="text-lg font-black mb-1" style={{ color: "hsl(43,82%,55%)" }}>OneTailor Premium</h3>
              <p className="text-sm text-muted-foreground mb-4">{upsellReason}</p>
              <div className="space-y-2 mb-5 text-left">
                {PREMIUM_FEATURES.map((f, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-2.5 rounded-xl" style={{ background: "hsl(218,44%,11%)", border: "1px solid hsl(218,38%,18%)" }}>
                    <f.icon size={16} style={{ color: "hsl(43,82%,55%)" }} />
                    <span className="text-xs font-bold">{f.text}</span>
                  </div>
                ))}
              </div>
              <a href="/pre-unlock" className="block w-full py-3.5 rounded-2xl font-black text-sm text-black mb-3" style={{ background: "linear-gradient(135deg, hsl(43,82%,55%), hsl(43,90%,68%))" }}><Crown size={16} className="inline mr-2" />Upgrade to OneTailor Premium</a>
              <button onClick={proceedFreeAnyway} className="text-xs font-bold text-muted-foreground hover:text-white">Continue with free sending</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Template Editor Modal ──────────────────────────────────────────── */}
      {showTemplateEditor && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-end justify-center" onClick={() => setShowTemplateEditor(false)}>
          <div className="bg-card w-full max-w-lg rounded-t-3xl border border-border border-b-0 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-center pt-3 pb-1"><div className="w-10 h-1 rounded-full bg-border" /></div>
            <div className="px-5 pb-6 pt-2">
              <div className="flex items-center justify-between mb-4"><h3 className="text-sm font-black">{editingTemplate ? "Edit" : "New"} Template</h3><button onClick={() => setShowTemplateEditor(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-muted/50"><X size={14} /></button></div>
              <div className="space-y-3">
                <input value={editTitle} onChange={e => setEditTitle(e.target.value)} placeholder="Template name" className="w-full bg-muted/20 border border-border rounded-xl px-3 py-2.5 text-sm outline-none" />
                {channel === "email" && <input value={editSubject} onChange={e => setEditSubject(e.target.value)} placeholder="Subject" className="w-full bg-muted/20 border border-border rounded-xl px-3 py-2.5 text-sm outline-none" />}
                {isPremium && <input value={editCategory} onChange={e => setEditCategory(e.target.value)} placeholder="Category (e.g. Follow-up)" className="w-full bg-muted/20 border border-border rounded-xl px-3 py-2.5 text-sm outline-none" />}
                <textarea value={editBody} onChange={e => setEditBody(e.target.value)} rows={5} placeholder="Use {name} for client name" className="w-full bg-muted/20 border border-border rounded-xl px-3 py-2.5 text-sm outline-none resize-none" />
              </div>
              <button onClick={saveTemplate} disabled={!editTitle.trim() || !editBody.trim()} className="w-full mt-4 py-3.5 rounded-2xl font-black text-sm disabled:opacity-50" style={{ background: meta.bg, color: meta.color }}><Check size={14} /> Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}