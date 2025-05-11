"use client";

import {
    
    Bell,
    ChevronsUpDown,
    CreditCard,
   
    User,
} from "lucide-react";

import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "../ui/button";
import LogoutButton from "./LogoutBtn";
import Link from "next/link";

export function UserInfo({
    user,
}: {
    user: {
        name: string;
        email: string;
        avatar: string;
        role?: string;
    }
}) {
    // Determine profile link based on user role
    const getProfileLink = () => {
        // Check if user and role exist
        if (!user || !user.role) return "/profile";
        
        // For admin roles (admin, super_admin), use admin/profile
        if (user.role.includes('admin')) {
            return "/admin/profile";
        }
        if (user.role.includes('mechanic')) {
            return "/admin/mechanic/profile";
        }
        if (user.role.includes('service_agent')) {
            return "/admin/service-agent/profile";
        }
        if (user.role.includes('finance_officer')) {
            return "/admin/finances/profile";
        }

        
      
            
            
        // For customer and any other roles, use /profile
        return "/profile";
    };

    const profileLink = getProfileLink();

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    size="lg"
                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground bg-transparent text-black dark:text-white"
                >
                    <Avatar className="h-8 w-8 rounded-lg">
                        <AvatarImage src={user?.avatar} alt={user?.name || "User"} />
                        <AvatarFallback className="rounded-lg">
                            {user?.name ? user.name.charAt(0) : "U"}
                        </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                        <span className="truncate font-semibold">{user?.name || "User"}</span>
                        <span className="truncate text-xs">{user?.email || "user@example.com"}</span>
                    </div>
                    <ChevronsUpDown className="ml-auto size-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                align="end"
                sideOffset={4}
            >
                <DropdownMenuLabel className="p-0 font-normal">
                    <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                        <Avatar className="h-8 w-8 rounded-lg">
                            <AvatarImage src={user?.avatar} alt={user?.name || "User"} />
                            <AvatarFallback className="rounded-lg">
                                {user?.name ? user.name.charAt(0) : "U"}
                            </AvatarFallback>
                        </Avatar>
                        <div className="grid flex-1 text-left text-sm leading-tight">
                            <span className="truncate font-semibold">{user?.name || "User"}</span>
                            <span className="truncate text-xs">{user?.email || "user@example.com"}</span>
                        </div>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                <DropdownMenuGroup>
                    <Link href={profileLink}>
                        <DropdownMenuItem className="cursor-pointer">
                            <User className="mr-2 h-4 w-4" />
                            Profile
                        </DropdownMenuItem>
                    </Link>
                    
                    
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer">
                    <LogoutButton />
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}