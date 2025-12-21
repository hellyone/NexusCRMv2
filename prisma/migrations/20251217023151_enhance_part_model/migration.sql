/*
  Warnings:

  - You are about to drop the column `price` on the `Part` table. All the data in the column will be lost.
  - You are about to drop the column `stock` on the `Part` table. All the data in the column will be lost.
  - Added the required column `updatedAt` to the `Part` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Part" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sku" TEXT,
    "partNumber" TEXT,
    "brand" TEXT,
    "model" TEXT,
    "ncm" TEXT,
    "costPrice" REAL NOT NULL DEFAULT 0.0,
    "salePrice" REAL NOT NULL DEFAULT 0.0,
    "stockQuantity" INTEGER NOT NULL DEFAULT 0,
    "minStock" INTEGER NOT NULL DEFAULT 0,
    "maxStock" INTEGER,
    "location" TEXT,
    "unit" TEXT NOT NULL DEFAULT 'UN',
    "category" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Part" ("id", "name", "sku") SELECT "id", "name", "sku" FROM "Part";
DROP TABLE "Part";
ALTER TABLE "new_Part" RENAME TO "Part";
CREATE UNIQUE INDEX "Part_sku_key" ON "Part"("sku");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
