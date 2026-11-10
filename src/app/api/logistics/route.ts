import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const CreateRouteSchema = z.object({
  routeName: z.string().min(1).max(200),
  stops: z.array(z.string().min(1)).min(1).max(20),
  departureDate: z.string().datetime().optional(),
  orderIds: z.array(z.string().cuid()).min(1),
  totalDistanceKm: z.number().min(0).default(0),
});

const UpdateRouteSchema = z.object({
  routeId: z.string().cuid(),
  status: z
    .enum([
      "PLANNING",
      "LOADING_AT_CHINOBOD",
      "EN_ROUTE",
      "DELIVERING",
      "COLLECTING_OFFCUTS",
      "RETURNED_TO_FACTORY",
      "COMPLETED",
    ])
    .optional(),
  offcutsCollectedKg: z.number().min(0).optional(),
  offcutsRecycledKg: z.number().min(0).optional(),
});

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "THERMOPLUS_ADMIN" && session.user.role !== "AUDITOR") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get("limit") || "20", 10);
  const status = searchParams.get("status") || undefined;

  const where: Record<string, unknown> = {};
  if (status) where.status = status;

  const [routes, total] = await Promise.all([
    prisma.milkRunRoute.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        driver: { select: { name: true, email: true } },
        orders: {
          select: {
            id: true,
            status: true,
            totalPriceUSD: true,
            audit: { select: { address: true, city: true, buildingType: true } },
          },
        },
      },
    }),
    prisma.milkRunRoute.count({ where }),
  ]);

  const ecologyStats = await prisma.milkRunRoute.aggregate({
    _sum: {
      offcutsCollectedKg: true,
      offcutsRecycledKg: true,
      co2AvoidedKg: true,
      totalWeightTons: true,
    },
    _count: true,
  });

  return NextResponse.json({ routes, total, ecologyStats });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "THERMOPLUS_ADMIN" && session.user.role !== "AUDITOR") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const action = body.action || "create";

  if (action === "update") {
    const parsed = UpdateRouteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (parsed.data.status) {
      updateData.status = parsed.data.status;
      if (parsed.data.status === "COMPLETED") {
        updateData.completedAt = new Date();
      }
    }
    if (parsed.data.offcutsCollectedKg !== undefined) {
      updateData.offcutsCollectedKg = parsed.data.offcutsCollectedKg;
    }
    if (parsed.data.offcutsRecycledKg !== undefined) {
      updateData.offcutsRecycledKg = parsed.data.offcutsRecycledKg;
      updateData.co2AvoidedKg = parsed.data.offcutsRecycledKg * 1.2; // ~1.2 kg CO2 avoided per kg recycled basalt
    }

    const route = await prisma.milkRunRoute.update({
      where: { id: parsed.data.routeId },
      data: updateData,
    });

    return NextResponse.json({ route });
  }

  const parsed = CreateRouteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const orders = await prisma.retrofitOrder.findMany({
    where: { id: { in: parsed.data.orderIds } },
    include: { audit: true },
  });

  const totalWeightTons = orders.reduce(
    (sum, o) => sum + o.standartTons + o.facadeComfortTons + o.sandwichTons,
    0
  );

  const route = await prisma.$transaction(async (tx) => {
    const newRoute = await tx.milkRunRoute.create({
      data: {
        routeName: parsed.data.routeName,
        driverId: session.user.id,
        stops: parsed.data.stops,
        departureDate: parsed.data.departureDate
          ? new Date(parsed.data.departureDate)
          : undefined,
        totalDistanceKm: parsed.data.totalDistanceKm,
        totalWeightTons: Math.round(totalWeightTons * 100) / 100,
      },
    });

    await tx.retrofitOrder.updateMany({
      where: { id: { in: parsed.data.orderIds } },
      data: { milkRunRouteId: newRoute.id, status: "READY_FOR_DELIVERY" },
    });

    return newRoute;
  });

  return NextResponse.json({ route }, { status: 201 });
}
