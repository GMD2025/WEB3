// Shared types for the game to avoid import issues in workers
export type Color = "RED" | "YELLOW" | "GREEN" | "BLUE";

export type Numbered = {
  readonly type: "NUMBERED";
  readonly color: Color;
  readonly number: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
};

export type ColoredAction =
  | { readonly type: "SKIP"; readonly color: Color }
  | { readonly type: "REVERSE"; readonly color: Color }
  | { readonly type: "DRAW"; readonly color: Color };

export type Wild = { readonly type: "WILD" } | { readonly type: "WILD DRAW" };

export type Card = Numbered | ColoredAction | Wild;

export type BotDifficulty = "easy" | "medium" | "hard";

export interface BotGameState {
  hand: Card[];
  currentCard: Card;
  currentColor?: Color;
  playerCount: number;
  playersHandSizes: number[];
  currentPlayerIndex: number;
  botPlayerIndex: number;
  canPlay: boolean;
  drawPileSize: number;
}

export interface BotAction {
  type: "play" | "draw" | "sayUno" | "catchUnoFailure";
  cardIndex?: number;
  namedColor?: Color;
  accused?: number;
}

export interface WorkerMessage {
  type: "makeMove" | "updateState";
  gameState?: BotGameState;
  difficulty?: BotDifficulty;
}

export interface WorkerResponse {
  type: "action" | "ready";
  action?: BotAction;
}
