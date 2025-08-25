# Product Management System - User Guide

## Overview

This is a simplified product management system that allows you to:

- Add products with auto-generated serial numbers (SN)
- Display products in a table format
- Paste multiple product names from Excel at once
- Delete individual products

## Features

### 1. Auto Serial Numbers

- Each product gets an automatically generated serial number (SN)
- Serial numbers start from 1 and increment automatically
- You don't need to provide serial numbers manually

### 2. Simple Product Entry

- Only product names are required
- No need for SKU, price, stock, or other complex fields

### 3. Bulk Product Entry

- You can paste multiple product names at once
- Copy product names from Excel (one per line)
- Paste them into the text area
- Click "Add Products" to add them all at once

### 4. Product Display

- Products are displayed in a clean table format
- Shows: Serial Number (SN), Product Name, Created Date, and Actions
- Table is responsive and works on all devices

## How to Use

### Adding Single Product

1. Go to the Products page (automatically redirects from home)
2. In the "Add New Products" section, enter a product name
3. Click "Add Products"

### Adding Multiple Products

1. Copy product names from Excel (select a column of product names)
2. Paste into the text area in the "Add New Products" section
3. Each line will be treated as a separate product
4. Click "Add Products" to add them all

### Example of Multiple Products Entry:

```
Aircurl
2Nd Amendment Collectible Coin
360Brite
4 Hands Massager
45Th & 47Th President Flag Hat
```

### Deleting Products

1. Find the product in the table
2. Click the "Delete" button in the Actions column
3. Confirm the deletion

## Database

- Uses PostgreSQL database
- Products table structure:
  - `id`: Unique identifier (auto-generated)
  - `sn`: Serial number (auto-incrementing, starts from 1)
  - `name`: Product name
  - `createdAt`: Creation timestamp
  - `updatedAt`: Last update timestamp

## Technical Details

- Built with Next.js 15.5.0 and React 19
- Uses Prisma ORM for database operations
- PostgreSQL database backend
- Responsive design with Tailwind CSS
- Real-time updates after adding/deleting products

## URL Access

- Home page: `http://localhost:3000` (redirects to products)
- Products page: `http://localhost:3000/products`

## Sample Data

The application comes pre-seeded with 26 sample products including:

- Aircurl
- 2Nd Amendment Collectible Coin
- 360Brite
- And 23 other products...

You can delete these and add your own, or keep them as examples.
