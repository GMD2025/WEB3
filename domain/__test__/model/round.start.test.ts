import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import { createRound} from '../utils/test_adapter'
import { Card } from '../../src/model/deck'
import { Round } from '../../src/model/round'
import { createRoundWithShuffledCards as createRoundWithShuffledCards, shuffleBuilder, successiveShufflers } from '../utils/shuffling'

const normalShuffle = shuffleBuilder()
.discard()
.isnt({type: ['DRAW', 'REVERSE', 'SKIP', 'WILD', 'WILD DRAW']})
.build()

describe("Round set up", () => {
  const dealtCardsCount = 4 * 7
  let round: Round = undefined as any
  let cards: Readonly<Card[]> = []
  beforeEach(() => {
    [round, cards] = createRoundWithShuffledCards({shuffler: normalShuffle})
  })
  it("has as many players as set in the properties", () => {
    expect(round.playerCount).toBe(4)
  })
  it("has the players set in the properties", () => {
    expect(round.player(0)).toBe('a')
    expect(round.player(1)).toBe('b')
    expect(round.player(2)).toBe('c')
    expect(round.player(3)).toBe('d')
  })
  it("requires at least 2 players", () => {
    expect(() => createRound({players: ['a'], dealer: 1})).toThrow()
  })
  it("allows at most 10 players", () => {
    expect(() => createRound({players: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11'], dealer: 1})).toThrow()
  })
  it("requires player index to be in bounds", () => {
    expect(() => round.player(-1)).toThrow()
    expect(() => round.player(4)).toThrow()
  })
  it("selects dealer set in the properties", () => {
    expect(round.dealer).toBe(1)
  })
  it("shuffles the deck", () => {
    const mockShuffler = jest.fn()
    createRound({players: ['a', 'b', 'c', 'd'], dealer: 1, shuffler: mockShuffler})
    expect(mockShuffler).toBeCalledTimes(1)
  })
  it("deals 7 cards to each player", () => {
    expect(round.playerHand(0).length).toBe(7)
    expect(round.playerHand(1).length).toBe(7)
    expect(round.playerHand(2).length).toBe(7)
    expect(round.playerHand(3).length).toBe(7)
  })
  it("deals 7 cards to each player from the top of the deck", () => {
    [round, cards] = createRoundWithShuffledCards({dealer: 3, shuffler: normalShuffle})
    for(let playerIndex = 0; playerIndex < round.playerCount; playerIndex++) {
      round.playerHand(playerIndex).forEach((card, index) => expect(card).toEqual(cards[7 * playerIndex + index]))
    }
  })
  it("returns consistent hands", () => {
    expect(round.playerHand(0)).toBe(round.playerHand(0))
  })
  it("creates a discard pile with the top card", () => {
    const undealtCards = cards.slice(dealtCardsCount)  
    expect(round.discardPile().size).toEqual(1)
    expect(round.discardPile().top()).toEqual(undealtCards[0])  
  })
  it("keeps the undealt cards in the draw pile", () => {
    const undealtCards = cards.slice(dealtCardsCount)    
    for(let i = 1; i < undealtCards.length; i++) {
      expect(round.drawPile().deal()).toEqual(undealtCards[i])
    }
  })
  it("reshuffles if the top of the discard pile is a wild card", () => {
    const wildOnDiscardTop = shuffleBuilder().discard().is({type: 'WILD'}).build()
    const wildNotOnTop = shuffleBuilder().top().isnt({type: ['WILD', 'WILD DRAW']}).build()
    const mockShuffler = jest.fn(wildNotOnTop)
    const shuffler = successiveShufflers(wildOnDiscardTop, mockShuffler)
    createRound({players: ['a', 'b', 'c', 'd'], dealer: 1, shuffler})
    expect(mockShuffler).toBeCalledTimes(1)
  })
  it("keeps shuffling as long as the top of the discard pile is a wild card", () => {
    const wildOnDiscardTop = shuffleBuilder().discard().is({type: 'WILD'}).build()
    const wildOnTop = shuffleBuilder().top().is({type: 'WILD'}).build()
    const wildNotOnTop = shuffleBuilder().top().isnt({type: ['WILD', 'WILD DRAW']}).build()
    const mockShuffler = jest.fn(wildNotOnTop)
    const shuffler = successiveShufflers(wildOnDiscardTop, wildOnTop, mockShuffler)
    createRound({players: ['a', 'b', 'c', 'd'], dealer: 1, shuffler})
    expect(mockShuffler).toBeCalledTimes(1)
  })
  it("reshuffles if the top of the discard pile is a wild draw 4 card", () => {
    const wildDrawOnDiscardTop = shuffleBuilder().discard().is({type: 'WILD DRAW'}).build()
    const wildNotOnTop = shuffleBuilder().top().isnt({type: ['WILD', 'WILD DRAW']}).build()
    const mockShuffler = jest.fn(wildNotOnTop)
    const shuffler = successiveShufflers(wildDrawOnDiscardTop, mockShuffler)
    createRound({players: ['a', 'b', 'c', 'd'], dealer: 1, shuffler})
    expect(mockShuffler).toBeCalledTimes(1)
  })
})

describe("Before first action in round", () => {
  it("begins with the player to the left of the dealer unless the top card is draw, reverse or skip", () => {
    const round: Round = createRound({players: ['a', 'b', 'c', 'd'], dealer: 1, shuffler: normalShuffle})
    expect(round.playerInTurn()).toBe(2)
  })
  it("rolls over if the dealer is the last player", () => {
    const round: Round = createRound({players: ['a', 'b', 'c', 'd'], dealer: 3, shuffler: normalShuffle})
    expect(round.playerInTurn()).toBe(0)
  })
  it("begins with the player to the right of the dealer if the top card is reverse", () => {
    const shuffler = shuffleBuilder().discard().is({type: 'REVERSE'}).build()
    const round: Round = createRound({players: ['a', 'b', 'c', 'd'], dealer: 1, shuffler})
    expect(round.playerInTurn()).toBe(0)
  })
  it("rolls over if dealer is the first player and the top card is reverse", () => {
    const shuffler = shuffleBuilder().discard().is({type: 'REVERSE'}).build()
    const round: Round = createRound({players: ['a', 'b', 'c', 'd'], dealer: 0, shuffler})
    expect(round.playerInTurn()).toBe(3)
  })
  it("begins with the player two places to the left of the dealer if the top card is skip", () => {
    const shuffler = shuffleBuilder().discard().is({type: 'SKIP'}).build()
    const round: Round = createRound({players: ['a', 'b', 'c', 'd'], dealer: 1, shuffler})
    expect(round.playerInTurn()).toBe(3)
  })
  it("adds 2 cards to the round of the first player if the top card is draw", () => {
    const shuffler = shuffleBuilder().discard().is({type: 'DRAW'}).build()
    const round: Round = createRound({players: ['a', 'b', 'c', 'd'], dealer: 1, shuffler})
    expect(round.playerHand(2).length).toBe(9)
  })
})
