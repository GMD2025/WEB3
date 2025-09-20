import {
  Randomizer,
  Shuffler,
  standardRandomizer,
  standardShuffler,
} from "../../src/utils/random_utils";

import { Game } from "../../src/model/game";
import { Round } from "../../src/model/round";

import * as deck from "../../src/model/deck";
import * as card from "../../src/model/card";
import { Card } from "../../src/model/card";

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

class RoundAdapter extends Round {
  canPlay(number: number): boolean {
    return super.isLegalPlay(card.createNumberCard(card.CardColor.Red, number));
  }
  play(number: number, color: card.CardColor): boolean {
    if (!this.canPlay(number)) return false;
    return super.playCard(
      this.currentPlayer,
      card.createNumberCard(color, number)
    );
  }
}

export function createRound({
  players,
  dealer,
  cardsPerPlayer = 7,
}: HandConfig): RoundAdapter {
  return new RoundAdapter(players.length);
}

export function createRoundFromMemento(
  memento: any,
  shuffler?: Shuffler<Card>
): Round {
  const round: RoundAdapter = new RoundAdapter();
  round.restoreMemento(memento);
  return round;
}

export type GameConfig = {
  players: string[];
  targetScore: number;
  randomizer: Randomizer;
  shuffler: Shuffler<Card>;
  cardsPerPlayer: number;
};

export function createGame(props: Partial<GameConfig>): Game {
  throw new Error("Function not implemented.");
}

export function createGameFromMemento(
  memento: any,
  randomizer: Randomizer = standardRandomizer,
  shuffler: Shuffler<Card> = standardShuffler
): Game {
  throw new Error("Function not implemented.");
}
