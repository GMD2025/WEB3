<template>
  <div class="game-over-overlay">
    <div class="game-over-modal">
      <div class="game-over-header">
        <div class="trophy-icon">🏆</div>
        <h1 class="game-over-title">Game Over!</h1>
        <p class="winner-announcement">
          <span class="winner-name">{{ winnerName }}</span> wins the game!
        </p>
      </div>

      <div class="game-stats">
        <div class="final-scores">
          <h2>Final Scores</h2>
          <div class="scores-list">
            <div
              v-for="(player, index) in players"
              :key="index"
              class="score-item"
              :class="{ winner: index === winnerIndex }"
            >
              <div class="player-info">
                <div class="player-avatar">
                  {{ index === winnerIndex ? "👑" : getPlayerEmoji(player, index) }}
                </div>
                <div class="player-details">
                  <span class="player-name">{{ player.name }}</span>
                  <span class="player-type">{{ player.isBot ? "Bot" : "Human" }}</span>
                </div>
              </div>
              <div class="score-value">{{ scores[index] || 0 }}</div>
            </div>
          </div>
        </div>

        <div class="game-summary">
          <h2>Game Summary</h2>
          <div class="summary-stats">
            <div class="stat-item">
              <span class="stat-label">Target Score:</span>
              <span class="stat-value">{{ targetScore }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Rounds Played:</span>
              <span class="stat-value">{{ roundCount }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Game Duration:</span>
              <span class="stat-value">{{ gameDuration }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="victory-message">
        <div class="victory-animation">
          <div class="confetti">🎉</div>
          <div class="confetti">🎊</div>
          <div class="confetti">✨</div>
          <div class="confetti">🎈</div>
        </div>
        <p class="victory-text">
          {{ getVictoryMessage() }}
        </p>
      </div>

      <div class="game-over-actions">
        <button @click="onNewGame" class="btn btn-primary btn-large">
          🎮 Play Again
        </button>
        <button @click="onBackToSetup" class="btn btn-secondary btn-large">
          ⚙️ Change Settings
        </button>
        <button @click="onMainMenu" class="btn btn-tertiary">
          🏠 Main Menu
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { PlayerConfig } from '../services/gameStateManager';

interface Props {
  winnerIndex: number;
  players: PlayerConfig[];
  scores: number[];
  targetScore: number;
  gameStartTime?: Date;
}

interface Emits {
  newGame: [];
  backToSetup: [];
  mainMenu: [];
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const winnerName = computed(() => {
  return props.players[props.winnerIndex]?.name || 'Unknown';
});

const gameDuration = computed(() => {
  if (!props.gameStartTime) return 'Unknown';
  
  const duration = Date.now() - props.gameStartTime.getTime();
  const minutes = Math.floor(duration / 60000);
  const seconds = Math.floor((duration % 60000) / 1000);
  
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
});

const roundCount = computed(() => {
  const maxScore = Math.max(...props.scores);
  return Math.ceil(maxScore / 100); // Rough estimate
});

function getPlayerEmoji(player: PlayerConfig, index: number): string {
  if (player.isBot) {
    switch (player.botDifficulty) {
      case 'easy': return '🤖';
      case 'medium': return '🔧';
      case 'hard': return '⚡';
      default: return '🤖';
    }
  }
  
  const humanEmojis = ['😊', '😎', '🎯', '🎪'];
  return humanEmojis[index % humanEmojis.length] || '😊';
}

function getVictoryMessage(): string {
  const winner = props.players[props.winnerIndex];
  if (!winner) return 'Congratulations!';
  
  if (winner.isBot) {
    const messages = [
      `${winner.name} dominated this game!`,
      `The AI has proven its superiority!`,
      `${winner.name} calculated the perfect victory!`,
      `Beep boop! ${winner.name} wins!`
    ];
    return messages[Math.floor(Math.random() * messages.length)] || `${winner.name} wins!`;
  } else {
    const messages = [
      `Amazing victory, ${winner.name}!`,
      `${winner.name} showed incredible skill!`,
      `Human ingenuity triumphs!`,
      `Congratulations on your victory, ${winner.name}!`
    ];
    return messages[Math.floor(Math.random() * messages.length)] || `Congratulations, ${winner.name}!`;
  }
}

function onNewGame() {
  emit('newGame');
}

function onBackToSetup() {
  emit('backToSetup');
}

function onMainMenu() {
  emit('mainMenu');
}
</script>

<style scoped>
.game-over-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  animation: fadeIn 0.5s ease-out;
}

.game-over-modal {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 20px;
  padding: 2rem;
  max-width: 600px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  color: white;
  animation: slideIn 0.6s ease-out;
}

.game-over-header {
  text-align: center;
  margin-bottom: 2rem;
}

.trophy-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
  animation: bounce 2s infinite;
}

.game-over-title {
  font-size: 2.5rem;
  font-weight: bold;
  margin: 0 0 1rem 0;
  background: linear-gradient(45deg, #ffd700, #ffed4e);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.winner-announcement {
  font-size: 1.5rem;
  margin: 0;
}

.winner-name {
  font-weight: bold;
  color: #ffd700;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
}

.game-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  margin-bottom: 2rem;
}

@media (max-width: 768px) {
  .game-stats {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
}

.final-scores h2,
.game-summary h2 {
  font-size: 1.3rem;
  margin-bottom: 1rem;
  color: #ffd700;
  border-bottom: 2px solid rgba(255, 215, 0, 0.3);
  padding-bottom: 0.5rem;
}

.scores-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.score-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(255, 255, 255, 0.1);
  padding: 0.75rem;
  border-radius: 10px;
  transition: all 0.3s ease;
}

.score-item.winner {
  background: linear-gradient(90deg, rgba(255, 215, 0, 0.3), rgba(255, 215, 0, 0.1));
  border: 2px solid #ffd700;
  transform: scale(1.02);
}

.player-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.player-avatar {
  font-size: 1.5rem;
  width: 2.5rem;
  height: 2.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
}

.player-details {
  display: flex;
  flex-direction: column;
}

.player-name {
  font-weight: bold;
  font-size: 1.1rem;
}

.player-type {
  font-size: 0.8rem;
  opacity: 0.7;
}

.score-value {
  font-size: 1.2rem;
  font-weight: bold;
  color: #ffd700;
}

.summary-stats {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.stat-label {
  opacity: 0.8;
}

.stat-value {
  font-weight: bold;
  color: #ffd700;
}

.victory-message {
  text-align: center;
  margin: 2rem 0;
  position: relative;
}

.victory-animation {
  position: relative;
  height: 60px;
  overflow: hidden;
}

.confetti {
  position: absolute;
  font-size: 2rem;
  animation: confetti-fall 3s infinite linear;
}

.confetti:nth-child(1) {
  left: 20%;
  animation-delay: 0s;
}

.confetti:nth-child(2) {
  left: 40%;
  animation-delay: 0.5s;
}

.confetti:nth-child(3) {
  left: 60%;
  animation-delay: 1s;
}

.confetti:nth-child(4) {
  left: 80%;
  animation-delay: 1.5s;
}

.victory-text {
  font-size: 1.2rem;
  font-style: italic;
  margin-top: 1rem;
  opacity: 0.9;
}

.game-over-actions {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 2rem;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 10px;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.btn-large {
  padding: 1rem 2rem;
  font-size: 1.1rem;
}

.btn-primary {
  background: linear-gradient(45deg, #4facfe, #00f2fe);
  color: white;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(79, 172, 254, 0.4);
}

.btn-secondary {
  background: linear-gradient(45deg, #fa709a, #fee140);
  color: white;
}

.btn-secondary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(250, 112, 154, 0.4);
}

.btn-tertiary {
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border: 2px solid rgba(255, 255, 255, 0.3);
}

.btn-tertiary:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.5);
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideIn {
  from {
    transform: translateY(-50px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@keyframes bounce {
  0%, 20%, 53%, 80%, 100% {
    transform: translateY(0);
  }
  40%, 43% {
    transform: translateY(-10px);
  }
  70% {
    transform: translateY(-5px);
  }
  90% {
    transform: translateY(-2px);
  }
}

@keyframes confetti-fall {
  0% {
    transform: translateY(-60px) rotate(0deg);
    opacity: 1;
  }
  100% {
    transform: translateY(60px) rotate(360deg);
    opacity: 0;
  }
}
</style>