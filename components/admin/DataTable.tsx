import React from "react";

export interface Column {
  key: string;
  label: string;
  render?: (value: any, row?: any) => React.ReactNode;
}

export interface DataTableProps {
  columns: Column[];
  data: any[];
  serverSide?: boolean;
  onPageChange?: (page: number) => void;
  currentPage?: number;
  totalPages?: number;
  loading?: boolean;
}

const DataTable: React.FC<DataTableProps> = ({
  columns,
  data,
  serverSide = true,
  onPageChange,
  currentPage = 1,
  totalPages = 1,
  loading = false,
}) => {
  const getStatusBadge = (status: string) => {
    const styles: { [key: string]: string } = {
      pending: "bg-yellow-500/20 text-yellow-300 border border-yellow-500/50",
      settlement: "bg-green-500/20 text-green-300 border border-green-500/50",
      processing: "bg-blue-500/20 text-blue-300 border border-blue-500/50",
      success: "bg-green-500/20 text-green-300 border border-green-500/50",
      completed: "bg-green-500/20 text-green-300 border border-green-500/50",
      failed: "bg-red-500/20 text-red-300 border border-red-500/50",
      expired: "bg-gray-500/20 text-gray-300 border border-gray-500/50",
      capture: "bg-blue-500/20 text-blue-300 border border-blue-500/50",
      deny: "bg-red-500/20 text-red-300 border border-red-500/50",
      cancel: "bg-gray-500/20 text-gray-300 border border-gray-500/50",
      refund: "bg-orange-500/20 text-orange-300 border border-orange-500/50",
    };

    return (
      <span
        className={`px-3 py-1 rounded-lg text-xs font-semibold ${
          styles[status.toLowerCase()] || styles.pending
        }`}
      >
        {status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-4 bg-[#334155] rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-4 bg-[#334155] rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-lg border border-[#334155]">
        <table className="min-w-full divide-y divide-[#334155]">
          <thead className="bg-[#0f172a]">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="px-6 py-3 text-left text-xs font-medium text-[#94a3b8] uppercase tracking-wider"
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-[#1e293b] divide-y divide-[#334155]">
            {data?.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-6 py-12 text-center text-[#94a3b8]"
                >
                  <div className="flex flex-col items-center">
                    <svg
                      className="w-12 h-12 text-[#475569] mb-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                      />
                    </svg>
                    <p className="text-lg font-medium text-[#f1f5f9]">
                      No transactions found
                    </p>
                    <p className="text-sm text-[#94a3b8]">
                      Transactions will appear here once they are created.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              data?.map((row, index) => (
                <tr
                  key={row._id || index}
                  className="hover:bg-[#0f172a] transition-colors"
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className="px-6 py-4 whitespace-nowrap text-sm text-[#f1f5f9]"
                    >
                      {column.render
                        ? column.render(row[column.key], row)
                        : column.key.includes("status") ||
                          column.key.includes("Status")
                        ? getStatusBadge(row[column.key] || "pending")
                        : row[column.key] || "-"}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {serverSide && totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 bg-[#1e293b] border-t border-[#334155] sm:px-6 rounded-b-lg">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => onPageChange && onPageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              className="relative inline-flex items-center px-4 py-2 border border-[#334155] text-sm font-medium rounded-md text-[#f1f5f9] bg-[#334155] hover:bg-[#475569] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <button
              onClick={() => onPageChange && onPageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-[#334155] text-sm font-medium rounded-md text-[#f1f5f9] bg-[#334155] hover:bg-[#475569] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-[#94a3b8]">
                Page{" "}
                <span className="font-medium text-[#f1f5f9]">
                  {currentPage}
                </span>{" "}
                of{" "}
                <span className="font-medium text-[#f1f5f9]">{totalPages}</span>
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button
                  onClick={() => onPageChange && onPageChange(currentPage - 1)}
                  disabled={currentPage <= 1}
                  className="relative inline-flex items-center px-3 py-2 rounded-l-md border border-[#334155] bg-[#334155] text-sm font-medium text-[#94a3b8] hover:bg-[#475569] hover:text-[#f1f5f9] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>

                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => onPageChange && onPageChange(pageNum)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium transition-colors ${
                        pageNum === currentPage
                          ? "z-10 bg-[#3b82f6] border-[#3b82f6] text-white"
                          : "bg-[#334155] border-[#334155] text-[#94a3b8] hover:bg-[#475569] hover:text-[#f1f5f9]"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  onClick={() => onPageChange && onPageChange(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                  className="relative inline-flex items-center px-3 py-2 rounded-r-md border border-[#334155] bg-[#334155] text-sm font-medium text-[#94a3b8] hover:bg-[#475569] hover:text-[#f1f5f9] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;
