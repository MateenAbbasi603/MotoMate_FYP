"use client"

import * as React from "react"
import {
    LayoutDashboard,
    Calendar,
    ClipboardList,
    FileText,
    MessageSquare,
    Wrench,
} from "lucide-react"

import { NavMain } from "@/components/layout/AdminSideBar/nav-main"
import { NavUser } from "@/components/layout/AdminSideBar/nav-user"
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarRail,
} from "@/components/ui/sidebar"

const mechanicNavItems = [
    {
        title: "Dashboard",
        url: "/admin/mechanic",
        icon: LayoutDashboard,
        isActive: true,
    },
    {
        title: "Appointments",
        url: "/admin/mechanic/appointments",
        icon: Calendar,
    },
    {
        title: "Services",
        url: "/admin/mechanic/services",
        icon: Wrench,
    },
   
  
]

export function MechanicSidebar({ user, ...props }: React.ComponentProps<typeof Sidebar> & { user: any }) {
    return (
        <Sidebar collapsible="icon" {...props}>
            <SidebarContent>
                <NavMain items={mechanicNavItems} />
            </SidebarContent>
            <SidebarFooter>
                <NavUser user={user} />
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    )
} 