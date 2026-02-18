"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Calendar, Clock, Users, CheckCircle2, XCircle, AlertCircle, Camera, MapPin, Building2 } from "lucide-react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuthStore } from "@/store/authStore"
import api from "@/lib/api"
import { toast } from "sonner"

export default function AttendancePage() {
    const { agencySlug } = useParams()
    const { user } = useAuthStore()
    const [loading, setLoading] = useState(true)
    const [attendanceData, setAttendanceData] = useState<any[]>([])
    const [projects, setProjects] = useState<any[]>([])
    const [selectedProject, setSelectedProject] = useState<string>("")
    const [myStatus, setMyStatus] = useState<any>(null)
    const [isChecking, setIsChecking] = useState(false)

    const roleName = typeof user?.role === 'string' ? user.role : user?.role?.name;
    const lowerRole = (roleName || '').toLowerCase();
    const isStaff = lowerRole.includes('staff') || lowerRole.includes('guard')
    const isAdmin = lowerRole.includes('admin')
    const isHR = lowerRole.includes('hr') || lowerRole.includes('human resource')
    const canMark = user?.permissions?.includes('mark_attendance') || isStaff || isHR || isAdmin

    useEffect(() => {
        fetchData()
    }, [user])

    const fetchData = async () => {
        setLoading(true)
        try {
            // Fetch Attendance
            const attendanceRes = await api.get(`/attendance?today=true`)
            const data = attendanceRes.data || []
            setAttendanceData(data)

            // If person can mark attendance, find "my" record for today
            if (canMark && user) {
                const myRecord = data.find((a: any) => a.employee?.userId === user.id || (user.employeeId && a.employeeId === user.employeeId))
                setMyStatus(myRecord)
            }

            // Fetch Projects (for check-in)
            if (canMark) {
                const projectsRes = await api.get('/projects')
                setProjects(projectsRes.data || [])
            }
        } catch (error: any) {
            console.error("Failed to fetch attendance:", error)
            toast.error("Failed to load attendance data")
        } finally {
            setLoading(false)
        }
    }

    const handleCheckIn = async () => {
        if (!selectedProject) {
            toast.error("Please select a project first")
            return
        }

        setIsChecking(true)
        try {
            const res = await api.post('/attendance/check-in', {
                projectId: selectedProject,
                method: 'WEB'
            })
            toast.success("Checked in successfully!")
            fetchData()
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Check-in failed")
        } finally {
            setIsChecking(false)
        }
    }

    const handleCheckOut = async () => {
        setIsChecking(true)
        try {
            await api.post('/attendance/check-out', {})
            toast.success("Checked out successfully!")
            fetchData()
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Check-out failed")
        } finally {
            setIsChecking(false)
        }
    }

    const stats = {
        present: attendanceData.filter(a => a.status === 'PRESENT').length,
        late: attendanceData.filter(a => a.status === 'LATE').length,
        absent: 0, // Logic for absent will be implemented later (no check-in by cut-off)
        total: attendanceData.length
    }

    if (loading && attendanceData.length === 0) {
        return <div className="p-8 text-center">Loading attendance system...</div>
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Attendance Management</h1>
                    <p className="text-slate-500">Track and manage daily work hours.</p>
                </div>
            </div>

            {/* Attendance Action Section (Visible to anyone with mark_attendance permission) */}
            {canMark && (
                <Card className="border-2 border-blue-100 bg-blue-50/30">
                    <CardHeader>
                        <CardTitle className="flex items-center text-blue-800">
                            <Clock className="h-5 w-5 mr-2" />
                            Daily Attendance Action
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col md:flex-row items-center gap-6">
                            {!myStatus ? (
                                <>
                                    <div className="w-full md:w-64">
                                        <label className="text-sm font-medium text-slate-700 mb-2 block">Select Work Site</label>
                                        <Select onValueChange={setSelectedProject}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select Project Site" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {projects.map(p => (
                                                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <Button
                                        onClick={handleCheckIn}
                                        disabled={isChecking}
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-8"
                                    >
                                        {isChecking ? "Processing..." : "Mark Check-In"}
                                    </Button>
                                    <div className="text-sm text-slate-500 flex items-center">
                                        <MapPin className="h-4 w-4 mr-1" />
                                        Your location will be recorded
                                    </div>
                                </>
                            ) : !myStatus.checkOut ? (
                                <>
                                    <div className="flex-1">
                                        <p className="text-emerald-700 font-bold text-lg">You are currently Checked-In</p>
                                        <p className="text-slate-500 text-sm flex items-center mt-1">
                                            <Clock className="h-4 w-4 mr-1" />
                                            Started at: {new Date(myStatus.checkIn).toLocaleTimeString()}
                                        </p>
                                        <p className="text-slate-500 text-sm flex items-center mt-1">
                                            <Building2 className="h-4 w-4 mr-1" />
                                            Site: {myStatus.project?.name || "Assigned Site"}
                                        </p>
                                    </div>
                                    <Button
                                        onClick={handleCheckOut}
                                        disabled={isChecking}
                                        variant="destructive"
                                        className="px-8"
                                    >
                                        {isChecking ? "Processing..." : "Mark Check-Out"}
                                    </Button>
                                </>
                            ) : (
                                <div className="flex items-center text-emerald-700 bg-emerald-50 px-4 py-2 rounded-lg border border-emerald-100">
                                    <CheckCircle2 className="h-5 w-5 mr-2" />
                                    <span className="font-bold">Work Day Completed!</span>
                                    <span className="ml-4 text-sm text-slate-500">
                                        Out at: {new Date(myStatus.checkOut).toLocaleTimeString()}
                                    </span>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Stats Cards (Admin/HR Only) */}
            {(isAdmin || isHR) && (
                <div className="grid gap-4 md:grid-cols-4">
                    <div className="p-4 bg-white border border-slate-100 rounded-xl flex items-center shadow-sm">
                        <div className="h-10 w-10 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center mr-4">
                            <CheckCircle2 className="h-5 w-5" />
                        </div>
                        <div>
                            <div className="text-sm text-slate-500 font-medium">Present</div>
                            <div className="text-xl font-bold text-slate-900">{stats.present}</div>
                        </div>
                    </div>

                    <div className="p-4 bg-white border border-slate-100 rounded-xl flex items-center shadow-sm">
                        <div className="h-10 w-10 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center mr-4">
                            <AlertCircle className="h-5 w-5" />
                        </div>
                        <div>
                            <div className="text-sm text-slate-500 font-medium">Late</div>
                            <div className="text-xl font-bold text-slate-900">{stats.late}</div>
                        </div>
                    </div>

                    <div className="p-4 bg-white border border-slate-100 rounded-xl flex items-center shadow-sm">
                        <div className="h-10 w-10 bg-red-50 text-red-600 rounded-lg flex items-center justify-center mr-4">
                            <XCircle className="h-5 w-5" />
                        </div>
                        <div>
                            <div className="text-sm text-slate-500 font-medium">Absent</div>
                            <div className="text-xl font-bold text-slate-900">{stats.absent}</div>
                        </div>
                    </div>

                    <div className="p-4 bg-white border border-slate-100 rounded-xl flex items-center shadow-sm">
                        <div className="h-10 w-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center mr-4">
                            <Users className="h-5 w-5" />
                        </div>
                        <div>
                            <div className="text-sm text-slate-500 font-medium">Reporting Today</div>
                            <div className="text-xl font-bold text-slate-900">{stats.total}</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Today's Attendance Table (Always visible to Admin/HR, Staff sees their status) */}
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="bg-slate-50 p-4 border-b border-slate-200 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-slate-800 flex items-center">
                        <Calendar className="h-5 w-5 mr-2 text-blue-600" />
                        Today&apos;s Logs - {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </h2>
                    {(isAdmin || isHR) && (
                        <Badge variant="outline" className="bg-slate-50 text-slate-600">
                            Viewing All Personnel
                        </Badge>
                    )}
                </div>
                <Table>
                    <TableHeader className="bg-slate-50/50">
                        <TableRow>
                            <TableHead className="w-[250px]">Personnel Name</TableHead>
                            <TableHead>Designation</TableHead>
                            <TableHead>Project Site</TableHead>
                            <TableHead>Check In</TableHead>
                            <TableHead>Check Out</TableHead>
                            <TableHead>Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {attendanceData.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-12 text-slate-400 italic">No attendance records for today.</TableCell>
                            </TableRow>
                        ) : (
                            attendanceData.map((record) => (
                                <TableRow key={record.id} className="hover:bg-slate-50/50">
                                    <TableCell>
                                        <div className="flex items-center">
                                            <Avatar className="h-8 w-8 mr-3">
                                                <AvatarFallback className="text-[10px] font-bold">
                                                    {record.employee?.fullName?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || '??'}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="font-semibold text-slate-900">{record.employee?.fullName}</div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200">
                                            {record.employee?.designation?.name || 'Staff'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-sm text-slate-600">
                                            {record.project?.name || "N/A"}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center text-sm">
                                            <Clock className="h-4 w-4 mr-2 text-slate-400" />
                                            {record.checkIn ? new Date(record.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "-"}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center text-sm">
                                            <Clock className="h-4 w-4 mr-2 text-slate-400" />
                                            {record.checkOut ? new Date(record.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "-"}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {record.status === "PRESENT" && (
                                            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-50">
                                                Present
                                            </Badge>
                                        )}
                                        {record.status === "LATE" && (
                                            <Badge className="bg-amber-50 text-amber-700 border-amber-100 hover:bg-amber-50">
                                                Late
                                            </Badge>
                                        )}
                                        {record.status === "ABSENT" && (
                                            <Badge className="bg-red-50 text-red-700 border-red-100 hover:bg-red-50">
                                                Absent
                                            </Badge>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
