"use strict";
// ─── Room Enums ──────────────────────────────────────────────────────────────
Object.defineProperty(exports, "__esModule", { value: true });
exports.SOCKET_EVENTS = exports.FolioStatus = exports.PaymentStatus = exports.PaymentMethod = exports.ChargeType = exports.TaskPriority = exports.HousekeepingTaskStatus = exports.HousekeepingTaskType = exports.VipLevel = exports.GuestIdType = exports.ReservationSource = exports.ReservationStatus = exports.RoomStatus = void 0;
var RoomStatus;
(function (RoomStatus) {
    RoomStatus["AVAILABLE"] = "available";
    RoomStatus["OCCUPIED"] = "occupied";
    RoomStatus["DIRTY"] = "dirty";
    RoomStatus["CLEAN"] = "clean";
    RoomStatus["MAINTENANCE"] = "maintenance";
    RoomStatus["OUT_OF_ORDER"] = "out_of_order";
})(RoomStatus || (exports.RoomStatus = RoomStatus = {}));
// ─── Reservation Enums ───────────────────────────────────────────────────────
var ReservationStatus;
(function (ReservationStatus) {
    ReservationStatus["PENDING"] = "pending";
    ReservationStatus["CONFIRMED"] = "confirmed";
    ReservationStatus["CHECKED_IN"] = "checked_in";
    ReservationStatus["CHECKED_OUT"] = "checked_out";
    ReservationStatus["CANCELLED"] = "cancelled";
    ReservationStatus["NO_SHOW"] = "no_show";
})(ReservationStatus || (exports.ReservationStatus = ReservationStatus = {}));
var ReservationSource;
(function (ReservationSource) {
    ReservationSource["WALK_IN"] = "walk_in";
    ReservationSource["PHONE"] = "phone";
    ReservationSource["WEBSITE"] = "website";
    ReservationSource["OTA"] = "ota_booking";
    ReservationSource["AGENT"] = "agent";
})(ReservationSource || (exports.ReservationSource = ReservationSource = {}));
// ─── Guest Enums ─────────────────────────────────────────────────────────────
var GuestIdType;
(function (GuestIdType) {
    GuestIdType["PASSPORT"] = "passport";
    GuestIdType["NATIONAL_ID"] = "national_id";
    GuestIdType["DRIVING_LICENSE"] = "driving_license";
})(GuestIdType || (exports.GuestIdType = GuestIdType = {}));
var VipLevel;
(function (VipLevel) {
    VipLevel["STANDARD"] = "standard";
    VipLevel["SILVER"] = "silver";
    VipLevel["GOLD"] = "gold";
    VipLevel["PLATINUM"] = "platinum";
})(VipLevel || (exports.VipLevel = VipLevel = {}));
// ─── Housekeeping Enums ──────────────────────────────────────────────────────
var HousekeepingTaskType;
(function (HousekeepingTaskType) {
    HousekeepingTaskType["CHECKOUT_CLEAN"] = "checkout_clean";
    HousekeepingTaskType["STAYOVER_CLEAN"] = "stayover_clean";
    HousekeepingTaskType["TURNDOWN"] = "turndown";
    HousekeepingTaskType["INSPECTION"] = "inspection";
    HousekeepingTaskType["MAINTENANCE"] = "maintenance";
})(HousekeepingTaskType || (exports.HousekeepingTaskType = HousekeepingTaskType = {}));
var HousekeepingTaskStatus;
(function (HousekeepingTaskStatus) {
    HousekeepingTaskStatus["PENDING"] = "pending";
    HousekeepingTaskStatus["IN_PROGRESS"] = "in_progress";
    HousekeepingTaskStatus["COMPLETED"] = "completed";
    HousekeepingTaskStatus["VERIFIED"] = "verified";
})(HousekeepingTaskStatus || (exports.HousekeepingTaskStatus = HousekeepingTaskStatus = {}));
var TaskPriority;
(function (TaskPriority) {
    TaskPriority["LOW"] = "low";
    TaskPriority["NORMAL"] = "normal";
    TaskPriority["HIGH"] = "high";
    TaskPriority["URGENT"] = "urgent";
})(TaskPriority || (exports.TaskPriority = TaskPriority = {}));
// ─── Billing Enums ───────────────────────────────────────────────────────────
var ChargeType;
(function (ChargeType) {
    ChargeType["ROOM_RATE"] = "room_rate";
    ChargeType["FNB"] = "f&b";
    ChargeType["MINIBAR"] = "minibar";
    ChargeType["LAUNDRY"] = "laundry";
    ChargeType["TAX"] = "tax";
    ChargeType["SERVICE_CHARGE"] = "service_charge";
    ChargeType["MISC"] = "misc";
})(ChargeType || (exports.ChargeType = ChargeType = {}));
var PaymentMethod;
(function (PaymentMethod) {
    PaymentMethod["CASH"] = "cash";
    PaymentMethod["CREDIT_CARD"] = "credit_card";
    PaymentMethod["DEBIT_CARD"] = "debit_card";
    PaymentMethod["BANK_TRANSFER"] = "bank_transfer";
    PaymentMethod["MPESA"] = "mpesa";
    PaymentMethod["VOUCHER"] = "voucher";
})(PaymentMethod || (exports.PaymentMethod = PaymentMethod = {}));
var PaymentStatus;
(function (PaymentStatus) {
    PaymentStatus["PENDING"] = "pending";
    PaymentStatus["COMPLETED"] = "completed";
    PaymentStatus["FAILED"] = "failed";
    PaymentStatus["REFUNDED"] = "refunded";
})(PaymentStatus || (exports.PaymentStatus = PaymentStatus = {}));
var FolioStatus;
(function (FolioStatus) {
    FolioStatus["OPEN"] = "open";
    FolioStatus["CLOSED"] = "closed";
})(FolioStatus || (exports.FolioStatus = FolioStatus = {}));
// ─── Socket Event Names ──────────────────────────────────────────────────────
exports.SOCKET_EVENTS = {
    ROOM_STATUS_UPDATED: 'room:status:updated',
    RESERVATION_CHECKED_IN: 'reservation:checked_in',
    RESERVATION_CHECKED_OUT: 'reservation:checked_out',
    RESERVATION_CREATED: 'reservation:created',
    RESERVATION_CANCELLED: 'reservation:cancelled',
    HOUSEKEEPING_TASK_UPDATED: 'housekeeping:task:updated',
    HOUSEKEEPING_TASK_ASSIGNED: 'housekeeping:task:assigned',
    NIGHT_AUDIT_PROGRESS: 'night_audit:progress',
};
//# sourceMappingURL=enums.js.map