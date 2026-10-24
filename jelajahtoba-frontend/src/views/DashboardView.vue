<template>
  <div class="container text-center" style="padding: 4rem 1rem;">
    <p>Mengalihkan ke halaman yang sesuai...</p>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth } from '../auth';

const router = useRouter();
const { currentUser: user } = useAuth();

onMounted(() => {
  if (!user.value) {
    router.replace('/auth/login');
  } else if (user.value.role === 'admin') {
    router.replace('/admin');
  } else {
    router.replace('/profil');
  }
});
</script>
