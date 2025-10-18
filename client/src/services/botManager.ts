import type {
  BotDifficulty,
  BotGameState,
  BotAction,
  WorkerMessage,
  WorkerResponse,
  Color,
} from "../types/gameTypes";

export interface BotPlayer {
  id: string;
  name: string;
  difficulty: BotDifficulty;
  playerIndex: number;
}

export class BotManager {
  private workers = new Map<string, Worker>();
  private pendingCallbacks = new Map<string, (action: BotAction) => void>();

  createBot(bot: BotPlayer): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const worker = new Worker(
          new URL("../workers/botWorker.ts", import.meta.url),
          {
            type: "module",
          },
        );

        worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
          const { type, action } = e.data;

          if (type === "ready") {
            console.log(`Bot ${bot.id} initialized successfully`);
            resolve();
            return;
          }

          if (type === "action" && action) {
            const callback = this.pendingCallbacks.get(bot.id);
            if (callback) {
              callback(action);
              this.pendingCallbacks.delete(bot.id);
            }
          }
        };

        worker.onerror = (error) => {
          console.error(`Bot worker error for ${bot.id}:`, error);
          reject(new Error(`Failed to create bot worker: ${error.message}`));
        };

        this.workers.set(bot.id, worker);

        worker.postMessage({
          type: "updateState",
          difficulty: bot.difficulty,
        } as WorkerMessage);

        setTimeout(() => {
          if (
            !this.workers.has(bot.id) ||
            this.workers.get(bot.id) !== worker
          ) {
            reject(new Error(`Bot ${bot.id} initialization timeout`));
          }
        }, 5000);
      } catch (error) {
        console.error(`Error creating bot ${bot.id}:`, error);
        reject(error);
      }
    });
  }

  async requestMove(
    botId: string,
    gameState: BotGameState,
  ): Promise<BotAction> {
    const worker = this.workers.get(botId);
    if (!worker) {
      console.warn(`Bot ${botId} not found, using fallback logic`);
      return this.fallbackBotMove(gameState);
    }

    return new Promise((resolve) => {
      this.pendingCallbacks.set(botId, resolve);

      worker.postMessage({
        type: "makeMove",
        gameState,
      } as WorkerMessage);

      setTimeout(() => {
        if (this.pendingCallbacks.has(botId)) {
          this.pendingCallbacks.delete(botId);
          console.warn(`Bot ${botId} timeout, using fallback`);
          resolve(this.fallbackBotMove(gameState));
        }
      }, 2000);
    });
  }

  private fallbackBotMove(gameState: BotGameState): BotAction {
    console.log("Using fallback bot logic");

    const { hand, currentCard, currentColor } = gameState;

    for (let i = 0; i < hand.length; i++) {
      const card = hand[i];
      if (card && this.canPlayCardFallback(card, currentCard, currentColor)) {
        const namedColor =
          card.type === "WILD" || card.type === "WILD DRAW"
            ? (this.getRandomColorFallback() as Color)
            : undefined;
        return { type: "play", cardIndex: i, namedColor };
      }
    }

    return { type: "draw" };
  }

  private canPlayCardFallback(
    card: any,
    currentCard: any,
    currentColor?: string,
  ): boolean {
    if (card.type === "WILD" || card.type === "WILD DRAW") {
      return true;
    }

    if (card.color && currentCard.color && card.color === currentCard.color) {
      return true;
    }

    if (card.color && currentColor && card.color === currentColor) {
      return true;
    }

    if (card.type === currentCard.type) {
      return true;
    }

    if (
      card.type === "NUMBERED" &&
      currentCard.type === "NUMBERED" &&
      card.number === currentCard.number
    ) {
      return true;
    }

    return false;
  }

  private getRandomColorFallback(): string {
    const colors = ["RED", "YELLOW", "GREEN", "BLUE"];
    return colors[Math.floor(Math.random() * colors.length)]!;
  }

  updateBotDifficulty(botId: string, difficulty: BotDifficulty): void {
    const worker = this.workers.get(botId);
    if (worker) {
      worker.postMessage({
        type: "updateState",
        difficulty,
      } as WorkerMessage);
    }
  }

  destroyBot(botId: string): void {
    const worker = this.workers.get(botId);
    if (worker) {
      worker.terminate();
      this.workers.delete(botId);
      this.pendingCallbacks.delete(botId);
    }
  }

  destroyAllBots(): void {
    for (const [botId] of this.workers) {
      this.destroyBot(botId);
    }
  }
}

export const botManager = new BotManager();
