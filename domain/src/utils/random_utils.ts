// A function that returns a (possibly) random number from 0 to bound - 1
export type Randomizer = (bound: number) => number

// Uniformly selected pseudo-random number
export const standardRandomizer: Randomizer = n => Math.floor(Math.random() * n)

// A function that shuffles the given array
export type Shuffler<T> = (ts: T[]) => T[]

// Perfect shuffle using the Fisher-Yates method
export function standardShuffler<T>(randomizer: Randomizer, ts: T[]): T[] {
  const copy = [...ts]
  for(let i = 0; i < copy.length - 1; i++) {
    const j = randomizer(copy.length - i) + i
    const temp = copy[j]
    copy[j] = copy[i]
    copy[i] = temp
  }
  return copy
}
