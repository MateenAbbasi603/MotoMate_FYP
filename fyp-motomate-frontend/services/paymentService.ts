// services/paymentService.ts
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5177';

const processCashPayment = async (invoiceId: number) => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Authentication token not found');

    const response = await axios.post(`${API_URL}/api/Payments/process-cash-payment`,
        { invoiceId },
        {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        }
    );

    return response.data;
};

const paymentService = {
    processCashPayment
};

export default paymentService;