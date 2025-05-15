'use client'

import React, { useEffect, useState } from 'react'
import ReviewGuard from '@/components/ReviewGuard'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useRouter } from 'next/navigation'
import {
  CalendarClock,
  Car,
  CarFront,
  CheckCircle,
  ChevronRight,
  ClipboardList,
  Clock,
  DollarSign,
  FileCheck,
  LayoutDashboard,
  Wrench,
  AlertCircle,
  Settings,
  UserSquare,
  RefreshCw,
  Calendar,
  PlusCircle,
  History
} from 'lucide-react'
import { toast } from 'sonner'
import orderApi from '../../../../services/orderApi'

// Type definitions based on your backend models
interface Appointment {
  appointmentId: number
  orderId: number
  appointmentDate: string
  timeSlot: string
  status: string
  vehicle: {
    make: string
    model: string
    year: number
    licensePlate: string
  }
  service: {
    serviceName: string
    category: string
    price: number
  }
  mechanic: {
    name: string
    phone: string
  }
}

interface Vehicle {
  vehicleId: number
  make: string
  model: string
  year: number
  licensePlate: string
}

interface Service {
  serviceId: number
  serviceName: string
  category: string
  price: number
  description: string
  subCategory: string
}

interface Order {
  orderId: number
  status: string
  totalAmount: number
  orderDate: string
  service: {
    serviceName: string
    category: string
    price: number
  }
  vehicle: {
    make: string
    model: string
    year: number
    licensePlate: string
  }
  inspection?: {
    scheduledDate: string
    status: string
    timeSlot: string
  }
}

interface User {
  userId: number
  name: string
  email: string
  phone: string
  role: string
}

interface DashboardStats {
  pendingAppointments: number
  completedServices: number
  activeVehicles: number
  totalSpent: number
}

export default function DashboardPage() {
  const router = useRouter()

  // State for user data and loading states
  const [user, setUser] = useState<User | any>(null)
  const [loading, setLoading] = useState(true)
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    pendingAppointments: 0,
    completedServices: 0,
    activeVehicles: 0,
    totalSpent: 0
  })

  // State for different data sections
  const [appointments, setAppointments] = useState<any[]>([])
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [recentOrders, setRecentOrders] = useState<Order[]>([])
  const [serviceHistory, setServiceHistory] = useState<Order[]>([])

  // Fetch user profile
  useEffect(() => {
 const data  = orderApi.getCurrentUser()

 console.log("DATATA TATR ",data);
 

 setUser(data)
  }, [router, toast])

  // Fetch dashboard data
  useEffect(() => {
    if (!user) return

    const token = localStorage.getItem('token')

    const fetchDashboardData = async () => {
      setLoading(true)

      try {
        // Fetch appointments
        const appointmentsResponse = await fetch('/api/appointments', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (appointmentsResponse.ok) {
          const appointmentsData = await appointmentsResponse.json()
          setAppointments(appointmentsData)

          // Filter upcoming appointments
          const upcoming = appointmentsData.filter((apt: Appointment) =>
            apt.status !== 'completed' && apt.status !== 'cancelled'
          )
          setUpcomingAppointments(upcoming)

          // Update stats
          setDashboardStats(prev => ({
            ...prev,
            pendingAppointments: upcoming.length
          }))
        }

        // Fetch vehicles
        const vehiclesResponse = await fetch('/api/vehicles', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (vehiclesResponse.ok) {
          const vehiclesData = await vehiclesResponse.json()
          setVehicles(vehiclesData)

          // Update stats
          setDashboardStats(prev => ({
            ...prev,
            activeVehicles: vehiclesData.length
          }))
        }

        // Fetch orders
        const ordersResponse = await fetch('/api/orders', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (ordersResponse.ok) {
          const ordersData = await ordersResponse.json()

          // Sort by date, newest first
          const sortedOrders = [...ordersData].sort((a, b) =>
            new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime()
          )

          setRecentOrders(sortedOrders.slice(0, 5)) // Get 5 most recent orders

          // Filter completed orders for service history
          const completed = ordersData.filter((order: Order) => order.status === 'completed')
          setServiceHistory(completed)

          // Calculate total spent and completed services
          const totalAmount = ordersData.reduce((sum: number, order: Order) => sum + order.totalAmount, 0)

          // Update stats
          setDashboardStats(prev => ({
            ...prev,
            completedServices: completed.length,
            totalSpent: totalAmount
          }))
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
        toast.error('Failed to load dashboard data. Please try again.',)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [user, toast])

  // Helper function to format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  // Helper function to get status badge
  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { color: string, icon: React.ReactNode }> = {
      pending: { color: 'bg-yellow-500', icon: <Clock className="h-3 w-3" /> },
      scheduled: { color: 'bg-blue-500', icon: <CalendarClock className="h-3 w-3" /> },
      'in progress': { color: 'bg-purple-500', icon: <RefreshCw className="h-3 w-3" /> },
      completed: { color: 'bg-green-500', icon: <CheckCircle className="h-3 w-3" /> },
      cancelled: { color: 'bg-red-500', icon: <AlertCircle className="h-3 w-3" /> }
    }

    const defaultStyle = { color: 'bg-gray-500', icon: <Clock className="h-3 w-3" /> }
    const style = statusMap[status.toLowerCase()] || defaultStyle

    return (
      <Badge variant="outline" className={`${style.color} text-white flex items-center gap-1`}>
        {style.icon}
        <span className="capitalize">{status}</span>
      </Badge>
    )
  }

  if (loading && !user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-full border-4 border-t-blue-500 border-b-transparent border-l-transparent border-r-transparent animate-spin"></div>
          <p className="text-lg font-medium">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <ReviewGuard>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Welcome back, {user?.name || 'User'}
            </p>
          </div>
          <div className="mt-4 md:mt-0 flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => router.push('/vehicles/new')}
              className="flex items-center gap-2"
            >
              <Car className="h-4 w-4" />
              Add Vehicle
            </Button>
            <Button
              onClick={() => router.push('/appointments/new')}
              className="flex items-center gap-2"
            >
              <PlusCircle className="h-4 w-4" />
              New Order
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending Orders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold">
                  {dashboardStats.pendingAppointments}
                </div>
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <CalendarClock className="h-6 w-6 text-blue-500" />
                </div>
              </div>
            </CardContent>
            <CardFooter className="pt-0">
              <Button variant="ghost" size="sm" className="px-0 text-blue-500" onClick={() => router.push('/appointments')}>
                View all Orders
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Completed Services
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold">
                  {dashboardStats.completedServices}
                </div>
                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                  <Wrench className="h-6 w-6 text-green-500" />
                </div>
              </div>
            </CardContent>
            <CardFooter className="pt-0">
              <Button variant="ghost" size="sm" className="px-0 text-green-500" onClick={() => router.push('/history')}>
                View service history
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Registered Vehicles
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold">
                  {dashboardStats.activeVehicles}
                </div>
                <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center">
                  <CarFront className="h-6 w-6 text-orange-500" />
                </div>
              </div>
            </CardContent>
            <CardFooter className="pt-0">
              <Button variant="ghost" size="sm" className="px-0 text-orange-500" onClick={() => router.push('/vehicles')}>
                Manage vehicles
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Spent
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold">
                  ${dashboardStats.totalSpent.toFixed(2)}
                </div>
                <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-purple-500" />
                </div>
              </div>
            </CardContent>
            <CardFooter className="pt-0">
              <Button variant="ghost" size="sm" className="px-0 text-purple-500" onClick={() => router.push('/payments')}>
                View payment history
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Upcoming Appointments */}
        <div className="mb-8">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Upcoming Orders</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push('/appointments')}
                >
                  View All
                </Button>
              </div>
              <CardDescription>
                Your scheduled service Orders
              </CardDescription>
            </CardHeader>
            <CardContent>
              {upcomingAppointments.length > 0 ? (
                <div className="space-y-4">
                  {upcomingAppointments.slice(0, 3).map((appointment) => (
                    <div
                      key={appointment.appointmentId}
                      className="flex flex-col lg:flex-row lg:items-center justify-between p-4 rounded-lg border"
                    >
                      <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4 lg:mb-0">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <Calendar className="h-5 w-5 text-blue-500" />
                        </div>
                        <div>
                          <p className="font-medium">{appointment.service?.serviceName || 'Service Appointment'}</p>
                          <p className="text-sm text-muted-foreground">
                            {appointment.vehicle?.make} {appointment.vehicle?.model} ({appointment.vehicle?.year})
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                        <div className="flex flex-col">
                          <p className="text-sm font-medium">{formatDate(appointment.appointmentDate)}</p>
                          <p className="text-sm text-muted-foreground">{appointment.timeSlot}</p>
                        </div>
                        <div>
                          {getStatusBadge(appointment.status)}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/appointments/${appointment.appointmentId}`)}
                        >
                          Details
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <CalendarClock className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="font-medium text-lg mb-1">No upcoming Orders</h3>
                  <p className="text-muted-foreground mb-4">Schedule a new appointment for your vehicle.</p>
                  <Button
                    onClick={() => router.push('/appointments/new')}
                    className="flex items-center gap-2"
                  >
                    <PlusCircle className="h-4 w-4" />
                    New Appointment
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Orders and Vehicles */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Recent Orders */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Orders</CardTitle>
              <CardDescription>
                Your most recent service orders
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentOrders.length > 0 ? (
                <div className="space-y-4">
                  {recentOrders.slice(0, 4).map((order) => (
                    <div
                      key={order.orderId}
                      className="flex items-start justify-between p-4 rounded-lg border"
                    >
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <ClipboardList className="h-4 w-4 text-muted-foreground" />
                          <p className="font-medium">Order #{order.orderId}</p>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {order.vehicle?.make} {order.vehicle?.model}
                        </p>
                        <p className="text-sm font-medium mt-1">
                          {order.service?.serviceName || 'Service Order'}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {formatDate(order.orderDate)}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <p className="font-medium">${order.totalAmount.toFixed(2)}</p>
                        {getStatusBadge(order.status)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <ClipboardList className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="font-medium text-lg mb-1">No recent orders</h3>
                  <p className="text-muted-foreground">Orders will appear here when you place them.</p>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => router.push('/orders')}
              >
                View All Orders
              </Button>
            </CardFooter>
          </Card>

          {/* Your Vehicles */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Your Vehicles</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push('/vehicles/new')}
                >
                  Add Vehicle
                </Button>
              </div>
              <CardDescription>
                Registered vehicles for service
              </CardDescription>
            </CardHeader>
            <CardContent>
              {vehicles.length > 0 ? (
                <div className="space-y-4">
                  {vehicles.slice(0, 4).map((vehicle) => (
                    <div
                      key={vehicle.vehicleId}
                      className="flex items-center justify-between p-4 rounded-lg border"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center">
                          <CarFront className="h-5 w-5 text-slate-500" />
                        </div>
                        <div>
                          <p className="font-medium">
                            {vehicle.make} {vehicle.model} ({vehicle.year})
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {vehicle.licensePlate}
                          </p>
                        </div>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(`/vehicles/${vehicle.vehicleId}`)}
                      >
                        Details
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Car className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="font-medium text-lg mb-1">No vehicles registered</h3>
                  <p className="text-muted-foreground mb-4">Add your first vehicle to get started.</p>
                  <Button
                    onClick={() => router.push('/vehicles/new')}
                    className="flex items-center gap-2"
                  >
                    <Car className="h-4 w-4" />
                    Add Vehicle
                  </Button>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => router.push('/vehicles')}
              >
                Manage All Vehicles
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Service History */}
        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Service History</CardTitle>
              <CardDescription>
                Past services for your vehicles
              </CardDescription>
            </CardHeader>
            <CardContent>
              {serviceHistory.length > 0 ? (
                <div className="rounded-md border">
                  <div className="grid grid-cols-5 bg-slate-50 p-4 font-medium text-sm">
                    <div>Date</div>
                    <div>Vehicle</div>
                    <div>Service</div>
                    <div>Status</div>
                    <div className="text-right">Amount</div>
                  </div>
                  {serviceHistory.slice(0, 5).map((order, index) => (
                    <React.Fragment key={order.orderId}>
                      {index > 0 && <hr />}
                      <div className="grid grid-cols-5 p-4 text-sm">
                        <div className="flex items-center">
                          {formatDate(order.orderDate)}
                        </div>
                        <div>
                          {order.vehicle?.make} {order.vehicle?.model}
                        </div>
                        <div>
                          {order.service?.serviceName || 'Maintenance Service'}
                        </div>
                        <div>
                          {getStatusBadge(order.status)}
                        </div>
                        <div className="text-right font-medium">
                          ${order.totalAmount.toFixed(2)}
                        </div>
                      </div>
                    </React.Fragment>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <History className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="font-medium text-lg mb-1">No service history</h3>
                  <p className="text-muted-foreground">
                    Your completed services will appear here.
                  </p>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => router.push('/history')}
              >
                View Full Service History
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Quick Links */}
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">Quick Links</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="group hover:border-blue-500 transition-colors cursor-pointer" onClick={() => router.push('/appointments/new')}>
              <CardHeader className="p-4">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center group-hover:bg-blue-500 transition-colors">
                    <CalendarClock className="h-4 w-4 text-blue-500 group-hover:text-white transition-colors" />
                  </div>
                  <CardTitle className="text-base">Schedule Service</CardTitle>
                </div>
              </CardHeader>
            </Card>

            <Card className="group hover:border-green-500 transition-colors cursor-pointer" onClick={() => router.push('/vehicles/new')}>
              <CardHeader className="p-4">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center group-hover:bg-green-500 transition-colors">
                    <Car className="h-4 w-4 text-green-500 group-hover:text-white transition-colors" />
                  </div>
                  <CardTitle className="text-base">Add Vehicle</CardTitle>
                </div>
              </CardHeader>
            </Card>

            <Card className="group hover:border-purple-500 transition-colors cursor-pointer" onClick={() => router.push('/history')}>
              <CardHeader className="p-4">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center group-hover:bg-purple-500 transition-colors">
                    <History className="h-4 w-4 text-purple-500 group-hover:text-white transition-colors" />
                  </div>
                  <CardTitle className="text-base">Service History</CardTitle>
                </div>
              </CardHeader>
            </Card>

            <Card className="group hover:border-orange-500 transition-colors cursor-pointer" onClick={() => router.push('/profile')}>
              <CardHeader className="p-4">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center group-hover:bg-orange-500 transition-colors">
                    <UserSquare className="h-4 w-4 text-orange-500 group-hover:text-white transition-colors" />
                  </div>
                  <CardTitle className="text-base">My Profile</CardTitle>
                </div>
              </CardHeader>
            </Card>
          </div>
        </div>
      </div>
    </ReviewGuard>
  )
}