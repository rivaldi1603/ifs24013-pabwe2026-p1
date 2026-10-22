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

export const api = {
  // Auth
  async login(email, password) {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ email, password })
    });
    return res.json();
  },

  async register(payload) {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  async getMe() {
    const res = await fetch(`${BASE_URL}/auth/me`, {
      headers: getHeaders(true)
    });
    return res.json();
  },

  // Metadata
  async getCategories() {
    const res = await fetch(`${BASE_URL}/meta/categories`);
    return res.json();
  },

  async getRegencies() {
    const res = await fetch(`${BASE_URL}/meta/regencies`);
    return res.json();
  },

  async getStats() {
    const res = await fetch(`${BASE_URL}/meta/stats`);
    return res.json();
  },

  // Destinations
  async getDestinations(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${BASE_URL}/destinations?${query}`);
    return res.json();
  },

  async getFeaturedDestinations() {
    const res = await fetch(`${BASE_URL}/destinations/featured`);
    return res.json();
  },

  async getDestinationDetail(idOrSlug) {
    const res = await fetch(`${BASE_URL}/destinations/${idOrSlug}`);
    return res.json();
  },

  async createDestination(payload) {
    const res = await fetch(`${BASE_URL}/destinations`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  async updateDestination(id, payload) {
    const res = await fetch(`${BASE_URL}/destinations/${id}`, {
      method: 'PUT',
      headers: getHeaders(true),
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  async deleteDestination(id) {
    const res = await fetch(`${BASE_URL}/destinations/${id}`, {
      method: 'DELETE',
      headers: getHeaders(true)
    });
    return res.json();
  },

  // Services
  async getServices(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${BASE_URL}/services?${query}`);
    return res.json();
  },

  async getServiceDetail(idOrSlug) {
    const res = await fetch(`${BASE_URL}/services/${idOrSlug}`);
    return res.json();
  },

  async createService(payload) {
    const res = await fetch(`${BASE_URL}/services`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  async updateService(id, payload) {
    const res = await fetch(`${BASE_URL}/services/${id}`, {
      method: 'PUT',
      headers: getHeaders(true),
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  async deleteService(id) {
    const res = await fetch(`${BASE_URL}/services/${id}`, {
      method: 'DELETE',
      headers: getHeaders(true)
    });
    return res.json();
  },

  // Transport
  async getTransport(type) {
    const q = type ? `?type=${type}` : '';
    const res = await fetch(`${BASE_URL}/transport${q}`);
    return res.json();
  },

  // Culinary
  async getCulinary(halal) {
    const q = halal ? '?halal=1' : '';
    const res = await fetch(`${BASE_URL}/culinary${q}`);
    return res.json();
  },

  async getRestaurants(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${BASE_URL}/culinary/restaurants?${query}`);
    return res.json();
  },

  // Articles
  async getArticles() {
    const res = await fetch(`${BASE_URL}/articles`);
    return res.json();
  },

  // Reviews
  async getReviews(target_type, target_id) {
    const res = await fetch(`${BASE_URL}/reviews?target_type=${target_type}&target_id=${target_id}`);
    return res.json();
  },

  async submitReview(payload) {
    const res = await fetch(`${BASE_URL}/reviews`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify(payload)
    });
    return res.json();
  }
};
