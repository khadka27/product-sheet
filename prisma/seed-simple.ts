import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const productNames = [
  "Aircurl",
  "2Nd Amendment Collectible Coin",
  "360Brite",
  "4 Hands Massager",
  "45Th & 47Th President Flag Hat",
  "Aailsa Comfy Revolution Front Close Bra",
  "Abforce Stimulator Recovery",
  "Active Skin Repair Spray",
  "Active Track Pro Fitness Watch",
  "Active Track Pro Watch",
  "Activeglide Headphones",
  "Aerolift",
  "Aeroquad Drone",
  "Air Flow Pro",
  "Aircooly",
  "Airdoctor",
  "Airease",
  "Airheat",
  "Airjoi",
  "Airmoto",
  "Airphysio For Children",
  "Akusoli Shoe Insoles",
  "Akusoli Shoe Insoles",
  "Alevez Portable Neck Massager",
  "Alive After Crisis Free",
  "All-In-One Ratchet",
];

async function main() {
  console.log("Start seeding...");

  // Clear existing data
  await prisma.product.deleteMany();

  console.log("Cleared existing data");

  // Create products
  console.log("Creating products...");

  const products = await Promise.all(
    productNames.map((name) =>
      prisma.product.create({
        data: {
          name,
        },
      })
    )
  );

  console.log(`Created ${products.length} products`);
  console.log("Seeding finished.");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
