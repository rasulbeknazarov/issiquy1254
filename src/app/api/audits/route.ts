import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  AuditInputSchema,
  calculateIssiqUyAudit,
} from "@/lib/thermal-physics";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get("limit") || "20", 10);
  const offset = parseInt(searchParams.get("offset") || "0", 10);

  const where =
    session.user.role === "THERMOPLUS_ADMIN" || session.user.role === "AUDITOR"
      ? {}
      : { userId: session.user.id };

  const [audits, total] = await Promise.all([
    prisma.thermalAudit.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
      include: {
        user: { select: { name: true, email: true, image: true } },
        order: { select: { id: true, status: true } },
      },
    }),
    prisma.thermalAudit.count({ where }),
  ]);

  return NextResponse.json({ audits, total, limit, offset });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = AuditInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const input = parsed.data;
  const result = calculateIssiqUyAudit(input);

  const audit = await prisma.thermalAudit.create({
    data: {
      userId: session.user.id,
      buildingType: input.buildingType,
      scannerUsed: input.scannerType,
      address: input.address,
      city: input.city,
      region: input.region,
      wallAreaM2: input.wallAreaM2,
      roofAreaM2: input.roofAreaM2,
      wallInsulationCm: input.wallInsulationCm,
      roofInsulationCm: input.roofInsulationCm,
      heatLossBeforeMWh: result.thermal.heatLossBeforeMWh,
      heatLossAfterMWh: result.thermal.heatLossAfterMWh,
      reductionPercent: result.thermal.reductionPercent,
      gasSavedM3PerYear: result.thermal.gasSavedM3PerYear,
      co2SavedKgPerYear: result.thermal.co2SavedKgPerYear,
      paybackMonths: result.revenue.paybackMonths,
      auditFeeUZS: result.revenue.auditFeeUZS,
    },
  });

  return NextResponse.json({ audit, calculation: result }, { status: 201 });
}
