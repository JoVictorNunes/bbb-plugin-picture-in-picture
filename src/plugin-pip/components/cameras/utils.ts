export function range(start: number, end: number): number[] {
  const result: number[] = [];
  for (let i = start; i < end; i += 1) {
    result.push(i);
  }
  return result;
}
