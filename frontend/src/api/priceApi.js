import axios from 'axios';

const API_BASE_URL = '/api/price';

export const searchByComplexName = async (complexName, dealType) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/search/complex`, {
            params: { complexName, dealType }
        });
        return response.data;
    } catch (error) {
        console.error('Complex Search Error:', error);
        throw error;
    }
};

export const searchBySpecificAddress = async (address, dealType) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/search`, {
            params: { address, dealType }
        });
        return response.data;
    } catch (error) {
        console.error('Address Search Error:', error);
        throw error;
    }
};

export const searchMolitTrade = async (params) => {
    // params: { sigungu_code, building_type, deal_type, deal_year_month }
    try {
        const response = await axios.get(`${API_BASE_URL}/molit`, { params });
        return response.data;
    } catch (error) {
        console.error("Error searching Molit trade data:", error);
        throw error;
    }
};

export const searchSeoulTrade = async (params) => {
    // params: { gu_code, deal_year_month, ... }
    try {
        const response = await axios.get(`${API_BASE_URL}/seoul`, { params });
        return response.data;
    } catch (error) {
        console.error("Error searching Seoul trade data:", error);
        throw error;
    }
};

// ... existing methods
export const searchLandPrice = async (params) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/land`, { params });
        return response.data;
    } catch (error) {
        console.error("Error searching Land price:", error);
        throw error;
    }
};

export const comparePrices = async (requestBody) => {
    // requestBody: { targets: [ { address, area_m2, transaction_type, targetPrice }, ... ] }
    try {
        const response = await axios.post(`${API_BASE_URL}/compare`, requestBody);
        return response.data;
    } catch (error) {
        console.error("Error comparing prices:", error);
        throw error;
    }
};

// ... existing checkJeonseRisk
export const checkJeonseRisk = async (requestBody) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/risk-check`, requestBody);
        return response.data;
    } catch (error) {
        console.error("Error checking Jeonse risk:", error);
        throw error;
    }
};

export const suggestPrice = async (requestBody) => {
    // requestBody: { address, area_m2, market_data: { built_year, floor, current_price } }
    try {
        const response = await axios.post(`${API_BASE_URL}/suggest`, requestBody);
        return response.data;
    } catch (error) {
        console.error("Error suggesting price:", error);
        throw error;
    }
};

export const getRegionalTrend = async (addressCode) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/trend`, { params: { address_code: addressCode } });
        return response.data;
    } catch (error) {
        console.error("Error fetching trend:", error);
        throw error;
    }
};

export const downloadTradeDataUrl = (sidoCode, sigunguCode, format) => {
    // Returns the URL for direct download
    return `${API_BASE_URL}/download?sido_code=${sidoCode}&sigungu_code=${sigunguCode}&format=${format}`;
};
