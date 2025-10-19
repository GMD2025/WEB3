import { createRouter, createWebHistory } from "vue-router";
import GameSetup from "../components/GameSetup.vue";
import GameScreen from "../components/GameScreen.vue";
import GameLobby from "../components/GameLobby.vue";
import MultiplayerGameScreen from "../components/MultiplayerGameScreen.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "lobby",
      component: GameLobby,
    },
    {
      path: "/single-player",
      name: "setup",
      component: GameSetup,
    },
    {
      path: "/single-player-game",
      name: "single-game",
      component: GameScreen,
    },
    {
      path: "/game",
      name: "game",
      component: MultiplayerGameScreen,
    },
    {
      path: "/:pathMatch(.*)*",
      redirect: "/",
    },
  ],
});

export default router;
