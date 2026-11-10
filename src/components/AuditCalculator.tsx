"use client";

import { useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import {
  Thermometer,
  Flame,
  Leaf,
  Calculator,
  Save,
  ChevronDown,
  Zap,
  Droplets,
  Wind,
} from "lucide-react";
import {
  calculateIssiqUyAudit,
  BUILDING_PROFILES,
  SCANNERS,
  formatUZS,
  formatUSD,
  type AuditInput,
  type AuditResult,
} from "@/lib/thermal-physics";

const BUILDING_OPTIONS = Object.values(BUILDING_PROFILES);
const SCANNER_OPTIONS = Object.values(SCANNERS);

const REGIONS = [
  "Xorazm",
  "Karakalpakstan",
  "Bukhara",
  "Navoiy",
  "Samarkand",
  "Tashkent",
];

const CITIES: Record<string, string[]> = {
  Xorazm: ["Urgench", "Khiva", "Hazorasp", "Shovot", "Bogot", "Gurlan", "Yangiariq"],
  Karakalpakstan: ["Nukus", "Moynoq", "Kungrad", "Beruniy", "Turtkul", "Chimboy"],
  Bukhara: ["Bukhara", "Kogon", "Gijduvon", "Vobkent", "Olot"],
  Navoiy: ["Navoiy", "Zarafshon", "Uchquduq", "Nurota"],
  Samarkand: ["Samarkand", "Kattaqo'rg'on", "Urgut", "Ishtixon"],
  Tashkent: ["Tashkent", "Chirchiq", "Olmaliq", "Angren", "Bekobod"],
};

export default function AuditCalculator() {
  const { data: session } = useSession();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [buildingType, setBuildingType] = useState("MAHALLA_HOME");
  const [scannerType, setScannerType] = useState("FLIR_ONE_PRO");
  const [wallAreaM2, setWallAreaM2] = useState(120);
  const [roofAreaM2, setRoofAreaM2] = useState(80);
  const [wallInsulationCm, setWallInsulationCm] = useState(6);
  const [roofInsulationCm, setRoofInsulationCm] = useState(10);
  const [address, setAddress] = useState("");
  const [region, setRegion] = useState("Xorazm");
  const [city, setCity] = useState("Urgench");

  const selectedBuilding = BUILDING_PROFILES[buildingType];
  const selectedScanner = SCANNERS[scannerType];

  const result: AuditResult = useMemo(
    () =>
      calculateIssiqUyAudit({
        buildingType: buildingType as AuditInput["buildingType"],
        scannerType: scannerType as AuditInput["scannerType"],
        wallAreaM2,
        roofAreaM2,
        wallInsulationCm,
        roofInsulationCm,
        address: address || "TBD",
        city,
        region,
      }),
    [buildingType, scannerType, wallAreaM2, roofAreaM2, wallInsulationCm, roofInsulationCm, city, region, address]
  );

  function handleBuildingChange(type: string) {
    setBuildingType(type);
    const profile = BUILDING_PROFILES[type];
    if (profile) {
      setWallAreaM2(profile.typicalWallM2);
      setRoofAreaM2(profile.typicalRoofM2);
    }
  }

  async function saveAudit() {
    if (!session?.user) return;
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch("/api/audits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          buildingType,
          scannerType,
          wallAreaM2,
          roofAreaM2,
          wallInsulationCm,
          roofInsulationCm,
          address: address || "Not specified",
          city,
          region,
        }),
      });
      if (res.ok) setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <Thermometer className="h-8 w-8 text-thermal-hot" />
        <div>
          <h2 className="text-2xl font-bold text-white">
            Thermal Audit & ROI Simulator
          </h2>
          <p className="text-basalt-400 text-sm">
            Calculate heat loss, gas savings, and payback period using verified 2026
            Uzbekistan basalt insulation data
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── Input Panel ─────────────────────────────────────── */}
        <div className="bg-basalt-900 rounded-xl p-6 space-y-5 border border-basalt-800">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Calculator className="h-5 w-5 text-basalt-400" />
            Building Parameters
          </h3>

          {/* Building Type */}
          <div>
            <label className="block text-sm font-medium text-basalt-300 mb-1.5">
              Building Type
            </label>
            <div className="relative">
              <select
                value={buildingType}
                onChange={(e) => handleBuildingChange(e.target.value)}
                className="w-full bg-basalt-800 border border-basalt-700 rounded-lg px-4 py-2.5 text-white appearance-none cursor-pointer focus:ring-2 focus:ring-thermal-hot focus:border-transparent"
              >
                {BUILDING_OPTIONS.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-basalt-500 pointer-events-none" />
            </div>
            <p className="text-xs text-basalt-500 mt-1">{selectedBuilding.description}</p>
          </div>

          {/* Scanner */}
          <div>
            <label className="block text-sm font-medium text-basalt-300 mb-1.5">
              Thermal Scanner
            </label>
            <div className="relative">
              <select
                value={scannerType}
                onChange={(e) => setScannerType(e.target.value)}
                className="w-full bg-basalt-800 border border-basalt-700 rounded-lg px-4 py-2.5 text-white appearance-none cursor-pointer focus:ring-2 focus:ring-thermal-hot focus:border-transparent"
              >
                {SCANNER_OPTIONS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} — {s.resolution} (Tier {s.tier})
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-basalt-500 pointer-events-none" />
            </div>
            <p className="text-xs text-basalt-500 mt-1">{selectedScanner.description}</p>
          </div>

          {/* Location */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-basalt-300 mb-1.5">
                Region
              </label>
              <select
                value={region}
                onChange={(e) => {
                  setRegion(e.target.value);
                  setCity(CITIES[e.target.value]?.[0] || "");
                }}
                className="w-full bg-basalt-800 border border-basalt-700 rounded-lg px-4 py-2.5 text-white appearance-none focus:ring-2 focus:ring-thermal-hot"
              >
                {REGIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-basalt-300 mb-1.5">
                City
              </label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full bg-basalt-800 border border-basalt-700 rounded-lg px-4 py-2.5 text-white appearance-none focus:ring-2 focus:ring-thermal-hot"
              >
                {(CITIES[region] || []).map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-basalt-300 mb-1.5">
              Street Address
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g., Amir Temur ko'chasi 45"
              className="w-full bg-basalt-800 border border-basalt-700 rounded-lg px-4 py-2.5 text-white placeholder-basalt-600 focus:ring-2 focus:ring-thermal-hot focus:border-transparent"
            />
          </div>

          {/* Area Sliders */}
          <div>
            <label className="block text-sm font-medium text-basalt-300 mb-1.5">
              Exterior Wall Area: <span className="text-white">{wallAreaM2} m²</span>
            </label>
            <input
              type="range"
              min={20}
              max={2000}
              step={10}
              value={wallAreaM2}
              onChange={(e) => setWallAreaM2(Number(e.target.value))}
              className="w-full accent-thermal-hot"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-basalt-300 mb-1.5">
              Roof / Attic Area: <span className="text-white">{roofAreaM2} m²</span>
            </label>
            <input
              type="range"
              min={20}
              max={1500}
              step={10}
              value={roofAreaM2}
              onChange={(e) => setRoofAreaM2(Number(e.target.value))}
              className="w-full accent-thermal-hot"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-basalt-300 mb-1.5">
                Wall Insulation: <span className="text-white">{wallInsulationCm} cm</span>
              </label>
              <input
                type="range"
                min={2}
                max={20}
                step={1}
                value={wallInsulationCm}
                onChange={(e) => setWallInsulationCm(Number(e.target.value))}
                className="w-full accent-infrared-blue"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-basalt-300 mb-1.5">
                Roof Insulation: <span className="text-white">{roofInsulationCm} cm</span>
              </label>
              <input
                type="range"
                min={2}
                max={30}
                step={1}
                value={roofInsulationCm}
                onChange={(e) => setRoofInsulationCm(Number(e.target.value))}
                className="w-full accent-infrared-blue"
              />
            </div>
          </div>
        </div>

        {/* ── Results Panel ────────────────────────────────────── */}
        <div className="space-y-4">
          {/* Heat Loss Card */}
          <div className="bg-gradient-to-br from-thermal-hot/20 to-thermal-cold/20 rounded-xl p-5 border border-basalt-800">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
              <Flame className="h-5 w-5 text-thermal-hot" />
              Heat Loss Reduction
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-xs text-basalt-400 uppercase tracking-wider">Before</p>
                <p className="text-3xl font-bold text-thermal-hot">
                  {result.thermal.heatLossBeforeMWh}
                </p>
                <p className="text-sm text-basalt-400">MWh/year</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-basalt-400 uppercase tracking-wider">After</p>
                <p className="text-3xl font-bold text-thermal-cold">
                  {result.thermal.heatLossAfterMWh}
                </p>
                <p className="text-sm text-basalt-400">MWh/year</p>
              </div>
            </div>
            <div className="mt-4 bg-basalt-900/50 rounded-lg p-3 text-center">
              <p className="text-4xl font-black text-green-400">
                {result.thermal.reductionPercent}%
              </p>
              <p className="text-sm text-basalt-300">Heat Loss Reduction</p>
            </div>
          </div>

          {/* Savings Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-basalt-900 rounded-xl p-4 text-center border border-basalt-800">
              <Flame className="h-5 w-5 text-amber-400 mx-auto mb-1" />
              <p className="text-2xl font-bold text-white">
                {result.thermal.gasSavedM3PerYear.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
              </p>
              <p className="text-xs text-basalt-400">m³ gas saved/year</p>
            </div>
            <div className="bg-basalt-900 rounded-xl p-4 text-center border border-basalt-800">
              <Leaf className="h-5 w-5 text-green-400 mx-auto mb-1" />
              <p className="text-2xl font-bold text-white">
                {result.thermal.co2SavedKgPerYear.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
              </p>
              <p className="text-xs text-basalt-400">kg CO₂ avoided/year</p>
            </div>
            <div className="bg-basalt-900 rounded-xl p-4 text-center border border-basalt-800">
              <Zap className="h-5 w-5 text-yellow-400 mx-auto mb-1" />
              <p className="text-2xl font-bold text-white">
                {result.thermal.peakLoadReductionKW}
              </p>
              <p className="text-xs text-basalt-400">kW peak load cut</p>
            </div>
          </div>

          {/* Financial Summary */}
          <div className="bg-basalt-900 rounded-xl p-5 border border-basalt-800">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-3">
              <Droplets className="h-5 w-5 text-blue-400" />
              Financial Summary
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-basalt-300">
                <span>Audit Fee</span>
                <span className="text-white">
                  {formatUZS(result.revenue.auditFeeUZS)} ({formatUSD(result.revenue.auditFeeUSD)})
                </span>
              </div>
              <div className="flex justify-between text-basalt-300">
                <span>Total Retrofit Cost</span>
                <span className="text-white font-semibold">
                  {formatUSD(result.revenue.totalPriceUSD)}
                </span>
              </div>
              <div className="flex justify-between text-basalt-300">
                <span>IssiqUy Startup Profit</span>
                <span className="text-green-400 font-semibold">
                  {formatUSD(result.revenue.startupProfitUSD)}
                </span>
              </div>
              <div className="border-t border-basalt-700 pt-2 mt-2 flex justify-between">
                <span className="text-basalt-300">Payback Period</span>
                <span className="text-amber-400 font-bold text-lg">
                  {result.revenue.paybackMonths} months
                </span>
              </div>
            </div>
            <div className="mt-3 bg-green-900/30 border border-green-700/30 rounded-lg px-3 py-2 text-xs text-green-300">
              <Wind className="h-3.5 w-3.5 inline mr-1" />
              100% audit fee rebated if order placed within 14 days.
              Summer AC usage reduced by up to {result.thermal.summerACReductionFactor}x.
            </div>
          </div>

          {/* Save Button */}
          {session?.user && (
            <button
              onClick={saveAudit}
              disabled={saving || !address}
              className="w-full bg-thermal-hot hover:bg-red-600 disabled:bg-basalt-700 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
            >
              <Save className="h-5 w-5" />
              {saving ? "Saving..." : saved ? "Heat Passport Saved!" : "Save Heat Passport to Database"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
