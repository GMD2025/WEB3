import { v4 as uuidv4 } from "uuid";
import { Game as DomainGame, createUnoGame } from "@domain/model/uno";
import { Round as DomainRound } from "@domain/model/round";
import { Card as DomainCard, Color } from "@domain/model/card";

export interface Player {
  id: string;
  name: string;
}

export interface GamePlayer extends Player {
  score: number;
  isOnline: boolean;
}

export interface GameAction {
  type:
    | "PLAYER_JOINED"
    | "GAME_STARTED"
    | "CARD_PLAYED"
    | "CARD_DRAWN"
    | "UNO_SAID"
    | "UNO_CAUGHT"
    | "ROUND_ENDED"
    | "GAME_ENDED"
    | "PLAYER_LEFT";
  playerId: string;
  playerName: string;
  cardPlayed?: DomainCard;
  namedColor?: Color;
  message: string;
  timestamp: string;
}

export interface MultiplayerGame {
  id: string;
  players: GamePlayer[];
  domainGame?: DomainGame;
  state: "WAITING_FOR_PLAYERS" | "IN_PROGRESS" | "FINISHED";
  targetScore: number;
  isStarted: boolean;
  isFinished: boolean;
  createdAt: string;
  actions: GameAction[];
}

export class GameManager {
  private static instance: GameManager;
  private games: Map<string, MultiplayerGame> = new Map();
  private players: Map<string, Player> = new Map();

  private constructor() {}

  static getInstance(): GameManager {
    if (!GameManager.instance) {
      GameManager.instance = new GameManager();
    }
    return GameManager.instance;
  }

  createPlayer(name: string): Player {
    const player: Player = {
      id: uuidv4(),
      name: name.trim(),
    };
    this.players.set(player.id, player);
    return player;
  }

  getPlayer(id: string): Player | undefined {
    return this.players.get(id);
  }

  createGame(creatorName: string, targetScore: number = 500): MultiplayerGame {
    const game: MultiplayerGame = {
      id: uuidv4(),
      players: [],
      state: "WAITING_FOR_PLAYERS",
      targetScore,
      isStarted: false,
      isFinished: false,
      createdAt: new Date().toISOString(),
      actions: [],
    };

    const creator = this.createPlayer(creatorName);
    const gamePlayer: GamePlayer = {
      ...creator,
      score: 0,
      isOnline: true,
    };
    game.players.push(gamePlayer);

    this.games.set(game.id, game);

    this.addGameAction(game, {
      type: "PLAYER_JOINED",
      playerId: creator.id,
      playerName: creator.name,
      message: `${creator.name} created the game`,
      timestamp: new Date().toISOString(),
    });

    return game;
  }

  joinGame(gameId: string, playerName: string): MultiplayerGame | null {
    const game = this.games.get(gameId);
    if (!game) return null;

    if (game.isStarted) {
      throw new Error("Game has already started");
    }

    if (game.players.length >= 4) {
      throw new Error("Game is full");
    }

    if (game.players.some((p) => p.name === playerName.trim())) {
      throw new Error("Player name already taken in this game");
    }

    const player = this.createPlayer(playerName);
    const gamePlayer: GamePlayer = {
      ...player,
      score: 0,
      isOnline: true,
    };

    game.players.push(gamePlayer);

    this.addGameAction(game, {
      type: "PLAYER_JOINED",
      playerId: player.id,
      playerName: player.name,
      message: `${player.name} joined the game`,
      timestamp: new Date().toISOString(),
    });

    if (game.players.length >= 2 && !game.isStarted) {
      this.startGame(game);
    }

    return game;
  }

  private startGame(game: MultiplayerGame): void {
    if (game.players.length < 2) {
      throw new Error("Need at least 2 players to start");
    }

    const playerNames = game.players.map((p) => p.name);
    game.domainGame = createUnoGame(playerNames, game.targetScore);
    game.state = "IN_PROGRESS";
    game.isStarted = true;

    this.addGameAction(game, {
      type: "GAME_STARTED",
      playerId: game.players[0].id,
      playerName: "System",
      message: "Game started!",
      timestamp: new Date().toISOString(),
    });
  }

  getGame(gameId: string): MultiplayerGame | undefined {
    return this.games.get(gameId);
  }

  getAllGames(): MultiplayerGame[] {
    return Array.from(this.games.values());
  }

  playCard(
    gameId: string,
    playerId: string,
    cardIndex: number,
    namedColor?: Color,
  ): { success: boolean; message?: string } {
    const game = this.games.get(gameId);
    if (!game || !game.domainGame) {
      return { success: false, message: "Game not found" };
    }

    const playerIndex = this.getPlayerIndex(game, playerId);
    if (playerIndex === -1) {
      return { success: false, message: "Player not in game" };
    }

    const round = game.domainGame.currentRound();
    if (!round) {
      return { success: false, message: "No active round" };
    }

    if (round.playerInTurn() !== playerIndex) {
      return { success: false, message: "Not your turn" };
    }

    try {
      const playedCard = round.play(cardIndex, namedColor);

      this.addGameAction(game, {
        type: "CARD_PLAYED",
        playerId,
        playerName: game.players[playerIndex].name,
        cardPlayed: playedCard,
        namedColor,
        message: `${game.players[playerIndex].name} played a card`,
        timestamp: new Date().toISOString(),
      });

      this.checkRoundEnd(game);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Invalid move",
      };
    }
  }

  drawCard(
    gameId: string,
    playerId: string,
  ): { success: boolean; message?: string } {
    const game = this.games.get(gameId);
    if (!game || !game.domainGame) {
      return { success: false, message: "Game not found" };
    }

    const playerIndex = this.getPlayerIndex(game, playerId);
    if (playerIndex === -1) {
      return { success: false, message: "Player not in game" };
    }

    const round = game.domainGame.currentRound();
    if (!round) {
      return { success: false, message: "No active round" };
    }

    if (round.playerInTurn() !== playerIndex) {
      return { success: false, message: "Not your turn" };
    }

    try {
      round.draw();

      this.addGameAction(game, {
        type: "CARD_DRAWN",
        playerId,
        playerName: game.players[playerIndex].name,
        message: `${game.players[playerIndex].name} drew a card`,
        timestamp: new Date().toISOString(),
      });

      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Cannot draw card",
      };
    }
  }

  sayUno(
    gameId: string,
    playerId: string,
  ): { success: boolean; message?: string } {
    const game = this.games.get(gameId);
    if (!game || !game.domainGame) {
      return { success: false, message: "Game not found" };
    }

    const playerIndex = this.getPlayerIndex(game, playerId);
    if (playerIndex === -1) {
      return { success: false, message: "Player not in game" };
    }

    const round = game.domainGame.currentRound();
    if (!round) {
      return { success: false, message: "No active round" };
    }

    try {
      round.sayUno(playerIndex);

      this.addGameAction(game, {
        type: "UNO_SAID",
        playerId,
        playerName: game.players[playerIndex].name,
        message: `${game.players[playerIndex].name} said UNO!`,
        timestamp: new Date().toISOString(),
      });

      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Cannot say UNO",
      };
    }
  }

  catchUnoFailure(
    gameId: string,
    accuserId: string,
    accusedPlayerId: string,
  ): { success: boolean; message?: string } {
    const game = this.games.get(gameId);
    if (!game || !game.domainGame) {
      return { success: false, message: "Game not found" };
    }

    const accuserIndex = this.getPlayerIndex(game, accuserId);
    const accusedIndex = this.getPlayerIndex(game, accusedPlayerId);

    if (accuserIndex === -1 || accusedIndex === -1) {
      return { success: false, message: "Player not in game" };
    }

    const round = game.domainGame.currentRound();
    if (!round) {
      return { success: false, message: "No active round" };
    }

    try {
      const caught = round.catchUnoFailure({
        accuser: accuserIndex,
        accused: accusedIndex,
      });

      if (caught) {
        this.addGameAction(game, {
          type: "UNO_CAUGHT",
          playerId: accuserId,
          playerName: game.players[accuserIndex].name,
          message: `${game.players[accuserIndex].name} caught ${game.players[accusedIndex].name} for not saying UNO!`,
          timestamp: new Date().toISOString(),
        });
      }

      return {
        success: caught,
        message: caught ? "UNO failure caught!" : "No UNO failure to catch",
      };
    } catch (error) {
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Cannot catch UNO failure",
      };
    }
  }

  private getPlayerIndex(game: MultiplayerGame, playerId: string): number {
    return game.players.findIndex((p) => p.id === playerId);
  }

  private addGameAction(game: MultiplayerGame, action: GameAction): void {
    game.actions.push(action);
  }

  private checkRoundEnd(game: MultiplayerGame): void {
    if (!game.domainGame) return;

    const round = game.domainGame.currentRound();
    if (!round || !round.hasEnded()) return;

    const winnerIndex = round.winner();
    if (winnerIndex !== undefined) {
      for (let i = 0; i < game.players.length; i++) {
        game.players[i].score = game.domainGame.score(i);
      }

      this.addGameAction(game, {
        type: "ROUND_ENDED",
        playerId: game.players[winnerIndex].id,
        playerName: game.players[winnerIndex].name,
        message: `${game.players[winnerIndex].name} won the round!`,
        timestamp: new Date().toISOString(),
      });

      const gameWinner = game.domainGame.winner();
      if (gameWinner !== undefined) {
        game.state = "FINISHED";
        game.isFinished = true;

        this.addGameAction(game, {
          type: "GAME_ENDED",
          playerId: game.players[gameWinner].id,
          playerName: game.players[gameWinner].name,
          message: `${game.players[gameWinner].name} won the game!`,
          timestamp: new Date().toISOString(),
        });
      }
    }
  }
}
