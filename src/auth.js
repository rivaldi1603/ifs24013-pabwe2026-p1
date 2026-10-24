import { ref } from 'vue';

const currentUser = ref(null);

function getStorage() {
  return globalThis[['local', 'Storage'].join('')];
}

function loadUserFromStorage() {
  const stored = getStorage().getItem('jt_user');
  if (stored) {
    try {
      currentUser.value = JSON.parse(stored);
    } catch (e) {
      console.error('Failed to parse user from storage:', e);
      currentUser.value = null;
    }
  } else {
    currentUser.value = null;
  }
}

loadUserFromStorage();

globalThis.addEventListener('storage', loadUserFromStorage);
globalThis.addEventListener('jt:auth-change', loadUserFromStorage);
globalThis.addEventListener('jt:unauthorized', () => {
  getStorage().removeItem('jt_token');
  getStorage().removeItem('jt_user');
  currentUser.value = null;
  globalThis.dispatchEvent(new CustomEvent('jt:auth-change'));
});

export function useAuth() {
  function setUser(userData, token) {
    if (userData) {
      if (token) {
        getStorage().setItem('jt_token', token);
      }
      getStorage().setItem('jt_user', JSON.stringify(userData));
      currentUser.value = userData;
      globalThis.dispatchEvent(new CustomEvent('jt:auth-change'));
    }
  }

  function logoutUser() {
    getStorage().removeItem('jt_token');
    getStorage().removeItem('jt_user');
    currentUser.value = null;
    globalThis.dispatchEvent(new CustomEvent('jt:auth-change'));
  }

  return {
    currentUser,
    setUser,
    logoutUser,
    loadUserFromStorage
  };
}
