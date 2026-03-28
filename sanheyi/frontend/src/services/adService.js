import axios from 'axios';

const REMOTE_API_BASE_URL = 'https://api-web.kunqiongai.com';
const DEV_PROXY_BASE_URL = '/api-web';
const API_BASE_URL = import.meta.env?.DEV ? DEV_PROXY_BASE_URL : REMOTE_API_BASE_URL;
const SOFT_NUMBER = '10011'; // Example soft_number, configurable

export const AdService = {
    /**
     * Fetch advertisements for a specific position
     * @param {string} position Advertisement position ID (e.g., 'adv_position_01')
     * @returns {Promise<Array>} List of ads
     */
    async fetchAd(position) {
        try {
            const isLocalDev = typeof window !== 'undefined'
                && window.location?.origin?.includes('localhost')
                && !window.electron;
            const shouldBypassRemoteRequest = isLocalDev && API_BASE_URL.startsWith('http');

            if (shouldBypassRemoteRequest) {
                console.warn(`AdService: skipping remote ad request for ${position} because no proxy is configured for localhost.`);
                return [];
            }
            const params = new URLSearchParams();
            params.append('soft_number', SOFT_NUMBER);
            params.append('adv_position', position);

            const response = await axios.post(
                `${API_BASE_URL}/soft_desktop/get_adv`,
                params,
                {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                }
            );

            if (response.data && response.data.code === 1 && Array.isArray(response.data.data)) {
                return response.data.data;
            }
            return [];
        } catch (error) {
            console.error(`Fetch ad failed for position ${position}:`, error);
            return [];
        }
    }
};
