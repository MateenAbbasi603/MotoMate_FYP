"use client"

import * as React from "react"
import {
    AudioWaveform,
    Banknote,
    BookOpen,
    Bot,
    Car,
    Command,
    DollarSign,
    Frame,
    GalleryVerticalEnd,
    List,
    Map,
    PersonStanding,
    PieChart,
    Settings2,
    SquareTerminal,
    User2Icon,
    WrenchIcon,
} from "lucide-react"

import { NavMain } from "@/components/layout/AdminSideBar/nav-main"
import { NavProjects } from "@/components/layout/AdminSideBar/nav-projects"
import { NavUser } from "@/components/layout/AdminSideBar/nav-user"
import { TeamSwitcher } from "@/components/layout/AdminSideBar/team-switcher"
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarRail,
} from "@/components/ui/sidebar"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

// This is sample data.
const data = {
    user: {
        name: "shadcn",
        email: "m@example.com",
        avatar: "/avatars/shadcn.jpg",
    },

    navMain: [
        {
            title: "Dashboard",
            url: "/admin/dasboard",
            icon: User2Icon,
            isActive: true,

        },
        {
            title: "Staff",
            url: "#",
            icon: User2Icon,
            isActive: true,
            items: [
                {
                    title: "Add New Staff",
                    url: "/admin/users/create",
                },
                {
                    title: "View Staff",
                    url: "/admin/users",
                },

            ],
        },
        {
            title: "Mechanics",
            url: "#",
            icon: PersonStanding,
            items: [
                {
                    title: "Active Mechanics",
                    url: "/admin/view-mechanics?tab=active",
                },
                {
                    title: "Performance",
                    url: "/admin/view-mechanics?tab=performance",
                },
                {
                    title: "Scheduled Services",
                    url: "/admin/view-mechanics?tab=scheduled",
                },
            ],
        },
        {
            title: "Services",
            url: "#",
            icon: Car,
            items: [
                {
                    title: "View Services",
                    url: "/admin/services",
                },

                {
                    title: "Add Services",
                    url: "/admin/services/new",
                },

            ],
        },
        {
            title: "Orders",
            url: "#",
            icon: List,
            items: [
                {
                    title: "Create Walk-In Order",
                    url: "/admin/orders/create",
                },
                {
                    title: "View Orders",
                    url: "/admin/orders",
                },

            ],
        },

        {
            title: "Finance",
            url: "#",
            icon: Banknote,
            items: [
                {
                    title: "View Invoices",
                    url: "/admin/view-finance?tab=invoices",
                },
                {
                    title: "View Payments",
                    url: "/admin/view-finance?tab=payments",
                },
                {
                    title: "View Reports",
                    url: "/admin/view-finance?tab=reports",
                },

            ],
        },

        {
            title: "Inventory",
            url: "#",
            icon: WrenchIcon,
            items: [
                {
                    title: "Manage Inventory",
                    url: "/admin/manage-inventory",
                },


            ],
        },
    ],
    projects: [
        {
            name: "Design Engineering",
            url: "#",
            icon: Frame,
        },
        {
            name: "Sales & Marketing",
            url: "#",
            icon: PieChart,
        },
        {
            name: "Travel",
            url: "#",
            icon: Map,
        },
    ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    return (
        <Sidebar collapsible="icon" {...props}>

            <SidebarContent>
                <NavMain items={data.navMain} />

            </SidebarContent>
            <SidebarFooter>
                <NavUser user={data.user} />
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    )
}
