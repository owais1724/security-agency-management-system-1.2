"use client"

import { AgencySidebar } from "@/components/agency/AgencySidebar"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"

export default function AgencyLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const pathname = usePathname()
    const isLoginPage = pathname?.split('/').some(segment => segment.toLowerCase() === 'login') || pathname?.includes('staff-login')

    if (isLoginPage) {
        return <>{children}</>
    }

    return (
        <div className="flex h-screen bg-slate-50 font-outfit">
            <AgencySidebar />
            <main className="flex-1 overflow-y-auto">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={pathname}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        className="p-10"
                    >
                        {children}
                    </motion.div>
                </AnimatePresence>
            </main>
        </div>
    )
}
