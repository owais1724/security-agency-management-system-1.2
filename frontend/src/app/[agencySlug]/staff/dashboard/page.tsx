"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CalendarDays, Users, Clock, TrendingUp, Briefcase, Award } from "lucide-react"
import api from "@/lib/api"
import { toast } from "sonner"

export default function StaffDashboard() {
  const router = useRouter()
  const { agencySlug } = useParams()
  const [userStats, setUserStats] = useState({
    totalStaff: 0,
    presentToday: 0,
    absentToday: 0,
    onLeave: 0,
    activeProjects: 0,
    completedTasks: 0
  })
  const [recentActivities, setRecentActivities] = useState([])
  const [topPerformers, setTopPerformers] = useState([])
  const [userPermissions, setUserPermissions] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      // Fetch user info with permissions
      let userData: any = null;
      try {
        const userResponse = await api.get('/auth/me')
        userData = userResponse.data
        setUserPermissions(userData.permissions || [])
      } catch (e) {
        console.error("Failed to fetch user permissions", e)
        setLoading(false)
        return // Stop further requests if auth fails
      }


      // Fetch real data from APIs individually based on permissions
      let employees = []
      let attendance = []
      let projects = []
      let leaves = []

      // 1. Employees (Personnel) - Typically HR/Admin only
      // 1. Employees (Personnel) - Typically HR/Admin/Supervisor
      const isPrivileged = userData?.role?.toLowerCase().includes('admin') ||
        userData?.role?.toLowerCase().includes('hr') ||
        userData?.role?.toLowerCase().includes('supervisor');

      if (userData?.permissions?.includes('view_attendance') || isPrivileged) {
        try {
          const res = await api.get('/employees')
          employees = res.data || []
        } catch (e: any) {
          console.error("Employees API failed", e.response?.status)
        }
      }

      // 2. Attendance - Staff can always view their own logs (handled by backend now)
      try {
        const res = await api.get('/attendance?today=true')
        attendance = res.data || []
      } catch (e: any) {
        console.error("Attendance API failed", e.response?.status)
      }

      // 3. Projects - Visible to staff if they need to check-in
      if (userData?.permissions?.includes('view_projects') || isPrivileged) {
        try {
          const res = await api.get('/projects')
          projects = res.data || []
        } catch (e: any) {
          console.error("Projects API failed", e.response?.status)
        }
      }

      // 4. Leaves
      if (userData?.permissions?.includes('view_leaves') || isPrivileged) {
        try {
          const res = await api.get('/leaves')
          leaves = res.data || []
        } catch (e: any) {
          console.error("Leaves API failed", e.response?.status)
        }
      }

      // Calculate real statistics
      const presentToday = attendance.filter((a: any) => a.status === 'PRESENT').length
      const absentToday = attendance.filter((a: any) => a.status === 'ABSENT').length
      const onLeave = leaves.filter((l: any) =>
        new Date(l.startDate) <= new Date() &&
        new Date(l.endDate) >= new Date() &&
        l.status === 'AGENCY_APPROVED'
      ).length
      const activeProjects = projects.filter((p: any) => p.isActive).length

      setUserStats({
        totalStaff: employees.length,
        presentToday,
        absentToday,
        onLeave,
        activeProjects,
        completedTasks: 0
      })

      // Set recent activities
      const activities = attendance.slice(0, 4).map((record: any) => ({
        type: record.status === 'PRESENT' ? 'checkin' : 'absent',
        title: `${record.employee?.fullName || 'Unknown'} ${record.status === 'PRESENT' ? 'checked in' : 'marked absent'}`,
        time: new Date(record.checkIn || record.date).toLocaleString(),
        icon: record.status === 'PRESENT' ? 'green' : 'red'
      }))
      setRecentActivities(activities)

      // Set top performers
      const performers = employees.slice(0, 3).map((emp: any) => ({
        name: emp.fullName,
        designation: emp.designation?.name || 'Staff',
        attendance: '95%',
        projects: (emp.assignedProjects?.length || 0).toString(),
        tasks: '0',
        initials: emp.fullName.split(' ').map((n: any) => n[0]).join('').toUpperCase()
      }))
      setTopPerformers(performers)
    } catch (error: any) {
      console.error('Critical failure in fetchDashboardData:', error)
      toast.error(`Dashboard error: ${error.response?.status || error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    {
      title: "Total Staff",
      value: userStats.totalStaff,
      icon: Users,
      color: "bg-blue-100 text-blue-800",
      trend: userStats.totalStaff > 0 ? "Active employees" : "No staff yet"
    },
    {
      title: "Present Today",
      value: userStats.presentToday,
      icon: Clock,
      color: "bg-green-100 text-green-800",
      trend: userStats.totalStaff > 0 ? `${Math.round((userStats.presentToday / userStats.totalStaff) * 100)}% attendance` : "No data"
    },
    {
      title: "On Leave",
      value: userStats.onLeave,
      icon: CalendarDays,
      color: "bg-yellow-100 text-yellow-800",
      trend: userStats.onLeave > 0 ? `${userStats.onLeave} staff members` : "None on leave"
    },
    {
      title: "Active Projects",
      value: userStats.activeProjects,
      icon: Briefcase,
      color: "bg-purple-100 text-purple-800",
      trend: userStats.activeProjects > 0 ? "Ongoing projects" : "No active projects"
    }
  ]

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading dashboard...</div>
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Staff Dashboard</h1>
          <p className="text-gray-600">Welcome back! Here's what's happening at your agency.</p>
        </div>
        <Badge className="bg-green-100 text-green-800">
          System Online
        </Badge>
      </div>

      {/* User Permissions Display */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Your Permissions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {userPermissions.length > 0 ? (
              userPermissions.map((permission: string, index: number) => (
                <Badge key={index} className="bg-blue-100 text-blue-800">
                  {permission.replace('_', ' ')}
                </Badge>
              ))
            ) : (
              <p className="text-gray-500">No permissions assigned</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  {stat.trend}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>Recent Activity</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.length > 0 ? (
                recentActivities.map((activity: any, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className={`w-2 h-2 bg-${activity.icon}-500 rounded-full`}></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{activity.title}</p>
                      <p className="text-xs text-gray-500">{activity.time}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">No recent activity</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Award className="h-5 w-5" />
              <span>Staff Members</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topPerformers.length > 0 ? (
                topPerformers.map((performer: any, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                        {performer.initials}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{performer.name}</p>
                        <p className="text-xs text-gray-500">{performer.designation}</p>
                      </div>
                    </div>
                    <Badge className="bg-green-100 text-green-800">
                      Active
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">No staff members found</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {(userPermissions.includes('mark_attendance') || userPermissions.includes('view_attendance')) && (
              <Button variant="outline" className="h-20 flex-col space-y-2" onClick={() => router.push(`/${agencySlug}/attendance`)}>
                <Clock className="h-6 w-6" />
                <span className="text-sm">Attendance</span>
              </Button>
            )}
            {userPermissions.includes('create_personnel') && (
              <Button variant="outline" className="h-20 flex-col space-y-2" onClick={() => router.push(`/${agencySlug}/personnel`)}>
                <Users className="h-6 w-6" />
                <span className="text-sm">View Staff</span>
              </Button>
            )}
            {userPermissions.includes('create_project') && (
              <Button variant="outline" className="h-20 flex-col space-y-2" onClick={() => router.push(`/${agencySlug}/projects`)}>
                <Briefcase className="h-6 w-6" />
                <span className="text-sm">Projects</span>
              </Button>
            )}
            {userPermissions.includes('view_reports') && (
              <Button variant="outline" className="h-20 flex-col space-y-2">
                <TrendingUp className="h-6 w-6" />
                <span className="text-sm">Reports</span>
              </Button>
            )}
            {userPermissions.includes('apply_leave') && (
              <Button variant="outline" className="h-20 flex-col space-y-2" onClick={() => router.push(`/${agencySlug}/leaves`)}>
                <CalendarDays className="h-6 w-6" />
                <span className="text-sm">Leave</span>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
