import { describe, it, test, expect } from '@jest/globals'
import { createGame, createGameFromMemento } from '../utils/test_adapter'
import { Game, GameMemento } from '../../src/model/uno'

describe("Game set up", () => {
  const game: Game = createGame({players: ['a', 'b', 'c', 'd'], targetScore: 500})
  it("has as many players as set in the properties", () => {
    expect(game.playerCount).toBe(4)
  })
  it("has the players set in the properties", () => {
    expect(game.player(0)).toBe('a')
    expect(game.player(1)).toBe('b')
    expect(game.player(2)).toBe('c')
    expect(game.player(3)).toBe('d')
  })
  it("has 'A' and 'B' as the default players", () => {
    const game: Game = createGame({targetScore: 500})
    expect(game.playerCount).toBe(2)
    expect(game.player(0)).toBe('A')
    expect(game.player(1)).toBe('B')
  })
  it("has the target score set in the properties", () => {
    expect(game.targetScore).toBe(500)
  })
  it("has 500 as the default target score", () => {
    const game: Game = createGame({players: ['a', 'b', 'c', 'd']})
    expect(game.targetScore).toBe(500)
  })
  it("starts with all players at 0 score", () => {
    expect(game.score(0)).toBe(0)
    expect(game.score(1)).toBe(0)
    expect(game.score(2)).toBe(0)
    expect(game.score(3)).toBe(0)
  })
  it("has no winner", () => {
    expect(game.winner()).toBeUndefined();
  })
  it("requires at least 2 players", () => {
    expect(() => createGame({players: ['a'], targetScore: 500})).toThrow()
  })
  it("requires a target score of more than 0", () => {
    expect(() => createGame({players: ['a', 'b', 'c', 'd'], targetScore: 0})).toThrow()
  })
  it("requires player index to be in bounds", () => {
    expect(() => game.player(-1)).toThrow()
    expect(() => game.player(4)).toThrow()
  })
  it("starts a round", () => {
    expect(game.currentRound()).toBeDefined()
  })
  it("doesn't start a new round if no action is taken", () => {
    const round = game.currentRound()
    expect(game.currentRound()).toBe(round)
  })
  it("selects a random player as dealer", () => {
    const game: Game = createGame({players: ['a', 'b', 'c', 'd'], targetScore: 500, randomizer: () => 1})
    expect(game.currentRound()?.dealer).toBe(1)
  })
})

describe("Playing a round", () => {
  const memento: GameMemento = {
    cardsPerPlayer: 1,
    players: ['a', 'b', 'c', 'd'],
    targetScore: 200,
    scores: [0, 0, 0, 0],
    currentRound: {
      players: ['a', 'b', 'c', 'd'],
      hands: [
        [{ color: 'GREEN', type: 'DRAW' }],
        [{ color: 'BLUE', type: 'NUMBERED', number: 8 }],
        [{ type: 'WILD DRAW' }],
        [{ type: 'NUMBERED', color: 'YELLOW', number: 3}],
      ],
      drawPile: [{ type: 'NUMBERED', color: 'GREEN', number: 5 }, { type: 'WILD' }],
      discardPile: [{ type: 'NUMBERED', color: 'BLUE', number: 8}],
      currentColor: 'BLUE',
      currentDirection: 'clockwise',
      dealer: 3,
      playerInTurn: 0
    },
  }
  
  describe("while the round is still running", () => {
    const game = createGameFromMemento(memento) 
    const round = game.currentRound()!
    round.draw()
    test("no winner has been found", () => {
      expect(game.winner()).toBeUndefined()
    })
    test("the score is unchanged", () => {
      expect(game.score(0)).toBe(0)
      expect(game.score(1)).toBe(0)
      expect(game.score(2)).toBe(0)
      expect(game.score(3)).toBe(0)
    })
    test("the round is the same", () => {
      expect(game.currentRound()).toBe(round)
    })
  })
  describe("when the round is over", () => {
    const game = createGameFromMemento(memento) 
    const round = game.currentRound()!
    round.draw()
    round.play(0)
    test("the setup is as expected", () => {
      expect(round.hasEnded()).toBeTruthy()
      expect(round.winner()).toEqual(1)
      expect(round.score()).toEqual(78)
    })
    test("the game still has no winner", () => {
      expect(game.winner()).toBeUndefined()
    })
    test("the score is updated", () => {
      expect(game.score(0)).toBe(0)
      expect(game.score(1)).toBe(78)
      expect(game.score(2)).toBe(0)
      expect(game.score(3)).toBe(0)
    })
    test("a new round is started", () => {
      expect(game.currentRound()).not.toBe(round)
    })
  })
})

describe("ending the second round", () => {
  const memento: GameMemento = {
    cardsPerPlayer: 1,
    players: ['a', 'b', 'c', 'd'],
    targetScore: 200,
    scores: [0, 78, 0, 0],
    currentRound: {
      players: ['a', 'b', 'c', 'd'],
      hands: [
        [{ color: 'GREEN', type: 'NUMBERED', number: 8 }],
        [{ color: 'BLUE', type: 'DRAW' }],
        [{ type: 'WILD DRAW' }],
        [{ type: 'NUMBERED', color: 'YELLOW', number: 3}],
      ],
      drawPile: [{ type: 'NUMBERED', color: 'GREEN', number: 5 }, { type: 'WILD' }],
      discardPile: [{ type: 'NUMBERED', color: 'BLUE', number: 8}],
      currentColor: 'BLUE',
      currentDirection: 'clockwise',
      dealer: 3,
      playerInTurn: 0
    },
  }
  
  const game = createGameFromMemento(memento)
  const round2 = game.currentRound()!
  round2.play(0)

  test("the game still has no winner", () => {
    expect(game.winner()).toBeUndefined()
  })
  test("the score is updated", () => {
    expect(game.score(0)).toBe(73)
    expect(game.score(1)).toBe(78)
    expect(game.score(2)).toBe(0)
    expect(game.score(3)).toBe(0)
  })
  test("a new round is started", () => {
    expect(game.currentRound()).not.toBe(round2)
  })
})

describe("ending the third round", () => {
  const memento: GameMemento = {
    cardsPerPlayer: 1,
    players: ['a', 'b', 'c', 'd'],
    targetScore: 200,
    scores: [73, 78, 0, 0],
    currentRound: {
      players: ['a', 'b', 'c', 'd'],
      hands: [
        [{ color: 'BLUE', type: 'DRAW' }],
        [{ type: 'WILD DRAW' }],
        [{ color: 'GREEN', type: 'SKIP' }],
        [{ type: 'NUMBERED', color: 'YELLOW', number: 3}],
      ],
      drawPile: [{ type: 'WILD' }, { type: 'REVERSE', color: 'RED' }],
      discardPile: [{ type: 'NUMBERED', color: 'BLUE', number: 8}],
      currentColor: 'BLUE',
      currentDirection: 'clockwise',
      dealer: 3,
      playerInTurn: 0
    },
  }
  
  const game = createGameFromMemento(memento)
  const round3 = game.currentRound()!
  round3.play(0)

  test("player 0 won", () => {
    expect(game.winner()).toEqual(0)
  })
  test("the score is updated", () => {
    expect(game.score(0)).toBe(216)
    expect(game.score(1)).toBe(78)
    expect(game.score(2)).toBe(0)
    expect(game.score(3)).toBe(0)
  })
  test("a new round is not started", () => {
    expect(game.currentRound()).toBeUndefined()
  })
})  