import { Round, RoundMemento } from "./model/round";

const round = new Round(3);

for (let playerIndex = 0; playerIndex < 3; playerIndex++) {
    for (let cardCount = 0; cardCount < 7; cardCount++) {
        round.drawCard(playerIndex);
    }
}

console.log(round);

const memento: RoundMemento = round.createMemento();
console.log("Memento created:", memento);

round.playCard(0, round.hands[0].playerHand.getCards()[0]);
console.log("After playing a card:", round);

round.restoreMemento(memento);
console.log("After restoring memento:", round); 