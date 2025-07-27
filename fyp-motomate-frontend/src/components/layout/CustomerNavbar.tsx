'use client'
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Car,
  Wrench,
  ShoppingCart,
  UserIcon,
  Menu,
  X,
  LogOut,
  Settings,
  Bell,
  Search,
  ChevronDown
} from 'lucide-react';
import { ModeToggle } from '../ModeToggle';
import { UserInfo } from '../User/UserInfo';
import { User } from '../../../services/orderApi';
import authService from '../../../services/authService';
import { toast } from 'sonner';
import axios from 'axios';
import NotificationDropdown from '../NotificationDropdown';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

const customerNavItems = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    description: 'Overview and quick actions'
  },
  {
    title: 'My Vehicles',
    href: '/vehicles',
    icon: Car,
    description: 'Manage your vehicles'
  },
  {
    title: 'Services',
    href: '/service',
    icon: Wrench,
    description: 'Book new services'
  },
  {
    title: 'Orders',
    href: '/orders',
    icon: ShoppingCart,
    description: 'Track your orders'
  },
  {
    title: 'Profile',
    href: '/profile',
    icon: UserIcon,
    description: 'Account settings'
  },
];

export default function CustomerNavbar() {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        // Check if user is authenticated
        if (!authService.isAuthenticated()) {
          router.push("/login");
          return;
        }
        const userData: any = await authService.getCurrentUser();

        // Make sure userData has an avatar property (using imgUrl as fallback)
        const userWithAvatar = {
          ...userData,
          avatar: userData.avatar || userData.imgUrl || ''
        };

        setUser(userWithAvatar as any);
      } catch (error: any) {
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

  const handleLogout = () => {
    authService.logout();
    toast.success("Logged out successfully");
    router.push("/login");
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <>
      <nav className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            {/* Logo Section */}
            <div className="flex items-center space-x-8">
              <Link href="/dashboard" className="flex items-center space-x-3 group">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-lg group-hover:shadow-lg transition-all duration-200">
                  M
                </div>
                <span className="hidden font-bold text-xl bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent sm:inline-block">
                  MotoMate
                </span>
              </Link>

              {/* Desktop Navigation */}
              <nav className="hidden lg:flex items-center space-x-1">
                {customerNavItems.map((item) => {
                  const isActive = pathname === item.href ||
                    (item.href !== '/dashboard' && pathname.startsWith(item.href));

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        'flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 group',
                        isActive
                          ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      )}
                    >
                      <item.icon className={cn(
                        "mr-2 h-4 w-4 transition-colors",
                        isActive ? "text-blue-600" : "text-gray-500 group-hover:text-gray-700"
                      )} />
                      {item.title}
                      {isActive && (
                        <div className="ml-2 h-1.5 w-1.5 rounded-full bg-blue-600"></div>
                      )}
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Right Section */}
            <div className="flex items-center space-x-3">
              {/* Search Button - Hidden on mobile */}
              <Button
                variant="ghost"
                size="sm"
                className="hidden md:flex items-center space-x-2 text-gray-500 hover:text-gray-700"
              >
                <Search className="h-4 w-4" />
                <span className="text-sm">Search</span>
              </Button>

              {/* Notifications */}
              {!loading && user && <NotificationDropdown />}

              {/* Theme Toggle */}
              <ModeToggle />

              {/* User Menu - Desktop */}
              {!loading && user && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="hidden md:flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <Avatar className="h-8 w-8 ring-2 ring-gray-100">
                        <AvatarImage src={user.imgUrl || ""} alt={user.name} />
                        <AvatarFallback className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-medium">
                          {getInitials(user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col items-start">
                        <span className="text-sm font-medium text-gray-900 truncate max-w-24">
                          {user.name}
                        </span>
                        <span className="text-xs text-gray-500 capitalize">
                          {user.role}
                        </span>
                      </div>
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className=" p-2">
                    <DropdownMenuLabel className="p-3">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={user.imgUrl || ""} alt={user.name} />
                          <AvatarFallback className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                            {getInitials(user.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-gray-900">{user.name}</p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/profile" className="flex items-center px-3 py-2">
                        <Settings className="mr-2 h-4 w-4" />
                        Account Settings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/orders" className="flex items-center px-3 py-2">
                        <ShoppingCart className="mr-2 h-4 w-4" />
                        Order History
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="flex items-center px-3 py-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {/* Mobile Menu Button */}
              <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="lg:hidden p-2"
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-80 p-0">
                  <div className="flex flex-col h-full">
                    {/* Mobile Header */}
                    <SheetHeader className="p-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
                      {user && (
                        <div className="flex items-center space-x-4">
                          <Avatar className="h-12 w-12 ring-2 ring-white shadow-lg">
                            <AvatarImage src={user.imgUrl || ''} alt={user.name} />
                            <AvatarFallback className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium">
                              {getInitials(user.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col items-start">
                            <SheetTitle className="text-gray-900 font-semibold">
                              {user.name}
                            </SheetTitle>
                            <SheetDescription className="text-gray-600">
                              {user.email}
                            </SheetDescription>
                            <Badge variant="secondary" className="mt-1 capitalize text-xs">
                              {user.role}
                            </Badge>
                          </div>
                        </div>
                      )}
                    </SheetHeader>

                    {/* Mobile Navigation */}
                    <div className="flex-1 p-6">
                      <nav className="space-y-2">
                        {customerNavItems.map((item) => {
                          const isActive = pathname === item.href ||
                            (item.href !== '/dashboard' && pathname.startsWith(item.href));

                          return (
                            <Link
                              key={item.href}
                              href={item.href}
                              onClick={() => setMobileOpen(false)}
                              className={cn(
                                'flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group',
                                isActive
                                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                              )}
                            >
                              <item.icon className={cn(
                                "mr-3 h-5 w-5",
                                isActive ? "text-white" : "text-gray-500 group-hover:text-gray-700"
                              )} />
                              <div className="flex flex-col items-start">
                                <span>{item.title}</span>
                                {!isActive && (
                                  <span className="text-xs text-gray-500 group-hover:text-gray-600">
                                    {item.description}
                                  </span>
                                )}
                              </div>
                            </Link>
                          );
                        })}
                      </nav>
                    </div>

                    {/* Mobile Footer */}
                    <div className="p-6 border-t bg-gray-50">
                      <div className="space-y-3">
                        <Link
                          href="/profile"
                          onClick={() => setMobileOpen(false)}
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-white rounded-lg transition-colors"
                        >
                          <Settings className="mr-3 h-4 w-4" />
                          Account Settings
                        </Link>
                        <Button
                          onClick={() => {
                            setMobileOpen(false);
                            handleLogout();
                          }}
                          variant="ghost"
                          className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <LogOut className="mr-3 h-4 w-4" />
                          Sign Out
                        </Button>
                      </div>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </nav>

      {/* Loading State */}
      {loading && (
        <div className="fixed top-16 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 to-indigo-600 animate-pulse"></div>
      )}
    </>
  );
}