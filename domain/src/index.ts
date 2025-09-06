import { createDeck } from "./model/deck";
import { createCardPool } from "./model/pool";

const cardPool = createCardPool();
const deck = createDeck(cardPool, 7);
console.log("Deck 1 ", deck);
console.log("Card Pool ", cardPool);