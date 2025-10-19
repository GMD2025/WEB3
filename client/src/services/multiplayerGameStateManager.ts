import { ref, computed, reactive } from "vue";
import { apolloClient } from "./graphql/client";
import {
  CREATE_GAME,
  JOIN_GAME,
  PLAY_CARD,
  DRAW_CARD,
  SAY_UNO,
  CATCH_UNO_FAILURE,
  GET_GAME,
  GAME_UPDATED,
  GAME_ACTION,
} from "./graphql/queries";
import type { Color } from "../types/gameTypes";

export interface GamePlayer {
  id: string;
  name: string;
  score: number;
  isOnline: boolean;
}

export interface MultiplayerGame {
  id: string;
  players: GamePlayer[];
  state: "WAITING_FOR_PLAYERS" | "IN_PROGRESS" | "FINISHED";
  targetScore: number;
  currentRound?: any;
  winner?: GamePlayer;
  isStarted: boolean;
  isFinished: boolean;
  createdAt: string;
}

export interface GameAction {
  type: string;
  playerId: string;
  playerName: string;
  cardPlayed?: any;
  namedColor?: Color;
  message: string;
  timestamp: string;
}

class MultiplayerGameStateManager {
  private currentGame = ref<MultiplayerGame | null>(null);
  private currentPlayerId = ref<string | null>(null);
  private playerName = ref<string>("");
  private gameActions = ref<GameAction[]>([]);
  private subscriptions: any[] = [];

  // Computed properties
  readonly isGameActive = computed(
    () => this.currentGame.value?.state === "IN_PROGRESS",
  );
  readonly isMyTurn = computed(() => {
    const game = this.currentGame.value;
    if (!game?.currentRound || !this.currentPlayerId.value) return false;

    const myPlayerIndex = game.players.findIndex(
      (p) => p.id === this.currentPlayerId.value,
    );
    return game.currentRound.currentPlayerIndex === myPlayerIndex;
  });

  readonly myHand = computed(() => {
    const game = this.currentGame.value;
    if (!game?.currentRound || !this.currentPlayerId.value) return [];

    // Find my hand data by matching playerId directly
    const myHandData = game.currentRound.playerHands.find(
      (h: any) => h.playerId === this.currentPlayerId.value,
    );

    // For privacy, we only get our own cards, others get card count
    return myHandData?.cards || [];
  });

  readonly canDraw = computed(() => {
    return this.isMyTurn.value && this.isGameActive.value;
  });

  // Reactive state
  readonly game = computed(() => this.currentGame.value);
  readonly playerId = computed(() => this.currentPlayerId.value);
  readonly actions = computed(() => this.gameActions.value);

  // Game management
  async createGame(
    playerName: string,
    targetScore: number = 500,
  ): Promise<MultiplayerGame> {
    try {
      const result = await apolloClient.mutate({
        mutation: CREATE_GAME,
        variables: { playerName, targetScore },
      });

      const game = result.data.createGame;
      this.currentGame.value = game;
      this.playerName.value = playerName;
      this.currentPlayerId.value = game.players[0].id;

      // Store player ID in sessionStorage for persistence
      sessionStorage.setItem(`playerId_${game.id}`, game.players[0].id);

      await this.subscribeToGame(game.id);
      return game;
    } catch (error) {
      console.error("Failed to create game:", error);
      throw error;
    }
  }

  async joinGame(gameId: string, playerName: string): Promise<MultiplayerGame> {
    try {
      const result = await apolloClient.mutate({
        mutation: JOIN_GAME,
        variables: { gameId, playerName },
      });

      const game = result.data.joinGame;
      this.currentGame.value = game;
      this.playerName.value = playerName;

      // Find our player ID
      const player = game.players.find(
        (p: GamePlayer) => p.name === playerName,
      );
      this.currentPlayerId.value = player?.id || null;

      // Store player ID in sessionStorage for persistence
      if (player?.id) {
        sessionStorage.setItem(`playerId_${game.id}`, player.id);
      }

      await this.subscribeToGame(game.id);
      return game;
    } catch (error) {
      console.error("Failed to join game:", error);
      throw error;
    }
  }

  async loadGame(gameId: string): Promise<void> {
    try {
      const result = await apolloClient.query({
        query: GET_GAME,
        variables: { id: gameId },
      });

      if (result.data.game) {
        this.currentGame.value = result.data.game;

        // Try to restore player ID from sessionStorage
        const storedPlayerId = sessionStorage.getItem(`playerId_${gameId}`);
        if (storedPlayerId) {
          this.currentPlayerId.value = storedPlayerId;
        }

        await this.subscribeToGame(gameId);
      } else {
        throw new Error("Game not found");
      }
    } catch (error) {
      console.error("Failed to load game:", error);
      throw error;
    }
  }

  // Game actions
  async playCard(cardIndex: number, namedColor?: Color): Promise<void> {
    if (!this.currentGame.value || !this.currentPlayerId.value) {
      throw new Error("No active game or player");
    }

    try {
      const result = await apolloClient.mutate({
        mutation: PLAY_CARD,
        variables: {
          gameId: this.currentGame.value.id,
          playerId: this.currentPlayerId.value,
          cardIndex,
          namedColor,
        },
      });

      if (!result.data.playCard.success) {
        throw new Error(result.data.playCard.message || "Failed to play card");
      }

      // Update the game state immediately (subscription will also update it)
      if (result.data.playCard.game) {
        this.currentGame.value = result.data.playCard.game;
      }
    } catch (error) {
      console.error("Failed to play card:", error);
      throw error;
    }
  }

  async drawCard(): Promise<void> {
    if (!this.currentGame.value || !this.currentPlayerId.value) {
      throw new Error("No active game or player");
    }

    console.log(
      "Drawing card...",
      "Current hand size:",
      this.myHand.value.length,
    );

    try {
      const result = await apolloClient.mutate({
        mutation: DRAW_CARD,
        variables: {
          gameId: this.currentGame.value.id,
          playerId: this.currentPlayerId.value,
        },
      });

      if (!result.data.drawCard.success) {
        throw new Error(result.data.drawCard.message || "Failed to draw card");
      }

      // Update the game state immediately (subscription will also update it)
      if (result.data.drawCard.game) {
        this.currentGame.value = result.data.drawCard.game;
        console.log(
          "Card drawn successfully. New hand size:",
          this.myHand.value.length,
        );
      }
    } catch (error) {
      console.error("Failed to draw card:", error);
      throw error;
    }
  }

  async sayUno(): Promise<void> {
    if (!this.currentGame.value || !this.currentPlayerId.value) {
      throw new Error("No active game or player");
    }

    try {
      const result = await apolloClient.mutate({
        mutation: SAY_UNO,
        variables: {
          gameId: this.currentGame.value.id,
          playerId: this.currentPlayerId.value,
        },
      });

      if (!result.data.sayUno.success) {
        throw new Error(result.data.sayUno.message || "Failed to say UNO");
      }
    } catch (error) {
      console.error("Failed to say UNO:", error);
      throw error;
    }
  }

  async catchUnoFailure(accusedPlayerId: string): Promise<void> {
    if (!this.currentGame.value || !this.currentPlayerId.value) {
      throw new Error("No active game or player");
    }

    try {
      const result = await apolloClient.mutate({
        mutation: CATCH_UNO_FAILURE,
        variables: {
          gameId: this.currentGame.value.id,
          playerId: this.currentPlayerId.value,
          accusedPlayerId,
        },
      });

      if (!result.data.catchUnoFailure.success) {
        throw new Error(
          result.data.catchUnoFailure.message || "Failed to catch UNO failure",
        );
      }
    } catch (error) {
      console.error("Failed to catch UNO failure:", error);
      throw error;
    }
  }

  // Utility methods
  canPlayCard(cardIndex: number): boolean {
    if (!this.isMyTurn.value || !this.currentGame.value?.currentRound)
      return false;

    const hand = this.myHand.value;
    if (cardIndex < 0 || cardIndex >= hand.length) return false;

    const card = hand[cardIndex];
    const topCard = this.currentGame.value.currentRound.topCard;
    const currentColor = this.currentGame.value.currentRound.currentColor;

    // Basic card matching logic (simplified)
    if (card.type === "WILD" || card.type === "WILD_DRAW") return true;
    if (card.color === currentColor) return true;
    if (topCard && card.type === topCard.type && card.number === topCard.number)
      return true;

    return false;
  }

  getPlayerHandSize(playerIndex: number): number {
    const game = this.currentGame.value;
    if (!game?.currentRound) return 0;

    const handData = game.currentRound.playerHands[playerIndex];
    return handData?.cardCount || 0;
  }

  canCatchUno(playerIndex: number): boolean {
    const game = this.currentGame.value;
    if (!game?.currentRound || playerIndex === this.getMyPlayerIndex())
      return false;

    const handData = game.currentRound.playerHands[playerIndex];
    return handData?.cardCount === 1 && !handData?.hasUno;
  }

  private getMyPlayerIndex(): number {
    if (!this.currentGame.value || !this.currentPlayerId.value) return -1;
    return this.currentGame.value.players.findIndex(
      (p) => p.id === this.currentPlayerId.value,
    );
  }

  // Subscription management
  private async subscribeToGame(gameId: string): Promise<void> {
    // Clear existing subscriptions
    this.subscriptions.forEach((sub) => sub.unsubscribe());
    this.subscriptions = [];

    // Subscribe to game updates
    console.log("Subscribing to game updates for gameId:", gameId);
    const gameUpdateSub = apolloClient
      .subscribe({
        query: GAME_UPDATED,
        variables: { gameId },
      })
      .subscribe({
        next: (result) => {
          console.log(
            "Game update received via subscription:",
            result.data?.gameUpdated,
          );
          if (result.data?.gameUpdated) {
            this.currentGame.value = result.data.gameUpdated;
          }
        },
        error: (error) => {
          console.error("Game update subscription error:", error);
        },
      });

    // Subscribe to game actions
    console.log("Subscribing to game actions for gameId:", gameId);
    const gameActionSub = apolloClient
      .subscribe({
        query: GAME_ACTION,
        variables: { gameId },
      })
      .subscribe({
        next: (result) => {
          console.log(
            "Game action received via subscription:",
            result.data?.gameAction,
          );
          if (result.data?.gameAction) {
            this.gameActions.value.push(result.data.gameAction);
          }
        },
        error: (error) => {
          console.error("Game action subscription error:", error);
        },
      });

    this.subscriptions.push(gameUpdateSub, gameActionSub);
  }

  // Cleanup
  destroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
    this.subscriptions = [];
    this.currentGame.value = null;
    this.currentPlayerId.value = null;
    this.gameActions.value = [];
  }
}

export const multiplayerGameStateManager = new MultiplayerGameStateManager();
