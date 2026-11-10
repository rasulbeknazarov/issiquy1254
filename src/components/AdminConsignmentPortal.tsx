"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  Shield,
  Factory,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertTriangle,
  BarChart3,
  Users,
  Package,
  Truck,
  DollarSign,
  Thermometer,
} from "lucide-react";
import { formatUSD } from "@/lib/thermal-physics";

interface Order {
  id: string;
  status: string;
  standartTons: number;
  facadeComfortTons: number;
  sandwichTons: number;
  materialCostUSD: number;
  totalPriceUSD: number;
  startupProfitUSD: number;
  consignmentDeadline: string | null;
  consignmentPaidAt: string | null;
  verifiedZeroColdBridge: boolean;
  brigadeName: string | null;
  beforeThermalImageUrl: string | null;
  afterThermalImageUrl: string | null;
  createdAt: string;
  audit: {
    buildingType: string;
    address: string;
    city: string;
    wallAreaM2: number;
    roofAreaM2: number;
  };
  user: { name: string; email: string };
}

interface Audit {
  id: string;
  buildingType: string;
  city: string;
  heatLossBeforeMWh: number;
  heatLossAfterMWh: number;
  reductionPercent: number;
  gasSavedM3PerYear: number;
  createdAt: string;
  user: { name: string };
  order: { id: string; status: string } | null;
}

const FACTORY_CAPACITY_TONS = 30_000;

export default function AdminConsignmentPortal() {
  const { data: session } = useSession();
  const [orders, setOrders] = useState<Order[]>([]);
  const [audits, setAudits] = useState<Audit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.user?.role !== "THERMOPLUS_ADMIN") {
      setLoading(false);
      return;
    }

    Promise.all([
      fetch("/api/orders?limit=50").then((r) => r.json()),
      fetch("/api/audits?limit=50").then((r) => r.json()),
    ])
      .then(([ordersData, auditsData]) => {
        setOrders(ordersData.orders || []);
        setAudits(auditsData.audits || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [session]);

  if (session?.user?.role !== "THERMOPLUS_ADMIN") {
    return (
      <div className="bg-basalt-900 rounded-xl p-8 text-center border border-basalt-800">
        <Shield className="h-12 w-12 text-red-400 mx-auto mb-3" />
        <p className="text-white text-lg font-semibold">Thermo Plus Admin Access Only</p>
        <p className="text-basalt-400 text-sm mt-1">
          Sign in with an @thermoplus.uz email to access the admin consignment portal.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-basalt-600 border-t-red-500 rounded-full animate-spin" />
      </div>
    );
  }

  const totalTonsMoved = orders.reduce(
    (sum, o) => sum + o.standartTons + o.facadeComfortTons + o.sandwichTons,
    0
  );
  const capacityPercent = (totalTonsMoved / FACTORY_CAPACITY_TONS) * 100;
  const totalRevenue = orders.reduce((sum, o) => sum + o.totalPriceUSD, 0);
  const totalProfit = orders.reduce((sum, o) => sum + o.startupProfitUSD, 0);
  const verifiedCount = orders.filter((o) => o.verifiedZeroColdBridge).length;
  const pendingConsignment = orders.filter(
    (o) => o.consignmentDeadline && !o.consignmentPaidAt
  );

  const totalGasSaved = audits.reduce((sum, a) => sum + a.gasSavedM3PerYear, 0);
  const totalAudits = audits.length;
  const conversionRate =
    totalAudits > 0
      ? ((audits.filter((a) => a.order).length / totalAudits) * 100).toFixed(1)
      : "0";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <Shield className="h-8 w-8 text-red-400" />
        <div>
          <h2 className="text-2xl font-bold text-white">
            Admin Consignment Portal
          </h2>
          <p className="text-basalt-400 text-sm">
            Thermo Plus Factory Admin — Khorezm Insulation Group JV,
            Chinobod St 2E, Urgench
          </p>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-red-900/30 to-basalt-900 rounded-xl p-4 border border-red-700/30">
          <Factory className="h-5 w-5 text-red-400 mb-2" />
          <p className="text-3xl font-black text-white">{totalTonsMoved.toFixed(1)}t</p>
          <p className="text-xs text-basalt-400">
            of {(FACTORY_CAPACITY_TONS / 1000).toFixed(0)}k t/year capacity
          </p>
          <div className="mt-2 h-1.5 bg-basalt-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-red-500 rounded-full"
              style={{ width: `${Math.min(capacityPercent, 100)}%` }}
            />
          </div>
          <p className="text-xs text-red-400 mt-1">{capacityPercent.toFixed(2)}%</p>
        </div>
        <div className="bg-gradient-to-br from-green-900/30 to-basalt-900 rounded-xl p-4 border border-green-700/30">
          <DollarSign className="h-5 w-5 text-green-400 mb-2" />
          <p className="text-3xl font-black text-white">{formatUSD(totalRevenue)}</p>
          <p className="text-xs text-basalt-400">Total Revenue</p>
          <p className="text-sm text-green-400 mt-1">
            {formatUSD(totalProfit)} startup profit
          </p>
        </div>
        <div className="bg-gradient-to-br from-blue-900/30 to-basalt-900 rounded-xl p-4 border border-blue-700/30">
          <BarChart3 className="h-5 w-5 text-blue-400 mb-2" />
          <p className="text-3xl font-black text-white">{totalAudits}</p>
          <p className="text-xs text-basalt-400">Total Audits</p>
          <p className="text-sm text-blue-400 mt-1">{conversionRate}% conversion</p>
        </div>
        <div className="bg-gradient-to-br from-amber-900/30 to-basalt-900 rounded-xl p-4 border border-amber-700/30">
          <Thermometer className="h-5 w-5 text-amber-400 mb-2" />
          <p className="text-3xl font-black text-white">{verifiedCount}</p>
          <p className="text-xs text-basalt-400">Verified Zero Cold Bridge</p>
          <p className="text-sm text-amber-400 mt-1">
            {totalGasSaved.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")} m³ gas saved
          </p>
        </div>
      </div>

      {/* Consignment Alerts */}
      {pendingConsignment.length > 0 && (
        <div className="bg-amber-900/20 border border-amber-700/30 rounded-xl p-4">
          <h3 className="text-amber-300 font-semibold flex items-center gap-2 mb-3">
            <Clock className="h-5 w-5" />
            Pending Consignment Payments ({pendingConsignment.length})
          </h3>
          <div className="space-y-2">
            {pendingConsignment.map((order) => {
              const deadline = new Date(order.consignmentDeadline!);
              const daysLeft = Math.ceil(
                (deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
              );
              const isOverdue = daysLeft < 0;
              return (
                <div
                  key={order.id}
                  className="flex items-center justify-between text-sm bg-basalt-900/50 rounded-lg px-3 py-2"
                >
                  <div>
                    <span className="text-white">{order.user.name}</span>
                    <span className="text-basalt-500 mx-2">·</span>
                    <span className="text-basalt-400">
                      {order.audit.city} — {order.audit.buildingType.replace(/_/g, " ")}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-white font-medium">
                      {formatUSD(order.materialCostUSD)}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        isOverdue
                          ? "bg-red-900/50 text-red-300"
                          : daysLeft <= 3
                            ? "bg-amber-900/50 text-amber-300"
                            : "bg-basalt-800 text-basalt-300"
                      }`}
                    >
                      {isOverdue
                        ? `${Math.abs(daysLeft)}d overdue`
                        : `${daysLeft}d left`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent Orders */}
      <div className="bg-basalt-900 rounded-xl border border-basalt-800 overflow-hidden">
        <div className="p-4 border-b border-basalt-800">
          <h3 className="text-white font-semibold flex items-center gap-2">
            <Package className="h-5 w-5 text-basalt-400" />
            Recent Retrofit Orders
          </h3>
        </div>
        {orders.length === 0 ? (
          <div className="p-8 text-center text-basalt-400">
            No orders yet. Orders will appear when customers convert thermal audits
            into retrofit packages.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-basalt-400 text-xs uppercase tracking-wider">
                  <th className="px-4 py-3 text-left">Customer</th>
                  <th className="px-4 py-3 text-left">Location</th>
                  <th className="px-4 py-3 text-left">Type</th>
                  <th className="px-4 py-3 text-right">Tons</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3 text-right">Profit</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-center">Verified</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-basalt-800">
                {orders.map((order) => {
                  const tons = order.standartTons + order.facadeComfortTons + order.sandwichTons;
                  return (
                    <tr key={order.id} className="hover:bg-basalt-800/50">
                      <td className="px-4 py-3 text-white">{order.user.name}</td>
                      <td className="px-4 py-3 text-basalt-300">{order.audit.city}</td>
                      <td className="px-4 py-3 text-basalt-400 text-xs">
                        {order.audit.buildingType.replace(/_/g, " ")}
                      </td>
                      <td className="px-4 py-3 text-right text-white">
                        {tons.toFixed(2)}t
                      </td>
                      <td className="px-4 py-3 text-right text-white font-medium">
                        {formatUSD(order.totalPriceUSD)}
                      </td>
                      <td className="px-4 py-3 text-right text-green-400">
                        {formatUSD(order.startupProfitUSD)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-xs bg-basalt-800 px-2 py-0.5 rounded-full text-basalt-300">
                          {order.status.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {order.verifiedZeroColdBridge ? (
                          <CheckCircle className="h-4 w-4 text-green-400 mx-auto" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-basalt-600 mx-auto" />
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent Audits */}
      <div className="bg-basalt-900 rounded-xl border border-basalt-800 overflow-hidden">
        <div className="p-4 border-b border-basalt-800">
          <h3 className="text-white font-semibold flex items-center gap-2">
            <Thermometer className="h-5 w-5 text-basalt-400" />
            Recent Thermal Audits
          </h3>
        </div>
        {audits.length === 0 ? (
          <div className="p-8 text-center text-basalt-400">
            No audits yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-basalt-400 text-xs uppercase tracking-wider">
                  <th className="px-4 py-3 text-left">Auditor</th>
                  <th className="px-4 py-3 text-left">City</th>
                  <th className="px-4 py-3 text-left">Type</th>
                  <th className="px-4 py-3 text-right">Before</th>
                  <th className="px-4 py-3 text-right">After</th>
                  <th className="px-4 py-3 text-right">Reduction</th>
                  <th className="px-4 py-3 text-right">Gas Saved</th>
                  <th className="px-4 py-3 text-center">Converted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-basalt-800">
                {audits.map((audit) => (
                  <tr key={audit.id} className="hover:bg-basalt-800/50">
                    <td className="px-4 py-3 text-white">{audit.user.name}</td>
                    <td className="px-4 py-3 text-basalt-300">{audit.city}</td>
                    <td className="px-4 py-3 text-basalt-400 text-xs">
                      {audit.buildingType.replace(/_/g, " ")}
                    </td>
                    <td className="px-4 py-3 text-right text-thermal-hot">
                      {audit.heatLossBeforeMWh} MWh
                    </td>
                    <td className="px-4 py-3 text-right text-thermal-cold">
                      {audit.heatLossAfterMWh} MWh
                    </td>
                    <td className="px-4 py-3 text-right text-green-400 font-medium">
                      {audit.reductionPercent}%
                    </td>
                    <td className="px-4 py-3 text-right text-white">
                      {audit.gasSavedM3PerYear.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")} m³
                    </td>
                    <td className="px-4 py-3 text-center">
                      {audit.order ? (
                        <CheckCircle className="h-4 w-4 text-green-400 mx-auto" />
                      ) : (
                        <span className="text-xs text-basalt-500">Pending</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
