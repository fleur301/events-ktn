import { createRouter, createWebHistory } from 'vue-router';
import EventsPage from '../components/Events.vue';
import EventDetailsPage from '../components/EventDetails.vue';

const routes = [
  { path: '/events', name: 'Home', component: EventsPage },
  { path: '/details/:slug', name: 'Details', component: EventDetailsPage },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
