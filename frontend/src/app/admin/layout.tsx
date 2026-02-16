"use client"

import { AdminSidebar } from "@/components/admin/AdminSidebar"
import { usePathname } from "next/navigation"

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const pathname = usePathname()
    const isLoginPage = pathname === "/admin/login"

    if (isLoginPage) {
        return <>{children}</>
    }

    return (
        <div className="flex h-screen bg-gray-50">
            <AdminSidebar />
            <main className="flex-1 overflow-y-auto p-8">
                {children}
            </main>
        </div>
    )
}
