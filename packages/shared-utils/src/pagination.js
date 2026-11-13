"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildPaginationMeta = buildPaginationMeta;
exports.getSkip = getSkip;
exports.parsePaginationParams = parsePaginationParams;
function buildPaginationMeta(page, limit, total) {
    return {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
    };
}
function getSkip(page, limit) {
    return (Math.max(1, page) - 1) * limit;
}
function parsePaginationParams(rawPage, rawLimit, maxLimit = 100) {
    const page = Math.max(1, parseInt(String(rawPage ?? 1), 10) || 1);
    const limit = Math.min(maxLimit, Math.max(1, parseInt(String(rawLimit ?? 20), 10) || 20));
    return { page, limit };
}
//# sourceMappingURL=pagination.js.map