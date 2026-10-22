import { normalize } from "./normalize.js";

export function resolveLine(start, end) {
  const rowDelta = end.row - start.row;
  const colDelta = end.col - start.col;
  if (rowDelta !== 0 && colDelta !== 0 && Math.abs(rowDelta) !== Math.abs(colDelta)) return null;
  const steps = Math.max(Math.abs(rowDelta), Math.abs(colDelta));
  const rowStep = Math.sign(rowDelta);
  const colStep = Math.sign(colDelta);
  return Array.from({ length: steps + 1 }, (_, index) => ({
    row: start.row + rowStep * index,
    col: start.col + colStep * index
  }));
}

export function matchSelection(grid, targets, start, end) {
  const cells = resolveLine(start, end);
  if (!cells || cells.some(({ row, col }) => !grid[row] || grid[row][col] === undefined)) return null;
  const letters = normalize(cells.map(({ row, col }) => grid[row][col]).join(""));
  const target = targets.find((item) => item.normalized === letters || item.normalized === [...letters].reverse().join(""));
  return target ? { target, cells, reversed: target.normalized !== letters } : null;
}
