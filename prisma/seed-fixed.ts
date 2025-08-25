import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Start seeding simple products...");

  // Clear existing data
  await prisma.product.deleteMany({});

  // Simple product names to seed
  const productNames = [
    "Product Alpha",
    "Product Beta",
    "Product Gamma",
    "Product Delta",
    "Product Epsilon",
    "Product Zeta",
    "Product Eta",
    "Product Theta",
    "Product Iota",
    "Product Kappa",
    "Product Lambda",
    "Product Mu",
    "Product Nu",
    "Product Xi",
    "Product Omicron",
    "Product Pi",
    "Product Rho",
    "Product Sigma",
    "Product Tau",
    "Product Upsilon",
    "Product Phi",
    "Product Chi",
    "Product Psi",
    "Product Omega",
    "Advanced Widget A",
    "Advanced Widget B",
  ];

  // Create products
  for (const name of productNames) {
    await prisma.product.create({
      data: {
        name,
      },
    });
    console.log(`Created product: ${name}`);
  }

  console.log("Seeding finished.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
