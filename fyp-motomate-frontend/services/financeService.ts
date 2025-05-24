export interface SavedReport {
  $id: string;
  id: number;
  type: string;
  period: string;
  range: string;
  generatedAt: string;
  status: string;
  totalAmount: number;
}

interface SavedReportsResponse {
  $id: string;
  reports: {
    $id: string;
    $values: SavedReport[];
  };
  totalCount: number;
  currentPage: number;
  totalPages: number;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5177';

const getAuthHeaders = () => {
  console.log('Getting auth headers');
  const token = localStorage.getItem('token');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};

const handleApiResponse = async (response: Response) => {
  console.log('Handling API response:', response.status);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Network error' }));
    console.error('API Error:', errorData);
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }
  const data = await response.json();
  console.log('API Response data:', data);
  return data;
};

export const getSavedReports = async (page: number = 1, pageSize: number = 10): Promise<SavedReportsResponse> => {
  console.log('Fetching saved reports:', { page, pageSize });
  const response = await fetch(`${API_BASE_URL}/api/Reports?page=${page}&pageSize=${pageSize}`, {
    headers: getAuthHeaders(),
  });
  const result = await handleApiResponse(response);
  console.log('Saved reports result:', result);
  return result;
}; 