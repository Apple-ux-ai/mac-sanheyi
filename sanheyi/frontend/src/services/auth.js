import axios from 'axios';

// Configuration
const SECRET_KEY = "7530bfb1ad6c41627b0f0620078fa5ed";

const REMOTE_API_BASE = "https://api-web.kunqiongai.com";

const getApiBaseUrl = () => {
  if (typeof window !== 'undefined') {
    if (window.__API_BASE__) {
      return window.__API_BASE__;
    }
    const origin = window.location.origin;
    if (/^https?:\/\/(localhost|127\.0\.0\.1)(:[0-9]+)?/i.test(origin)) {
      return '/api-web';
    }
  }
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  return REMOTE_API_BASE;
};

const API_BASE_URL = getApiBaseUrl();

/**
 * Generate Signed Nonce (HMAC-SHA256)
 */
export async function generateSignedNonce() {
  const nonce = crypto.randomUUID().replace(/-/g, "");
  const timestamp = Math.floor(Date.now() / 1000);
  const message = `${nonce}|${timestamp}`;

  const encoder = new TextEncoder();
  const keyData = encoder.encode(SECRET_KEY);
  const msgData = encoder.encode(message);

  const key = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signatureBuffer = await crypto.subtle.sign("HMAC", key, msgData);
  const signature = btoa(String.fromCharCode(...new Uint8Array(signatureBuffer)));

  return { nonce, timestamp, signature };
}

/**
 * Encode nonce for URL
 */
export function encodeSignedNonce(signedNonce) {
  const jsonStr = JSON.stringify(signedNonce);
  // URL safe base64
  let urlSafe = btoa(jsonStr);
  urlSafe = urlSafe.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  return urlSafe;
}

/**
 * API Wrapper Class
 */
export const AuthService = {
  /**
   * Fetch the base web login URL from server
   */
  async fetchBaseWebLoginUrl() {
    const url = `${API_BASE_URL}/soft_desktop/get_web_login_url`;
    try {
      const res = await axios.post(url, {}, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });
      if (res.data.code === 1 && res.data.data?.login_url) {
        return res.data.data.login_url;
      }
      throw new Error(res.data.msg || "Failed to fetch login URL");
    } catch (error) {
      console.error("Fetch base login URL error:", error);
      throw error;
    }
  },

  async getLoginUrl() {
    const [signed, baseUrl] = await Promise.all([
      generateSignedNonce(),
      this.fetchBaseWebLoginUrl()
    ]);

    const encoded = encodeSignedNonce(signed);
    const url = `${baseUrl}?client_type=desktop&client_nonce=${encoded}`;
    return { url, encodedNonce: encoded };
  },

  async pollTokenOnce(encodedNonce) {
    const pollUrl = `${API_BASE_URL}/user/desktop_get_token`;
    const params = new URLSearchParams();
    params.append('client_type', 'desktop');
    params.append('client_nonce', encodedNonce);

    try {
      const res = await axios.post(pollUrl, params, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        timeout: 5000
      });
      if (res.data.code === 1 && res.data.data?.token) {
        return res.data.data.token;
      }
      return null;
    } catch (error) {
      return null;
    }
  },

  async checkLogin(token) {
    const url = `${API_BASE_URL}/user/check_login`;
    const params = new URLSearchParams();
    params.append('token', token);

    try {
      const res = await axios.post(url, params, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });
      return res.data.code === 1;
    } catch (error) {
      return false;
    }
  },

  async getUserInfo(token) {
    const url = `${API_BASE_URL}/soft_desktop/get_user_info`;

    try {
      const res = await axios.post(url, {}, {
        headers: {
          'token': token,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      if (res.data.code === 1 && res.data.data?.user_info) {
        return res.data.data.user_info;
      }
      return null;
    } catch (error) {
      console.error("Get user info error", error);
      return null;
    }
  },

  async logout(token) {
    const url = `${API_BASE_URL}/logout`;

    try {
      const res = await axios.post(url, {}, {
        headers: {
          'token': token,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
      return res.data.code === 1;
    } catch (error) {
      return false;
    }
  },

  async fetchCustomUrl() {
    const url = `${API_BASE_URL}/soft_desktop/get_custom_url`;
    try {
      const res = await axios.post(url, {}, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });
      return (res.data.code === 1 && res.data.data?.url) ? res.data.data.url : null;
    } catch (e) {
      return null;
    }
  },

  async fetchFeedbackUrl(softNumber = '10011') {
    const url = `${API_BASE_URL}/soft_desktop/get_feedback_url`;
    try {
      const res = await axios.post(url, {}, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });
      if (res.data.code === 1 && res.data.data?.url) {
        return `${res.data.data.url}${softNumber}`;
      }
      return null;
    } catch (e) {
      console.error("Fetch feedback URL error:", e);
      return null;
    }
  }
};
