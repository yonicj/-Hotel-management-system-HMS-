import * as React from 'react';
import { Search, ChevronLeft, ChevronRight, Inbox } from 'lucide-react';

export interface Column<T> {
  key: string;
  header: React.ReactNode;
  render?: (row: T, index: number) => React.ReactNode;
  className?: string;
  headerClassName?: string;
}

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  pageSize?: number;
  totalItems?: number;
  onPageChange: (page: number) => void;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  searchable?: boolean;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  searchPlaceholder?: string;
  pagination?: PaginationProps;
  emptyState?: React.ReactNode;
  emptyTitle?: string;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
  rowKey?: (row: T, index: number) => string | number;
  actions?: React.ReactNode;
  className?: string;
}

export function DataTable<T>({
  columns,
  data,
  isLoading = false,
  searchable = false,
  searchQuery = '',
  onSearchChange,
  searchPlaceholder = 'Search...',
  pagination,
  emptyState,
  emptyTitle = 'No records found',
  emptyMessage = 'There are no items to display at this time.',
  onRowClick,
  rowKey,
  actions,
  className = '',
}: DataTableProps<T>) {
  return (
    <div className={`w-full bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden ${className}`}>
      {/* Header Bar with Search & Actions */}
      {(searchable || actions) && (
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-slate-50/50">
          {searchable ? (
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange?.(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
              />
            </div>
          ) : (
            <div />
          )}
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}

      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 border-b border-slate-200">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-3.5 font-semibold ${col.headerClassName || ''}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              // Loading Skeleton Rows
              Array.from({ length: 5 }).map((_, rIdx) => (
                <tr key={`skeleton-${rIdx}`} className="animate-pulse">
                  {columns.map((col, cIdx) => (
                    <td key={`skel-cell-${cIdx}`} className="px-4 py-4">
                      <div className="h-4 bg-slate-200 rounded w-3/4" />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              // Empty State
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center">
                  {emptyState || (
                    <div className="flex flex-col items-center justify-center text-slate-400 space-y-2">
                      <div className="p-3 bg-slate-100 rounded-full text-slate-400">
                        <Inbox className="w-6 h-6" />
                      </div>
                      <p className="font-semibold text-slate-700">{emptyTitle}</p>
                      <p className="text-xs text-slate-400 max-w-sm">{emptyMessage}</p>
                    </div>
                  )}
                </td>
              </tr>
            ) : (
              // Data Rows
              data.map((row, rowIdx) => {
                const key = rowKey ? rowKey(row, rowIdx) : (row as any)?.id || rowIdx;
                return (
                  <tr
                    key={key}
                    onClick={() => onRowClick?.(row)}
                    className={`transition-colors hover:bg-slate-50/80 ${
                      onRowClick ? 'cursor-pointer' : ''
                    }`}
                  >
                    {columns.map((col) => (
                      <td key={col.key} className={`px-4 py-3.5 ${col.className || ''}`}>
                        {col.render ? col.render(row, rowIdx) : (row as any)[col.key]}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {pagination && pagination.totalPages > 1 && (
        <div className="px-4 py-3 border-t border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            {pagination.totalItems !== undefined ? (
              <span>
                Showing{' '}
                <span className="font-medium text-slate-700">
                  {(pagination.currentPage - 1) * (pagination.pageSize || 10) + 1}
                </span>{' '}
                to{' '}
                <span className="font-medium text-slate-700">
                  {Math.min(
                    pagination.currentPage * (pagination.pageSize || 10),
                    pagination.totalItems
                  )}
                </span>{' '}
                of <span className="font-medium text-slate-700">{pagination.totalItems}</span> results
              </span>
            ) : (
              <span>
                Page <span className="font-medium text-slate-700">{pagination.currentPage}</span> of{' '}
                <span className="font-medium text-slate-700">{pagination.totalPages}</span>
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage <= 1}
              className="p-1.5 rounded border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 py-1 font-medium text-slate-700 bg-white border border-slate-200 rounded">
              {pagination.currentPage} / {pagination.totalPages}
            </span>
            <button
              onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
              disabled={pagination.currentPage >= pagination.totalPages}
              className="p-1.5 rounded border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              aria-label="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
