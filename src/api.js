const BASE_URL = '/api';

function getHeaders(includeAuth = false) {
  const headers = {
    'Content-Type': 'application/json'
  };
  if (includeAuth) {
    const token = localStorage.getItem('jt_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }
  return headers;
}

/**
 * Centralized fetch wrapper. Always resolves to an object shaped like
 * { success: boolean, message?: string, ... } and never throws, so callers
 * can safely check `res.success` even on network / non-JSON failures.
 */
async function request(path, { method = 'GET', body, auth = false } = {}) {
  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: getHeaders(auth),
      body: body !== undefined ? JSON.stringify(body) : undefined
    });
  } catch (err) {
    return { success: false, message: 'Tidak dapat terhubung ke server. Periksa koneksi atau pastikan backend berjalan.' };
  }

  let data = null;
  try {
    data = await res.json();
  } catch (err) {
    return { success: false, message: `Respons server tidak valid (HTTP ${res.status}).` };
  }

  if (auth && (res.status === 401 || res.status === 403) && localStorage.getItem('jt_token')) {
    // Token missing/expired/invalid: clear it and notify the app
    if (res.status === 401 || /token/i.test(data?.message || '')) {
      localStorage.removeItem('jt_token');
      window.dispatchEvent(new CustomEvent('jt:unauthorized'));
    }
  }

  if (!res.ok && data && typeof data === 'object' && data.success === undefined) {
    data.success = false;
  }
  return data;
}

const qs = (params = {}) => new URLSearchParams(params).toString();

export const api = {
  // Auth
  login: (email, password) => request('/auth/login', { method: 'POST', body: { email, password } }),
  register: (payload) => request('/auth/register', { method: 'POST', body: payload }),
  getMe: () => request('/auth/me', { auth: true }),
  updateProfile: (payload) => request('/auth/profile', { method: 'PUT', body: payload, auth: true }),
  getUsers: () => request('/auth/users', { auth: true }),

  // Metadata
  getCategories: () => request('/meta/categories'),
  getRegencies: () => request('/meta/regencies'),
  getStats: () => request('/meta/stats'),

  // Destinations
  getDestinations: (params = {}) => request(`/destinations?${qs(params)}`),
  getFeaturedDestinations: () => request('/destinations/featured'),
  getDestinationDetail: (idOrSlug) => request(`/destinations/${idOrSlug}`),
  createDestination: (payload) => request('/destinations', { method: 'POST', body: payload, auth: true }),
  updateDestination: (id, payload) => request(`/destinations/${id}`, { method: 'PUT', body: payload, auth: true }),
  deleteDestination: (id) => request(`/destinations/${id}`, { method: 'DELETE', auth: true }),

  // Services
  getServices: (params = {}) => request(`/services?${qs(params)}`),
  getServiceDetail: (idOrSlug) => request(`/services/${idOrSlug}`),
  createService: (payload) => request('/services', { method: 'POST', body: payload, auth: true }),
  updateService: (id, payload) => request(`/services/${id}`, { method: 'PUT', body: payload, auth: true }),
  deleteService: (id) => request(`/services/${id}`, { method: 'DELETE', auth: true }),

  // Transport
  getTransport: (type) => request(`/transport${type ? `?type=${encodeURIComponent(type)}` : ''}`),
  createTransport: (payload) => request('/transport', { method: 'POST', body: payload, auth: true }),
  updateTransport: (id, payload) => request(`/transport/${id}`, { method: 'PUT', body: payload, auth: true }),
  deleteTransport: (id) => request(`/transport/${id}`, { method: 'DELETE', auth: true }),

  // Culinary
  getCulinary: (halal) => request(`/culinary${halal ? '?halal=1' : ''}`),
  getRestaurants: (params = {}) => request(`/culinary/restaurants?${qs(params)}`),
  createCulinary: (payload) => request('/culinary/items', { method: 'POST', body: payload, auth: true }),
  updateCulinary: (id, payload) => request(`/culinary/items/${id}`, { method: 'PUT', body: payload, auth: true }),
  deleteCulinary: (id) => request(`/culinary/items/${id}`, { method: 'DELETE', auth: true }),

  // Articles
  getArticles: () => request('/articles'),
  createArticle: (payload) => request('/articles', { method: 'POST', body: payload, auth: true }),
  updateArticle: (id, payload) => request(`/articles/${id}`, { method: 'PUT', body: payload, auth: true }),
  deleteArticle: (id) => request(`/articles/${id}`, { method: 'DELETE', auth: true }),

  // Reviews
  getReviews: (params = {}, maybeId) => {
    if (typeof params === 'string') {
      return request(`/reviews?${qs({ target_type: params, target_id: maybeId })}`);
    }
    return request(`/reviews?${qs(params)}`);
  },
  submitReview: (payload) => request('/reviews', { method: 'POST', body: payload, auth: true }),
  deleteReview: (id) => request(`/reviews/${id}`, { method: 'DELETE', auth: true })
};
