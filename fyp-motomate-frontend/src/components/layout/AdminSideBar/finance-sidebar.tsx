"use client"

import * as React from "react"
import {
    LayoutDashboard,
    CreditCard,
    File,
    PieChart,
    DollarSign,
    Receipt,
} from "lucide-react"

import { NavMain } from "@/components/layout/AdminSideBar/nav-main"
import { NavUser } from "@/components/layout/AdminSideBar/nav-user"
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarRail,
} from "@/components/ui/sidebar"

const financeNavItems = [
    {
        title: "Dashboard",
        url: "/finance/dashboard",
        icon: LayoutDashboard,
        isActive: true,
    },
    {
        title: "Transactions",
        url: "/finance/transactions",
        icon: CreditCard,
    },
    {
        title: "Invoices",
        url: "/finance/invoices",
        icon: File,
    },
    {
        title: "Reports",
        url: "/finance/reports",
        icon: PieChart,
    },
    {
        title: "Payments",
        url: "/finance/payments",
        icon: DollarSign,
    },
    {
        title: "Receipts",
        url: "/finance/receipts",
        icon: Receipt,
    },
]

export function FinanceSidebar({ user, ...props }: React.ComponentProps<typeof Sidebar> & { user: any }) {
    return (
        <Sidebar collapsible="icon" {...props}>
            <SidebarContent>
                <NavMain items={financeNavItems} />
            </SidebarContent>
            <SidebarFooter>
                <NavUser user={user} />
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    )
} 