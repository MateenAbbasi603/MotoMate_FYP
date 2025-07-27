'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  Wrench,
  Calendar,
  Clock,
  Car,
  User,
  ChevronLeft,
  FileText,
  ClipboardCheck,
  AlertTriangle,
  MapPin,
  Mail,
  Phone,
  UserCheck,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Activity,
  PencilRuler,
  MoreHorizontal,
  ThumbsUp,
  HeartPulse,
  BadgeCheck,
  ArrowRight,
  RefreshCw,
  Printer
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import axios from 'axios';
import { toast } from 'sonner';
import authService from '../../../../../../../services/authService';
import { formatLabel, cn } from '@/lib/utils';

const conditionOptions = [
  { value: 'Excellent', label: 'Excellent', color: 'text-green-600', bg: 'bg-green-100' },
  { value: 'Good', label: 'Good', color: 'text-blue-600', bg: 'bg-blue-100' },
  { value: 'Fair', label: 'Fair', color: 'text-yellow-600', bg: 'bg-yellow-100' },
  { value: 'Poor', label: 'Poor', color: 'text-orange-600', bg: 'bg-orange-100' },
  { value: 'Critical', label: 'Critical', color: 'text-red-600', bg: 'bg-red-100' },
  { value: 'Not Inspected', label: 'Not Inspected', color: 'text-gray-600', bg: 'bg-gray-100' },
];

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default function MechanicAppointmentDetail({
  params
}: PageProps) {
  const router = useRouter();
  const resolvedParams = use(params);
  const id = resolvedParams.id;

  const [appointment, setAppointment] = useState<any | null>(null);
  const [order, setOrder] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [inspectionReports, setInspectionReports] = useState<any[]>([]);

  const [reportFormData, setReportFormData] = useState<Record<string, { condition: string; notes: string }>>({});

  useEffect(() => {
    fetchData();
  }, [id]);

  useEffect(() => {
    if (order?.orderId) {
      fetchInspectionReports();
    }
  }, [order?.orderId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      setRefreshing(true);

      // Get the authentication token from localStorage
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication token not found. Please log in again.');
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5177';

      // Fetch appointment details
      const appointmentResponse = await axios.get(
        `${API_URL}/api/Appointments/${id}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      console.log("Appointment data:", appointmentResponse.data);

      // Handle the nested response structure
      const appointmentData = appointmentResponse.data && appointmentResponse.data.$id
        ? appointmentResponse.data.appointment || appointmentResponse.data
        : appointmentResponse.data;

      if (appointmentData) {
        setAppointment(appointmentData);
      }

      const user = await authService.getCurrentUser();

      // Fetch order details if orderId is available
      if (appointmentData && appointmentData.orderId) {
        const orderResponse = await axios.get(
          `${API_URL}/api/Orders/${appointmentData.orderId}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );

        console.log("Order data:", orderResponse.data);

        // Handle the nested response structure
        const orderData = orderResponse.data && orderResponse.data.$id
          ? orderResponse.data.order || orderResponse.data
          : orderResponse.data;

        if (orderData) {
          setOrder(orderData);

          // Initialize report form data if inspection exists
          if (orderData.inspection) {
            setReportFormData({
              [orderData.inspection.serviceId]: {
                condition: orderData.inspection.bodyCondition || '',
                notes: orderData.inspection.notes || ''
              }
            });
          }
        }
      }
    } catch (err: any) {
      console.error('Failed to fetch appointment details:', err);
      setError(err.response?.data?.message || 'Failed to load appointment details. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchInspectionReports = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5177';
      if (!order?.orderId) return;
      const response = await axios.get(
        `${API_URL}/api/Inspections/report/order/${order.orderId}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      // Fix: handle $values property from .NET serialization
      let reports = response.data;
      if (reports && reports.$values) reports = reports.$values;
      setInspectionReports(Array.isArray(reports) ? reports : []);
    } catch (err) {
      setInspectionReports([]);
    }
  };

  // Format date
  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'MMMM dd, yyyy');
    } catch (e) {
      console.error('Error formatting date:', e);
      return 'Invalid date';
    }
  };

  // Get status badge style and icon
  const getStatusBadge = (status: string) => {
    status = status.toLowerCase();

    switch (status) {
      case 'completed':
        return (
          <Badge variant="outline" className="flex items-center gap-1.5 bg-green-50 text-green-700 border-green-200 hover:bg-green-100 py-1.5">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Completed
          </Badge>
        );
      case 'scheduled':
        return (
          <Badge variant="outline" className="flex items-center gap-1.5 bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 py-1.5">
            <Calendar className="h-3.5 w-3.5" />
            Scheduled
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge variant="outline" className="flex items-center gap-1.5 bg-red-50 text-red-700 border-red-200 hover:bg-red-100 py-1.5">
            <AlertCircle className="h-3.5 w-3.5" />
            Cancelled
          </Badge>
        );
      case 'in progress':
      case 'inprogress':
        return (
          <Badge variant="outline" className="flex items-center gap-1.5 bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 py-1.5">
            <Activity className="h-3.5 w-3.5" />
            In Progress
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="flex items-center gap-1.5 bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100 py-1.5">
            <Clock className="h-3.5 w-3.5" />
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
        );
    }
  };

  // Get condition badge style
  const getConditionBadge = (condition: string) => {
    if (!condition) return null;

    const conditionOption = conditionOptions.find(
      option => option.value.toLowerCase() === condition.toLowerCase()
    );

    if (!conditionOption) return condition;

    return (
      <Badge variant="outline" className={`${conditionOption.bg} ${conditionOption.color} border-0`}>
        {conditionOption.label}
      </Badge>
    );
  };

  // Get customer initials for avatar
  const getInitials = (name: string) => {
    if (!name) return "NA";

    const parts = name.split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
  };

  // Calculate inspection report progress
  const calculateReportProgress = () => {
    if (!order?.inspection) return 0;

    const fields = [
      order.inspection.bodyCondition,
      order.inspection.engineCondition,
      order.inspection.electricalCondition,
      order.inspection.tireCondition,
      order.inspection.brakeCondition,
      order.inspection.transmissionCondition
    ];

    const completedFields = fields.filter(field =>
      field && field !== 'Not Inspected' && field !== 'Not Inspected Yet'
    ).length;

    return Math.round((completedFields / fields.length) * 100);
  };

  // Handle input change for report form
  const handleInputChange = (serviceId: string, field: 'condition' | 'notes', value: string) => {
    setReportFormData(prev => ({
      ...prev,
      [serviceId]: {
        ...prev[serviceId],
        [field]: value
      }
    }));
  };

  // Handle submit inspection report
  const handleSubmitReport = async () => {
    try {
      setIsSubmittingReport(true);
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Authentication token not found. Please log in again.');
        return;
      }
      const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5177';
      // For each selected inspection, submit the report and update the inspection table
      for (const inspection of getSelectedInspections()) {
        const form = reportFormData[String(inspection.serviceId)];
        if (!form) continue;
        
        console.log('Processing inspection:', inspection);
        console.log('Inspection ID:', inspection.inspectionId);
        console.log('Service ID:', inspection.serviceId);
        // 1. Save to InspectionReport table (if needed)
        await axios.post(
          `${API_URL}/api/Inspections/report`,
          {
            orderId: order.orderId,
            serviceId: inspection.serviceId,
            mechanicId: appointment?.mechanicId,
            ReportData: JSON.stringify({ result: form.condition, notes: form.notes })
          },
          { headers: { 'Authorization': `Bearer ${token}` } }
        );
        // 2. Update Inspections table (complete the inspection)
        // Build payload with all required fields
        const payload: any = {
          Status: 'completed',
          BodyCondition: 'Not Inspected',
          BrakeCondition: 'Not Inspected',
          EngineCondition: 'Not Inspected',
          ElectricalCondition: 'Not Inspected',
          TransmissionCondition: 'Not Inspected',
          TireCondition: 'Not Inspected',
          Notes: form.notes || ''
        };
        // Map subcategory to field
        const fieldMap: { [key: string]: string } = {
          'TireInspection': 'TireCondition',
          'Disc Inspection': 'BrakeCondition',
          'SuspensionInspection': 'SuspensionCondition',
          'EngineInspection': 'EngineCondition',
          'ElectricalInspection': 'ElectricalCondition',
          'BodyInspection': 'BodyCondition',
        };
        const field = fieldMap[inspection.subCategory || inspection.serviceName] || null;
        if (field) {
          payload[field] = form.condition;
        }
        // Only update inspection if we have a valid inspectionId
        if (inspection.inspectionId) {
          try {
            await axios.put(
              `${API_URL}/api/Inspections/${inspection.inspectionId}`,
              payload,
              { headers: { 'Authorization': `Bearer ${token}` } }
            );
          } catch (error: any) {
            console.error(`Failed to update inspection ${inspection.inspectionId}:`, error);
            // Continue with other inspections even if one fails
          }
        } else {
          console.warn(`No inspectionId found for service ${inspection.serviceId}`);
        }
      }
      // Mark appointment as completed
      await axios.put(
        `${API_URL}/api/Appointments/${id}`,
        {
          status: 'completed',
          notes: 'Inspection completed successfully',
          timeSlot: appointment?.timeSlot || ''
        },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      toast.success('Inspection reports submitted and inspection completed!');
      setIsReportDialogOpen(false);
      fetchData();
      fetchInspectionReports();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit inspection reports.');
    } finally {
      setIsSubmittingReport(false);
    }
  };

  // Replace the print logic in handlePrintInspectionReport with a table-based layout similar to the customer print page
  const handlePrintInspectionReport = () => {
    // Only use reports for this order
    const reports = inspectionReports.filter((r: any) => r.orderId === order?.orderId);
    if (!reports || reports.length === 0) {
      toast.error('No inspection data to print.');
      return;
    }
    const logoUrl = typeof window !== 'undefined' ? window.location.origin + '/motomate-logo.png' : '/motomate-logo.png';
    let inspectionRows = '';
    getSelectedInspections().forEach((inspection: any) => {
      const report = reports.find((r: any) => r.serviceId === inspection.serviceId);
      let reportData: any = {};
      try {
        reportData = report?.reportData ? JSON.parse(report.reportData) : {};
      } catch {}
      let resultClass = '', icon = '';
      switch ((reportData.result || '').toLowerCase()) {
        case 'excellent':
          resultClass = 'color:#166534;background:#dcfce7;border-radius:6px;padding:2px 10px;font-weight:600;';
          icon = '✔️';
          break;
        case 'good':
          resultClass = 'color:#15803d;background:#bbf7d0;border-radius:6px;padding:2px 10px;font-weight:600;';
          icon = '👍';
          break;
        case 'fair':
          resultClass = 'color:#92400e;background:#fef08a;border-radius:6px;padding:2px 10px;font-weight:600;';
          icon = '🟡';
          break;
        case 'poor':
          resultClass = 'color:#b91c1c;background:#fee2e2;border-radius:6px;padding:2px 10px;font-weight:600;';
          icon = '⚠️';
          break;
        case 'critical':
          resultClass = 'color:#fff;background:#b91c1c;border-radius:6px;padding:2px 10px;font-weight:600;';
          icon = '❌';
          break;
        default:
          resultClass = 'color:#374151;background:#f3f4f6;border-radius:6px;padding:2px 10px;font-weight:600;';
          icon = '';
      }
      inspectionRows += `
        <tr>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${inspection.serviceName}${inspection.subCategory ? ` <span style='font-size:12px;color:#2563eb;'>(${inspection.subCategory})</span>` : ''}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;"><span style='${resultClass}'>${icon} ${reportData.result || 'Not Inspected Yet'}</span></td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;color:#6b7280;">${reportData.notes || 'No notes provided'}</td>
        </tr>
      `;
    });
    const mechanicName = appointment?.mechanic?.name || appointment?.mechanicName || '-';
    const mechanicPhone = appointment?.mechanic?.phone || '-';
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>MOTOMATE INSPECTION REPORT</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            @page { margin: 1cm; size: A4; }
            body { font-family: 'Segoe UI', Arial, sans-serif; color: #222; background: #fff; margin: 0; padding: 0; }
            .header-row { display: flex; align-items: center; gap: 18px; margin-bottom: 18px; }
            .logo { height: 48px; width: 48px; object-fit: contain; }
            .report-title { font-size: 2rem; font-weight: bold; color: #1e293b; letter-spacing: 1px; }
            .info-grid { display: flex; justify-content: space-between; margin-bottom: 18px; }
            .info-section { width: 48%; background: #f9fafb; border-radius: 8px; padding: 16px 18px; border: 1px solid #e5e7eb; }
            .info-title { font-size: 15px; font-weight: 600; color: #2563eb; margin-bottom: 10px; }
            .info-row { display: flex; justify-content: space-between; margin-bottom: 7px; font-size: 14px; }
            .info-label { color: #6b7280; font-weight: 500; }
            .info-value { color: #1e293b; font-weight: 600; text-align: right; max-width: 200px; }
            .section-title { font-size: 1.1rem; font-weight: 600; color: #1e293b; margin: 24px 0 10px 0; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 18px; }
            th { background: #f3f4f6; padding: 10px; text-align: left; font-weight: 600; color: #374151; font-size: 14px; border-bottom: 2px solid #e5e7eb; }
            td { font-size: 14px; }
            .footer { margin-top: 30px; text-align: right; color: #64748b; font-size: 13px; }
          </style>
        </head>
        <body>
          <div class="header-row">
            <img src="${logoUrl}" class="logo" alt="MotoMate Logo" />
            <span class="report-title">MOTOMATE INSPECTION REPORT</span>
          </div>
          <div class="info-grid">
            <div class="info-section">
              <div class="info-title">Vehicle Information</div>
              <div class="info-row"><span class="info-label">Make & Model</span><span class="info-value">${order?.vehicle?.make || ''} ${order?.vehicle?.model || ''}</span></div>
              <div class="info-row"><span class="info-label">Year</span><span class="info-value">${order?.vehicle?.year || ''}</span></div>
              <div class="info-row"><span class="info-label">License Plate</span><span class="info-value">${order?.vehicle?.licensePlate || ''}</span></div>
            </div>
            <div class="info-section">
              <div class="info-title">Customer Information</div>
              <div class="info-row"><span class="info-label">Name</span><span class="info-value">${order?.user?.name || ''}</span></div>
              <div class="info-row"><span class="info-label">Email</span><span class="info-value">${order?.user?.email || ''}</span></div>
              <div class="info-row"><span class="info-label">Phone</span><span class="info-value">${order?.user?.phone || ''}</span></div>
            </div>
          </div>
          <div class="section-title">Inspection Results</div>
          <table>
            <thead>
              <tr>
                <th>Inspection</th>
                <th>Result</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              ${inspectionRows}
            </tbody>
          </table>
          <div class="section-title">Mechanic Information</div>
          <div class="info-section" style="width: 350px;">
            <div class="info-row"><span class="info-label">Name</span><span class="info-value">${mechanicName}</span></div>
            <div class="info-row"><span class="info-label">Contact</span><span class="info-value">${mechanicPhone}</span></div>
          </div>
          <div class="footer">Generated by MotoMate | ${new Date().toLocaleString()}</div>
        </body>
      </html>
    `;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    }
  };


  // Safe getter for additional services array
  const getAdditionalServices = () => {
    if (order?.additionalServices?.$values) {
      return order.additionalServices.$values;
    } else if (Array.isArray(order?.additionalServices)) {
      return order.additionalServices;
    }
    return [];
  };

  // Get selected inspections for display before report generation
  const getSelectedInspections = () => {
    const additionalServices = getAdditionalServices();
    const inspectionServices = additionalServices.filter(
      (service: any) => service.category?.toLowerCase() === "inspection"
    );

    // Combine main inspection and additional inspection services
    const allInspections = [
      {
        serviceId: order?.inspection?.serviceId,
        serviceName: order?.inspection?.serviceName,
        subCategory: order?.inspection?.subCategory,
        notes: order?.inspection?.notes,
        status: order?.inspection?.status,
        inspectionId: order?.inspection?.inspectionId,
        reportData: order?.inspection?.reportData
      },
      ...inspectionServices
    ];

    // Filter out services that have already been reported on
    return allInspections.filter(
      (service: any) => !service.inspectionId || !inspectionReports.some(report => report.inspectionId === service.inspectionId)
    );
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      {/* Header Section with title and back button */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push('/mechanic/dashboard')}
            className="rounded-full shadow-sm hover:shadow"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Appointment Details</h1>
            <p className="text-muted-foreground">View and manage appointment information</p>
          </div>
        </div>

        <Button onClick={fetchData} disabled={refreshing} variant="outline" className="gap-2">
          {refreshing ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Refresh
        </Button>
      </div>

      {/* Error display */}
      {error && (
        <Alert variant="destructive" className="mb-6 shadow-sm">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Loading skeleton */}
      {loading ? (
        <div className="space-y-6">
          <div className="flex items-center space-x-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-[250px]" />
              <Skeleton className="h-4 w-[200px]" />
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card className="border shadow-sm">
                <CardHeader className="pb-2">
                  <Skeleton className="h-8 w-[200px]" />
                  <Skeleton className="h-4 w-[150px]" />
                </CardHeader>
                <CardContent className="space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-32 w-full" />
                  </div>
                  <Skeleton className="h-40 w-full" />
                </CardContent>
              </Card>
            </div>
            <div>
              <Card className="border shadow-sm">
                <CardHeader className="pb-2">
                  <Skeleton className="h-6 w-[160px]" />
                </CardHeader>
                <CardContent className="space-y-4">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      ) : appointment && order ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main appointment info */}
          <div className="lg:col-span-2">
            <Card className="border shadow-sm overflow-hidden">
              <CardHeader className="pb-4 bg-gradient-to-r from-slate-50 to-transparent dark:from-slate-900/20">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 rounded-full p-2 border border-primary/20">
                      <Wrench className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl">
                        Appointment #{appointment.appointmentId}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-1">
                        <span>Order #{order.orderId}</span>
                        <span>•</span>
                        <span className="font-medium">{formatDate(appointment.appointmentDate)}</span>
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 py-1.5">
                      {appointment.timeSlot}
                    </Badge>
                    {getStatusBadge(appointment.status)}
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <Tabs defaultValue="order" className="w-full">
                  <TabsList className="mb-6 grid grid-cols-3 h-auto p-1">
                    <TabsTrigger value="order" className="py-2.5 data-[state=active]:bg-background">
                      <FileText className="h-4 w-4 mr-2" />
                      Order Details
                    </TabsTrigger>
                    {order.includesInspection && order.inspection && (
                      <TabsTrigger value="inspection" className="py-2.5 data-[state=active]:bg-background">
                        <ClipboardCheck className="h-4 w-4 mr-2" />
                        Inspection
                      </TabsTrigger>
                    )}
                    <TabsTrigger value="notes" className="py-2.5 data-[state=active]:bg-background">
                      <FileText className="h-4 w-4 mr-2" />
                      Notes
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="order" className="space-y-6 mt-0">
                    {/* Vehicle info */}
                    <div className="bg-muted/20 rounded-xl border p-4 shadow-sm">
                      <h3 className="text-lg font-medium flex items-center mb-3">
                        <Car className="mr-2 h-5 w-5 text-primary" />
                        Vehicle Information
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="bg-background p-4 rounded-lg border shadow-sm">
                          <p className="text-sm text-muted-foreground">Make & Model</p>
                          <p className="font-medium mt-1">
                            {order.vehicle ? `${order.vehicle.make} ${order.vehicle.model}` : 'Unknown'}
                          </p>
                        </div>
                        <div className="bg-background p-4 rounded-lg border shadow-sm">
                          <p className="text-sm text-muted-foreground">Year</p>
                          <p className="font-medium mt-1">{order.vehicle?.year || 'N/A'}</p>
                        </div>
                        <div className="bg-background p-4 rounded-lg border shadow-sm">
                          <p className="text-sm text-muted-foreground">License Plate</p>
                          <p className="font-medium mt-1">
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 font-mono">
                              {order.vehicle?.licensePlate || 'N/A'}
                            </Badge>
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Service info */}
                    <div className="bg-muted/20 rounded-xl border p-4 shadow-sm">
                      <h3 className="text-lg font-medium flex items-center mb-3">
                        <Wrench className="mr-2 h-5 w-5 text-primary" />
                        Inspection Information
                      </h3>

                      {order.inspection && order.inspection.serviceName && (
                        <div className="bg-background p-4 rounded-lg border mb-4 shadow-sm">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-medium text-primary flex items-center">
                                <ShieldCheck className="h-4 w-4 mr-2 text-blue-600" />
                                {formatLabel(order.inspection.serviceName)}
                                {order.inspection.subCategory && ` (${order.inspection.subCategory})`}
                              </h4>
                              <p className="text-sm text-muted-foreground mt-1">
                                {order.inspection.notes || 'No description available'}
                              </p>
                            </div>
                          </div>
                          <div className="mt-3 pt-3 border-t flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Category</span>
                            <Badge variant="outline" className="font-normal">
                              Inspection
                            </Badge>
                          </div>
                        </div>
                      )}

                      {/* Additional Services */}
                      {(() => {
                        const additionalServices = getAdditionalServices();
                        if (!additionalServices.length) return null;

                        // Filter inspection services
                        const inspectionServices = additionalServices.filter(
                          (service: any) => service.category?.toLowerCase() === "inspection"
                        );

                        if (inspectionServices.length === 0) {
                          return null;
                        }

                        return (
                          <>
                            <h4 className="text-base font-medium mb-2 flex items-center">
                              <ShieldCheck className="h-4 w-4 mr-2 text-blue-600" />
                              Additional Inspection Services
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {inspectionServices.map((service: any, index: number) => (
                                <div key={service.serviceId || index} className="bg-background p-4 rounded-lg border shadow-sm">
                                  <div className="flex justify-between items-start">
                                    <h5 className="font-medium text-blue-700">
                                      {service.serviceName}
                                      {service.subCategory && ` (${service.subCategory})`}
                                    </h5>
                                  </div>
                                  <p className="text-sm text-muted-foreground mt-1 mb-2">
                                    {service.description || 'No description available'}
                                  </p>
                                  <div className="pt-2 border-t flex justify-between items-center">
                                    <span className="text-xs text-muted-foreground">Inspection Type</span>
                                    <Badge variant="outline" className="text-xs bg-blue-50/50 text-blue-700">
                                      {service.subCategory || 'General'}
                                    </Badge>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </TabsContent>

                  {order.includesInspection && order.inspection && (
                    <TabsContent value="inspection" className="space-y-5 mt-0">
                      <div className="bg-gradient-to-r from-blue-50 to-blue-50/30 dark:from-blue-900/20 dark:to-blue-900/5 rounded-xl border border-blue-200 p-5 shadow-sm">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                          <div className="flex items-center">
                            <Calendar className="h-5 w-5 text-blue-600 mr-2" />
                            <div>
                              <p className="text-sm text-blue-600 font-medium">Scheduled Date</p>
                              <p className="font-semibold text-blue-800">
                                {formatDate(order.inspection.scheduledDate)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <Clock className="h-5 w-5 text-blue-600 mr-2" />
                            <div>
                              <p className="text-sm text-blue-600 font-medium">Time Slot</p>
                              <p className="font-semibold text-blue-800">
                                {order.inspection.timeSlot || 'Not specified'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <div>
                              <p className="text-sm text-blue-600 font-medium mb-1">Status</p>
                              {getStatusBadge(order.inspection.status)}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Service details for inspection */}
                      {appointment.service && appointment.service.category === "Inspection" && (
                        <div className="bg-gradient-to-r from-indigo-50 to-indigo-50/30 dark:from-indigo-900/20 dark:to-indigo-900/5 rounded-xl border border-indigo-200 p-5 shadow-sm">
                          <div className="flex items-center mb-4">
                            <ShieldCheck className="h-5 w-5 text-indigo-600 mr-2" />
                            <h3 className="font-medium text-lg text-indigo-800">
                              Inspection Service Details
                            </h3>
                          </div>

                          <div className="bg-white/80 dark:bg-background/80 rounded-lg border border-indigo-100 p-4">
                            <div className="flex justify-between items-center">
                              <h4 className="font-medium text-indigo-700">
                                {appointment.service.serviceName}
                              </h4>
                            </div>

                            {appointment.service.subCategory && (
                              <div className="flex justify-between items-center mt-3">
                                <span className="text-sm text-indigo-600">Focus Area</span>
                                <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
                                  {appointment.service.subCategory}
                                </Badge>
                              </div>
                            )}

                            {appointment.service.description && (
                              <div className="mt-3 pt-3 border-t border-indigo-100">
                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                  {appointment.service.description}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="bg-white dark:bg-background rounded-xl border p-5 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-medium flex items-center">
                            <ClipboardCheck className="mr-2 h-5 w-5 text-primary" />
                            Inspection Results
                          </h3>

                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">Completion:</span>
                            <div className="w-36 flex items-center gap-2">
                              <Progress value={calculateReportProgress()} className="h-2" />
                              <span className="text-xs font-medium">{calculateReportProgress()}%</span>
                            </div>
                          </div>
                        </div>

                        {/* Inspection Results Section */}
                        <div className="space-y-4">
                          {getSelectedInspections().length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                              {getSelectedInspections().map((inspection: any, idx: number) => {
                                // Find the most recent matching report for this inspection, order, and mechanic
                                const mechanicId = appointment?.mechanicId;
                                // Debug logging
                                console.log('inspectionReports:', inspectionReports, 'orderId:', order.orderId, 'mechanicId:', mechanicId);
                                const reportsForService = inspectionReports
                                  .filter((r: any) =>
                                    r.serviceId === inspection.serviceId &&
                                    r.orderId === order.orderId &&
                                    (mechanicId ? r.mechanicId === mechanicId : true)
                                  )
                                  .sort((a: any, b: any) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime());
                                const report = reportsForService[0];
                                let reportData: any = {};
                                try {
                                  reportData = report?.reportData ? JSON.parse(report.reportData) : {};
                                } catch {}
                                // Determine result style and icon for on-page display
                                let resultClass = '', icon = '';
                                switch ((reportData.result || '').toLowerCase()) {
                                  case 'excellent':
                                    resultClass = 'bg-green-100 text-green-800 border-green-200';
                                    icon = '<svg style="width:1em;height:1em;vertical-align:-0.15em;margin-right:4px;display:inline" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>';
                                    break;
                                  case 'good':
                                    resultClass = 'bg-green-50 text-green-600 border-green-100';
                                    icon = '<svg style="width:1em;height:1em;vertical-align:-0.15em;margin-right:4px;display:inline" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M14 9l-3 3-2-2"/><path stroke-linecap="round" stroke-linejoin="round" d="M12 19V6"/></svg>';
                                    break;
                                  case 'fair':
                                    resultClass = 'bg-yellow-100 text-yellow-800 border-yellow-200';
                                    icon = '<svg style="width:1em;height:1em;vertical-align:-0.15em;margin-right:4px;display:inline" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3"/><circle cx="12" cy="12" r="10"/></svg>';
                                    break;
                                  case 'poor':
                                    resultClass = 'bg-red-100 text-red-700 border-red-200';
                                    icon = '<svg style="width:1em;height:1em;vertical-align:-0.15em;margin-right:4px;display:inline" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3"/><circle cx="12" cy="12" r="10"/></svg>';
                                    break;
                                  case 'critical':
                                    resultClass = 'bg-red-700 text-white border-red-700';
                                    icon = '<svg style="width:1em;height:1em;vertical-align:-0.15em;margin-right:4px;display:inline" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>';
                                    break;
                                  default:
                                    resultClass = 'bg-gray-100 text-gray-700 border-gray-200';
                                    icon = '';
                                }
                                return (
                                  <div key={inspection.serviceId || inspection.inspectionId || idx} className="p-4 border rounded-lg shadow-sm hover:border-primary/50 transition-colors bg-muted/20">
                                    <div className="flex items-center mb-2">
                                      <ShieldCheck className="h-4 w-4 mr-2 text-blue-600" />
                                      <h4 className="font-medium">{inspection.serviceName}</h4>
                                    </div>
                                    {inspection.subCategory && (
                                      <div className="mt-1">
                                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                          {inspection.subCategory}
                                        </Badge>
                                      </div>
                                    )}
                                    <div className="mt-1">
                                      <span className={`inline-flex items-center border px-2 py-1 rounded-md font-semibold text-sm ${resultClass}`} dangerouslySetInnerHTML={{__html: icon + (reportData.result || 'Not Inspected Yet')}} />
                                    </div>
                                    <div className="mt-1">
                                      <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                                        Notes: {reportData.notes || 'No notes provided'}
                                      </Badge>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="p-4 border rounded-lg shadow-sm bg-muted/20 text-muted-foreground">
                              No inspections selected by customer.
                            </div>
                          )}
                          {/* Print Inspection Report Button (after report generation) */}
                          {order.inspection.status === 'completed' && (
                            <div className="flex justify-end mt-4">
                              <Button variant="outline" className="gap-2" onClick={handlePrintInspectionReport}>
                                <Printer className="h-4 w-4" />
                                Print Inspection Report
                              </Button>
                            </div>
                          )}
                        </div>

                        {order.inspection.notes && (
                          <div className="mt-6">
                            <div className="flex items-start">
                              <FileText className="h-4 w-4 mr-2 mt-0.5 text-slate-500" />
                              <div>
                                <h4 className="font-medium mb-2">Inspection Notes</h4>
                                <div className="bg-muted/20 p-4 rounded-lg border">
                                  <p className="text-sm text-muted-foreground">
                                    {order.inspection.notes}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {(order.inspection.status !== 'completed' && appointment.status !== 'completed') && (
                          <div className="mt-6 flex justify-center">
                            <Button
                              size="lg"
                              className="gap-2 shadow-sm"
                              onClick={() => setIsReportDialogOpen(true)}
                            >
                              <FileText className="h-4 w-4" />
                              Generate Inspection Report
                            </Button>
                          </div>
                        )}
                      </div>
                    </TabsContent>
                  )}

                  <TabsContent value="notes" className="space-y-5 mt-0">
                    <div className="bg-muted/20 rounded-xl border p-5 shadow-sm">
                      <h3 className="font-medium mb-4 flex items-center text-lg">
                        <FileText className="mr-2 h-5 w-5 text-primary" />
                        Order Notes
                      </h3>
                      <div className="bg-background p-4 rounded-lg border shadow-sm">
                        <p className="text-sm text-muted-foreground">
                          {order.notes || 'No notes available for this order.'}
                        </p>
                      </div>
                    </div>

                    <div className="bg-muted/20 rounded-xl border p-5 shadow-sm">
                      <h3 className="font-medium mb-4 flex items-center text-lg">
                        <FileText className="mr-2 h-5 w-5 text-primary" />
                        Appointment Notes
                      </h3>
                      <div className="bg-background p-4 rounded-lg border shadow-sm">
                        <p className="text-sm text-muted-foreground">
                          {appointment.notes || 'No notes available for this appointment.'}
                        </p>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>

              <CardFooter className="flex justify-between border-t pt-6">
                <Button
                  variant="outline"
                  className="gap-2 shadow-sm"
                  onClick={() => router.push('/mechanic/dashboard')}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Back to Dashboard
                </Button>

                {order.inspection && order.inspection.status !== 'completed' && appointment.status !== 'completed' && (
                  <Button
                    className="gap-2 shadow-sm"
                    onClick={() => setIsReportDialogOpen(true)}
                  >
                    <FileText className="h-4 w-4" />
                    Generate Inspection Report
                  </Button>
                )}
              </CardFooter>
            </Card>
          </div>

          {/* Customer info sidebar */}
          <div>
            <Card className="border shadow-sm overflow-hidden sticky top-6">
              <CardHeader className="bg-gradient-to-r from-slate-50 to-transparent dark:from-slate-900/20 pb-3">
                <CardTitle className="flex items-center text-lg">
                  <User className="mr-2 h-5 w-5 text-primary" />
                  Customer Information
                </CardTitle>
              </CardHeader>

              <CardContent className="pt-5">
                <div className="flex items-start gap-3 mb-5">
                  <Avatar className="h-10 w-10 border border-primary/20">
                    <AvatarFallback className="bg-primary/10 text-primary font-medium">
                      {getInitials(order.user?.name || '')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{order.user?.name || 'Unknown'}</p>
                    <p className="text-xs text-muted-foreground">
                      Customer ID: {order.user?.userId || 'N/A'}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-muted/20 p-3 rounded-lg border flex items-start gap-3">
                    <Mail className="h-4 w-4 text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">Email</p>
                      <p className="text-sm font-medium">{order.user?.email || 'No email provided'}</p>
                    </div>
                  </div>

                  <div className="bg-muted/20 p-3 rounded-lg border flex items-start gap-3">
                    <Phone className="h-4 w-4 text-green-600 mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">Phone</p>
                      <p className="text-sm font-medium">{order.user?.phone || 'No phone provided'}</p>
                    </div>
                  </div>

                  {order.user?.address && (
                    <div className="bg-muted/20 p-3 rounded-lg border flex items-start gap-3">
                      <MapPin className="h-4 w-4 text-red-600 mt-0.5" />
                      <div>
                        <p className="text-xs text-muted-foreground">Address</p>
                        <p className="text-sm">{order.user.address}</p>
                      </div>
                    </div>
                  )}
                </div>

                <Separator className="my-5" />

                {/* Order timeline */}
                <div>
                  <h3 className="text-sm font-medium mb-3 flex items-center">
                    <Clock className="h-4 w-4 mr-2 text-primary" />
                    Order Timeline
                  </h3>
                  <div className="space-y-1">
                    <div className="relative border-l-2 pl-4 pb-5 pt-1 border-muted">
                      <div className="absolute w-3 h-3 bg-primary rounded-full -left-[7px] top-0"></div>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="cursor-help">
                              <p className="text-sm font-medium">Order Created</p>
                              <p className="text-xs text-muted-foreground">
                                {formatDate(order.orderDate)}
                              </p>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Order was created in the system</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>

                    {order.includesInspection && order.inspection && (
                      <div className="relative border-l-2 pl-4 pb-5 pt-1 border-muted">
                        <div className="absolute w-3 h-3 bg-blue-500 rounded-full -left-[7px] top-0"></div>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="cursor-help">
                                <p className="text-sm font-medium">Inspection Scheduled</p>
                                <p className="text-xs text-muted-foreground">
                                  {formatDate(order.inspection.scheduledDate)}, {order.inspection.timeSlot}
                                </p>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Vehicle inspection was scheduled</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    )}

                    <div className="relative border-l-2 pl-4 pb-5 pt-1 border-muted">
                      <div className="absolute w-3 h-3 bg-amber-500 rounded-full -left-[7px] top-0"></div>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="cursor-help">
                              <p className="text-sm font-medium">Mechanic Assigned</p>
                              <p className="text-xs text-muted-foreground">
                                {formatDate(appointment.appointmentDate)}
                              </p>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Mechanic was assigned to this service</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>

                    {appointment.status === 'completed' && (
                      <div className="relative border-l-2 pl-4 pb-5 pt-1 border-muted">
                        <div className="absolute w-3 h-3 bg-green-500 rounded-full -left-[7px] top-0"></div>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="cursor-help">
                                <p className="text-sm font-medium">Service Completed</p>
                                <p className="text-xs text-muted-foreground">
                                  {formatDate(new Date().toISOString())}
                                </p>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Service was successfully completed</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    )}
                  </div>
                </div>

                {order.inspection && order.inspection.status !== 'completed' && appointment.status !== 'completed' && (
                  <>
                    <Separator className="my-5" />
                    <Button
                      className="w-full gap-2 mt-2 shadow-sm"
                      onClick={() => setIsReportDialogOpen(true)}
                    >
                      <FileText className="h-4 w-4" />
                      Generate Report
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <Card className="border shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-xl font-medium mb-2">Appointment not found</h3>
            <p className="text-muted-foreground text-center max-w-md mb-6">
              The appointment you're looking for doesn't exist or you don't have permission to view it.
            </p>
            <Button
              onClick={() => router.push('/mechanic/dashboard')}
              className="gap-2 shadow-sm"
            >
              <ChevronLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Inspection Report Dialog */}
      <Dialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
        <DialogContent className="max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5 text-primary" />
              Generate Inspection Report
            </DialogTitle>
            <DialogDescription>
              Complete the inspection details for the vehicle to finalize the service.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-5 py-4">
            {getSelectedInspections().length === 0 ? (
              <div className="text-muted-foreground">No inspections to report.</div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {getSelectedInspections().map((inspection: any) => (
                  <div key={inspection.serviceId || inspection.inspectionId} className="space-y-2 border-b pb-4 last:border-b-0 last:pb-0">
                    <Label className="text-base font-semibold">
                      {inspection.serviceName}
                      {inspection.subCategory ? ` (${inspection.subCategory})` : ''}
                    </Label>
                    <Select
                      value={reportFormData[String(inspection.serviceId)]?.condition || ''}
                      onValueChange={(value) => handleInputChange(String(inspection.serviceId), 'condition', value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select condition" />
                      </SelectTrigger>
                      <SelectContent>
                        {conditionOptions.map(option => (
                          <SelectItem key={option.value} value={option.value} className={cn("flex items-center gap-2", option.color)}>
                            <span className={cn("h-2 w-2 rounded-full", option.bg)}></span>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Textarea
                      value={reportFormData[String(inspection.serviceId)]?.notes || ''}
                      onChange={e => handleInputChange(String(inspection.serviceId), 'notes', e.target.value)}
                      placeholder="Notes for this inspection (optional)"
                      className="min-h-[80px]"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setIsReportDialogOpen(false)}
              className="shadow-sm"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitReport}
              disabled={isSubmittingReport}
              className="gap-2 shadow-sm"
            >
              {isSubmittingReport ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileText className="h-4 w-4" />
              )}
              Submit Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}