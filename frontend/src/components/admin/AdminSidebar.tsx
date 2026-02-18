"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Shield, LogOut, LayoutDashboard } from "lucide-react"
import { cn } from "@/lib/utils"
import api from "@/lib/api"
import { useAuthStore } from "@/store/authStore"
import { useEffect, useState } from "react"

const navItems = [
    { name: "Platform Control", href: "/admin/dashboard", icon: LayoutDashboard },
]

export function AdminSidebar() {
    const pathname = usePathname()
    const { logout, login, user } = useAuthStore()
    const [loading, setLoading] = useState(!user)

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await api.get('/auth/me')
                login(response.data)
            } catch (error) {
                console.error("Admin session verification failed", error)
            } finally {
                setLoading(false)
            }
        }

        if (!user) {
            fetchProfile()
        } else {
            setLoading(false)
        }
    }, [user, login])

    if (loading) {
        return <div className="w-64 bg-[#0f172a] animate-pulse h-screen" />
    }

    return (
        <div className="flex h-screen w-64 flex-col bg-[#0f172a] text-slate-300 border-r border-slate-800">
            <div className="flex h-16 items-center px-6 border-b border-slate-800">
                <h1 className="text-xl font-bold text-white tracking-widest uppercase">SAMS Admin</h1>
            </div>
            <div className="flex-1 overflow-y-auto py-6 px-3">
                <nav className="space-y-1">
                    {navItems.map((item) => (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={cn(
                                "flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-all",
                                pathname === item.href
                                    ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                                    : "hover:bg-slate-800 hover:text-white"
                            )}
                        >
                            <item.icon className="mr-3 h-5 w-5" />
                            {item.name}
                        </Link>
                    ))}
                </nav>
            </div>
            <div className="border-t border-slate-800 p-4">
                <div className="mb-4 flex items-center gap-3 px-2">
                    <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white">
                        {user?.fullName?.charAt(0) || "A"}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-white truncate">{user?.fullName || 'Super Admin'}</p>
                        <p className="text-[10px] text-slate-500 truncate">SYSTEM_ROOT</p>
                    </div>
                </div>
                <button
                    onClick={async () => {
                        try {
                            await api.post('/auth/logout')
                        } catch (e) {
                            console.error("Logout failed", e)
                        }
                        logout()
                        window.location.href = '/admin/login'
                    }}
                    className="flex w-full items-center rounded-lg px-3 py-2 text-sm font-medium text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-colors"
                >
                    <LogOut className="mr-3 h-5 w-5" />
                    Sign Out
                </button>
            </div>
        </div>
    )
}
