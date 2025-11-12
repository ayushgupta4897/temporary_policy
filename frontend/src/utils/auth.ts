// Authentication utility with persistent storage and 1-day expiry

const AUTH_KEY = 'strategyand_auth';
const AUTH_TIMESTAMP_KEY = 'strategyand_auth_timestamp';
const AUTH_EXPIRY_HOURS = 24; // 1 day

export interface AuthData {
  isAuthenticated: boolean;
  timestamp: number;
}

export const authUtils = {
  /**
   * Set authentication with timestamp
   */
  setAuth: (): void => {
    const timestamp = Date.now();
    localStorage.setItem(AUTH_KEY, 'true');
    localStorage.setItem(AUTH_TIMESTAMP_KEY, timestamp.toString());
    // Keep backward compatibility
    localStorage.setItem('isAuthenticated', 'true');
    localStorage.setItem('policy-drafter-auth', 'true');
  },

  /**
   * Check if user is authenticated and token hasn't expired
   */
  isAuthenticated: (): boolean => {
    const authValue = localStorage.getItem(AUTH_KEY);
    const timestamp = localStorage.getItem(AUTH_TIMESTAMP_KEY);

    if (!authValue || !timestamp) {
      // Check backward compatibility keys
      const legacyAuth = localStorage.getItem('isAuthenticated') ||
                        localStorage.getItem('policy-drafter-auth');
      if (legacyAuth) {
        // Migrate to new system
        authUtils.setAuth();
        return true;
      }
      return false;
    }

    // Check if auth has expired (24 hours)
    const authTimestamp = parseInt(timestamp, 10);
    const currentTime = Date.now();
    const expiryTime = AUTH_EXPIRY_HOURS * 60 * 60 * 1000; // 24 hours in milliseconds

    if (currentTime - authTimestamp > expiryTime) {
      // Auth expired, clear it
      authUtils.clearAuth();
      return false;
    }

    return true;
  },

  /**
   * Clear authentication
   */
  clearAuth: (): void => {
    localStorage.removeItem(AUTH_KEY);
    localStorage.removeItem(AUTH_TIMESTAMP_KEY);
    // Also clear legacy keys
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('policy-drafter-auth');
  },

  /**
   * Get time remaining until expiry (in milliseconds)
   */
  getTimeRemaining: (): number => {
    const timestamp = localStorage.getItem(AUTH_TIMESTAMP_KEY);
    if (!timestamp) return 0;

    const authTimestamp = parseInt(timestamp, 10);
    const currentTime = Date.now();
    const expiryTime = AUTH_EXPIRY_HOURS * 60 * 60 * 1000;
    const remaining = expiryTime - (currentTime - authTimestamp);

    return remaining > 0 ? remaining : 0;
  },

  /**
   * Get formatted time remaining
   */
  getFormattedTimeRemaining: (): string => {
    const remaining = authUtils.getTimeRemaining();
    if (remaining === 0) return 'Expired';

    const hours = Math.floor(remaining / (60 * 60 * 1000));
    const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  },

  /**
   * Refresh auth timestamp (extends session)
   */
  refreshAuth: (): void => {
    if (authUtils.isAuthenticated()) {
      const timestamp = Date.now();
      localStorage.setItem(AUTH_TIMESTAMP_KEY, timestamp.toString());
    }
  },
};
