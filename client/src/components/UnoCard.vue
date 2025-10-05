<script setup lang="ts">
// Import types if using from separate modules, or define them locally if needed
import type { Card } from "@domain/model/card";

defineProps<{
  card: Card;
}>();

function displayCardText(card: Card): string {
  if (card.type === "NUMBERED" && "number" in card) {
    return `${card.number}`;
  }
  if (card.type === "SKIP") return "Skip";
  if (card.type === "REVERSE") return "Rev";
  if (card.type === "DRAW") return "+2";
  if (card.type === "WILD") return "Wild";
  if (card.type === "WILD DRAW") return "+4";
  return "";
}

function getCardColor(card: Card): string {
  switch (card.color) {
    case "RED":
      return "#E53E3E";
    case "YELLOW":
      return "#ECC94B";
    case "GREEN":
      return "#38A169";
    case "BLUE":
      return "#3182CE";
    case "WILD":
      return "#210624";
    default:
      return "#EDF2F7";
  }
}
</script>

<template>
  <div
    style="
      width: 60px;
      height: 90px;
      border-radius: 8px;
      box-shadow: 0 2px 6px #3333;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      font-size: 2em;
      color: white;
      font-family: Arial, sans-serif;
      margin: 4px;
      border: 2px solid #fff;
    "
    :style="{ backgroundColor: getCardColor(card) }"
  >
    <span>{{ displayCardText(card) }}</span>
  </div>
</template>
