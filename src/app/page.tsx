"use client";

import { useState, Suspense } from "react";
import dynamic from "next/dynamic";
import { useSession } from "next-auth/react";
import Navbar from "@/components/Navbar";

const AuditCalculator = dynamic(() => import("@/components/AuditCalculator"), { ssr: false });
const KitBuilder = dynamic(() => import("@/components/KitBuilder"), { ssr: false });
const LogisticsDashboard = dynamic(() => import("@/components/LogisticsDashboard"), { ssr: false });
const AdminConsignmentPortal = dynamic(() => import("@/components/AdminConsignmentPortal"), { ssr: false });
import {
  Thermometer,
  Factory,
  Truck,
  Leaf,
  MapPin,
  Phone,
  ArrowRight,
  Zap,
  Flame,
  Shield,
} from "lucide-react";

export default function HomePage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState("audit");

  return (
    <div className="min-h-screen bg-basalt-950">
      <Navbar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-basalt-800">
        <div className="absolute inset-0 bg-thermal-gradient opacity-5" />
        <div className="max-w-7xl mx-auto px-4 py-12 md:py-16 relative">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-thermal-hot/20 text-thermal-hot text-xs font-semibold px-3 py-1 rounded-full">
                Official Thermo Plus Partner
              </div>
              <div className="bg-green-900/30 text-green-400 text-xs font-semibold px-3 py-1 rounded-full">
                Xorazm · Karakalpakstan · Bukhara
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-4">
              See Where Your Heat
              <span className="text-thermal-hot"> Escapes.</span>
              <br />
              Stop It With
              <span className="text-amber-400"> Basalt.</span>
            </h1>
            <p className="text-lg text-basalt-300 mb-6 leading-relaxed">
              IssiqUy scans your building with infrared cameras, calculates exactly
              how much gas and money you&apos;re losing, and delivers a pre-cut Thermo Plus
              basalt insulation retrofit kit straight from the Urgench factory to your
              door — cutting heat loss by up to{" "}
              <span className="text-green-400 font-semibold">80.6%</span> and saving{" "}
              <span className="text-amber-400 font-semibold">~3,000 m³</span> of
              natural gas every year.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setActiveTab("audit")}
                className="bg-thermal-hot hover:bg-red-600 text-white font-semibold px-6 py-3 rounded-xl flex items-center gap-2 transition-colors"
              >
                <Thermometer className="h-5 w-5" />
                Start Free Thermal Audit
                <ArrowRight className="h-4 w-4" />
              </button>
              <button
                onClick={() => setActiveTab("kit")}
                className="bg-basalt-800 hover:bg-basalt-700 text-white font-semibold px-6 py-3 rounded-xl flex items-center gap-2 transition-colors border border-basalt-700"
              >
                <Factory className="h-5 w-5" />
                Build Retrofit Kit
              </button>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-10">
            <div className="bg-basalt-900/80 backdrop-blur rounded-xl p-4 border border-basalt-800">
              <Flame className="h-5 w-5 text-thermal-hot mb-2" />
              <p className="text-2xl font-bold text-white">80.6%</p>
              <p className="text-xs text-basalt-400">Heat loss reduction</p>
            </div>
            <div className="bg-basalt-900/80 backdrop-blur rounded-xl p-4 border border-basalt-800">
              <Zap className="h-5 w-5 text-amber-400 mb-2" />
              <p className="text-2xl font-bold text-white">3,000 m³</p>
              <p className="text-xs text-basalt-400">Gas saved per house/year</p>
            </div>
            <div className="bg-basalt-900/80 backdrop-blur rounded-xl p-4 border border-basalt-800">
              <Leaf className="h-5 w-5 text-green-400 mb-2" />
              <p className="text-2xl font-bold text-white">5,640 kg</p>
              <p className="text-xs text-basalt-400">CO₂ avoided per house/year</p>
            </div>
            <div className="bg-basalt-900/80 backdrop-blur rounded-xl p-4 border border-basalt-800">
              <Shield className="h-5 w-5 text-blue-400 mb-2" />
              <p className="text-2xl font-bold text-white">3x</p>
              <p className="text-xs text-basalt-400">Summer AC reduction</p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <Suspense fallback={<div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-basalt-600 border-t-thermal-hot rounded-full animate-spin" /></div>}>
        <main className="max-w-7xl mx-auto px-4 py-8">
          {activeTab === "audit" && <AuditCalculator />}
          {activeTab === "kit" && <KitBuilder />}
          {activeTab === "logistics" && <LogisticsDashboard />}
          {activeTab === "admin" && <AdminConsignmentPortal />}
        </main>
      </Suspense>

      {/* Four Pillars */}
      <section className="border-t border-basalt-800 bg-basalt-900/50">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <h2 className="text-2xl font-bold text-white text-center mb-8">
            Four Integrated Pillars
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-basalt-900 rounded-xl p-5 border border-basalt-800 text-center">
              <div className="bg-thermal-hot/10 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Thermometer className="h-6 w-6 text-thermal-hot" />
              </div>
              <h3 className="text-white font-semibold mb-1">Energiya Tejamkorligi</h3>
              <p className="text-basalt-400 text-sm">
                Infrared thermal diagnostics with FLIR & DJI cameras. Visual
                &quot;Heat Loss Passport&quot; with ROI calculation.
              </p>
            </div>
            <div className="bg-basalt-900 rounded-xl p-5 border border-basalt-800 text-center">
              <div className="bg-amber-500/10 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Factory className="h-6 w-6 text-amber-400" />
              </div>
              <h3 className="text-white font-semibold mb-1">Ishlab Chiqarish</h3>
              <p className="text-basalt-400 text-sm">
                Pre-cut &quot;IssiqUy Box&quot; retrofit kits assembled at the Thermo Plus
                Urgench factory with all accessories included.
              </p>
            </div>
            <div className="bg-basalt-900 rounded-xl p-5 border border-basalt-800 text-center">
              <div className="bg-blue-500/10 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Truck className="h-6 w-6 text-blue-400" />
              </div>
              <h3 className="text-white font-semibold mb-1">Logistika</h3>
              <p className="text-basalt-400 text-sm">
                Consolidated milk-run delivery across Urgench, Khiva, Hazorasp &
                Nukus — 60% lower per-customer transport costs.
              </p>
            </div>
            <div className="bg-basalt-900 rounded-xl p-5 border border-basalt-800 text-center">
              <div className="bg-green-500/10 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Leaf className="h-6 w-6 text-green-400" />
              </div>
              <h3 className="text-white font-semibold mb-1">Ekologiya</h3>
              <p className="text-basalt-400 text-sm">
                Zero-scrap recycling of job-site basalt offcuts. CO₂ tracking
                toward Uzbekistan&apos;s 35% emissions cut by 2030.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-basalt-800 bg-basalt-950">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Thermometer className="h-5 w-5 text-thermal-hot" />
                <span className="font-bold text-white">
                  Issiq<span className="text-thermal-hot">Uy</span>
                </span>
              </div>
              <p className="text-basalt-400">
                Official thermal audit & retrofit partner for Thermo Plus
                (Khorezm Insulation Group JV). Powered by verified 2026 Uzbekistan
                basalt insulation research.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                <Factory className="h-4 w-4" /> Thermo Plus Factory
              </h4>
              <div className="text-basalt-400 space-y-1">
                <p className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5" />
                  Chinobod Street 2E, Urgench, Xorazm
                </p>
                <p className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5" />
                  Head Office: Shahrisabz St 2, Tashkent
                </p>
                <p className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5" />
                  +998 90 150 00 00 · +998 91 164 11 22
                </p>
              </div>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3">Service Area</h4>
              <div className="flex flex-wrap gap-2">
                {[
                  "Urgench",
                  "Khiva",
                  "Hazorasp",
                  "Nukus",
                  "Bukhara",
                  "Shovot",
                  "Gurlan",
                  "Turtkul",
                ].map((city) => (
                  <span
                    key={city}
                    className="text-xs bg-basalt-800 text-basalt-300 px-2.5 py-1 rounded-full"
                  >
                    {city}
                  </span>
                ))}
              </div>
              <p className="text-basalt-500 text-xs mt-4">
                €41M invested · 30,000 t/yr basalt capacity · 15,000 t/yr fiber line
                · 300+ employees
              </p>
            </div>
          </div>
          <div className="border-t border-basalt-800 mt-6 pt-6 text-center text-basalt-500 text-xs">
            © 2026 IssiqUy Audit & Retrofit. Thermal data: 2026 Uzbekistan Residential
            Building Basalt Insulation Study (λ = 0.040 W/(m·°C), 80.6% envelope heat
            loss reduction). All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
