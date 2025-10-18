<template>
  <div class="game-setup">
    <div class="setup-container">
      <h1 class="title">UNO Game Setup</h1>

      <div class="setup-section">
        <h2>Game Settings</h2>
        <div class="form-group">
          <label for="target-score">Target Score:</label>
          <input
            id="target-score"
            v-model.number="gameConfig.targetScore"
            type="number"
            min="50"
            max="500"
            step="25"
            class="input"
          />
        </div>
      </div>

      <div class="setup-section">
        <h2>Players ({{ gameConfig.players.length }}/4)</h2>

        <div
          v-for="(player, index) in gameConfig.players"
          :key="index"
          class="player-config"
        >
          <div class="player-header">
            <h3>Player {{ index + 1 }}</h3>
            <button
              v-if="gameConfig.players.length > 2"
              @click="removePlayer(index)"
              class="btn btn-danger btn-small"
              type="button"
            >
              Remove
            </button>
          </div>

          <div class="form-group">
            <label :for="`player-name-${index}`">Name:</label>
            <input
              :id="`player-name-${index}`"
              v-model="player.name"
              type="text"
              maxlength="15"
              class="input"
              :placeholder="`Player ${index + 1}`"
            />
          </div>

          <div class="form-group">
            <label>Player Type:</label>
            <div class="radio-group">
              <label class="radio-label">
                <input
                  v-model="player.isBot"
                  type="radio"
                  :value="false"
                  :name="`player-type-${index}`"
                />
                Human
              </label>
              <label class="radio-label">
                <input
                  v-model="player.isBot"
                  type="radio"
                  :value="true"
                  :name="`player-type-${index}`"
                />
                Bot
              </label>
            </div>
          </div>

          <div v-if="player.isBot" class="form-group">
            <label :for="`bot-difficulty-${index}`">Bot Difficulty:</label>
            <select
              :id="`bot-difficulty-${index}`"
              v-model="player.botDifficulty"
              class="select"
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
        </div>

        <button
          v-if="gameConfig.players.length < 4"
          @click="addPlayer"
          class="btn btn-secondary"
          type="button"
        >
          Add Player
        </button>
      </div>

      <div class="setup-actions">
        <button
          @click="startGame"
          :disabled="!canStartGame"
          class="btn btn-primary btn-large"
          type="button"
        >
          Start Game
        </button>

        <div v-if="!canStartGame" class="validation-message">
          {{ validationMessage }}
        </div>
      </div>

      <div v-if="isStarting" class="loading">
        <div class="loading-spinner"></div>
        <p>Setting up game...</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, computed, ref } from "vue";
import { useRouter } from "vue-router";
import type { PlayerConfig, GameConfig } from "../services/gameStateManager";
import { gameStateManager } from "../services/gameStateManager";

const router = useRouter();

const isStarting = ref(false);

const gameConfig = reactive<GameConfig>({
  targetScore: 100,
  players: [
    { name: "You", isBot: false },
    { name: "Bot 1", isBot: true, botDifficulty: "medium" },
  ],
});

const canStartGame = computed(() => {
  if (gameConfig.players.length < 2 || gameConfig.players.length > 4) {
    return false;
  }

  const hasHuman = gameConfig.players.some((p) => !p.isBot);
  if (!hasHuman) {
    return false;
  }

  const allNamesValid = gameConfig.players.every(
    (p) => p.name && p.name.trim().length > 0,
  );
  if (!allNamesValid) {
    return false;
  }

  const names = gameConfig.players.map((p) => p.name.trim().toLowerCase());
  const uniqueNames = new Set(names);
  if (names.length !== uniqueNames.size) {
    return false;
  }

  return true;
});

const validationMessage = computed(() => {
  if (gameConfig.players.length < 2) {
    return "At least 2 players are required";
  }

  if (gameConfig.players.length > 4) {
    return "Maximum 4 players allowed";
  }

  const hasHuman = gameConfig.players.some((p) => !p.isBot);
  if (!hasHuman) {
    return "At least one human player is required";
  }

  const allNamesValid = gameConfig.players.every(
    (p) => p.name && p.name.trim().length > 0,
  );
  if (!allNamesValid) {
    return "All players must have names";
  }

  const names = gameConfig.players.map((p) => p.name.trim().toLowerCase());
  const uniqueNames = new Set(names);
  if (names.length !== uniqueNames.size) {
    return "Player names must be unique";
  }

  return "";
});

function addPlayer(): void {
  if (gameConfig.players.length < 4) {
    const playerNumber = gameConfig.players.length + 1;
    gameConfig.players.push({
      name: `Bot ${playerNumber}`,
      isBot: true,
      botDifficulty: "medium",
    });
  }
}

function removePlayer(index: number): void {
  if (gameConfig.players.length > 2) {
    gameConfig.players.splice(index, 1);
  }
}

async function startGame(): Promise<void> {
  if (!canStartGame.value || isStarting.value) {
    return;
  }

  try {
    isStarting.value = true;

    gameConfig.players.forEach((player) => {
      player.name = player.name.trim();
    });

    await gameStateManager.startGame(gameConfig);

    await router.push("/game");
  } catch (error) {
    console.error("Failed to start game:", error);
    alert(`Failed to start game: ${error}`);
  } finally {
    isStarting.value = false;
  }
}
</script>

<style scoped>
.game-setup {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.setup-container {
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  max-width: 600px;
  width: 100%;
  padding: 40px;
}

.title {
  text-align: center;
  color: #333;
  margin-bottom: 40px;
  font-size: 2.5rem;
  font-weight: bold;
}

.setup-section {
  margin-bottom: 40px;
}

.setup-section h2 {
  color: #555;
  margin-bottom: 20px;
  font-size: 1.5rem;
  border-bottom: 2px solid #eee;
  padding-bottom: 10px;
}

.player-config {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 16px;
  border: 2px solid #e9ecef;
}

.player-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.player-header h3 {
  color: #495057;
  margin: 0;
  font-size: 1.2rem;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: #495057;
  font-weight: 500;
}

.input,
.select {
  width: 100%;
  padding: 12px;
  border: 2px solid #dee2e6;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s ease;
}

.input:focus,
.select:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.radio-group {
  display: flex;
  gap: 20px;
}

.radio-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  color: #495057;
}

.radio-label input[type="radio"] {
  width: auto;
  margin: 0;
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

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.3);
}

.btn-primary:disabled {
  background: #6c757d;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background: #5a6268;
  transform: translateY(-1px);
}

.btn-danger {
  background: #dc3545;
  color: white;
}

.btn-danger:hover {
  background: #c82333;
  transform: translateY(-1px);
}

.btn-small {
  padding: 8px 16px;
  font-size: 0.875rem;
}

.btn-large {
  padding: 16px 32px;
  font-size: 1.1rem;
}

.setup-actions {
  text-align: center;
  margin-top: 40px;
}

.validation-message {
  margin-top: 16px;
  color: #dc3545;
  font-weight: 500;
}

.loading {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.2rem;
  z-index: 1000;
}

.loading-spinner {
  width: 60px;
  height: 60px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top: 4px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

@media (max-width: 640px) {
  .setup-container {
    padding: 20px;
    margin: 10px;
  }

  .title {
    font-size: 2rem;
  }

  .radio-group {
    flex-direction: column;
    gap: 12px;
  }
}
</style>
