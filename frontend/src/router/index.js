import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '../views/HomeView.vue';
import DestinationsView from '../views/DestinationsView.vue';
import DestinationDetailView from '../views/DestinationDetailView.vue';
import ServicesView from '../views/ServicesView.vue';
import ServiceDetailView from '../views/ServiceDetailView.vue';
import TransportView from '../views/TransportView.vue';
import CulinaryView from '../views/CulinaryView.vue';
import ArticlesView from '../views/ArticlesView.vue';
import DashboardView from '../views/DashboardView.vue';
import LoginView from '../views/LoginView.vue';

const routes = [
  { path: '/', name: 'home', component: HomeView },
  { path: '/destinasi', name: 'destinations', component: DestinationsView },
  { path: '/destinasi/:slug', name: 'destination-detail', component: DestinationDetailView },
  { path: '/jasa-lokal', name: 'services', component: ServicesView },
  { path: '/jasa-lokal/:slug', name: 'service-detail', component: ServiceDetailView },
  { path: '/transportasi', name: 'transport', component: TransportView },
  { path: '/kuliner', name: 'culinary', component: CulinaryView },
  { path: '/cerita', name: 'articles', component: ArticlesView },
  { path: '/dashboard', name: 'dashboard', component: DashboardView },
  { path: '/login', name: 'login', component: LoginView },
  { path: '/:pathMatch(.*)*', redirect: '/' }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition;
    } else {
      return { top: 0 };
    }
  }
});

export default router;
