import { Shuffler } from "../utils/random_utils";
import { Card, Color, Type } from "./card";

export type { Card, Color, Type } from "./card";

export const colors: Readonly<Color[]> = [
  "RED",
  "YELLOW",
  "GREEN",
  "BLUE",
] as const;
export const types: Readonly<Type[]> = [
  "NUMBERED",
  "SKIP",
  "REVERSE",
  "DRAW",
  "WILD",
  "WILD DRAW",
] as const;

export type Deck = {
  readonly size: number;
  filter(pred: (card: Card) => boolean): Deck;
  deal(): Card | undefined;
  shuffle(shuffler: Shuffler<Card>): void;
  fromMemento(cards: Record<string, string | number>[]): Deck;
  toMemento(): Record<string, string | number>[];
  top(): Card | undefined;
  draw(count: number): Card[] | undefined;
  peek(): Card | undefined;
  addTop(card: Card): void;
};

export class ArrayDeck implements Deck {
  private cards: Card[];
  constructor(cards: Card[] = []) {
    this.cards = [...cards];
  }

  get size(): number {
    return this.cards.length;
  }

  top(): Card | undefined {
    return this.cards[0];
  }

  addTop(card: Card): void {
    this.cards.unshift(card);
  }

  peek(): Card | undefined {
    return this.cards[0];
  }

  draw(count: number) {
    const arraycards: Card[] = [];
    for (let i = 0; i < count; i++) {
      const card = this.cards.shift();
      if (card) {
        arraycards.push(card);
      }
    }
    return arraycards;
  }

  filter(pred: (card: Card) => boolean): Deck {
    return new ArrayDeck(this.cards.filter(pred));
  }

  deal(): Card | undefined {
    return this.cards.shift();
  }

  shuffle(shuffler: Shuffler<Card>): void {
    shuffler(this.cards);
  }

  fromMemento(cards: Record<string, string | number>[]): Deck {
    const newCards: Card[] = [];
    for (const card of cards) {
      if (typeof card.type !== "string" || !types.includes(card.type as Type)) {
        throw new Error(`Invalid card type: ${card.type}`);
      }
      if (
        card.type === "NUMBERED" &&
        (typeof card.color !== "string" ||
          !colors.includes(card.color as Color) ||
          typeof card.number !== "number" ||
          card.number < 0 ||
          card.number > 9)
      ) {
        throw new Error(`Invalid NUMBERED card: ${JSON.stringify(card)}`);
      }
      if (
        card.type === "SKIP" &&
        (typeof card.color !== "string" ||
          !colors.includes(card.color as Color))
      ) {
        throw new Error(`Invalid SKIP card: ${JSON.stringify(card)}`);
      }
      if (
        card.type === "REVERSE" &&
        (typeof card.color !== "string" ||
          !colors.includes(card.color as Color))
      ) {
        throw new Error(`Invalid REVERSE card: ${JSON.stringify(card)}`);
      }
      if (
        card.type === "DRAW" &&
        (typeof card.color !== "string" ||
          !colors.includes(card.color as Color))
      ) {
        throw new Error(`Invalid DRAW card: ${JSON.stringify(card)}`);
      }
      newCards.push(card as Card);
    }
    return new ArrayDeck(newCards);
  }

  toMemento(): Record<string, string | number>[] {
    return this.cards.map((card) => ({ ...card }));
  }
}

export function hasColor(card: Card, color: Color): boolean {
  return "color" in card && card.color === color;
}

export function hasNumber(card: Card, number: number): boolean {
  return card.type === "NUMBERED" && card.number === number;
}

export function buildStandardDeck(): Card[] {
  const cards: Card[] = [];

  for (const color of colors) {
    cards.push({ type: "NUMBERED", color, number: 0 });
    for (const n of [1, 2, 3, 4, 5, 6, 7, 8, 9] as const) {
      cards.push({ type: "NUMBERED", color, number: n });
      cards.push({ type: "NUMBERED", color, number: n });
    }
  }

  for (const color of colors) {
    cards.push({ type: "SKIP", color }, { type: "SKIP", color });
    cards.push({ type: "REVERSE", color }, { type: "REVERSE", color });
    cards.push({ type: "DRAW", color }, { type: "DRAW", color });
  }

  for (let i = 0; i < 4; i++) {
    cards.push({ type: "WILD" });
    cards.push({ type: "WILD DRAW" });
  }

  return cards;
}

export function createFullDeck(): Deck {
  return new ArrayDeck(buildStandardDeck());
}

export function createFromMemento(
  cards: Record<string, string | number>[]
): Deck {
  return new ArrayDeck().fromMemento(cards);
}
