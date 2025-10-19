<script setup lang="ts">
import type { Card } from "@domain/model/card";

defineProps<{
  card: Card;
}>();

function getCardColor(card: Card): string {
  const cardType = (card as any).type;
  if (
    cardType === "WILD" ||
    cardType === "WILD_DRAW" ||
    cardType === "WILD DRAW"
  ) {
    return "#000000";
  }

  switch ((card as any).color) {
    case "RED":
      return "#E53935";
    case "YELLOW":
      return "#FDD835";
    case "GREEN":
      return "#43A047";
    case "BLUE":
      return "#1E88E5";
    default:
      return "#F5F5F5";
  }
}

function getTextColor(card: Card): string {
  const cardType = (card as any).type;
  if (
    cardType === "WILD" ||
    cardType === "WILD_DRAW" ||
    cardType === "WILD DRAW"
  ) {
    return "#FFFFFF";
  }
  if ("color" in card && card.color === "YELLOW") {
    return "#000000";
  }
  return "#FFFFFF";
}

function isWildCard(card: Card): boolean {
  const cardType = (card as any).type;
  return (
    cardType === "WILD" || cardType === "WILD_DRAW" || cardType === "WILD DRAW"
  );
}

function getCardSymbol(card: Card): string {
  if (card.type === "NUMBERED" && "number" in card) {
    return card.number.toString();
  }
  if (card.type === "SKIP") return "⊘";
  if (card.type === "REVERSE") return "⟲";
  if (card.type === "DRAW") return "+2";
  return "";
}

function getMainText(card: Card): string {
  const cardType = (card as any).type;
  if (card.type === "NUMBERED" && "number" in card) {
    return card.number.toString();
  }
  if (card.type === "SKIP") return "SKIP";
  if (card.type === "REVERSE") return "REVERSE";
  if (card.type === "DRAW") return "DRAW";
  if (card.type === "WILD") return "WILD";
  if (cardType === "WILD DRAW" || cardType === "WILD_DRAW") return "WILD";
  return "";
}

function getSubText(card: Card): string {
  const cardType = (card as any).type;
  if (card.type === "DRAW") return "+2";
  if (cardType === "WILD DRAW" || cardType === "WILD_DRAW") return "DRAW 4";
  return "";
}
</script>

<template>
  <div class="uno-card" :style="{ backgroundColor: getCardColor(card) }">
    <!-- Inner white oval background for colored cards -->
    <div v-if="!isWildCard(card)" class="white-oval"></div>

    <!-- Corner symbols -->
    <div class="corner-symbol top-left" :style="{ color: getTextColor(card) }">
      {{ getCardSymbol(card) }}
    </div>
    <div
      class="corner-symbol bottom-right"
      :style="{ color: getTextColor(card) }"
    >
      {{ getCardSymbol(card) }}
    </div>

    <!-- Wild card color quadrants -->
    <div v-if="isWildCard(card)" class="wild-background">
      <div class="wild-quadrants">
        <div class="quadrant red"></div>
        <div class="quadrant yellow"></div>
        <div class="quadrant blue"></div>
        <div class="quadrant green"></div>
      </div>
    </div>

    <!-- Main content area -->
    <div class="card-center">
      <!-- Colored oval for non-wild cards -->
      <div
        v-if="!isWildCard(card)"
        class="colored-oval"
        :style="{
          backgroundColor: getCardColor(card),
          borderColor: getTextColor(card),
        }"
      >
        <!-- Large center symbol -->
        <div class="center-symbol" :style="{ color: getTextColor(card) }">
          {{
            card.type === "NUMBERED" && "number" in card
              ? card.number
              : getCardSymbol(card)
          }}
        </div>
      </div>

      <!-- Wild card text -->
      <div v-if="isWildCard(card)" class="wild-text-container">
        <div class="wild-main-text">{{ getMainText(card) }}</div>
        <div v-if="getSubText(card)" class="wild-sub-text">
          {{ getSubText(card) }}
        </div>
      </div>
    </div>

    <!-- Action card text at bottom -->
    <div
      v-if="!isWildCard(card) && card.type !== 'NUMBERED'"
      class="action-text"
      :style="{ color: getTextColor(card) }"
    >
      <div class="action-main">{{ getMainText(card) }}</div>
      <div v-if="getSubText(card)" class="action-sub">
        {{ getSubText(card) }}
      </div>
    </div>

    <!-- UNO branding -->
    <div class="uno-logo" :style="{ color: getTextColor(card) }">UNO</div>
  </div>
</template>

<style scoped>
.uno-card {
  width: 80px;
  height: 120px;
  border-radius: 10px;
  box-shadow:
    0 2px 4px rgba(0, 0, 0, 0.2),
    0 4px 8px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  position: relative;
  font-family: "Arial Black", "Arial Bold", Arial, sans-serif;
  font-weight: 900;
  margin: 4px;
  border: 3px solid #ffffff;
  overflow: hidden;
}

.white-oval {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 90%;
  height: 85%;
  background: white;
  border-radius: 50%;
  z-index: 1;
}

.corner-symbol {
  position: absolute;
  font-size: 12px;
  font-weight: 900;
  line-height: 1;
  z-index: 3;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.top-left {
  top: 6px;
  left: 6px;
}

.bottom-right {
  bottom: 6px;
  right: 6px;
  transform: rotate(180deg);
}

.card-center {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  z-index: 2;
}

.colored-oval {
  width: 50px;
  height: 70px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 3px solid;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  transform: rotate(-20deg);
}

.center-symbol {
  font-size: 36px;
  font-weight: 900;
  line-height: 1;
  transform: rotate(20deg);
  text-shadow: 2px 2px 3px rgba(0, 0, 0, 0.2);
}

.action-text {
  position: absolute;
  bottom: 18px;
  left: 50%;
  transform: translateX(-50%);
  text-align: center;
  z-index: 3;
  line-height: 1.1;
}

.action-main {
  font-size: 9px;
  font-weight: 900;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.action-sub {
  font-size: 11px;
  font-weight: 900;
  margin-top: 1px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.uno-logo {
  position: absolute;
  bottom: 4px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 7px;
  font-weight: 900;
  z-index: 3;
  letter-spacing: 0.5px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

/* Wild card styles */
.wild-background {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 90%;
  height: 85%;
  background: white;
  border-radius: 50%;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.wild-quadrants {
  width: 48px;
  height: 48px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
  border-radius: 50%;
  overflow: hidden;
  transform: rotate(45deg);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.quadrant {
  width: 100%;
  height: 100%;
}

.quadrant.red {
  background-color: #e53935;
}

.quadrant.yellow {
  background-color: #fdd835;
}

.quadrant.blue {
  background-color: #1e88e5;
}

.quadrant.green {
  background-color: #43a047;
}

.wild-text-container {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  z-index: 3;
  color: white;
}

.wild-main-text {
  font-size: 12px;
  font-weight: 900;
  text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.8);
  letter-spacing: 0.5px;
}

.wild-sub-text {
  font-size: 9px;
  font-weight: 900;
  margin-top: 2px;
  text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.8);
  letter-spacing: 0.3px;
}
</style>
