import { describe, it, expect, beforeEach } from '@jest/globals'
import { createGameFromMemento } from '../utils/test_adapter'

const currentRoundMemento = {
  players: ['A', 'B', 'C'],
  hands: [
    [
      { type: 'WILD' },
      { type: 'DRAW', color: 'GREEN' },
    ], 
    [ { type: 'NUMBERED', color: 'RED', number: 7} ],
    [
      { type: 'SKIP', color: 'RED' },
    ],
  ],
  drawPile: [
    { type: 'WILD DRAW' }
  ],
  discardPile: [
    { type: 'NUMBERED', color: 'BLUE', number: 7 },
    { type: 'SKIP', color: 'BLUE' },
  ],
  currentColor: 'BLUE',
  currentDirection: 'clockwise',
  dealer: 2,
  playerInTurn: 1,
}  

const unoMemento = {
  players: ['A', 'B', 'C'],
  currentRound: currentRoundMemento,
  targetScore: 500,
  scores: [220, 430, 80],
  cardsPerPlayer: 7
}

describe("create unfinished game from valid memento", () => {
  let game = createGameFromMemento(unoMemento)
  beforeEach(() => { game = createGameFromMemento(unoMemento) })
  it("reads the players from the memento", () => {
    expect(game.player(0)).toEqual('A')
    expect(game.player(1)).toEqual('B')
    expect(game.player(2)).toEqual('C')
  })
  it("reads the round from the memento", () => {
    expect(game.currentRound()?.toMemento()).toEqual(currentRoundMemento)
  })
  it("reads the target score from the memento", () => {
    expect(game.targetScore).toEqual(500)
  })
  it("reads the scores from the memento", () => {
    expect(game.score(0)).toEqual(220)
    expect(game.score(1)).toEqual(430)
    expect(game.score(2)).toEqual(80)
  })
  it("doesn't declare a winner on an unfinished game", () => {
    expect(game.winner()).toBeUndefined()
  })
  it("updates on changes in the current round", () => {
    game.currentRound()?.play(0) // Last card from player 1
    expect(game.winner()).toEqual(1)
  })
})

describe("create game from invalid memento", () => {
  it("fails on too few players", () => {
    expect(() => createGameFromMemento({...unoMemento, players: ['A']})).toThrowError()
  })
  it("fails on 0 target score", () => {
    expect(() => createGameFromMemento({...unoMemento, targetScore: 0})).toThrowError()
  })
  it("fails on negative scores", () => {
    expect(() => createGameFromMemento({...unoMemento, scores: [220, 430, -80]})).toThrowError()
  })
  it("fails with fewer scores than players", () => {
    expect(() => createGameFromMemento({...unoMemento, scores: [220, 430]})).toThrowError()
  })
  it("fails on several winners", () => {
    expect(() => createGameFromMemento({...unoMemento, targetScore: 200})).toThrowError()
  })
  it("fails on missing current round in an unfinished game", () => {
    expect(() => createGameFromMemento({...unoMemento, currentRound: undefined})).toThrowError()
  })
})

const finishedUnoMemento = {
  players: ['A', 'B', 'C'],
  targetScore: 500,
  scores: [220, 530, 80],
  cardsPerPlayer: 7
}

describe("create unfinished game from valid memento", () => {
  let game = createGameFromMemento(finishedUnoMemento)
  it("doesn't have a current round on a finished game", () => {
    expect(game.currentRound()).toBeUndefined
  })
  it("reads the scores from the memento", () => {
    expect(game.score(0)).toEqual(220)
    expect(game.score(1)).toEqual(530)
    expect(game.score(2)).toEqual(80)
  })
  it("declares a winner on a finished game", () => {
    expect(game.winner()).toBeDefined()
  })
})


describe("toMemento", () => {
  it("an unfinished game returns the Memento used to create it", () => {
      const created = createGameFromMemento(unoMemento)
      expect(created.toMemento()).toEqual(unoMemento)
  })
  it("a finished game returns the Memento used to create it", () => {
      const created = createGameFromMemento(finishedUnoMemento)
      expect(created.toMemento()).toEqual(finishedUnoMemento)
  })
})
