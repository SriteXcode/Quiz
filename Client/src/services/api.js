const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Universal Request Helper with Token Authentication (supports JSON & FormData)
 */
const request = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = localStorage.getItem('quiz_token') || localStorage.getItem('token');

  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;

  const headers = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(options.headers || {})
  };

  if (token && !options.skipAuth) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers
  };

  if (!isFormData && options.body && typeof options.body === 'object') {
    config.body = JSON.stringify(options.body);
  }

  const res = await fetch(url, config);
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.message || `Request failed with status ${res.status}`);
  }

  return data;
};

// ==========================================
// Authentication Handlers
// ==========================================

export const apiRegister = async (userData) => {
  return await request('/auth/register', {
    method: 'POST',
    body: userData,
    skipAuth: true
  });
};

export const apiLogin = async (email, password) => {
  return await request('/auth/login', {
    method: 'POST',
    body: { email, password },
    skipAuth: true
  });
};

export const apiGoogleLogin = async (credential, clientId) => {
  return await request('/auth/google', {
    method: 'POST',
    body: { credential, clientId },
    skipAuth: true
  });
};

export const apiGetCurrentUser = async () => {
  return await request('/auth/me', {
    method: 'GET'
  });
};

export const apiUpdateProfile = async (profileData) => {
  const isFormData = typeof FormData !== 'undefined' && profileData instanceof FormData;
  return await request('/auth/profile', {
    method: 'PUT',
    body: profileData,
    headers: isFormData ? {} : { 'Content-Type': 'application/json' }
  });
};

// ==========================================
// Admin & User Management Handlers
// ==========================================

export const apiGetAdminStats = async () => {
  return await request('/admin/stats', {
    method: 'GET'
  });
};

export const apiGetAdminUsers = async (search = '', role = 'all') => {
  const query = new URLSearchParams();
  if (search) query.append('search', search);
  if (role && role !== 'all') query.append('role', role);

  return await request(`/admin/users?${query.toString()}`, {
    method: 'GET'
  });
};

export const apiUpdateUserRole = async (userId, role) => {
  return await request(`/admin/users/${userId}/role`, {
    method: 'PUT',
    body: { role }
  });
};

export const apiDeleteUser = async (userId) => {
  return await request(`/admin/users/${userId}`, {
    method: 'DELETE'
  });
};

// ==========================================
// Quizzes & Code Challenges Handlers
// ==========================================

export const apiGetQuizzes = async () => {
  return await request('/quizzes', {
    method: 'GET',
    skipAuth: true
  });
};

export const apiGetQuizById = async (quizId) => {
  return await request(`/quizzes/${quizId}`, {
    method: 'GET',
    skipAuth: true
  });
};

export const apiSubmitQuizResult = async (quizId, submissionData) => {
  return await request(`/quizzes/${quizId}/submit`, {
    method: 'POST',
    body: submissionData
  });
};

export const apiGetQuizLeaderboard = async (quizId) => {
  return await request(`/quizzes/${quizId}/leaderboard`, {
    method: 'GET',
    skipAuth: true
  });
};

export const apiGetQuizReview = async (quizId) => {
  return await request(`/quizzes/${quizId}/review`, {
    method: 'GET',
    skipAuth: true
  });
};

export const apiGetUserProfileStats = async (userId) => {
  const query = userId ? `?userId=${userId}` : '';
  return await request(`/quizzes/user/profile-stats${query}`, {
    method: 'GET'
  });
};

export const apiGetUserCertificates = async (userId) => {
  const query = userId ? `?userId=${userId}` : '';
  return await request(`/quizzes/user/certificates${query}`, {
    method: 'GET'
  });
};

export const apiGetCertificateById = async (certificateId) => {
  return await request(`/quizzes/certificate/${certificateId}`, {
    method: 'GET',
    skipAuth: true
  });
};

export const apiGetAdminQuizzes = async () => {
  return await request('/admin/quizzes', {
    method: 'GET'
  });
};

export const apiCreateQuiz = async (quizData) => {
  return await request('/admin/quizzes', {
    method: 'POST',
    body: quizData
  });
};

export const apiUpdateQuiz = async (quizId, quizData) => {
  return await request(`/admin/quizzes/${quizId}`, {
    method: 'PUT',
    body: quizData
  });
};

export const apiDeleteQuiz = async (quizId) => {
  return await request(`/admin/quizzes/${quizId}`, {
    method: 'DELETE'
  });
};

// ==========================================
// Previous Works REST API Handlers
// ==========================================

export const apiGetPreviousWorks = async () => {
  return await request('/previous-works', {
    method: 'GET',
    skipAuth: true
  });
};

export const apiGetPreviousWorkById = async (workId) => {
  return await request(`/previous-works/${workId}`, {
    method: 'GET',
    skipAuth: true
  });
};

export const apiGetAdminPreviousWorks = async () => {
  return await request('/admin/previous-works', {
    method: 'GET'
  });
};

export const apiCreatePreviousWork = async (workData) => {
  return await request('/admin/previous-works', {
    method: 'POST',
    body: workData
  });
};

export const apiUpdatePreviousWork = async (workId, workData) => {
  return await request(`/admin/previous-works/${workId}`, {
    method: 'PUT',
    body: workData
  });
};

export const apiDeletePreviousWork = async (workId) => {
  return await request(`/admin/previous-works/${workId}`, {
    method: 'DELETE'
  });
};

// ==========================================
// Short Gyaan (Reels / Shorts) REST API
// ==========================================

export const apiGetShortsGyaan = async (params = {}) => {
  const query = new URLSearchParams();
  if (params.category && params.category !== 'All' && params.category !== 'For You') query.append('category', params.category);
  if (params.savedOnly) query.append('savedOnly', 'true');
  if (params.search) query.append('search', params.search);
  
  return await request(`/shorts?${query.toString()}`, {
    method: 'GET'
  });
};

export const apiToggleLikeShort = async (shortId) => {
  return await request(`/shorts/${shortId}/like`, {
    method: 'POST'
  });
};

export const apiToggleSaveShort = async (shortId) => {
  return await request(`/shorts/${shortId}/save`, {
    method: 'POST'
  });
};

export const apiAdminUploadExcelShorts = async (formDataOrData) => {
  const isFormData = typeof FormData !== 'undefined' && formDataOrData instanceof FormData;
  return await request('/shorts/admin/upload-excel', {
    method: 'POST',
    body: formDataOrData,
    headers: isFormData ? {} : { 'Content-Type': 'application/json' }
  });
};

export const apiAdminCreateShort = async (shortData) => {
  return await request('/shorts/admin/create', {
    method: 'POST',
    body: shortData
  });
};

export const apiAdminDeleteShort = async (shortId) => {
  return await request(`/shorts/admin/${shortId}`, {
    method: 'DELETE'
  });
};

// ==========================================
// Site Settings & Legal Partners Handlers
// ==========================================

export const apiGetSiteSettings = async () => {
  return await request('/site/settings', {
    method: 'GET',
    skipAuth: true
  });
};

export const apiUpdateSiteSettings = async (settingsData) => {
  return await request('/admin/settings', {
    method: 'PUT',
    body: settingsData
  });
};

export const apiGetPublicPartners = async () => {
  return await request('/site/partners', {
    method: 'GET',
    skipAuth: true
  });
};

export const apiGetAdminPartners = async () => {
  return await request('/admin/partners', {
    method: 'GET'
  });
};

export const apiCreatePartner = async (partnerData) => {
  return await request('/admin/partners', {
    method: 'POST',
    body: partnerData
  });
};

export const apiUpdatePartner = async (partnerId, partnerData) => {
  return await request(`/admin/partners/${partnerId}`, {
    method: 'PUT',
    body: partnerData
  });
};

export const apiDeletePartner = async (partnerId) => {
  return await request(`/admin/partners/${partnerId}`, {
    method: 'DELETE'
  });
};

// ==========================================
// 📬 Contact Messages & Inquiries Handlers
// ==========================================

export const apiSubmitContactMessage = async (messageData) => {
  return await request('/site/messages', {
    method: 'POST',
    body: messageData,
    skipAuth: true
  });
};

export const apiGetAdminMessages = async ({ dateFilter = 'last_week', readFilter = 'all', priorityFilter = 'all', search = '' } = {}) => {
  const params = new URLSearchParams();
  if (dateFilter) params.append('dateFilter', dateFilter);
  if (readFilter) params.append('readFilter', readFilter);
  if (priorityFilter) params.append('priorityFilter', priorityFilter);
  if (search) params.append('search', search);

  const queryStr = params.toString() ? `?${params.toString()}` : '';
  return await request(`/admin/messages${queryStr}`, {
    method: 'GET'
  });
};

export const apiToggleMessageRead = async (messageId, isRead) => {
  return await request(`/admin/messages/${messageId}/read`, {
    method: 'PUT',
    body: { isRead }
  });
};

export const apiUpdateMessagePriority = async (messageId, priority) => {
  return await request(`/admin/messages/${messageId}/priority`, {
    method: 'PUT',
    body: { priority }
  });
};

export const apiDeleteMessage = async (messageId) => {
  return await request(`/admin/messages/${messageId}`, {
    method: 'DELETE'
  });
};

export default {
  apiRegister,
  apiLogin,
  apiGetCurrentUser,
  apiUpdateProfile,
  apiGetAdminStats,
  apiGetAdminUsers,
  apiUpdateUserRole,
  apiDeleteUser,
  apiGetQuizzes,
  apiGetQuizById,
  apiSubmitQuizResult,
  apiGetQuizLeaderboard,
  apiGetQuizReview,
  apiGetUserProfileStats,
  apiGetUserCertificates,
  apiGetCertificateById,
  apiGetAdminQuizzes,
  apiCreateQuiz,
  apiUpdateQuiz,
  apiDeleteQuiz,
  apiGetPreviousWorks,
  apiGetPreviousWorkById,
  apiGetAdminPreviousWorks,
  apiCreatePreviousWork,
  apiUpdatePreviousWork,
  apiDeletePreviousWork,
  apiGetShortsGyaan,
  apiToggleLikeShort,
  apiToggleSaveShort,
  apiAdminUploadExcelShorts,
  apiAdminCreateShort,
  apiAdminDeleteShort,
  apiGetSiteSettings,
  apiUpdateSiteSettings,
  apiGetPublicPartners,
  apiGetAdminPartners,
  apiCreatePartner,
  apiUpdatePartner,
  apiDeletePartner,
  apiSubmitContactMessage,
  apiGetAdminMessages,
  apiToggleMessageRead,
  apiUpdateMessagePriority,
  apiDeleteMessage
};