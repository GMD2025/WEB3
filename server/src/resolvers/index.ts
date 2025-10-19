import { GameManager, MultiplayerGame } from "../services/gameManager";
import { PubSubManager } from "../services/pubSubManager";
import { Color } from "@domain/model/card";
import { RoundClass } from "@domain/model/round";

interface Context {
  gameManager: GameManager;
  pubSub: PubSubManager;
  userId?: string;
}

export const resolvers = {
  Query: {
    games: (_: any, __: any, { gameManager }: Context) => {
      return gameManager.getAllGames();
    },

    game: (_: any, { id }: { id: string }, { gameManager }: Context) => {
      return gameManager.getGame(id);
    },

    player: (_: any, { id }: { id: string }, { gameManager }: Context) => {
      return gameManager.getPlayer(id);
    },
  },

  Mutation: {
    createPlayer: (
      _: any,
      { name }: { name: string },
      { gameManager }: Context,
    ) => {
      return gameManager.createPlayer(name);
    },

    createGame: async (
      _: any,
      { playerName, targetScore }: { playerName: string; targetScore?: number },
      { gameManager, pubSub }: Context,
    ) => {
      const game = gameManager.createGame(playerName, targetScore);

      await pubSub.publish(`${PubSubManager.GAME_UPDATED}_${game.id}`, {
        gameUpdated: game,
      });

      return game;
    },

    joinGame: async (
      _: any,
      { gameId, playerName }: { gameId: string; playerName: string },
      { gameManager, pubSub }: Context,
    ) => {
      try {
        const game = gameManager.joinGame(gameId, playerName);
        if (!game) {
          throw new Error("Game not found");
        }

        await pubSub.publish(`${PubSubManager.GAME_UPDATED}_${gameId}`, {
          gameUpdated: game,
        });

        if (game.actions.length > 0) {
          const latestAction = game.actions[game.actions.length - 1];
          await pubSub.publish(`${PubSubManager.GAME_ACTION}_${gameId}`, {
            gameAction: latestAction,
          });
        }

        return game;
      } catch (error) {
        throw new Error(
          error instanceof Error ? error.message : "Failed to join game",
        );
      }
    },

    playCard: async (
      _: any,
      {
        gameId,
        playerId,
        cardIndex,
        namedColor,
      }: {
        gameId: string;
        playerId: string;
        cardIndex: number;
        namedColor?: Color;
      },
      { gameManager, pubSub }: Context,
    ) => {
      const result = gameManager.playCard(
        gameId,
        playerId,
        cardIndex,
        namedColor,
      );
      const game = gameManager.getGame(gameId);

      if (!game) {
        return { success: false, message: "Game not found", game: null };
      }

      if (result.success) {
        await pubSub.publish(`${PubSubManager.GAME_UPDATED}_${gameId}`, {
          gameUpdated: game,
        });

        if (game.actions.length > 0) {
          const latestAction = game.actions[game.actions.length - 1];
          await pubSub.publish(`${PubSubManager.GAME_ACTION}_${gameId}`, {
            gameAction: latestAction,
          });
        }
      }

      return {
        success: result.success,
        message: result.message,
        game,
      };
    },

    drawCard: async (
      _: any,
      { gameId, playerId }: { gameId: string; playerId: string },
      { gameManager, pubSub }: Context,
    ) => {
      const result = gameManager.drawCard(gameId, playerId);
      const game = gameManager.getGame(gameId);

      if (!game) {
        return { success: false, message: "Game not found", game: null };
      }

      if (result.success) {
        await pubSub.publish(`${PubSubManager.GAME_UPDATED}_${gameId}`, {
          gameUpdated: game,
        });

        if (game.actions.length > 0) {
          const latestAction = game.actions[game.actions.length - 1];
          await pubSub.publish(`${PubSubManager.GAME_ACTION}_${gameId}`, {
            gameAction: latestAction,
          });
        }
      }

      return {
        success: result.success,
        message: result.message,
        game,
      };
    },

    sayUno: async (
      _: any,
      { gameId, playerId }: { gameId: string; playerId: string },
      { gameManager, pubSub }: Context,
    ) => {
      const result = gameManager.sayUno(gameId, playerId);
      const game = gameManager.getGame(gameId);

      if (!game) {
        return { success: false, message: "Game not found", game: null };
      }

      if (result.success) {
        await pubSub.publish(`${PubSubManager.GAME_UPDATED}_${gameId}`, {
          gameUpdated: game,
        });

        if (game.actions.length > 0) {
          const latestAction = game.actions[game.actions.length - 1];
          await pubSub.publish(`${PubSubManager.GAME_ACTION}_${gameId}`, {
            gameAction: latestAction,
          });
        }
      }

      return {
        success: result.success,
        message: result.message,
        game,
      };
    },

    catchUnoFailure: async (
      _: any,
      {
        gameId,
        playerId,
        accusedPlayerId,
      }: { gameId: string; playerId: string; accusedPlayerId: string },
      { gameManager, pubSub }: Context,
    ) => {
      const result = gameManager.catchUnoFailure(
        gameId,
        playerId,
        accusedPlayerId,
      );
      const game = gameManager.getGame(gameId);

      if (!game) {
        return { success: false, message: "Game not found", game: null };
      }

      if (result.success) {
        await pubSub.publish(`${PubSubManager.GAME_UPDATED}_${gameId}`, {
          gameUpdated: game,
        });

        if (game.actions.length > 0) {
          const latestAction = game.actions[game.actions.length - 1];
          await pubSub.publish(`${PubSubManager.GAME_ACTION}_${gameId}`, {
            gameAction: latestAction,
          });
        }
      }

      return {
        success: result.success,
        message: result.message,
        game,
      };
    },
  },

  Subscription: {
    gameUpdated: {
      subscribe: (
        _: any,
        { gameId }: { gameId: string },
        { pubSub }: Context,
      ) => {
        return pubSub.asyncIterator([
          `${PubSubManager.GAME_UPDATED}_${gameId}`,
        ]);
      },
    },

    gameAction: {
      subscribe: (
        _: any,
        { gameId }: { gameId: string },
        { pubSub }: Context,
      ) => {
        return pubSub.asyncIterator([`${PubSubManager.GAME_ACTION}_${gameId}`]);
      },
    },
  },

  Game: {
    currentRound: (game: MultiplayerGame) => {
      if (!game.domainGame) return null;

      const round = game.domainGame.currentRound() as RoundClass;
      if (!round) return null;

      const playerHands = game.players.map((player, index) => {
        const hand = round.playerHand(index);
        const playerDetails = (round as any).playersArray[index];

        return {
          playerId: player.id,
          cards: hand,
          cardCount: hand.length,
          hasUno: playerDetails?.saidUno || false,
        };
      });

      return {
        dealer: round.dealer,
        currentPlayerIndex: round.currentPlayerIndex,
        direction:
          round.currentDirection === "clockwise"
            ? "CLOCKWISE"
            : "COUNTER_CLOCKWISE",
        currentColor: round.currentColor,
        topCard: round.discardPile().peek(),
        playerHands,
        drawPileSize: round.drawPile().size,
        discardPileSize: round.discardPile().size,
        hasEnded: round.hasEnded(),
        winner:
          round.winner() !== undefined ? game.players[round.winner()!] : null,
      };
    },

    winner: (game: MultiplayerGame) => {
      if (!game.domainGame) return null;
      const winnerIndex = game.domainGame.winner();
      return winnerIndex !== undefined ? game.players[winnerIndex] : null;
    },
  },

  Card: {
    type: (card: any) => {
      switch (card.type) {
        case "WILD DRAW":
          return "WILD_DRAW";
        default:
          return card.type;
      }
    },
  },
};
