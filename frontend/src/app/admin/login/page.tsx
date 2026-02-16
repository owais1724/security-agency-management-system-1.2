
"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useRouter } from "next/navigation"
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
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"
import { Lock, Mail, ChevronRight, Loader2, ShieldCheck, Cpu } from "lucide-react"
import { useAuthStore } from "@/store/authStore"
import api from "@/lib/api"

const formSchema = z.object({
    email: z.string().email("Please enter a valid administrative email"),
    password: z.string().min(6, "Security token must be at least 6 characters"),
})

export default function LoginPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const login = useAuthStore(state => state.login)
    const logout = useAuthStore(state => state.logout)

    useEffect(() => {
        // Clear session when entering login page to ensure fresh start
        logout()
    }, [logout])

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: { email: "", password: "" },
    })

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setLoading(true)
        toast.dismiss()

        // Clear any old headers
        delete api.defaults.headers.common['Authorization']

        try {
            const response = await api.post("/auth/login", values)
            const { access_token } = response.data

            localStorage.setItem('token', access_token)
            api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`

            const profileResponse = await api.get("/auth/me", {
                headers: { Authorization: `Bearer ${access_token}` }
            })
            const user = profileResponse.data

            if (user.role !== 'Super Admin') {
                toast.error("Access denied. Restricted to Super Administrators.")
                localStorage.removeItem('token')
                delete api.defaults.headers.common['Authorization']
                setLoading(false)
                return
            }

            login(user, access_token)
            toast.success("Welcome, Administrator")
            router.push("/admin/dashboard")
        } catch (error: any) {
            console.error('[Admin Login Error]', error)
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
                        <ShieldCheck className="w-8 h-8 text-[#0F766E]" />
                    </div>
                    <h1 className="text-2xl font-black text-white tracking-[0.2em] uppercase">SAMS <span className="text-teal-300">ADMIN</span></h1>
                </div>

                <Card className="border-none bg-white rounded-[3rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.4)] overflow-hidden relative" suppressHydrationWarning>
                    <CardContent className="p-10 md:p-14" suppressHydrationWarning>
                        <div className="mb-10 text-center">
                            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Access Control</h2>
                            <p className="text-teal-600 font-bold text-[10px] mt-2 uppercase tracking-[0.3em] bg-teal-50 py-1 px-4 rounded-full inline-block italic">MASTER_NODE // SECURE</p>
                        </div>

                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                <FormField
                                    control={form.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem className="space-y-2">
                                            <FormLabel className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Administrator ID</FormLabel>
                                            <FormControl>
                                                <div className="relative group">
                                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-teal-600 transition-colors" />
                                                    <Input
                                                        suppressHydrationWarning
                                                        placeholder="admin@sams.io"
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
                                            <FormLabel className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Master Key</FormLabel>
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
                                            <span>Authorizing...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>SECURE ENTRY</span>
                                            <ChevronRight className="w-4 h-4 ml-1" />
                                        </>
                                    )}
                                </Button>
                            </form>
                        </Form>
                    </CardContent>
                </Card>

                {/* Secure Marker */}
                <div className="mt-12 text-center">
                    <p className="text-[10px] text-white/30 font-bold uppercase tracking-[0.4em]">
                        SAMS GLOBAL NODE // SECURE
                    </p>
                </div>
            </motion.div>
        </div>
    )
}
