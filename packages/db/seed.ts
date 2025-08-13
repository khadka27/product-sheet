import { PrismaClient, UserRole, ProductStatus } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  console.log("🌱 Seeding database...")

  // Create admin user
  const adminPassword = await bcrypt.hash("Admin123!", 12)
  const admin = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      email: "admin@example.com",
      name: "Admin User",
      passwordHash: adminPassword,
      role: UserRole.ADMIN,
    },
  })

  // Create sample users
  const managerPassword = await bcrypt.hash("Manager123!", 12)
  const manager = await prisma.user.upsert({
    where: { email: "manager@example.com" },
    update: {},
    create: {
      email: "manager@example.com",
      name: "Manager User",
      passwordHash: managerPassword,
      role: UserRole.MANAGER,
    },
  })

  const contributorPassword = await bcrypt.hash("Contributor123!", 12)
  const contributor = await prisma.user.upsert({
    where: { email: "contributor@example.com" },
    update: {},
    create: {
      email: "contributor@example.com",
      name: "Contributor User",
      passwordHash: contributorPassword,
      role: UserRole.CONTRIBUTOR,
    },
  })

  // Create brands
  const brands = await Promise.all([
    prisma.brand.upsert({
      where: { name: "Apple" },
      update: {},
      create: { name: "Apple", description: "Technology company" },
    }),
    prisma.brand.upsert({
      where: { name: "Samsung" },
      update: {},
      create: { name: "Samsung", description: "Electronics manufacturer" },
    }),
    prisma.brand.upsert({
      where: { name: "Nike" },
      update: {},
      create: { name: "Nike", description: "Athletic wear and equipment" },
    }),
    prisma.brand.upsert({
      where: { name: "Sony" },
      update: {},
      create: { name: "Sony", description: "Consumer electronics" },
    }),
    prisma.brand.upsert({
      where: { name: "Dell" },
      update: {},
      create: { name: "Dell", description: "Computer technology" },
    }),
  ])

  // Create categories
  const electronics = await prisma.category.upsert({
    where: { name: "Electronics" },
    update: {},
    create: { name: "Electronics" },
  })

  const smartphones = await prisma.category.upsert({
    where: { name: "Smartphones" },
    update: {},
    create: { name: "Smartphones", parentId: electronics.id },
  })

  const laptops = await prisma.category.upsert({
    where: { name: "Laptops" },
    update: {},
    create: { name: "Laptops", parentId: electronics.id },
  })

  const clothing = await prisma.category.upsert({
    where: { name: "Clothing" },
    update: {},
    create: { name: "Clothing" },
  })

  const shoes = await prisma.category.upsert({
    where: { name: "Shoes" },
    update: {},
    create: { name: "Shoes", parentId: clothing.id },
  })

  const audio = await prisma.category.upsert({
    where: { name: "Audio" },
    update: {},
    create: { name: "Audio", parentId: electronics.id },
  })

  // Create sample products with some near-duplicates
  const products = [
    {
      name: "iPhone 15 Pro",
      sku: "APPLE-IP15P-128",
      brandId: brands[0].id,
      categoryId: smartphones.id,
      barcode: "194253394051",
      price: 999.99,
      quantity: 50,
      status: ProductStatus.ACTIVE,
      tags: ["smartphone", "ios", "premium"],
      description: "Latest iPhone with Pro features",
      createdById: admin.id,
    },
    {
      name: "iPhone 15 Pro Max",
      sku: "APPLE-IP15PM-256",
      brandId: brands[0].id,
      categoryId: smartphones.id,
      barcode: "194253394068",
      price: 1199.99,
      quantity: 30,
      status: ProductStatus.ACTIVE,
      tags: ["smartphone", "ios", "premium", "large"],
      description: "Largest iPhone with Pro Max features",
      createdById: admin.id,
    },
    // Near duplicate for testing
    {
      name: "iPhone 15 Pro - Space Black",
      sku: "APPLE-IP15P-SB-128",
      brandId: brands[0].id,
      categoryId: smartphones.id,
      price: 999.99,
      quantity: 25,
      status: ProductStatus.ACTIVE,
      tags: ["smartphone", "ios", "premium", "black"],
      description: "iPhone 15 Pro in Space Black color",
      createdById: manager.id,
    },
    {
      name: "Galaxy S24 Ultra",
      sku: "SAMSUNG-GS24U-512",
      brandId: brands[1].id,
      categoryId: smartphones.id,
      barcode: "887276707471",
      price: 1299.99,
      quantity: 40,
      status: ProductStatus.ACTIVE,
      tags: ["smartphone", "android", "premium", "s-pen"],
      description: "Samsung flagship with S Pen",
      createdById: admin.id,
    },
    {
      name: "Air Jordan 1 Retro High",
      sku: "NIKE-AJ1RH-BW-10",
      brandId: brands[2].id,
      categoryId: shoes.id,
      barcode: "196608048923",
      price: 170.0,
      quantity: 100,
      status: ProductStatus.ACTIVE,
      tags: ["shoes", "basketball", "retro", "jordan"],
      description: "Classic Air Jordan 1 in Black/White",
      createdById: contributor.id,
    },
  ]

  for (const product of products) {
    await prisma.product.upsert({
      where: { sku: product.sku },
      update: {},
      create: product,
    })
  }

  console.log("✅ Database seeded successfully!")
  console.log("👤 Admin user: admin@example.com / Admin123!")
  console.log("👤 Manager user: manager@example.com / Manager123!")
  console.log("👤 Contributor user: contributor@example.com / Contributor123!")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
