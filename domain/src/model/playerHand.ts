import { Card, isANumberCard, NumberCard } from "./card";

export interface PlayerHandInterface {
  cards: Card[];
  addCard(card: Card): void;
  removeCard(card: Card): boolean;
  hasCard(card: Card): boolean;
  getCards(): Card[];
}

export class PlayerHand implements PlayerHandInterface {
  cards: Card[] = [];

  addCard(card: Card): void {
    this.cards.push(card);
  }

  removeCard(card: Card): boolean {
    const index = this.cards.findIndex((c) => compareCards(c, card));
    if (index !== -1) {
      this.cards.splice(index, 1);
      return true;
    }
    return false;
  }

  hasCard(card: Card): boolean {
    return this.cards.some((c) => compareCards(c, card));
  }

  getCards(): Card[] {
    return [...this.cards];
  }

  get size(): number {
    return this.cards.length;
  }
}

function compareCards(a: Card, b: Card): boolean {
  return (
    a.color === b.color &&
    a.type === b.type &&
    (!isANumberCard(a) || (isANumberCard(b) && a.number === b.number))
  );
}
