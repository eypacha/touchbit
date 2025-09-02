import { createRouter, createWebHistory } from "vue-router";
import MainView from "../views/MainView.vue";
import StreamView from "../views/StreamView.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "main",
      component: MainView,
    },
        {
      path: "/stream",
      name: "stream",
      component: StreamView,
    },
    {
      path: "/:catchAll(.*)", 
      name: "catch-all",
      component: MainView,
    },
  ],
});

export default router;
