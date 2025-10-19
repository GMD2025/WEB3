<template>
  <div class="multiplayer-game-container">
    <!-- Game Header -->
    <div class="game-header">
      <div class="game-info">
        <h2>UNO Game #{{ game?.id?.substring(0, 8) }}</h2>
        <div class="game-status">
          <span
            v-if="game?.state"
            class="status-badge"
            :class="game?.state?.toLowerCase().replace('_', '-')"
          >
            {{ game?.state?.replace("_", " ") }}
          </span>
          <span v-if="game?.targetScore" class="target-score">
            Target: {{ game.targetScore }}
          </span>
        </div>
      </div>
      <div class="current-player" v-if="game?.currentRound">
        <span v-if="isMyTurn" class="my-turn">Your Turn!</span>
        <span v-else class="other-turn">
          {{ game.players[game.currentRound.currentPlayerIndex]?.name }}'s Turn
        </span>
      </div>
    </div>

    <div v-if="!game" class="loading-state">
      <p>Loading game...</p>
    </div>

    <div v-else-if="game.state === 'WAITING_FOR_PLAYERS'" class="waiting-state">
      <h3>Waiting for players...</h3>
      <p>
        Share this game ID with friends: <strong>{{ game.id }}</strong>
      </p>
      <div class="players-waiting">
        <div
          v-for="player in game.players"
          :key="player.id"
          class="player-waiting"
        >
          {{ player.name }} {{ player.isOnline ? "🟢" : "🔴" }}
        </div>
      </div>
      <p>Game will start automatically when 2-4 players have joined.</p>
    </div>

    <div v-else-if="game.state === 'IN_PROGRESS'" class="active-game">
      <div class="other-players">
        <div
          v-for="(player, index) in game.players"
          :key="player.id"
          v-show="player.id !== playerId"
          class="player-info"
          :class="{
            'current-player': game.currentRound?.currentPlayerIndex === index,
          }"
        >
          <div class="player-header">
            <div class="player-details">
              <span class="player-name">{{ player.name }}</span>
              <span class="online-status">{{
                player.isOnline ? "🟢" : "🔴"
              }}</span>
            </div>
            <div class="player-stats">
              <span class="card-count"
                >{{ getPlayerHandSize(index) }} cards</span
              >
              <span class="score">Score: {{ player.score }}</span>
            </div>
            <button
              v-if="canCatchUno(index)"
              @click="catchUnoFailure(player.id)"
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
          <div class="pile-label">
            Draw ({{ game.currentRound?.drawPileSize || 0 }})
          </div>
        </div>

        <div class="current-card-area">
          <div v-if="game.currentRound?.topCard" class="current-card">
            <UnoCard :card="game.currentRound.topCard" />
          </div>
          <div class="current-color" v-if="game.currentRound?.currentColor">
            Current Color: {{ game.currentRound.currentColor }}
          </div>
          <div class="pile-label">
            Discard ({{ game.currentRound?.discardPileSize || 0 }})
          </div>
        </div>
      </div>

      <div class="my-hand">
        <div class="hand-header">
          <h3>Your Hand ({{ myHand.length }} cards)</h3>
          <button v-if="canSayUno" @click="sayUno" class="btn btn-uno">
            SAY UNO!
          </button>
        </div>
        <div class="cards-container">
          <div
            v-for="(card, index) in myHand"
            :key="`${card.type}-${card.color}-${card.number}-${index}`"
            class="card-wrapper"
            :class="{
              playable: canPlayCard(index),
              'not-playable': !canPlayCard(index),
            }"
            @click="handleCardClick(index)"
          >
            <UnoCard :card="card" />
          </div>
        </div>
      </div>

      <div class="action-buttons">
        <button
          v-if="isMyTurn && !canPlayAnyCard"
          @click="drawCard"
          :disabled="!canDraw"
          class="btn btn-primary"
        >
          Draw Card
        </button>
      </div>
    </div>

    <div v-else-if="game.state === 'FINISHED'" class="finished-state">
      <h2>🎉 Game Over!</h2>
      <div v-if="game.winner" class="winner-announcement">
        <h3>{{ game.winner.name }} Wins!</h3>
        <p>Final Score: {{ game.winner.score }}</p>
      </div>
      <div class="final-scores">
        <h4>Final Scores:</h4>
        <div v-for="player in game.players" :key="player.id" class="score-row">
          <span>{{ player.name }}: {{ player.score }}</span>
        </div>
      </div>
      <button @click="goToLobby" class="btn btn-primary">Back to Lobby</button>
    </div>

    <div class="actions-log">
      <h4>Game Log</h4>
      <div class="log-entries">
        <div
          v-for="action in recentActions"
          :key="action.timestamp"
          class="log-entry"
        >
          <span class="timestamp">{{ formatTime(action.timestamp) }}</span>
          <span class="message">{{ action.message }}</span>
        </div>
      </div>
    </div>

    <div
      v-if="showColorPicker"
      class="color-picker-modal"
      @click="closeColorPicker"
    >
      <div class="color-picker" @click.stop>
        <h3>Choose a color:</h3>
        <div class="color-options">
          <button
            v-for="color in ['RED', 'YELLOW', 'GREEN', 'BLUE']"
            :key="color"
            @click="selectColor(color)"
            class="color-button"
            :class="color.toLowerCase()"
          >
            {{ color }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { multiplayerGameStateManager } from "../services/multiplayerGameStateManager";
import UnoCard from "./UnoCard.vue";
import type { Color } from "../types/gameTypes";

const route = useRoute();
const router = useRouter();

// reactive state
const showColorPicker = ref<boolean>(false);
const pendingCardIndex = ref<number>(-1);

// Use the manager's computed properties directly to avoid double-wrapping
const game = multiplayerGameStateManager.game;
const playerId = multiplayerGameStateManager.playerId;
const isMyTurn = multiplayerGameStateManager.isMyTurn;
const myHand = multiplayerGameStateManager.myHand;
const canDraw = multiplayerGameStateManager.canDraw;
const actions = multiplayerGameStateManager.actions;

const canSayUno = computed(() => {
  return (myHand.value.length === 2 || myHand.value.length === 1) && isMyTurn.value;
});

const canPlayAnyCard = computed(() => {
  return myHand.value.some((_, index) => canPlayCard(index));
});

const recentActions = computed(() => {
  return actions.value?.slice(-10).reverse() || [];
});

const handleCardClick = async (cardIndex: number) => {
  if (!canPlayCard(cardIndex) || !isMyTurn.value) return;

  const card = myHand.value[cardIndex];

  if (card.type === "WILD" || card.type === "WILD_DRAW") {
    pendingCardIndex.value = cardIndex;
    showColorPicker.value = true;
    return;
  }

  try {
    await multiplayerGameStateManager.playCard(cardIndex);
  } catch (error) {
    console.error("Failed to play card:", error);
    alert(error instanceof Error ? error.message : "Failed to play card");
  }
};

const selectColor = async (color: Color) => {
  showColorPicker.value = false;

  if (pendingCardIndex.value >= 0) {
    try {
      await multiplayerGameStateManager.playCard(pendingCardIndex.value, color);
    } catch (error) {
      console.error("Failed to play card:", error);
      alert(error instanceof Error ? error.message : "Failed to play card");
    }
    pendingCardIndex.value = -1;
  }
};

const closeColorPicker = () => {
  showColorPicker.value = false;
  pendingCardIndex.value = -1;
};

const drawCard = async () => {
  if (!canDraw.value) return;

  try {
    await multiplayerGameStateManager.drawCard();
  } catch (error) {
    console.error("Failed to draw card:", error);
    alert(error instanceof Error ? error.message : "Failed to draw card");
  }
};

const sayUno = async () => {
  try {
    await multiplayerGameStateManager.sayUno();
  } catch (error) {
    console.error("Failed to say UNO:", error);
    alert(error instanceof Error ? error.message : "Failed to say UNO");
  }
};

const catchUnoFailure = async (accusedPlayerId: string) => {
  try {
    await multiplayerGameStateManager.catchUnoFailure(accusedPlayerId);
  } catch (error) {
    console.error("Failed to catch UNO failure:", error);
    alert(
      error instanceof Error ? error.message : "Failed to catch UNO failure",
    );
  }
};

const canPlayCard = (cardIndex: number): boolean => {
  return multiplayerGameStateManager.canPlayCard(cardIndex);
};

const getPlayerHandSize = (playerIndex: number): number => {
  return multiplayerGameStateManager.getPlayerHandSize(playerIndex);
};

const canCatchUno = (playerIndex: number): boolean => {
  return multiplayerGameStateManager.canCatchUno(playerIndex);
};

const formatTime = (timestamp: string): string => {
  return new Date(timestamp).toLocaleTimeString();
};

const goToLobby = () => {
  multiplayerGameStateManager.destroy();
  router.push({ name: "lobby" });
};

onMounted(async () => {
  const gameId = route.query.gameId as string;
  console.log("MultiplayerGameScreen mounted, gameId:", gameId);
  console.log("Current game:", game.value);

  if (gameId) {
    // Only load game if we don't already have it
    if (!game.value || game.value.id !== gameId) {
      try {
        console.log("Loading game...");
        await multiplayerGameStateManager.loadGame(gameId);
        console.log("Game loaded:", game.value);
      } catch (error) {
        console.error("Failed to load game:", error);
        router.push({ name: "lobby" });
      }
    } else {
      console.log("Game already loaded, skipping load");
    }
  } else {
    console.log("No gameId in query, redirecting to lobby");
    router.push({ name: "lobby" });
  }
});

onUnmounted(() => {
  // Don't destroy on unmount in case user is navigating back
  // multiplayerGameStateManager.destroy();
});
</script>

<style scoped>
.multiplayer-game-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #2c3e50 0%, #3498db 100%);
  color: white;
  padding: 20px;
}

.game-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(255, 255, 255, 0.1);
  padding: 20px;
  border-radius: 15px;
  margin-bottom: 20px;
  backdrop-filter: blur(10px);
}

.game-info h2 {
  margin: 0 0 10px 0;
}

.game-status {
  display: flex;
  gap: 15px;
  align-items: center;
}

.status-badge {
  padding: 5px 15px;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 500;
}

.status-badge.waiting-for-players {
  background: #f39c12;
}

.status-badge.in-progress {
  background: #27ae60;
}

.status-badge.finished {
  background: #8e44ad;
}

.current-player {
  font-size: 1.2rem;
  font-weight: bold;
}

.my-turn {
  color: #f1c40f;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
  100% {
    opacity: 1;
  }
}

.loading-state,
.waiting-state,
.finished-state {
  text-align: center;
  background: rgba(255, 255, 255, 0.1);
  padding: 40px;
  border-radius: 15px;
  margin: 20px 0;
}

.players-waiting {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin: 20px 0;
  flex-wrap: wrap;
}

.player-waiting {
  background: rgba(255, 255, 255, 0.2);
  padding: 10px 20px;
  border-radius: 25px;
}

.active-game {
  display: grid;
  gap: 20px;
}

.other-players {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 15px;
}

.player-info {
  background: rgba(255, 255, 255, 0.1);
  padding: 15px;
  border-radius: 10px;
  border: 2px solid transparent;
  transition: all 0.3s ease;
}

.player-info.current-player {
  border-color: #f1c40f;
  background: rgba(241, 196, 15, 0.2);
}

.player-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.player-details {
  display: flex;
  align-items: center;
  gap: 10px;
}

.player-name {
  font-weight: bold;
  font-size: 1.1rem;
}

.player-stats {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 5px;
}

.game-board {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 60px;
  padding: 40px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 15px;
}

.draw-pile {
  cursor: pointer;
  text-align: center;
  transition: transform 0.3s ease;
}

.draw-pile:hover:not(.disabled) {
  transform: scale(1.05);
}

.draw-pile.disabled {
  opacity: 0.6;
  cursor: not-allowed;
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

.current-card-area {
  text-align: center;
}

.current-card {
  margin-bottom: 15px;
}

.current-color {
  font-weight: 500;
  margin-bottom: 10px;
}

.my-hand {
  background: rgba(255, 255, 255, 0.1);
  padding: 20px;
  border-radius: 15px;
}

.hand-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.cards-container {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: center;
}

.card-wrapper {
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
}

.card-wrapper.playable {
  transform: translateY(-5px);
}

.card-wrapper.playable:hover {
  transform: translateY(-10px) scale(1.05);
}

.card-wrapper.not-playable {
  opacity: 0.6;
  cursor: not-allowed;
}

.action-buttons {
  display: flex;
  justify-content: center;
  gap: 15px;
  padding: 20px;
}

.actions-log {
  background: rgba(255, 255, 255, 0.1);
  padding: 20px;
  border-radius: 15px;
  max-height: 200px;
  overflow-y: auto;
}

.log-entries {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.log-entry {
  display: flex;
  gap: 10px;
  font-size: 0.9rem;
  padding: 5px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.timestamp {
  color: #bdc3c7;
  min-width: 80px;
}

.color-picker-modal {
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
  color: black;
  padding: 30px;
  border-radius: 15px;
  text-align: center;
}

.color-options {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
  margin-top: 20px;
}

.color-button {
  padding: 15px 25px;
  border: none;
  border-radius: 10px;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  color: white;
  transition: transform 0.3s ease;
}

.color-button:hover {
  transform: scale(1.05);
}

.color-button.red {
  background: #e74c3c;
}

.color-button.yellow {
  background: #f1c40f;
}

.color-button.green {
  background: #27ae60;
}

.color-button.blue {
  background: #3498db;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: #3498db;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #2980b9;
  transform: translateY(-2px);
}

.btn-warning {
  background: #f39c12;
  color: white;
}

.btn-warning:hover:not(:disabled) {
  background: #e67e22;
}

.btn-uno {
  background: #e74c3c;
  color: white;
  font-size: 1.2rem;
  padding: 15px 30px;
  animation: bounce 2s infinite;
}

@keyframes bounce {
  0%,
  20%,
  50%,
  80%,
  100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-10px);
  }
  60% {
    transform: translateY(-5px);
  }
}

.btn-small {
  padding: 5px 10px;
  font-size: 0.8rem;
}

@media (max-width: 768px) {
  .multiplayer-game-container {
    padding: 10px;
  }

  .game-header {
    flex-direction: column;
    text-align: center;
    gap: 10px;
  }

  .game-board {
    flex-direction: column;
    gap: 30px;
  }

  .cards-container {
    gap: 5px;
  }

  .other-players {
    grid-template-columns: 1fr;
  }
}
</style>
