
"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useRouter, useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import api from "@/lib/api"
import { toast } from "sonner"
import { useAuthStore } from "@/store/authStore"
import { motion } from "framer-motion"
import { Lock, Mail, ChevronRight, Loader2, Building2, Activity } from "lucide-react"

const formSchema = z.object({
    email: z.string().email("Please enter a valid administrative email"),
    password: z.string().min(6, "Password must be at least 6 characters"),
})

export default function AgencyAdminLogin() {
    const router = useRouter()
    const { agencySlug } = useParams()
    const [loading, setLoading] = useState(false)
    const login = useAuthStore(state => state.login)
    const logout = useAuthStore(state => state.logout)

    const isAuthenticated = useAuthStore(state => state.isAuthenticated)

    useEffect(() => {
        if (isAuthenticated) {
            router.push(`/${agencySlug}/dashboard`)
        }
    }, [isAuthenticated, agencySlug, router])

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: { email: "", password: "" },
    })

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setLoading(true)
        toast.dismiss()

        // Clear any old headers from the instance
        delete api.defaults.headers.common['Authorization']

        try {
            const response = await api.post("/auth/login", values)
            const { access_token: token } = response.data

            // Set token in storage
            localStorage.setItem('token', token)

            // Set for subsequent global use
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`

            // Explicitly pass token to avoid race conditions with interceptors
            const meResponse = await api.get("/auth/me", {
                headers: { Authorization: `Bearer ${token}` }
            })
            const user = meResponse.data

            const currentSlug = Array.isArray(agencySlug) ? agencySlug[0] : agencySlug
            if (user.agencySlug !== currentSlug && user.role !== 'Super Admin') {
                toast.error(`Portal Isolation Active: Your credentials are authorized for @${user.agencySlug?.toUpperCase()} only.`)
                localStorage.removeItem('token')
                delete api.defaults.headers.common['Authorization']
                setLoading(false)
                return
            }

            if (user.role !== 'Agency Admin' && user.role !== 'Super Admin') {
                toast.error("Standard staff must use the Personnel Portal.")
                localStorage.removeItem('token')
                delete api.defaults.headers.common['Authorization']
                setLoading(false)
                return
            }

            login(user, token)
            toast.success("Identity verified. Welcome back.")
            router.push(`/${agencySlug}/dashboard`)
        } catch (error: any) {
            console.error('[Login Error]', error)
            const message = error.response?.data?.message || error.message || "Authentication failed"
            toast.error(`Access Denied: ${message}`)
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#0F766E] font-outfit p-4 relative overflow-hidden selection:bg-teal-500/30">
            {/* Soft Organic Teal Shapes */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-[10%] left-[10%] w-[400px] h-[400px] bg-white/5 blur-[100px] rounded-full" />
                <div className="absolute bottom-[10%] right-[10%] w-[300px] h-[300px] bg-teal-400/10 blur-[80px] rounded-full" />
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6 }}
                className="w-full max-w-[460px] z-10"
            >
                {/* Logo Section */}
                <div className="flex flex-col items-center mb-10">
                    <div className="w-16 h-16 bg-white shadow-2xl rounded-2xl flex items-center justify-center mb-5 ring-4 ring-white/10">
                        <Building2 className="w-8 h-8 text-[#0F766E]" />
                    </div>
                    <h1 className="text-2xl font-black text-white tracking-[0.2em] uppercase">SAMS <span className="text-teal-300">PORTAL</span></h1>
                </div>

                <Card className="border-none bg-white rounded-[3rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.4)] overflow-hidden relative" suppressHydrationWarning>
                    <CardContent className="p-10 md:p-14" suppressHydrationWarning>
                        <div className="mb-10 text-center">
                            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Welcome</h2>
                            <p className="text-teal-600 font-bold text-[10px] mt-2 uppercase tracking-[0.3em] bg-teal-50 py-1 px-4 rounded-full inline-block italic">@{agencySlug}</p>
                        </div>

                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                <FormField
                                    control={form.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem className="space-y-2">
                                            <FormLabel className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Official ID</FormLabel>
                                            <FormControl>
                                                <div className="relative group">
                                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-teal-600 transition-colors" />
                                                    <Input
                                                        suppressHydrationWarning
                                                        placeholder="admin@agency.com"
                                                        className="pl-12 h-14 bg-slate-50 border-transparent text-slate-900 placeholder:text-slate-300 rounded-2xl focus:bg-white focus:border-teal-100 transition-all font-semibold italic"
                                                        {...field}
                                                    />
                                                </div>
                                            </FormControl>
                                            <FormMessage className="text-[10px] text-red-500 font-bold" />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="password"
                                    render={({ field }) => (
                                        <FormItem className="space-y-2">
                                            <FormLabel className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Access Key</FormLabel>
                                            <FormControl>
                                                <div className="relative group">
                                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-teal-600 transition-colors" />
                                                    <Input
                                                        suppressHydrationWarning
                                                        type="password"
                                                        placeholder="••••••••"
                                                        className="pl-12 h-14 bg-slate-50 border-transparent text-slate-900 placeholder:text-slate-300 rounded-2xl focus:bg-white focus:border-teal-100 transition-all font-semibold"
                                                        {...field}
                                                    />
                                                </div>
                                            </FormControl>
                                            <FormMessage className="text-[10px] text-red-500 font-bold" />
                                        </FormItem>
                                    )}
                                />

                                <Button
                                    suppressHydrationWarning
                                    type="submit"
                                    className="w-full h-14 bg-[#14B8A6] hover:bg-[#0D9488] text-white font-black rounded-2xl shadow-xl shadow-teal-500/20 transition-all active:scale-[0.98] flex items-center justify-center space-x-2 text-sm mt-4 uppercase tracking-widest"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            <span>Authenticating...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>SECURE ENTRY</span>
                                            <ChevronRight className="w-4 h-4" />
                                        </>
                                    )}
                                </Button>
                            </form>
                        </Form>
                    </CardContent>
                </Card>

                {/* Footer Section */}
                <div className="mt-12 text-center">
                    <p className="text-[10px] text-white/30 font-bold uppercase tracking-[0.4em]">
                        Agency Node: {agencySlug} // SAMS_v3.0 SECURE
                    </p>
                </div>
            </motion.div>
        </div>
    )
}
