import { useState, useMemo } from "react";
import { Layers, Plus, Trash2, Check, ChevronDown, ArrowRight, Search, Edit2, Copy, Eye, X } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { useAppStore } from "@/store/useAppStore";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { SYSTEM_TEMPLATES_META, MEASUREMENT_FIELD_LIBRARY } from "@/lib/measurement-data";

const inp = "w-full px-4 py-3 rounded-xl bg-muted/30 border border-border outline-none focus:border-primary text-sm font-medium placeholder:text-muted-foreground/50";

type Gender = "male" | "female" | "both";

const genderStyle: Record<Gender, string> = {
  male:   "bg-blue-500/10 text-blue-500 border-blue-500/20",
  female: "bg-pink-500/10 text-pink-500 border-pink-500/20",
  both:   "bg-purple-500/10 text-purple-500 border-purple-500/20",
};

export default function MeasurementTemplates() {
  const { toast }               = useToast();
  const [, setLocation]         = useLocation();

  const customTemplates         = useAppStore(s => s.customTemplates);
  const customMeasurementFields = useAppStore(s => s.customMeasurementFields);
  const addCustomTemplate       = useAppStore(s => s.addCustomTemplate);
  const updateCustomTemplate    = useAppStore(s => s.updateCustomTemplate);
  const deleteCustomTemplate    = useAppStore(s => s.deleteCustomTemplate);
  const addCustomMeasurementField = useAppStore(s => s.addCustomMeasurementField);

  const [showCreate, setShowCreate]   = useState(false);
  const [showSystem, setShowSystem]   = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [genderFilter, setGenderFilter] = useState<"all" | Gender>("all");
  const [editingId, setEditingId]     = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    gender: "both" as Gender,
    selectedFields: [] as string[],
    customFieldInput: "",
  });

  const isEditing = editingId !== null;

  const filteredTemplates = useMemo(() => {
    return customTemplates.filter(t => {
      const matchesName = !searchQuery.trim() || t.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesGender = genderFilter === "all" || t.gender === genderFilter;
      return matchesName && matchesGender;
    });
  }, [customTemplates, searchQuery, genderFilter]);

  const toggleField = (field: string) =>
    setForm(f => ({
      ...f,
      selectedFields: f.selectedFields.includes(field)
        ? f.selectedFields.filter(x => x !== field)
        : [...f.selectedFields, field],
    }));

  const handleAddCustomField = () => {
    const name = form.customFieldInput.trim();
    if (!name) return;
    if (form.selectedFields.includes(name)) {
      toast({ description: "Field already added." });
      return;
    }
    addCustomMeasurementField(name);
    setForm(f => ({ ...f, selectedFields: [...f.selectedFields, name], customFieldInput: "" }));
  };

  const startFromSystem = (systemTemplateName: string) => {
    const meta = SYSTEM_TEMPLATES_META[systemTemplateName];
    if (!meta) return;
    // Open the create form if not already open
    if (!showCreate) {
      setShowCreate(true);
      setEditingId(null);
      setForm({ name: "", gender: "both", selectedFields: [], customFieldInput: "" });
    }
    // Wait briefly for form to render, then add fields
    setTimeout(() => {
      setForm(f => ({
        ...f,
        name: f.name || systemTemplateName,
        gender: meta.gender,
        selectedFields: [...new Set([...f.selectedFields, ...meta.fields])],
      }));
      toast({ title: "Template loaded", description: `${meta.fields.length} fields from "${systemTemplateName}"` });
    }, 100);
  };

  const handleEdit = (template: typeof customTemplates[0]) => {
    setForm({
      name: template.name,
      gender: template.gender,
      selectedFields: [...template.fields],
      customFieldInput: "",
    });
    setEditingId(template.id);
    setShowCreate(true);
    setShowPreview(false);
    window.scrollTo({ top: document.getElementById("template-form")?.offsetTop || 0, behavior: "smooth" });
  };

  const handleDuplicate = (template: typeof customTemplates[0]) => {
    const newName = `${template.name} (Copy)`;
    if (customTemplates.some(t => t.name === newName)) {
      toast({ title: "Copy already exists", description: `"${newName}" already exists.`, variant: "destructive" });
      return;
    }
    addCustomTemplate({ name: newName, gender: template.gender, fields: [...template.fields] });
    toast({ title: "Duplicated", description: `"${newName}" created.` });
  };

  const confirmDelete = (id: string) => {
    setDeleteConfirmId(id);
  };

  const handleDelete = () => {
    if (!deleteConfirmId) return;
    const template = customTemplates.find(t => t.id === deleteConfirmId);
    deleteCustomTemplate(deleteConfirmId);
    toast({ title: "Deleted", description: `"${template?.name || "Template"}" removed.` });
    setDeleteConfirmId(null);
    // If editing the deleted template, cancel
    if (editingId === deleteConfirmId) {
      cancelForm();
    }
  };

  const handleSave = () => {
    if (!form.name.trim()) {
      toast({ title: "Name required", variant: "destructive" });
      return;
    }
    if (form.selectedFields.length === 0) {
      toast({ title: "Select at least one field", variant: "destructive" });
      return;
    }

    if (!isEditing && SYSTEM_TEMPLATES_META[form.name.trim()]) {
      toast({ title: "Name conflicts with a system template", description: "Choose a different name.", variant: "destructive" });
      return;
    }
    if (!isEditing && customTemplates.some(t => t.name === form.name.trim())) {
      toast({ title: "Template already exists", variant: "destructive" });
      return;
    }
    // When editing, check for conflicts with OTHER templates
    if (isEditing && customTemplates.some(t => t.name === form.name.trim() && t.id !== editingId)) {
      toast({ title: "Name already used", description: "Another template has this name.", variant: "destructive" });
      return;
    }

    if (isEditing && editingId) {
      updateCustomTemplate(editingId, {
        name: form.name.trim(),
        gender: form.gender,
        fields: form.selectedFields,
      });
      toast({ title: "Updated", description: `"${form.name.trim()}" saved.` });
    } else {
      addCustomTemplate({ name: form.name.trim(), gender: form.gender, fields: form.selectedFields });
      toast({ title: "Template saved!", description: `"${form.name.trim()}" is now available in measurements.` });
    }

    setForm({ name: "", gender: "both", selectedFields: [], customFieldInput: "" });
    setShowCreate(false);
    setEditingId(null);
    setShowPreview(false);
  };

  const cancelForm = () => {
    setForm({ name: "", gender: "both", selectedFields: [], customFieldInput: "" });
    setShowCreate(false);
    setEditingId(null);
    setShowPreview(false);
  };

  return (
    <div className="max-w-xl mx-auto pb-24">
      <PageHeader
        title="Measurement Templates"
        subtitle="Save garment presets for one-tap reuse"
        backPath="/all-tools?cat=measurements"
        backLabel="Measurements"
      />

      {/* ── Delete Confirmation Modal ────────────────────────────────────── */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-[300] bg-black/70 backdrop-blur-sm flex items-center justify-center p-5 animate-in fade-in duration-200">
          <div className="bg-card w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl border border-red-500/20 animate-in zoom-in-95 duration-200">
            <div className="p-6 space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto">
                <Trash2 size={28} className="text-red-500" />
              </div>
              <div className="text-center space-y-1.5">
                <h3 className="text-base font-black">Delete Template?</h3>
                <p className="text-sm text-muted-foreground">
                  This will permanently remove "{customTemplates.find(t => t.id === deleteConfirmId)?.name || "this template"}".
                </p>
                <p className="text-xs text-red-400 font-bold">This cannot be undone.</p>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => setDeleteConfirmId(null)}
                  className="py-3 rounded-2xl border border-border text-sm font-bold text-muted-foreground hover:bg-muted transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="py-3 rounded-2xl bg-red-500 text-white text-sm font-bold shadow-lg shadow-red-500/20 active:scale-[0.98] transition-all"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="px-4 py-5 space-y-6">

        {/* Use-in-measurement hint */}
        <button
          onClick={() => setLocation("/customer-measurement")}
          className="w-full flex items-center justify-between p-4 rounded-2xl border border-dashed transition-all active:scale-[0.98]"
          style={{ borderColor: "rgba(212,160,32,0.3)", background: "rgba(212,160,32,0.05)" }}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(212,160,32,0.12)" }}>
              <Layers size={18} style={{ color: "hsl(43,82%,55%)" }} />
            </div>
            <div className="text-left">
              <p className="text-sm font-bold" style={{ color: "hsl(43,25%,90%)" }}>Apply in Client Measurements</p>
              <p className="text-xs text-muted-foreground">Select a template when adding a new measurement</p>
            </div>
          </div>
          <ArrowRight size={16} className="text-muted-foreground shrink-0" />
        </button>

        {/* My Templates */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <Layers size={13} /> My Templates
              {customTemplates.length > 0 && (
                <span className="px-1.5 py-0.5 rounded-md text-[10px] bg-white/5">{customTemplates.length}</span>
              )}
            </h3>
            <button
              onClick={() => { 
                if (showCreate && !isEditing) { cancelForm(); return; }
                setShowCreate(true);
                setEditingId(null);
                setForm({ name: "", gender: "both", selectedFields: [], customFieldInput: "" });
                setShowPreview(false);
                setTimeout(() => {
                  window.scrollTo({ top: document.getElementById("template-form")?.offsetTop || 0, behavior: "smooth" });
                }, 100);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all"
            >
              <Plus size={12} />
              {showCreate && !isEditing ? "Cancel" : "Create"}
            </button>
          </div>

          {/* Search + Gender filter */}
          {customTemplates.length > 0 && (
            <div className="space-y-2">
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
                <input
                  type="text"
                  placeholder="Search templates…"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl text-xs font-medium bg-muted/30 border border-border outline-none focus:border-primary/50 transition-all placeholder:text-muted-foreground/40"
                />
              </div>
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-0.5">
                {(["all", "male", "female", "both"] as const).map(g => (
                  <button
                    key={g}
                    onClick={() => setGenderFilter(g)}
                    className={`shrink-0 px-3 py-1.5 rounded-xl text-[10px] font-bold border transition-all capitalize ${
                      genderFilter === g
                        ? "bg-primary/10 border-primary text-primary"
                        : "bg-card border-border text-muted-foreground"
                    }`}
                  >
                    {g === "all" ? "All" : g === "both" ? "All Genders" : g}
                  </button>
                ))}
              </div>
            </div>
          )}

          {customTemplates.length === 0 && !showCreate && (
            <div className="text-center py-12 bg-card border border-dashed border-border rounded-3xl">
              <Layers size={32} className="mx-auto text-muted-foreground/20 mb-3" />
              <p className="text-xs text-muted-foreground">No custom templates yet</p>
              <button onClick={() => {
                setShowCreate(true);
                setTimeout(() => window.scrollTo({ top: document.getElementById("template-form")?.offsetTop || 0, behavior: "smooth" }), 100);
              }} className="mt-3 text-xs font-black text-primary uppercase tracking-widest">
                Create your first template
              </button>
            </div>
          )}

          {filteredTemplates.length === 0 && customTemplates.length > 0 && (
            <div className="text-center py-10 bg-card border border-dashed border-border rounded-3xl">
              <Search size={26} className="mx-auto text-muted-foreground/20 mb-3" />
              <p className="text-xs text-muted-foreground">No templates match your filter</p>
              <button
                onClick={() => { setSearchQuery(""); setGenderFilter("all"); }}
                className="mt-3 text-xs font-black text-primary uppercase tracking-widest"
              >
                Clear filters
              </button>
            </div>
          )}

          {filteredTemplates.map(t => (
            <div key={t.id} className="p-4 bg-card border border-border rounded-2xl space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-bold">{t.name}</p>
                    <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-md border ${genderStyle[t.gender]}`}>
                      {t.gender}
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">{t.fields.length} fields</p>
                  <p className="text-[10px] text-muted-foreground/60 mt-0.5 truncate">
                    {t.fields.slice(0, 6).join(", ")}{t.fields.length > 6 ? "…" : ""}
                  </p>
                </div>
              </div>
              {/* Action buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(t)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-muted/30 border border-border text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <Edit2 size={12} /> Edit
                </button>
                <button
                  onClick={() => handleDuplicate(t)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-muted/30 border border-border text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <Copy size={12} /> Duplicate
                </button>
                <button
                  onClick={() => confirmDelete(t.id)}
                  className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold hover:bg-red-500/20 transition-colors"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Create / Edit form */}
        {showCreate && (
          <div id="template-form" className="bg-card border border-primary/20 rounded-3xl p-6 space-y-5 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-black uppercase tracking-widest text-primary">
                {isEditing ? "Edit Template" : "New Template"}
              </h4>
              <button onClick={cancelForm} className="w-8 h-8 flex items-center justify-center rounded-full bg-muted/50 hover:bg-muted transition-colors">
                <X size={14} />
              </button>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1 mb-1.5 block">Template Name *</label>
              <input
                placeholder="e.g. Agbada Suit, Ladies Gown..."
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                className={inp}
              />
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1 mb-2 block">Fits For</label>
              <div className="grid grid-cols-3 gap-2">
                {(["male", "female", "both"] as Gender[]).map(g => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setForm({ ...form, gender: g })}
                    className={`py-2.5 rounded-xl text-xs font-bold border transition-all capitalize ${form.gender === g ? "bg-primary/10 border-primary text-primary" : "bg-muted/20 border-border text-muted-foreground"}`}
                  >
                    {g === "both" ? "All" : g}
                  </button>
                ))}
              </div>
            </div>

            {/* Start from System Template */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1 mb-2 block">Quick Start from System Template</label>
              <div className="flex flex-wrap gap-1.5">
                {Object.keys(SYSTEM_TEMPLATES_META).map(name => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => startFromSystem(name)}
                    className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold border border-border bg-muted/30 text-muted-foreground hover:border-primary/30 hover:text-primary transition-all"
                  >
                    + {name}
                  </button>
                ))}
              </div>
              <p className="text-[9px] text-muted-foreground mt-1.5">Tap to add all fields from a system template</p>
            </div>

            {/* Field Selection */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">
                  Measurement Fields
                  {form.selectedFields.length > 0 && (
                    <span className="ml-2 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[9px]">
                      {form.selectedFields.length} selected
                    </span>
                  )}
                </label>
                {form.selectedFields.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowPreview(!showPreview)}
                    className="flex items-center gap-1 text-[10px] font-bold text-primary"
                  >
                    <Eye size={11} /> {showPreview ? "Hide Preview" : "Preview"}
                  </button>
                )}
              </div>

              {Object.entries(MEASUREMENT_FIELD_LIBRARY).map(([group, fields]) => (
                <div key={group}>
                  <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50 mb-2">{group}</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {fields.map(field => {
                      const selected = form.selectedFields.includes(field);
                      return (
                        <button
                          key={field}
                          type="button"
                          onClick={() => toggleField(field)}
                          className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-medium transition-all text-left ${selected ? "bg-primary/10 border-primary text-primary" : "bg-muted/20 border-border text-muted-foreground"}`}
                        >
                          <div className={`w-4 h-4 rounded flex-shrink-0 flex items-center justify-center border transition-all ${selected ? "bg-primary border-primary" : "border-border"}`}>
                            {selected && <Check size={10} className="text-primary-foreground" />}
                          </div>
                          <span className="truncate">{field}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              {customMeasurementFields.length > 0 && (
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50 mb-2">Your Saved Fields</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {customMeasurementFields.map(field => {
                      const selected = form.selectedFields.includes(field);
                      return (
                        <button
                          key={field}
                          type="button"
                          onClick={() => toggleField(field)}
                          className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-medium transition-all text-left ${selected ? "bg-primary/10 border-primary text-primary" : "bg-amber-500/10 border-amber-500/20 text-amber-600"}`}
                        >
                          <div className={`w-4 h-4 rounded flex-shrink-0 flex items-center justify-center border transition-all ${selected ? "bg-primary border-primary" : "border-amber-500/30"}`}>
                            {selected && <Check size={10} className="text-primary-foreground" />}
                          </div>
                          <span className="truncate">{field}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50 mb-2">Add Custom Field</p>
                <div className="flex gap-2">
                  <input
                    placeholder="e.g. Collar Depth"
                    value={form.customFieldInput}
                    onChange={e => setForm({ ...form, customFieldInput: e.target.value })}
                    onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); handleAddCustomField(); } }}
                    className={`${inp} flex-1 py-2.5 text-xs`}
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomField}
                    className="px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-xs font-bold active:scale-95 transition-all"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>

            {/* Preview */}
            {showPreview && form.selectedFields.length > 0 && (
              <div className="border border-border rounded-2xl p-4 space-y-3 bg-muted/10 animate-in fade-in duration-200">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Template Preview</p>
                <p className="text-xs font-bold text-foreground">{form.name || "Untitled Template"}</p>
                <div className="grid grid-cols-2 gap-3">
                  {form.selectedFields.map(field => (
                    <div key={field}>
                      <label className="text-[10px] font-bold text-muted-foreground mb-1 block">{field}</label>
                      <div className="w-full py-2.5 px-3 rounded-xl bg-muted/30 border border-border text-xs text-muted-foreground/40">
                        0.0
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={handleSave}
              className="w-full py-4 bg-primary text-primary-foreground rounded-2xl font-bold shadow-lg shadow-primary/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              {isEditing ? "Update Template" : "Save Template"} <Check size={18} />
            </button>
          </div>
        )}

        {/* System templates reference */}
        <div className="bg-card border border-border rounded-3xl overflow-hidden">
          <button
            onClick={() => setShowSystem(v => !v)}
            className="w-full flex items-center justify-between px-5 py-4 text-left"
          >
            <div>
              <p className="text-sm font-bold">System Templates</p>
              <p className="text-xs text-muted-foreground">{Object.keys(SYSTEM_TEMPLATES_META).length} built-in garment types</p>
            </div>
            <ChevronDown size={16} className={`text-muted-foreground transition-transform ${showSystem ? "rotate-180" : ""}`} />
          </button>
          {showSystem && (
            <div className="px-4 pb-4 space-y-2 border-t border-border pt-3">
              {Object.entries(SYSTEM_TEMPLATES_META).map(([name, meta]) => (
                <div key={name} className="flex items-center justify-between p-3 bg-muted/20 border border-border rounded-xl">
                  <div>
                    <p className="text-xs font-bold">{name}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{meta.fields.length} fields</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => startFromSystem(name)}
                      className="text-[9px] font-bold text-primary px-2.5 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors"
                    >
                      Use Template
                    </button>
                    <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-md border ${genderStyle[meta.gender]}`}>
                      {meta.gender}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}