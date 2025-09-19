import { Card, isANumberCard } from "./card";
import { PlayerHand } from "./playerHand";
import { createDeck, Deck } from "./deck";

export enum direction {
  Clockwise = 1,
  CounterClockwise = -1,
}

export interface RoundInterface {
  hands: PlayerHand[];
  deck: Deck;
  discardPile: Card[];
  currentPlayer: number;
  direction: direction;
  playCard(playerIndex: number, card: Card): boolean;
  drawCard(playerIndex: number): Card | null;
  nextPlayer(): void;
  isLegalPlay(card: Card): boolean;
}

export class Round implements RoundInterface {
  hands: PlayerHand[];
  deck: Deck;
  discardPile: Card[] = [];
  currentPlayer: number = 0;
  direction: direction = direction.Clockwise;

  constructor(numberOfPlayers: number) {
    this.hands = Array.from(
      { length: numberOfPlayers },
      () => new PlayerHand()
    );
    this.deck = createDeck();

    const firstCard = this.deck.drawCard();
    if (firstCard) this.discardPile.push(firstCard);
  }

  playCard(playerIndex: number, card: Card): boolean {
    if (playerIndex !== this.currentPlayer) return false;
    if (!this.isLegalPlay(card)) return false;
    if (!this.hands[playerIndex].removeCard(card)) return false;

    this.discardPile.push(card);

    this.handleCardEffect(card);
    this.nextPlayer();
    return true;
  }

  drawCard(playerIndex: number): Card | null {
    if (playerIndex !== this.currentPlayer) return null;
    const card = this.deck.drawCard();
    this.nextPlayer();
    if (card) {
      this.hands[playerIndex].addCard(card);
      return card;
    } else {
      return null;
    }
  }

  nextPlayer(): void {
    this.currentPlayer =
      (this.currentPlayer + this.direction + this.hands.length) %
      this.hands.length;
  }

  isLegalPlay(card: Card): boolean {
    if (card.color === "Wild") return true;

    const top = this.discardPile[this.discardPile.length - 1];
    if (card.color === top.color) return true;
    if (card.type === top.type && !isANumberCard(card)) return true;
    if (isANumberCard(card) && isANumberCard(top) && card.number === top.number)
      return true;

    return false;
  }

  private handleCardEffect(card: Card): void {
    switch (card.type) {
      case "Reverse":
        this.direction =
          this.direction === direction.Clockwise
            ? direction.CounterClockwise
            : direction.Clockwise;
        break;
      case "Skip":
        this.nextPlayer();
        break;
      case "DrawTwo":
        this.nextPlayer();
        const nextHand = this.hands[this.currentPlayer];
        for (let i = 0; i < 2; i++) {
          const drawn = this.deck.drawCard();
          if (drawn) nextHand.addCard(drawn);
        }
        break;
      case "WildDrawFour":
        this.nextPlayer();
        const nextHand4 = this.hands[this.currentPlayer];
        for (let i = 0; i < 4; i++) {
          const drawn = this.deck.drawCard();
          if (drawn) nextHand4.addCard(drawn);
        }
        break;
      // TODO Wild color change
    }
  }
}
