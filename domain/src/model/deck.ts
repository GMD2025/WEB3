import {
  Shuffler,
  standardRandomizer,
  standardShuffler,
} from "../utils/random_utils";
import * as card from "./card";

export interface DeckInterface {
  cards: card.Card[];
  drawCard(): card.Card | undefined;
}

export class Deck implements DeckInterface {
  cards: card.Card[];

  constructor(pool?: card.Card[]) {
    this.cards = pool ? pool : createFullCardPool();
  }

  drawCard(): card.Card | undefined {
    return this.cards.shift();
  }

  get size(): number {
    return this.cards.length;
  }

  shuffle(shuffler?: Shuffler<card.Card>): void {
    this.cards = shuffler
      ? shuffler(this.cards)
      : standardShuffler(standardRandomizer, this.cards);
  }
}

function createFullCardPool(): card.Card[] {
  const cards: card.Card[] = [];

  for (const color of Object.values(card.CardColor)) {
    if (color === card.CardColor.Wild) continue;

    for (let number = 0; number < 10; number++) {
      cards.push(card.createNumberCard(color, number));
      if (number == 0) continue;
      cards.push(card.createNumberCard(color, number));
    }

    for (let i = 0; i < 2; i++) {
      cards.push(card.createActionCard(color, card.CardType.Skip));
      cards.push(card.createActionCard(color, card.CardType.Reverse));
      cards.push(card.createActionCard(color, card.CardType.DrawTwo));
    }
  }

  for (let i = 0; i < 4; i++) {
    cards.push(card.createWildCard(card.CardType.Wild));
    cards.push(card.createWildCard(card.CardType.WildDrawFour));
  }

  standardShuffler(standardRandomizer, cards);
  return cards;
}

// jesus christ just for the sake of tests. They are ... ugh. not flexible.
export const colors = [
  card.CardColor.Red,
  card.CardColor.Yellow,
  card.CardColor.Green,
  card.CardColor.Blue,
];
