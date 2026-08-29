"use client";

import clsx from "clsx";

const DOTS = "…";

// Always keeps the first and last page visible, plus a small window around
// the current page, and collapses everything else into a single "…" on each
// side once there's more than one page in the gap -- e.g. 1 . 24 25 26 . 50
// instead of listing every page from 1 to 50.
function getPageItems(current: number, total: number, siblingCount = 1): (number | typeof DOTS)[] {
  const totalNumbers = siblingCount * 2 + 5; // first + last + current + 2 dots
  if (total <= totalNumbers) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const leftSibling = Math.max(current - siblingCount, 1);
  const rightSibling = Math.min(current + siblingCount, total);
  const showLeftDots = leftSibling > 2;
  const showRightDots = rightSibling < total - 1;

  if (!showLeftDots && showRightDots) {
    const leftRange = Array.from({ length: 3 + siblingCount * 2 }, (_, i) => i + 1);
    return [...leftRange, DOTS, total];
  }

  if (showLeftDots && !showRightDots) {
    const rightRange = Array.from({ length: 3 + siblingCount * 2 }, (_, i) => total - (3 + siblingCount * 2) + i + 1);
    return [1, DOTS, ...rightRange];
  }

  const middleRange = Array.from({ length: rightSibling - leftSibling + 1 }, (_, i) => leftSibling + i);
  return [1, DOTS, ...middleRange, DOTS, total];
}

export default function Pagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;
  const items = getPageItems(page, totalPages);

  return (
    <nav className="mt-8 flex items-center justify-center gap-1.5" aria-label="Pagination">
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        className="rounded-lg border border-surface-border px-3 py-1.5 text-sm text-ink disabled:opacity-40"
        aria-label="Previous page"
      >
        Prev
      </button>

      {items.map((item, i) =>
        item === DOTS ? (
          <span key={`dots-${i}`} className="px-1.5 text-sm text-ink-soft">
            {DOTS}
          </span>
        ) : (
          <button
            key={item}
            type="button"
            onClick={() => onPageChange(item)}
            aria-current={item === page ? "page" : undefined}
            className={clsx(
              "min-w-[2.25rem] rounded-lg border px-2.5 py-1.5 text-sm",
              item === page
                ? "border-brand-red bg-brand-red text-white"
                : "border-surface-border text-ink hover:bg-surface-muted"
            )}
          >
            {item}
          </button>
        )
      )}

      <button
        type="button"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        className="rounded-lg border border-surface-border px-3 py-1.5 text-sm text-ink disabled:opacity-40"
        aria-label="Next page"
      >
        Next
      </button>
    </nav>
  );
}
