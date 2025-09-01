import { describe, it, expect, beforeEach } from '@jest/globals'
import { Round } from '../../src/model/round'
import { is } from '../utils/predicates'
import { createRoundFromMemento } from '../utils/test_adapter'

const memento = {
  players: ['A', 'B', 'C'],
  hands: [
    [
      { type: 'WILD' },
      { type: 'DRAW', color: 'GREEN' },
    ], 
    [
      { type: 'REVERSE', color: 'GREEN' },
    ],
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
  playerInTurn: 0      
}

describe("create round from valid memento", () => {
  let round: Round = createRoundFromMemento(memento)
  beforeEach(() => { round = createRoundFromMemento(memento) })

  it("reads the players from the memento", () => {
    expect(round.player(0)).toEqual('A')
    expect(round.player(1)).toEqual('B')
    expect(round.player(2)).toEqual('C')
  })
  it("reads the hands from the memento", () => {
    expect(round.playerHand(0).length).toEqual(2)
    expect(is({ type: 'WILD' })(round.playerHand(0).at(0))).toBeTruthy()
    expect(is({ type: 'DRAW', color: 'GREEN' })(round.playerHand(0).at(1))).toBeTruthy()

    expect(round.playerHand(1).length).toEqual(1)
    expect(is({ type: 'REVERSE', color: 'GREEN' })(round.playerHand(1).at(0))).toBeTruthy()
    
    expect(round.playerHand(2).length).toEqual(1)
    expect(is({ type: 'SKIP', color: 'RED' })(round.playerHand(2).at(0))).toBeTruthy()
  })
  it("reads the draw pile from the memento", () => {
    expect(is({type: 'WILD DRAW'})(round.drawPile().deal())).toBeTruthy()
    expect(round.drawPile().size).toEqual(0)
  })
  it("reads the discard pile from the memento", () => {
    expect(is({type: 'NUMBERED', color: 'BLUE', number: 7})(round.discardPile().top())).toBeTruthy()
    expect(round.discardPile().size).toEqual(2)
  })
  it("deduces the player count from the number of hands", () => {
    expect(round.playerCount).toEqual(3)
  })
  it("has the dealer from the memento", () => {
    expect(round.dealer).toEqual(2)
  })
  it("has the player in turn from the memento", () => {
    expect(round.playerInTurn()).toEqual(0)
  })
  it("has the current color from the memento", () => {
    expect(round.canPlay(1)).toBeFalsy()
  })
  describe("direction from memento", () => {
    it("proceeds to the next higher-numbered player (or player 0) if currentDirection is 'clockwise'", () => {
      round.play(0, 'YELLOW') // The wild card
      expect(round.playerInTurn()).toEqual(1)
    })
    it("proceeds to the next lower-numbered player (or highest-numbered) otherwise", () => {
      const memento = {
        players: ['A', 'B', 'C'],
        hands: [
          [
            { type: 'WILD' },
            { type: 'DRAW', color: 'YELLOW' },
          ], 
          [
            { type: 'REVERSE', color: 'GREEN' },
          ],
          [
            { type: 'SKIP', color: 'RED' },
          ],
        ],
        drawPile: [
          { type: 'WILD DRAW' }
        ],
        discardPile: [
          { type: 'NUMBERED', color: 'BLUE', number: 7 },
          { type: 'SKIP', color: 'RED' },
        ],
        currentColor: 'BLUE',
        currentDirection: 'counterclockwise',
        dealer: 2,
        playerInTurn: 0      
      }
      round = createRoundFromMemento(memento)
      round.play(0, 'YELLOW') // The wild card
      expect(round.playerInTurn()).toEqual(2)
    })
  })
})

describe("create finished round from memento", () => {
  it("needs a playerInTurn if the game isn't finished", () => {
    expect(() => createRoundFromMemento({...memento, playerInTurn: undefined})).toThrowError()
  })
  it("doesn't need a playerInTurn if the game is finished", () => {
    const hands =  [
      [
      ], 
      [
        { type: 'REVERSE', color: 'GREEN' },
      ],
      [
        { type: 'SKIP', color: 'RED' },
      ],
    ]
    expect(createRoundFromMemento({...memento, hands, playerInTurn: undefined}).playerInTurn()).toBeUndefined()
  })
})

describe("create round from invalid memento", () => {
  it("throws fewer hands than players", () => {
    expect(() => createRoundFromMemento({
      ...memento, 
        players: ['A', 'B', 'C'],
        hands: [
          [
            { type: 'WILD' },
            { type: 'DRAW', color: 'YELLOW' },
          ], 
          [
            { type: 'REVERSE', color: 'GREEN' },
          ],
        ],
    })).toThrowError()
  })
  it("throws less than 2 players", () => {
    expect(() => createRoundFromMemento({
      ...memento, 
        players: ['A'],
        hands: [
          [
            { type: 'WILD' },
            { type: 'DRAW', color: 'YELLOW' },
          ], 
        ],
    })).toThrowError()
  })
  it("throws on 2 winners", () => {
    expect(() => createRoundFromMemento({
      ...memento, 
      hands: [[], [], [{type: 'WILD'}]]
    })).toThrowError()
  })
  it("throws on empty discard pile", () => {
    expect(() => createRoundFromMemento({
      ...memento, 
      discardPile: []
    })).toThrowError()
  })
  it("throws on non-color 'currentColor'", () => {
    expect(() => createRoundFromMemento({
      ...memento, 
      currentColor: 'BLEU'})).toThrowError()
  })
  it("throws on inconsistent 'currentColor'", () => {
    expect(() => createRoundFromMemento({
      ...memento, 
      discardPile: [{type: 'SKIP', color: 'RED'}],
      currentColor: 'BLUE'})).toThrowError()
  })
  it("throws on negative dealer", () => {
        expect(() => createRoundFromMemento({
      ...memento, 
      dealer: -1})).toThrowError()
  })
  it("throws on out of bounds dealer", () => {
        expect(() => createRoundFromMemento({
      ...memento, 
      dealer: 3})).toThrowError()
  })
  it("throws on negative 'playerInTurn'", () => {
        expect(() => createRoundFromMemento({
      ...memento, 
      playerInTurn: -1})).toThrowError()
  })
  it("throws on out of bounds 'playerInTurn'", () => {
        expect(() => createRoundFromMemento({
      ...memento, 
      playerInTurn: 3})).toThrowError()
  })
})


describe("toMemento", () => {
  it("Returns the Memento used to create it", () => {
      const created = createRoundFromMemento(memento)
      expect(created.toMemento()).toEqual(memento)
  })
})
