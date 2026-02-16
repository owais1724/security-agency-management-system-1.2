"use client"

import { useEffect, useState } from "react"
import api from "@/lib/api"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Plus, Building, Search, Filter, Mail, Briefcase, ChevronRight, Activity } from "lucide-react"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"
import { ClientForm } from "@/components/agency/ClientForm"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"

export default function ClientsPage() {
    const [clients, setClients] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [open, setOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")

    const fetchClients = async () => {
        try {
            const token = localStorage.getItem("token")
            const response = await api.get("/clients", {
                headers: { Authorization: `Bearer ${token}` }
            })
            setClients(response.data)
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchClients()
    }, [])

    const filteredClients = clients.filter(client =>
        client.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.email?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="space-y-10 pb-20">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Client <span className="text-primary">Portfolio</span></h1>
                    <p className="text-slate-500 font-medium mt-1">Manage institutional partners and project owners.</p>
                </div>
                <Sheet open={open} onOpenChange={setOpen}>
                    <SheetTrigger asChild>
                        <Button className="bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 font-bold px-8 py-6 rounded-2xl">
                            <Plus className="mr-2 h-5 w-5" />
                            Register Client
                        </Button>
                    </SheetTrigger>
                    <SheetContent className="sm:max-w-[500px] rounded-l-[40px] border-none shadow-2xl">
                        <SheetHeader>
                            <SheetTitle className="text-2xl font-bold">New Partner Registration</SheetTitle>
                            <SheetDescription className="font-medium text-slate-500">
                                Onboard a new institutional client to begin drafting security operational plans.
                            </SheetDescription>
                        </SheetHeader>
                        <div className="mt-10">
                            <ClientForm
                                onSuccess={() => {
                                    setOpen(false)
                                    fetchClients()
                                }}
                            />
                        </div>
                    </SheetContent>
                </Sheet>
            </div>

            {/* Quick Stats & Controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-4 rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/50">
                <div className="flex items-center gap-6 px-4">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center font-bold">
                            {clients.length}
                        </div>
                        <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">Total Partners</span>
                    </div>
                </div>

                <div className="flex gap-2">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-hover:text-primary transition-colors" />
                        <Input
                            placeholder="Find partner..."
                            className="pl-11 pr-4 py-6 bg-slate-50 border-transparent rounded-2xl w-[300px] focus:bg-white focus:ring-primary shadow-inner transition-all font-medium"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <Button variant="outline" className="p-6 rounded-2xl border-slate-100 hover:bg-slate-50 shadow-sm">
                        <Filter className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Content Area */}
            <div className="grid gap-6">
                <div className="bg-white rounded-[40px] border border-slate-100 shadow-2xl shadow-slate-200/50 overflow-hidden">
                    <Table>
                        <TableHeader className="bg-slate-50/50 border-b border-slate-100">
                            <TableRow>
                                <TableHead className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Affiliated Client</TableHead>
                                <TableHead className="py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Contact Node</TableHead>
                                <TableHead className="py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Operational Projects</TableHead>
                                <TableHead className="text-right px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Intelligence</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-20 italic text-slate-400 animate-pulse font-bold tracking-widest text-xs uppercase text-primary">Interrogating Database...</TableCell>
                                </TableRow>
                            ) : filteredClients.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-24">
                                        <div className="flex flex-col items-center">
                                            <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                                                <Building className="h-10 w-10 text-slate-200" />
                                            </div>
                                            <h4 className="text-xl font-bold text-slate-800">No Partners Recorded</h4>
                                            <p className="text-slate-500 font-medium mt-2">Initialize your first client to start project planning.</p>
                                            <Button onClick={() => setOpen(true)} variant="link" className="text-primary font-bold mt-4">Begin Onboarding <ChevronRight className="h-4 w-4 ml-1" /></Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                <AnimatePresence mode="popLayout">
                                    {filteredClients.map((client, idx) => (
                                        <motion.tr
                                            key={client.id}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: idx * 0.05 }}
                                            className="group border-b border-slate-50 hover:bg-slate-50/50 transition-colors"
                                        >
                                            <TableCell className="px-8 py-7">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-slate-100 to-white border border-slate-200 flex items-center justify-center shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all">
                                                        <Building className="h-6 w-6 text-slate-400 group-hover:text-primary transition-colors" />
                                                    </div>
                                                    <div>
                                                        <div className="font-extrabold text-slate-900 text-lg tracking-tight group-hover:text-primary transition-colors">{client.name}</div>
                                                        <div className="flex items-center gap-2 mt-0.5">
                                                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Client</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2 text-slate-600 font-medium">
                                                    <Mail className="h-3.5 w-3.5 text-slate-400" />
                                                    {client.email || "N/A"}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <div className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-[10px] font-black flex items-center gap-2">
                                                        <Activity className="h-3 w-3 text-primary" />
                                                        {client.projects?.length || 0} ACTIVE
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right px-8">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-10 px-6 rounded-xl font-bold text-slate-400 hover:text-primary hover:bg-primary/5 transition-all group/btn"
                                                >
                                                    Full Dossier
                                                    <ChevronRight className="h-4 w-4 ml-1 transform group-hover/btn:translate-x-1 transition-transform" />
                                                </Button>
                                            </TableCell>
                                        </motion.tr>
                                    ))}
                                </AnimatePresence>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    )
}
