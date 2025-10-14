import {
  createFullDeck,
  createFromMemento,
  Card,
  Deck,
} from "../../src/model/deck";
import { createRoundClassFromMemento, Round } from "../../src/model/round";
import { RoundClass } from "../../src/model/round";
import { createUnoGame, createUnoGameFromMemento } from "../../src/model/uno";
import {
  Randomizer,
  Shuffler,
  standardRandomizer,
  standardShuffler,
} from "../../src/utils/random_utils";

type Game = any

export function createInitialDeck(): Deck {
  return createFullDeck();
}

export function createDeckFromMemento(
  cards: Record<string, string | number>[]
): Deck {
  return createFromMemento(cards);
}

export type HandConfig = {
  players: string[];
  dealer: number;
  shuffler?: Shuffler<Card>;
  cardsPerPlayer?: number;
};

export function createRound({
  players,
  dealer,
  shuffler = standardShuffler,
  cardsPerPlayer = 7,
}: HandConfig): Round {
  return new RoundClass(players, dealer, shuffler, cardsPerPlayer);
}

export function createRoundFromMemento(
  memento: any,
  shuffler: Shuffler<Card> = standardShuffler
): Round {
  return createRoundClassFromMemento(memento, shuffler);
}

export type GameConfig = {
  players: string[];
  targetScore: number;
  randomizer: Randomizer;
  shuffler: Shuffler<Card>;
  cardsPerPlayer: number;
};

export function createGame(props: Partial<GameConfig>): Game {
  return createUnoGame(
    props.players,
    props.targetScore,
    {
      randomizer: props.randomizer ?? standardRandomizer,
      shuffler: props.shuffler ?? standardShuffler,
      cardsPerPlayer: props.cardsPerPlayer ?? 7,
    }
  );
}

export function createGameFromMemento(
  memento: any,
  randomizer: Randomizer = standardRandomizer,
  shuffler: Shuffler<Card> = standardShuffler
): Game {
  return createUnoGameFromMemento(memento, { randomizer, shuffler })
}
