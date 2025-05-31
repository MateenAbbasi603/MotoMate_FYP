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

  const handlePrint = () => {
    window.print();
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
            <h3 className="font-semibold mb-2">Assigned Mechanic</h3>
            <div className="flex justify-between">
              <span>{billDetails.mechanic.name}</span>
              <span>{billDetails.mechanic.phone}</span>
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