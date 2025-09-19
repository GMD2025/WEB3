import * as card from "./card";
import { Pool, createCardPool } from "./pool";

export interface Deck {
  cards: card.Card[];
  drawCard(): card.Card | undefined;
}

export function createDeck(pool: Pool, number: number): Deck {
  const cards = pool.cards.slice(0, number);
  return {
    cards,
    drawCard() {
      return this.cards.shift();
    },
  };
}
