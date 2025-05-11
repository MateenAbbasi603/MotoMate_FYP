// services/invoiceService.ts
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5177';

const invoiceService = {
    generateFromOrder: async (orderId: string) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('Authentication token not found');
            }

            const response = await axios.post(
                `${API_URL}/api/Invoices/generate-from-order/${orderId}`,
                {},
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            return response.data;
        } catch (error: any) {
            // Check if it's a server error with response data
            if (error.response && error.response.data) {
                console.error('Server error:', error.response.data);
                throw error;
            }
            console.error('Error generating invoice:', error);
            throw error;
        }
    },

    getInvoiceById: async (invoiceId: string) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('Authentication token not found');
            }

            const response = await axios.get(
                `${API_URL}/api/Invoices/${invoiceId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );


            console.log(response.data);
            
            return response.data;
        } catch (error) {
            console.error('Error fetching invoice:', error);
            throw error;
        }
    }
};

export default invoiceService;