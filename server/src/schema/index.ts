export const typeDefs = `
  type Query {
    games: [Game!]!
    game(id: ID!): Game
    player(id: ID!): Player
  }

  type Mutation {
    createPlayer(name: String!): Player!
    createGame(playerName: String!, targetScore: Int = 500): Game!
    joinGame(gameId: ID!, playerName: String!): Game!
    playCard(gameId: ID!, playerId: ID!, cardIndex: Int!, namedColor: Color): GameActionResult!
    drawCard(gameId: ID!, playerId: ID!): GameActionResult!
    sayUno(gameId: ID!, playerId: ID!): GameActionResult!
    catchUnoFailure(gameId: ID!, playerId: ID!, accusedPlayerId: ID!): GameActionResult!
  }

  type Subscription {
    gameUpdated(gameId: ID!): Game!
    gameAction(gameId: ID!): GameAction!
  }

  type Player {
    id: ID!
    name: String!
  }

  type Game {
    id: ID!
    players: [GamePlayer!]!
    state: GameState!
    targetScore: Int!
    currentRound: Round
    winner: GamePlayer
    isStarted: Boolean!
    isFinished: Boolean!
    createdAt: String!
  }

  type GamePlayer {
    id: ID!
    name: String!
    score: Int!
    isOnline: Boolean!
  }

  type Round {
    dealer: Int!
    currentPlayerIndex: Int!
    direction: Direction!
    currentColor: Color
    topCard: Card
    playerHands: [PlayerHand!]!
    drawPileSize: Int!
    discardPileSize: Int!
    hasEnded: Boolean!
    winner: GamePlayer
  }

  type PlayerHand {
    playerId: ID!
    cards: [Card!]!
    cardCount: Int!
    hasUno: Boolean!
  }

  type Card {
    type: CardType!
    color: Color
    number: Int
  }

  type GameActionResult {
    success: Boolean!
    message: String
    game: Game!
  }

  type GameAction {
    type: ActionType!
    playerId: ID!
    playerName: String!
    cardPlayed: Card
    namedColor: Color
    message: String!
    timestamp: String!
  }

  enum GameState {
    WAITING_FOR_PLAYERS
    IN_PROGRESS
    FINISHED
  }

  enum Direction {
    CLOCKWISE
    COUNTER_CLOCKWISE
  }

  enum Color {
    RED
    YELLOW
    GREEN
    BLUE
  }

  enum CardType {
    NUMBERED
    SKIP
    REVERSE
    DRAW
    WILD
    WILD_DRAW
  }

  enum ActionType {
    PLAYER_JOINED
    GAME_STARTED
    CARD_PLAYED
    CARD_DRAWN
    UNO_SAID
    UNO_CAUGHT
    ROUND_ENDED
    GAME_ENDED
    PLAYER_LEFT
  }
`;
