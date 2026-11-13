"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateNights = calculateNights;
exports.today = today;
exports.formatDisplayDate = formatDisplayDate;
exports.formatDisplayDateTime = formatDisplayDateTime;
/**
 * Calculate number of nights between two date strings (YYYY-MM-DD).
 */
function calculateNights(checkIn, checkOut) {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diffMs = end.getTime() - start.getTime();
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}
/**
 * Get today's date as a YYYY-MM-DD string (UTC).
 */
function today() {
    return new Date().toISOString().split('T')[0];
}
/**
 * Format a date for display: "Mon, 07 Oct 2026"
 */
function formatDisplayDate(date) {
    return new Date(date).toLocaleDateString('en-GB', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
}
/**
 * Format a datetime for display including time.
 */
function formatDisplayDateTime(date) {
    return new Date(date).toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}
//# sourceMappingURL=date.js.map