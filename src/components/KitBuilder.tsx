"use client";

import { useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import {
  Package,
  Boxes,
  BadgePercent,
  ArrowRight,
  ShoppingCart,
  CheckCircle,
  Factory,
} from "lucide-react";
import {
  calculateIssiqUyAudit,
  THERMO_PLUS_CATALOG,
  BUILDING_PROFILES,
  formatUSD,
  formatTons,
  REVENUE_MODEL,
  type AuditInput,
} from "@/lib/thermal-physics";

export default function KitBuilder() {
  const { data: session } = useSession();
  const [ordering, setOrdering] = useState(false);
  const [ordered, setOrdered] = useState(false);

  const [buildingType, setBuildingType] = useState("MAHALLA_HOME");
  const [wallAreaM2, setWallAreaM2] = useState(120);
  const [roofAreaM2, setRoofAreaM2] = useState(80);

  const result = useMemo(
    () =>
      calculateIssiqUyAudit({
        buildingType: buildingType as AuditInput["buildingType"],
        scannerType: "FLIR_ONE_PRO",
        wallAreaM2,
        roofAreaM2,
        wallInsulationCm: 6,
        roofInsulationCm: 10,
        address: "Kit Builder",
        city: "Urgench",
        region: "Xorazm",
      }),
    [buildingType, wallAreaM2, roofAreaM2]
  );

  const products = [
    {
      sku: THERMO_PLUS_CATALOG.STANDART,
      packs: result.materials.standartPacks,
      tons: result.materials.standartTons,
      area: roofAreaM2,
      color: "text-blue-400",
      bgColor: "bg-blue-900/20",
      borderColor: "border-blue-700/30",
    },
    {
      sku: THERMO_PLUS_CATALOG.FACADE_COMFORT,
      packs: result.materials.facadeComfortPacks,
      tons: result.materials.facadeComfortTons,
      area: wallAreaM2,
      color: "text-amber-400",
      bgColor: "bg-amber-900/20",
      borderColor: "border-amber-700/30",
    },
    {
      sku: THERMO_PLUS_CATALOG.PP_FIBER,
      packs: Math.ceil(result.materials.fiberKg),
      tons: result.materials.fiberKg / 1000,
      area: wallAreaM2,
      color: "text-purple-400",
      bgColor: "bg-purple-900/20",
      borderColor: "border-purple-700/30",
    },
  ];

  const profitStreams = [
    {
      label: "Dealer Margin (15%)",
      amount: result.revenue.dealerMarginUSD,
      color: "bg-blue-500",
      width: Math.min((result.revenue.dealerMarginUSD / result.revenue.startupProfitUSD) * 100, 100),
    },
    {
      label: "Kitting Margin (25%)",
      amount: result.revenue.kittingMarginUSD,
      color: "bg-amber-500",
      width: Math.min((result.revenue.kittingMarginUSD / result.revenue.startupProfitUSD) * 100, 100),
    },
    {
      label: "Installation Margin (20%)",
      amount: result.revenue.installationMarginUSD,
      color: "bg-green-500",
      width: Math.min((result.revenue.installationMarginUSD / result.revenue.startupProfitUSD) * 100, 100),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <Package className="h-8 w-8 text-amber-400" />
        <div>
          <h2 className="text-2xl font-bold text-white">
            Pre-Cut Retrofit Kit Builder
          </h2>
          <p className="text-basalt-400 text-sm">
            Configure your &quot;IssiqUy Box&quot; — complete retrofit package from Thermo Plus
            factory at Chinobod St 2E, Urgench
          </p>
        </div>
      </div>

      {/* Quick Size Selector */}
      <div className="bg-basalt-900 rounded-xl p-5 border border-basalt-800">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-basalt-300 mb-1.5">
              Building Type
            </label>
            <select
              value={buildingType}
              onChange={(e) => {
                setBuildingType(e.target.value);
                const p = BUILDING_PROFILES[e.target.value];
                if (p) {
                  setWallAreaM2(p.typicalWallM2);
                  setRoofAreaM2(p.typicalRoofM2);
                }
              }}
              className="w-full bg-basalt-800 border border-basalt-700 rounded-lg px-4 py-2.5 text-white appearance-none focus:ring-2 focus:ring-amber-500"
            >
              {Object.values(BUILDING_PROFILES).map((b) => (
                <option key={b.id} value={b.id}>
                  {b.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-basalt-300 mb-1.5">
              Wall Area: {wallAreaM2} m²
            </label>
            <input
              type="range"
              min={20}
              max={2000}
              step={10}
              value={wallAreaM2}
              onChange={(e) => setWallAreaM2(Number(e.target.value))}
              className="w-full accent-amber-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-basalt-300 mb-1.5">
              Roof Area: {roofAreaM2} m²
            </label>
            <input
              type="range"
              min={20}
              max={1500}
              step={10}
              value={roofAreaM2}
              onChange={(e) => setRoofAreaM2(Number(e.target.value))}
              className="w-full accent-amber-500"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Product Cards */}
        {products.map((p) => (
          <div
            key={p.sku.sku}
            className={`${p.bgColor} rounded-xl p-5 border ${p.borderColor}`}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h4 className={`font-semibold ${p.color}`}>{p.sku.name}</h4>
                <p className="text-xs text-basalt-400">{p.sku.sku}</p>
              </div>
              <Boxes className={`h-6 w-6 ${p.color}`} />
            </div>
            <p className="text-xs text-basalt-400 mb-3">{p.sku.application}</p>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-basalt-300">
                <span>Coverage Area</span>
                <span className="text-white">{p.area} m²</span>
              </div>
              <div className="flex justify-between text-basalt-300">
                <span>Packs Required</span>
                <span className="text-white font-semibold">{p.packs}</span>
              </div>
              <div className="flex justify-between text-basalt-300">
                <span>Total Weight</span>
                <span className="text-white">{formatTons(p.tons)}</span>
              </div>
              <div className="flex justify-between text-basalt-300">
                <span>Price per Pack</span>
                <span className="text-white">{formatUSD(p.sku.pricePerPackUSD)}</span>
              </div>
              <div className="border-t border-basalt-700/50 pt-1.5 flex justify-between">
                <span className="text-basalt-300 font-medium">Subtotal</span>
                <span className={`font-bold ${p.color}`}>
                  {formatUSD(p.packs * p.sku.pricePerPackUSD)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Accessory Kit */}
      <div className="bg-basalt-900 rounded-xl p-5 border border-basalt-800">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-3">
          <Factory className="h-5 w-5 text-basalt-400" />
          Accessory Kit (assembled at Chinobod St 2E workshop)
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
          <div className="bg-basalt-800 rounded-lg p-3 text-center">
            <p className="text-basalt-400 text-xs">Adhesive Mortar</p>
            <p className="text-white font-semibold">{formatUSD(result.accessories.adhesiveMortarCost)}</p>
          </div>
          <div className="bg-basalt-800 rounded-lg p-3 text-center">
            <p className="text-basalt-400 text-xs">Mechanical Dowels</p>
            <p className="text-white font-semibold">{formatUSD(result.accessories.dowelsCost)}</p>
          </div>
          <div className="bg-basalt-800 rounded-lg p-3 text-center">
            <p className="text-basalt-400 text-xs">Vapor Barrier</p>
            <p className="text-white font-semibold">{formatUSD(result.accessories.vaporBarrierCost)}</p>
          </div>
          <div className="bg-basalt-800 rounded-lg p-3 text-center">
            <p className="text-basalt-400 text-xs">Reinforcing Mesh</p>
            <p className="text-white font-semibold">{formatUSD(result.accessories.meshCost)}</p>
          </div>
          <div className="bg-basalt-800 rounded-lg p-3 text-center">
            <p className="text-basalt-400 text-xs">PP Fiber Additive</p>
            <p className="text-white font-semibold">{formatUSD(result.accessories.fiberAdditiveCost)}</p>
          </div>
        </div>
        <div className="mt-3 flex justify-between items-center text-sm">
          <span className="text-basalt-300">Total Accessory Kit</span>
          <span className="text-white font-bold text-lg">
            {formatUSD(result.accessories.totalAccessoryCost)}
          </span>
        </div>
      </div>

      {/* Profit Breakdown */}
      <div className="bg-basalt-900 rounded-xl p-5 border border-basalt-800">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
          <BadgePercent className="h-5 w-5 text-green-400" />
          4-Stream Revenue Breakdown
        </h3>

        <div className="space-y-3">
          {profitStreams.map((s) => (
            <div key={s.label}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-basalt-300">{s.label}</span>
                <span className="text-white font-semibold">{formatUSD(s.amount)}</span>
              </div>
              <div className="h-2 bg-basalt-800 rounded-full overflow-hidden">
                <div
                  className={`h-full ${s.color} rounded-full transition-all duration-500`}
                  style={{ width: `${s.width}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 bg-green-900/30 border border-green-700/30 rounded-lg p-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-green-300">Total IssiqUy Startup Profit</p>
            <p className="text-xs text-basalt-400 mt-0.5">
              Consignment: {REVENUE_MODEL.consignmentPaymentDays}-day payment term on{" "}
              {formatUSD(REVENUE_MODEL.consignmentCreditUSD)} revolving credit line
            </p>
          </div>
          <p className="text-3xl font-black text-green-400">
            {formatUSD(result.revenue.startupProfitUSD)}
          </p>
        </div>

        {/* Audit Fee Rebate Badge */}
        <div className="mt-3 bg-amber-900/20 border border-amber-700/30 rounded-lg px-4 py-2.5 flex items-center gap-3">
          <CheckCircle className="h-5 w-5 text-amber-400 shrink-0" />
          <div className="text-sm">
            <span className="text-amber-300 font-medium">100% Audit Fee Rebate:</span>
            <span className="text-basalt-300 ml-1">
              The {formatUSD(result.revenue.auditFeeUSD)} thermal audit fee is fully
              rebated when the customer orders within {REVENUE_MODEL.auditRebateDays} days.
            </span>
          </div>
        </div>
      </div>

      {/* Total & Order */}
      <div className="bg-gradient-to-r from-basalt-900 to-basalt-950 rounded-xl p-6 border border-basalt-800 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <p className="text-basalt-400 text-sm">Complete Turnkey Retrofit Package</p>
          <p className="text-4xl font-black text-white">
            {formatUSD(result.revenue.totalPriceUSD)}
          </p>
          <p className="text-sm text-basalt-400 mt-1">
            Materials + Accessories + Installation + Milk-Run Delivery
          </p>
        </div>
        {session?.user ? (
          <button
            onClick={async () => {
              setOrdering(true);
              setOrdered(false);
              try {
                const auditRes = await fetch("/api/audits", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    buildingType,
                    scannerType: "FLIR_ONE_PRO",
                    wallAreaM2,
                    roofAreaM2,
                    wallInsulationCm: 6,
                    roofInsulationCm: 10,
                    address: "Kit Builder Order",
                    city: "Urgench",
                    region: "Xorazm",
                  }),
                });
                if (auditRes.ok) {
                  const auditData = await auditRes.json();
                  const orderRes = await fetch("/api/orders", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ auditId: auditData.audit.id }),
                  });
                  if (orderRes.ok) setOrdered(true);
                }
              } finally {
                setOrdering(false);
              }
            }}
            disabled={ordering}
            className="bg-amber-500 hover:bg-amber-600 disabled:bg-basalt-700 text-basalt-950 font-bold px-8 py-3 rounded-xl flex items-center gap-2 transition-colors whitespace-nowrap"
          >
            {ordering ? (
              "Processing..."
            ) : ordered ? (
              <>
                <CheckCircle className="h-5 w-5" /> Order Placed!
              </>
            ) : (
              <>
                <ShoppingCart className="h-5 w-5" /> Place Consignment Order
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        ) : (
          <p className="text-basalt-400 text-sm">Sign in to place an order</p>
        )}
      </div>
    </div>
  );
}
