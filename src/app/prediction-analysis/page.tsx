"use client";

import { useState, useRef, useEffect } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import Script from "next/script";

type Prediction = {
  date: string;
  probability: number;
  temperature: number;
  blooms: number;
};

type BloomPhase = {
  phase: string;
  duration: string;
  status: "current" | "predicted";
  confidence: number;
};

type Hotspot = {
  region: string;
  country: string;
  bloomType: string;
  peakDate: string;
  confidence: number;
  risk: "low" | "medium" | "high" | string;
};

type Anomaly = {
  region: string;
  type: string;
  severity: "low" | "medium" | "high" | string;
  description: string;
  impact: string;
};

export default function PredictionAnalysisPage() {
  
  const scope = useRef<HTMLDivElement | null>(null);
  const plotRef = useRef<HTMLDivElement | null>(null);
  const [figure, setFigure] = useState<any | null>(null);
  const [plotlyReady, setPlotlyReady] = useState(false);

  useGSAP(() => {
    const q = gsap.utils.selector(scope);

    // Nav entrance
    gsap.from(q("header"), { y: -20, opacity: 0, duration: 0.6, ease: "power2.out" });

    // Header text entrance
    gsap.from([q("[data-title]"), q("[data-subtitle]")], {
      y: 20,
      opacity: 0,
      duration: 0.7,
      stagger: 0.15,
      ease: "power2.out",
    });

    // Stats cards stagger
    gsap.from(q("[data-stat]"), {
      y: 24,
      opacity: 0,
      duration: 0.6,
      ease: "power2.out",
      stagger: 0.08,
      delay: 0.1,
    });

    // Sections reveal on scroll
    const sections = gsap.utils.toArray(q("[data-section]")) as HTMLElement[];
    sections.forEach((el) => {
      gsap.from(el, {
        opacity: 0,
        y: 24,
        duration: 0.6,
        ease: "power2.out",
        scrollTrigger: {
          trigger: el,
          start: "top 85%",
          toggleActions: "play none none reverse",
        },
      });
    });
  }, { scope });

  useEffect(() => {
    fetch("/biome_pest_prism.json")
      .then((res) => res.json())
      .then((json) => {
        try {
          const fig: any = { ...json };
          const layout: any = { ...(fig.layout || {}) };
          layout.paper_bgcolor = "rgba(0,0,0,0)";
          layout.plot_bgcolor = "rgba(0,0,0,0)";
          layout.font = { ...(layout.font || {}), color: "#e5e7eb" };
          layout.title = "";
          layout.margin = { ...(layout.margin || {}), t: 20, r: 60 };
          layout.scene = {
            ...(layout.scene || {}),
            bgcolor: "rgba(0,0,0,0)",
            xaxis: {
              ...(layout.scene?.xaxis || {}),
              backgroundcolor: "rgba(0,0,0,0)",
              gridcolor: "rgba(255,255,255,0.12)",
              linecolor: "rgba(255,255,255,0.25)",
              zerolinecolor: "rgba(255,255,255,0.25)",
              tickfont: { ...(layout.scene?.xaxis?.tickfont || {}), color: "#e5e7eb" },
              title: { ...(layout.scene?.xaxis?.title || {}), font: { color: "#e5e7eb" } },
            },
            yaxis: {
              ...(layout.scene?.yaxis || {}),
              backgroundcolor: "rgba(0,0,0,0)",
              gridcolor: "rgba(255,255,255,0.12)",
              linecolor: "rgba(255,255,255,0.25)",
              zerolinecolor: "rgba(255,255,255,0.25)",
              tickfont: { ...(layout.scene?.yaxis?.tickfont || {}), color: "#e5e7eb" },
              title: { ...(layout.scene?.yaxis?.title || {}), font: { color: "#e5e7eb" } },
            },
            zaxis: {
              ...(layout.scene?.zaxis || {}),
              backgroundcolor: "rgba(0,0,0,0)",
              gridcolor: "rgba(255,255,255,0.12)",
              linecolor: "rgba(255,255,255,0.25)",
              zerolinecolor: "rgba(255,255,255,0.25)",
              tickfont: { ...(layout.scene?.zaxis?.tickfont || {}), color: "#e5e7eb" },
              title: { ...(layout.scene?.zaxis?.title || {}), font: { color: "#e5e7eb" } },
            },
            camera: { eye: { x: 1.8, y: -1.8, z: 1.8 } },
          };
          const data = Array.isArray(fig.data)
            ? fig.data.map((t: any) => {
                if (t.type === "mesh3d") {
                  const zVals = Array.isArray(t.z) ? (t.z as number[]).filter((v) => Number.isFinite(v)) : [];
                  const zMin = zVals.length ? Math.min(...zVals) : undefined;
                  const zMax = zVals.length ? Math.max(...zVals) : undefined;
                  const ticks =
                    zMin !== undefined && zMax !== undefined
                      ? Array.from({ length: 5 }, (_, i) => Math.round(zMin + (i * (zMax - zMin)) / 4))
                      : undefined;
                  return {
                    ...t,
                    opacity: 1,
                    intensity: zVals.length ? zVals : t.intensity,
                    intensitymode: "vertex",
                    colorscale: "Turbo",
                    reversescale: false,
                    cmin: zMin,
                    cmax: zMax,
                    flatshading: true,
                    lighting: {
                      ambient: 0.6,
                      diffuse: 1,
                      specular: 0.2,
                      roughness: 0.5,
                      fresnel: 0.05,
                    },
                    lightposition: { x: 100, y: -200, z: 300 },
                    showscale: true,
                    colorbar: {
                      ...(t.colorbar || {}),
                      tickfont: { color: "#e5e7eb", size: 11 },
                      title: { text: "Sightings", font: { color: "#e5e7eb", size: 12 }, side: "top" },
                      ticks: "outside",
                      tickmode: ticks ? "array" : "auto",
                      tickvals: ticks,
                      ticktext: ticks ? ticks.map((v) => (typeof v === "number" ? v.toLocaleString() : String(v))) : undefined,
                      tickformat: ticks ? undefined : "~s",
                      thickness: 16,
                      len: 0.9,
                      x: 1.05,
                      xanchor: "left",
                      y: 0.5,
                      yanchor: "middle",
                      bgcolor: "rgba(0,0,0,0)",
                      outlinecolor: "rgba(255,255,255,0.1)",
                      outlinewidth: 1,
                    },
                    hovertemplate: "Biome: %{x}<br>Pest: %{y}<br>Sightings: %{z}<extra></extra>",
                  };
                }
                return t;
              })
            : fig.data;
          setFigure({ ...fig, data, layout });
        } catch {
          setFigure(json);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const Plotly = (window as any)?.Plotly;
    if (plotlyReady && figure && plotRef.current && Plotly) {
      try {
        const layout = { ...(figure.layout || {}), paper_bgcolor: "#0a0a0a", plot_bgcolor: "#0a0a0a", scene: { ...(figure.layout?.scene || {}), bgcolor: "#0a0a0a" } } as any;
        Plotly.newPlot(plotRef.current, figure.data, layout, { responsive: true, displayModeBar: false, displaylogo: false });
      } catch {}
    }
  }, [plotlyReady, figure]);

  // Mock prediction data
  const futurePredictions: Prediction[] = [
    { date: "2024-10-01", probability: 75, temperature: 18, blooms: 2800 },
    { date: "2024-10-08", probability: 82, temperature: 16, blooms: 3200 },
    { date: "2024-10-15", probability: 68, temperature: 14, blooms: 2600 },
    { date: "2024-10-22", probability: 45, temperature: 12, blooms: 1800 },
    { date: "2024-10-29", probability: 35, temperature: 10, blooms: 1200 },
    { date: "2024-11-05", probability: 25, temperature: 8, blooms: 800 },
    { date: "2024-11-12", probability: 15, temperature: 6, blooms: 400 },
    { date: "2024-11-19", probability: 12, temperature: 5, blooms: 200 },
  ];

  const bloomPhases: BloomPhase[] = [
    { phase: "Pre-bloom", duration: "2-3 weeks", status: "current", confidence: 85 },
    { phase: "Early bloom", duration: "1-2 weeks", status: "predicted", confidence: 78 },
    { phase: "Peak bloom", duration: "3-5 days", status: "predicted", confidence: 72 },
    { phase: "Late bloom", duration: "1 week", status: "predicted", confidence: 65 },
    { phase: "Post-bloom", duration: "2-3 weeks", status: "predicted", confidence: 58 },
  ];

  const hotspots: Hotspot[] = [
    {
      region: "Pacific Northwest",
      country: "USA",
      bloomType: "Cherry Blossoms",
      peakDate: "2024-10-15",
      confidence: 87,
      risk: "low",
    },
    {
      region: "Kanto Region",
      country: "Japan",
      bloomType: "Sakura",
      peakDate: "2024-10-08",
      confidence: 92,
      risk: "low",
    },
    {
      region: "Provence",
      country: "France",
      bloomType: "Lavender",
      peakDate: "2024-10-22",
      confidence: 74,
      risk: "medium",
    },
    {
      region: "California Central Valley",
      country: "USA",
      bloomType: "Almond Trees",
      peakDate: "2024-11-01",
      confidence: 68,
      risk: "high",
    },
  ];

  const anomalies: Anomaly[] = [
    {
      region: "Amazon Basin",
      type: "Delayed Bloom",
      severity: "high",
      description: "Unusually late flowering due to extended dry season",
      impact: "Ecosystem disruption, reduced pollinator activity",
    },
    {
      region: "Siberian Tundra",
      type: "Early Bloom",
      severity: "medium",
      description: "Earlier than expected spring flowering",
      impact: "Potential mismatch with pollinator emergence",
    },
    {
      region: "Australian Outback",
      type: "Bloom Intensity",
      severity: "low",
      description: "Higher than predicted bloom density",
      impact: "Increased wildlife activity, positive ecosystem impact",
    },
  ];

  // Deterministic date formatting to avoid hydration mismatches
  const formatDate = (iso: string) => {
    const [y, m, d] = iso.split("-");
    return `${parseInt(m, 10)}/${parseInt(d, 10)}/${y}`;
  };

  const getRiskColor = (risk: Hotspot["risk"]) => {
    switch (risk) {
      case "low":
        return "bg-emerald-400/10 text-emerald-300";
      case "medium":
        return "bg-yellow-400/10 text-yellow-300";
      case "high":
        return "bg-red-400/10 text-red-300";
      default:
        return "bg-white/10 text-neutral-200";
    }
  };

  const getSeverityColor = (severity: Anomaly["severity"]) => {
    switch (severity) {
      case "low":
        return "text-emerald-400";
      case "medium":
        return "text-yellow-400";
      case "high":
        return "text-red-400";
      default:
        return "text-neutral-400";
    }
  };

  return (
    <div ref={scope} className="min-h-screen bg-neutral-950 text-neutral-100 p-6 pt-24 sm:pt-28">
      <Script src="https://cdn.plot.ly/plotly-2.27.0.min.js" strategy="afterInteractive" onLoad={() => setPlotlyReady(true)} />
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 data-title className="text-3xl font-semibold text-emerald-300">AI Bloom Predictions</h1>
            <p data-subtitle className="text-emerald-400">Advanced forecasting powered by machine learning</p>
          </div>

                  </div>

        <div data-section className="rounded-lg border border-white/10 bg-neutral-950">
          <div className="border-b border-white/10 p-5">
            <h2 className="text-lg font-semibold text-emerald-300">Biome Pest Prism</h2>
          </div>
          <div className="p-5">
            <div ref={plotRef} className="w-full" style={{ minHeight: 600, backgroundColor: "#0a0a0a" }} />
          </div>
        </div>

        
        
        
        
              </div>
    </div>
  );
}
