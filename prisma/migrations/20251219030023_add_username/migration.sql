/*
  Warnings:

  - You are about to drop the column `technicalContact` on the `Client` table. All the data in the column will be lost.
  - Added the required column `username` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ServiceOrder" ADD COLUMN "entryInvoiceNumber" TEXT;

-- CreateTable
CREATE TABLE "ClientCertification" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "clientId" INTEGER NOT NULL,
    "technicianId" INTEGER,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "issuedAt" DATETIME,
    "expiresAt" DATETIME,
    "alertDays" INTEGER NOT NULL DEFAULT 30,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ClientCertification_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ClientCertification_technicianId_fkey" FOREIGN KEY ("technicianId") REFERENCES "Technician" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProductCatalog" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "partNumber" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "brand" TEXT,
    "model" TEXT,
    "weight" REAL DEFAULT 0.0,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Client" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "tradeName" TEXT,
    "document" TEXT NOT NULL,
    "personType" TEXT NOT NULL DEFAULT 'PJ',
    "stateRegistry" TEXT,
    "cityRegistry" TEXT,
    "cnae" TEXT,
    "taxRegime" TEXT,
    "logoUrl" TEXT,
    "zipCode" TEXT,
    "street" TEXT,
    "number" TEXT,
    "complement" TEXT,
    "neighborhood" TEXT,
    "city" TEXT,
    "state" TEXT,
    "phonePrimary" TEXT,
    "phoneSecondary" TEXT,
    "whatsapp" TEXT,
    "emailPrimary" TEXT,
    "emailSecondary" TEXT,
    "techName" TEXT,
    "techDocument" TEXT,
    "techClassId" TEXT,
    "techContact" TEXT,
    "segment" TEXT,
    "creditLimit" REAL DEFAULT 0,
    "paymentTerms" TEXT,
    "bankName" TEXT,
    "bankAgency" TEXT,
    "bankAccount" TEXT,
    "pixKey" TEXT,
    "observations" TEXT,
    "operatingHours" TEXT,
    "notificationSettings" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Client" ("city", "cityRegistry", "complement", "createdAt", "creditLimit", "document", "emailPrimary", "emailSecondary", "id", "isActive", "name", "neighborhood", "number", "observations", "paymentTerms", "personType", "phonePrimary", "phoneSecondary", "segment", "state", "stateRegistry", "street", "tradeName", "updatedAt", "whatsapp", "zipCode") SELECT "city", "cityRegistry", "complement", "createdAt", "creditLimit", "document", "emailPrimary", "emailSecondary", "id", "isActive", "name", "neighborhood", "number", "observations", "paymentTerms", "personType", "phonePrimary", "phoneSecondary", "segment", "state", "stateRegistry", "street", "tradeName", "updatedAt", "whatsapp", "zipCode" FROM "Client";
DROP TABLE "Client";
ALTER TABLE "new_Client" RENAME TO "Client";
CREATE UNIQUE INDEX "Client_document_key" ON "Client"("document");
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
    "usageType" TEXT NOT NULL DEFAULT 'BOTH',
    "category" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Part" ("brand", "category", "costPrice", "createdAt", "description", "id", "isActive", "location", "maxStock", "minStock", "model", "name", "ncm", "partNumber", "salePrice", "sku", "stockQuantity", "unit", "updatedAt") SELECT "brand", "category", "costPrice", "createdAt", "description", "id", "isActive", "location", "maxStock", "minStock", "model", "name", "ncm", "partNumber", "salePrice", "sku", "stockQuantity", "unit", "updatedAt" FROM "Part";
DROP TABLE "Part";
ALTER TABLE "new_Part" RENAME TO "Part";
CREATE UNIQUE INDEX "Part_sku_key" ON "Part"("sku");
CREATE TABLE "new_StockMovement" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "type" TEXT NOT NULL,
    "stockType" TEXT NOT NULL DEFAULT 'sales',
    "quantity" INTEGER NOT NULL,
    "unitCost" REAL,
    "reason" TEXT,
    "partId" INTEGER NOT NULL,
    "serviceOrderId" INTEGER,
    "userId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StockMovement_partId_fkey" FOREIGN KEY ("partId") REFERENCES "Part" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "StockMovement_serviceOrderId_fkey" FOREIGN KEY ("serviceOrderId") REFERENCES "ServiceOrder" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "StockMovement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_StockMovement" ("createdAt", "id", "partId", "quantity", "reason", "serviceOrderId", "type", "unitCost", "userId") SELECT "createdAt", "id", "partId", "quantity", "reason", "serviceOrderId", "type", "unitCost", "userId" FROM "StockMovement";
DROP TABLE "StockMovement";
ALTER TABLE "new_StockMovement" RENAME TO "StockMovement";
CREATE TABLE "new_User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'TECH_FIELD',
    "technicianId" INTEGER,
    "specialties" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLogin" DATETIME,
    "failedAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "User_technicianId_fkey" FOREIGN KEY ("technicianId") REFERENCES "Technician" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_User" ("createdAt", "email", "failedAttempts", "id", "isActive", "lastLogin", "lockedUntil", "name", "password", "role", "specialties", "technicianId", "updatedAt") SELECT "createdAt", "email", "failedAttempts", "id", "isActive", "lastLogin", "lockedUntil", "name", "password", "role", "specialties", "technicianId", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_technicianId_key" ON "User"("technicianId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "ProductCatalog_partNumber_key" ON "ProductCatalog"("partNumber");
