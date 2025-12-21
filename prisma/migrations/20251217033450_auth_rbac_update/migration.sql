/*
  Warnings:

  - You are about to drop the column `userId` on the `Technician` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ServiceOrder" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "code" TEXT NOT NULL,
    "clientId" INTEGER NOT NULL,
    "equipmentId" INTEGER,
    "technicianId" INTEGER,
    "createdById" INTEGER,
    "type" TEXT NOT NULL DEFAULT 'CORRECTIVE',
    "maintenanceArea" TEXT NOT NULL DEFAULT 'GENERAL',
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
    CONSTRAINT "ServiceOrder_technicianId_fkey" FOREIGN KEY ("technicianId") REFERENCES "Technician" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ServiceOrder_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_ServiceOrder" ("clientId", "code", "createdAt", "diagnosis", "discount", "displacement", "equipmentId", "finishedAt", "id", "internalNotes", "laborCost", "laborHours", "openedAt", "origin", "priority", "reportedDefect", "requesterName", "requesterPhone", "scheduledAt", "serviceAddress", "serviceLocation", "solution", "startedAt", "status", "technicianId", "total", "totalParts", "totalServices", "type", "updatedAt", "warrantyUntil") SELECT "clientId", "code", "createdAt", "diagnosis", "discount", "displacement", "equipmentId", "finishedAt", "id", "internalNotes", "laborCost", "laborHours", "openedAt", "origin", "priority", "reportedDefect", "requesterName", "requesterPhone", "scheduledAt", "serviceAddress", "serviceLocation", "solution", "startedAt", "status", "technicianId", "total", "totalParts", "totalServices", "type", "updatedAt", "warrantyUntil" FROM "ServiceOrder";
DROP TABLE "ServiceOrder";
ALTER TABLE "new_ServiceOrder" RENAME TO "ServiceOrder";
CREATE UNIQUE INDEX "ServiceOrder_code_key" ON "ServiceOrder"("code");
CREATE TABLE "new_Technician" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "whatsapp" TEXT,
    "document" TEXT,
    "professionalId" TEXT,
    "specialty" TEXT,
    "certifications" TEXT,
    "hireDate" DATETIME,
    "costPerHour" REAL NOT NULL DEFAULT 0.0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Technician" ("certifications", "costPerHour", "createdAt", "document", "email", "hireDate", "id", "isActive", "name", "phone", "professionalId", "specialty", "updatedAt", "whatsapp") SELECT "certifications", "costPerHour", "createdAt", "document", "email", "hireDate", "id", "isActive", "name", "phone", "professionalId", "specialty", "updatedAt", "whatsapp" FROM "Technician";
DROP TABLE "Technician";
ALTER TABLE "new_Technician" RENAME TO "Technician";
CREATE UNIQUE INDEX "Technician_email_key" ON "Technician"("email");
CREATE TABLE "new_User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
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
INSERT INTO "new_User" ("createdAt", "email", "id", "name", "password", "role", "updatedAt") SELECT "createdAt", "email", "id", "name", "password", "role", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_technicianId_key" ON "User"("technicianId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
