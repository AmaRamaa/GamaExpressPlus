import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding Gama Express database...");

  // Admin user
  const adminPassword = await bcrypt.hash("Admin123!", 12);
  await prisma.user.upsert({
    where: { email: "admin@gamaexpress.com" },
    update: {},
    create: {
      email: "admin@gamaexpress.com",
      passwordHash: adminPassword,
      firstName: "Gama",
      lastName: "Admin",
      role: "SUPER_ADMIN",
      emailVerified: true,
    },
  });

  // Categories
  const categoryNames = [
    "Bumpers & Body Panels", "Lighting", "Mirrors & Glass", "Exterior Trim & Grilles",
  ];
  const categories = await Promise.all(
    categoryNames.map((name) =>
      prisma.category.upsert({
        where: { slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-") },
        update: {},
        create: { name, slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-") },
      })
    )
  );

  // Brands
  const brandNames = ["TYC", "Van Wezel", "Febi Bilstein", "Blic", "Valeo", "Magneti Marelli", "Pilkington", "Depo"];
  const brands = await Promise.all(
    brandNames.map((name) =>
      prisma.brand.upsert({
        where: { slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-") },
        update: {},
        create: { name, slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"), isOEM: false },
      })
    )
  );

  // Vehicle catalog: VW Golf Mk7
  const vw = await prisma.vehicleMake.upsert({
    where: { slug: "volkswagen" },
    update: {},
    create: { name: "Volkswagen", slug: "volkswagen" },
  });
  const golf = await prisma.vehicleModel.upsert({
    where: { makeId_slug: { makeId: vw.id, slug: "golf" } },
    update: {},
    create: { name: "Golf", slug: "golf", makeId: vw.id },
  });
  const golfMk7 = await prisma.vehicleGeneration.create({
    data: { name: "Mk7 (2012–2020)", yearFrom: 2012, yearTo: 2020, bodyType: "Hatchback", modelId: golf.id },
  });
  const engine20tdi = await prisma.vehicleEngine.create({
    data: {
      generationId: golfMk7.id,
      engineCode: "CRBC",
      displacementL: 2.0,
      fuelType: "DIESEL",
      horsePowerHp: 150,
      transmission: "MANUAL",
      yearFrom: 2012,
      yearTo: 2020,
    },
  });

  // Warehouse
  const warehouse = await prisma.warehouse.create({
    data: { name: "Gama Express – Prishtinë Central", address: "Rr. Bill Clinton", city: "Prishtinë", isPickupLocation: true },
  });

  // Sample products
  const frontBumper = await prisma.product.create({
    data: {
      sku: "GE-BMP-0001",
      slug: "front-bumper-cover-primed-vw-golf-mk7",
      title: "Front Bumper Cover (Primed) – VW Golf Mk7",
      shortDescription: "Direct-fit primed front bumper cover, ready for paint-matching.",
      description: "OE-shaped replacement front bumper cover for pre-facelift and facelift Golf Mk7 trims. Supplied primed and ready for paint.",
      technicalInfo: "Material: PP/EPDM plastic blend. Supplied unpainted (primed).",
      installationNotes: "Test-fit before painting. Reuse the OEM brackets and impact absorber from the old bumper unless damaged.",
      categoryId: categories[0].id,
      brandId: brands[1].id,
      oemNumbers: ["5G0807221", "5G0807221GRU"],
      partNumber: "VW-5837",
      manufacturerNumber: "5837",
      priceEur: 189.0,
      discountPriceEur: 169.0,
      stockQuantity: 14,
      stockStatus: "IN_STOCK",
      isFeatured: true,
      // TODO: upload real product photography via the admin panel (Cloudinary-backed uploads endpoint); no placeholder image seeded here.
      compatibility: { create: [{ engineId: engine20tdi.id }] },
    },
  });

  await prisma.product.create({
    data: {
      sku: "GE-LGT-0001",
      slug: "led-taillight-set-vw-golf-mk7",
      title: "LED Taillight Set – VW Golf Mk7",
      shortDescription: "Dynamic LED taillight pair with factory-style light signature.",
      categoryId: categories[1].id,
      brandId: brands[7].id,
      oemNumbers: ["5G0945207", "5G0945208"],
      partNumber: "DEPO-441-1985",
      priceEur: 165.0,
      stockQuantity: 25,
      stockStatus: "IN_STOCK",
      // TODO: upload real product photography via the admin panel (Cloudinary-backed uploads endpoint); no placeholder image seeded here.
      compatibility: { create: [{ engineId: engine20tdi.id }] },
    },
  });

  await prisma.warehouseStock.createMany({
    data: [{ warehouseId: warehouse.id, productId: frontBumper.id, quantity: 14 }],
  });

  await prisma.discountCode.upsert({
    where: { code: "WELCOME10" },
    update: {},
    create: {
      code: "WELCOME10",
      type: "PERCENTAGE",
      value: 10,
      validFrom: new Date(),
      validTo: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365),
      maxUsesPerUser: 1,
    },
  });

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
