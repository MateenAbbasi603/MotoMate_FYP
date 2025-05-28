"use client"

import React, { ReactNode, useEffect, useState } from "react"
import { RoleBasedSidebar } from "@/components/layout/AdminSideBar/role-based-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import AuthGuard from "../../../../AuthGuard"
import authService from "../../../../services/authService"
import { Loader2 } from "lucide-react"
import { usePathname } from "next/navigation"
import Link from "next/link"

export default function AdminLayout({ children }: { children: ReactNode }): React.ReactElement {
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const pathname = usePathname();
  const pathSegments = pathname.split('/').filter(segment => segment !== '' && segment !== '(admin)' && segment !== 'admin');

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setIsLoading(true)
        const userData = await authService.getCurrentUser()
        
        // Process user data to include an avatar property derived from imgUrl
        const userWithAvatar = {
          ...userData,
          avatar: userData.imgUrl || '', // Use imgUrl as avatar, fallback to empty string
          role: userData.role // Ensure role is included
        };

        setUser(userWithAvatar)
      } catch (error) {
        console.error("Error fetching user:", error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchUser()
  }, [])

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <AuthGuard allowedRoles={["super_admin", "admin", "service_agent", "mechanic", "finance_officer"]}>
      <SidebarProvider>
        {user && <RoleBasedSidebar user={user} />}
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-2 h-4" />
              <Breadcrumb>
                <BreadcrumbList>
                  {pathSegments.map((segment, index) => {
                    const href = '/' + pathSegments.slice(0, index + 1).join('/');
                    const isLast = index === pathSegments.length - 1;
                    const readableSegment = segment.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

                    return (
                      <React.Fragment key={href}>
                        <BreadcrumbItem>
                          {isLast ? (
                            <BreadcrumbPage>{readableSegment}</BreadcrumbPage>
                          ) : (
                            <BreadcrumbLink asChild>
                              <Link href={href}>{readableSegment}</Link>
                            </BreadcrumbLink>
                          )}
                        </BreadcrumbItem>
                        {!isLast && <BreadcrumbSeparator />}
                      </React.Fragment>
                    );
                  })}
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </header>
          <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </AuthGuard>
  )
}
