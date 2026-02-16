"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Wallet, Plus, Download, Eye, Calculator, CheckCircle2, AlertCircle, Calendar, Filter } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import api from "@/lib/api"
import { toast } from "sonner"

interface Payroll {
  id: string
  month: string
  basicSalary: number
  allowances: number
  deductions: number
  netPay: number
  status: string
  generatedDate: string
  employeeId?: string
  employee?: {
    id: string
    fullName: string
    email: string
    designation: {
      id: string
      name: string
    }
  }
}

interface Designation {
  id: string
  name: string
}

const statusColors = {
  DRAFT: "bg-gray-100 text-gray-800",
  PROCESSED: "bg-blue-100 text-blue-800",
  PAID: "bg-green-100 text-green-800"
}

export default function PayrollPage() {
  const { agencySlug } = useParams()
  const [payrolls, setPayrolls] = useState<Payroll[]>([])
  const [designations, setDesignations] = useState<Designation[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)

  // Generation Form
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7))
  const [generateDesignationId, setGenerateDesignationId] = useState<string>("all")
  const [employees, setEmployees] = useState<any[]>([])
  const [generationMode, setGenerationMode] = useState<'bulk' | 'individual'>('bulk')
  const [targetEmployeeId, setTargetEmployeeId] = useState<string>("")
  const [customAmount, setCustomAmount] = useState<string>("")

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [payrollRes, designationRes, employeeRes] = await Promise.all([
        api.get('/payrolls'),
        api.get('/designations'),
        api.get('/employees')
      ])
      setPayrolls(payrollRes.data || [])
      setDesignations(designationRes.data || [])
      setEmployees(employeeRes.data || [])
    } catch (error) {
      console.error('Failed to fetch data:', error)
      toast.error("Failed to load records")
    } finally {
      setLoading(false)
    }
  }

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      if (generationMode === 'bulk') {
        const res = await api.post('/payrolls/generate-bulk', {
          month: selectedMonth,
          designationId: generateDesignationId === "all" ? undefined : generateDesignationId
        })
        toast.success(`Generated payroll for ${res.data} employees`)
      } else {
        if (!targetEmployeeId || !customAmount) {
          toast.error("Please select an employee and enter an amount")
          setGenerating(false)
          return
        }
        await api.post('/payrolls/generate-individual', {
          employeeId: targetEmployeeId,
          month: selectedMonth,
          amount: parseFloat(customAmount)
        })
        toast.success(`Individual payroll generated successfully`)
      }
      setIsDialogOpen(false)
      fetchData()
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Generation failed")
    } finally {
      setGenerating(false)
    }
  }

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      await api.post(`/payrolls/${id}/status`, { status: newStatus })
      toast.success(`Payroll status updated to ${newStatus}`)
      fetchData()
    } catch (error: any) {
      toast.error("Failed to update status")
    }
  }

  const stats = {
    totalNet: payrolls.reduce((acc, p) => acc + p.netPay, 0),
    paidCount: payrolls.filter(p => p.status === 'PAID').length,
    pendingCount: payrolls.filter(p => p.status !== 'PAID').length
  }

  // Group payrolls by designation
  const groupedPayrolls = designations.map(d => ({
    ...d,
    records: payrolls.filter(p => p.employee?.designation?.id === d.id)
  })).filter(group => group.records.length > 0)

  if (loading && payrolls.length === 0) {
    return <div className="flex items-center justify-center h-64">Loading payroll system...</div>
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center">
            <Wallet className="h-8 w-8 mr-3 text-primary" />
            Payroll Management
          </h1>
          <p className="text-slate-500">Manage salary processing by designation or personnel.</p>
        </div>

        <Button onClick={() => setIsDialogOpen(true)} className="bg-primary hover:bg-primary/90">
          <Plus className="h-4 w-4 mr-2" />
          Generate Payroll
        </Button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Total Net Pay</p>
                <h3 className="text-2xl font-bold text-slate-900">${stats.totalNet.toLocaleString()}</h3>
              </div>
              <div className="h-12 w-12 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                <Wallet className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Paid</p>
                <h3 className="text-2xl font-bold text-emerald-600">{stats.paidCount}</h3>
              </div>
              <div className="h-12 w-12 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Pending</p>
                <h3 className="text-2xl font-bold text-amber-600">{stats.pendingCount}</h3>
              </div>
              <div className="h-12 w-12 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center">
                <AlertCircle className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <div className="flex items-center justify-between mb-4 border-b border-slate-200">
          <TabsList className="bg-transparent h-auto p-0 space-x-6">
            <TabsTrigger
              value="all"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 pb-2 font-bold"
            >
              All Payrolls
            </TabsTrigger>
            {designations.map(d => (
              <TabsTrigger
                key={d.id}
                value={d.id}
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 pb-2 font-bold"
              >
                {d.name}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent value="all" className="mt-0">
          <div className="grid gap-4">
            {payrolls.length > 0 ? (
              payrolls.map((p) => <PayrollCard key={p.id} payroll={p} onUpdateStatus={updateStatus} />)
            ) : (
              <EmptyState />
            )}
          </div>
        </TabsContent>

        {designations.map(d => (
          <TabsContent key={d.id} value={d.id} className="mt-0">
            <div className="grid gap-4">
              {payrolls.filter(p => p.employee?.designation?.id === d.id || p.employee?.designation?.name === d.name).length > 0 ? (
                payrolls.filter(p => p.employee?.designation?.id === d.id || p.employee?.designation?.name === d.name)
                  .map((p) => <PayrollCard key={p.id} payroll={p} onUpdateStatus={updateStatus} />)
              ) : (
                <EmptyState message={`No payroll records found for ${d.name}`} />
              )}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* Generation Dialog */}
      {isDialogOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md shadow-2xl border-none">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calculator className="h-5 w-5 mr-2 text-primary" />
                Generate Payroll
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2 p-1 bg-slate-100 rounded-lg mb-2">
                <Button
                  variant={generationMode === 'bulk' ? 'default' : 'ghost'}
                  className="flex-1 text-xs h-8"
                  onClick={() => setGenerationMode('bulk')}
                >
                  Bulk Generation
                </Button>
                <Button
                  variant={generationMode === 'individual' ? 'default' : 'ghost'}
                  className="flex-1 text-xs h-8"
                  onClick={() => setGenerationMode('individual')}
                >
                  Specific Personnel
                </Button>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 font-mono text-[10px] uppercase">Payroll Period</label>
                <Input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-full"
                />
              </div>

              {generationMode === 'bulk' ? (
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 font-mono text-[10px] uppercase">Designation Filter</label>
                  <Select value={generateDesignationId} onValueChange={setGenerateDesignationId}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Designations" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Personnel</SelectItem>
                      {designations.map(d => (
                        <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <p className="text-[11px] text-blue-700">
                      Generating records for <strong>{generateDesignationId === "all" ? "everyone" : designations.find(d => d.id === generateDesignationId)?.name}</strong> based on their base salary.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 font-mono text-[10px] uppercase">Select Employee</label>
                    <Select value={targetEmployeeId} onValueChange={(val) => {
                      setTargetEmployeeId(val);
                      const emp = employees.find(e => e.id === val);
                      if (emp) setCustomAmount(emp.basicSalary?.toString() || "");
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pick an employee..." />
                      </SelectTrigger>
                      <SelectContent>
                        {employees.map(e => (
                          <SelectItem key={e.id} value={e.id}>{e.fullName} ({e.designation?.name})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 font-mono text-[10px] uppercase">Enter Amount ($)</label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value)}
                      className="text-lg font-bold"
                    />
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex space-x-3">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={handleGenerate}
                className="flex-1 bg-primary text-white font-bold"
                disabled={generating}
              >
                {generating ? "Generating..." : "Generate Now"}
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  )
}

function PayrollCard({ payroll, onUpdateStatus }: { payroll: Payroll, onUpdateStatus: (id: string, s: string) => void }) {
  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <div className={`h-1 w-full ${payroll.status === 'PAID' ? 'bg-emerald-500' :
        payroll.status === 'PROCESSED' ? 'bg-blue-500' : 'bg-slate-300'
        }`} />
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-600">
              {payroll.employee?.fullName?.charAt(0) || 'E'}
            </div>
            <div>
              <p className="font-bold text-slate-900">{payroll.employee?.fullName}</p>
              <p className="text-xs text-slate-500">{payroll.employee?.designation.name} • {payroll.month}</p>
            </div>
          </div>
          <Badge className={statusColors[payroll.status as keyof typeof statusColors]}>
            {payroll.status}
          </Badge>
        </div>

        <div className="grid grid-cols-4 gap-2 py-3 border-y border-slate-50">
          <div className="text-center">
            <p className="text-[10px] text-slate-400 font-bold uppercase">Basic</p>
            <p className="text-sm font-semibold">${payroll.basicSalary}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-slate-400 font-bold uppercase">Allowances</p>
            <p className="text-sm font-semibold text-emerald-600">+${payroll.allowances}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-slate-400 font-bold uppercase">Deductions</p>
            <p className="text-sm font-semibold text-red-600">-${payroll.deductions}</p>
          </div>
          <div className="text-center bg-slate-50 rounded">
            <p className="text-[10px] text-slate-400 font-bold uppercase">Net</p>
            <p className="text-sm font-bold text-slate-900">${payroll.netPay}</p>
          </div>
        </div>

        <div className="flex justify-between items-center mt-4">
          <p className="text-[10px] text-slate-400">Generated: {new Date(payroll.generatedDate).toLocaleDateString()}</p>
          <div className="flex space-x-2">
            {payroll.status === 'DRAFT' && (
              <Button size="sm" onClick={() => onUpdateStatus(payroll.id, 'PROCESSED')} className="h-8 text-xs">Process</Button>
            )}
            {payroll.status === 'PROCESSED' && (
              <Button size="sm" onClick={() => onUpdateStatus(payroll.id, 'PAID')} className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white">Mark Paid</Button>
            )}
            <Button size="sm" variant="outline" className="h-8 text-xs"><Download className="h-3 w-3 mr-1" /> Payslip</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function EmptyState({ message = "No payroll records found" }: { message?: string }) {
  return (
    <Card className="border-dashed border-2 bg-slate-50/50">
      <CardContent className="text-center py-12">
        <Wallet className="h-10 w-10 text-slate-200 mx-auto mb-3" />
        <p className="text-slate-500 font-medium">{message}</p>
      </CardContent>
    </Card>
  )
}
