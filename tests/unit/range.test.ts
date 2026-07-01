import { describe, it, expect } from 'vitest';
import { range } from '../../src/plugin-pip/components/streams/utils';

describe('range', () => {
  it('returns the half-open interval [start, end)', () => {
    expect(range(0, 3)).toEqual([0, 1, 2]);
    expect(range(2, 5)).toEqual([2, 3, 4]);
  });

  it('returns an empty array when start >= end', () => {
    expect(range(3, 3)).toEqual([]);
    expect(range(5, 2)).toEqual([]);
  });

  it('supports negative starts', () => {
    expect(range(-2, 1)).toEqual([-2, -1, 0]);
  });
});
