/**
 * IssiqUy demo seed — run with `npm run db:seed`.
 *
 * Idempotent: every record is upserted under a fixed ID / unique email, so the
 * script can be re-run safely and never deletes anything.
 *
 * Seeds:
 *   • 3 demo users (Thermo Plus admin, IssiqUy auditor, Khiva hotel customer)
 *   • 4 thermal audits (Urgench, Khiva, Hazorasp, Nukus)
 *   • 3 retrofit orders (the Nukus audit is left un-ordered on purpose)
 *   • 2 active milk-run routes departing Chinobod Street 2E, Urgench
 *
 * NOTE: demo users have no linked Google account. They exist to populate the
 * dashboards, not to be signed into.
 */
import { PrismaClient, type OrderStatus } from "@prisma/client";
import {
  THERMO_PLUS_CATALOG,
  REVENUE_MODEL,
  calculateIssiqUyAudit,
  type AuditInput,
} from "../src/lib/thermal-physics";

const prisma = new PrismaClient();

const DEPOT = "Chinobod Street 2E, Urgench";
const DAY_MS = 24 * 60 * 60 * 1000;
const daysFromNow = (days: number) => new Date(Date.now() + days * DAY_MS);
const round2 = (n: number) => Math.round(n * 100) / 100;

// IDs start with "c" and contain no hyphens so they pass the API's
// z.string().cuid() validation (e.g. when ordering against the Nukus audit).
const ID = {
  auditUrgench: "cseedaudit01urgenchhome",
  auditKhiva: "cseedaudit02khivahotel",
  auditHazorasp: "cseedaudit03hazoraspgreenhouse",
  auditNukus: "cseedaudit04nukusschool",
  orderUrgench: "cseedorder01urgenchhome",
  orderKhiva: "cseedorder02khivahotel",
  orderHazorasp: "cseedorder03hazoraspgreenhouse",
  routeKhiva: "cseedroute01urgenchkhiva",
  routeHazorasp: "cseedroute02urgenchhazorasp",
} as const;

async function main() {
  // ── Users ──────────────────────────────────────────────────────

  const admin = await prisma.user.upsert({
    where: { email: "admin@thermoplus.uz" },
    update: { role: "THERMOPLUS_ADMIN" },
    create: {
      email: "admin@thermoplus.uz",
      name: "Thermo Plus Admin (Demo)",
      role: "THERMOPLUS_ADMIN",
      region: "Xorazm",
    },
  });

  const auditor = await prisma.user.upsert({
    where: { email: "auditor@issiquy.uz" },
    update: { role: "AUDITOR" },
    create: {
      email: "auditor@issiquy.uz",
      name: "IssiqUy Field Auditor (Demo)",
      role: "AUDITOR",
      region: "Xorazm",
    },
  });

  // The schema's customer-facing role is CUSTOMER (there is no CLIENT/HOMEOWNER).
  const hotelClient = await prisma.user.upsert({
    where: { email: "owner@khiva-hotel-demo.uz" },
    update: { role: "CUSTOMER" },
    create: {
      email: "owner@khiva-hotel-demo.uz",
      name: "Khiva Boutique Hotel Owner (Demo)",
      role: "CUSTOMER",
      region: "Xorazm",
    },
  });

  // ── Thermal audits ─────────────────────────────────────────────

  const auditSpecs: {
    id: string;
    userId: string;
    notes: string;
    input: AuditInput;
  }[] = [
    {
      id: ID.auditUrgench,
      userId: auditor.id,
      notes:
        "3-room fired-brick mahalla house. Uninsulated attic slab and strong cold bridges at the ring beam.",
      input: {
        buildingType: "MAHALLA_HOME",
        scannerType: "FLIR_ONE_PRO",
        wallAreaM2: 120,
        roofAreaM2: 80,
        wallInsulationCm: 6,
        roofInsulationCm: 10,
        address: "Al-Xorazmiy Street 41",
        city: "Urgench",
        region: "Xorazm",
      },
    },
    {
      id: ID.auditKhiva,
      userId: hotelClient.id,
      notes:
        "Boutique hotel in the Ichon-Qala buffer zone. Street facade must keep its appearance, so wall insulation goes on courtyard-side elevations; full roof retrofit.",
      input: {
        buildingType: "KHIVA_BOUTIQUE_HOTEL",
        scannerType: "FLIR_EDGE_PRO",
        wallAreaM2: 380,
        roofAreaM2: 260,
        wallInsulationCm: 6,
        roofInsulationCm: 10,
        address: "Pahlavon Mahmud Street 12 (Ichon-Qala buffer zone)",
        city: "Khiva",
        region: "Xorazm",
      },
    },
    {
      id: ID.auditHazorasp,
      userId: auditor.id,
      notes:
        "Heated vegetable greenhouse. Biggest losses on the north wall, service block roof and uninsulated boiler pipework (Sandwich / Technical wool specified for pipes).",
      input: {
        buildingType: "XORAZM_GREENHOUSE",
        scannerType: "DJI_MAVIC_3T",
        wallAreaM2: 200,
        roofAreaM2: 300,
        wallInsulationCm: 6,
        roofInsulationCm: 10,
        address: "Pitnak Road, km 4, agro cluster",
        city: "Hazorasp",
        region: "Xorazm",
      },
    },
    {
      id: ID.auditNukus,
      userId: auditor.id,
      notes:
        "Public school block. Audit delivered; retrofit order pending budget approval.",
      input: {
        buildingType: "SCHOOL_CLINIC",
        scannerType: "DJI_MAVIC_3T",
        wallAreaM2: 520,
        roofAreaM2: 360,
        wallInsulationCm: 6,
        roofInsulationCm: 10,
        address: "Dosnazarov Street 88",
        city: "Nukus",
        region: "Karakalpakstan",
      },
    },
  ];

  const calc = new Map<string, ReturnType<typeof calculateIssiqUyAudit>>();

  for (const spec of auditSpecs) {
    const result = calculateIssiqUyAudit(spec.input);
    calc.set(spec.id, result);

    const data = {
      userId: spec.userId,
      buildingType: spec.input.buildingType,
      scannerUsed: spec.input.scannerType,
      address: spec.input.address,
      city: spec.input.city,
      region: spec.input.region,
      wallAreaM2: spec.input.wallAreaM2,
      roofAreaM2: spec.input.roofAreaM2,
      wallInsulationCm: spec.input.wallInsulationCm,
      roofInsulationCm: spec.input.roofInsulationCm,
      heatLossBeforeMWh: result.thermal.heatLossBeforeMWh,
      heatLossAfterMWh: result.thermal.heatLossAfterMWh,
      reductionPercent: result.thermal.reductionPercent,
      gasSavedM3PerYear: result.thermal.gasSavedM3PerYear,
      co2SavedKgPerYear: result.thermal.co2SavedKgPerYear,
      paybackMonths: result.revenue.paybackMonths,
      auditFeeUZS: result.revenue.auditFeeUZS,
      // Audits that became orders get the 100% audit-fee rebate.
      auditFeeRebated: spec.id !== ID.auditNukus,
      notes: spec.notes,
    };

    await prisma.thermalAudit.upsert({
      where: { id: spec.id },
      update: data,
      create: { id: spec.id, ...data },
    });
  }

  // ── Retrofit orders ────────────────────────────────────────────
  // Standart (10 cm, roofs), Facade Comfort (6 cm, walls) and Polypropylene
  // Fiber quantities come straight from the calculator. The greenhouse also
  // gets Sandwich / Technical wool for its boiler pipework.

  const sandwich = THERMO_PLUS_CATALOG.SANDWICH;

  const orderSpecs: {
    id: string;
    auditId: string;
    userId: string;
    status: OrderStatus;
    routeId: string;
    sandwichPacks: number;
    brigadeName: string;
  }[] = [
    {
      id: ID.orderUrgench,
      auditId: ID.auditUrgench,
      userId: auditor.id,
      status: "IN_TRANSIT",
      routeId: ID.routeKhiva,
      sandwichPacks: 0,
      brigadeName: "Urgench Brigade #1",
    },
    {
      id: ID.orderKhiva,
      auditId: ID.auditKhiva,
      userId: hotelClient.id,
      status: "IN_TRANSIT",
      routeId: ID.routeKhiva,
      sandwichPacks: 0,
      brigadeName: "Khiva Heritage Brigade",
    },
    {
      id: ID.orderHazorasp,
      auditId: ID.auditHazorasp,
      userId: auditor.id,
      status: "READY_FOR_DELIVERY",
      routeId: ID.routeHazorasp,
      sandwichPacks: 12,
      brigadeName: "Hazorasp Agro Brigade",
    },
  ];

  const orderRows = orderSpecs.map((spec) => {
    const result = calc.get(spec.auditId)!;
    const sandwichCostUSD = spec.sandwichPacks * sandwich.pricePerPackUSD;
    const sandwichMarginUSD = Math.round(
      sandwichCostUSD * (REVENUE_MODEL.dealerMarginPercent / 100)
    );

    return {
      spec,
      data: {
        auditId: spec.auditId,
        userId: spec.userId,
        status: spec.status,
        standartPacks: result.materials.standartPacks,
        standartTons: result.materials.standartTons,
        facadeComfortPacks: result.materials.facadeComfortPacks,
        facadeComfortTons: result.materials.facadeComfortTons,
        sandwichPacks: spec.sandwichPacks,
        sandwichTons: round2((spec.sandwichPacks * sandwich.packWeightKg) / 1000),
        fiberKg: result.materials.fiberKg,
        accessoryKitPrice: result.accessories.totalAccessoryCost,
        materialCostUSD: result.revenue.materialCostUSD + sandwichCostUSD,
        kittingMarginUSD: result.revenue.kittingMarginUSD,
        installationFeeUSD: result.revenue.installationCostUSD,
        logisticsFeeUSD: result.revenue.logisticsCostUSD,
        totalPriceUSD: result.revenue.totalPriceUSD + sandwichCostUSD,
        startupProfitUSD: result.revenue.startupProfitUSD + sandwichMarginUSD,
        consignmentDeadline: daysFromNow(REVENUE_MODEL.consignmentPaymentDays),
        brigadeName: spec.brigadeName,
        installStartDate: daysFromNow(2),
        installEndDate: daysFromNow(6),
        milkRunRouteId: spec.routeId,
      },
    };
  });

  const routeWeightTons = (routeId: string) =>
    round2(
      orderRows
        .filter((o) => o.spec.routeId === routeId)
        .reduce(
          (sum, o) =>
            sum + o.data.standartTons + o.data.facadeComfortTons + o.data.sandwichTons,
          0
        )
    );

  // ── Milk-run routes (created before orders, which reference them) ──

  const routeSpecs = [
    {
      id: ID.routeKhiva,
      data: {
        routeName: "Milk-Run A: Urgench city → Khiva (Ichon-Qala buffer)",
        driverId: auditor.id,
        status: "EN_ROUTE" as const,
        departureDate: daysFromNow(0),
        departureLocation: DEPOT,
        stops: [
          "Al-Xorazmiy Street 41, Urgench",
          "Pahlavon Mahmud Street 12, Khiva",
        ],
        totalDistanceKm: 78, // round trip incl. city stop
        totalWeightTons: routeWeightTons(ID.routeKhiva),
      },
    },
    {
      id: ID.routeHazorasp,
      data: {
        routeName: "Milk-Run B: Urgench → Hazorasp agro cluster",
        driverId: admin.id,
        status: "LOADING_AT_CHINOBOD" as const,
        departureDate: daysFromNow(1),
        departureLocation: DEPOT,
        stops: ["Pitnak Road, km 4, Hazorasp"],
        totalDistanceKm: 140, // round trip
        totalWeightTons: routeWeightTons(ID.routeHazorasp),
      },
    },
  ];

  for (const route of routeSpecs) {
    await prisma.milkRunRoute.upsert({
      where: { id: route.id },
      update: route.data,
      create: { id: route.id, ...route.data },
    });
  }

  for (const { spec, data } of orderRows) {
    await prisma.retrofitOrder.upsert({
      where: { id: spec.id },
      update: data,
      create: { id: spec.id, ...data },
    });
  }

  console.log(
    `Seeded: 3 users, ${auditSpecs.length} thermal audits, ${orderRows.length} retrofit orders, ${routeSpecs.length} milk-run routes (depot: ${DEPOT}).`
  );
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
