"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { toast } from "sonner";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { 
  User, 
  ArrowUpDown, 
  MoreHorizontal, 
  Plus, 
  Trash, 
  Shield, 
  Search, 
  UserCog, 
  ChevronLeft, 
  ChevronRight,
  Filter,
  Mail,
  Phone,
  Calendar,
  UserPlus,
  Users,
  AlertTriangle,
  Info
} from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import Link from "next/link";

// Type for user data
interface UserData {
  userId: number;
  username: string;
  email: string;
  role: string;
  name: string;
  phone: string | null;
  address: string | null;
  createdAt: string;
  imgUrl?: string;
}

// Role badge component with improved styling
const RoleBadge = ({ role }: { role: string }) => {
  const getRoleConfig = (role: string) => {
    switch (role) {
      case "super_admin":
        return {
          className: "bg-red-100 text-red-800 hover:bg-red-100 border-red-200",
          icon: <Shield className="h-3 w-3 mr-1" />
        };
      case "admin":
        return {
          className: "bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200",
          icon: <UserCog className="h-3 w-3 mr-1" />
        };
      case "service_agent":
        return {
          className: "bg-green-100 text-green-800 hover:bg-green-100 border-green-200",
          icon: <User className="h-3 w-3 mr-1" />
        };
      case "mechanic":
        return {
          className: "bg-amber-100 text-amber-800 hover:bg-amber-100 border-amber-200", 
          icon: <User className="h-3 w-3 mr-1" />
        };
      case "finance_officer":
        return {
          className: "bg-purple-100 text-purple-800 hover:bg-purple-100 border-purple-200",
          icon: <User className="h-3 w-3 mr-1" />
        };
      default:
        return {
          className: "bg-gray-100 text-gray-800 hover:bg-gray-100 border-gray-200",
          icon: <User className="h-3 w-3 mr-1" />
        };
    }
  };

  const config = getRoleConfig(role);
  const displayRole = role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

  return (
    <Badge className={`${config.className} flex items-center gap-1 font-medium px-2 py-1`} variant="outline">
      {config.icon}
      {displayRole}
    </Badge>
  );
};

// Function to get user's initials for avatar fallback
const getInitials = (name: string) => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();
};

// Stats card component
const StatsCard = ({ title, value, icon, description }: { 
  title: string, 
  value: number | string, 
  icon: React.ReactNode,
  description?: string
}) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
};

export default function UserManagement() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [selectedRole, setSelectedRole] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });

  const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
  const router = useRouter();

  // Define table columns
  const columns: ColumnDef<UserData>[] = [
    {
      accessorKey: "userId",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="px-0 font-medium"
          >
            ID
            <ArrowUpDown className="ml-1 h-3 w-3" />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className="font-medium text-muted-foreground">#{row.getValue("userId")}</div>
      ),
      size: 60,
    },
    {
      accessorKey: "name",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="px-0 font-medium"
          >
            Name
            <ArrowUpDown className="ml-1 h-3 w-3" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const user = row.original;
        return (
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={user.imgUrl} alt={user.name} />
              <AvatarFallback className="bg-primary/10 text-primary">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium">{user.name}</div>
              <div className="text-xs text-muted-foreground">@{user.username}</div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "email",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="px-0 font-medium"
          >
            Email
            <ArrowUpDown className="ml-1 h-3 w-3" />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className="flex items-center">
          <Mail className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-sm">{row.getValue("email")}</span>
        </div>
      ),
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => <RoleBadge role={row.getValue("role")} />,
      filterFn: (row, id, value) => {
        return value === "all" || row.getValue(id) === value;
      },
    },
    {
      accessorKey: "phone",
      header: "Contact",
      cell: ({ row }) => {
        const phone = row.getValue("phone") as string;
        return phone ? (
          <div className="flex items-center">
            <Phone className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-sm">{phone}</span>
          </div>
        ) : (
          <span className="text-muted-foreground text-sm">Not provided</span>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="px-0 font-medium"
          >
            Joined
            <ArrowUpDown className="ml-1 h-3 w-3" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const date = new Date(row.getValue("createdAt"));
        return (
          <div className="flex items-center">
            <Calendar className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-sm">{format(date, "MMM d, yyyy")}</span>
          </div>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const user = row.original;

        return (
          <TooltipProvider>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => router.push(`/admin/users/${user.userId}`)}
                  className="cursor-pointer"
                >
                  <User className="mr-2 h-4 w-4" />
                  View Profile
                </DropdownMenuItem>

                {user.role !== "super_admin" ? (
                  <DropdownMenuItem
                    onClick={() => handleDeleteUser(user.userId)}
                    className="text-red-600 cursor-pointer"
                  >
                    <Trash className="mr-2 h-4 w-4" />
                    Delete User
                  </DropdownMenuItem>
                ) : (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="px-2 py-1.5 text-sm text-muted-foreground flex items-center">
                        <AlertTriangle className="mr-2 h-4 w-4 text-yellow-500" />
                        Cannot Delete
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">Super Admin cannot be deleted</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </TooltipProvider>
        );
      },
    },
  ];

  // Fetch users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        
        const response = await axios.get(`${API_URL}/api/Users`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        // Process the response data
        let usersData = [];
        if (response.data?.$values) {
          usersData = response.data.$values;
        } else if (Array.isArray(response.data)) {
          usersData = response.data;
        } else {
          console.error("Unexpected data format:", response.data);
          usersData = [];
        }

        setUsers(usersData);
      } catch (error) {
        console.error("Failed to fetch users:", error);
        toast.error("Failed to fetch users. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [API_URL]);

  // Filter users based on selected role and search query
  useEffect(() => {
    if (selectedRole !== "all") {
      table.getColumn("role")?.setFilterValue(selectedRole);
    } else {
      table.getColumn("role")?.setFilterValue(undefined);
    }

    if (searchQuery) {
      table.getColumn("name")?.setFilterValue(searchQuery);
    } else {
      table.getColumn("name")?.setFilterValue(undefined);
    }
  }, [selectedRole, searchQuery]);

  // Handle delete user
  const handleDeleteUser = async (userId: number) => {
    if (confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
      try {
        const token = localStorage.getItem('token');
        
        await axios.delete(`${API_URL}/api/Users/${userId}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        setUsers(users.filter((user) => user.userId !== userId));
        toast.success("User deleted successfully");
      } catch (error: any) {
        console.error("Failed to delete user:", error);
        const errorMessage = error.response?.data?.message || "Failed to delete user";
        toast.error(errorMessage);
      }
    }
  };

  // Table instance
  const table = useReactTable({
    data: users,
    columns,
    state: {
      sorting,
      columnFilters,
      pagination,
    },
    enableMultiSort: true,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  // Role counts for stats
  const roleStats = {
    admins: users.filter(u => u.role === "admin" || u.role === "super_admin").length,
    mechanics: users.filter(u => u.role === "mechanic").length,
    serviceAgents: users.filter(u => u.role === "service_agent").length,
    finance: users.filter(u => u.role === "finance_officer").length,
  };

  return (
    <div className="space-y-6">
      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard 
          title="Total Staff" 
          value={users.length} 
          icon={<Users className="h-4 w-4" />}
          description="All active staff members"
        />
        <StatsCard 
          title="Admins" 
          value={roleStats.admins} 
          icon={<Shield className="h-4 w-4" />}
          description="Admin & super admin users"
        />
        <StatsCard 
          title="Mechanics" 
          value={roleStats.mechanics} 
          icon={<User className="h-4 w-4" />}
          description="Service technicians"
        />
        <StatsCard 
          title="Service Agents" 
          value={roleStats.serviceAgents} 
          icon={<UserCog className="h-4 w-4" />}
          description="Customer-facing agents"
        />
      </div>
      
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-bold flex items-center">
                <Users className="mr-2 h-5 w-5 text-primary" />
                Staff Directory
              </CardTitle>
              <CardDescription>
                Manage your staff accounts and permissions
              </CardDescription>
            </div>
            <Link 
              href="/admin/users/create" 
              className={buttonVariants({
                variant: "default",
                className: "gap-2"
              })}
            >
              <UserPlus className="h-4 w-4" />
              Add Staff User
            </Link>
          </div>
          
          <Separator className="my-4" />
          
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 w-full"
              />
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Select
                value={selectedRole}
                onValueChange={(value) => setSelectedRole(value)}
              >
                <SelectTrigger className="w-[180px] gap-2">
                  <Filter className="h-4 w-4" />
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Staff</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="service_agent">Service Agent</SelectItem>
                  <SelectItem value="mechanic">Mechanic</SelectItem>
                  <SelectItem value="finance_officer">Finance Officer</SelectItem>
                </SelectContent>
              </Select>
              
              <Select
                value={table.getState().pagination.pageSize.toString()}
                onValueChange={(value) => {
                  table.setPageSize(Number(value));
                }}
              >
                <SelectTrigger className="w-[110px]">
                  <SelectValue placeholder="Rows per page" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 rows</SelectItem>
                  <SelectItem value="10">10 rows</SelectItem>
                  <SelectItem value="20">20 rows</SelectItem>
                  <SelectItem value="50">50 rows</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-4 w-[200px]" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    {table.getHeaderGroups().map((headerGroup) => (
                      <TableRow key={headerGroup.id} className="bg-muted/50 hover:bg-muted/50">
                        {headerGroup.headers.map((header) => (
                          <TableHead key={header.id} className="font-medium">
                            {header.isPlaceholder
                              ? null
                              : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                          </TableHead>
                        ))}
                      </TableRow>
                    ))}
                  </TableHeader>
                  <TableBody>
                    {table.getRowModel().rows.length ? (
                      table.getRowModel().rows.map((row) => (
                        <TableRow 
                          key={row.id}
                          className="cursor-pointer"
                          onClick={() => router.push(`/admin/users/${row.original.userId}`)}
                        >
                          {row.getVisibleCells().map((cell) => (
                            <TableCell key={cell.id}>
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={columns.length} className="h-24 text-center">
                          <div className="flex flex-col items-center justify-center text-muted-foreground">
                            <Info className="h-10 w-10 mb-2" />
                            <p className="text-sm">No staff users found that match your filters.</p>
                            <p className="text-xs mt-1">Try changing your search criteria.</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
        
        <CardFooter className="flex items-center justify-between border-t p-4">
          <div className="text-sm text-muted-foreground">
            Showing {table.getFilteredRowModel().rows.length > 0 
              ? `${table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}-${Math.min(
                  (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                  table.getFilteredRowModel().rows.length
                )}` 
              : "0"} of {table.getFilteredRowModel().rows.length} staff member{table.getFilteredRowModel().rows.length !== 1 && "s"}
          </div>
          
          <div className="flex items-center space-x-6 lg:space-x-8">
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                className="h-8 w-8 p-0"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Go to previous page</span>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex w-[100px] items-center justify-center text-sm font-medium">
                Page {table.getState().pagination.pageIndex + 1} of{" "}
                {table.getPageCount()}
              </div>
              <Button
                variant="outline"
                className="h-8 w-8 p-0"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Go to next page</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}