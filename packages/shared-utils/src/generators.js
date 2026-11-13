"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateConfirmationNumber = generateConfirmationNumber;
exports.generateFolioNumber = generateFolioNumber;
/**
 * Generate a human-readable confirmation number.
 * Format: HMS-YYYYMMDD-XXXXX  e.g. HMS-20261007-A3F9K
 */
function generateConfirmationNumber() {
    const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomPart = Math.random().toString(36).toUpperCase().slice(2, 7);
    return `HMS-${datePart}-${randomPart}`;
}
/**
 * Generate a folio number.  Format: FOL-XXXXXXXX
 */
function generateFolioNumber() {
    const randomPart = Math.random().toString(36).toUpperCase().slice(2, 10);
    return `FOL-${randomPart}`;
}
//# sourceMappingURL=generators.js.map