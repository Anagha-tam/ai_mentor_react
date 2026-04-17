const BASE_URL = import.meta.env.VITE_API_URL || '/api';

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
    const errorMsg = data.message || data.error || `API Request failed with status ${response.status}`;
    console.error(`API Error [${response.status}]:`, errorMsg, data);
    throw new Error(errorMsg);
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
 * Save/Update all academic onboarding data
 * @param {Object} onboardingData - The collected academic info
 */
export const saveOnboardingData = async (onboardingData) => {
  const response = await fetch(`${BASE_URL}/data/onboarding`, {
    method: 'POST',
    headers: getHeaders(true),
    body: JSON.stringify(onboardingData),
  });
  return handleResponse(response);
};

/**
 * Get full Identity + Academic info
 */
export const getProfileData = async () => {
  const response = await fetch(`${BASE_URL}/data/profile`, {
    method: 'GET',
    headers: getHeaders(true),
  });
  return handleResponse(response);
};

/** Fetch all study plans */
export const getStudyPlans = async () => {
  const response = await fetch(`${BASE_URL}/data/study-plans`, {
    method: 'GET',
    headers: getHeaders(true),
  });
  return handleResponse(response);
};

/** Fetch all study materials */
export const getStudyMaterials = async () => {
  const response = await fetch(`${BASE_URL}/data/study-materials`, {
    method: 'GET',
    headers: getHeaders(true),
  });
  return handleResponse(response);
};

/** Download a study material PDF by ID */
export const downloadMaterial = async (id) => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${BASE_URL}/data/download-material/${id}`, {
    method: 'GET',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || `Download failed (${response.status})`);
  }
  return response.blob();
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
