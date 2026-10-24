import { describe, it, expect, beforeEach } from 'vitest';
import { useAuth } from '../auth.js';

describe('auth.js composable unit tests', () => {
  beforeEach(() => {
    localStorage.clear();
    const { logoutUser } = useAuth();
    logoutUser();
  });

  it('initializes with null user when localStorage is empty', () => {
    const { currentUser, loadUserFromStorage } = useAuth();
    loadUserFromStorage();
    expect(currentUser.value).toBeNull();
  });

  it('loads valid user from localStorage', () => {
    const mockUser = { id: 1, name: 'Budi Traveler', role: 'user' };
    localStorage.setItem('jt_user', JSON.stringify(mockUser));
    const { currentUser, loadUserFromStorage } = useAuth();
    loadUserFromStorage();
    expect(currentUser.value).toEqual(mockUser);
  });

  it('handles invalid JSON in localStorage gracefully', () => {
    localStorage.setItem('jt_user', 'invalid-json-string');
    const { currentUser, loadUserFromStorage } = useAuth();
    loadUserFromStorage();
    expect(currentUser.value).toBeNull();
  });

  it('setUser saves user and token to localStorage and updates state', () => {
    const { currentUser, setUser } = useAuth();
    const mockUser = { id: 2, name: 'Admin Toba', role: 'admin' };
    setUser(mockUser, 'fake-jwt-token-123');

    expect(currentUser.value).toEqual(mockUser);
    expect(localStorage.getItem('jt_token')).toBe('fake-jwt-token-123');
    expect(JSON.parse(localStorage.getItem('jt_user'))).toEqual(mockUser);
  });

  it('setUser without token still updates user', () => {
    const { currentUser, setUser } = useAuth();
    const mockUser = { id: 3, name: 'Mitra Ulos', role: 'partner' };
    setUser(mockUser);

    expect(currentUser.value).toEqual(mockUser);
    expect(JSON.parse(localStorage.getItem('jt_user'))).toEqual(mockUser);
  });

  it('setUser ignores falsy user data', () => {
    const { currentUser, setUser } = useAuth();
    setUser(null);
    expect(currentUser.value).toBeNull();
  });

  it('logoutUser clears localStorage and resets state', () => {
    const { currentUser, setUser, logoutUser } = useAuth();
    setUser({ id: 1, name: 'Test' }, 'token');
    expect(currentUser.value).not.toBeNull();

    logoutUser();
    expect(currentUser.value).toBeNull();
    expect(localStorage.getItem('jt_token')).toBeNull();
    expect(localStorage.getItem('jt_user')).toBeNull();
  });

  it('responds to jt:unauthorized event by clearing credentials', () => {
    const { currentUser, setUser } = useAuth();
    setUser({ id: 99, name: 'Expired User' }, 'old-token');

    window.dispatchEvent(new CustomEvent('jt:unauthorized'));

    expect(currentUser.value).toBeNull();
    expect(localStorage.getItem('jt_token')).toBeNull();
  });

  it('responds to storage and jt:auth-change events', () => {
    const { currentUser } = useAuth();
    const mockUser = { id: 10, name: 'Sync User' };
    localStorage.setItem('jt_user', JSON.stringify(mockUser));

    window.dispatchEvent(new Event('storage'));
    expect(currentUser.value).toEqual(mockUser);

    localStorage.removeItem('jt_user');
    window.dispatchEvent(new CustomEvent('jt:auth-change'));
    expect(currentUser.value).toBeNull();
  });
});
