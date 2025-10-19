<template>
  <div class="lobby-container">
    <div class="lobby-content-wrapper">
      <div class="lobby-header">
        <h1>UNO Multiplayer Lobby</h1>
        <div class="player-info" v-if="playerName">
          <span
            >Playing as: <strong>{{ playerName }}</strong></span
          >
        </div>
      </div>

      <div v-if="!playerName" class="name-input-section">
        <h2>Enter Your Name</h2>
        <div class="input-group">
          <input
            v-model="tempPlayerName"
            @keyup.enter="setPlayerName"
            placeholder="Your name"
            class="name-input"
            maxlength="20"
          />
          <button
            @click="setPlayerName"
            :disabled="!tempPlayerName.trim()"
            class="btn btn-primary"
          >
            Set Name
          </button>
        </div>
      </div>

      <div v-else class="lobby-content">
        <div class="create-game-section">
          <h2>Create New Game</h2>
          <div class="create-game-form">
            <div class="input-group">
              <label>Target Score:</label>
              <input
                type="number"
                v-model.number="targetScore"
                class="score-input"
                min="100"
                max="10000"
                step="50"
                placeholder="Target score"
              />
            </div>
            <button
              @click="createGame"
              :disabled="loading"
              class="btn btn-primary"
            >
              {{ loading ? "Creating..." : "Create Game" }}
            </button>
          </div>
        </div>

        <div class="divider">OR</div>

        <div class="join-game-section">
          <h2>Join Existing Game</h2>
          <div class="join-game-form">
            <div class="input-group">
              <input
                v-model="gameIdToJoin"
                @keyup.enter="joinGame"
                placeholder="Game ID"
                class="game-id-input"
              />
              <button
                @click="joinGame"
                :disabled="!gameIdToJoin.trim() || loading"
                class="btn btn-secondary"
              >
                {{ loading ? "Joining..." : "Join Game" }}
              </button>
            </div>
          </div>
        </div>

        <div class="available-games-section">
          <h2>Available Games</h2>
          <div v-if="availableGames.length === 0" class="no-games">
            No games available. Create one to get started!
          </div>
          <div v-else class="games-list">
            <div
              v-for="game in availableGames"
              :key="game.id"
              class="game-card"
              @click="joinGameById(game.id)"
            >
              <div class="game-info">
                <h3>Game #{{ game.id.substring(0, 8) }}</h3>
                <p>Players: {{ game.players.length }}/4</p>
                <p>Target Score: {{ game.targetScore }}</p>
                <p>Status: {{ game.state.replace("_", " ") }}</p>
              </div>
              <div class="players-list">
                <div
                  v-for="player in game.players"
                  :key="player.id"
                  class="player-item"
                >
                  {{ player.name }} {{ player.isOnline ? "🟢" : "🔴" }}
                </div>
              </div>
              <button
                v-if="
                  game.state === 'WAITING_FOR_PLAYERS' &&
                  game.players.length < 4
                "
                class="btn btn-small btn-secondary"
                @click.stop="joinGameById(game.id)"
              >
                Join
              </button>
            </div>
          </div>
        </div>
      </div>

      <div v-if="error" class="error-message">
        {{ error }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import { multiplayerGameStateManager } from "../services/multiplayerGameStateManager";
import { apolloClient } from "../services/graphql/client";
import { GET_GAMES } from "../services/graphql/queries";
import type { MultiplayerGame } from "../services/multiplayerGameStateManager";

const router = useRouter();

const playerName = ref<string>("");
const tempPlayerName = ref<string>("");
const targetScore = ref<number>(500);
const gameIdToJoin = ref<string>("");
const loading = ref<boolean>(false);
const error = ref<string>("");
const availableGames = ref<MultiplayerGame[]>([]);

const canCreateOrJoin = computed(() => playerName.value.trim().length > 0);

const setPlayerName = () => {
  if (tempPlayerName.value.trim()) {
    playerName.value = tempPlayerName.value.trim();
    tempPlayerName.value = "";
    loadAvailableGames();
  }
};

const createGame = async () => {
  if (!playerName.value) return;

  loading.value = true;
  error.value = "";

  try {
    const game = await multiplayerGameStateManager.createGame(
      playerName.value,
      targetScore.value,
    );
    router.push({ name: "game", query: { gameId: game.id } });
  } catch (err) {
    error.value = err instanceof Error ? err.message : "Failed to create game";
  } finally {
    loading.value = false;
  }
};

const joinGame = async () => {
  if (!playerName.value || !gameIdToJoin.value.trim()) return;

  await joinGameById(gameIdToJoin.value.trim());
};

const joinGameById = async (gameId: string) => {
  if (!playerName.value) return;

  loading.value = true;
  error.value = "";

  try {
    const game = await multiplayerGameStateManager.joinGame(
      gameId,
      playerName.value,
    );
    router.push({ name: "game", query: { gameId: game.id } });
  } catch (err) {
    error.value = err instanceof Error ? err.message : "Failed to join game";
  } finally {
    loading.value = false;
  }
};

const loadAvailableGames = async () => {
  try {
    const result = await apolloClient.query({
      query: GET_GAMES,
      fetchPolicy: "network-only",
    });

    availableGames.value = result.data.games.filter(
      (game: MultiplayerGame) =>
        game.state === "WAITING_FOR_PLAYERS" || game.state === "IN_PROGRESS",
    );
  } catch (err) {
    console.error("Failed to load games:", err);
  }
};

onMounted(() => {
  if (playerName.value) {
    loadAvailableGames();
  }
});
</script>

<style scoped>
.lobby-container {
  width: 100%;
  margin: 0;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
  color: white;
  box-sizing: border-box;
}

.lobby-content-wrapper {
  max-width: 800px;
  margin: 0 auto;
}

.lobby-header {
  text-align: center;
  margin-bottom: 30px;
}

.lobby-header h1 {
  margin: 0 0 10px 0;
  font-size: 2.5rem;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

.player-info {
  background: rgba(255, 255, 255, 0.1);
  padding: 10px 20px;
  border-radius: 20px;
  display: inline-block;
}

.name-input-section {
  background: rgba(255, 255, 255, 0.1);
  padding: 30px;
  border-radius: 15px;
  text-align: center;
  margin-bottom: 30px;
}

.name-input-section h2 {
  margin-bottom: 20px;
}

.lobby-content {
  display: grid;
  gap: 30px;
}

.create-game-section,
.join-game-section,
.available-games-section {
  background: rgba(255, 255, 255, 0.1);
  padding: 25px;
  border-radius: 15px;
  backdrop-filter: blur(10px);
}

.create-game-section h2,
.join-game-section h2,
.available-games-section h2 {
  margin: 0 0 20px 0;
  color: #fff;
}

.input-group {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
}

.input-group label {
  font-weight: 500;
  min-width: 100px;
}

.name-input,
.game-id-input,
.score-input {
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  min-width: 200px;
}

.score-select {
  padding: 12px;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  background: white;
  min-width: 120px;
}

.divider {
  text-align: center;
  font-size: 1.2rem;
  font-weight: bold;
  color: rgba(255, 255, 255, 0.8);
  margin: 20px 0;
}

.games-list {
  display: grid;
  gap: 15px;
}

.game-card {
  background: rgba(255, 255, 255, 0.15);
  padding: 20px;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.game-card:hover {
  background: rgba(255, 255, 255, 0.25);
  border-color: rgba(255, 255, 255, 0.3);
  transform: translateY(-2px);
}

.game-info {
  margin-bottom: 15px;
}

.game-info h3 {
  margin: 0 0 10px 0;
  color: #fff;
}

.game-info p {
  margin: 5px 0;
  color: rgba(255, 255, 255, 0.9);
}

.players-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 15px;
}

.player-item {
  background: rgba(255, 255, 255, 0.2);
  padding: 5px 10px;
  border-radius: 15px;
  font-size: 0.9rem;
}

.no-games {
  text-align: center;
  color: rgba(255, 255, 255, 0.8);
  font-style: italic;
  padding: 40px;
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

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: #4caf50;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #45a049;
  transform: translateY(-2px);
}

.btn-secondary {
  background: #2196f3;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background: #1976d2;
  transform: translateY(-2px);
}

.btn-small {
  padding: 8px 16px;
  font-size: 0.9rem;
}

.error-message {
  background: rgba(244, 67, 54, 0.9);
  color: white;
  padding: 15px;
  border-radius: 8px;
  margin-top: 20px;
  text-align: center;
  font-weight: 500;
}

@media (max-width: 768px) {
  .lobby-container {
    padding: 15px;
  }

  .input-group {
    flex-direction: column;
    align-items: stretch;
  }

  .name-input,
  .game-id-input {
    min-width: auto;
  }

  .game-card {
    padding: 15px;
  }
}
</style>
