'use client'

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  Wrench,
  Settings,
  DollarSign,
  ClipboardList,
  LogOut,
  Calendar,
  MessageSquare,
  Car,
  FileText,
  CreditCard,
  PieChart,
  Receipt,
  File,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ModeToggle } from '../ModeToggle';
import { UserInfo } from '../User/UserInfo';
import authService from '../../../services/authService';
import { toast } from 'sonner';
import axios from 'axios';

// Admin navigation items
const adminNavItems = [
  {
    title: 'Dashboard',
    href: '/admin/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Users',
    href: '/admin/users',
    icon: Users,
  },
  {
    title: 'Mechanics',
    href: '/admin/view-mechanics',
    icon: Wrench,
  },
  {
    title: 'Services',
    href: '/admin/services',
    icon: Settings,
  },
  {
    title: 'Orders',
    href: '/admin/orders',
    icon: ClipboardList,
  },
  {
    title: 'Finance',
    href: '/admin/view-finance',
    icon: DollarSign,
  },
];

// Mechanic navigation items
const mechanicNavItems = [
  {
    title: 'Dashboard',
    href: '/admin/mechanic',
    icon: LayoutDashboard,
  },
  {
    title: 'Appointments',
    href: '/admin/mechanic/appointments',
    icon: Calendar,
  },
  {
    title: 'Tasks',
    href: '/admin/mechanic/tasks',
    icon: ClipboardList,
  },
  {
    title: 'Service History',
    href: '/admin/mechanic/history',
    icon: FileText,
  },
  {
    title: 'Messages',
    href: '/admin/mechanic/messages',
    icon: MessageSquare,
  },
];

// Service Agent navigation items
const serviceAgentNavItems = [
  {
    title: 'Dashboard',
    href: '/service-agent/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Customers',
    href: '/service-agent/customers',
    icon: Users,
  },
  {
    title: 'Service Requests',
    href: '/service-agent/requests',
    icon: ClipboardList,
  },
  {
    title: 'Vehicles',
    href: '/service-agent/vehicles',
    icon: Car,
  },
  {
    title: 'Schedule',
    href: '/service-agent/schedule',
    icon: Calendar,
  },
  {
    title: 'Messages',
    href: '/service-agent/messages',
    icon: MessageSquare,
  },
];

// Finance Officer navigation items
const financeOfficerNavItems = [
  {
    title: 'Dashboard',
    href: '/finance/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Transactions',
    href: '/finance/transactions',
    icon: CreditCard,
  },
  {
    title: 'Invoices',
    href: '/finance/invoices',
    icon: File,
  },
  {
    title: 'Reports',
    href: '/finance/reports',
    icon: PieChart,
  },
  {
    title: 'Payments',
    href: '/finance/payments',
    icon: DollarSign,
  },
  {
    title: 'Receipts',
    href: '/finance/receipts',
    icon: Receipt,
  },
];

// Shared Navbar component that accepts navigation items and title
function Navbar({ title, navItems }: { title: string; navItems: any[] }) {
  const pathname = usePathname();
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        // Check if user is authenticated
        if (!authService.isAuthenticated()) {
          router.push("/login");
          return;
        }

        const userData = await authService.getCurrentUser();
        
        // Make sure userData has an avatar property (using imgUrl as fallback)
        const userWithAvatar = {
          ...userData,
          avatar: userData.imgUrl || '',
          role: userData.role // Make sure role is included
        };
        
        setUser(userWithAvatar);
      } catch (error) {
        console.error("Error fetching user profile:", error);
        toast.error("Failed to load profile. Please try again.");
        
        // If unauthorized, redirect to login
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          router.push("/login");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [router]);

  return (
    <nav className="fixed top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 hidden md:flex">
          <Link href={navItems[0].href} className="mr-6 flex items-center space-x-2">
            <span className="hidden font-bold sm:inline-block">
              {title}
            </span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center transition-colors hover:text-foreground/80',
                    isActive ? 'text-foreground' : 'text-foreground/60'
                  )}
                >
                  <item.icon className="mr-2 h-4 w-4" />
                  {item.title}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex-1"></div>
        <div className="flex items-center space-x-2">
          {!loading && user && <UserInfo user={user} />}
          <ModeToggle />
        </div>
      </div>
    </nav>
  );
}

// Admin Navbar Component
export function AdminNavbar() {
  return <Navbar title="Motomate Admin" navItems={adminNavItems} />;
}

// Mechanic Navbar Component
export function MechanicNavbar() {
  return <Navbar title="Motomate Mechanic" navItems={mechanicNavItems} />;
}

// Service Agent Navbar Component
export function ServiceAgentNavbar() {
  return <Navbar title="Motomate Service" navItems={serviceAgentNavItems} />;
}

// Finance Officer Navbar Component
export function FinanceNavbar() {
  return <Navbar title="Motomate Finance" navItems={financeOfficerNavItems} />;
}

// Main Router Component to determine which navbar to display
export default function RoleBasedNavbar() {
  const pathname = usePathname();

  switch (true) {
    case pathname.startsWith('/admin/mechanic'):
      return <MechanicNavbar />;
    case pathname.startsWith('/admin/service-agent'):
      return <ServiceAgentNavbar />;
    case pathname.startsWith('/admin/finance'):
      return <FinanceNavbar />;
    default:
      return <AdminNavbar />;
  }
}