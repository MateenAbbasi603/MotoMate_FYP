import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5177';

const mechanicService = {
  // Get all services assigned to the mechanic
  getMechanicServices: async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication token not found');
    }

    const response = await axios.get(
      `${API_URL}/api/MechanicServices`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    return response.data;
  },

  // Get details of a specific service
  getServiceDetails: async (id: string) => {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication token not found');
    }

    const response = await axios.get(
      `${API_URL}/api/MechanicServices/${id}`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    return response.data;
  },

  // Update service status
  updateServiceStatus: async (id: string, payload: any) => {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication token not found');
    }

    const response = await axios.put(
      `${API_URL}/api/MechanicServices/${id}/update-status`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    return response.data;
  }
};

export default mechanicService;