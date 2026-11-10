import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { REVENUE_MODEL } from "@/lib/thermal-physics";

const CreateOrderSchema = z.object({
  auditId: z.string().cuid(),
});

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get("limit") || "20", 10);
  const offset = parseInt(searchParams.get("offset") || "0", 10);
  const status = searchParams.get("status") || undefined;

  const where: Record<string, unknown> = {};
  if (session.user.role !== "THERMOPLUS_ADMIN" && session.user.role !== "AUDITOR") {
    where.userId = session.user.id;
  }
  if (status) {
    where.status = status;
  }

  const [orders, total] = await Promise.all([
    prisma.retrofitOrder.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
      include: {
        audit: {
          select: {
            buildingType: true,
            address: true,
            city: true,
            wallAreaM2: true,
            roofAreaM2: true,
          },
        },
        user: { select: { name: true, email: true } },
        milkRunRoute: { select: { id: true, routeName: true, status: true } },
      },
    }),
    prisma.retrofitOrder.count({ where }),
  ]);

  return NextResponse.json({ orders, total, limit, offset });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = CreateOrderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const audit = await prisma.thermalAudit.findUnique({
    where: { id: parsed.data.auditId },
    include: { order: true },
  });

  if (!audit) {
    return NextResponse.json({ error: "Audit not found" }, { status: 404 });
  }

  if (audit.order) {
    return NextResponse.json(
      { error: "An order already exists for this audit" },
      { status: 409 }
    );
  }

  const { calculateIssiqUyAudit, AuditInputSchema } = await import("@/lib/thermal-physics");
  const auditInput = AuditInputSchema.parse({
    buildingType: audit.buildingType,
    scannerType: audit.scannerUsed,
    wallAreaM2: audit.wallAreaM2,
    roofAreaM2: audit.roofAreaM2,
    wallInsulationCm: audit.wallInsulationCm,
    roofInsulationCm: audit.roofInsulationCm,
    address: audit.address,
    city: audit.city,
    region: "Xorazm",
  });

  const result = calculateIssiqUyAudit(auditInput);
  const consignmentDeadline = new Date();
  consignmentDeadline.setDate(
    consignmentDeadline.getDate() + REVENUE_MODEL.consignmentPaymentDays
  );

  const auditCreated = new Date(audit.createdAt);
  const now = new Date();
  const daysSinceAudit = Math.floor(
    (now.getTime() - auditCreated.getTime()) / (1000 * 60 * 60 * 24)
  );
  const auditFeeRebated = daysSinceAudit <= REVENUE_MODEL.auditRebateDays;

  const order = await prisma.$transaction(async (tx) => {
    if (auditFeeRebated) {
      await tx.thermalAudit.update({
        where: { id: audit.id },
        data: { auditFeeRebated: true },
      });
    }

    return tx.retrofitOrder.create({
      data: {
        auditId: audit.id,
        userId: session.user.id,
        standartPacks: result.materials.standartPacks,
        standartTons: result.materials.standartTons,
        facadeComfortPacks: result.materials.facadeComfortPacks,
        facadeComfortTons: result.materials.facadeComfortTons,
        sandwichPacks: result.materials.sandwichPacks,
        sandwichTons: result.materials.sandwichTons,
        fiberKg: result.materials.fiberKg,
        accessoryKitPrice: result.accessories.totalAccessoryCost,
        materialCostUSD: result.revenue.materialCostUSD,
        kittingMarginUSD: result.revenue.kittingMarginUSD,
        installationFeeUSD: result.revenue.installationCostUSD,
        logisticsFeeUSD: result.revenue.logisticsCostUSD,
        totalPriceUSD: result.revenue.totalPriceUSD,
        startupProfitUSD: result.revenue.startupProfitUSD,
        consignmentDeadline,
      },
    });
  });

  return NextResponse.json(
    { order, auditFeeRebated, calculation: result },
    { status: 201 }
  );
}
