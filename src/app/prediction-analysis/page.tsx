"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { gsap, useGSAP } from "@/lib/gsap";

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
  const [selectedRegion, setSelectedRegion] = useState("north-america");
  const [selectedTimeframe, setSelectedTimeframe] = useState("30-days");

  const scope = useRef<HTMLDivElement | null>(null);

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
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 data-title className="text-3xl font-semibold text-emerald-300">AI Bloom Predictions</h1>
            <p data-subtitle className="text-emerald-400">Advanced forecasting powered by machine learning</p>
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <label htmlFor="region" className="text-sm text-neutral-300">Region</label>
              <select
                id="region"
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                className="w-48 rounded-md border border-white/10 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="north-america">North America</option>
                <option value="europe">Europe</option>
                <option value="asia">Asia</option>
                <option value="south-america">South America</option>
                <option value="africa">Africa</option>
                <option value="australia">Australia</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label htmlFor="timeframe" className="text-sm text-neutral-300">Timeframe</label>
              <select
                id="timeframe"
                value={selectedTimeframe}
                onChange={(e) => setSelectedTimeframe(e.target.value)}
                className="w-40 rounded-md border border-white/10 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="30-days">30 Days</option>
                <option value="90-days">90 Days</option>
                <option value="1-year">1 Year</option>
              </select>
            </div>
          </div>
        </div>

        
        
        
        
              </div>
    </div>
  );
}
