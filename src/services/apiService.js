import axios from "axios";

const API_BASE_URL = '/api';

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});
export const fetchData = async (endpoint, options = {}) => {
    const { method = 'GET', params = {}, body = {} } = options;

    try {
        const response = await apiClient({
            url: endpoint,
            method,
            params,
            data: body,
        });
        return response.data;
    } catch (error) {
        console.error('API Error:', error);
        throw error.response?.data || { message: error.message };
    }
};


