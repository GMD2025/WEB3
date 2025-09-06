import * as card from "./card";
import { Pool, createCardPool } from "./pool";

export interface Deck {
    cards: card.Card[];
}

export function createDeck(pool: Pool, number: number): Deck {
    return { cards: pool.cards.slice(0, number) };
}
