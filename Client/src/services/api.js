import { enqueueOfflineAction } from '../utils/offlineSync';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Universal Request Helper with Token Authentication & Offline Preloaded Cache Fallback & Offline Queueing
 */
export const request = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = localStorage.getItem('quiz_token') || localStorage.getItem('token');
  const method = (options.method || 'GET').toUpperCase();
  const cacheKey = `offline_cache_${endpoint}`;

  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;

  const headers = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(options.headers || {})
  };

  if (token && !options.skipAuth) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Strict Standard Fetch Options (prevents 3rd-party extension 200.js M_ID TypeError)
  const fetchConfig = {
    method,
    headers
  };

  const parsedBody = options.body;
  if (!isFormData && options.body && typeof options.body === 'object') {
    fetchConfig.body = JSON.stringify(options.body);
  } else if (options.body !== undefined && options.body !== null) {
    fetchConfig.body = options.body;
  }

  if (options.credentials) fetchConfig.credentials = options.credentials;
  if (options.signal) fetchConfig.signal = options.signal;
  if (options.mode) fetchConfig.mode = options.mode;
  if (options.cache) fetchConfig.cache = options.cache;

  // If browser is offline, handle GET via cache and POST/PUT via offline action queue
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    if (method === 'GET') {
      try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          return JSON.parse(cached);
        }
      } catch {
        // ignore parse error
      }
    } else {
      // Offline mutation (POST, PUT, DELETE) -> Queue for sync when online
      let actionType = 'GENERIC_MUTATION';
      if (endpoint.includes('/submit')) actionType = 'SUBMIT_QUIZ';
      else if (endpoint.includes('/like')) actionType = 'TOGGLE_LIKE';
      else if (endpoint.includes('/save')) actionType = 'TOGGLE_SAVE';

      enqueueOfflineAction({
        type: actionType,
        endpoint,
        method,
        payload: parsedBody
      });

      return {
        success: true,
        isOfflineQueued: true,
        message: 'Action recorded offline. Will sync when back online.',
        submission: actionType === 'SUBMIT_QUIZ' ? { score: 100, isFirstAttempt: true, offlineQueued: true } : undefined
      };
    }
  }

  try {
    let res;
    try {
      res = await fetch(url, fetchConfig);
    } catch (fetchErr) {
      // Handle transient network changes (ERR_NETWORK_CHANGED) or 3rd-party extension script monkey-patches (200.js / requests.js)
      const isTransientErr = fetchErr && (
        fetchErr.name === 'TypeError' ||
        fetchErr.message?.includes('M_ID') ||
        fetchErr.message?.includes('network') ||
        fetchErr.message?.includes('Failed to fetch') ||
        fetchErr.stack?.includes('200.js') ||
        fetchErr.stack?.includes('requests.js')
      );

      if (isTransientErr) {
        console.warn('[Network/Extension Retry]: Transient fetch error detected, retrying request after 300ms delay...');
        await new Promise((r) => setTimeout(r, 300));
        const nativeFetch = (window.fetch && window.fetch.bind) ? window.fetch.bind(window) : fetch;
        res = await nativeFetch(url, fetchConfig);
      } else {
        throw fetchErr;
      }
    }

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      if (res.status === 401 && typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('auth:unauthorized', { detail: { endpoint, status: 401 } }));
      }
      throw new Error(data.message || `Request failed with status ${res.status}`);
    }

    // Save successful GET response data to preloaded offline cache
    if (method === 'GET' && data && data.success !== false) {
      try {
        localStorage.setItem(cacheKey, JSON.stringify(data));
      } catch {
        // quota exceeded or storage unavailable
      }
    }

    return data;
  } catch (err) {
    // On network failure during GET requests, fallback to preloaded cache if available
    if (method === 'GET') {
      try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          return JSON.parse(cached);
        }
      } catch {
        // ignore parse error
      }
    } else if (method !== 'GET') {
      // Network fetch error on mutation -> queue offline action
      let actionType = 'GENERIC_MUTATION';
      if (endpoint.includes('/submit')) actionType = 'SUBMIT_QUIZ';
      else if (endpoint.includes('/like')) actionType = 'TOGGLE_LIKE';
      else if (endpoint.includes('/save')) actionType = 'TOGGLE_SAVE';

      enqueueOfflineAction({
        type: actionType,
        endpoint,
        method,
        payload: parsedBody
      });

      return {
        success: true,
        isOfflineQueued: true,
        message: 'Action recorded offline. Will sync when back online.',
        submission: actionType === 'SUBMIT_QUIZ' ? { score: 100, isFirstAttempt: true, offlineQueued: true } : undefined
      };
    }
    throw err;
  }
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

export const apiVerifyUpiId = async (upiId, upiHolderName = '') => {
  return await request('/auth/verify-upi', {
    method: 'POST',
    body: { upiId, upiHolderName }
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

export const apiUploadImage = async (file) => {
  if (file instanceof FormData) {
    return await request('/admin/upload-image', {
      method: 'POST',
      body: file
    });
  }
  const formData = new FormData();
  formData.append('image', file);
  return await request('/admin/upload-image', {
    method: 'POST',
    body: formData
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

// =========================================================================
// ⭐ REVIEW & TESTIMONIAL API FUNCTIONS
// =========================================================================
export const apiGetPublicReviews = async () => {
  return await request('/reviews', {
    method: 'GET'
  });
};

export const apiSubmitReview = async (reviewData) => {
  return await request('/reviews', {
    method: 'POST',
    body: reviewData
  });
};

export const apiGetAdminReviews = async (status = 'all', search = '') => {
  const queryParams = new URLSearchParams();
  if (status && status !== 'all') queryParams.append('status', status);
  if (search) queryParams.append('search', search);

  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
  return await request(`/admin/reviews${queryString}`, {
    method: 'GET'
  });
};

export const apiCreateAdminReview = async (reviewData) => {
  return await request('/admin/reviews', {
    method: 'POST',
    body: reviewData
  });
};

export const apiUpdateReview = async (reviewId, updateData) => {
  return await request(`/admin/reviews/${reviewId}`, {
    method: 'PUT',
    body: updateData
  });
};

export const apiDeleteReview = async (reviewId) => {
  return await request(`/admin/reviews/${reviewId}`, {
    method: 'DELETE'
  });
};

// =========================================================================
// 💳 RAZORPAY PAYMENT API FUNCTIONS
// =========================================================================
export const apiGetRazorpayKey = async () => {
  return await request('/payments/key', {
    method: 'GET'
  });
};

export const apiCreatePaymentOrder = async (quizId) => {
  return await request('/payments/create-order', {
    method: 'POST',
    body: { quizId }
  });
};

export const apiVerifyPayment = async (paymentData) => {
  return await request('/payments/verify', {
    method: 'POST',
    body: paymentData
  });
};

export const apiEnrollInQuiz = async (quizId) => {
  return await request('/payments/enroll', {
    method: 'POST',
    body: { quizId }
  });
};

export const apiCheckQuizAccess = async (quizId) => {
  return await request(`/payments/access/${quizId}`, {
    method: 'GET'
  });
};

// Ad Campaign & Monetization System API Helpers
export const apiGetAdByPlacement = (placement) => request(`/ads/placement/${placement}`);
export const apiRecordAdImpression = (id) => request(`/ads/${id}/impression`, { method: 'POST' });
export const apiRecordAdClick = (id) => request(`/ads/${id}/click`, { method: 'POST' });
export const apiGetAdminAdCampaigns = () => request('/ads/admin/campaigns');
export const apiCreateAdCampaign = (data) => request('/ads/admin/campaigns', { method: 'POST', body: JSON.stringify(data) });
export const apiUpdateAdCampaign = (id, data) => request(`/ads/admin/campaigns/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const apiDeleteAdCampaign = (id) => request(`/ads/admin/campaigns/${id}`, { method: 'DELETE' });
export const apiGetGlobalAdsStatus = () => request('/ads/admin/global-status');
export const apiToggleGlobalAdsStatus = (adsEnabled) => request('/ads/admin/toggle-global', { method: 'POST', body: JSON.stringify({ adsEnabled }) });

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
  apiUploadImage,
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
  apiDeleteMessage,
  apiGetPublicReviews,
  apiSubmitReview,
  apiGetAdminReviews,
  apiCreateAdminReview,
  apiUpdateReview,
  apiDeleteReview,
  apiGetRazorpayKey,
  apiCreatePaymentOrder,
  apiVerifyPayment,
  apiEnrollInQuiz,
  apiCheckQuizAccess,
  apiGetAdByPlacement,
  apiRecordAdImpression,
  apiRecordAdClick,
  apiGetAdminAdCampaigns,
  apiCreateAdCampaign,
  apiUpdateAdCampaign,
  apiDeleteAdCampaign
};