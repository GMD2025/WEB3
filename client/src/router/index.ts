import { createRouter, createWebHistory } from "vue-router";
import GameSetup from "../components/GameSetup.vue";
import GameScreen from "../components/GameScreen.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "setup",
      component: GameSetup,
    },
    {
      path: "/game",
      name: "game",
      component: GameScreen,
    },
    {
      path: "/:pathMatch(.*)*",
      redirect: "/",
    },
  ],
});

export default router;
