<script setup lang="ts">
import { type Card } from "@domain/model/card";
import UnoCard from "./components/UnoCard.vue";

const card1: Card = {
  type: "NUMBERED",
  color: "RED",
  number: 5,
};
const card2: Card = {
  type: "NUMBERED",
  color: "GREEN",
  number: 10,
};
const card3: Card = {
  type: "SKIP",
  color: "BLUE",
};
const card4: Card = {
  type: "REVERSE",
  color: "YELLOW",
};
const card5: Card = {
  type: "WILD",
};
const card6: Card = {
  type: "WILD DRAW",
};
</script>

<template>
  <UnoCard :card="card1" />
  <UnoCard :card="card2" />
  <UnoCard :card="card3" />
  <UnoCard :card="card4" />
  <UnoCard :card="card5" />
  <UnoCard :card="card6" />
</template>

<style scoped></style>
