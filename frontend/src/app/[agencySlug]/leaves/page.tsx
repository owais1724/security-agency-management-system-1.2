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
import { CalendarDays, Plus, CheckCircle, XCircle, Clock } from "lucide-react"
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
  employee: {
    id: string
    name: string
    email: string
    designation: {
      name: string
    }
  }
}

interface User {
  id: string
  role: any
  name: string
  employeeId?: string
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
    fetchUserData()
    fetchLeaveRequests()
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
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user?.employeeId) {
      toast.error('Your profile does not have an employee record (needed for leaves).')
      return
    }

    try {
      await api.post('/leaves', {
        ...formData,
        startDate: new Date(formData.startDate),
        endDate: new Date(formData.endDate),
        leaveType: formData.leaveType,
        employeeId: user.employeeId
      })

      toast.success('Leave request submitted successfully')
      setIsDialogOpen(false)
      setFormData({ leaveType: "", startDate: "", endDate: "", reason: "" })
      fetchLeaveRequests()
    } catch (error) {
      console.error(error)
      toast.error('Failed to submit leave request')
    }
  }

  const handleApproval = async (leaveId: string, status: string, rejectionReason?: string) => {
    try {
      const token = localStorage.getItem('token')
      await api.put(`/leaves/${leaveId}/approve`, {
        status,
        rejectionReason
      })

      toast.success(`Leave request ${status.toLowerCase()}`)
      fetchLeaveRequests()
    } catch (error) {
      toast.error('Failed to update leave request')
    }
  }

  const canApprove = (leaveStatus: string) => {
    if (!user?.role) return false
    const roleName = (typeof user.role === 'string' ? user.role : user.role?.name || '').toUpperCase();

    if (roleName === 'SUPERVISOR' && leaveStatus === 'PENDING') return true
    if (roleName === 'HR' && leaveStatus === 'SUPERVISOR_APPROVED') return true
    if (roleName.includes('ADMIN') && leaveStatus === 'HR_APPROVED') return true

    return false
  }

  const getNextStatus = (currentStatus: string) => {
    const roleName = (typeof user?.role === 'string' ? user.role : user?.role?.name || '').toUpperCase();
    if (roleName === 'SUPERVISOR') return 'SUPERVISOR_APPROVED'
    if (roleName === 'HR') return 'HR_APPROVED'
    if (roleName.includes('ADMIN')) return 'AGENCY_APPROVED'
    return null
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  const currentUserRole = (typeof user?.role === 'string' ? user.role : user?.role?.name || '').toUpperCase();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <CalendarDays className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Leave Management</h1>
        </div>

        {!currentUserRole.includes('ADMIN') && (
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
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="leaveType">Leave Type</Label>
                  <Select value={formData.leaveType} onValueChange={(value) => setFormData({ ...formData, leaveType: value })}>
                    <SelectTrigger id="leaveType">
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
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endDate">End Date</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reason">Reason</Label>
                  <Textarea
                    id="reason"
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    placeholder="Enter reason for leave..."
                    required
                  />
                </div>

                <Button type="submit" className="w-full">Submit Application</Button>
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
                    <p className="text-sm text-gray-600">{leave.employee.designation.name}</p>
                  </div>
                  <Badge className={statusColors[leave.status as keyof typeof statusColors]}>
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {leave.status.replace('_', ' ')}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center space-x-4 text-sm">
                    <span><strong>Type:</strong> {leave.leaveType}</span>
                    <span><strong>From:</strong> {new Date(leave.startDate).toLocaleDateString()}</span>
                    <span><strong>To:</strong> {new Date(leave.endDate).toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm"><strong>Reason:</strong> {leave.reason}</p>
                  <p className="text-sm text-gray-600">
                    <strong>Applied:</strong> {new Date(leave.appliedAt).toLocaleDateString()}
                  </p>

                  {leave.rejectionReason && (
                    <div className="p-2 bg-red-50 rounded text-sm text-red-800">
                      <strong>Rejection Reason:</strong> {leave.rejectionReason}
                    </div>
                  )}

                  {canApprove(leave.status) && (
                    <div className="flex space-x-2 pt-2">
                      <Button
                        size="sm"
                        onClick={() => handleApproval(leave.id, getNextStatus(leave.status)!)}
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
