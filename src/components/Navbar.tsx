"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useState } from "react";
import {
  Thermometer,
  LogIn,
  LogOut,
  Menu,
  X,
  Shield,
  User,
  Truck,
  ClipboardCheck,
} from "lucide-react";

const ROLE_BADGES: Record<string, { label: string; color: string; icon: typeof User }> = {
  CUSTOMER: { label: "Customer", color: "bg-blue-600", icon: User },
  AUDITOR: { label: "Auditor", color: "bg-green-600", icon: ClipboardCheck },
  INSTALLER_CREW: { label: "Installer", color: "bg-amber-600", icon: Truck },
  THERMOPLUS_ADMIN: { label: "Thermo Plus Admin", color: "bg-red-600", icon: Shield },
};

interface NavbarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const TABS = [
  { id: "audit", label: "Thermal Audit" },
  { id: "kit", label: "Kit Builder" },
  { id: "logistics", label: "Logistics" },
  { id: "admin", label: "Admin Portal" },
];

export default function Navbar({ activeTab, onTabChange }: NavbarProps) {
  const { data: session, status } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);

  const role = session?.user?.role || "CUSTOMER";
  const badge = ROLE_BADGES[role] || ROLE_BADGES.CUSTOMER;
  const BadgeIcon = badge.icon;

  const visibleTabs = TABS.filter((tab) => {
    if (tab.id === "admin") {
      return role === "THERMOPLUS_ADMIN";
    }
    if (tab.id === "logistics") {
      return role === "THERMOPLUS_ADMIN" || role === "AUDITOR";
    }
    return true;
  });

  return (
    <nav className="bg-basalt-950 border-b border-basalt-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Thermometer className="h-7 w-7 text-thermal-hot" />
              <span className="text-xl font-bold text-white tracking-tight">
                Issiq<span className="text-thermal-hot">Uy</span>
              </span>
            </div>

            <div className="hidden md:flex items-center gap-1 ml-8">
              {visibleTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? "bg-basalt-800 text-white"
                      : "text-basalt-400 hover:text-white hover:bg-basalt-900"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="hidden md:flex items-center gap-3">
            {status === "loading" && (
              <div className="w-8 h-8 rounded-full bg-basalt-800 animate-pulse" />
            )}

            {status === "authenticated" && session?.user && (
              <div className="flex items-center gap-3">
                <span
                  className={`${badge.color} text-white text-xs px-2.5 py-1 rounded-full flex items-center gap-1.5`}
                >
                  <BadgeIcon className="h-3 w-3" />
                  {badge.label}
                </span>
                {session.user.image && (
                  <img
                    src={session.user.image}
                    alt=""
                    className="w-8 h-8 rounded-full border-2 border-basalt-700"
                  />
                )}
                <span className="text-sm text-basalt-300">{session.user.name}</span>
                <button
                  onClick={() => signOut()}
                  className="flex items-center gap-1.5 text-sm text-basalt-400 hover:text-white transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </div>
            )}

            {status === "unauthenticated" && (
              <button
                onClick={() => signIn("google")}
                className="flex items-center gap-2 bg-white text-basalt-950 px-4 py-2 rounded-lg text-sm font-medium hover:bg-basalt-100 transition-colors"
              >
                <LogIn className="h-4 w-4" />
                Sign in with Google
              </button>
            )}
          </div>

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden text-basalt-400 hover:text-white"
          >
            {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden pb-4 space-y-2">
            {visibleTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  onTabChange(tab.id);
                  setMenuOpen(false);
                }}
                className={`block w-full text-left px-4 py-2 text-sm rounded-lg ${
                  activeTab === tab.id
                    ? "bg-basalt-800 text-white"
                    : "text-basalt-400 hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
            <div className="border-t border-basalt-800 pt-2 mt-2">
              {status === "authenticated" && session?.user ? (
                <div className="flex items-center justify-between px-4">
                  <div className="flex items-center gap-2">
                    {session.user.image && (
                      <img src={session.user.image} alt="" className="w-6 h-6 rounded-full" />
                    )}
                    <span className="text-sm text-basalt-300">{session.user.name}</span>
                    <span
                      className={`${badge.color} text-white text-xs px-2 py-0.5 rounded-full`}
                    >
                      {badge.label}
                    </span>
                  </div>
                  <button onClick={() => signOut()} className="text-sm text-basalt-400">
                    Sign Out
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => signIn("google")}
                  className="w-full bg-white text-basalt-950 px-4 py-2 rounded-lg text-sm font-medium"
                >
                  Sign in with Google
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
