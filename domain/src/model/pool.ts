import { standardShuffler } from '../utils/random_utils';
import * as card from './card';

export interface Pool {
    cards: card.Card[];
}

export function createCardPool(): Pool {
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

    standardShuffler<card.Card>(cards);
    return { cards };
}

