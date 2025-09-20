export enum CardColor {
  Red = "RED",
  Yellow = "YELLOW",
  Green = "GREEN",
  Blue = "BLUE",
  Wild = "WILD",
}

export enum CardType {
  Number = "NUMBERED",
  Skip = "SKIP",
  Reverse = "REVERSE",
  DrawTwo = "DRAW",
  Wild = "WILD",
  WildDrawFour = "WILD DRAW",
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
  chosenColor?: CardColor | undefined;
}

export function createNumberCard(color: CardColor, number: number): NumberCard {
  return {
    color,
    type: CardType.Number,
    number,
  };
}

export function createActionCard(
  color: CardColor,
  type: ActionCard["type"]
): ActionCard {
  return {
    color,
    type,
  };
}

export function createWildCard(type: WildCard["type"]): WildCard {
  return {
    color: CardColor.Wild,
    type,
  };
}

export function isANumberCard(card: Card): card is NumberCard {
  return card.type === CardType.Number && "number" in card;
}
