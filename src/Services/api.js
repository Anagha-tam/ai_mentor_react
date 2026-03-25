const BASE_URL = import.meta.env.VITE_API_URL || 'http://192.168.29.171:5000/api';

// Utility for constructing headers
const getHeaders = (requireAuth = false) => {
  const headers = {
    'Content-Type': 'application/json',
  };

  if (requireAuth) {
    const token = localStorage.getItem('token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  return headers;
};

// Standardized response handler
const handleResponse = async (response) => {
  let data;
  try {
    data = await response.json();
  } catch (err) {
    data = { message: 'Invalid server response' };
  }

  if (!response.ok) {
    throw new Error(data.message || data.error || 'API request failed');
  }
  
  return data;
};

// =======================
// AUTHENTICATION APIs
// =======================

/**
 * Register a new user
 * @param {Object} userData - { firstName, lastName, email, phonenumber, stream, class, password }
 */
export const registerUser = async (userData) => {
  const response = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: getHeaders(false),
    body: JSON.stringify(userData),
  });
  return handleResponse(response);
};

/**
 * Login existing user
 * @param {Object} credentials - { email, password }
 */
export const loginUser = async (credentials) => {
  const response = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: getHeaders(false),
    body: JSON.stringify(credentials),
  });
  return handleResponse(response);
};

/**
 * Get authenticated user profile
 */
export const getUserProfile = async () => {
  const response = await fetch(`${BASE_URL}/auth/profile`, {
    method: 'GET',
    headers: getHeaders(true),
  });
  return handleResponse(response);
};

// =======================
// APPLICATION DATA APIs
// =======================

/**
 * Store data securely
 * @param {Object} dataPayload - Data to store
 */
export const storeData = async (dataPayload) => {
  const response = await fetch(`${BASE_URL}/data/store`, {
    method: 'POST',
    headers: getHeaders(true),
    body: JSON.stringify(dataPayload),
  });
  return handleResponse(response);
};

/**
 * Get data belonging to the authenticated user
 */
export const getData = async () => {
  const response = await fetch(`${BASE_URL}/data/`, {
    method: 'GET',
    headers: getHeaders(true),
  });
  return handleResponse(response);
};
/**
 * Get a sandbox token for testing
 * @param {string} email - Mock email
 */
export const getSandboxToken = async (email = 'sandbox@test.com') => {
  const response = await fetch(`${BASE_URL}/auth/sandbox/token`, {
    method: 'POST',
    headers: getHeaders(false),
    body: JSON.stringify({ email }),
  });
  const data = await handleResponse(response);
  if (data.token) {
    localStorage.setItem('token', data.token);
  }
  return data;
};
