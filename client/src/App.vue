<script setup lang="ts">
import {
  CardColor,
  CardType,
  createActionCard,
  createNumberCard,
  createWildCard,
  type Card,
} from "@domain/model/card";
import UnoCard from "./components/UnoCard.vue";

const card1: Card = createNumberCard(CardColor.Red, 5);
const card2: Card = createNumberCard(CardColor.Green, 10);
const card3: Card = createActionCard(CardColor.Blue, CardType.Skip);
const card4: Card = createActionCard(CardColor.Yellow, CardType.Reverse);
const card5: Card = createWildCard(CardType.Wild);
const card6: Card = createWildCard(CardType.WildDrawFour);
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
