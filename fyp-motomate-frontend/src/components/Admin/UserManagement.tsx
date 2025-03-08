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
import { User, ArrowUpDown, MoreHorizontal, Plus, Search, Trash, Edit, UserCog } from "lucide-react";

import { Button } from "@/components/ui/button";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";

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
}

// Role badge component
const RoleBadge = ({ role }: { role: string }) => {
  const getBadgeStyles = (role: string) => {
    switch (role) {
      case "super_admin":
        return "bg-red-100 text-red-800 hover:bg-red-100";
      case "admin":
        return "bg-blue-100 text-blue-800 hover:bg-blue-100";
      case "service_agent":
        return "bg-green-100 text-green-800 hover:bg-green-100";
      case "mechanic":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100";
      case "finance_officer":
        return "bg-purple-100 text-purple-800 hover:bg-purple-100";
      case "customer":
        return "bg-gray-100 text-gray-800 hover:bg-gray-100";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-100";
    }
  };

  return (
    <Badge className={getBadgeStyles(role)} variant="outline">
      {role.replace('_', ' ')}
    </Badge>
  );
};

export default function UserManagement() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [selectedRole, setSelectedRole] = useState<string>("all");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  
  const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
  const router = useRouter();

  // Define table columns
  const columns: ColumnDef<UserData>[] = [
    {
      accessorKey: "userId",
      header: "ID",
      size: 50,
    },
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => {
        return (
          <div className="flex items-center gap-2">
            <div className="font-medium">{row.getValue("name")}</div>
          </div>
        );
      },
    },
    {
      accessorKey: "username",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="-ml-4"
          >
            Username
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
    },
    {
      accessorKey: "email",
      header: "Email",
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
      header: "Phone",
      cell: ({ row }) => row.getValue("phone") || "-",
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const user = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => router.push(`/admin/users/${user.userId}`)}
              >
                <User className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => router.push(`/admin/users/${user.userId}/edit`)}
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit User
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleDeleteUser(user.userId)}
                className="text-red-600"
              >
                <Trash className="mr-2 h-4 w-4" />
                Delete User
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  // Fetch users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        // Note: In a real implementation, you would call your API
        // const response = await fetch(`${API_URL}/api/admin/users`);
        // const data = await response.json();
        
        // Using mock data for demonstration
        setTimeout(() => {
          const mockUsers: UserData[] = [
            {
              userId: 1,
              username: "superadmin",
              email: "superadmin@example.com",
              role: "super_admin",
              name: "Super Admin",
              phone: "+1234567890",
              address: "Admin Headquarters",
              createdAt: "2023-01-01T00:00:00Z",
            },
            {
              userId: 2,
              username: "admin1",
              email: "admin1@example.com",
              role: "admin",
              name: "Admin User",
              phone: "+1987654321",
              address: "123 Admin St",
                            createdAt: "2023-02-15T00:00Z",
                          },
                        ];
                        setUsers(mockUsers);
                        setLoading(false);
                      }, 1000);
                    } catch (error) {
                      toast.error("Failed to fetch users");
                      setLoading(false);
                    }
                  };
              
                  fetchUsers();
                }, [API_URL]);
              
                // Handle delete user
                const handleDeleteUser = async (userId: number) => {
                  try {
                    await axios.delete(`${API_URL}/api/admin/users/${userId}`);
                    setUsers(users.filter((user) => user.userId !== userId));
                    toast.success("User deleted successfully");
                  } catch (error) {
                    toast.error("Failed to delete user");
                  }
                };
              
                // Table instance
                const table = useReactTable({
                  data: users,
                  columns,
                  state: {
                    sorting,
                    columnFilters,
                  },
                  onSortingChange: setSorting,
                  onColumnFiltersChange: setColumnFilters,
                  getCoreRowModel: getCoreRowModel(),
                  getSortedRowModel: getSortedRowModel(),
                  getFilteredRowModel: getFilteredRowModel(),
                  getPaginationRowModel: getPaginationRowModel(),
                });
              
                return (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h1 className="text-2xl font-bold">User Management</h1>
                      <Button onClick={() => setCreateDialogOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Create User
                      </Button>
                    </div>
                    <div className="flex items-center gap-2 mb-4">
                      <Input
                        placeholder="Search users..."
                        value={table.getState().columnFilters[0]?.value as any}
                        onChange={(e) =>
                          table.getColumn('username')?.setFilterValue(e.target.value)
                        }
                      />
                      <Select
                        value={selectedRole}
                        onValueChange={(value) => setSelectedRole(value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Filter by role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Roles</SelectItem>
                          <SelectItem value="super_admin">Super Admin</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="service_agent">Service Agent</SelectItem>
                          <SelectItem value="mechanic">Mechanic</SelectItem>
                          <SelectItem value="finance_officer">Finance Officer</SelectItem>
                          <SelectItem value="customer">Customer</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Table>
                      <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                          <TableRow key={headerGroup.id}>
                            {headerGroup.headers.map((header) => (
                              <TableHead key={header.id}>
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
                            <TableRow key={row.id}>
                              {row.getVisibleCells().map((cell) => (
                                <TableCell key={cell.id}>
                                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={columns.length} className="text-center">
                              No users found.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          onClick={() => table.previousPage()}
                          disabled={!table.getCanPreviousPage()}
                        >
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => table.nextPage()}
                          disabled={!table.getCanNextPage()}
                        >
                          Next
                        </Button>
                      </div>
                      <span>
                        Page {table.getState().pagination.pageIndex + 1} of{" "}
                        {table.getPageCount()}
                      </span>
                    </div>
                  </div>
                );
              }