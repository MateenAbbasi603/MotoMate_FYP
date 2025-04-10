'use client'

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  Wrench,
  Settings,
  DollarSign,
  ClipboardList,
  LogOut,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ModeToggle } from '../ModeToggle';

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
    href: '/admin/mechanics',
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
    href: '/admin/finance',
    icon: DollarSign,
  },
];

export default function AdminNavbar() {
  const pathname = usePathname();

  const handleLogout = () => {
    // Clear local storage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    // Redirect to login
    window.location.href = '/login';
  };

  return (
    <nav className="fixed top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 hidden md:flex">
          <Link href="/admin/dashboard" className="mr-6 flex items-center space-x-2">
            <span className="hidden font-bold sm:inline-block">
              Motomate Admin
            </span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            {adminNavItems.map((item) => {
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
        <div className="flex flex-1 items-center justify-end space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="flex items-center"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>

        <ModeToggle/>
      </div>
    </nav>
  );
} 