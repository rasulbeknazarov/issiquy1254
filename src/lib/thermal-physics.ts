import { z } from "zod";

// ─── Constants from 2026 Uzbekistan Basalt Insulation Study ──────

export const THERMAL_CONSTANTS = {
  basaltConductivity: 0.04, // W/(m·°C)
  referenceHeatLossBefore: 32.1, // MWh/year for typical house
  referenceHeatLossAfter: 6.2, // MWh/year after retrofit
  reductionPercent: 80.6,
  gasSavedM3PerYear: 3000,
  primaryEnergySaved: 28.7, // MWh/year
  peakHeatingLoadReduction: 13, // kW
  totalEnergyReductionPercent: 32.5, // 30-35% midpoint
  summerACReductionFactor: 3,
  co2PerM3Gas: 1.88, // kg CO2 per m³ natural gas
  wallInsulationCm: 6,
  roofInsulationCm: 10,
  // Share of envelope heat loss attributed to each surface before retrofit.
  wallHeatLossShare: 0.45,
  roofHeatLossShare: 0.55,
} as const;

// ─── Bounded R-value Reduction Curve ─────────────────────────────

/** Thermal resistance of a basalt wool layer, m²·°C/W (R = d / λ). */
function insulationRValue(thicknessCm: number): number {
  const cm = Number.isFinite(thicknessCm) ? Math.max(0, thicknessCm) : 0;
  return cm / 100 / THERMAL_CONSTANTS.basaltConductivity;
}

/**
 * Baseline (uninsulated) envelope resistance R₀, solved so that the reference
 * retrofit (6 cm wall + 10 cm roof) yields exactly the study's 80.6% drop:
 *
 *   share_w·Rw/(Rw+R₀) + share_r·Rr/(Rr+R₀) = T
 *
 * which rearranges to the quadratic
 *   T·R₀² + (T·(Rw+Rr) − a − b)·R₀ + (T·Rw·Rr − a·Rr − b·Rw) = 0
 * with a = share_w·Rw, b = share_r·Rr. The positive root is ≈ 0.469 m²·°C/W,
 * a realistic value for an uninsulated brick wall.
 */
const BASELINE_R_VALUE = (() => {
  const T = THERMAL_CONSTANTS.reductionPercent / 100;
  const Rw = insulationRValue(THERMAL_CONSTANTS.wallInsulationCm);
  const Rr = insulationRValue(THERMAL_CONSTANTS.roofInsulationCm);
  const a = THERMAL_CONSTANTS.wallHeatLossShare * Rw;
  const b = THERMAL_CONSTANTS.roofHeatLossShare * Rr;
  const qb = T * (Rw + Rr) - a - b;
  const qc = T * Rw * Rr - a * Rr - b * Rw;
  return (-qb + Math.sqrt(qb * qb - 4 * T * qc)) / (2 * T);
})();

/**
 * Fraction of baseline heat loss removed by the retrofit, always in [0, 1).
 *   0 cm / 0 cm  → 0      (after == before, never Infinity/NaN)
 *   6 cm / 10 cm → 0.806  (study reference)
 * Adding insulation can only ever reduce heat loss; wall-only and roof-only
 * retrofits are handled independently.
 */
export function envelopeReductionFraction(
  wallInsulationCm: number,
  roofInsulationCm: number
): number {
  const Rw = insulationRValue(wallInsulationCm);
  const Rr = insulationRValue(roofInsulationCm);
  return (
    (THERMAL_CONSTANTS.wallHeatLossShare * Rw) / (Rw + BASELINE_R_VALUE) +
    (THERMAL_CONSTANTS.roofHeatLossShare * Rr) / (Rr + BASELINE_R_VALUE)
  );
}

// ─── Thermo Plus Product Catalog ─────────────────────────────────

export interface ThermoPlusProduct {
  sku: string;
  name: string;
  /** What the product physically is — Thermo Plus makes no EPS/foam boards. */
  material: string;
  /** Reaction-to-fire class, or null where A1/NG does not apply (polymer fiber). */
  fireClass: string | null;
  application: string;
  densityKgM3: number;
  thicknessCm: number;
  packCoverageM2: number;
  packWeightKg: number;
  pricePerPackUSD: number;
}

const BASALT_STONE_WOOL = "Basalt stone wool (kamennaya vata) from Karatau basalt rock";
const FIRE_CLASS_A1 = "A1 / NG — non-combustible";

export const THERMO_PLUS_CATALOG: Record<string, ThermoPlusProduct> = {
  STANDART: {
    sku: "TP-STD-100",
    // "Standart" (with a t) is the official Thermo Plus brand spelling, which
    // is why fields such as standartPacks / standartTons are spelled that way.
    name: "Thermo Plus Standart",
    material: BASALT_STONE_WOOL,
    fireClass: FIRE_CLASS_A1,
    application: "Roofs, attics, ceilings, floors (10 cm)",
    densityKgM3: 35,
    thicknessCm: 10,
    packCoverageM2: 3.6,
    packWeightKg: 12.6,
    pricePerPackUSD: 18,
  },
  FACADE_COMFORT: {
    sku: "TP-FC-060",
    name: "Thermo Plus Facade Comfort",
    material: BASALT_STONE_WOOL,
    fireClass: FIRE_CLASS_A1,
    application: "Exterior walls & facades (6 cm)",
    densityKgM3: 135,
    thicknessCm: 6,
    packCoverageM2: 2.4,
    packWeightKg: 19.4,
    pricePerPackUSD: 28,
  },
  SANDWICH: {
    sku: "TP-SAN-080",
    name: "Thermo Plus Sandwich / Technical",
    material: BASALT_STONE_WOOL,
    fireClass: FIRE_CLASS_A1,
    application: "Pipelines, boilers, sandwich panels",
    densityKgM3: 100,
    thicknessCm: 8,
    packCoverageM2: 2.0,
    packWeightKg: 16.0,
    pricePerPackUSD: 32,
  },
  PP_FIBER: {
    sku: "TP-FIB-PP",
    name: "Thermo Plus Polypropylene Fiber",
    material: "Polypropylene / polyethylene fiber (mortar reinforcement)",
    fireClass: null, // polymer additive embedded in mortar — not an A1 insulation product
    application: "Facade mortar reinforcement (0.9 kg/m³ of mortar)",
    densityKgM3: 910,
    thicknessCm: 0,
    packCoverageM2: 0,
    packWeightKg: 1,
    pricePerPackUSD: 3.5,
  },
};

// ─── Scanner Specifications ──────────────────────────────────────

export interface ScannerSpec {
  id: string;
  name: string;
  tier: 1 | 2;
  resolution: string;
  maxTemp: number;
  priceUSD: number;
  description: string;
}

export const SCANNERS: Record<string, ScannerSpec> = {
  FLIR_ONE_PRO: {
    id: "FLIR_ONE_PRO",
    name: "FLIR One Pro",
    tier: 1,
    resolution: "160×120",
    maxTemp: 400,
    priceUSD: 399,
    description: "Smartphone-attached thermal imager for walk-around scans",
  },
  FLIR_EDGE_PRO: {
    id: "FLIR_EDGE_PRO",
    name: "FLIR Edge Pro",
    tier: 1,
    resolution: "160×120 / 480×360 VividIR",
    maxTemp: 400,
    priceUSD: 529,
    description: "Wireless handheld with super-resolution for detailed facade inspections",
  },
  DJI_MAVIC_3T: {
    id: "DJI_MAVIC_3T",
    name: "DJI Mavic 3 Thermal (Mavic 3T)",
    tier: 2,
    resolution: "640×512 thermal + 48MP visual",
    maxTemp: 500,
    priceUSD: 6000,
    description: "Enterprise drone for full-roof scans of hotels, factories, and multi-story buildings",
  },
};

// ─── Building Type Profiles ──────────────────────────────────────

export interface BuildingProfile {
  id: string;
  label: string;
  typicalWallM2: number;
  typicalRoofM2: number;
  auditFeeUZS: number;
  auditFeeUSD: number;
  description: string;
}

export const BUILDING_PROFILES: Record<string, BuildingProfile> = {
  MAHALLA_HOME: {
    id: "MAHALLA_HOME",
    label: "Mahalla Home (Private House)",
    typicalWallM2: 120,
    typicalRoofM2: 80,
    auditFeeUZS: 150_000,
    auditFeeUSD: 12,
    description: "Typical 3-4 room Uzbek mahalla house in Urgench or Khiva",
  },
  KHIVA_BOUTIQUE_HOTEL: {
    id: "KHIVA_BOUTIQUE_HOTEL",
    label: "Khiva Boutique Hotel",
    typicalWallM2: 400,
    typicalRoofM2: 250,
    auditFeeUZS: 1_200_000,
    auditFeeUSD: 95,
    description: "Heritage boutique hotel inside the Ichan-Kala walls",
  },
  XORAZM_GREENHOUSE: {
    id: "XORAZM_GREENHOUSE",
    label: "Xorazm Greenhouse / Farm",
    typicalWallM2: 200,
    typicalRoofM2: 300,
    auditFeeUZS: 800_000,
    auditFeeUSD: 63,
    description: "Agricultural greenhouse or poultry farm with heated pipes",
  },
  COMMERCIAL_WAREHOUSE: {
    id: "COMMERCIAL_WAREHOUSE",
    label: "Commercial Warehouse / Office",
    typicalWallM2: 600,
    typicalRoofM2: 500,
    auditFeeUZS: 1_200_000,
    auditFeeUSD: 95,
    description: "Large commercial building, factory, or office block",
  },
  MULTI_STORY_APARTMENT: {
    id: "MULTI_STORY_APARTMENT",
    label: "Multi-Story Apartment Block",
    typicalWallM2: 1200,
    typicalRoofM2: 400,
    auditFeeUZS: 1_200_000,
    auditFeeUSD: 95,
    description: "4-9 story Soviet-era or modern apartment building",
  },
  SCHOOL_CLINIC: {
    id: "SCHOOL_CLINIC",
    label: "School / Clinic / Public Building",
    typicalWallM2: 500,
    typicalRoofM2: 350,
    auditFeeUZS: 1_200_000,
    auditFeeUSD: 95,
    description: "Government schools, kindergartens, clinics, hospitals",
  },
};

// ─── Revenue Model Constants ─────────────────────────────────────

export const REVENUE_MODEL = {
  dealerMarginPercent: 15,
  kittingMarginPercent: 25,
  installationMarginPercent: 20,
  auditRebateDays: 14,
  consignmentCreditUSD: 15_000,
  consignmentPaymentDays: 14,
  accessoryMarkupPercent: 25,
  laborCostPerM2USD: 1.5,
  deliveryCostPerStopUSD: 8,
} as const;

// ─── Accessory Kit Pricing ───────────────────────────────────────

export const ACCESSORY_PRICES_PER_M2 = {
  adhesiveMortar: 0.45,
  mechanicalDowels: 0.30,
  vaporBarrier: 0.20,
  reinforcingMesh: 0.35,
  fiberAdditive: 0.05,
};

// ─── Input Schema ────────────────────────────────────────────────

export const AuditInputSchema = z.object({
  buildingType: z.enum([
    "MAHALLA_HOME",
    "KHIVA_BOUTIQUE_HOTEL",
    "XORAZM_GREENHOUSE",
    "COMMERCIAL_WAREHOUSE",
    "MULTI_STORY_APARTMENT",
    "SCHOOL_CLINIC",
  ]),
  scannerType: z.enum(["FLIR_ONE_PRO", "FLIR_EDGE_PRO", "DJI_MAVIC_3T"]),
  wallAreaM2: z.number().min(0).max(10_000),
  roofAreaM2: z.number().min(0).max(10_000),
  wallInsulationCm: z.number().min(0).max(30).default(6),
  roofInsulationCm: z.number().min(0).max(30).default(10),
  address: z.string().min(1),
  city: z.string().min(1),
  region: z.string().min(1),
});

export type AuditInput = z.infer<typeof AuditInputSchema>;

// ─── Output Types ────────────────────────────────────────────────

export interface ThermalResult {
  heatLossBeforeMWh: number;
  heatLossAfterMWh: number;
  reductionPercent: number;
  gasSavedM3PerYear: number;
  co2SavedKgPerYear: number;
  primaryEnergySavedMWh: number;
  peakLoadReductionKW: number;
  summerACReductionFactor: number;
}

export interface MaterialRequirement {
  standartPacks: number;
  standartTons: number;
  facadeComfortPacks: number;
  facadeComfortTons: number;
  sandwichPacks: number;
  sandwichTons: number;
  fiberKg: number;
  totalMaterialCostUSD: number;
}

export interface AccessoryKit {
  adhesiveMortarCost: number;
  dowelsCost: number;
  vaporBarrierCost: number;
  meshCost: number;
  fiberAdditiveCost: number;
  totalAccessoryCost: number;
}

export interface RevenueBreakdown {
  auditFeeUSD: number;
  auditFeeUZS: number;
  materialCostUSD: number;
  dealerMarginUSD: number;
  accessoryKitCostUSD: number;
  kittingMarginUSD: number;
  installationCostUSD: number;
  installationMarginUSD: number;
  logisticsCostUSD: number;
  totalPriceUSD: number;
  startupProfitUSD: number;
  paybackMonths: number;
}

export interface AuditResult {
  thermal: ThermalResult;
  materials: MaterialRequirement;
  accessories: AccessoryKit;
  revenue: RevenueBreakdown;
  scanner: ScannerSpec;
  building: BuildingProfile;
}

// ─── Core Calculation Engine ─────────────────────────────────────

export function calculateIssiqUyAudit(input: AuditInput): AuditResult {
  const building = BUILDING_PROFILES[input.buildingType];
  const scanner = SCANNERS[input.scannerType];

  const totalAreaM2 = input.wallAreaM2 + input.roofAreaM2;
  const referenceAreaM2 =
    BUILDING_PROFILES.MAHALLA_HOME.typicalWallM2 +
    BUILDING_PROFILES.MAHALLA_HOME.typicalRoofM2;
  const areaScaleFactor = totalAreaM2 / referenceAreaM2;

  // ── Thermal Physics ────────────────────────────────────────────

  const reductionFraction = envelopeReductionFraction(
    input.wallInsulationCm,
    input.roofInsulationCm
  );

  const rawHeatLossBefore = THERMAL_CONSTANTS.referenceHeatLossBefore * areaScaleFactor;
  const heatLossBeforeMWh = round(rawHeatLossBefore, 1);
  const heatLossAfterMWh = round(rawHeatLossBefore * (1 - reductionFraction), 1);
  const reductionPercent = round(reductionFraction * 100, 1);

  // The study's savings figures (gas, primary energy, peak load) belong to the
  // reference 80.6% retrofit, so scale them by how much of that reduction this
  // configuration actually achieves. 0 cm of insulation → 0 savings.
  const savingsScale =
    areaScaleFactor * (reductionFraction / (THERMAL_CONSTANTS.reductionPercent / 100));

  const gasSavedM3PerYear = round(THERMAL_CONSTANTS.gasSavedM3PerYear * savingsScale, 0);
  const co2SavedKgPerYear = round(gasSavedM3PerYear * THERMAL_CONSTANTS.co2PerM3Gas, 0);
  const primaryEnergySavedMWh = round(THERMAL_CONSTANTS.primaryEnergySaved * savingsScale, 1);
  const peakLoadReductionKW = round(THERMAL_CONSTANTS.peakHeatingLoadReduction * savingsScale, 1);

  const thermal: ThermalResult = {
    heatLossBeforeMWh,
    heatLossAfterMWh,
    reductionPercent,
    gasSavedM3PerYear,
    co2SavedKgPerYear,
    primaryEnergySavedMWh,
    peakLoadReductionKW,
    summerACReductionFactor: THERMAL_CONSTANTS.summerACReductionFactor,
  };

  // ── Material Requirements ──────────────────────────────────────

  const standart = THERMO_PLUS_CATALOG.STANDART;
  const facade = THERMO_PLUS_CATALOG.FACADE_COMFORT;
  const fiber = THERMO_PLUS_CATALOG.PP_FIBER;

  const standartPacks = Math.ceil(input.roofAreaM2 / standart.packCoverageM2);
  const standartTons = round((standartPacks * standart.packWeightKg) / 1000, 2);

  const facadeComfortPacks = Math.ceil(input.wallAreaM2 / facade.packCoverageM2);
  const facadeComfortTons = round((facadeComfortPacks * facade.packWeightKg) / 1000, 2);

  const mortarVolumeM3 = input.wallAreaM2 * 0.02; // 2cm mortar layer
  const fiberKg = round(mortarVolumeM3 * 0.9, 1); // 0.9 kg/m³

  const totalMaterialCostUSD =
    standartPacks * standart.pricePerPackUSD +
    facadeComfortPacks * facade.pricePerPackUSD +
    Math.ceil(fiberKg / fiber.packWeightKg) * fiber.pricePerPackUSD;

  const materials: MaterialRequirement = {
    standartPacks,
    standartTons,
    facadeComfortPacks,
    facadeComfortTons,
    sandwichPacks: 0,
    sandwichTons: 0,
    fiberKg,
    totalMaterialCostUSD: round(totalMaterialCostUSD, 0),
  };

  // ── Accessory Kit ──────────────────────────────────────────────

  const accessoryAreaM2 = input.wallAreaM2 + input.roofAreaM2;
  const accessories: AccessoryKit = {
    adhesiveMortarCost: round(accessoryAreaM2 * ACCESSORY_PRICES_PER_M2.adhesiveMortar, 0),
    dowelsCost: round(accessoryAreaM2 * ACCESSORY_PRICES_PER_M2.mechanicalDowels, 0),
    vaporBarrierCost: round(accessoryAreaM2 * ACCESSORY_PRICES_PER_M2.vaporBarrier, 0),
    meshCost: round(accessoryAreaM2 * ACCESSORY_PRICES_PER_M2.reinforcingMesh, 0),
    fiberAdditiveCost: round(accessoryAreaM2 * ACCESSORY_PRICES_PER_M2.fiberAdditive, 0),
    totalAccessoryCost: round(
      accessoryAreaM2 *
        Object.values(ACCESSORY_PRICES_PER_M2).reduce((a, b) => a + b, 0),
      0
    ),
  };

  // ── Revenue & Unit Economics ───────────────────────────────────

  const auditFeeUSD = building.auditFeeUSD;
  const auditFeeUZS = building.auditFeeUZS;
  const materialCostUSD = materials.totalMaterialCostUSD;
  const dealerMarginUSD = round(
    materialCostUSD * (REVENUE_MODEL.dealerMarginPercent / 100),
    0
  );
  const accessoryKitCostUSD = accessories.totalAccessoryCost;
  const kittingMarginUSD = round(
    accessoryKitCostUSD * (REVENUE_MODEL.kittingMarginPercent / 100),
    0
  );
  const installationCostUSD = round(
    totalAreaM2 * REVENUE_MODEL.laborCostPerM2USD,
    0
  );
  const installationMarginUSD = round(
    installationCostUSD * (REVENUE_MODEL.installationMarginPercent / 100),
    0
  );
  const logisticsCostUSD = REVENUE_MODEL.deliveryCostPerStopUSD;
  const totalPriceUSD = materialCostUSD + accessoryKitCostUSD + installationCostUSD + logisticsCostUSD;
  const startupProfitUSD = dealerMarginUSD + kittingMarginUSD + installationMarginUSD;

  const gasPricePerM3UZS = 800;
  const annualSavingsUZS = gasSavedM3PerYear * gasPricePerM3UZS;
  const totalCostUZS = totalPriceUSD * 12_700;
  const paybackMonths = annualSavingsUZS > 0 ? round((totalCostUZS / annualSavingsUZS) * 12, 1) : 0;

  const revenue: RevenueBreakdown = {
    auditFeeUSD,
    auditFeeUZS,
    materialCostUSD,
    dealerMarginUSD,
    accessoryKitCostUSD,
    kittingMarginUSD,
    installationCostUSD,
    installationMarginUSD,
    logisticsCostUSD,
    totalPriceUSD: round(totalPriceUSD, 0),
    startupProfitUSD,
    paybackMonths,
  };

  return { thermal, materials, accessories, revenue, scanner, building };
}

// ─── Formatting Helpers ──────────────────────────────────────────

function round(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

function formatNumber(n: number): string {
  const parts = Math.round(n).toString().split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return parts.join(".");
}

export function formatUZS(amount: number): string {
  return formatNumber(amount) + " UZS";
}

export function formatUSD(amount: number): string {
  return "$" + formatNumber(amount);
}

export function formatTons(tons: number): string {
  if (tons < 1) return `${Math.round(tons * 1000)} kg`;
  return `${tons.toFixed(2)} t`;
}
