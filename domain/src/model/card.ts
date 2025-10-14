export type Color = "RED" | "YELLOW" | "GREEN" | "BLUE";

export type Type =
  | "NUMBERED"
  | "SKIP"
  | "REVERSE"
  | "DRAW"
  | "WILD"
  | "WILD DRAW";

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

export const colors: readonly Color[] = [
  "RED",
  "YELLOW",
  "GREEN",
  "BLUE",
] as const;
