/**
 * brainArena — Offline Sync & Action Queue Engine
 * Handles offline action queueing (quiz submissions, likes, bookmarks)
 * and automatic synchronization with the backend server upon reconnection.
 */

const QUEUE_KEY = 'brainarena_offline_action_queue';

/**
 * Get all pending actions from local storage
 */
export function getPendingOfflineActions() {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Enqueue a new action to be executed when back online
 * @param {Object} action - { type: 'SUBMIT_QUIZ' | 'TOGGLE_LIKE' | 'TOGGLE_SAVE', endpoint: string, payload: any, timestamp: number }
 */
export function enqueueOfflineAction(action) {
  try {
    const queue = getPendingOfflineActions();
    const item = {
      id: `action_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      timestamp: Date.now(),
      ...action
    };
    queue.push(item);
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    return item;
  } catch (err) {
    console.warn('Failed to enqueue offline action:', err);
    return null;
  }
}

/**
 * Clear specific action by ID or clear all
 */
export function removeOfflineAction(id) {
  try {
    const queue = getPendingOfflineActions();
    const updated = queue.filter((item) => item.id !== id);
    localStorage.setItem(QUEUE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn('Failed to remove offline action:', err);
  }
}

export function clearAllOfflineActions() {
  try {
    localStorage.removeItem(QUEUE_KEY);
  } catch {
    // ignore
  }
}

/**
 * Process all pending offline actions by sending them to the backend API
 * @param {Function} requestApi - API request function from api.js
 * @returns {Promise<{ syncedCount: number, failedCount: number }>}
 */
export async function syncPendingOfflineActions(requestApi) {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return { syncedCount: 0, failedCount: 0 };
  }

  const queue = getPendingOfflineActions();
  if (!queue || queue.length === 0) {
    return { syncedCount: 0, failedCount: 0 };
  }

  let syncedCount = 0;
  let failedCount = 0;

  for (const action of queue) {
    try {
      if (action.type === 'SUBMIT_QUIZ' && action.endpoint) {
        await requestApi(action.endpoint, {
          method: 'POST',
          body: action.payload
        });
        removeOfflineAction(action.id);
        syncedCount++;
      } else if (action.type === 'TOGGLE_LIKE' && action.endpoint) {
        await requestApi(action.endpoint, {
          method: 'POST'
        });
        removeOfflineAction(action.id);
        syncedCount++;
      } else if (action.type === 'TOGGLE_SAVE' && action.endpoint) {
        await requestApi(action.endpoint, {
          method: 'POST'
        });
        removeOfflineAction(action.id);
        syncedCount++;
      } else if (action.endpoint) {
        await requestApi(action.endpoint, {
          method: action.method || 'POST',
          body: action.payload
        });
        removeOfflineAction(action.id);
        syncedCount++;
      }
    } catch (err) {
      console.warn(`Failed to sync offline action ${action.id}:`, err);
      failedCount++;
    }
  }

  return { syncedCount, failedCount };
}

/**
 * Helper to cache arbitrary structured data for offline preloading
 */
export function setCachedData(key, data) {
  try {
    localStorage.setItem(`offline_cache_${key}`, JSON.stringify(data));
  } catch {
    // ignore storage limit
  }
}

export function getCachedData(key) {
  try {
    const raw = localStorage.getItem(`offline_cache_${key}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
