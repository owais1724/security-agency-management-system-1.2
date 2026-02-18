"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { CalendarDays, Plus, CheckCircle, XCircle, Clock, Loader2 } from "lucide-react"
import { toast } from "sonner"
import api from "@/lib/api"

interface LeaveRequest {
  id: string
  employeeId: string
  leaveType: string
  startDate: string
  endDate: string
  reason: string
  status: string
  appliedAt: string
  supervisorApprovedAt?: string
  supervisorApprovedBy?: string
  hrApprovedAt?: string
  hrApprovedBy?: string
  agencyApprovedAt?: string
  agencyApprovedBy?: string
  rejectionReason?: string
  pendingWith?: string
  employee: {
    id: string
    name: string
    email: string
    role: string
    designation: {
      name: string
    }
  }
}

interface User {
  id: string
  employeeId?: string
  role: any
  fullName: string
}

const statusColors = {
  PENDING: "bg-yellow-100 text-yellow-800",
  SUPERVISOR_APPROVED: "bg-blue-100 text-blue-800",
  HR_APPROVED: "bg-purple-100 text-purple-800",
  AGENCY_APPROVED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800"
}

const statusIcons = {
  PENDING: Clock,
  SUPERVISOR_APPROVED: CheckCircle,
  HR_APPROVED: CheckCircle,
  AGENCY_APPROVED: CheckCircle,
  REJECTED: XCircle
}

export default function LeavesPage() {
  const { agencySlug } = useParams()
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([])
  const [user, setUser] = useState<User | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    leaveType: "",
    startDate: "",
    endDate: "",
    reason: ""
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const init = async () => {
      setLoading(true)
      await Promise.all([fetchUserData(), fetchLeaveRequests()])
      setLoading(false)
    }
    init()
  }, [])

  const fetchUserData = async () => {
    try {
      const response = await api.get('/auth/me')
      setUser(response.data)
    } catch (error) {
      console.error('Error fetching user data:', error)
    }
  }

  const fetchLeaveRequests = async () => {
    try {
      const response = await api.get('/leaves')
      setLeaveRequests(response.data)
    } catch (error) {
      toast.error('Failed to fetch leave requests')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user?.employeeId) {
      toast.error('Only staff members can apply for leave')
      return
    }

    try {
      await api.post('/leaves', {
        ...formData,
        startDate: new Date(formData.startDate),
        endDate: new Date(formData.endDate),
        employeeId: user.employeeId
      })

      toast.success('Leave request submitted successfully')
      setIsDialogOpen(false)
      setFormData({ leaveType: "", startDate: "", endDate: "", reason: "" })
      fetchLeaveRequests()
    } catch (error) {
      toast.error('Failed to submit leave request')
    }
  }

  const handleApproval = async (leaveId: string, status: string, rejectionReason?: string) => {
    try {
      await api.put(`/leaves/${leaveId}/approve`, {
        status,
        rejectionReason
      })

      const statusLabel = status.toLowerCase().replace('_', ' ')
      toast.success(`Leave request ${statusLabel}`)
      fetchLeaveRequests()
    } catch (error) {
      toast.error('Failed to update leave request')
    }
  }

  const canApprove = (leave: LeaveRequest) => {
    if (!user || !user.role) return false

    const roleName = typeof user.role === 'string' ? user.role : user.role?.name;
    const role = (roleName || '').toLowerCase();
    const applicantRole = (leave.employee?.role || 'Staff').toLowerCase();
    const status = leave.status;

    const isHR = role.includes('hr');
    const isSupervisor = role.includes('supervisor');
    const isAdmin = role.includes('admin');

    const isApplicantAdmin = applicantRole.includes('admin');
    const isApplicantHR = applicantRole.includes('hr');
    const isApplicantSupervisor = applicantRole.includes('supervisor');

    // Terminal statuses (except for Emergency Audit)
    if (status === 'REJECTED') return false

    // For Emergency leaves, they are "Auditable" only if approved by SYSTEM
    const isEmergencyAudit = status === 'AGENCY_APPROVED' &&
      leave.leaveType === 'EMERGENCY' &&
      leave.agencyApprovedBy === 'SYSTEM_AUTO_EMERGENCY';

    if (status === 'AGENCY_APPROVED' && !isEmergencyAudit) return false

    // Agency Admin can always approve/audit anything that isn't final
    if (isAdmin) return true

    // HR Approval/Audit Logic
    if (isHR) {
      // HR can approve Supervisor and Staff leaves, but not HR/Admin leaves
      if (!isApplicantAdmin && !isApplicantHR) {
        if (status === 'PENDING' || status === 'SUPERVISOR_APPROVED' || isEmergencyAudit) {
          return true
        }
      }
    }

    // Supervisor Approval/Audit Logic
    if (isSupervisor) {
      // Supervisor can approve PENDING or Emergency Audit frontline staff leaves
      if (!isApplicantAdmin && !isApplicantHR && !isApplicantSupervisor) {
        if (status === 'PENDING' || isEmergencyAudit) {
          return true
        }
      }
    }

    return false
  }

  const getNextStatus = (leave: LeaveRequest) => {
    if (!user || !user.role) return null
    const roleName = typeof user.role === 'string' ? user.role : user.role?.name;
    const role = (roleName || '').toLowerCase();

    const isHR = role.includes('hr');
    const isSupervisor = role.includes('supervisor');
    const isAdmin = role.includes('admin');

    // HR and Admin approval are terminal
    if (isHR || isAdmin) return 'AGENCY_APPROVED'

    // Supervisor approval moves to intermediate level
    if (isSupervisor) return 'SUPERVISOR_APPROVED'

    return null
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground animate-pulse">Synchronizing leave data...</p>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <CalendarDays className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Leave Management</h1>
        </div>

        {(typeof user?.role === 'string' ? user?.role : user?.role?.name) !== 'Agency Admin' && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Apply for Leave
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Apply for Leave</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="leaveType" className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Leave Type</Label>
                  <Select value={formData.leaveType} onValueChange={(value) => setFormData({ ...formData, leaveType: value })}>
                    <SelectTrigger className="h-12 rounded-xl border-slate-200 focus:ring-primary/20">
                      <SelectValue placeholder="Select leave type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SICK">Sick Leave</SelectItem>
                      <SelectItem value="CASUAL">Casual Leave</SelectItem>
                      <SelectItem value="ANNUAL">Annual Leave</SelectItem>
                      <SelectItem value="EMERGENCY">Emergency Leave</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate" className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Start Date</Label>
                    <Input
                      id="startDate"
                      type="date"
                      className="h-12 rounded-xl border-slate-200 focus:ring-primary/20"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endDate" className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">End Date</Label>
                    <Input
                      id="endDate"
                      type="date"
                      className="h-12 rounded-xl border-slate-200 focus:ring-primary/20"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reason" className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Reason</Label>
                  <Textarea
                    id="reason"
                    className="min-h-[100px] rounded-xl border-slate-200 focus:ring-primary/20 resize-none"
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    placeholder="Enter reason for leave..."
                    required
                  />
                </div>

                <Button type="submit" className="w-full h-12 rounded-xl font-bold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all active:scale-[0.98]">
                  Submit Request
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid gap-4">
        {leaveRequests.map((leave) => {
          const StatusIcon = statusIcons[leave.status as keyof typeof statusIcons]
          return (
            <Card key={leave.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{leave.employee.name}</CardTitle>
                    <p className="text-sm text-gray-600">{leave.employee.role} - {leave.employee.designation.name}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge className={
                      leave.status === 'AGENCY_APPROVED' && leave.leaveType === 'EMERGENCY' && leave.agencyApprovedBy === 'SYSTEM_AUTO_EMERGENCY'
                        ? "bg-blue-100 text-blue-800 border-blue-200"
                        : statusColors[leave.status as keyof typeof statusColors]
                    }>
                      {StatusIcon && <StatusIcon className="h-3 w-3 mr-1" />}
                      {leave.status === 'AGENCY_APPROVED' && leave.leaveType === 'EMERGENCY' && leave.agencyApprovedBy === 'SYSTEM_AUTO_EMERGENCY'
                        ? "EMERGENCY APPROVED (AUTO)"
                        : leave.status.replace('_', ' ')}
                    </Badge>
                    {(leave.status !== 'AGENCY_APPROVED' || (leave.leaveType === 'EMERGENCY' && leave.agencyApprovedBy === 'SYSTEM_AUTO_EMERGENCY')) &&
                      leave.status !== 'REJECTED' && leave.pendingWith && (
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                          Pending with: <span className="text-primary">{leave.pendingWith}</span>
                        </span>
                      )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid md:grid-cols-3 gap-4 text-sm">
                    <div className="flex flex-col">
                      <span className="text-slate-400 font-bold uppercase text-[10px]">Leave Type</span>
                      <span className="font-bold">{leave.leaveType}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-slate-400 font-bold uppercase text-[10px]">Duration</span>
                      <span className="font-bold">{new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-slate-400 font-bold uppercase text-[10px]">Applied On</span>
                      <span className="font-bold">{new Date(leave.appliedAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-slate-400 font-bold uppercase text-[10px]">Reason</span>
                    <p className="text-sm mt-1">{leave.reason}</p>
                  </div>

                  {leave.rejectionReason && (
                    <div className="p-3 bg-red-50 rounded-xl text-sm text-red-800 border border-red-100">
                      <span className="font-bold uppercase text-[10px] block mb-1">Rejection Reason</span>
                      {leave.rejectionReason}
                    </div>
                  )}

                  {canApprove(leave) && (
                    <div className="flex space-x-2 pt-2">
                      <Button
                        size="sm"
                        onClick={() => handleApproval(leave.id, getNextStatus(leave)!)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          const reason = prompt('Enter rejection reason:')
                          if (reason) {
                            handleApproval(leave.id, 'REJECTED', reason)
                          }
                        }}
                      >
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}

        {leaveRequests.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <CalendarDays className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No leave requests found</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
