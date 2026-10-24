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
import AdminView from '../views/AdminView.vue';
import ProfileView from '../views/ProfileView.vue';
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
  { 
    path: '/admin', 
    name: 'admin', 
    component: AdminView,
    meta: { requiresAuth: true, role: 'admin' }
  },
  { 
    path: '/profil', 
    alias: ['/profile', '/pengaturan'],
    name: 'profile', 
    component: ProfileView,
    meta: { requiresAuth: true }
  },
  { 
    path: '/settings', 
    name: 'settings', 
    component: ProfileView,
    meta: { requiresAuth: true }
  },
  { 
    path: '/dashboard', 
    name: 'dashboard', 
    component: DashboardView,
    meta: { requiresAuth: true }
  },
  {
    path: '/auth/login',
    name: 'login',
    component: LoginView,
    meta: { guestOnly: true }
  },
  {
    path: '/auth/register',
    alias: ['/auth/regiter'],
    name: 'register',
    component: LoginView,
    meta: { guestOnly: true }
  },
  // Legacy paths -> canonical auth paths (query such as ?redirect= is preserved)
  { path: '/login', redirect: to => ({ path: '/auth/login', query: to.query }) },
  { path: '/register', redirect: to => ({ path: '/auth/register', query: to.query }) },
  { path: '/regiter', redirect: to => ({ path: '/auth/regiter', query: to.query }) },
  { path: '/auth', redirect: '/auth/login' },
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

// Professional Navigation Guard
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('jt_token');
  let user = null;
  const userStr = localStorage.getItem('jt_user');
  if (userStr) {
    try {
      user = JSON.parse(userStr);
    } catch (e) {
      user = null;
    }
  }

  // Protected Route Check
  if (to.meta.requiresAuth) {
    if (!token || !user) {
      return next({ path: '/auth/login', query: { redirect: to.fullPath } });
    }

    // Role-specific check (e.g. only admin can access /admin)
    if (to.meta.role && user.role !== to.meta.role) {
      return next({ path: '/profil' });
    }
  }

  // If already logged in and opening login/register, redirect cleanly
  if (to.meta.guestOnly && token && user) {
    if (user.role === 'admin') {
      return next({ path: '/admin' });
    }
    return next({ path: '/profil' });
  }

  next();
});

export default router;
