import { describe, it, test, expect, beforeEach, jest } from '@jest/globals'
import { createRound, createRoundFromMemento} from '../utils/test_adapter'
import { Round } from '../../src/model/round'
import { shuffleBuilder } from '../utils/shuffling'
import { is } from '../utils/predicates'
import { standardShuffler } from '../../src/utils/random_utils'

describe("Playing a card", () => {
  it("throws on illegal plays", () => {
    const shuffler = shuffleBuilder()
      .discard()
        .is({type: 'NUMBERED', color: 'BLUE', number: 6})
      .hand(0)
        .is({type: 'NUMBERED', color: 'RED', number: 3})
      .build()
    const round: Round = createRound({players: ['a', 'b', 'c', 'd'], dealer: 3, shuffler})
    expect(() => round.play(0)).toThrow()
  })

  describe("Playing a numbered card", () => {
    let round: Round = undefined as any
    beforeEach(() => {
      const builder = shuffleBuilder()
        .discard()
          .is({type: 'NUMBERED', color: 'BLUE', number: 6})
        .hand(0)
          .is({type: 'NUMBERED', color: 'BLUE', number: 3})
      round = createRound({players: ['a', 'b', 'c', 'd'], dealer: 3, shuffler: builder.build()})
    })
    it("removes the card from the players hand", () => {
      round.play(0)
      expect(round.playerHand(0).length).toEqual(6)
    })
    it("places the card on the discard pile", () => {
      const card = round.play(0)
      expect(round.discardPile().top()).toEqual(card)
    })
    it("moves the action to the next hand", () => {
      expect(round.playerInTurn()).toEqual(0)
      round.play(0)
      expect(round.playerInTurn()).toEqual(1)
    })
    it("changes color to the played color", () => {
      const shuffler = (shuffleBuilder()
        .discard()
          .is({ type: 'NUMBERED', color: 'BLUE', number: 6 })
        .hand(0)
          .is({ type: 'NUMBERED', color: 'RED', number: 6 })
        .hand(1)
          .is({ color: 'RED' }))
        .build()
      const round: Round = createRound({players: ['a', 'b', 'c', 'd'], dealer: 3, shuffler})
      round.play(0)
      expect(round.canPlay(0)).toBeTruthy()
    })
  })

  describe("Playing a skip card", () => {
    it("skips the next player", () => {
      const shuffler = shuffleBuilder()
        .discard()
          .is({type: 'NUMBERED', color: 'BLUE', number: 6})
        .hand(0)
          .is({type: 'SKIP', color: 'BLUE'})
        .build()
      const round: Round = createRound({players: ['a', 'b', 'c', 'd'], dealer: 3, shuffler})
      expect(round.playerInTurn()).toEqual(0)
      round.play(0)
      expect(round.playerInTurn()).toEqual(2)
    })
  })

  describe("Playing a reverse card", () => {
    let builder = shuffleBuilder()
    beforeEach(() => {
      builder = shuffleBuilder()
        .discard()
          .is({type: 'NUMBERED', color: 'BLUE', number: 6})
        .hand(0)
          .is({type: 'REVERSE', color: 'BLUE'})
    })
    it("reverses the direction of play", () => {
      const round = createRound({players: ['a', 'b', 'c', 'd'], dealer: 3, shuffler: builder.build()})
      expect(round.playerInTurn()).toEqual(0)
      round.play(0)
      expect(round.playerInTurn()).toEqual(3)
    })
    it("makes the reversing persistent", () => {
      builder.hand(3).is({type: 'NUMBERED', color: 'BLUE'})
      const round = createRound({players: ['a', 'b', 'c', 'd'], dealer: 3, shuffler: builder.build()})
      expect(round.playerInTurn()).toEqual(0)
      round.play(0)
      round.play(0)
      expect(round.playerInTurn()).toEqual(2)
    })
    it("reverses the reversing", () => {
      builder
        .hand(3)
          .is({type: 'NUMBERED', color: 'BLUE'})
        .hand(2)
          .is({type: 'REVERSE', color: 'BLUE'})
        const round = createRound({players: ['a', 'b', 'c', 'd'], dealer: 3, shuffler: builder.build()})
        expect(round.playerInTurn()).toEqual(0)
      round.play(0)
      round.play(0)
      round.play(0)
      expect(round.playerInTurn()).toEqual(3)
    })
  })

  describe("Playing a draw card", () => {
    let round: Round = undefined as any
    beforeEach(() => {
      const builder = shuffleBuilder()
        .discard()
          .is({type: 'NUMBERED', color: 'BLUE', number: 6})
        .hand(0)
          .is({type: 'DRAW', color: 'BLUE'})
      round = createRound({players: ['a', 'b', 'c', 'd'], dealer: 3, shuffler: builder.build()})
    })
    it("skips the next player", () => {
      expect(round.playerInTurn()).toEqual(0)
      round.play(0)
      expect(round.playerInTurn()).toEqual(2)
    })
    it("gives the next player 2 cards", () => {
      round.play(0)
      expect(round.playerHand(1).length).toEqual(9)
    })
    it("takes the 2 cards from the draw pile", () => {
      const pileSize = round.drawPile().size
      round.play(0)
      expect(round.drawPile().size).toEqual(pileSize - 2)
    })
  })

  describe("Playing a wild card", () => {
    let builder = shuffleBuilder()
    beforeEach(() => {
      builder = shuffleBuilder()
        .discard()
          .is({type: 'NUMBERED', color: 'BLUE', number: 6})
        .hand(0)
          .is({type: 'WILD'})
    })
    it("moves the action to the next hand", () => {
      const round: Round = createRound({players: ['a', 'b', 'c', 'd'], dealer: 3, shuffler: builder.build()})
      expect(round.playerInTurn()).toEqual(0)
      round.play(0, 'RED')
      expect(round.playerInTurn()).toEqual(1)
    })
    it("changes color to the chosen color", () => {
      builder.hand(1).is({color: 'RED'})
      const round: Round = createRound({players: ['a', 'b', 'c', 'd'], dealer: 3, shuffler: builder.build()})
      round.play(0, 'RED')
      expect(round.canPlay(0)).toBeTruthy()
    })
  })

  describe("Playing a wild draw card", () => {
    let builder = shuffleBuilder()
    beforeEach(() => {
      builder = shuffleBuilder()
        .discard()
          .is({type: 'NUMBERED', color: 'BLUE', number: 6})
        .hand(0)
          .is({type: 'WILD DRAW'})
        .repeat(6).isnt({color: 'BLUE'})
    })
    it("skips the next player", () => {
      const shuffler = builder.build()
      const round: Round = createRound({players: ['a', 'b', 'c', 'd'], dealer: 3, shuffler})
      expect(round.playerInTurn()).toEqual(0)
      round.play(0, 'RED')
      expect(round.playerInTurn()).toEqual(2)
    })
    it("gives the next player 4 cards", () => {
      const shuffler = builder.build()
      const round: Round = createRound({players: ['a', 'b', 'c', 'd'], dealer: 3, shuffler})
      round.play(0, 'RED')
      expect(round.playerHand(1).length).toEqual(11)
    })
    it("takes the 4 cards from the draw pile", () => {
      const shuffler = builder.build()
      const round: Round = createRound({players: ['a', 'b', 'c', 'd'], dealer: 3, shuffler})
      const pileSize = round.drawPile().size
      round.play(0, 'RED')
      expect(round.drawPile().size).toEqual(pileSize - 4)
    })
    it("changes color to the chosen color", () => {
      builder.hand(2).is({color: 'RED'})
      const shuffler = builder.build()
      const round: Round = createRound({players: ['a', 'b', 'c', 'd'], dealer: 3, shuffler})
      round.play(0, 'RED')
      expect(round.canPlay(0)).toBeTruthy()
    })
  })

  describe("Boundaries", () => {
    it("is illegal to play a non-existant card", () => {
      const round = createRound({players: ['a', 'b', 'c', 'd'], dealer: 3}) 
      expect(() => round.play(-1)).toThrow()
      expect(() => round.play(7)).toThrow()
    })
    it("is illegal to name a color on a colored card", () => {
      const shuffler = shuffleBuilder()
        .discard()
          .is({type: 'NUMBERED', color: 'BLUE'})
        .hand(0)
          .is({color: 'BLUE'})
        .build()
      const round: Round = createRound({players: ['a', 'b', 'c', 'd'], dealer: 3, shuffler})
      expect(() => round.play(0, "YELLOW")).toThrow()
    })
    it("is illegal _not_ to name a color on a wild card", () => {
      const shuffler = shuffleBuilder()
        .discard()
          .is({type: 'NUMBERED', color: 'BLUE'})
        .hand(0)
          .is({type: 'WILD'})
        .build()
      const round: Round = createRound({players: ['a', 'b', 'c', 'd'], dealer: 3, shuffler})
      expect(() => round.play(0)).toThrow()
    })
    it("is illegal _not_ to name a color on a wild draw card", () => {
      const shuffler = shuffleBuilder()
        .discard()
          .is({type: 'NUMBERED', color: 'BLUE'})
        .hand(0)
          .is({type: 'WILD DRAW'})
          .repeat(6).isnt({color: 'BLUE'})
        .build()
      const round: Round = createRound({players: ['a', 'b', 'c', 'd'], dealer: 3, shuffler})
      expect(() => round.play(0)).toThrow()
    })
  })
})

describe("Drawing a card", () => {
  describe("can play any", () => {
    it("returns true if the player has a playable card", () => {
      const shuffler = shuffleBuilder()
        .discard()
          .is({type: 'NUMBERED', color: 'BLUE'})
        .hand(0)
          .is({color: 'BLUE'})
        .build()
      const round: Round = createRound({players: ['a', 'b', 'c', 'd'], dealer: 3, shuffler})
      expect(round.canPlayAny()).toBeTruthy()
    })
    it("returns false if the player has a playable card", () => {
      const shuffler = shuffleBuilder()
        .discard()
          .is({type: 'NUMBERED', color: 'BLUE', number: 0})
        .hand(0)
          .is({type: 'NUMBERED', color: 'RED', number: 1})
          .is({type: 'NUMBERED', color: 'YELLOW', number: 2})
          .is({type: 'NUMBERED', color: 'RED', number: 3})
          .is({type: 'NUMBERED', color: 'GREEN', number: 4})
          .is({type: 'SKIP', color: 'RED'})
          .is({type: 'REVERSE', color: 'GREEN'})
          .is({type: 'DRAW', color: 'YELLOW'})
        .build()
      const round: Round = createRound({players: ['a', 'b', 'c', 'd'], dealer: 3, shuffler})
      expect(round.canPlayAny()).toBeFalsy()
    })
  })

  describe("draw", () => {
    let builder = shuffleBuilder()
    beforeEach(() => {
      builder = shuffleBuilder()
      .discard()
        .is({type: 'NUMBERED', color: 'BLUE', number: 0})
      .hand(0)
        .is({type: 'NUMBERED', color: 'RED', number: 1})
        .is({type: 'NUMBERED', color: 'YELLOW', number: 2})
        .is({type: 'NUMBERED', color: 'RED', number: 3})
        .is({type: 'NUMBERED', color: 'GREEN', number: 4})
        .is({type: 'SKIP', color: 'RED'})
        .is({type: 'REVERSE', color: 'GREEN'})
        .is({type: 'DRAW', color: 'YELLOW'})    
    })
    it("adds the drawn card to the hand", () => {
      const shuffler = builder.build()
      const round = createRound({players: ['a', 'b', 'c', 'd'], dealer: 3, shuffler})
      round.draw()
      expect(round.playerHand(0).length).toEqual(8)
    })
    it("adds the top of the draw pile to the end of the hand", () => {
      const shuffler = builder
        .drawPile().is({type: 'DRAW', color: 'GREEN'})
        .build()
      const round = createRound({players: ['a', 'b', 'c', 'd'], dealer: 3, shuffler})
      round.draw()
      expect(
        is({type: 'DRAW', color: 'GREEN'})(round.playerHand(0).at(7))
      ).toBeTruthy()
    })
    it("moves to the next player if the card is unplayable", () => {
      const shuffler = builder
        .drawPile().is({type: 'DRAW', color: 'GREEN'})
        .build()
      const round = createRound({players: ['a', 'b', 'c', 'd'], dealer: 3, shuffler})
      round.draw()
      expect(round.playerInTurn()).toBe(1)
    })
    it("doesn't move to the next player if the card is unplayable", () => {
      const shuffler = builder
        .drawPile().is({type: 'DRAW', color: 'BLUE'})
        .build()
      const round = createRound({players: ['a', 'b', 'c', 'd'], dealer: 3, shuffler})
      round.draw()
      expect(round.playerInTurn()).toBe(0)
    })
  })

  describe("drawing the last card", () => {
    const memento = {
      players: ['a', 'b', 'c', 'd'],
      hands: [
        [{type: 'NUMBERED', color: 'GREEN', number: 4}],
        [{type: 'WILD'}],
        [{type: 'NUMBERED', color: 'GREEN', number: 8}],
        [{type: 'NUMBERED', color: 'GREEN', number: 0}],
      ],
      drawPile: [{type: 'NUMBERED', color: 'YELLOW', number: 3}],
      discardPile: [{type: 'SKIP', color: 'BLUE'}, {type: 'NUMBERED', color: 'BLUE', number: 8}],
      currentColor: 'BLUE',
      currentDirection: 'clockwise',
      dealer: 3,
      playerInTurn: 2
    }
    let mockShuffler = jest.fn(standardShuffler)
    let round: Round = createRoundFromMemento(memento, mockShuffler)
    const top = round.discardPile().top()
    beforeEach(() => {
      mockShuffler = jest.fn(standardShuffler)
      round = createRoundFromMemento(memento, mockShuffler)
      round.draw() // Drawing an unplayable card and emptying the draw pile
    })
    it("shuffles to create a new draw pile", () => {
      expect(mockShuffler).toHaveBeenCalledTimes(1)
    })
    it("retains the top card of the discard pile", () => {
      expect(round.discardPile().top()).toEqual(top)
    })
    it("leaves only the top card in the discard pile", () => {
      expect(round.discardPile().size).toEqual(1)
    })
    it("adds cards in the draw pile", () => {
      expect(round.drawPile().size).toEqual(1)
    })
    it("leaves the cards removed from the discard pile in the draw pile", () => {
      expect(is({type: 'NUMBERED', color: 'BLUE', number: 8})(round.drawPile().peek())).toBeTruthy()
    })
  })

  describe("when drawing because of a card", () => {
    const memento = {
      players: ['a', 'b', 'c', 'd'],
      hands: [
        [{type: 'NUMBERED', color: 'GREEN', number: 4}],
        [{type: 'REVERSE', color: 'GREEN'}, {type: 'DRAW', color: 'BLUE'}],
        [{type: 'NUMBERED', color: 'GREEN', number: 8}],
        [{type: 'NUMBERED', color: 'GREEN', number: 0}],
      ],
      drawPile: [{type: 'NUMBERED', color: 'GREEN', number: 0}],
      discardPile: [{type: 'NUMBERED', color: 'BLUE', number: 3}, {type: 'NUMBERED', color: 'BLUE', number: 8}],
      currentColor: 'BLUE',
      currentDirection: 'clockwise',
      dealer: 3,
      playerInTurn: 1
    }
    const round = createRoundFromMemento(memento)
    round.play(1)
    expect(round.playerHand(2).length).toEqual(3)
    expect(round.discardPile().size).toEqual(1)
    expect(round.drawPile().size).toEqual(1)
  })
})

describe("special 2-player rules", () => {
  test("playing a reverse card works as a skip card", () => {
    const shuffler = shuffleBuilder({players: 2, cardsPerPlayer: 7})
      .discard().is({type:'NUMBERED', color: 'BLUE'})
      .hand(0).is({type: 'REVERSE', color: 'BLUE'})
      .build()
    const round = createRound({players: ['a', 'b'], dealer: 1, shuffler})
    expect(round.playerInTurn()).toEqual(0)
    round.play(0)
    expect(round.playerInTurn()).toEqual(0)
  })
})