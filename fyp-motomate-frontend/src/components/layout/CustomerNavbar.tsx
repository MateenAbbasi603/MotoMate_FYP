'use client'

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Car,
  Wrench,
  LogOut,
  ShoppingCart,
  UserIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ModeToggle } from '../ModeToggle';
import { UserInfo } from '../User/UserInfo';
import { User } from '../../../services/orderApi';
import authService from '../../../services/authService';
import { toast } from 'sonner';
import axios from 'axios';

const customerNavItems = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'My Vehicles',
    href: '/vehicles',
    icon: Car,
  },
  {
    title: 'Services',
    href: '/service',
    icon: Wrench,
  },
  {
    title: 'Profile',
    href: '/profile',
    icon: UserIcon,
  },
  {
    title: 'Orders',
    href: '/orders',
    icon: ShoppingCart
  },
];

export default function CustomerNavbar() {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
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

        const userData :any = await authService.getCurrentUser();
        
        // Make sure userData has an avatar property (using imgUrl as fallback)
        const userWithAvatar  = {
          ...userData,
          avatar: userData.avatar || userData.imgUrl || ''
        };
        
        setUser(userWithAvatar as any);
      } catch (error:any) {
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
          <Link href="/dashboard" className="mr-6 flex items-center space-x-2">
            <span className="hidden font-bold sm:inline-block">
              Motomate
            </span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            {customerNavItems.map((item) => {
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
          {!loading && user && <UserInfo user={user as any} />}
          <ModeToggle />
        </div>
      </div>
    </nav>
  );
}