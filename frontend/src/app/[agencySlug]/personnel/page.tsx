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
import { Plus, Users, UserCheck, Shield, Settings2, Wallet, Calculator, Search, Filter, LayoutGrid, List, Trash2, Mail, Phone, ShieldCheck, ExternalLink } from "lucide-react"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"
import { EmployeeForm } from "@/components/agency/EmployeeForm"
import { DesignationManager } from "@/components/agency/DesignationManager"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"

export default function PersonnelPage() {
    const [employees, setEmployees] = useState<any[]>([])
    const [designations, setDesignations] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [openEnroll, setOpenEnroll] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")

    // Profile State
    const [profileDialog, setProfileDialog] = useState<{ open: boolean, employee: any | null }>({
        open: false,
        employee: null
    })

    // Individual Payroll State
    const [payrollDialog, setPayrollDialog] = useState<{ open: boolean, employee: any | null }>({
        open: false,
        employee: null
    })
    const [payrollAmount, setPayrollAmount] = useState<string>("0")
    const [payrollMonth, setPayrollMonth] = useState<string>(new Date().toISOString().slice(0, 7))
    const [generating, setGenerating] = useState(false)
    const [deleting, setDeleting] = useState(false)

    const fetchData = async () => {
        try {
            const [empRes, desRes] = await Promise.all([
                api.get("/employees"),
                api.get("/designations")
            ])
            setEmployees(empRes.data)
            setDesignations(desRes.data)
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [])

    const handleOpenPayroll = (emp: any) => {
        setPayrollDialog({ open: true, employee: emp })
        setPayrollAmount(emp.basicSalary?.toString() || "0")
    }

    const handleDeleteEmployee = async () => {
        if (!profileDialog.employee) return
        const confirmDelete = window.confirm(`Are you sure you want to terminate and delete ${profileDialog.employee.fullName}? This action is irreversible.`)
        if (!confirmDelete) return

        setDeleting(true)
        try {
            await api.delete(`/employees/${profileDialog.employee.id}`)
            toast.success("Personnel record expunged from system.")
            setProfileDialog({ open: false, employee: null })
            fetchData()
        } catch (error) {
            toast.error("Failed to delete personnel. They might have active assignments.")
        } finally {
            setDeleting(false)
        }
    }
    const handleGeneratePayroll = async () => {
        if (!payrollDialog.employee) return
        setGenerating(true)
        try {
            await api.post("/payroll/individual", {
                employeeId: payrollDialog.employee.id,
                month: payrollMonth,
                amount: parseFloat(payrollAmount)
            })
            toast.success(`Payroll generated for ${payrollDialog.employee.fullName}`)
            setPayrollDialog({ open: false, employee: null })
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Generation failed. Maybe already exists?")
        } finally {
            setGenerating(false)
        }
    }

    const filteredEmployees = employees.filter((emp: any) =>
        emp.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.employeeCode?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const stats = [
        { label: "Active Fleet", value: employees.length, icon: Users, color: "text-teal-600", bg: "bg-teal-50" },
        { label: "On Station", value: "0", icon: UserCheck, color: "text-emerald-600", bg: "bg-emerald-50" },
        { label: "Specialized Roles", value: designations.length, icon: Shield, color: "text-teal-700", bg: "bg-teal-50" },
    ]

    return (
        <div className="space-y-8 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Personnel <span className="text-primary">Registry</span></h1>
                    <p className="text-slate-500 font-medium mt-1">Manage and deploy your high-readiness enforcement team.</p>
                </div>

                <div className="flex gap-3">
                    <Sheet open={openEnroll} onOpenChange={setOpenEnroll}>
                        <SheetTrigger asChild>
                            <Button className="bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 font-bold px-8 py-6 rounded-2xl">
                                <Plus className="mr-2 h-5 w-5" />
                                Onboard Personnel
                            </Button>
                        </SheetTrigger>
                        <SheetContent className="sm:max-w-[540px] rounded-l-[40px] border-none shadow-2xl">
                            <SheetHeader>
                                <SheetTitle className="text-2xl font-bold">Staff Enrollment</SheetTitle>
                                <SheetDescription className="font-medium text-slate-500">
                                    Register a new officer. Complete the biometric and structural assignment details.
                                </SheetDescription>
                            </SheetHeader>
                            <div className="mt-8">
                                <EmployeeForm
                                    designations={designations}
                                    refetchDesignations={fetchData}
                                    onSuccess={() => {
                                        setOpenEnroll(false)
                                        fetchData()
                                    }}
                                />
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {stats.map((s) => (
                    <div key={s.label} className="p-6 bg-white rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/50 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className={cn("h-14 w-14 rounded-2xl flex items-center justify-center shadow-inner", s.bg, s.color)}>
                                <s.icon className="h-7 w-7" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{s.label}</p>
                                <h3 className="text-2xl font-black text-slate-900">{s.value}</h3>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <Tabs defaultValue="staff" className="space-y-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <TabsList className="bg-slate-100/50 p-1.5 rounded-2xl border border-slate-200/50">
                        <TabsTrigger value="staff" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-primary font-bold transition-all">
                            <Users className="h-4 w-4 mr-2" />
                            Active Roster
                        </TabsTrigger>
                        <TabsTrigger value="designations" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-primary font-bold transition-all">
                            <Settings2 className="h-4 w-4 mr-2" />
                            Global Designations
                        </TabsTrigger>
                    </TabsList>

                    <div className="flex gap-2">
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-hover:text-primary transition-colors" />
                            <Input
                                placeholder="Search officers..."
                                className="pl-11 pr-4 py-6 bg-white border-slate-200 rounded-2xl w-[300px] focus:ring-primary shadow-sm hover:shadow-md transition-all font-medium"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <Button variant="outline" className="p-6 rounded-2xl border-slate-200 hover:bg-slate-50">
                            <Filter className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                <TabsContent value="staff" className="mt-0 outline-none">
                    <div className="bg-white rounded-[40px] border border-slate-100 shadow-2xl shadow-slate-200/50 overflow-hidden">
                        <Table>
                            <TableHeader className="bg-slate-50/50 border-b border-slate-100">
                                <TableRow>
                                    <TableHead className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Deployment Profile</TableHead>
                                    <TableHead className="py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Assignment</TableHead>
                                    <TableHead className="py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Base Package</TableHead>
                                    <TableHead className="py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Status</TableHead>
                                    <TableHead className="text-right px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Operations</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-20 italic text-slate-400 animate-pulse font-bold tracking-widest text-xs uppercase">Connecting to Enterprise Roster...</TableCell>
                                    </TableRow>
                                ) : filteredEmployees.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-24">
                                            <div className="flex flex-col items-center">
                                                <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                                    <Users className="h-8 w-8 text-slate-200" />
                                                </div>
                                                <h4 className="text-lg font-bold text-slate-800 tracking-tight">Intelligence Vacuum</h4>
                                                <p className="text-slate-400 text-sm mt-1 font-medium">No personnel found matching your current filters.</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    <AnimatePresence mode="popLayout">
                                        {filteredEmployees.map((emp, idx) => (
                                            <motion.tr
                                                key={emp.id}
                                                initial={{ opacity: 0, scale: 0.98 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ delay: idx * 0.03 }}
                                                className="group border-b border-slate-50 hover:bg-slate-50/50 transition-colors"
                                            >
                                                <TableCell className="px-8 py-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="relative">
                                                            <Avatar className="h-12 w-12 border-2 border-white shadow-md">
                                                                <AvatarFallback className="bg-gradient-to-tr from-slate-100 to-slate-200 text-slate-600 text-sm font-black uppercase">
                                                                    {emp.fullName?.split(' ').map((n: string) => n[0]).join('') || "E"}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            <div className="absolute -bottom-1 -right-1 h-5 w-5 bg-white rounded-full flex items-center justify-center shadow-sm">
                                                                <div className={cn("h-3 w-3 rounded-full", emp.status === 'ACTIVE' ? "bg-emerald-500" : "bg-slate-300")} />
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <div className="font-extrabold text-slate-900 group-hover:text-primary transition-colors">{emp.fullName}</div>
                                                            <div className="text-[10px] text-slate-400 font-bold tracking-widest uppercase mt-0.5">{emp.employeeCode}</div>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="bg-blue-50/50 text-blue-700 border-blue-100/50 font-bold px-3 py-1 rounded-full text-[10px]">
                                                        {emp.designation?.name || "Unassigned"}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="font-black text-slate-800">
                                                    ${emp.basicSalary?.toLocaleString() || 0}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className={cn(
                                                        "shadow-none px-3 py-1 rounded-full text-[10px] font-black",
                                                        emp.status === 'ACTIVE' ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-slate-100 text-slate-500"
                                                    )}>
                                                        {emp.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right px-8">
                                                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-4 group-hover:translate-x-0">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleOpenPayroll(emp)}
                                                            className="h-10 px-4 rounded-xl font-bold border-slate-200 shadow-sm hover:border-primary hover:text-primary transition-all"
                                                        >
                                                            <Wallet className="h-3.5 w-3.5 mr-2" />
                                                            Payroll
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-10 px-4 rounded-xl font-bold text-slate-700 hover:bg-slate-100 shadow-sm"
                                                            onClick={() => setProfileDialog({ open: true, employee: emp })}
                                                        >
                                                            Profile
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </motion.tr>
                                        ))}
                                    </AnimatePresence>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </TabsContent>

                <TabsContent value="designations">
                    <DesignationManager
                        onUpdate={() => fetchData()}
                        designations={designations}
                    />
                </TabsContent>
            </Tabs>

            {/* Individual Payroll Generation Dialog */}
            <Dialog open={payrollDialog.open} onOpenChange={(v) => !v && setPayrollDialog({ open: false, employee: null })}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center text-burnt-crimson">
                            <Calculator className="h-5 w-5 mr-2" />
                            One-Off Payroll Generation
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-lg">
                            <Avatar className="h-10 w-10">
                                <AvatarFallback className="font-bold">{payrollDialog.employee?.fullName?.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-bold text-slate-900">{payrollDialog.employee?.fullName}</p>
                                <p className="text-xs text-slate-500">{payrollDialog.employee?.designation?.name}</p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">Month</label>
                            <Input
                                type="month"
                                value={payrollMonth}
                                onChange={(e) => setPayrollMonth(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">Payroll Amount ($)</label>
                            <Input
                                type="number"
                                value={payrollAmount}
                                onChange={(e) => setPayrollAmount(e.target.value)}
                                placeholder="Enter specific amount e.g. 10.00"
                                className="text-lg font-bold"
                            />
                            <p className="text-[10px] text-slate-400">Default base salary: ${payrollDialog.employee?.basicSalary || 0}</p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setPayrollDialog({ open: false, employee: null })}>Cancel</Button>
                        <Button
                            onClick={handleGeneratePayroll}
                            disabled={generating || !payrollAmount}
                            className="bg-burnt-crimson text-white hover:bg-burnt-crimson/90"
                        >
                            {generating ? "GENERATING..." : "GENERATE PAYROLL"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            {/* Personnel Profile Dialog */}
            <Dialog open={profileDialog.open} onOpenChange={(v) => !v && setProfileDialog({ open: false, employee: null })}>
                <DialogContent className="sm:max-w-[500px] border-none rounded-[32px] p-0 overflow-hidden shadow-2xl bg-white">
                    <DialogHeader className="sr-only">
                        <DialogTitle>Personnel Profile - {profileDialog.employee?.fullName}</DialogTitle>
                        <DialogDescription>Professional credentials and administrative actions for enforcement personnel.</DialogDescription>
                    </DialogHeader>
                    <div className="bg-slate-900 p-8 text-white relative">
                        <div className="flex items-center gap-6">
                            <Avatar className="h-20 w-20 border-4 border-white/10 shadow-2xl">
                                <AvatarFallback className="bg-primary text-white text-2xl font-black">
                                    {profileDialog.employee?.fullName?.split(' ').map((n: any) => n[0]).join('')}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <Badge className="bg-primary/20 text-primary border-none mb-2 font-bold px-3">PROTECTION OFFICER</Badge>
                                <h2 className="text-3xl font-black tracking-tight leading-none">{profileDialog.employee?.fullName}</h2>
                                <p className="text-slate-400 font-bold text-sm mt-1 uppercase tracking-widest">{profileDialog.employee?.employeeCode}</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-8 space-y-8 bg-white">
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                    <ShieldCheck className="h-3 w-3" /> Professional Status
                                </p>
                                <p className="text-sm font-bold text-slate-900">{profileDialog.employee?.designation?.name}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                    <Wallet className="h-3 w-3" /> Base Remuneration
                                </p>
                                <p className="text-sm font-bold text-slate-900">${profileDialog.employee?.basicSalary?.toLocaleString()}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                    <Mail className="h-3 w-3" /> Secure Email
                                </p>
                                <p className="text-sm font-bold text-slate-900 truncate">{profileDialog.employee?.email}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                    <Phone className="h-3 w-3" /> Emergency Contact
                                </p>
                                <p className="text-sm font-bold text-slate-900">{profileDialog.employee?.phoneNumber || "NOT_SET"}</p>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
                            <div className="flex flex-col">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Administrative Control</p>
                                <p className="text-[11px] text-slate-500 font-medium">Data removal requires high-level clearance.</p>
                            </div>
                            <Button
                                variant="destructive"
                                size="sm"
                                disabled={deleting}
                                onClick={handleDeleteEmployee}
                                className="bg-red-50 text-red-600 hover:bg-red-600 hover:text-white border-none rounded-xl font-black text-[10px] px-4 shadow-none transition-all"
                            >
                                <Trash2 className="h-3 w-3 mr-2" />
                                {deleting ? "PURGING..." : "TERMINATE RECORD"}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
