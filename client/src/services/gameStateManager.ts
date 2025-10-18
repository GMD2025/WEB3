import { reactive, ref, computed } from "vue";
import { createUnoGame, type Game } from "@domain/model/uno";
import type { Round } from "@domain/model/round";
import type { Card, Color } from "@domain/model/card";
import { botManager, type BotPlayer } from "./botManager";
import type { BotGameState, BotAction } from "../types/gameTypes";

export interface PlayerConfig {
  name: string;
  isBot: boolean;
  botDifficulty?: "easy" | "medium" | "hard";
}

export interface GameConfig {
  players: PlayerConfig[];
  targetScore: number;
}

export interface GameState {
  isGameActive: boolean;
  currentGame: Game | null;
  currentRound: Round | null;
  players: PlayerConfig[];
  humanPlayerIndex: number;
  botPlayers: BotPlayer[];
  isProcessingTurn: boolean;
  lastPlayedCard: Card | null;
  currentColor: Color | undefined;
  gameLog: string[];
  winner: number | undefined;
  roundWinner: number | undefined;
}

class GameStateManager {
  private state = reactive<GameState>({
    isGameActive: false,
    currentGame: null,
    currentRound: null,
    players: [],
    humanPlayerIndex: 0,
    botPlayers: [],
    isProcessingTurn: false,
    lastPlayedCard: null,
    currentColor: undefined,
    gameLog: [],
    winner: undefined,
    roundWinner: undefined,
  });

  // Computed properties for easy access
  readonly isGameActive = computed(() => this.state.isGameActive);
  readonly currentGame = computed(() => this.state.currentGame);
  readonly currentRound = computed(() => this.state.currentRound);
  readonly players = computed(() => this.state.players);
  readonly humanPlayerIndex = computed(() => this.state.humanPlayerIndex);
  readonly botPlayers = computed(() => this.state.botPlayers);
  readonly isProcessingTurn = computed(() => this.state.isProcessingTurn);
  readonly lastPlayedCard = computed(() => this.state.lastPlayedCard);
  readonly currentColor = computed(() => this.state.currentColor);
  readonly gameLog = computed(() => this.state.gameLog);
  readonly winner = computed(() => this.state.winner);
  readonly roundWinner = computed(() => this.state.roundWinner);

  // Derived computed properties
  readonly currentPlayerIndex = computed(() =>
    this.state.currentRound?.playerInTurn(),
  );
  readonly currentPlayerName = computed(() => {
    const index = this.currentPlayerIndex.value;
    return index !== undefined ? this.state.players[index]?.name : undefined;
  });
  readonly isHumanTurn = computed(
    () => this.currentPlayerIndex.value === this.state.humanPlayerIndex,
  );
  readonly humanHand = computed(
    () =>
      this.state.currentRound?.playerHand(this.state.humanPlayerIndex) || [],
  );
  readonly scores = computed(() => {
    if (!this.state.currentGame) return [];
    return this.state.players.map((_, index) =>
      this.state.currentGame!.score(index),
    );
  });

  async startGame(config: GameConfig): Promise<void> {
    try {
      this.addLog("Setting up game...");

      // Validate configuration
      if (config.players.length < 2 || config.players.length > 4) {
        throw new Error("Game must have 2-4 players");
      }

      // Find human player (first non-bot player)
      const humanIndex = config.players.findIndex((p) => !p.isBot);
      if (humanIndex === -1) {
        throw new Error("At least one human player is required");
      }

      // Create bot players
      this.addLog("Creating bot players...");
      const botPlayers: BotPlayer[] = [];
      for (let i = 0; i < config.players.length; i++) {
        const player = config.players[i];
        if (player && player.isBot) {
          const bot: BotPlayer = {
            id: `bot-${i}`,
            name: player.name,
            difficulty: player.botDifficulty || "medium",
            playerIndex: i,
          };
          botPlayers.push(bot);
          console.log(`Creating bot: ${bot.name} (${bot.difficulty})`);
          try {
            await botManager.createBot(bot);
            console.log(`Bot created successfully: ${bot.name}`);
          } catch (error) {
            console.error(`Failed to create bot ${bot.name}:`, error);
            this.addLog(`Warning: Bot ${bot.name} will use fallback AI`);
          }
        }
      }


      const playerNames = config.players.map((p) => p.name);
      const game = createUnoGame(playerNames, config.targetScore);

      this.state.currentGame = game;
      this.state.currentRound = game.currentRound()!;
      this.state.players = config.players;
      this.state.humanPlayerIndex = humanIndex;
      this.state.botPlayers = botPlayers;
      this.state.isGameActive = true;
      this.state.winner = undefined;
      this.state.roundWinner = undefined;

      this.state.currentRound.onEnd(({ winner }) => {
        this.handleRoundEnd(winner);
      });

      this.updateGameState();

      const discardPile = this.state.currentRound.discardPile();
      const startCard = discardPile?.peek();
      if (startCard && "color" in startCard) {
        this.state.currentColor = startCard.color;
      }

      this.addLog(
        `Game started! ${config.players.length} players, target score: ${config.targetScore}`,
      );

      this.processTurn();
    } catch (error) {
      this.addLog(`Error starting game: ${error}`);
      throw error;
    }
  }

  async playCard(cardIndex: number, namedColor?: Color): Promise<void> {
    if (
      !this.state.currentRound ||
      !this.isHumanTurn.value ||
      this.state.isProcessingTurn
    ) {
      throw new Error("Cannot play card at this time");
    }

    try {
      this.state.isProcessingTurn = true;
      const card = this.state.currentRound.play(cardIndex, namedColor);
      this.state.lastPlayedCard = card;

      if (namedColor && (card.type === "WILD" || card.type === "WILD DRAW")) {
        this.state.currentColor = namedColor;
      } else if ("color" in card) {
        this.state.currentColor = card.color;
      }

      this.updateGameState();
      this.addLog(
        `${this.currentPlayerName.value} played ${this.cardToString(card)}`,
      );
      if (namedColor) {
        this.addLog(`Color changed to ${namedColor}`);
      }

      setTimeout(() => this.processTurn(), 500);
    } catch (error) {
      this.state.isProcessingTurn = false;
      this.addLog(`Invalid play: ${error}`);
      throw error;
    }
  }

  async drawCard(): Promise<void> {
    if (
      !this.state.currentRound ||
      !this.isHumanTurn.value ||
      this.state.isProcessingTurn
    ) {
      throw new Error("Cannot draw card at this time");
    }

    try {
      this.state.isProcessingTurn = true;
      this.state.currentRound.draw();
      this.updateGameState();
      this.addLog(`${this.currentPlayerName.value} drew a card`);

      setTimeout(() => this.processTurn(), 500);
    } catch (error) {
      this.state.isProcessingTurn = false;
      this.addLog(`Cannot draw: ${error}`);
      throw error;
    }
  }

  async sayUno(): Promise<void> {
    if (!this.state.currentRound || !this.isHumanTurn.value) {
      return;
    }

    try {
      this.state.currentRound.sayUno(this.state.humanPlayerIndex);
      this.addLog(`${this.currentPlayerName.value} said UNO!`);
    } catch (error) {
      this.addLog(`UNO error: ${error}`);
    }
  }

  async catchUnoFailure(accusedIndex: number): Promise<void> {
    if (!this.state.currentRound) {
      return;
    }

    try {
      const success = this.state.currentRound.catchUnoFailure({
        accuser: this.state.humanPlayerIndex,
        accused: accusedIndex,
      });

      if (success) {
        const accusedPlayer = this.state.players[accusedIndex];
        if (accusedPlayer) {
          this.addLog(
            `${this.currentPlayerName.value} caught ${accusedPlayer.name} for not saying UNO! (+4 cards)`,
          );
        }
        this.updateGameState();
      } else {
        this.addLog(`Invalid UNO challenge by ${this.currentPlayerName.value}`);
      }
    } catch (error) {
      this.addLog(`UNO challenge error: ${error}`);
    }
  }

  canPlayCard(cardIndex: number): boolean {
    if (!this.state.currentRound || !this.isHumanTurn.value) {
      return false;
    }

    try {
      return this.state.currentRound.canPlay(cardIndex);
    } catch {
      return false;
    }
  }

  private async processTurn(): Promise<void> {
    if (!this.state.currentRound || this.state.currentRound.hasEnded()) {
      this.state.isProcessingTurn = false;
      return;
    }

    const currentPlayerIndex = this.currentPlayerIndex.value;
    if (currentPlayerIndex === undefined) {
      this.state.isProcessingTurn = false;
      return;
    }

    this.state.isProcessingTurn = true;

    if (currentPlayerIndex === this.state.humanPlayerIndex) {
      this.state.isProcessingTurn = false;
      return;
    }

    const bot = this.state.botPlayers.find(
      (b) => b.playerIndex === currentPlayerIndex,
    );
    if (!bot) {
      this.state.isProcessingTurn = false;
      return;
    }

    try {
      const gameState = this.buildBotGameState(bot);
      const action = await botManager.requestMove(bot.id, gameState);
      await this.executeBotAction(bot, action);
    } catch (error) {
      this.addLog(`Bot error for ${bot.name}: ${error}`);
      try {
        this.state.currentRound.draw();
        this.addLog(`${bot.name} drew a card (fallback)`);
      } catch (drawError) {
        this.addLog(`Fallback draw failed: ${drawError}`);
      }
    }

    this.updateGameState();

    setTimeout(() => this.processTurn(), 1000);
  }

  private buildBotGameState(bot: BotPlayer): BotGameState {
    const round = this.state.currentRound!;
    const discardPile = round.discardPile();
    const topCard = discardPile?.peek();

    return {
      hand: round.playerHand(bot.playerIndex),
      currentCard: topCard || this.state.lastPlayedCard!,
      currentColor: this.state.currentColor,
      playerCount: this.state.players.length,
      playersHandSizes: this.state.players.map(
        (_, i) => round.playerHand(i).length,
      ),
      currentPlayerIndex: round.playerInTurn() ?? 0,
      botPlayerIndex: bot.playerIndex,
      canPlay: round.canPlayAny(),
      drawPileSize: round.drawPile().size,
    };
  }

  private async executeBotAction(
    bot: BotPlayer,
    action: BotAction,
  ): Promise<void> {
    const round = this.state.currentRound!;

    try {
      switch (action.type) {
        case "play":
          if (action.cardIndex !== undefined) {
            const card = round.play(action.cardIndex, action.namedColor);
            this.state.lastPlayedCard = card;

            if (
              action.namedColor &&
              (card.type === "WILD" || card.type === "WILD DRAW")
            ) {
              this.state.currentColor = action.namedColor;
            } else if ("color" in card) {
              this.state.currentColor = card.color;
            }

            this.addLog(`${bot.name} played ${this.cardToString(card)}`);
            if (action.namedColor) {
              this.addLog(`${bot.name} changed color to ${action.namedColor}`);
            }
          }
          break;

        case "draw":
          round.draw();
          this.addLog(`${bot.name} drew a card`);
          break;

        case "sayUno":
          round.sayUno(bot.playerIndex);
          this.addLog(`${bot.name} said UNO!`);
          break;

        case "catchUnoFailure":
          if (action.accused !== undefined) {
            const success = round.catchUnoFailure({
              accuser: bot.playerIndex,
              accused: action.accused,
            });
            if (success) {
              const accusedPlayer = this.state.players[action.accused];
              if (accusedPlayer) {
                this.addLog(
                  `${bot.name} caught ${accusedPlayer.name} for not saying UNO!`,
                );
              }
            }
          }
          break;
      }
    } catch (error) {
      throw new Error(`Failed to execute bot action: ${error}`);
    }
  }

  private updateGameState(): void {
    if (!this.state.currentRound) return;

    const discardPile = this.state.currentRound.discardPile();
    const topCard = discardPile?.peek();
    if (topCard) {
      this.state.lastPlayedCard = topCard;
      if (topCard.type !== "WILD" && topCard.type !== "WILD DRAW") {
        if ("color" in topCard) {
          this.state.currentColor = topCard.color;
        }
      }
    }

    this.state.winner = this.state.currentGame?.winner();
    this.state.roundWinner = this.state.currentRound.winner();
  }

  private handleRoundEnd(winner: number): void {
    this.state.roundWinner = winner;
    const winnerPlayer = this.state.players[winner];
    if (winnerPlayer) {
      this.addLog(`Round ended! ${winnerPlayer.name} wins the round!`);
    }

    const gameWinner = this.state.currentGame?.winner();
    if (gameWinner !== undefined) {
      this.state.winner = gameWinner;
      this.state.isGameActive = false;
      const gameWinnerPlayer = this.state.players[gameWinner];
      if (gameWinnerPlayer) {
        this.addLog(`Game Over! ${gameWinnerPlayer.name} wins the game!`);
      }
      this.cleanup();
    } else {
      setTimeout(() => {
        this.state.currentRound =
          this.state.currentGame?.currentRound() || null;
        if (this.state.currentRound) {
          this.state.currentRound.onEnd(({ winner }) =>
            this.handleRoundEnd(winner),
          );
          this.addLog("New round started!");
          this.processTurn();
        }
      }, 2000);
    }
  }

  private addLog(message: string): void {
    this.state.gameLog.push(`${new Date().toLocaleTimeString()}: ${message}`);
    console.log(message);
  }

  private cardToString(card: Card): string {
    if (card.type === "NUMBERED" && "number" in card) {
      return `${card.color} ${card.number}`;
    }
    if ("color" in card) {
      return `${card.color} ${card.type}`;
    }
    return card.type;
  }

  private cleanup(): void {
    botManager.destroyAllBots();
  }

  resetGame(): void {
    this.cleanup();
    this.state.isGameActive = false;
    this.state.currentGame = null;
    this.state.currentRound = null;
    this.state.players = [];
    this.state.botPlayers = [];
    this.state.gameLog = [];
    this.state.winner = undefined;
    this.state.roundWinner = undefined;
    this.state.lastPlayedCard = null;
    this.state.currentColor = undefined;
  }
}

export const gameStateManager = new GameStateManager();
