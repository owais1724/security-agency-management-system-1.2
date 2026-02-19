"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    Shield,
    Search,
    Filter,
    Download,
    Eye,
    Lock,
    UserPlus,
    Building2,
    Activity,
    ClipboardCheck,
    AlertCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import api from "@/lib/api"

export default function AuditLogsPage() {
    const [logs, setLogs] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedLog, setSelectedLog] = useState<any>(null)

    const fetchLogs = async () => {
        try {
            const response = await api.get("/audit-logs")
            setLogs(response.data)
        } catch (error) {
            console.error("Failed to fetch logs:", error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchLogs()
    }, [])

    const getIcon = (action: string) => {
        if (action.includes('LOGIN')) return Lock
        if (action.includes('CREATE')) return UserPlus
        if (action.includes('UPDATE')) return Activity
        if (action.includes('DELETE')) return AlertCircle
        return Activity
    }

    const getColor = (severity: string) => {
        if (severity === 'CRITICAL') return "text-red-600"
        if (severity === 'MEDIUM') return "text-amber-600"
        return "text-teal-600"
    }

    const getBg = (severity: string) => {
        if (severity === 'CRITICAL') return "bg-red-50"
        if (severity === 'MEDIUM') return "bg-amber-50"
        return "bg-teal-50"
    }

    const filteredLogs = logs.filter(log =>
        log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.details?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.user?.fullName?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8 pb-20 font-outfit"
        >
            {/* Dossier Dialog */}
            <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
                <DialogContent className="sm:max-w-2xl border-none rounded-[40px] p-0 overflow-hidden shadow-2xl bg-white">
                    <DialogHeader className="sr-only">
                        <DialogTitle>Audit Log Details</DialogTitle>
                        <DialogDescription>Detailed view of this audit log entry.</DialogDescription>
                    </DialogHeader>
                    {selectedLog && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="relative"
                        >
                            <div className="bg-slate-950 p-10 text-white relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/10 blur-[100px] rounded-full -mr-32 -mt-32" />
                                <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-500/10 blur-[80px] rounded-full -ml-24 -mb-24" />

                                <div className="relative z-10">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center border border-white/20 backdrop-blur-md", selectedLog.severity === 'CRITICAL' ? "bg-red-500/20 text-red-400" : "bg-teal-500/20 text-teal-400")}>
                                            <Shield className="h-5 w-5" />
                                        </div>
                                        <Badge variant="outline" className="text-white/40 border-white/10 font-bold tracking-widest text-[9px]">AUDIT RECORD</Badge>
                                    </div>
                                    <h2 className="text-4xl font-black tracking-tighter mb-2">Audit <span className="text-teal-400">Details</span></h2>
                                    <p className="text-slate-400 font-medium text-sm">Full details of this system event.</p>
                                </div>
                            </div>

                            <div className="p-10 space-y-10">
                                <div className="grid grid-cols-2 gap-8">
                                    <div className="space-y-2">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                            <Lock className="h-3 w-3" /> Event ID
                                        </p>
                                        <p className="text-sm font-black text-slate-900 font-mono tracking-tight bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">LOG-{selectedLog.id.slice(0, 8).toUpperCase()}</p>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                            <Activity className="h-3 w-3" /> Severity Level
                                        </p>
                                        <Badge className={cn("font-black text-[10px] px-3", selectedLog.severity === 'CRITICAL' ? "bg-red-500 text-white" : "bg-emerald-500 text-white")}>
                                            {selectedLog.severity} PRIORITY
                                        </Badge>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Event Details</p>
                                    <div className="grid grid-cols-1 gap-4">
                                        <div className="flex items-center justify-between py-1">
                                            <span className="text-sm text-slate-500 font-bold">Action</span>
                                            <span className="text-sm text-slate-900 font-black">{selectedLog.action}</span>
                                        </div>
                                        <div className="flex items-center justify-between py-1">
                                            <span className="text-sm text-slate-500 font-bold">User</span>
                                            <span className="text-sm text-slate-900 font-black text-right">{selectedLog.user?.fullName || "System"}</span>
                                        </div>
                                        <div className="flex items-center justify-between py-1">
                                            <span className="text-sm text-slate-500 font-bold">IP Address</span>
                                            <span className="text-sm text-slate-900 font-black italic">{selectedLog.metadata?.ip || "Internal"}</span>
                                        </div>
                                        <div className="flex items-center justify-between py-1">
                                            <span className="text-sm text-slate-500 font-bold">Timestamp</span>
                                            <span className="text-sm text-slate-900 font-black italic">
                                                {new Date(selectedLog.createdAt).toLocaleTimeString('en-US', { hour12: false }) + ' on ' + new Date(selectedLog.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-slate-50 p-6 rounded-[32px] border border-slate-100 relative group overflow-hidden">
                                    <div className="relative z-10">
                                        <p className="text-[10px] font-black text-teal-600 uppercase tracking-widest mb-2 flex items-center gap-2">
                                            <ClipboardCheck className="h-3.5 w-3.5" /> Description
                                        </p>
                                        <p className="text-slate-700 font-medium leading-relaxed italic text-sm">
                                            "{selectedLog.details || "No additional details available."}"
                                        </p>
                                    </div>
                                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                        <Building2 className="h-20 w-20" />
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Security <span className="text-primary">Audit Trail</span></h1>
                    <p className="text-slate-500 font-medium mt-1">Complete log of all system activities and changes.</p>
                </div>

                <div className="flex gap-3">
                    <Button variant="outline" className="border-slate-200 font-bold px-6 py-6 rounded-2xl bg-white shadow-sm hover:shadow-md transition-all">
                        <Download className="mr-2 h-5 w-5" />
                        Export Logs
                    </Button>
                </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="relative group flex-1 max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-hover:text-primary transition-colors" />
                    <Input
                        placeholder="Search events..."
                        className="pl-11 pr-4 py-6 bg-white border-slate-200 rounded-2xl w-full focus:ring-primary shadow-sm hover:shadow-md transition-all font-medium italic"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="flex gap-2">
                    <Button variant="outline" className="p-6 rounded-2xl border-slate-200 hover:bg-slate-50 bg-white">
                        <Filter className="h-4 w-4 mr-2" />
                        Filter Logs
                    </Button>
                </div>
            </div>

            {/* Logs Table */}
            <div className="bg-white rounded-[40px] border border-slate-100 shadow-2xl shadow-slate-200/50 overflow-hidden min-h-[400px]">
                <Table>
                    <TableHeader className="bg-slate-50/50 border-b border-slate-100">
                        <TableRow>
                            <TableHead className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Timestamp</TableHead>
                            <TableHead className="py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Event</TableHead>
                            <TableHead className="py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">User</TableHead>
                            <TableHead className="py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Severity</TableHead>
                            <TableHead className="text-right px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-20">
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading logs...</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : filteredLogs.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-32">
                                    <div className="flex flex-col items-center opacity-30">
                                        <Shield className="h-16 w-16 mb-4 text-slate-400" />
                                        <h3 className="text-lg font-bold">No Audit Data Found</h3>
                                        <p className="text-xs font-medium max-w-[200px]">Perform administrative actions or login to generate fresh security logs.</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            <AnimatePresence mode="popLayout">
                                {filteredLogs.map((log, idx) => {
                                    const LogIcon = getIcon(log.action)
                                    return (
                                        <motion.tr
                                            key={log.id}
                                            initial={{ opacity: 0, scale: 0.98 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: idx * 0.05 }}
                                            className="group border-b border-slate-50 hover:bg-slate-50/50 transition-colors"
                                        >
                                            <TableCell className="px-8 py-6">
                                                <div className="flex flex-col">
                                                    <span className="font-extrabold text-slate-900">{new Date(log.createdAt).toLocaleTimeString('en-US', { hour12: false })}</span>
                                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{new Date(log.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-4">
                                                    <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center shadow-inner", getBg(log.severity), getColor(log.severity))}>
                                                        <LogIcon className="h-5 w-5" />
                                                    </div>
                                                    <div>
                                                        <div className="font-extrabold text-slate-900">{log.action.replace('_', ' ')}</div>
                                                        <div className="text-[11px] text-slate-500 font-medium">{log.details}</div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="bg-white text-slate-600 border-slate-200 font-bold px-3 py-1 rounded-full text-[10px]">
                                                    {log.user?.fullName || "System"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={cn(
                                                    "shadow-none px-3 py-1 rounded-lg text-[9px] font-black",
                                                    log.severity === 'CRITICAL' ? "bg-red-500 text-white" :
                                                        log.severity === 'MEDIUM' ? "bg-amber-500 text-white" : "bg-emerald-500 text-white"
                                                )}>
                                                    {log.severity}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right px-8">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-10 w-10 rounded-xl hover:bg-white hover:shadow-md transition-all group-hover:text-primary"
                                                    onClick={() => setSelectedLog(log)}
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </motion.tr>
                                    )
                                })}
                            </AnimatePresence>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-center gap-4 py-10 opacity-50">
                <Shield className="h-5 w-5 text-slate-400" />
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">End of Audit Log</p>
            </div>
        </motion.div>
    )
}
