import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { OrderStatus, type Prisma } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { isStaff, parsePagination } from "@/lib/api-utils";
import {
  AuditInputSchema,
  REVENUE_MODEL,
  calculateIssiqUyAudit,
} from "@/lib/thermal-physics";

const CreateOrderSchema = z.object({
  auditId: z.string().cuid(),
});

const OrderStatusSchema = z.nativeEnum(OrderStatus);

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const { limit, offset } = parsePagination(searchParams);

  const where: Prisma.RetrofitOrderWhereInput = {};

  // Staff (THERMOPLUS_ADMIN / AUDITOR) may read every order; everyone else is
  // confined to their own.
  if (!isStaff(session.user.role)) {
    where.userId = session.user.id;
  }

  const statusParam = searchParams.get("status");
  if (statusParam) {
    const status = OrderStatusSchema.safeParse(statusParam);
    if (!status.success) {
      return NextResponse.json(
        { error: `Invalid status. Expected one of: ${Object.values(OrderStatus).join(", ")}` },
        { status: 400 }
      );
    }
    where.status = status.data;
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

  const body = await request.json().catch(() => null);
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

  // Customers may only order against their own audits. Respond 404 (not 403)
  // so audit IDs belonging to other customers cannot be probed.
  if (!audit || (audit.userId !== session.user.id && !isStaff(session.user.role))) {
    return NextResponse.json({ error: "Audit not found" }, { status: 404 });
  }

  if (audit.order) {
    return NextResponse.json(
      { error: "An order already exists for this audit" },
      { status: 409 }
    );
  }

  const auditInput = AuditInputSchema.parse({
    buildingType: audit.buildingType,
    scannerType: audit.scannerUsed,
    wallAreaM2: audit.wallAreaM2,
    roofAreaM2: audit.roofAreaM2,
    wallInsulationCm: audit.wallInsulationCm,
    roofInsulationCm: audit.roofInsulationCm,
    address: audit.address,
    city: audit.city,
    region: audit.region,
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
        // The order belongs to the audit's owner, even when a staff member
        // places it on the customer's behalf.
        userId: audit.userId,
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
