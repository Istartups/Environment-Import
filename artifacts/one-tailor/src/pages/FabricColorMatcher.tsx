import { useState, useRef, useCallback } from "react";
import {
  Palette,
  Upload,
  RefreshCw,
  Camera,
  Copy,
  Check,
  Star,
} from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { useAppStore } from "@/store/useAppStore";
import { useToast } from "@/hooks/use-toast";

interface ColorSuggestion {
  hex: string;
  name: string;
  role: string;
}

interface ExtractedColor {
  hex: string;
  rgb: [number, number, number];
  suggestions: ColorSuggestion[];
}

function rgbToHex(r: number, g: number, b: number): string {
  return (
    "#" +
    [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("")
  );
}

function hue(r: number, g: number, b: number): number {
  const max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  if (max === min) return 0;
  let h = 0;
  const d = max - min;
  if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return h * 60;
}

function saturation(r: number, g: number, b: number): number {
  const max = Math.max(r, g, b) / 255;
  const min = Math.min(r, g, b) / 255;
  const l = (max + min) / 2;
  if (max === min) return 0;
  return (max - min) / (l > 0.5 ? 2 - max - min : max + min);
}

function suggestColors(r: number, g: number, b: number): ColorSuggestion[] {
  const h = hue(r, g, b);
  const s = saturation(r, g, b);
  const brightness = (r * 0.299 + g * 0.587 + b * 0.114) / 255;
  const suggestions: ColorSuggestion[] = [];

  suggestions.push({
    hex: rgbToHex(r, g, b),
    name: "Exact Match",
    role: "Same tone as fabric",
  });

  if (brightness > 0.5) {
    suggestions.push({
      hex: "#1a1a1a",
      name: "Charcoal Black",
      role: "Strong contrast",
    });
    suggestions.push({
      hex: "#2d3748",
      name: "Dark Navy",
      role: "Classic complement",
    });
  } else {
    suggestions.push({
      hex: "#f5f0e8",
      name: "Off White",
      role: "High contrast",
    });
    suggestions.push({ hex: "#e8d5b7", name: "Cream", role: "Soft contrast" });
  }

  if (s > 0.3) {
    const comp = (h + 180) % 360;
    if (comp < 30 || comp > 330)
      suggestions.push({
        hex: "#c0392b",
        name: "Deep Red",
        role: "Accent thread",
      });
    else if (comp < 90)
      suggestions.push({
        hex: "#f39c12",
        name: "Golden Yellow",
        role: "Accent thread",
      });
    else if (comp < 150)
      suggestions.push({
        hex: "#27ae60",
        name: "Forest Green",
        role: "Accent thread",
      });
    else if (comp < 210)
      suggestions.push({
        hex: "#2980b9",
        name: "Royal Blue",
        role: "Accent thread",
      });
    else if (comp < 270)
      suggestions.push({
        hex: "#8e44ad",
        name: "Deep Purple",
        role: "Accent thread",
      });
    else
      suggestions.push({
        hex: "#c0392b",
        name: "Deep Red",
        role: "Accent thread",
      });
  }

  if (brightness > 0.3 && brightness < 0.7) {
    suggestions.push({
      hex: "#c9a84c",
      name: "Gold Thread",
      role: "Decorative / embroidery",
    });
  }

  suggestions.push({
    hex: "#6b7280",
    name: "Neutral Grey",
    role: "Safe all-purpose",
  });

  return suggestions.slice(0, 5);
}

function extractDominantColors(
  imageData: ImageData,
  count: number = 3,
): [number, number, number][] {
  const { data } = imageData;

  // Simple color bucket approach — sample every 4th pixel and group by hue range
  const buckets: Map<
    number,
    { r: number; g: number; b: number; count: number }
  > = new Map();

  for (let i = 0; i < data.length; i += 16) {
    const a = data[i + 3];
    if (a < 128) continue;

    const r = data[i],
      g = data[i + 1],
      b = data[i + 2];
    const h = Math.round(hue(r, g, b) / 30) * 30; // Group by 30° hue ranges

    const existing = buckets.get(h);
    if (existing) {
      existing.r += r;
      existing.g += g;
      existing.b += b;
      existing.count++;
    } else {
      buckets.set(h, { r, g, b, count: 1 });
    }
  }

  // Sort by frequency, take top N
  return Array.from(buckets.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, count)
    .map(
      (b) =>
        [b.r / b.count, b.g / b.count, b.b / b.count] as [
          number,
          number,
          number,
        ],
    );
}

export default function FabricColorMatcher() {
  const addRecentTool = useAppStore((s) => s.addRecentTool);
  const { toast } = useToast();
  useState(() => {
    addRecentTool("color-matcher");
  });

  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [extractedColors, setExtractedColors] = useState<
    ExtractedColor[] | null
  >(null);
  const [processing, setProcessing] = useState(false);
  const [copiedHex, setCopiedHex] = useState<string | null>(null);
  const [savedColors, setSavedColors] = useState<ColorSuggestion[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const analyze = useCallback((file: File) => {
    setProcessing(true);
    const url = URL.createObjectURL(file);
    setImageUrl(url);

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const size = 200;
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        setProcessing(false);
        return;
      }
      ctx.drawImage(img, 0, 0, size, size);
      const imageData = ctx.getImageData(0, 0, size, size);

      const colors = extractDominantColors(imageData, 3);
      const results: ExtractedColor[] = colors.map(([r, g, b]) => ({
        hex: rgbToHex(r, g, b),
        rgb: [Math.round(r), Math.round(g), Math.round(b)],
        suggestions: suggestColors(r, g, b),
      }));

      setExtractedColors(results);
      setProcessing(false);
    };
    img.onerror = () => setProcessing(false);
    img.src = url;
  }, []);

  const copyHex = (hex: string) => {
    navigator.clipboard.writeText(hex).then(() => {
      setCopiedHex(hex);
      toast({ title: "Copied", description: `${hex} copied to clipboard` });
      setTimeout(() => setCopiedHex(null), 1500);
    });
  };

  const toggleSaveColor = (color: ColorSuggestion) => {
    setSavedColors((prev) => {
      const exists = prev.find((s) => s.hex === color.hex);
      if (exists) {
        toast({
          title: "Removed",
          description: `${color.name} removed from saved`,
        });
        return prev.filter((s) => s.hex !== color.hex);
      }
      toast({
        title: "Saved",
        description: `${color.name} added to saved matches`,
      });
      return [...prev, color];
    });
  };

  const reset = () => {
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    setImageUrl(null);
    setExtractedColors(null);
    setCopiedHex(null);
  };

  const isSaved = (hex: string) => savedColors.some((s) => s.hex === hex);

  return (
    <div className="max-w-lg mx-auto">
      <PageHeader
        title="Fabric Color Matcher"
        subtitle="Find matching thread colors from your fabric"
        backPath="/all-tools?cat=fabric"
        backLabel="Fabric Tools"
      />
      <div className="px-4 py-5 space-y-4">
        {/* Upload / fabric preview */}
        {!imageUrl ? (
          <div className="space-y-3">
            <div
              onClick={() => {
                const input = inputRef.current;
                if (input) {
                  input.removeAttribute("capture");
                  input.click();
                }
              }}
              className="rounded-2xl p-10 flex flex-col items-center gap-3 border-2 border-dashed cursor-pointer transition-all active:scale-[0.98]"
              style={{
                borderColor: "rgba(212,160,32,0.3)",
                background: "rgba(212,160,32,0.04)",
              }}
            >
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{ background: "rgba(212,160,32,0.1)" }}
              >
                <Upload size={24} style={{ color: "hsl(43,82%,55%)" }} />
              </div>
              <div className="text-center">
                <p className="font-bold text-sm text-foreground">
                  Upload Fabric Photo
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Take a clear photo of the fabric in daylight
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                const input = inputRef.current;
                if (input) {
                  input.setAttribute("capture", "environment");
                  input.click();
                }
              }}
              className="w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
              style={{
                background: "rgba(212,160,32,0.1)",
                border: "1px solid rgba(212,160,32,0.25)",
                color: "hsl(43,82%,55%)",
              }}
            >
              <Camera size={16} /> Take Photo with Camera
            </button>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <img
              src={imageUrl}
              alt="Fabric"
              className="w-full h-48 object-cover"
            />
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) analyze(f);
            e.target.value = "";
          }}
        />

        {processing && (
          <div className="text-center py-6">
            <div
              className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-2"
              style={{
                borderColor: "hsl(43,82%,55%)",
                borderTopColor: "transparent",
              }}
            />
            <p className="text-sm text-muted-foreground">
              Analysing fabric colours…
            </p>
          </div>
        )}

        {/* Results */}
        {extractedColors && !processing && (
          <div className="space-y-4">
            {extractedColors.map((color, colorIdx) => (
              <div key={colorIdx} className="space-y-3">
                {/* Dominant color bar */}
                <div className="bg-card border border-border rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {colorIdx === 0
                        ? "Main Colour"
                        : colorIdx === 1
                          ? "Second Colour"
                          : "Third Colour"}
                    </p>
                    <button
                      onClick={() => copyHex(color.hex)}
                      className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground hover:text-white transition-colors"
                    >
                      {copiedHex === color.hex ? (
                        <Check size={11} className="text-green-400" />
                      ) : (
                        <Copy size={11} />
                      )}
                      {copiedHex === color.hex
                        ? "Copied"
                        : color.hex.toUpperCase()}
                    </button>
                  </div>
                  <div className="flex items-center gap-3">
                    <div
                      className="w-14 h-14 rounded-xl border border-border shrink-0"
                      style={{ background: color.hex }}
                    />
                    <div>
                      <p className="font-bold text-sm text-foreground">
                        {color.hex.toUpperCase()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        rgb({color.rgb.join(", ")})
                      </p>
                    </div>
                  </div>
                </div>

                {/* Thread suggestions */}
                <div className="bg-card border border-border rounded-2xl p-4 space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Thread Matches
                  </p>
                  {color.suggestions.map((s, i) => (
                    <div
                      key={i}
                      onClick={() => copyHex(s.hex)}
                      className="flex items-center gap-3 py-2 px-2 rounded-xl cursor-pointer hover:bg-muted/30 transition-colors group border-b border-border last:border-0"
                    >
                      <div
                        className="w-10 h-10 rounded-xl border border-border shrink-0 relative"
                        style={{ background: s.hex }}
                      >
                        {/* Small fabric color dot for comparison */}
                        <div
                          className="absolute -top-1 -right-1 w-4 h-4 rounded-full border border-border shadow-sm"
                          style={{ background: color.hex }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground">
                          {s.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {s.role}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <p className="text-[10px] font-mono text-muted-foreground">
                          {s.hex.toUpperCase()}
                        </p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSaveColor(s);
                          }}
                          className={`p-1 rounded-lg transition-all ${isSaved(s.hex) ? "text-amber-400" : "text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-amber-400"}`}
                        >
                          <Star
                            size={12}
                            fill={isSaved(s.hex) ? "currentColor" : "none"}
                          />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Saved matches */}
            {savedColors.length > 0 && (
              <div className="bg-card border border-border rounded-2xl p-4 space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Star
                    size={11}
                    className="text-amber-400"
                    fill="currentColor"
                  />{" "}
                  Saved Matches ({savedColors.length})
                </p>
                <div className="flex flex-wrap gap-2">
                  {savedColors.map((s, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-muted/30 border border-border"
                    >
                      <div
                        className="w-5 h-5 rounded-md border border-border shrink-0"
                        style={{ background: s.hex }}
                      />
                      <span className="text-[10px] font-bold text-foreground">
                        {s.name}
                      </span>
                      <button
                        onClick={() => toggleSaveColor(s)}
                        className="text-muted-foreground hover:text-red-400"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => inputRef.current?.click()}
                className="py-3 rounded-2xl font-semibold text-sm border border-border text-muted-foreground flex items-center justify-center gap-2 active:scale-95"
              >
                <Upload size={15} /> New Photo
              </button>
              <button
                onClick={reset}
                className="py-3 rounded-2xl font-semibold text-sm border border-border text-muted-foreground flex items-center justify-center gap-2 active:scale-95"
              >
                <RefreshCw size={15} /> Reset
              </button>
            </div>
          </div>
        )}

        {/* Tip */}
        <div className="rounded-xl px-4 py-3 bg-card border border-border">
          <p className="text-xs text-muted-foreground">
            💡 Photograph in natural daylight. Fill the frame with the fabric
            for best results. Take to your supplier with the hex code for exact
            matching.
          </p>
        </div>
      </div>
    </div>
  );
}
