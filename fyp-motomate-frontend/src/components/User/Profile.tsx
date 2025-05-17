"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  User as UserIcon,
  Shield,
  KeyRound,
  Clock,
  AlertCircle,
  Settings,
  Bell,
  Car,
  LogOut,
  CreditCard,
  History,
  ChevronRight,
  UserCircle2,
  BadgeCheck,
  Activity
} from "lucide-react";
import authService, { User } from "../../../services/authService";
import axios from "axios";
import ProfileForm from "./ProfileForm";
import ChangePasswordForm from "./ChangePasswordForm";

export default function Profile() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeDays, setActiveDays] = useState(0);
  const [profileCompletion, setProfileCompletion] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        // Check if user is authenticated
        if (!authService.isAuthenticated()) {
          router.push("/login");
          return;
        }

        setLoading(true);
        const userData = await authService.getCurrentUser();
        setUser(userData);

        // Calculate profile completion percentage
        if (userData) {
          let completedFields = 0;
          const totalFields = 5; // name, email, phone, address, avatar
          if (userData.name) completedFields++;
          if (userData.email) completedFields++;
          if (userData.phone) completedFields++;
          if (userData.address) completedFields++;
          if (userData.imgUrl && userData.imgUrl !== "") completedFields++;

          setProfileCompletion(Math.floor((completedFields / totalFields) * 100));

          // Calculate account age in days (for demo purposes)
          const createdDate = userData.createdAt 
            ? new Date(userData.createdAt) 
            : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // fallback to 30 days ago
          
          const daysSinceCreation = Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
          setActiveDays(daysSinceCreation);
        }
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

  // Function to get initial from name for avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  const handleLogout = () => {
    authService.logout();
    router.push("/login");
    toast.success("Logged out successfully");
  };

  return (
    <div className="container mx-auto py-10 px-4 md:px-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Account</h1>
          <p className="text-muted-foreground mt-1">
            Manage your profile and account settings
          </p>
        </div>

        <Button 
          variant="outline" 
          className="text-destructive hover:text-destructive border-destructive/30 hover:bg-destructive/10"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
      </div>

      <Separator className="my-6" />

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main column - Profile tabs */}
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <Skeleton className="h-8 w-1/3 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Sidebar column - Account info */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-8 w-1/2 mb-2" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-4 mb-4">
                  <Skeleton className="h-16 w-16 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                </div>
                <div className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-1/2" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main column - Profile tabs */}
          <div className="md:col-span-2">
            <Tabs defaultValue="profile" className="w-full">
              <TabsList className="grid w-full md:w-[400px] grid-cols-2 mb-6 p-1 rounded-lg bg-muted/50">
                <TabsTrigger value="profile" className="rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm font-medium">
                  <UserIcon className="h-4 w-4 mr-2" />
                  Profile Details
                </TabsTrigger>
                <TabsTrigger value="password" className="rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm font-medium">
                  <KeyRound className="h-4 w-4 mr-2" />
                  Security
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="profile">
                <Card className="border-muted-foreground/20 shadow-sm">
                  <CardHeader className="border-b bg-muted/30">
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle className="flex items-center">
                          <UserCircle2 className="h-5 w-5 mr-2 text-primary" />
                          Personal Information
                        </CardTitle>
                        <CardDescription className="mt-1">
                          View and update your personal details
                        </CardDescription>
                      </div>
                      <Badge variant={profileCompletion === 100 ? "default" : "outline"} className="ml-2">
                        {profileCompletion === 100 ? (
                          <span className="flex items-center">
                            <BadgeCheck className="h-3.5 w-3.5 mr-1" />
                            Complete
                          </span>
                        ) : (
                          <span className="flex items-center">
                            <Activity className="h-3.5 w-3.5 mr-1" />
                            {profileCompletion}% Complete
                          </span>
                        )}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    {user && <ProfileForm user={user} setUser={setUser} />}
                  </CardContent>
                  <CardFooter className="bg-muted/10 border-t flex flex-col items-start px-6 py-4">
                    <div className="flex items-start">
                      <AlertCircle className="h-4 w-4 mr-2 mt-0.5 text-amber-500" />
                      <div>
                        <p className="text-sm font-medium">Keep your profile updated</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Your profile information helps us provide better service and personalized recommendations.
                        </p>
                      </div>
                    </div>
                  </CardFooter>
                </Card>
              </TabsContent>
              
              <TabsContent value="password">
                <Card className="border-muted-foreground/20 shadow-sm">
                  <CardHeader className="border-b bg-muted/30">
                    <div className="flex items-center">
                      <Shield className="h-5 w-5 mr-2 text-primary" />
                      <div>
                        <CardTitle>Account Security</CardTitle>
                        <CardDescription className="mt-1">
                          Manage your password and account security settings
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <ChangePasswordForm />
                    
                    <div className="mt-8 pt-6 border-t">
                      <h3 className="font-medium text-lg mb-4">Security Tips</h3>
                      <ul className="space-y-3">
                        <li className="flex items-start">
                          <BadgeCheck className="h-5 w-5 mr-2 text-primary mt-0.5" />
                          <div>
                            <p className="font-medium text-sm">Use strong passwords</p>
                            <p className="text-muted-foreground text-sm">Include numbers, symbols, and mixed case letters</p>
                          </div>
                        </li>
                        <li className="flex items-start">
                          <BadgeCheck className="h-5 w-5 mr-2 text-primary mt-0.5" />
                          <div>
                            <p className="font-medium text-sm">Update regularly</p>
                            <p className="text-muted-foreground text-sm">Change your password every 3-6 months</p>
                          </div>
                        </li>
                        <li className="flex items-start">
                          <BadgeCheck className="h-5 w-5 mr-2 text-primary mt-0.5" />
                          <div>
                            <p className="font-medium text-sm">Don't reuse passwords</p>
                            <p className="text-muted-foreground text-sm">Use different passwords for different services</p>
                          </div>
                        </li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
          
          {/* Sidebar column - Account info */}
          <div className="space-y-6">
            {/* Account Summary Card */}
            <Card className="border-muted-foreground/20 shadow-sm overflow-hidden">
              <CardHeader className="bg-primary/5 pb-2 border-b">
                <CardTitle className="text-lg">Account Summary</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-4 mb-6">
                  {user?.imgUrl ? (
                    <img 
                      src={user.imgUrl} 
                      alt={user.name} 
                      className="h-16 w-16 rounded-full border-2 border-primary/20"
                    />
                  ) : (
                    <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-lg font-semibold text-primary border-2 border-primary/20">
                      {user?.name ? getInitials(user.name) : "?"}
                    </div>
                  )}
                  <div>
                    <h3 className="font-medium">{user?.name}</h3>
                    <p className="text-sm text-muted-foreground">{user?.email}</p>
                    <Badge 
                      variant="outline" 
                      className="mt-1 text-xs bg-primary/5 border-primary/20"
                    >
                      {user?.role?.toUpperCase() || "CUSTOMER"}
                    </Badge>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-sm font-medium">Profile Completion</span>
                      <span className="text-sm">{profileCompletion}%</span>
                    </div>
                    <Progress value={profileCompletion} className="h-2" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="flex items-center p-3 bg-muted/30 rounded-lg">
                      <Clock className="h-5 w-5 mr-2 text-muted-foreground" />
                      <div>
                        <div className="text-xs text-muted-foreground">Member for</div>
                        <div className="font-medium">{activeDays} days</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center p-3 bg-muted/30 rounded-lg">
                      <Car className="h-5 w-5 mr-2 text-muted-foreground" />
                      <div>
                        <div className="text-xs text-muted-foreground">Vehicles</div>
                        <div className="font-medium">2</div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Quick Actions Card */}
            <Card className="border-muted-foreground/20 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-1 -mx-2">
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start font-normal rounded-md hover:bg-muted/50 px-2"
                    onClick={() => router.push("/vehicles")}
                  >
                    <Car className="h-4 w-4 mr-2" />
                    <span>Manage Vehicles</span>
                    <ChevronRight className="h-4 w-4 ml-auto" />
                  </Button>
                  
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start font-normal rounded-md hover:bg-muted/50 px-2"
                    onClick={() => router.push("/services")}
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    <span>View Services</span>
                    <ChevronRight className="h-4 w-4 ml-auto" />
                  </Button>
                  
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start font-normal rounded-md hover:bg-muted/50 px-2"
                    onClick={() => router.push("/appointments")}
                  >
                    <History className="h-4 w-4 mr-2" />
                    <span>Service History</span>
                    <ChevronRight className="h-4 w-4 ml-auto" />
                  </Button>
                  
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start font-normal rounded-md hover:bg-muted/50 px-2"
                    onClick={() => toast.info("Notification preferences will be available soon!")}
                  >
                    <Bell className="h-4 w-4 mr-2" />
                    <span>Notification Settings</span>
                    <ChevronRight className="h-4 w-4 ml-auto" />
                  </Button>
                  
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start font-normal rounded-md hover:bg-muted/50 px-2"
                    onClick={() => toast.info("Account settings will be available soon!")}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    <span>Account Settings</span>
                    <ChevronRight className="h-4 w-4 ml-auto" />
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            {/* Recent Activity Card (placeholder) */}
            <Card className="border-muted-foreground/20 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="space-y-3">
                  <div className="flex items-start space-x-2">
                    <div className="min-w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mt-0.5">
                      <UserIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Profile Updated</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Yesterday at 3:45 PM</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-2">
                    <div className="min-w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mt-0.5">
                      <KeyRound className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Password Changed</p>
                      <p className="text-xs text-muted-foreground mt-0.5">3 days ago</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-2">
                    <div className="min-w-8 h-8 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mt-0.5">
                      <Car className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Vehicle Added</p>
                      <p className="text-xs text-muted-foreground mt-0.5">1 week ago</p>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pt-0 flex justify-center border-t">
                <Button 
                  variant="link" 
                  className="text-xs text-muted-foreground"
                  onClick={() => toast.info("Activity history will be available soon!")}
                >
                  View All Activity
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}