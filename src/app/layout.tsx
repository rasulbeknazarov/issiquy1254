import type { Metadata } from "next";
import AuthProvider from "@/components/AuthProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "IssiqUy — Thermal Audit & Retrofit Platform",
  description:
    "B2C/B2B thermal energy auditing, pre-cut basalt insulation kitting, and milk-run logistics partner for Thermo Plus (Khorezm Insulation Group JV), Urgench, Uzbekistan.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-basalt-950 antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
