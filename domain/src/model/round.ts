import { Card, CardColor, CardType, isANumberCard, WildCard } from "./card";
import { PlayerHand } from "./playerHand";
import { Deck } from "./deck";

export class RoundMemento {
  hands: { cards: Card[]; unoed: boolean }[];
  deck: Card[];
  discardPile: Card[];
  currentPlayer: number;
  direction: direction;
  constructor(
    hands: { cards: Card[]; unoed: boolean }[],
    deck: Card[],
    discardPile: Card[],
    currentPlayer: number,
    direction: direction
  ) {
    this.hands = hands.map((h) => ({ cards: [...h.cards], unoed: h.unoed }));
    this.deck = [...deck];
    this.discardPile = [...discardPile];
    this.currentPlayer = currentPlayer;
    this.direction = direction;
  }
}

export enum direction {
  Clockwise = 1,
  CounterClockwise = -1,
}

export interface RoundInterface {
  hands: { playerHand: PlayerHand; unoed: boolean }[];
  deck: Deck;
  discardPile: Card[];
  currentPlayer: number;
  direction: direction;
  playCard(playerIndex: number, card: Card): boolean;
  drawCard(playerIndex: number): Card | null;
  nextPlayer(): void;
  isLegalPlay(card: Card): boolean;

  createMemento(): RoundMemento;
  restoreMemento(memento: RoundMemento): void;
}

export class Round implements RoundInterface {
  hands: { playerHand: PlayerHand; unoed: boolean }[];
  deck: Deck;
  discardPile: Card[] = [];
  currentPlayer: number = 0;
  direction: direction = direction.Clockwise;

  createMemento(): RoundMemento {
    return new RoundMemento(
      this.hands.map((h) => ({
        cards: h.playerHand.getCards(),
        unoed: h.unoed,
      })),
      [...this.deck.cards],
      [...this.discardPile],
      this.currentPlayer,
      this.direction
    );
  }

  restoreMemento(memento: RoundMemento): void {
    this.hands.forEach((h, i) => {
      h.playerHand.cards = [...memento.hands[i].cards];
      h.unoed = memento.hands[i].unoed;
    });
    this.deck.cards = [...memento.deck];
    this.discardPile = [...memento.discardPile];
    this.currentPlayer = memento.currentPlayer;
    this.direction = memento.direction;
  }

  constructor(numberOfPlayers: number = 0) {
    this.hands = Array.from({ length: numberOfPlayers }, () => ({
      playerHand: new PlayerHand(),
      unoed: false,
    }));
    this.deck = new Deck();

    const firstCard = this.deck.drawCard();
    if (firstCard) this.discardPile.push(firstCard);
  }

  playCard(playerIndex: number, card: Card): boolean {
    if (playerIndex !== this.currentPlayer) return false;
    if (!this.isLegalPlay(card)) return false;
    if (!this.hands[playerIndex].playerHand.removeCard(card)) return false;

    this.discardPile.push(card);

    this.handleCardEffect(card);
    this.nextPlayer();
    return true;
  }

  callUno(playerIndex: number): void {
    const hand = this.hands[playerIndex];
    if (hand.playerHand.size === 1) {
      hand.unoed = true;
      return;
    }
    for (let i = 0; i < 2; i++) {
      this.drawCard(playerIndex);
    }
  }

  drawCard(playerIndex: number): Card | null {
    if (playerIndex !== this.currentPlayer) return null;
    const card = this.deck.drawCard();
    this.nextPlayer();
    if (card) {
      this.hands[playerIndex].playerHand.addCard(card);
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
    if (card.color === CardColor.Wild) return true;

    const top = this.discardPile[this.discardPile.length - 1];
    if (card.color === top.color) return true;
    if (card.type === top.type && !isANumberCard(card)) return true;
    if (isANumberCard(card) && isANumberCard(top) && card.number === top.number)
      return true;

    return false;
  }

  private handleCardEffect(card: Card): void {
    switch (card.type) {
      case CardType.Reverse:
        this.direction =
          this.direction === direction.Clockwise
            ? direction.CounterClockwise
            : direction.Clockwise;
        break;
      case CardType.Skip:
        this.nextPlayer();
        break;
      case CardType.DrawTwo:
        this.nextPlayer();
        const nextHand = this.hands[this.currentPlayer];
        for (let i = 0; i < 2; i++) {
          const drawn = this.deck.drawCard();
          if (drawn) nextHand.playerHand.addCard(drawn);
        }
        break;
      case CardType.WildDrawFour:
        this.nextPlayer();
        const nextHand4 = this.hands[this.currentPlayer];
        for (let i = 0; i < 4; i++) {
          const drawn = this.deck.drawCard();
          if (drawn) nextHand4.playerHand.addCard(drawn);
        }
        break;
    }
  }
}
