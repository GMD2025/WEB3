import type {
  Card,
  Color,
  BotDifficulty,
  BotGameState,
  BotAction,
  WorkerMessage,
  WorkerResponse,
} from "../types/gameTypes";

class UnoBot {
  private difficulty: BotDifficulty = "medium";

  constructor(difficulty: BotDifficulty = "medium") {
    this.difficulty = difficulty;
  }

  makeMove(gameState: BotGameState): BotAction {
    const {
      hand,
      currentCard,
      currentColor,
      playersHandSizes,
      botPlayerIndex,
    } = gameState;

    const unoFailureAccusion = this.checkUnoFailure(gameState);
    if (unoFailureAccusion) {
      return unoFailureAccusion;
    }

    if (hand.length === 2) {
      return { type: "sayUno" };
    }

    const playableCards = this.findPlayableCards(
      hand,
      currentCard,
      currentColor,
    );

    if (playableCards.length === 0) {
      return { type: "draw" };
    }

    const cardChoice = this.chooseCard(playableCards, gameState);
    const cardIndex = hand.indexOf(cardChoice.card);

    return {
      type: "play",
      cardIndex,
      namedColor: cardChoice.namedColor,
    };
  }

  private checkUnoFailure(gameState: BotGameState): BotAction | null {
    const { playersHandSizes, botPlayerIndex, playerCount } = gameState;

    const prevPlayerIndex = (botPlayerIndex - 1 + playerCount) % playerCount;

    if (playersHandSizes[prevPlayerIndex] === 1) {
      const catchChance =
        this.difficulty === "easy"
          ? 0.3
          : this.difficulty === "medium"
            ? 0.7
            : 0.9;

      if (Math.random() < catchChance) {
        return {
          type: "catchUnoFailure",
          accused: prevPlayerIndex,
        };
      }
    }

    return null;
  }

  private findPlayableCards(
    hand: Card[],
    currentCard: Card,
    currentColor?: Color,
  ): Card[] {
    return hand.filter((card) =>
      this.canPlayCard(card, currentCard, currentColor),
    );
  }

  private canPlayCard(
    card: Card,
    currentCard: Card,
    currentColor?: Color,
  ): boolean {
    // Wild cards can always be played
    if (card.type === "WILD" || card.type === "WILD DRAW") {
      return true;
    }

    // color match
    if (
      "color" in card &&
      "color" in currentCard &&
      card.color === currentCard.color
    ) {
      return true;
    }

    // current color for wild cards
    if ("color" in card && currentColor && card.color === currentColor) {
      return true;
    }

    if (card.type === currentCard.type) {
      return true;
    }

    if (
      card.type === "NUMBERED" &&
      currentCard.type === "NUMBERED" &&
      "number" in card &&
      "number" in currentCard &&
      card.number === currentCard.number
    ) {
      return true;
    }

    return false;
  }

  private chooseCard(
    playableCards: Card[],
    gameState: BotGameState,
  ): { card: Card; namedColor?: Color } {
    const { hand, playersHandSizes, botPlayerIndex } = gameState;

    switch (this.difficulty) {
      case "easy":
        return this.chooseCardEasy(playableCards);
      case "medium":
        return this.chooseCardMedium(playableCards, gameState);
      case "hard":
        return this.chooseCardHard(playableCards, gameState);
      default:
        return this.chooseCardMedium(playableCards, gameState);
    }
  }

  private chooseCardEasy(playableCards: Card[]): {
    card: Card;
    namedColor?: Color;
  } {
    // easy bot
    const card =
      playableCards[Math.floor(Math.random() * playableCards.length)]!;
    const namedColor = this.isWild(card) ? this.getRandomColor() : undefined;
    return { card, namedColor };
  }

  private chooseCardMedium(
    playableCards: Card[],
    gameState: BotGameState,
  ): { card: Card; namedColor?: Color } {
    const { hand } = gameState;

    // Medium bot has some strategy:
    // 1. Prefer action cards if available
    // 2. Save wild cards for later unless necessary
    // 3. Choose color based on hand composition

    // Separate cards by type
    const actionCards = playableCards.filter(
      (card) =>
        card.type === "SKIP" || card.type === "REVERSE" || card.type === "DRAW",
    );
    const numberedCards = playableCards.filter(
      (card) => card.type === "NUMBERED",
    );
    const wildCards = playableCards.filter(
      (card) => card.type === "WILD" || card.type === "WILD DRAW",
    );

    let chosenCard: Card;

    // Prefer action cards, then numbered, then wild
    if (actionCards.length > 0) {
      chosenCard = actionCards[Math.floor(Math.random() * actionCards.length)]!;
    } else if (numberedCards.length > 0) {
      chosenCard =
        numberedCards[Math.floor(Math.random() * numberedCards.length)]!;
    } else {
      chosenCard = wildCards[Math.floor(Math.random() * wildCards.length)]!;
    }

    const namedColor = this.isWild(chosenCard)
      ? this.chooseBestColor(hand)
      : undefined;
    return { card: chosenCard, namedColor };
  }

  private chooseCardHard(
    playableCards: Card[],
    gameState: BotGameState,
  ): { card: Card; namedColor?: Color } {
    const { hand, playersHandSizes, botPlayerIndex } = gameState;

    // Hard bot is strategic:
    // 1. Use action cards strategically
    // 2. Optimize wild card usage
    // 3. Choose colors to maximize future plays
    // 4. Consider other players' hand sizes

    const nextPlayerIndex = (botPlayerIndex + 1) % playersHandSizes.length;
    const nextPlayerHandSize = playersHandSizes[nextPlayerIndex];

    if (nextPlayerHandSize && nextPlayerHandSize <= 2) {
      const skipCards = playableCards.filter((card) => card.type === "SKIP");
      const drawCards = playableCards.filter(
        (card) => card.type === "DRAW" || card.type === "WILD DRAW",
      );

      if (skipCards.length > 0) {
        const card = skipCards[0]!;
        return { card };
      }
      if (drawCards.length > 0) {
        const card = drawCards[0]!;
        const namedColor = this.isWild(card)
          ? this.chooseBestColor(hand)
          : undefined;
        return { card, namedColor };
      }
    }

    return this.chooseOptimalCard(playableCards, hand);
  }

  private chooseOptimalCard(
    playableCards: Card[],
    hand: Card[],
  ): { card: Card; namedColor?: Color } {
    let bestCard = playableCards[0]!;
    let bestScore = -1;

    for (const card of playableCards) {
      let score = 0;

      score += this.getCardScore(card);

      if ("color" in card) {
        const colorCount = hand.filter(
          (h) => "color" in h && h.color === card.color,
        ).length;
        score += colorCount * 10;
      }

      if (this.isWild(card)) {
        score -= 30;
      }

      if (score > bestScore) {
        bestScore = score;
        bestCard = card;
      }
    }

    const namedColor = this.isWild(bestCard)
      ? this.chooseBestColor(hand)
      : undefined;
    return { card: bestCard, namedColor };
  }

  private getCardScore(card: Card): number {
    switch (card.type) {
      case "NUMBERED":
        return "number" in card ? card.number : 0;
      case "SKIP":
      case "REVERSE":
      case "DRAW":
        return 20;
      case "WILD":
      case "WILD DRAW":
        return 50;
      default:
        return 0;
    }
  }

  private isWild(card: Card): boolean {
    return card.type === "WILD" || card.type === "WILD DRAW";
  }

  private chooseBestColor(hand: Card[]): Color {
    const colorCounts: Record<Color, number> = {
      RED: 0,
      YELLOW: 0,
      GREEN: 0,
      BLUE: 0,
    };

    hand.forEach((card) => {
      if ("color" in card) {
        colorCounts[card.color]++;
      }
    });

    return Object.entries(colorCounts).reduce((a, b) =>
      colorCounts[a[0] as Color] > colorCounts[b[0] as Color] ? a : b,
    )[0] as Color;
  }

  private getRandomColor(): Color {
    const colors: Color[] = ["RED", "YELLOW", "GREEN", "BLUE"];
    return colors[Math.floor(Math.random() * colors.length)]!;
  }
}

let bot = new UnoBot();

self.onmessage = function (e: MessageEvent<WorkerMessage>) {
  const { type, gameState, difficulty } = e.data;

  if (type === "updateState" && difficulty) {
    bot = new UnoBot(difficulty);
    self.postMessage({ type: "ready" } as WorkerResponse);
    return;
  }

  if (type === "makeMove" && gameState) {
    try {
      const action = bot.makeMove(gameState);
      self.postMessage({ type: "action", action } as WorkerResponse);
    } catch (error) {
      console.error("Bot error:", error);
      self.postMessage({
        type: "action",
        action: { type: "draw" },
      } as WorkerResponse);
    }
  }
};
