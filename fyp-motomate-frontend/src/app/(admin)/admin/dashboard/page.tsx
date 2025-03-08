// app/admin/dashboard/page.tsx

import { buttonVariants } from "@/components/ui/button";
import LogoutButton from "@/components/User/LogoutBtn";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function AdminDashboardPage() {
  return (
    <>
    <LogoutButton/>
    <Link href={'/admin/users/create'} className={cn(buttonVariants())}>Create Admins</Link>
    </>
  )
}
