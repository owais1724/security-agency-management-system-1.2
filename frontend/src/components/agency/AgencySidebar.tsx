"use client"

import Link from "next/link"
import { useParams, usePathname } from "next/navigation"
import {
    BarChart3,
    Building,
    Briefcase,
    Users,
    Key,
    Clock,
    CalendarDays,
    Wallet,
    LogOut,
    ShieldCheck
} from "lucide-react"
import { cn } from "@/lib/utils"

import { useAuthStore } from "@/store/authStore"
import { useEffect, useState } from "react"
import api from "@/lib/api"

export function AgencySidebar() {
    const { agencySlug } = useParams()
    const pathname = usePathname()
    const { user, login, logout } = useAuthStore()
    const [loading, setLoading] = useState(!user)

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await api.get('/auth/me')
                login(response.data)
            } catch (error) {
                console.error("Failed to fetch profile", error)
            } finally {
                setLoading(false)
            }
        }

        if (!user) {
            fetchProfile()
        } else {
            setLoading(false)
        }
    }, [user, login, logout])

    const roleName = typeof user?.role === 'string' ? user.role : user?.role?.name;
    const isStaff = roleName && !roleName.toLowerCase().includes('admin');

    const allNavItems = [
        {
            name: "Dashboard",
            href: isStaff ? `/${agencySlug}/staff/dashboard` : `/${agencySlug}/dashboard`,
            icon: BarChart3
        },
        {
            name: "Clients",
            href: `/${agencySlug}/clients`,
            icon: Building,
            permissions: ["view_clients", "create_client"]
        },
        {
            name: "Projects",
            href: `/${agencySlug}/projects`,
            icon: Briefcase,
            permissions: ["view_projects", "create_project"]
        },
        {
            name: "Personnel",
            href: `/${agencySlug}/personnel`,
            icon: Users,
            permissions: ["view_personnel", "create_personnel"]
        },
        {
            name: "Roles & Matrix",
            href: `/${agencySlug}/rbac`,
            icon: Key,
            permissions: ["manage_roles"]
        },
        {
            name: "Attendance",
            href: `/${agencySlug}/attendance`,
            icon: Clock,
            permissions: ["view_attendance", "mark_attendance"]
        },
        {
            name: "Leaves",
            href: `/${agencySlug}/leaves`,
            icon: CalendarDays,
            permissions: ["view_leaves", "apply_leave", "approve_leave"]
        },
        {
            name: "Payroll",
            href: `/${agencySlug}/payroll`,
            icon: Wallet,
            permissions: ["view_payroll", "manage_payroll"]
        },
        {
            name: "Audit Logs",
            href: `/${agencySlug}/audit-logs`,
            icon: ShieldCheck,
            permissions: ["view_audit_logs"]
        },
    ]

    const navItems = allNavItems.filter(item => {
        if (roleName?.toLowerCase().includes('admin')) return true
        if (!item.permissions || item.permissions.length === 0) return true
        return item.permissions.some(p => user?.permissions?.includes(p))
    })

    if (loading) {
        return (
            <div className="flex h-screen w-64 flex-col bg-[#0d5c56] border-r border-white/5 animate-pulse">
                <div className="h-16 border-b border-white/5" />
                <div className="flex-1 py-6 px-4 space-y-4">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="h-10 bg-white/5 rounded-xl" />
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="flex h-screen w-72 flex-col bg-[#0d5c56] text-white border-r border-white/5 shadow-2xl relative z-20 font-outfit">
            {/* Logo Section */}
            <div className="flex h-20 items-center px-6 border-b border-white/5 gap-3">
                <div className="h-10 w-10 bg-[#14B8A6] rounded-xl flex items-center justify-center shadow-lg shadow-teal-500/20">
                    <ShieldCheck className="h-6 w-6 text-white" />
                </div>
                <div>
                    <h1 className="text-lg font-black tracking-[0.1em] text-white leading-none">SENTINEL</h1>
                    <span className="text-[10px] text-teal-300/60 font-black uppercase tracking-widest mt-1 block">Security SaaS</span>
                </div>
            </div>

            {/* Navigation */}
            <div className="flex-1 overflow-y-auto pt-8 px-4 space-y-8">
                <div>
                    <p className="px-3 mb-4 text-[10px] font-black text-teal-200/40 uppercase tracking-[0.2em]">Management</p>
                    <nav className="space-y-1.5">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={cn(
                                        "group flex items-center rounded-xl px-4 py-3 text-sm font-bold transition-all duration-300 relative overflow-hidden",
                                        isActive
                                            ? "bg-[#14B8A6] text-white shadow-xl shadow-teal-500/20"
                                            : "text-teal-100/60 hover:text-white hover:bg-white/5"
                                    )}
                                >
                                    <item.icon className={cn(
                                        "mr-3 h-5 w-5 transition-transform duration-300 group-hover:scale-110",
                                        isActive ? "text-white" : "text-teal-200/40 group-hover:text-white"
                                    )} />
                                    {item.name}
                                    {isActive && (
                                        <div className="absolute right-0 top-0 bottom-0 w-1 bg-white rounded-l-full shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
                                    )}
                                </Link>
                            )
                        })}
                    </nav>
                </div>
            </div>

            {/* User Profile Section */}
            <div className="p-4 bg-white/[0.03] border-t border-white/5 m-4 rounded-2xl">
                <div className="mb-4 flex items-center gap-3 px-2">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-[#14B8A6] to-emerald-400 flex items-center justify-center text-sm font-black shadow-lg shadow-teal-500/10 border-2 border-white/10 uppercase">
                        {user?.fullName?.charAt(0) || "U"}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-black text-white truncate leading-tight">{user?.fullName}</p>
                        <p className="text-[10px] text-teal-300/60 font-black truncate tracking-wide mt-0.5">{roleName?.toUpperCase()}</p>
                    </div>
                </div>

                <button
                    onClick={async () => {
                        await api.post('/auth/logout')
                        // Clear frontend cookie so middleware blocks access
                        document.cookie = 'access_token=; path=/; max-age=0; SameSite=Lax'
                        logout()
                        window.location.href = isStaff ? `/${agencySlug}/staff/login` : `/${agencySlug}/login`
                    }}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-500/10 px-3 py-2.5 text-xs font-black text-red-400 hover:bg-red-500 hover:text-white transition-all duration-300 group"
                >
                    <LogOut className="h-4 w-4 transform group-hover:-translate-x-1 transition-transform" />
                    Sign Out
                </button>
            </div>
        </div>
    )
}
