import { describe, it, expect } from 'vitest';
import { calculateOptimalGrid, findOptimalGrid, ASPECT_RATIO } from '../../src/plugin-pip/components/streams/utils';

describe('calculateOptimalGrid', () => {
  it('fills a single cell to the full canvas at the 4:3 aspect ratio', () => {
    const grid = calculateOptimalGrid(400, 300, 0, ASPECT_RATIO, 1, 1);
    expect(grid).toEqual({
      columns: 1,
      rows: 1,
      width: 400,
      height: 300,
      filledArea: 120000,
    });
  });

  it('splits two items across two columns in a single row', () => {
    const grid = calculateOptimalGrid(400, 300, 0, ASPECT_RATIO, 2, 2);
    expect(grid).toEqual({
      columns: 2,
      rows: 1,
      width: 400,
      height: 150,
      filledArea: 60000,
    });
  });

  it('accounts for the gutter between columns and rows', () => {
    const grid = calculateOptimalGrid(400, 300, 10, ASPECT_RATIO, 4, 2);
    // 4 items in 2 columns -> 2 rows; the row height constraint shrinks the
    // cell so the grid fits: cellHeight=145, cellWidth=194.
    expect(grid).toEqual({
      columns: 2,
      rows: 2,
      width: 398,
      height: 300,
      filledArea: 194 * 145 * 4,
    });
  });
});

describe('findOptimalGrid', () => {
  it('returns a zeroed grid when there are no items', () => {
    expect(findOptimalGrid({ width: 400, height: 300 }, 0, 0)).toEqual({
      rows: 0,
      filledArea: 0,
      columns: 0,
      height: 0,
      width: 0,
    });
    expect(findOptimalGrid({ width: 400, height: 300 }, -1, 0)).toEqual({
      rows: 0,
      filledArea: 0,
      columns: 0,
      height: 0,
      width: 0,
    });
  });

  it('picks a single column for a single item in a non-focused grid', () => {
    const grid = findOptimalGrid({ width: 400, height: 300 }, 1, 0, false);
    expect(grid).toEqual({
      columns: 1,
      rows: 1,
      width: 400,
      height: 300,
      filledArea: 120000,
    });
  });

  it('treats a null gridRect as a zero-sized canvas', () => {
    const grid = findOptimalGrid(null, 2, 0, false);
    expect(grid.width).toBe(0);
    expect(grid.height).toBe(0);
    expect(grid.filledArea).toBe(0);
  });

  it('uses at least two columns and pads item count when content-focused', () => {
    const grid = findOptimalGrid({ width: 800, height: 600 }, 1, 0, true);
    expect(grid.columns).toBeGreaterThanOrEqual(2);
    expect(grid.filledArea).toBeGreaterThan(0);
  });
});
