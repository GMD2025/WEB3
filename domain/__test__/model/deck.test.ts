import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import { createInitialDeck, createDeckFromMemento as createDeckFromMemento } from '../utils/test_adapter'
import { standardShuffler } from '../../src/utils/random_utils'
import { is } from '../utils/predicates'
import * as deck from '../../src/model/deck'
import { memoizingShuffler } from '../utils/shuffling'

describe("Initial deck", () => {
  const initialDeck = createInitialDeck()
  it("contains 19 numbered blue cards", () => {
    expect(
      initialDeck
      .filter(is({type: 'NUMBERED', color: 'BLUE'}))
      .size)
    .toEqual(19)
  })
  it("contains 19 numbered green cards", () => {
    expect(
      initialDeck
      .filter(is({type: 'NUMBERED', color: 'GREEN'}))
      .size)
    .toEqual(19)
  })
  it("contains 19 numbered red cards", () => {
    expect(
      initialDeck
      .filter(is({type: 'NUMBERED', color: 'RED'}))
      .size)
    .toEqual(19)
  })
  it("contains 19 numbered yellow cards", () => {
    expect(
      initialDeck
      .filter(is({type: 'NUMBERED', color: 'YELLOW'}))
      .size)
    .toEqual(19)
  })
  it("only contains numbered card with numbers between 0 and 9", () => {
    const numberedDeck = initialDeck.filter(is({type: 'NUMBERED'}))
    while(numberedDeck.size > 0) {
      const n = (numberedDeck.deal() as {number: number}).number
      expect(n).toBeGreaterThanOrEqual(0)
      expect(n).toBeLessThan(10)
    }
  })
  it("contains numbered cards of every legal number and color", () => {
    for(let color of deck.colors) {
      expect(initialDeck.filter(is({number: 0, color})).size).toBe(1)
    }
  for(let number = 1; number < 10; number++) {
      for(let color of deck.colors) {
        expect(initialDeck.filter(is({number, color})).size).toBe(2)
      }
    }
  })
  it("contains 8 skip cards", () => {
    expect(initialDeck.filter(is({type: 'SKIP'})).size).toEqual(8)
  })
  it("contains 2 skip cards of each color", () => {
    for(let color of deck.colors) {
      expect(initialDeck.filter(is({type: 'SKIP', color})).size).toBe(2)
    }
  })
  it("contains 8 reverse cards", () => {
    expect(initialDeck.filter(is({type: 'REVERSE'})).size).toEqual(8)
  })
  it("contains 2 reverse cards of each color", () => {
    for(let color of deck.colors) {
      expect(initialDeck.filter(is({type: 'REVERSE', color})).size).toBe(2)
    }
  })
  it("contains 8 draw cards", () => {
    expect(initialDeck.filter(is({type: 'DRAW'})).size).toEqual(8)
  })
  it("contains 2 draw cards of each color", () => {
    for(let color of deck.colors) {
      expect(initialDeck.filter(is({type:'DRAW',color})).size).toBe(2)
    }
  })
  it("contains 4 wild cards", () => {
    expect(initialDeck.filter(is({type:'WILD'})).size).toEqual(4)
  })
  it("contains 4 wild draw cards", () => {
    expect(initialDeck.filter(is({ type:'WILD DRAW' })).size).toEqual(4)
  })
  // Blank cards skipped, since they have no gameplay
  it("contains 108 cards", () => {
    expect(initialDeck.size).toEqual(108)
  })
})

describe("Deck methods", () => {
  describe("shuffle", () => {
    const deck = createInitialDeck()
    it("calls the shuffler", () => {
      const mockShuffler = jest.fn()
      deck.shuffle(mockShuffler)
      expect(mockShuffler).toHaveBeenCalled()
    })
  })
  describe("deal", () => {
    let deck: deck.Deck = createInitialDeck()
    let shuffledCards: Readonly<deck.Card[]> = []
    const memoShuffler = memoizingShuffler(standardShuffler)
    beforeEach(() => {
      deck = createInitialDeck()
      deck.shuffle(memoShuffler.shuffler)
      shuffledCards = memoShuffler.memo
    })
    it("removes a card", () => {
      const deckSize = deck.size
      deck.deal()
      expect(deck.size).toEqual(deckSize - 1)
    })
    it("returns all cards in order", () => {
      const deckSize = deck.size
      for(let i = 0; i < deckSize; i++) {
        expect(deck.deal()).toEqual(shuffledCards[i])
      }
    })
    it("returns undefined if the deck is empty", () => {
      while(deck.size > 0) { 
        deck.deal() 
      }
      expect(deck.deal()).toBeUndefined()
    })
  })
})

describe('fromMemento', () => {
  describe('from valid Memnot', () => {
    it('returns a deck with all cards in order', () => {
      const cards: Record<string, string | number>[] = [
        { type: 'NUMBERED', color: 'BLUE', number: 7 },
        { type: 'SKIP', color: 'RED' },
        { type: 'REVERSE', color: 'GREEN' },
        { type: 'DRAW', color: 'YELLOW' },
        { type: 'WILD' },
        { type: 'WILD DRAW' }
      ]
      const created: deck.Deck = createDeckFromMemento(cards)
      let card = created.deal()!
      expect(card.type).toEqual('NUMBERED')
      expect(deck.hasColor(card, 'BLUE')).toBeTruthy()
      expect(deck.hasNumber(card, 7)).toBeTruthy()
      
      card = created.deal()!
      expect(card.type).toEqual('SKIP')
      expect(deck.hasColor(card, 'RED')).toBeTruthy()

      card = created.deal()!
      expect(card.type).toEqual('REVERSE')
      expect(deck.hasColor(card, 'GREEN')).toBeTruthy()

      card = created.deal()!
      expect(card.type).toEqual('DRAW')
      expect(deck.hasColor(card, 'YELLOW')).toBeTruthy()

      card = created.deal()!
      expect(card.type).toEqual('WILD')

      card = created.deal()!
      expect(card.type).toEqual('WILD DRAW')

      expect(created.deal()).toBeUndefined()
    })

    it("returns an empty deck on empty input", () => {
      const created: deck.Deck = createDeckFromMemento([])
      expect(created.size).toEqual(0)
    })
  })

  describe("from invalid Memento", () => {
    it("throws on invalid type", () => {
      expect(() => createDeckFromMemento([{type: 'wut?'}])).toThrowError()
    })
    it("throws on missing number on numbered type", () => {
      expect(() => createDeckFromMemento([{type: 'NUMBERED', color: 'BLUE'}])).toThrowError()
    })
    it("throws on missing color on numbered type", () => {
      expect(() => createDeckFromMemento([{type: 'NUMBERED', number: 7}])).toThrowError()
    })
    it("throws on missing color on skip type", () => {
      expect(() => createDeckFromMemento([{type: 'SKIP'}])).toThrowError()
    })
    it("throws on missing color on reverse type", () => {
      expect(() => createDeckFromMemento([{type: 'REVERSE'}])).toThrowError()
    })
    it("throws on missing color on draw type", () => {
      expect(() => createDeckFromMemento([{type: 'DRAW'}])).toThrowError()
    })
  })
})

describe("toMemento", () => {
  it("Returns the Memento used to create it", () => {
      const cards: Record<string, string | number>[] = [
        { type: 'NUMBERED', color: 'BLUE', number: 7 },
        { type: 'SKIP', color: 'RED' },
        { type: 'REVERSE', color: 'GREEN' },
        { type: 'DRAW', color: 'YELLOW' },
        { type: 'WILD' },
        { type: 'WILD DRAW' }
      ]
      const created = createDeckFromMemento(cards)
      expect(created.toMemento()).toEqual(cards)
  })
})
