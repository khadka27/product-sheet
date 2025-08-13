# Product Catalog App

A modern, production-ready product catalog application with advanced features including spreadsheet-like table UI, role-based access control, duplicate detection, and Excel/PDF import/export.

## Tech Stack

- **Framework**: Next.js 15 (App Router, RSC, Server Actions), TypeScript
- **Monorepo**: Turborepo with apps/web and packages (ui, db, config)
- **Database**: PostgreSQL + Prisma ORM
- **Authentication**: NextAuth v5 with role-based access control
- **UI**: Tailwind CSS + shadcn/ui components
- **Table**: TanStack Table v8 with virtualization
- **Import/Export**: SheetJS (Excel) + pdfmake (PDF)

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- (Optional) Google OAuth credentials

### Installation

1. Clone the repository and install dependencies:
\`\`\`bash
npm install
\`\`\`

2. Set up your environment variables:
\`\`\`bash
cp .env.example .env
# Edit .env with your database URL and other credentials
\`\`\`

3. Set up the database:
\`\`\`bash
# Push schema and seed data
npm run db:push
npm run db:seed
\`\`\`

4. Start the development server:
\`\`\`bash
npm run dev
\`\`\`

The app will be available at `http://localhost:3000`.

### Default Users

After seeding, you can log in with these accounts:

- **Admin**: `admin@example.com` / `Admin123!`
- **Manager**: `manager@example.com` / `Manager123!`
- **Contributor**: `contributor@example.com` / `Contributor123!`

## User Roles & Permissions

- **ADMIN**: Full access to everything including user management
- **MANAGER**: CRUD on products/categories/brands, import/export, no user management
- **CONTRIBUTOR**: Add products, edit own products only, staged imports
- **VIEWER**: Read-only access, can export data

## Guided Tour

### 1. Log in as Admin
1. Go to `/login` and sign in with `admin@example.com` / `Admin123!`
2. You'll see the dashboard with product statistics

### 2. Create a Contributor User
1. Navigate to `/admin/users` (Admin only)
2. Click "Add User" and create a new contributor
3. Set role to "CONTRIBUTOR"

### 3. Import Excel Sample
1. Go to `/imports`
2. Upload an Excel file with columns: name, sku, brand, category, price, etc.
3. Review duplicate detection results
4. Merge approved items into the catalog

### 4. Export Data
1. Go to `/products`
2. Apply filters or select specific products
3. Click "Export" and choose Excel or PDF format
4. Download will include your filtered view

## Database Setup

The app requires PostgreSQL with these extensions:
- `pg_trgm` (trigram similarity for fuzzy search)
- `unaccent` (text normalization)

These are automatically enabled during migration.

## Development

\`\`\`bash
# Start development server
npm run dev

# Run database operations
npm run db:push      # Push schema changes
npm run db:migrate   # Create migration
npm run db:seed      # Seed sample data
npm run db:studio    # Open Prisma Studio

# Build and test
npm run build
npm run lint
npm run test
\`\`\`

## Project Structure

\`\`\`
├── apps/
│   └── web/                 # Next.js application
├── packages/
│   ├── ui/                  # Shared UI components
│   ├── db/                  # Prisma schema and client
│   └── config/              # Shared configurations
└── turbo.json               # Turborepo configuration
