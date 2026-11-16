-- CreateEnum
CREATE TYPE "RefundStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "ServiceOrderStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "MaintenanceStatus" AS ENUM ('REPORTED', 'IN_PROGRESS', 'RESOLVED', 'CANCELLED');

-- AlterEnum
BEGIN;
CREATE TYPE "PaymentMethod_new" AS ENUM ('CASH', 'CREDIT_CARD', 'DEBIT_CARD', 'BANK_TRANSFER', 'TELEBIRR', 'CBE_BIRR', 'VOUCHER');
ALTER TABLE "payments" ALTER COLUMN "method" TYPE "PaymentMethod_new" USING ("method"::text::"PaymentMethod_new");
ALTER TYPE "PaymentMethod" RENAME TO "PaymentMethod_old";
ALTER TYPE "PaymentMethod_new" RENAME TO "PaymentMethod";
DROP TYPE "PaymentMethod_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "ReservationStatus_new" AS ENUM ('PENDING', 'CONFIRMED', 'CHECKED_IN', 'COMPLETED', 'CANCELLED', 'NO_SHOW');
ALTER TABLE "reservations" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "reservations" ALTER COLUMN "status" TYPE "ReservationStatus_new" USING ("status"::text::"ReservationStatus_new");
ALTER TYPE "ReservationStatus" RENAME TO "ReservationStatus_old";
ALTER TYPE "ReservationStatus_new" RENAME TO "ReservationStatus";
DROP TYPE "ReservationStatus_old";
ALTER TABLE "reservations" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "RoomStatus_new" AS ENUM ('AVAILABLE', 'RESERVED', 'OCCUPIED', 'CLEANING', 'DIRTY', 'MAINTENANCE', 'OUT_OF_SERVICE');
ALTER TABLE "rooms" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "rooms" ALTER COLUMN "status" TYPE "RoomStatus_new" USING ("status"::text::"RoomStatus_new");
ALTER TYPE "RoomStatus" RENAME TO "RoomStatus_old";
ALTER TYPE "RoomStatus_new" RENAME TO "RoomStatus";
DROP TYPE "RoomStatus_old";
ALTER TABLE "rooms" ALTER COLUMN "status" SET DEFAULT 'AVAILABLE';
COMMIT;

-- DropForeignKey
ALTER TABLE "audit_logs" DROP CONSTRAINT IF EXISTS "audit_reservation_fk";

-- AlterTable
ALTER TABLE "audit_logs" ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMPTZ;

-- AlterTable
ALTER TABLE "folio_charges" ALTER COLUMN "posted_at" SET DATA TYPE TIMESTAMPTZ;

-- AlterTable
ALTER TABLE "folios" ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMPTZ;

-- AlterTable
ALTER TABLE "guests" ALTER COLUMN "email" DROP NOT NULL,
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMPTZ;

-- AlterTable
ALTER TABLE "hotels" ALTER COLUMN "timezone" SET DEFAULT 'Africa/Addis_Ababa',
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMPTZ;

-- AlterTable
ALTER TABLE "housekeeping_tasks" ALTER COLUMN "started_at" SET DATA TYPE TIMESTAMPTZ,
ALTER COLUMN "completed_at" SET DATA TYPE TIMESTAMPTZ,
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMPTZ;

-- AlterTable
ALTER TABLE "night_audit_logs" ALTER COLUMN "completed_at" SET DATA TYPE TIMESTAMPTZ;

-- AlterTable
ALTER TABLE "payments" ALTER COLUMN "processed_at" SET DATA TYPE TIMESTAMPTZ;

-- AlterTable
ALTER TABLE "reservations" ALTER COLUMN "actual_check_in" SET DATA TYPE TIMESTAMPTZ,
ALTER COLUMN "actual_check_out" SET DATA TYPE TIMESTAMPTZ,
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMPTZ;

-- AlterTable
ALTER TABLE "room_types" ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMPTZ;

-- CreateTable
CREATE TABLE "floors" (
    "id" TEXT NOT NULL,
    "hotel_id" TEXT NOT NULL,
    "floor_number" INTEGER NOT NULL,
    "name" TEXT,
    "description" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "floors_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "rooms" DROP COLUMN IF EXISTS "floor";
DELETE FROM "rooms";
ALTER TABLE "rooms" ADD COLUMN "floor_id" TEXT NOT NULL;
ALTER TABLE "rooms" ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMPTZ;

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "last_login" SET DATA TYPE TIMESTAMPTZ,
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMPTZ;

-- CreateTable
CREATE TABLE "refunds" (
    "id" TEXT NOT NULL,
    "payment_id" TEXT NOT NULL,
    "folio_id" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "RefundStatus" NOT NULL DEFAULT 'PENDING',
    "processed_by" TEXT NOT NULL,
    "processed_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refunds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "services" (
    "id" TEXT NOT NULL,
    "hotel_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "unit_price" DECIMAL(10,2) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_orders" (
    "id" TEXT NOT NULL,
    "reservation_id" TEXT NOT NULL,
    "folio_id" TEXT NOT NULL,
    "service_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unit_price" DECIMAL(10,2) NOT NULL,
    "total_amount" DECIMAL(10,2) NOT NULL,
    "status" "ServiceOrderStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "ordered_by" TEXT NOT NULL,
    "ordered_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "service_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maintenance_reports" (
    "id" TEXT NOT NULL,
    "room_id" TEXT NOT NULL,
    "reported_by" TEXT NOT NULL,
    "resolved_by" TEXT,
    "issue_type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "priority" "TaskPriority" NOT NULL DEFAULT 'NORMAL',
    "status" "MaintenanceStatus" NOT NULL DEFAULT 'REPORTED',
    "reported_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMPTZ,

    CONSTRAINT "maintenance_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "floors_hotel_id_idx" ON "floors"("hotel_id");

-- CreateIndex
CREATE UNIQUE INDEX "floors_hotel_id_floor_number_key" ON "floors"("hotel_id", "floor_number");

-- CreateIndex
CREATE INDEX "refunds_payment_id_idx" ON "refunds"("payment_id");

-- CreateIndex
CREATE INDEX "refunds_folio_id_idx" ON "refunds"("folio_id");

-- CreateIndex
CREATE INDEX "refunds_processed_by_idx" ON "refunds"("processed_by");

-- CreateIndex
CREATE INDEX "services_hotel_id_idx" ON "services"("hotel_id");

-- CreateIndex
CREATE INDEX "services_category_idx" ON "services"("category");

-- CreateIndex
CREATE INDEX "service_orders_reservation_id_idx" ON "service_orders"("reservation_id");

-- CreateIndex
CREATE INDEX "service_orders_folio_id_idx" ON "service_orders"("folio_id");

-- CreateIndex
CREATE INDEX "service_orders_service_id_idx" ON "service_orders"("service_id");

-- CreateIndex
CREATE INDEX "service_orders_ordered_by_idx" ON "service_orders"("ordered_by");

-- CreateIndex
CREATE INDEX "maintenance_reports_room_id_idx" ON "maintenance_reports"("room_id");

-- CreateIndex
CREATE INDEX "maintenance_reports_reported_by_idx" ON "maintenance_reports"("reported_by");

-- CreateIndex
CREATE INDEX "maintenance_reports_status_idx" ON "maintenance_reports"("status");

-- CreateIndex
CREATE INDEX "rooms_floor_id_idx" ON "rooms"("floor_id");

-- AddForeignKey
ALTER TABLE "floors" ADD CONSTRAINT "floors_hotel_id_fkey" FOREIGN KEY ("hotel_id") REFERENCES "hotels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_floor_id_fkey" FOREIGN KEY ("floor_id") REFERENCES "floors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_folio_id_fkey" FOREIGN KEY ("folio_id") REFERENCES "folios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_processed_by_fkey" FOREIGN KEY ("processed_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "services" ADD CONSTRAINT "services_hotel_id_fkey" FOREIGN KEY ("hotel_id") REFERENCES "hotels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_orders" ADD CONSTRAINT "service_orders_reservation_id_fkey" FOREIGN KEY ("reservation_id") REFERENCES "reservations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_orders" ADD CONSTRAINT "service_orders_folio_id_fkey" FOREIGN KEY ("folio_id") REFERENCES "folios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_orders" ADD CONSTRAINT "service_orders_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_orders" ADD CONSTRAINT "service_orders_ordered_by_fkey" FOREIGN KEY ("ordered_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_reports" ADD CONSTRAINT "maintenance_reports_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_reports" ADD CONSTRAINT "maintenance_reports_reported_by_fkey" FOREIGN KEY ("reported_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_reports" ADD CONSTRAINT "maintenance_reports_resolved_by_fkey" FOREIGN KEY ("resolved_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ═══════════════════════════════════════════════════════════════════════════════
-- RAW SQL DATABASE GUARDS
-- ═══════════════════════════════════════════════════════════════════════════════

-- 1. Prevent double bookings
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE "reservations"
ADD CONSTRAINT "no_overlapping_reservations"
EXCLUDE USING GIST (
    "room_id" WITH =,
    daterange("check_in_date", "check_out_date", '[)') WITH &&
)
WHERE ("room_id" IS NOT NULL AND "status" NOT IN ('CANCELLED', 'NO_SHOW', 'COMPLETED'));

-- 2. Valid reservation dates
ALTER TABLE "reservations"
ADD CONSTRAINT "check_out_after_check_in"
CHECK ("check_out_date" > "check_in_date");

-- 3. Append-only audit_logs
CREATE OR REPLACE FUNCTION prevent_audit_logs_modification()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'audit_logs is append-only; updates and deletes are forbidden';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_audit_logs_append_only
BEFORE UPDATE OR DELETE ON "audit_logs"
FOR EACH ROW
EXECUTE FUNCTION prevent_audit_logs_modification();

-- 4. Protect financial rows from deletion
CREATE OR REPLACE FUNCTION prevent_financial_record_deletion()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Financial records cannot be deleted. Use reversal or refund instead.';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_folio_charges_prevent_delete
BEFORE DELETE ON "folio_charges"
FOR EACH ROW
EXECUTE FUNCTION prevent_financial_record_deletion();

CREATE TRIGGER trg_payments_prevent_delete
BEFORE DELETE ON "payments"
FOR EACH ROW
EXECUTE FUNCTION prevent_financial_record_deletion();

CREATE TRIGGER trg_refunds_prevent_delete
BEFORE DELETE ON "refunds"
FOR EACH ROW
EXECUTE FUNCTION prevent_financial_record_deletion();

