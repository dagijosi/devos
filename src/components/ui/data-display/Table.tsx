import React, { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/* -----------------------------
   Responsive max page buttons
------------------------------ */
const useResponsiveMaxPages = (override?: number) => {
  const [max, setMax] = useState(5);

  useEffect(() => {
    if (override) {
      setMax(override);
      return;
    }

    const update = () => {
      if (window.innerWidth < 640) setMax(3);       // mobile
      else if (window.innerWidth < 1024) setMax(5); // tablet
      else setMax(7);                               // desktop
    };

    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [override]);

  return max;
};

/* -----------------------------
   CORRECT page window logic
------------------------------ */
const getVisibleRange = (
  current: number,
  total: number,
  max: number
) => {
  const half = Math.floor(max / 2);

  const start = Math.max(
    1,
    Math.min(current - half, total - max + 1)
  );

  const end = Math.min(total, start + max - 1);

  return { start, end };
};


/* -----------------------------
   Pagination
------------------------------ */
const Pagination = ({
  page,
  totalPages,
  onPageChange,
  pageSize,
  onPageSizeChange,
  pageSizeOptions,
  totalItems,
  maxPageButtons,
}: {
  page: number;
  totalPages: number;
  onPageChange: (p: number) => void;
  pageSize: number;
  onPageSizeChange: (s: number) => void;
  pageSizeOptions: number[];
  totalItems: number;
  maxPageButtons?: number;
}) => {
  const max = useResponsiveMaxPages(maxPageButtons);
  const { start, end } = getVisibleRange(page, totalPages, max);

  const baseBtn =
    'flex h-9 min-w-[36px] items-center justify-center rounded-lg border border-theme-border bg-theme-background text-sm text-theme-text transition hover:bg-theme-icon/10 disabled:opacity-40';

  const activeBtn =
    'bg-theme-icon text-white shadow-md';

  return (
    <div className="mt-4 flex flex-col gap-3 rounded-xl bg-theme-surface/20 p-3 sm:flex-row sm:items-center sm:justify-between">

      {/* PAGE CONTROLS */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className={baseBtn}
        >
          <ChevronLeft size={16} />
        </button>

        {/* FIRST PAGE */}
        {start > 1 && (
          <button
            onClick={() => onPageChange(1)}
            className={baseBtn}
          >
            1
          </button>
        )}

        {/* LEFT ELLIPSIS (ONLY when needed) */}
        {start > 2 && (
          <span className="px-2 text-theme-text/40">…</span>
        )}

        {/* PAGE NUMBERS */}
        {Array.from({ length: end - start + 1 }).map((_, i) => {
          const p = start + i;
          return (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`${baseBtn} ${p === page ? activeBtn : ''}`}
            >
              {p}
            </button>
          );
        })}

        {/* RIGHT ELLIPSIS */}
        {end < totalPages - 1 && (
          <span className="px-2 text-theme-text/40">…</span>
        )}

        {/* LAST PAGE */}
        {end < totalPages && (
          <button
            onClick={() => onPageChange(totalPages)}
            className={baseBtn}
          >
            {totalPages}
          </button>
        )}

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          className={baseBtn}
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* PAGE SIZE */}
      <div className="flex items-center gap-2 text-sm text-theme-text/70">
        <span>Rows</span>
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className="rounded-lg border border-theme-border bg-theme-background px-2 py-1"
        >
          {pageSizeOptions.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <span className="text-theme-text/50">{totalItems} items</span>
      </div>
    </div>
  );
};

/* -----------------------------
   TABLE
------------------------------ */
interface TableProps<T> {
  items: T[];
  renderRow: (item: T, index: number) => React.ReactNode;
  renderMobileItem?: (item: T, index: number) => React.ReactNode;
  pageSize?: number;
  pageSizeOptions?: number[];
  maxPageButtons?: number;
  children?: React.ReactNode;
}

export const Table = <T,>({
  items,
  renderRow,
  renderMobileItem,
  pageSize = 10,
  pageSizeOptions = [5, 10, 20],
  maxPageButtons,
  children,
}: TableProps<T>) => {
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(pageSize);

  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / size));

  const pagedItems = useMemo(() => {
    const start = (page - 1) * size;
    return items.slice(start, start + size);
  }, [items, page, size]);

  /* MOBILE */
  const mobileView = renderMobileItem && (
    <div className="space-y-3 md:hidden">
      {pagedItems.map((item, i) => (
        <div
          key={i}
          className="rounded-xl border border-theme-border bg-theme-surface p-4 shadow-sm"
        >
          {renderMobileItem(item, i)}
        </div>
      ))}

      {totalItems > size && (
        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          pageSize={size}
          onPageSizeChange={(s) => {
            setSize(s);
            setPage(1);
          }}
          pageSizeOptions={pageSizeOptions}
          totalItems={totalItems}
          maxPageButtons={maxPageButtons}
        />
      )}
    </div>
  );

  return (
    <>
      {mobileView}

      {/* DESKTOP */}
      <div className="hidden md:block overflow-x-auto rounded-xl border border-theme-border bg-theme-surface/60">
        <table className="w-full text-left text-sm text-theme-text">
          {children}
          <tbody className="divide-y divide-theme-border/50">
            {pagedItems.map((item, i) => (
              <React.Fragment key={i}>
                {renderRow(item, i)}
              </React.Fragment>
            ))}
          </tbody>
        </table>

        {totalItems > size && (
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            pageSize={size}
            onPageSizeChange={(s) => {
              setSize(s);
              setPage(1);
            }}
            pageSizeOptions={pageSizeOptions}
            totalItems={totalItems}
            maxPageButtons={maxPageButtons}
          />
        )}
      </div>
    </>
  );
};

/* -----------------------------
   TABLE UI HELPERS
------------------------------ */
export const TableHeader = ({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <thead
    className={`border-b border-theme-border bg-theme-surface/50 ${className}`}
  >
    {children}
  </thead>
);

export const TableRow = ({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <tr className={`hover:bg-theme-surface/60 transition ${className}`}>
    {children}
  </tr>
);

export const TableHead = ({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <th
    className={`px-4 py-3 text-left text-sm font-medium text-theme-text/60 ${className}`}
  >
    {children}
  </th>
);


export const TableCell = ({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <td className={`px-4 py-3 ${className}`}>{children}</td>
);
