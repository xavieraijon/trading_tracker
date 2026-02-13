import { KtdGridLayout } from '@katoid/angular-grid-layout';
import { getWidgetDefinition } from './widget-registry';

// ── Breakpoint definitions ──────────────────────────────────

export type BreakpointKey = 'xl' | 'lg' | 'md' | 'sm' | 'xs';

export interface GridBreakpoint {
  key: BreakpointKey;
  /** Minimum width in pixels (inclusive) */
  minWidth: number;
  cols: number;
  rowHeight: number;
  gap: number;
}

/**
 * Ordered from largest to smallest. The first match wins.
 * Designed so KPIs (w:2) stack nicely and charts reflow.
 */
export const GRID_BREAKPOINTS: GridBreakpoint[] = [
  { key: 'xl', minWidth: 1400, cols: 12, rowHeight: 80, gap: 10 },
  { key: 'lg', minWidth: 1024, cols: 8,  rowHeight: 75, gap: 8 },
  { key: 'md', minWidth: 768,  cols: 6,  rowHeight: 70, gap: 8 },
  { key: 'sm', minWidth: 576,  cols: 4,  rowHeight: 65, gap: 6 },
  { key: 'xs', minWidth: 0,    cols: 2,  rowHeight: 60, gap: 6 },
];

/**
 * Resolve the active breakpoint config for a given viewport width (pixels).
 * Iterates from largest to smallest — the first match wins.
 */
export function getBreakpointForWidth(width: number): GridBreakpoint {
  return GRID_BREAKPOINTS.find(bp => width >= bp.minWidth) ?? GRID_BREAKPOINTS[GRID_BREAKPOINTS.length - 1];
}

// ── Reflow logic ────────────────────────────────────────────

/**
 * Reflow a desktop-sized layout into the given number of columns.
 *
 * Strategy:
 * - Clamp each widget's `w` to fit within `newCols` (respecting minW from definitions)
 * - Reset `x` to 0 (let compact-vertical re-stack everything)
 * - Preserve relative order (KPIs first, then charts, same as array order)
 *
 * This produces a "linearized" layout that the grid's vertical compaction
 * will then arrange optimally.
 */
export function reflowLayout(
  layout: KtdGridLayout,
  newCols: number,
): KtdGridLayout {
  let currentX = 0;
  let currentY = 0;
  let rowMaxH = 0;

  return layout.map(item => {
    const def = getWidgetDefinition(item.id);

    // Clamp width: at most newCols, at least minW (but never more than newCols)
    const minW = def ? Math.min(def.minW, newCols) : 1;
    const maxW = def?.maxW ? Math.min(def.maxW, newCols) : newCols;
    let w = Math.min(item.w, newCols);
    w = Math.max(w, minW);
    w = Math.min(w, maxW);

    // If item doesn't fit on current row, move to next row
    if (currentX + w > newCols) {
      currentX = 0;
      currentY += rowMaxH;
      rowMaxH = 0;
    }

    const reflowed = {
      ...item,
      x: currentX,
      y: currentY,
      w,
      minW,
      maxW: maxW,
      minH: def?.minH ?? item.minH,
      maxH: def?.maxH ?? item.maxH,
    };

    currentX += w;
    rowMaxH = Math.max(rowMaxH, item.h);

    return reflowed;
  });
}
