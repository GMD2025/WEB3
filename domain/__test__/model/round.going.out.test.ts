import { describe, it, test, expect, beforeEach } from '@jest/globals'
import { createRound, createRoundFromMemento} from '../utils/test_adapter'
import { Round } from '../../src/model/round'
import { shuffleBuilder } from '../utils/shuffling'

describe('catching failure to say "UNO!"', () => {
  describe("single UNO scenario", () => {
    const memento = {
      players: ['a', 'b', 'c', 'd'],
      hands: [
        [{type: 'NUMBERED', color: 'GREEN', number: 3}, {type: 'WILD'}],
        [{type: 'REVERSE', color: 'GREEN'}, {type: 'DRAW', color: 'BLUE'}],
        [{type: 'NUMBERED', color: 'GREEN', number: 8}, {type: 'NUMBERED', color: 'GREEN', number: 0}],
        [{type: 'NUMBERED', color: 'GREEN', number: 0}, {type: 'NUMBERED', color: 'RED', number: 5}],
      ],
      drawPile: [
        {type: 'NUMBERED', color: 'BLUE', number: 0}, 
        {type: 'NUMBERED', color: 'RED', number: 2},
        {type: 'NUMBERED', color: 'RED', number: 3},
        {type: 'DRAW', color: 'RED'},
        {type: 'NUMBERED', color: 'RED', number: 5}],
      discardPile: [{type: 'NUMBERED', color: 'BLUE', number: 3}, {type: 'NUMBERED', color: 'BLUE', number: 8}],
      currentColor: 'BLUE',
      currentDirection: 'clockwise',
      dealer: 3,
      playerInTurn: 0
    }
    let round: Round = createRoundFromMemento(memento)
    beforeEach(() => { round = createRoundFromMemento(memento) })
    it("fails if the player hasn't played penultimate card", () => {
      expect(round.catchUnoFailure({accuser: 1, accused: 0})).toBeFalsy()
    })
    it("succeeds if the player has one card and hasn't said 'UNO!'", () => {
      round.play(0)
      expect(round.catchUnoFailure({accuser: 1, accused: 0})).toBeTruthy()
    })
    it("adds 4 cards to the hand of the accused player if successful", () => {
      round.play(0)
      round.catchUnoFailure({accuser: 1, accused: 0})
      expect(round.playerHand(0).length).toBe(5)
    })
    it("takes the added cards from the draw pile", () => {
      round.play(0)
      const drawPileSize = round.drawPile().size
      round.catchUnoFailure({accuser: 1, accused: 0})
      expect(round.drawPile().size).toBe(drawPileSize - 4)
    })
    it("succeeds irrespective of the accuser", () => {
      round.play(0)
      expect(round.catchUnoFailure({accuser: 2, accused: 0})).toBeTruthy()
    })
    it("fails if the next player has already played", () => {
      round.play(0)
      round.play(0)
      expect(round.catchUnoFailure({accuser: 3, accused: 0})).toBeFalsy()
    })
    it("fails if the next player has drawn a card", () => {
      round.play(0)
      round.draw()
      expect(round.catchUnoFailure({accuser: 3, accused: 0})).toBeFalsy()
    })
    it("cannot be applied twice", () => {
      round.play(0)
      expect(round.catchUnoFailure({accuser: 2, accused: 0})).toBeTruthy()
      expect(round.catchUnoFailure({accuser: 2, accused: 0})).toBeFalsy()
    })
    it("can succeed after first accusing the wrong player", () => {
      round.play(0)
      expect(round.catchUnoFailure({accuser: 2, accused: 1})).toBeFalsy()
      expect(round.catchUnoFailure({accuser: 2, accused: 0})).toBeTruthy()
    })
    it("fails if the accused has said 'UNO!' before playing", () => {
      round.sayUno(0)
      round.play(0)
      expect(round.catchUnoFailure({accuser: 2, accused: 0})).toBeFalsy()
    })
    it("fails if the accused has said 'UNO!' after playing but before the accusation", () => {
      round.play(0)
      round.sayUno(0)
      expect(round.catchUnoFailure({accuser: 2, accused: 0})).toBeFalsy()
    })
    it("still succeeds if the player has said 'UNO!' before another player draws", () => {
      const shuffler = builder.build()
      round = createRound({players: ['a', 'b', 'c', 'd'], dealer: 3, shuffler, cardsPerPlayer: 2})
      round.draw()
      round.play(round.playerHand(0).length - 1)
      round.draw()
      round.draw()
      round.sayUno(0) // player 3 is in turn
      round.draw()
      round.play(0)
      expect(round.catchUnoFailure({accuser: 1, accused: 0})).toBeTruthy()    
    })

    
  })

  const builder = shuffleBuilder({players: 4, cardsPerPlayer: 2})
    .discard().is({type: 'NUMBERED', color: 'YELLOW', number: 0})
    .drawPile()
      .is({type: 'NUMBERED', color: 'BLUE', number: 0})
      .is({type: 'NUMBERED', color: 'RED', number: 2})
      .is({type: 'NUMBERED', color: 'RED', number: 3})
      .is({type: 'NUMBERED', color: 'RED', number: 5})
    .hand(0).is({type: 'NUMBERED', color: 'BLUE', number: 8}, {type: 'SKIP', color: 'BLUE'})
    .hand(1).is({type: 'NUMBERED', color: 'RED', number: 8}, {type: 'SKIP', color: 'GREEN'})
    .hand(2).is({type: 'NUMBERED', color: 'GREEN', number: 8}, {type: 'DRAW', color: 'RED'})
    .hand(3).is({type: 'NUMBERED', color: 'RED', number: 4}, {type: 'REVERSE', color: 'RED'})

  describe("emptying the draw pile", () => {
    const memento = {
      players: ['a', 'b', 'c', 'd'],
      hands: [
        [{type: 'NUMBERED', color: 'GREEN', number: 3}, {type: 'WILD'}],
        [{type: 'REVERSE', color: 'GREEN'}, {type: 'DRAW', color: 'BLUE'}],
        [{type: 'NUMBERED', color: 'GREEN', number: 8}, {type: 'NUMBERED', color: 'GREEN', number: 0}],
        [{type: 'NUMBERED', color: 'GREEN', number: 0}, {type: 'NUMBERED', color: 'RED', number: 5}],
      ],
      drawPile: [
        {type: 'NUMBERED', color: 'BLUE', number: 0}, 
        {type: 'DRAW', color: 'RED'},
        {type: 'NUMBERED', color: 'RED', number: 5}],
      discardPile: [{type: 'NUMBERED', color: 'BLUE', number: 3}, {type: 'NUMBERED', color: 'BLUE', number: 8}, {type: 'NUMBERED', color: 'RED', number: 8}],
      currentColor: 'BLUE',
      currentDirection: 'clockwise',
      dealer: 3,
      playerInTurn: 0
    }
    let round: Round = createRoundFromMemento(memento)
    beforeEach(() => { round = createRoundFromMemento(memento) })
    test("adding 4 cards to the hand shuffles the draw pile if necessary", () => {
      round.play(0)
      expect(round.drawPile().size).toEqual(3)
      expect(round.discardPile().size).toEqual(4)
      round.catchUnoFailure({accuser: 1, accused: 0})
      expect(round.playerHand(0).length).toBe(5)
      expect(round.drawPile().size).toEqual(2)
      expect(round.discardPile().size).toEqual(1)
    })
  })

  describe("Multi UNO scenario", () => {
    const memento = {
      players: ['a', 'b', 'c', 'd'],
      hands: [
        [{type: 'NUMBERED', color: 'GREEN', number: 1}, {type: 'WILD'}],
        [{type: 'REVERSE', color: 'GREEN'}, {type: 'DRAW', color: 'BLUE'}],
        [{type: 'NUMBERED', color: 'GREEN', number: 8}, {type: 'NUMBERED', color: 'GREEN', number: 0}],
        [{type: 'NUMBERED', color: 'GREEN', number: 3}, {type: 'NUMBERED', color: 'RED', number: 5}],
      ],
      drawPile: [
        {type: 'NUMBERED', color: 'BLUE', number: 0}, 
        {type: 'DRAW', color: 'RED'},
        {type: 'NUMBERED', color: 'RED', number: 5}],
      discardPile: [{type: 'NUMBERED', color: 'BLUE', number: 3}, {type: 'NUMBERED', color: 'BLUE', number: 8}, {type: 'NUMBERED', color: 'RED', number: 8}],
      currentColor: 'BLUE',
      currentDirection: 'clockwise',
      dealer: 3,
      playerInTurn: 3
    }
    let round: Round = createRoundFromMemento(memento)
    beforeEach(() => { round = createRoundFromMemento(memento) })
    it("still succeeds if the player has said 'UNO!' before another player plays", () => {
      round.sayUno(0)
      round.sayUno(3)
      round.play(0)
      round.play(0)
      expect(round.catchUnoFailure({accuser: 1, accused: 0})).toBeTruthy()    
    })
    it("still fails even if another player says 'UNO!' after", () => {
      round.play(0)
      round.sayUno(0)
      round.sayUno(3)
      round.play(0)
      expect(round.catchUnoFailure({accuser: 1, accused: 0})).toBeFalsy()    
    })
    it("still fails even if another player has already said 'UNO!'", () => {
      round.play(0)
      round.sayUno(0)
      round.sayUno(3)
      expect(round.catchUnoFailure({accuser: 1, accused: 3})).toBeFalsy()    
    })
  })

  describe("boundaries", () => {
    const memento = {
      players: ['a', 'b', 'c', 'd'],
      hands: [
        [{type: 'NUMBERED', color: 'GREEN', number: 1}, {type: 'WILD'}],
        [{type: 'REVERSE', color: 'GREEN'}, {type: 'DRAW', color: 'BLUE'}],
        [{type: 'NUMBERED', color: 'GREEN', number: 8}, {type: 'NUMBERED', color: 'GREEN', number: 0}],
        [{type: 'NUMBERED', color: 'GREEN', number: 3}, {type: 'NUMBERED', color: 'RED', number: 5}],
      ],
      drawPile: [
        {type: 'NUMBERED', color: 'BLUE', number: 0}, 
        {type: 'DRAW', color: 'RED'},
        {type: 'NUMBERED', color: 'RED', number: 5}],
      discardPile: [{type: 'NUMBERED', color: 'BLUE', number: 3}, {type: 'NUMBERED', color: 'BLUE', number: 8}, {type: 'NUMBERED', color: 'RED', number: 8}],
      currentColor: 'BLUE',
      currentDirection: 'clockwise',
      dealer: 3,
      playerInTurn: 3
    }
    let round: Round = createRoundFromMemento(memento)
    test("accused cannot be negative", () => {
      expect(() => round.catchUnoFailure({accused: -1, accuser: 0})).toThrow()
    })
    test("accused cannot be beyond the player count", () => {
      expect(() => round.catchUnoFailure({accused: 4, accuser: 0})).toThrow()
    })
    test("the player saying 'UNO!' cannot be negative", () => {
      expect(() => round.sayUno(-1)).toThrow()
    })
    test("the player saying 'UNO!' cannot be beyond the player count", () => {
      expect(() => round.sayUno(4)).toThrow()
    })
  })
})

describe("ending the hand", () => {
  describe("before playing the last card", () => {
    const shuffler = shuffleBuilder({ players: 4, cardsPerPlayer: 1 })
      .discard().is({ type: 'NUMBERED', color: 'BLUE', number: 8 })
      .hand(0).is({ type: 'NUMBERED', color: 'GREEN', number: 8 })
      .hand(1).is({ type: 'NUMBERED', color: 'GREEN', number: 4 })
      .build()
    const round = createRound({players: ['a', 'b', 'c', 'd'], dealer: 3, shuffler, cardsPerPlayer: 1})
    it("returns false from hasEnded()", () => {
      expect(round.hasEnded()).toBeFalsy()
    })
    it("doesn't return a winner", () => {
      expect(round.winner()).toBeUndefined();
    })
  })

  describe("playing the last card", () => {
    const shuffler = shuffleBuilder({ players: 4, cardsPerPlayer: 1 })
      .discard().is({ type: 'NUMBERED', color: 'BLUE', number: 8 })
      .hand(0).is({ type: 'NUMBERED', color: 'GREEN', number: 8 })
      .hand(1).is({ type: 'NUMBERED', color: 'GREEN', number: 4 })
      .build()
    const round = createRound({players: ['a', 'b', 'c', 'd'], dealer: 3, shuffler, cardsPerPlayer: 1})
    round.play(0)
    it("returns true from hasEnded()", () => {
      expect(round.hasEnded()).toBeTruthy()
    })
    it("returns the winner", () => {
      expect(round.winner()).toEqual(0);
    })
    it("makes the player in turn undefined", () => {
      expect(round.playerInTurn()).toBeUndefined()
    })
    it("ceases play", () => {
      expect(round.canPlay(0)).toBeFalsy()
      expect(round.canPlayAny()).toBeFalsy()
    })
    it("gives error on attempted play", () => {
      expect(() => round.play(0)).toThrow()
    })
    it("gives error on attempted draw", () => {
      expect(() => round.draw()).toThrow()
    })
    it("gives error on attempting to say 'UNO!'", () => {
      expect(() => round.sayUno(1)).toThrow()
    })
  })
})

describe("score", () => {
  const builder = shuffleBuilder({ players: 2, cardsPerPlayer: 1 })
    .discard().is({ type: 'NUMBERED', color: 'BLUE', number: 8 })
    .hand(0).is({ type: 'NUMBERED', color: 'GREEN', number: 8 })
  it("is undefined before the last card is played", () => {
    const shuffler = builder.build()
    const round = createRound({players: ['a', 'b'], dealer: 3, shuffler, cardsPerPlayer: 1})
    expect(round.score()).toBeUndefined()
  })
  it("is defined after the last card is played", () => {
    const shuffler = builder.build()
    const round = createRound({players: ['a', 'b'], dealer: 3, shuffler, cardsPerPlayer: 1})
    round.play(0)
    expect(round.score()).toBeDefined()
  })
  it("has the value of the card number if the opponent holds a numbered card", () => {
    for(let number = 0; number <= 9; number++) {
      builder.hand(1).is({type: 'NUMBERED', number})
      const shuffler = builder.build()
      const round = createRound({players: ['a', 'b'], dealer: 3, shuffler, cardsPerPlayer: 1})
      round.play(0)
      expect(round.score()).toEqual(number)
    }
  })
  it("has the value 20 if the opponent holds a draw card", () => {
    builder.hand(1).is({type: 'DRAW'})
    const shuffler = builder.build()
    const round = createRound({players: ['a', 'b'], dealer: 3, shuffler, cardsPerPlayer: 1})
    round.play(0)
    expect(round.score()).toEqual(20)
  })
  it("has the value 20 if the opponent holds a reverse card", () => {
    builder.hand(1).is({type: 'REVERSE'})
    const shuffler = builder.build()
    const round = createRound({players: ['a', 'b'], dealer: 3, shuffler, cardsPerPlayer: 1})
    round.play(0)
    expect(round.score()).toEqual(20)
  })
  it("has the value 20 if the opponent holds a skip card", () => {
    builder.hand(1).is({type: 'SKIP'})
    const shuffler = builder.build()
    const round = createRound({players: ['a', 'b'], dealer: 3, shuffler, cardsPerPlayer: 1})
    round.play(0)
    expect(round.score()).toEqual(20)
  })
  it("has the value 50 if the opponent holds a wild card", () => {
    builder.hand(1).is({type: 'WILD'})
    const shuffler = builder.build()
    const round = createRound({players: ['a', 'b'], dealer: 3, shuffler, cardsPerPlayer: 1})
    round.play(0)
    expect(round.score()).toEqual(50)
  })
  it("has the value 50 if the opponent holds a wild draw card", () => {
    builder.hand(1).is({type: 'WILD DRAW'})
    const shuffler = builder.build()
    const round = createRound({players: ['a', 'b'], dealer: 3, shuffler, cardsPerPlayer: 1})
    round.play(0)
    expect(round.score()).toEqual(50)
  })
  it("adds the cards if the opponent have more than one card", () => {
    builder.hand(0).is({color: 'BLUE', type: 'DRAW'})
    builder.hand(1).is({type: 'WILD DRAW'})
    builder.drawPile().is({number: 5}, {type: 'REVERSE'})
    const shuffler = builder.build()
    const round = createRound({players: ['a', 'b'], dealer: 3, shuffler, cardsPerPlayer: 1})
    round.play(0)
    expect(round.playerHand(1).length).toEqual(3)
    expect(round.score()).toEqual(75)
  })
  it("adds the cards of all opponents if there are more than 2 players", () => {
    const builder = shuffleBuilder({ players: 4, cardsPerPlayer: 1 })
      .discard().is({ type: 'NUMBERED', color: 'BLUE', number: 8 })
      .hand(0).is({color: 'BLUE', type: 'DRAW'})
      .hand(1).is({type: 'WILD DRAW'})
      .hand(2).is({number: 7})
      .hand(3).is({number: 3})
      .drawPile().is({number: 5}, {type: 'REVERSE'})
    const shuffler = builder.build()
    const round = createRound({players: ['a', 'b', 'c', 'd'], dealer: 3, shuffler, cardsPerPlayer: 1})
    round.play(0)
    expect(round.playerHand(1).length).toEqual(3)
    expect(round.score()).toEqual(85)
  })
})

describe("callback", () => {
  const builder = shuffleBuilder({ players: 4, cardsPerPlayer: 1 })
    .discard().is({ type: 'NUMBERED', color: 'BLUE', number: 8 })
    .drawPile().is({number: 8})
    .hand(0).is({color: 'GREEN', type: 'DRAW'})
    .hand(1).is({type: 'WILD DRAW'})
    .hand(2).is({number: 7})
    .hand(3).is({number: 3})
  const shuffler = builder.build()
  test("callback gets called at the end of the hand", () => {
    const events: any[] = []
    const round = createRound({players: ['a', 'b', 'c', 'd'], dealer: 3, shuffler, cardsPerPlayer: 1})
    round.onEnd(e => events.push(e))
    round.draw()
    round.play(1)
    round.play(0, 'YELLOW')
    expect(events).toEqual([{winner: 1}])
  })
  test("all callbacks get called at the end of the hand", () => {
    const events: any[] = []
    const round = createRound({players: ['a', 'b', 'c', 'd'], dealer: 3, shuffler, cardsPerPlayer: 1})
    round.onEnd(e => events.push(e))
    round.onEnd(e => events.push(e))
    round.draw()
    round.play(1)
    round.play(0, 'YELLOW')
    expect(events).toEqual([{winner: 1}, {winner: 1}])
  })
})