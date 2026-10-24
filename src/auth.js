import { ref } from 'vue';

const currentUser = ref(null);

function loadUserFromStorage() {
  const stored = localStorage.getItem('jt_user');
  if (stored) {
    try {
      currentUser.value = JSON.parse(stored);
    } catch (e) {
      currentUser.value = null;
    }
  } else {
    currentUser.value = null;
  }
}

loadUserFromStorage();

window.addEventListener('storage', loadUserFromStorage);
window.addEventListener('jt:auth-change', loadUserFromStorage);
window.addEventListener('jt:unauthorized', () => {
  localStorage.removeItem('jt_token');
  localStorage.removeItem('jt_user');
  currentUser.value = null;
  window.dispatchEvent(new CustomEvent('jt:auth-change'));
});

export function useAuth() {
  function setUser(userData, token) {
    if (userData) {
      if (token) {
        localStorage.setItem('jt_token', token);
      }
      localStorage.setItem('jt_user', JSON.stringify(userData));
      currentUser.value = userData;
      window.dispatchEvent(new CustomEvent('jt:auth-change'));
    }
  }

  function logoutUser() {
    localStorage.removeItem('jt_token');
    localStorage.removeItem('jt_user');
    currentUser.value = null;
    window.dispatchEvent(new CustomEvent('jt:auth-change'));
  }

  return {
    currentUser,
    setUser,
    logoutUser,
    loadUserFromStorage
  };
}
