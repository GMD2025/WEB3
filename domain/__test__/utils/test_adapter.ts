import {
  Randomizer,
  Shuffler,
  standardRandomizer,
  standardShuffler,
} from "../../src/utils/random_utils";

// import { Game } from '../../src/model/game'
interface DeckAdapter extends deck.DeckInterface {
  deal(): card.Card | undefined;
  filter(predicate: (card: card.Card) => boolean): Deck;
  size: number;
}

export class Deck extends deck.Deck implements DeckAdapter {
  deal() {
    return this.drawCard();
  }
  filter(predicate: (card: card.Card) => boolean): Deck {
    return new Deck(this.cards.filter(predicate));
  }
  get size() {
    return this.cards.length;
  }
}
export type Card = card.Card;
export type Round = round.Round;

import * as deck from "../../src/model/deck";
import * as round from "../../src/model/round";
import * as card from "../../src/model/card";

export function createInitialDeck(): Deck {
  return new Deck();
}

export function createDeckFromMemento(
  cards: Record<string, string | number>[]
): Deck {
  throw new Error("Function not implemented.");
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
  return new round.Round(players.length);
}

export function createRoundFromMemento(
  memento: any,
  shuffler: Shuffler<Card> = standardShuffler
): Round {
  throw new Error("Function not implemented.");
}

export type GameConfig = {
  players: string[];
  targetScore: number;
  randomizer: Randomizer;
  shuffler: Shuffler<Card>;
  cardsPerPlayer: number;
};

// export function createGame(props: Partial<GameConfig>): Game {
//   throw new Error("Function not implemented.");
// }

// export function createGameFromMemento(
//   memento: any,
//   randomizer: Randomizer = standardRandomizer,
//   shuffler: Shuffler<Card> = standardShuffler
// ): Game {
//   throw new Error("Function not implemented.");
// }
