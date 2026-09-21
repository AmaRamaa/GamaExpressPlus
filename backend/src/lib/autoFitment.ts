import { prisma } from "./prisma";
import { parseVehicleFromTitle, CatalogGeneration } from "./vehicleFromTitle";

export interface AutoFitmentResult {
  status: "skipped" | "no-match" | "assigned";
  reason?: string;
  vehicle?: string;
  fitmentLinked?: number;
  manufacturerSet?: boolean;
}

// Products carrying these markers belong to the AI tooling until a human
// reviews them (see DRAFT_PREFIX / AI_PREFIX in routes/products.ts, which
// can't be imported here without a cycle).
const UNREVIEWED_TITLE = /^\[(AI|Draft)\]\s/;

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

// Two saves finishing at the same moment could each create the placeholder
// engine for a generation that has none -- run these one at a time.
let queue: Promise<unknown> = Promise.resolve();
function serialized<T>(fn: () => Promise<T>): Promise<T> {
  const run = queue.then(fn, fn);
  queue = run.catch(() => undefined);
  return run;
}

// Reads the vehicle out of a human-named product's title ("MBROJTESI I PARE -
// SKODA SCALA 2023-") and, when it matches exactly one make + model + year
// range in the vehicle catalog, links the product to that car and sets the
// manufacturer. It only ever fills gaps: fitment is added only if the product
// has none, and the manufacturer only if it has none -- anything an admin set
// by hand is left alone. Titles that are still "[AI] " / "[Draft] " are
// skipped; the AI photo tools own those until a human edits them.
export function autoAssignFitmentFromTitle(productId: string): Promise<AutoFitmentResult> {
  return serialized(async () => {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { title: true, manufacturerId: true, _count: { select: { compatibility: true } } },
    });
    if (!product) return { status: "skipped", reason: "product not found" };
    if (UNREVIEWED_TITLE.test(product.title)) return { status: "skipped", reason: "title still has an AI/draft marker" };

    const rows = await prisma.vehicleGeneration.findMany({
      select: {
        id: true,
        name: true,
        yearFrom: true,
        yearTo: true,
        model: { select: { id: true, name: true, make: { select: { id: true, name: true } } } },
      },
    });
    const catalog: CatalogGeneration[] = rows.map((g) => ({
      generationId: g.id,
      generationName: g.name,
      yearFrom: g.yearFrom,
      yearTo: g.yearTo,
      modelId: g.model.id,
      modelName: g.model.name,
      makeId: g.model.make.id,
      makeName: g.model.make.name,
    }));

    const match = parseVehicleFromTitle(product.title, catalog);
    if (!match) return { status: "no-match", reason: "no single make/model/year match in the title" };

    let fitmentLinked = 0;
    if (product._count.compatibility === 0) {
      const engines = await prisma.vehicleEngine.findMany({
        where: { generationId: { in: match.generationIds } },
        select: { id: true, generationId: true },
      });
      const engineIds: string[] = [];
      for (const generationId of match.generationIds) {
        const own = engines.filter((e) => e.generationId === generationId);
        if (own.length > 0) {
          engineIds.push(...own.map((e) => e.id));
          continue;
        }
        // Fitment is tracked per generation but the schema hangs it off an
        // engine, so a generation without engine rows gets the same "ALL"
        // placeholder the vehicle picker and the importer create.
        const generation = rows.find((g) => g.id === generationId)!;
        const placeholder = await prisma.vehicleEngine.create({
          data: {
            generationId,
            engineCode: "ALL",
            displacementL: 0,
            fuelType: "PETROL",
            horsePowerHp: 0,
            transmission: "MANUAL",
            yearFrom: generation.yearFrom,
            yearTo: generation.yearTo,
          },
        });
        engineIds.push(placeholder.id);
      }
      const created = await prisma.productCompatibility.createMany({
        data: engineIds.map((engineId) => ({ productId, engineId })),
        skipDuplicates: true,
      });
      fitmentLinked = created.count;
    }

    let manufacturerSet = false;
    if (!product.manufacturerId) {
      const manufacturer = await prisma.manufacturer.upsert({
        where: { name: match.makeName },
        update: {},
        create: { name: match.makeName, slug: slugify(match.makeName) },
      });
      await prisma.product.update({ where: { id: productId }, data: { manufacturerId: manufacturer.id } });
      manufacturerSet = true;
    }

    return {
      status: "assigned",
      vehicle: `${match.makeName} ${match.modelName} ${match.yearFrom}-${match.yearTo ?? ""}`,
      fitmentLinked,
      manufacturerSet,
    };
  });
}
