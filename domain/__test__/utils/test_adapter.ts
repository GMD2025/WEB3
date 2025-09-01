import { Randomizer, Shuffler, standardRandomizer, standardShuffler } from '../../src/utils/random_utils'

// Fix (or import) these types:
type Card = any
type Deck = any
type Round = any
type Game = any

//Fill out the empty functions
export function createInitialDeck(): Deck {
}

export function createDeckFromMemento(cards: Record<string, string | number>[]): Deck {
}

export type HandConfig = {
  players: string[]
  dealer: number
  shuffler?: Shuffler<Card>
  cardsPerPlayer?: number
}

export function createRound({
    players, 
    dealer, 
    shuffler = standardShuffler,
    cardsPerPlayer = 7
  }: HandConfig): Round {
}

export function createRoundFromMemento(memento: any, shuffler: Shuffler<Card> = standardShuffler): Round {
}

export type GameConfig = {
  players: string[]
  targetScore: number
  randomizer: Randomizer
  shuffler: Shuffler<Card>
  cardsPerPlayer: number
}

export function createGame(props: Partial<GameConfig>): Game {
}

export function createGameFromMemento(memento: any, randomizer: Randomizer = standardRandomizer, shuffler: Shuffler<Card> = standardShuffler): Game {
}
