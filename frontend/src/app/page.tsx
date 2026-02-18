"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useRouter } from "next/navigation"
import { useState } from "react"
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
import { ShieldCheck, Lock, Mail, ChevronRight, Loader2, Globe } from "lucide-react"
import { motion } from "framer-motion"
import { useAuthStore } from "@/store/authStore"

const formSchema = z.object({
  email: z.string().email("Authorized email required"),
  password: z.string().min(6, "Security token must be at least 6 characters"),
})

export default function RootLoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const login = useAuthStore(state => state.login)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: "", password: "" },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true)
    toast.dismiss()
    try {
      const response = await api.post("/auth/login", values)
      const user = response.data

      const roleName = typeof user.role === 'string' ? user.role : user.role?.name;

      // RESTRICTION: Root login is EXCLUSIVELY for Super Admins
      if (roleName !== 'Super Admin') {
        toast.error("Restricted Access: Agency personnel must use their dedicated organization portals.")
        // Clear cookie if wrong role
        await api.post("/auth/logout")
        setLoading(false)
        return
      }

      login(user)
      toast.success(`Welcome, Administrator. Authorization successful.`)
      router.push("/admin/dashboard")

    } catch (error: any) {
      console.error(error)
      const message = error.response?.data?.message || error.message || "Access Denied"
      toast.error(`Verification Failed: ${message}`)
    } finally {
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
          <h1 className="text-2xl font-black text-white tracking-[0.2em] uppercase">SAMS <span className="text-teal-300">PORTAL</span></h1>
        </div>

        <Card className="border-none bg-white rounded-[3rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.4)] overflow-hidden relative" suppressHydrationWarning>
          <CardContent className="p-10 md:p-14" suppressHydrationWarning>
            <div className="mb-10 text-center">
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">Identity Verification</h2>
              <p className="text-teal-600 font-bold text-[10px] mt-2 uppercase tracking-[0.3em] bg-teal-50 py-1 px-4 rounded-full inline-block italic">Global Security Ecosystem</p>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Identification</FormLabel>
                      <FormControl>
                        <div className="relative group">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-teal-600 transition-colors" />
                          <Input
                            placeholder="operator@sams-platform.com"
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
                      <FormLabel className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Security Key</FormLabel>
                      <FormControl>
                        <div className="relative group">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-teal-600 transition-colors" />
                          <Input
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
                  type="submit"
                  className="w-full h-14 bg-[#14B8A6] hover:bg-[#0D9488] text-white font-black rounded-2xl shadow-xl shadow-teal-500/20 transition-all active:scale-[0.98] flex items-center justify-center space-x-2 text-base mt-4 uppercase tracking-widest"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <>
                      <span>Secure Authorization</span>
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Global Stats Footer */}
        <div className="mt-12 text-center">
          <p className="text-[10px] text-white/30 font-bold uppercase tracking-[0.4em]">
            Enterprise Unified Access // SAMS SECURE
          </p>
        </div>
      </motion.div>
    </div>
  )
}
