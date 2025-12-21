/*
  Warnings:

  - You are about to drop the column `description` on the `ServiceOrder` table. All the data in the column will be lost.
  - Added the required column `code` to the `ServiceOrder` table without a default value. This is not possible if the table is not empty.
  - Added the required column `reportedDefect` to the `ServiceOrder` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "ServiceOrderItem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "serviceOrderId" INTEGER NOT NULL,
    "serviceId" INTEGER NOT NULL,
    "quantity" REAL NOT NULL DEFAULT 1,
    "unitPrice" REAL NOT NULL,
    "subtotal" REAL NOT NULL,
    "technicianId" INTEGER,
    CONSTRAINT "ServiceOrderItem_serviceOrderId_fkey" FOREIGN KEY ("serviceOrderId") REFERENCES "ServiceOrder" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ServiceOrderItem_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ServiceOrderPart" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "serviceOrderId" INTEGER NOT NULL,
    "partId" INTEGER NOT NULL,
    "quantity" REAL NOT NULL,
    "unitPrice" REAL NOT NULL,
    "subtotal" REAL NOT NULL,
    CONSTRAINT "ServiceOrderPart_serviceOrderId_fkey" FOREIGN KEY ("serviceOrderId") REFERENCES "ServiceOrder" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ServiceOrderPart_partId_fkey" FOREIGN KEY ("partId") REFERENCES "Part" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ServiceOrder" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "code" TEXT NOT NULL,
    "clientId" INTEGER NOT NULL,
    "equipmentId" INTEGER,
    "technicianId" INTEGER,
    "type" TEXT NOT NULL DEFAULT 'CORRECTIVE',
    "origin" TEXT,
    "requesterName" TEXT,
    "requesterPhone" TEXT,
    "serviceLocation" TEXT NOT NULL DEFAULT 'INTERNAL',
    "serviceAddress" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "openedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "scheduledAt" DATETIME,
    "startedAt" DATETIME,
    "finishedAt" DATETIME,
    "warrantyUntil" DATETIME,
    "reportedDefect" TEXT NOT NULL,
    "diagnosis" TEXT,
    "solution" TEXT,
    "internalNotes" TEXT,
    "totalServices" REAL NOT NULL DEFAULT 0.0,
    "totalParts" REAL NOT NULL DEFAULT 0.0,
    "laborHours" REAL NOT NULL DEFAULT 0.0,
    "laborCost" REAL NOT NULL DEFAULT 0.0,
    "displacement" REAL NOT NULL DEFAULT 0.0,
    "discount" REAL NOT NULL DEFAULT 0.0,
    "total" REAL NOT NULL DEFAULT 0.0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ServiceOrder_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ServiceOrder_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ServiceOrder_technicianId_fkey" FOREIGN KEY ("technicianId") REFERENCES "Technician" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_ServiceOrder" ("clientId", "createdAt", "equipmentId", "id", "priority", "status", "technicianId", "updatedAt") SELECT "clientId", "createdAt", "equipmentId", "id", "priority", "status", "technicianId", "updatedAt" FROM "ServiceOrder";
DROP TABLE "ServiceOrder";
ALTER TABLE "new_ServiceOrder" RENAME TO "ServiceOrder";
CREATE UNIQUE INDEX "ServiceOrder_code_key" ON "ServiceOrder"("code");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
