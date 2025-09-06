export enum CardColor {
    Red = "Red",
    Yellow = "Yellow",
    Green = "Green",
    Blue = "Blue",
    Wild = "Wild",
}

export enum CardType {
    Number = "Number",
    Skip = "Skip",
    Reverse = "Reverse",
    DrawTwo = "DrawTwo",
    Wild = "Wild",
    WildDrawFour = "WildDrawFour",
}

export interface Card {
    readonly color: CardColor;
    readonly type: CardType;
}

export interface NumberCard extends Card {
    readonly type: CardType.Number;
    readonly number: number;
}

export interface ActionCard extends Card {
    readonly type: CardType.Skip | CardType.Reverse | CardType.DrawTwo;
}

export interface WildCard extends Card {
    readonly type: CardType.Wild | CardType.WildDrawFour;
}


export function createNumberCard(color: CardColor, number: number): NumberCard {
    return {
        color,
        type: CardType.Number,
        number
    };
}


export function createActionCard(
    color: CardColor,
    type: ActionCard["type"]
): ActionCard {
    return {
        color,
        type
    };
}


export function createWildCard(type: WildCard["type"]): WildCard {
    return {
        color: CardColor.Wild,
        type
    };
}
