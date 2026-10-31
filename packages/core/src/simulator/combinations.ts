/**
 * Generates all combinations of size k from an array.
 * Pure functional recursive combination generator.
 */
export function getCombinations<T>(array: T[], k: number): T[][] {
  if (k <= 0 || array.length < k) {
    return [];
  }
  if (k === 1) {
    return array.map((item) => [item]);
  }
  if (k === array.length) {
    return [array.slice()];
  }

  const head = array[0]!;
  const tail = array.slice(1);

  const withHead = getCombinations(tail, k - 1).map((combo) => [head, ...combo]);
  const withoutHead = getCombinations(tail, k);

  return [...withHead, ...withoutHead];
}
