<template>
  <div class="game-screen">
    <div
      v-if="
        !gameStateManager.isGameActive.value &&
        gameStateManager.winner.value === undefined
      "
      class="no-game"
    >
      <h2>No Active Game</h2>
      <p>Please start a new game from the setup screen.</p>
      <router-link to="/" class="btn btn-primary">Go to Setup</router-link>
    </div>

    <div v-else-if="gameStateManager.isGameActive.value" class="game-container">
      <header class="game-header">
        <div class="game-info">
          <h1>UNO Game</h1>
          <div class="current-player">
            <span
              v-if="gameStateManager.isProcessingTurn.value"
              class="processing"
            >
              Processing...
            </span>
            <span
              v-else-if="gameStateManager.isHumanTurn.value"
              class="your-turn"
            >
              Your Turn!
            </span>
            <span v-else class="waiting">
              Waiting for {{ gameStateManager.currentPlayerName.value }}
            </span>
          </div>
        </div>

        <div class="game-actions">
          <button
            @click="showGameMenu = !showGameMenu"
            class="btn btn-secondary"
          >
            Menu
          </button>
          <button @click="debugGameState" class="btn btn-warning">Debug</button>
        </div>
      </header>

      <div v-if="showGameMenu" class="game-menu">
        <div class="menu-content">
          <button @click="confirmNewGame" class="btn btn-danger">
            New Game
          </button>
          <button @click="showGameMenu = false" class="btn btn-secondary">
            Close
          </button>
        </div>
      </div>

      <div class="players-section">
        <div class="players-grid">
          <div
            v-for="(player, index) in gameStateManager.players.value"
            :key="index"
            class="player-info"
            :class="{
              'current-player':
                gameStateManager.currentPlayerIndex.value === index,
              'human-player': index === gameStateManager.humanPlayerIndex.value,
            }"
          >
            <div class="player-header">
              <span class="player-name">{{ player.name }}</span>
              <span class="player-type">{{ player.isBot ? "🤖" : "👤" }}</span>
            </div>
            <div class="player-stats">
              <span class="card-count"
                >{{ getPlayerHandSize(index) }} cards</span
              >
              <span class="score"
                >Score: {{ gameStateManager.scores.value[index] || 0 }}</span
              >
            </div>
            <button
              v-if="canCatchUno(index)"
              @click="catchUnoFailure(index)"
              class="btn btn-warning btn-small"
            >
              Catch UNO!
            </button>
          </div>
        </div>
      </div>

      <div class="game-board">
        <div
          class="draw-pile"
          @click="drawCard"
          :class="{ disabled: !canDraw }"
        >
          <div class="pile-stack">
            <div class="card-back"></div>
            <div class="card-back offset-1"></div>
            <div class="card-back offset-2"></div>
          </div>
          <span class="pile-label">Draw ({{ drawPileSize }})</span>
        </div>

        <div class="current-card-area">
          <div
            v-if="gameStateManager.lastPlayedCard.value"
            class="current-card"
          >
            <UnoCard :card="gameStateManager.lastPlayedCard.value" />
          </div>
          <div class="current-color" v-if="gameStateManager.currentColor.value">
            Current Color:
            <span
              class="color-indicator"
              :class="`color-${gameStateManager.currentColor.value.toLowerCase()}`"
            >
              {{ gameStateManager.currentColor.value }}
            </span>
          </div>
        </div>
      </div>

      <div
        v-if="gameStateManager.humanHand.value.length > 0"
        class="player-hand"
      >
        <h3>Your Hand</h3>
        <div class="hand-cards">
          <div
            v-for="(card, index) in gameStateManager.humanHand.value"
            :key="index"
            class="hand-card"
            :class="{
              playable: canPlayCard(index),
              disabled:
                !gameStateManager.isHumanTurn.value ||
                gameStateManager.isProcessingTurn.value,
            }"
            @click="playCard(index)"
          >
            <UnoCard :card="card" />
          </div>
        </div>

        <div class="hand-actions">
          <button
            v-if="gameStateManager.humanHand.value.length <= 2"
            @click="sayUno"
            class="btn btn-warning"
            :disabled="!gameStateManager.isHumanTurn.value"
          >
            UNO!
          </button>
        </div>
      </div>

      <div v-if="showColorPicker" class="color-picker-overlay">
        <div class="color-picker">
          <h3>Choose a Color</h3>
          <div class="color-options">
            <button
              v-for="color in wildColors"
              :key="color"
              @click="selectWildColor(color)"
              class="color-option"
              :class="`color-${color.toLowerCase()}`"
            >
              {{ color }}
            </button>
          </div>
        </div>
      </div>

      <div class="game-log">
        <h3>Game Log</h3>
        <div class="log-content">
          <div
            v-for="(message, index) in recentGameLog"
            :key="index"
            class="log-message"
          >
            {{ message }}
          </div>
        </div>
      </div>
    </div>

    <GameOver
      v-if="gameStateManager.winner.value !== undefined"
      :winner-index="gameStateManager.winner.value"
      :players="gameStateManager.players.value"
      :scores="gameStateManager.scores.value"
      :target-score="gameStateManager.targetScore.value"
      :game-start-time="gameStateManager.gameStartTime.value || undefined"
      @new-game="startNewGame"
      @back-to-setup="goToSetup"
      @main-menu="goToSetup"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import UnoCard from "./UnoCard.vue";
import GameOver from "./GameOver.vue";
import { gameStateManager } from "../services/gameStateManager";
import type { Color } from "../types/gameTypes";

const router = useRouter();

const showGameMenu = ref(false);
const showColorPicker = ref(false);
const pendingCardIndex = ref<number | null>(null);

const wildColors: Color[] = ["RED", "YELLOW", "GREEN", "BLUE"];

const recentGameLog = computed(() => {
  return gameStateManager.gameLog.value.slice(-5).reverse();
});

const drawPileSize = computed(() => {
  return gameStateManager.currentRound.value?.drawPile().size || 0;
});

const canDraw = computed(() => {
  return (
    gameStateManager.isHumanTurn.value &&
    !gameStateManager.isProcessingTurn.value
  );
});

function getPlayerHandSize(playerIndex: number): number {
  return (
    gameStateManager.currentRound.value?.playerHand(playerIndex).length || 0
  );
}

function canPlayCard(cardIndex: number): boolean {
  return gameStateManager.canPlayCard(cardIndex);
}

function canCatchUno(playerIndex: number): boolean {
  // Can catch UNO if:
  // 1. It's not our turn
  // 2. The player has exactly 1 card
  // 3. It's not the current player's turn
  // 4. We're not processing a turn
  return (
    !gameStateManager.isProcessingTurn.value &&
    playerIndex !== gameStateManager.humanPlayerIndex.value &&
    playerIndex !== gameStateManager.currentPlayerIndex.value &&
    getPlayerHandSize(playerIndex) === 1
  );
}

async function playCard(cardIndex: number): Promise<void> {
  if (
    !canPlayCard(cardIndex) ||
    !gameStateManager.isHumanTurn.value ||
    gameStateManager.isProcessingTurn.value
  ) {
    return;
  }

  const hand = gameStateManager.humanHand.value;
  const card = hand[cardIndex];

  // Check if this is a wild card that needs color selection
  if (card && (card.type === "WILD" || card.type === "WILD DRAW")) {
    pendingCardIndex.value = cardIndex;
    showColorPicker.value = true;
    return;
  }

  try {
    await gameStateManager.playCard(cardIndex);
  } catch (error) {
    console.error("Error playing card:", error);
    alert(`Cannot play that card: ${error}`);
  }
}

async function selectWildColor(color: Color): Promise<void> {
  showColorPicker.value = false;

  if (pendingCardIndex.value !== null) {
    try {
      await gameStateManager.playCard(pendingCardIndex.value, color);
    } catch (error) {
      console.error("Error playing wild card:", error);
      alert(`Cannot play that card: ${error}`);
    }
    pendingCardIndex.value = null;
  }
}

async function drawCard(): Promise<void> {
  if (!canDraw.value) {
    return;
  }

  try {
    await gameStateManager.drawCard();
  } catch (error) {
    console.error("Error drawing card:", error);
    alert(`Cannot draw card: ${error}`);
  }
}

async function sayUno(): Promise<void> {
  try {
    await gameStateManager.sayUno();
  } catch (error) {
    console.error("Error saying UNO:", error);
  }
}

async function catchUnoFailure(accusedIndex: number): Promise<void> {
  try {
    await gameStateManager.catchUnoFailure(accusedIndex);
  } catch (error) {
    console.error("Error catching UNO failure:", error);
  }
}

function getWinnerName(): string {
  const winnerIndex = gameStateManager.winner.value;
  if (winnerIndex !== undefined) {
    const winner = gameStateManager.players.value[winnerIndex];
    return winner?.name || "Unknown";
  }
  return "Unknown";
}

function confirmNewGame(): void {
  if (
    confirm(
      "Are you sure you want to start a new game? Current progress will be lost.",
    )
  ) {
    startNewGame();
  }
}

function startNewGame(): void {
  gameStateManager.resetGame();
  router.push("/");
}

function goToSetup(): void {
  router.push("/");
}

function debugGameState(): void {
  console.log("=== GAME STATE DEBUG ===");
  console.log("Game active:", gameStateManager.isGameActive.value);
  console.log("Current game:", gameStateManager.currentGame.value);
  console.log("Current round:", gameStateManager.currentRound.value);
  console.log("Players:", gameStateManager.players.value);
  console.log("Scores:", gameStateManager.scores.value);
  console.log("Target score:", gameStateManager.targetScore.value);
  console.log("Winner:", gameStateManager.winner.value);
  console.log("Round winner:", gameStateManager.roundWinner.value);

  if (gameStateManager.currentGame.value) {
    console.log("Individual scores from game:");
    for (let i = 0; i < gameStateManager.players.value.length; i++) {
      console.log(
        `  Player ${i}: ${gameStateManager.currentGame.value.score(i)}`,
      );
    }
  }

  if (gameStateManager.currentRound.value) {
    console.log("Round ended:", gameStateManager.currentRound.value.hasEnded());
    console.log("Round winner:", gameStateManager.currentRound.value.winner());
    console.log("Round score:", gameStateManager.currentRound.value.score());
  }
  console.log("========================");
}

function handleKeyPress(event: KeyboardEvent): void {
  if (event.key === "Escape") {
    showGameMenu.value = false;
    showColorPicker.value = false;
  }
}

onMounted(() => {
  document.addEventListener("keydown", handleKeyPress);

  if (!gameStateManager.isGameActive.value) {
    router.push("/");
  }
});

onUnmounted(() => {
  document.removeEventListener("keydown", handleKeyPress);
});
</script>

<style scoped>
.game-screen {
  min-height: 100vh;
  background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
  color: white;
}

.no-game {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  text-align: center;
}

.game-container {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.game-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  background: rgba(255, 255, 255, 0.1);
  padding: 20px;
  border-radius: 12px;
  backdrop-filter: blur(10px);
}

.game-info h1 {
  margin: 0 0 8px 0;
  font-size: 2rem;
}

.current-player {
  font-size: 1.1rem;
  font-weight: 500;
}

.your-turn {
  color: #4ade80;
  animation: pulse 2s infinite;
}

.processing {
  color: #fbbf24;
}

.waiting {
  color: #94a3b8;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

.game-menu {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.menu-content {
  background: white;
  padding: 30px;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  gap: 15px;
  min-width: 200px;
}

.players-section {
  margin-bottom: 30px;
}

.players-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 15px;
}

.player-info {
  background: rgba(255, 255, 255, 0.1);
  padding: 15px;
  border-radius: 8px;
  border: 2px solid transparent;
  transition: all 0.3s ease;
}

.player-info.current-player {
  border-color: #4ade80;
  background: rgba(74, 222, 128, 0.2);
}

.player-info.human-player {
  border-color: #60a5fa;
  background: rgba(96, 165, 250, 0.2);
}

.player-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.player-name {
  font-weight: 600;
  font-size: 1.1rem;
}

.player-stats {
  display: flex;
  justify-content: space-between;
  font-size: 0.9rem;
  opacity: 0.9;
  margin-bottom: 10px;
}

.game-board {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 60px;
  margin: 40px 0;
  padding: 40px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 16px;
}

.draw-pile {
  cursor: pointer;
  text-align: center;
  transition: transform 0.2s ease;
}

.draw-pile:hover:not(.disabled) {
  transform: scale(1.05);
}

.draw-pile.disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.pile-stack {
  position: relative;
  width: 80px;
  height: 112px;
  margin-bottom: 10px;
}

.card-back {
  position: absolute;
  width: 80px;
  height: 112px;
  background: linear-gradient(45deg, #1f2937, #374151);
  border: 2px solid #4b5563;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.card-back::before {
  content: "UNO";
  color: white;
  font-weight: bold;
  font-size: 14px;
}

.offset-1 {
  top: -3px;
  left: -3px;
}

.offset-2 {
  top: -6px;
  left: -6px;
}

.pile-label {
  font-size: 0.9rem;
  color: #e2e8f0;
}

.current-card-area {
  text-align: center;
}

.current-card {
  margin-bottom: 15px;
}

.current-color {
  font-weight: 500;
}

.color-indicator {
  padding: 4px 12px;
  border-radius: 20px;
  font-weight: bold;
  margin-left: 8px;
}

.color-red {
  background: #ef4444;
  color: white;
}
.color-yellow {
  background: #eab308;
  color: black;
}
.color-green {
  background: #22c55e;
  color: white;
}
.color-blue {
  background: #3b82f6;
  color: white;
}

.player-hand {
  background: rgba(255, 255, 255, 0.1);
  padding: 20px;
  border-radius: 12px;
  margin-bottom: 20px;
}

.player-hand h3 {
  margin-bottom: 15px;
  text-align: center;
}

.hand-cards {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
  margin-bottom: 15px;
}

.hand-card {
  cursor: pointer;
  transition: transform 0.2s ease;
  border-radius: 8px;
  overflow: hidden;
}

.hand-card.playable:hover {
  transform: translateY(-10px);
}

.hand-card.disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.hand-card:not(.playable) {
  opacity: 0.7;
  cursor: not-allowed;
}

.hand-actions {
  text-align: center;
}

.color-picker-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.color-picker {
  background: white;
  padding: 30px;
  border-radius: 16px;
  text-align: center;
  color: #333;
}

.color-picker h3 {
  margin-bottom: 20px;
  color: #333;
}

.color-options {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
}

.color-option {
  padding: 15px 25px;
  border: none;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
  transition: transform 0.2s ease;
  font-size: 1rem;
}

.color-option:hover {
  transform: scale(1.05);
}

.game-log {
  background: rgba(255, 255, 255, 0.1);
  padding: 15px;
  border-radius: 8px;
  max-height: 150px;
  overflow-y: auto;
}

.game-log h3 {
  margin-bottom: 10px;
  font-size: 1rem;
}

.log-content {
  font-size: 0.85rem;
}

.log-message {
  padding: 4px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  text-decoration: none;
  display: inline-block;
  text-align: center;
}

.btn-primary {
  background: linear-gradient(45deg, #667eea, #764ba2);
  color: white;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.3);
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background: #5a6268;
}

.btn-danger {
  background: #dc3545;
  color: white;
}

.btn-danger:hover {
  background: #c82333;
}

.btn-warning {
  background: #ffc107;
  color: #000;
}

.btn-warning:hover {
  background: #e0a800;
}

.btn-small {
  padding: 8px 16px;
  font-size: 0.875rem;
}

.btn:disabled {
  background: #6c757d;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

@media (max-width: 768px) {
  .game-board {
    flex-direction: column;
    gap: 30px;
    padding: 20px;
  }

  .players-grid {
    grid-template-columns: 1fr;
  }

  .hand-cards {
    justify-content: flex-start;
    overflow-x: auto;
    padding-bottom: 10px;
  }

  .game-header {
    flex-direction: column;
    gap: 15px;
    text-align: center;
  }

  .color-options {
    grid-template-columns: 1fr;
  }
}
</style>
