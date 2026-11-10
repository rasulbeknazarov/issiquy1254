"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  Truck,
  MapPin,
  Recycle,
  Leaf,
  Package,
  Clock,
  CheckCircle2,
  RotateCcw,
  AlertTriangle,
} from "lucide-react";
import { formatUSD } from "@/lib/thermal-physics";

interface MilkRunRoute {
  id: string;
  routeName: string;
  status: string;
  departureDate: string | null;
  departureLocation: string;
  stops: string[];
  totalDistanceKm: number;
  totalWeightTons: number;
  offcutsCollectedKg: number;
  offcutsRecycledKg: number;
  co2AvoidedKg: number;
  completedAt: string | null;
  driver: { name: string; email: string } | null;
  orders: Array<{
    id: string;
    status: string;
    totalPriceUSD: number;
    audit: { address: string; city: string; buildingType: string };
  }>;
}

interface EcologyStats {
  _sum: {
    offcutsCollectedKg: number | null;
    offcutsRecycledKg: number | null;
    co2AvoidedKg: number | null;
    totalWeightTons: number | null;
  };
  _count: number;
}

const STATUS_STYLES: Record<string, { color: string; icon: typeof Truck; label: string }> = {
  PLANNING: { color: "text-basalt-400", icon: Clock, label: "Planning" },
  LOADING_AT_CHINOBOD: { color: "text-amber-400", icon: Package, label: "Loading at Chinobod" },
  EN_ROUTE: { color: "text-blue-400", icon: Truck, label: "En Route" },
  DELIVERING: { color: "text-green-400", icon: MapPin, label: "Delivering" },
  COLLECTING_OFFCUTS: { color: "text-purple-400", icon: Recycle, label: "Collecting Offcuts" },
  RETURNED_TO_FACTORY: { color: "text-amber-400", icon: RotateCcw, label: "Returned to Factory" },
  COMPLETED: { color: "text-green-500", icon: CheckCircle2, label: "Completed" },
};

export default function LogisticsDashboard() {
  const { data: session } = useSession();
  const [routes, setRoutes] = useState<MilkRunRoute[]>([]);
  const [ecologyStats, setEcologyStats] = useState<EcologyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (
      session?.user?.role !== "THERMOPLUS_ADMIN" &&
      session?.user?.role !== "AUDITOR"
    ) {
      setLoading(false);
      return;
    }

    fetch("/api/logistics")
      .then((r) => r.json())
      .then((data) => {
        setRoutes(data.routes || []);
        setEcologyStats(data.ecologyStats || null);
      })
      .catch(() => setError("Failed to load logistics data"))
      .finally(() => setLoading(false));
  }, [session]);

  if (
    session?.user?.role !== "THERMOPLUS_ADMIN" &&
    session?.user?.role !== "AUDITOR"
  ) {
    return (
      <div className="bg-basalt-900 rounded-xl p-8 text-center border border-basalt-800">
        <AlertTriangle className="h-12 w-12 text-amber-400 mx-auto mb-3" />
        <p className="text-white text-lg font-semibold">Auditor or Admin Access Required</p>
        <p className="text-basalt-400 text-sm mt-1">
          Milk-run logistics dashboard is available to IssiqUy Auditors and Thermo Plus
          Admins.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-basalt-600 border-t-thermal-hot rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <Truck className="h-8 w-8 text-blue-400" />
        <div>
          <h2 className="text-2xl font-bold text-white">
            Milk-Run Logistics & Zero-Scrap Ecology
          </h2>
          <p className="text-basalt-400 text-sm">
            Consolidated deliveries from Chinobod St 2E, Urgench across Xorazm &
            Karakalpakstan
          </p>
        </div>
      </div>

      {/* Ecology Stats */}
      {ecologyStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-basalt-900 rounded-xl p-4 border border-basalt-800 text-center">
            <Truck className="h-6 w-6 text-blue-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{ecologyStats._count}</p>
            <p className="text-xs text-basalt-400">Total Routes</p>
          </div>
          <div className="bg-basalt-900 rounded-xl p-4 border border-basalt-800 text-center">
            <Package className="h-6 w-6 text-amber-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">
              {(ecologyStats._sum.totalWeightTons || 0).toFixed(1)}t
            </p>
            <p className="text-xs text-basalt-400">Total Basalt Delivered</p>
          </div>
          <div className="bg-basalt-900 rounded-xl p-4 border border-basalt-800 text-center">
            <Recycle className="h-6 w-6 text-purple-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">
              {((ecologyStats._sum.offcutsRecycledKg || 0) / 1000).toFixed(1)}t
            </p>
            <p className="text-xs text-basalt-400">Offcuts Recycled</p>
          </div>
          <div className="bg-basalt-900 rounded-xl p-4 border border-basalt-800 text-center">
            <Leaf className="h-6 w-6 text-green-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">
              {((ecologyStats._sum.co2AvoidedKg || 0) / 1000).toFixed(1)}t
            </p>
            <p className="text-xs text-basalt-400">CO₂ Avoided</p>
          </div>
        </div>
      )}

      {/* Route Cards */}
      {error && (
        <div className="bg-red-900/30 border border-red-700/30 rounded-lg p-3 text-red-300 text-sm">
          {error}
        </div>
      )}

      {routes.length === 0 ? (
        <div className="bg-basalt-900 rounded-xl p-8 text-center border border-basalt-800">
          <Truck className="h-12 w-12 text-basalt-600 mx-auto mb-3" />
          <p className="text-basalt-400">
            No milk-run routes yet. Routes are created when orders are ready for
            delivery.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {routes.map((route) => {
            const statusInfo = STATUS_STYLES[route.status] || STATUS_STYLES.PLANNING;
            const StatusIcon = statusInfo.icon;
            return (
              <div
                key={route.id}
                className="bg-basalt-900 rounded-xl p-5 border border-basalt-800"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="text-white font-semibold">{route.routeName}</h4>
                    <p className="text-xs text-basalt-500">
                      {route.departureLocation} →{" "}
                      {route.stops.join(" → ")}
                    </p>
                  </div>
                  <span
                    className={`${statusInfo.color} flex items-center gap-1.5 text-sm font-medium`}
                  >
                    <StatusIcon className="h-4 w-4" />
                    {statusInfo.label}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
                  <div>
                    <p className="text-basalt-500 text-xs">Distance</p>
                    <p className="text-white">{route.totalDistanceKm} km</p>
                  </div>
                  <div>
                    <p className="text-basalt-500 text-xs">Weight</p>
                    <p className="text-white">{route.totalWeightTons.toFixed(2)} t</p>
                  </div>
                  <div>
                    <p className="text-basalt-500 text-xs">Offcuts Collected</p>
                    <p className="text-purple-400">{route.offcutsCollectedKg} kg</p>
                  </div>
                  <div>
                    <p className="text-basalt-500 text-xs">Offcuts Recycled</p>
                    <p className="text-green-400">{route.offcutsRecycledKg} kg</p>
                  </div>
                  <div>
                    <p className="text-basalt-500 text-xs">Orders</p>
                    <p className="text-white">{route.orders.length}</p>
                  </div>
                </div>

                {route.orders.length > 0 && (
                  <div className="mt-3 border-t border-basalt-800 pt-3 space-y-1">
                    {route.orders.map((order) => (
                      <div
                        key={order.id}
                        className="flex items-center justify-between text-xs text-basalt-400"
                      >
                        <span>
                          <MapPin className="h-3 w-3 inline mr-1" />
                          {order.audit.city} — {order.audit.address} ({order.audit.buildingType.replace(/_/g, " ")})
                        </span>
                        <span className="text-white">{formatUSD(order.totalPriceUSD)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
