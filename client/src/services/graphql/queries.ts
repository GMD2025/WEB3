import { gql } from '@apollo/client/core';

export const CARD_FRAGMENT = gql`
  fragment CardInfo on Card {
    type
    color
    number
  }
`;

export const PLAYER_FRAGMENT = gql`
  fragment PlayerInfo on GamePlayer {
    id
    name
    score
    isOnline
  }
`;

export const ROUND_FRAGMENT = gql`
  fragment RoundInfo on Round {
    dealer
    currentPlayerIndex
    direction
    currentColor
    topCard {
      ...CardInfo
    }
    playerHands {
      playerId
      cardCount
      hasUno
    }
    drawPileSize
    discardPileSize
    hasEnded
    winner {
      ...PlayerInfo
    }
  }
  ${CARD_FRAGMENT}
  ${PLAYER_FRAGMENT}
`;

export const GAME_FRAGMENT = gql`
  fragment GameInfo on Game {
    id
    players {
      ...PlayerInfo
    }
    state
    targetScore
    currentRound {
      ...RoundInfo
    }
    winner {
      ...PlayerInfo
    }
    isStarted
    isFinished
    createdAt
  }
  ${PLAYER_FRAGMENT}
  ${ROUND_FRAGMENT}
`;

// Queries
export const GET_GAMES = gql`
  query GetGames {
    games {
      ...GameInfo
    }
  }
  ${GAME_FRAGMENT}
`;

export const GET_GAME = gql`
  query GetGame($id: ID!) {
    game(id: $id) {
      ...GameInfo
    }
  }
  ${GAME_FRAGMENT}
`;

// Mutations
export const CREATE_PLAYER = gql`
  mutation CreatePlayer($name: String!) {
    createPlayer(name: $name) {
      id
      name
    }
  }
`;

export const CREATE_GAME = gql`
  mutation CreateGame($playerName: String!, $targetScore: Int) {
    createGame(playerName: $playerName, targetScore: $targetScore) {
      ...GameInfo
    }
  }
  ${GAME_FRAGMENT}
`;

export const JOIN_GAME = gql`
  mutation JoinGame($gameId: ID!, $playerName: String!) {
    joinGame(gameId: $gameId, playerName: $playerName) {
      ...GameInfo
    }
  }
  ${GAME_FRAGMENT}
`;

export const PLAY_CARD = gql`
  mutation PlayCard($gameId: ID!, $playerId: ID!, $cardIndex: Int!, $namedColor: Color) {
    playCard(gameId: $gameId, playerId: $playerId, cardIndex: $cardIndex, namedColor: $namedColor) {
      success
      message
      game {
        ...GameInfo
      }
    }
  }
  ${GAME_FRAGMENT}
`;

export const DRAW_CARD = gql`
  mutation DrawCard($gameId: ID!, $playerId: ID!) {
    drawCard(gameId: $gameId, playerId: $playerId) {
      success
      message
      game {
        ...GameInfo
      }
    }
  }
  ${GAME_FRAGMENT}
`;

export const SAY_UNO = gql`
  mutation SayUno($gameId: ID!, $playerId: ID!) {
    sayUno(gameId: $gameId, playerId: $playerId) {
      success
      message
      game {
        ...GameInfo
      }
    }
  }
  ${GAME_FRAGMENT}
`;

export const CATCH_UNO_FAILURE = gql`
  mutation CatchUnoFailure($gameId: ID!, $playerId: ID!, $accusedPlayerId: ID!) {
    catchUnoFailure(gameId: $gameId, playerId: $playerId, accusedPlayerId: $accusedPlayerId) {
      success
      message
      game {
        ...GameInfo
      }
    }
  }
  ${GAME_FRAGMENT}
`;

// Subscriptions
export const GAME_UPDATED = gql`
  subscription GameUpdated($gameId: ID!) {
    gameUpdated(gameId: $gameId) {
      ...GameInfo
    }
  }
  ${GAME_FRAGMENT}
`;

export const GAME_ACTION = gql`
  subscription GameAction($gameId: ID!) {
    gameAction(gameId: $gameId) {
      type
      playerId
      playerName
      cardPlayed {
        ...CardInfo
      }
      namedColor
      message
      timestamp
    }
  }
  ${CARD_FRAGMENT}
`;