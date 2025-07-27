// components/WalkInBillModal.tsx
'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

interface BillModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderData: {
    order: any;
    userInfo: any;
    billDetails: any;
  };
}

export default function WalkInBillModal({ isOpen, onClose, orderData }: BillModalProps) {
  const { order, userInfo, billDetails } = orderData;

  const handlePrint = async () => {
    // Convert logo to base64 for print reliability
    async function getBase64Logo(url: string): Promise<string | null> {
      try {
        const response = await fetch(url);
        const blob = await response.blob();
        return await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      } catch {
        return null;
      }
    }
    const logoUrl = typeof window !== 'undefined' ? window.location.origin + '/motomate-logo.png' : '/motomate-logo.png';
    const base64Logo = await getBase64Logo(logoUrl);
    // Placeholder QR code SVG (simple black/white squares, base64)
    const qrSvg = `<svg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'><rect width='80' height='80' fill='#fff'/><rect x='8' y='8' width='20' height='20' fill='#000'/><rect x='52' y='8' width='20' height='20' fill='#000'/><rect x='8' y='52' width='20' height='20' fill='#000'/><rect x='36' y='36' width='8' height='8' fill='#000'/><rect x='44' y='44' width='8' height='8' fill='#000'/></svg>`;
    const base64Qr = 'data:image/svg+xml;base64,' + btoa(qrSvg);
    let userInfoSection = '';
    if (userInfo.isNewUser) {
      userInfoSection = `
        <div style='background:#e0f2fe;padding:8px 0 8px 0;border-radius:6px;border:1px solid #60a5fa;margin-bottom:10px;text-align:center;'>
          <div style='font-weight:600;color:#2563eb;'>Welcome! New Account Created</div>
          <div style='font-size:13px;'>Username: <b>${userInfo.username}</b></div>
          <div style='font-size:13px;'>Temporary Password: <b>${userInfo.temporaryPassword}</b></div>
          <div style='font-size:11px;color:#2563eb;'>Please change your password after your first login</div>
        </div>
      `;
    }
    const mainServiceRow = billDetails.services.mainService ? `
      <tr><td style='padding:2px 0;'>${billDetails.services.mainService.name}</td><td style='padding:2px 0;text-align:right;'>PKR ${billDetails.services.mainService.price.toFixed(2)}</td></tr>
    ` : '';
    const inspectionRow = billDetails.services.inspection ? `
      <tr><td style='padding:2px 0;'>${billDetails.services.inspection.name}${billDetails.services.inspection.subCategory ? ` (${billDetails.services.inspection.subCategory})` : ''}</td><td style='padding:2px 0;text-align:right;'>PKR ${billDetails.services.inspection.price.toFixed(2)}</td></tr>
    ` : '';
    const subtotal = order.totalAmount / 1.18;
    const tax = order.totalAmount - subtotal;
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>MOTOMATE WALK-IN RECEIPT</title>
          <meta charset='utf-8'>
          <meta name='viewport' content='width=device-width, initial-scale=1'>
          <style>
            @page { margin: 0.7cm; size: 80mm auto; }
            body { font-family: 'Fira Mono', 'Consolas', 'Courier New', monospace; color: #222; background: #fff; margin: 0; padding: 0; font-size: 13px; }
            .center { text-align: center; }
            .logo { height: 36px; width: 36px; object-fit: contain; margin-bottom: 2px; }
            .title { font-size: 1.5rem; font-weight: bold; letter-spacing: 1px; margin-bottom: 2px; }
            .subtitle { font-size: 13px; color: #2563eb; margin-bottom: 2px; }
            .divider { border-top: 1px dashed #888; margin: 7px 0; }
            .section-label { font-weight: bold; margin-top: 7px; margin-bottom: 2px; }
            .row { display: flex; justify-content: space-between; margin-bottom: 2px; }
            .totals { font-weight: bold; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 0; }
            th, td { font-size: 13px; }
            th { text-align: left; border-bottom: 1px solid #888; padding-bottom: 2px; }
            .footer { margin-top: 10px; text-align: center; color: #888; font-size: 11px; }
            .qr { display: flex; justify-content: center; margin: 10px 0; }
          </style>
        </head>
        <body>
          <div class='center'>
            ${base64Logo ? `<img src='${base64Logo}' class='logo' alt='MotoMate Logo' />` : `<div class='title'>MotoMate</div>`}
            <div class='title'>MotoMate</div>
            <div class='subtitle'>Automotive Service Center</div>
            <div style='font-size:12px;'>123 Main Street, Karachi</div>
            <div style='font-size:12px;'>Phone: 0300-1234567 | Email: info@motomate.pk</div>
          </div>
          <div class='divider'></div>
          ${userInfoSection}
          <div class='section-label'>Customer Details</div>
          <div class='row'><span>Name:</span><span>${userInfo.name}</span></div>
          <div class='row'><span>Phone:</span><span>${userInfo.phone}</span></div>
          <div class='row'><span>Email:</span><span>${userInfo.email}</span></div>
          <div class='divider'></div>
          <div class='section-label'>Vehicle Details</div>
          <div class='row'><span>Make/Model:</span><span>${billDetails.vehicle.make} ${billDetails.vehicle.model}</span></div>
          <div class='row'><span>Year:</span><span>${billDetails.vehicle.year}</span></div>
          <div class='row'><span>Plate:</span><span>${billDetails.vehicle.licensePlate}</span></div>
          <div class='divider'></div>
          <div class='section-label'>Items & Pricing</div>
          <table>
            <tbody>
              ${mainServiceRow}
              ${inspectionRow}
            </tbody>
          </table>
          <div class='divider'></div>
          <div class='row'><span>Subtotal</span><span>PKR ${subtotal.toFixed(2)}</span></div>
          <div class='row'><span>SST (18%)</span><span>PKR ${tax.toFixed(2)}</span></div>
          <div class='row totals'><span>Total</span><span>PKR ${order.totalAmount.toFixed(2)}</span></div>
          <div class='divider'></div>
          <div class='section-label'>Service Performed by:</div>
          <div class='row'><span>Name:</span><span>${billDetails.mechanic?.name || '-'}</span></div>
          <div class='row'><span>Contact:</span><span>${billDetails.mechanic?.phone || '-'}</span></div>
          <div class='divider'></div>
          <div class='qr'><img src='${base64Qr}' width='80' height='80' alt='QR Code' /></div>
          <div class='footer'>Order Date: ${billDetails.orderDate ? new Date(billDetails.orderDate).toLocaleDateString() : ''}<br/>Thank you for choosing MotoMate!</div>
        </body>
      </html>
    `;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Walk-In Order Receipt</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 print:text-black">
          {/* Header */}
          <div className="text-center border-b pb-4">
            {/* Logo with fallback */}
            <img src={typeof window !== 'undefined' ? window.location.origin + '/motomate-logo.png' : '/motomate-logo.png'} alt="MotoMate Logo" className="mx-auto mb-2" style={{ height: 40 }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            <h2 className="text-2xl font-bold">MotoMate Workshop</h2>
            <p className="text-muted-foreground">Walk-In Service Receipt</p>
            <Badge className="mt-2">Order #{order.orderId}</Badge>
          </div>

          {/* New User Info */}
          {userInfo.isNewUser && (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h3 className="font-semibold text-blue-800 mb-2">Welcome! New Account Created</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="font-medium">Username:</span> {userInfo.username}
                </div>
                <div>
                  <span className="font-medium">Temporary Password:</span> {userInfo.temporaryPassword}
                </div>
              </div>
              <p className="text-xs text-blue-600 mt-2">
                Please change your password after your first login
              </p>
            </div>
          )}

          {/* Customer & Vehicle Info */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-2">Customer Information</h3>
              <div className="space-y-1 text-sm">
                <p><span className="font-medium">Name:</span> {userInfo.name}</p>
                <p><span className="font-medium">Email:</span> {userInfo.email}</p>
                <p><span className="font-medium">Phone:</span> {userInfo.phone}</p>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Vehicle Information</h3>
              <div className="space-y-1 text-sm">
                <p><span className="font-medium">Vehicle:</span> {billDetails.vehicle.make} {billDetails.vehicle.model}</p>
                <p><span className="font-medium">Year:</span> {billDetails.vehicle.year}</p>
                <p><span className="font-medium">License Plate:</span> {billDetails.vehicle.licensePlate}</p>
              </div>
            </div>
          </div>

          {/* Service Details */}
          <div>
            <h3 className="font-semibold mb-2">Service Details</h3>
            <div className="space-y-2">
              {billDetails.services.inspection && (
                <div className="flex justify-between items-center p-2 bg-blue-50 rounded">
                  <div>
                    <span className="font-medium">{billDetails.services.inspection.name}</span>
                    {billDetails.services.inspection.subCategory && (
                      <Badge variant="outline" className="ml-2">{billDetails.services.inspection.subCategory}</Badge>
                    )}
                  </div>
                  <span>PKR {billDetails.services.inspection.price.toFixed(2)}</span>
                </div>
              )}
              {billDetails.services.mainService && (
                <div className="flex justify-between items-center p-2 bg-green-50 rounded">
                  <span className="font-medium">{billDetails.services.mainService.name}</span>
                  <span>PKR {billDetails.services.mainService.price.toFixed(2)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Order Summary */}
          <div className="border-t pt-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>PKR {(order.totalAmount / 1.18).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>SST (18%):</span>
                <span>PKR {(order.totalAmount - (order.totalAmount / 1.18)).toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold text-lg">
                <span>Total Amount:</span>
                <span>PKR {order.totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Payment Method:</span>
                <Badge variant="outline">{order.paymentMethod}</Badge>
              </div>
            </div>
          </div>

          {/* Mechanic Info */}
          <div className="bg-muted/30 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Service Performed by:</h3>
            <div className="flex justify-between">
              <span>{billDetails.mechanic?.name || '-'}</span>
              <span>{billDetails.mechanic?.phone || '-'}</span>
            </div>
          </div>

         
          {/* Footer */}
          <div className="text-center text-sm text-muted-foreground">
            <p>Order Date: {format(new Date(billDetails.orderDate), 'PPP')}</p>
            <p className="mt-1">Thank you for choosing MotoMate Workshop!</p>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-2 print:hidden">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button onClick={handlePrint}>
              Print Receipt
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}