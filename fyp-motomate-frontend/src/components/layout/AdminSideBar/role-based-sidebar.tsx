"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import { AppSidebar } from "./app-sidebar"
import { MechanicSidebar } from "./mechanic-sidebar"
import { FinanceSidebar } from "./finance-sidebar"

interface RoleBasedSidebarProps {
    user: any
}

export function RoleBasedSidebar({ user }: RoleBasedSidebarProps) {
    // Determine which sidebar to show based on the user's role
    if (!user) {
        // Optionally return a loading state or null if user is not yet loaded
        return null; 
    }

    switch (user.role) {
        case "super_admin":
        case "admin":
            return <AppSidebar user={user} />;
        case "mechanic":
            return <MechanicSidebar user={user} />;
        case "finance_officer":
            return <FinanceSidebar user={user} />;
        default:
            // Fallback or error handling for un unrecognized role
            console.error("Unrecognized user role:", user.role);
            return <AppSidebar user={user} />; // Default to AppSidebar or show an error
    }
} 