import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { 
  Users, 
  Briefcase, 
  DollarSign, 
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react'

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    pendingUsers: 0,
    totalAssignments: 0,
    pendingSubmissions: 0,
    approvedSubmissions: 0,
    pendingWithdrawals: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const [
        { count: totalUsers },
        { count: pendingUsers },
        { count: totalAssignments },
        { count: pendingSubmissions },
        { count: approvedSubmissions },
        { count: pendingWithdrawals }
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_approved', false),
        supabase.from('assignments').select('*', { count: 'exact', head: true }),
        supabase.from('submissions').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('submissions').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
        supabase.from('withdrawals').select('*', { count: 'exact', head: true }).eq('status', 'pending')
      ])

      setStats({
        totalUsers: totalUsers || 0,
        pendingUsers: pendingUsers || 0,
        totalAssignments: totalAssignments || 0,
        pendingSubmissions: pendingSubmissions || 0,
        approvedSubmissions: approvedSubmissions || 0,
        pendingWithdrawals: pendingWithdrawals || 0
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-1">Overview of platform activity and pending actions</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Total Users</h3>
              <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Pending Approvals</h3>
              <p className="text-2xl font-bold text-gray-900">{stats.pendingUsers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-teal-100 rounded-lg">
              <Briefcase className="h-6 w-6 text-teal-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Total Assignments</h3>
              <p className="text-2xl font-bold text-gray-900">{stats.totalAssignments}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Clock className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Pending Submissions</h3>
              <p className="text-2xl font-bold text-gray-900">{stats.pendingSubmissions}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Approved Work</h3>
              <p className="text-2xl font-bold text-gray-900">{stats.approvedSubmissions}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Pending Withdrawals</h3>
              <p className="text-2xl font-bold text-gray-900">{stats.pendingWithdrawals}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition duration-200 text-left">
            <div className="flex items-center mb-2">
              <Users className="h-5 w-5 text-blue-600 mr-2" />
              <span className="font-medium">User Approvals</span>
            </div>
            <p className="text-sm text-gray-600">{stats.pendingUsers} users waiting</p>
          </button>

          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition duration-200 text-left">
            <div className="flex items-center mb-2">
              <Briefcase className="h-5 w-5 text-teal-600 mr-2" />
              <span className="font-medium">Review Submissions</span>
            </div>
            <p className="text-sm text-gray-600">{stats.pendingSubmissions} submissions pending</p>
          </button>

          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition duration-200 text-left">
            <div className="flex items-center mb-2">
              <DollarSign className="h-5 w-5 text-green-600 mr-2" />
              <span className="font-medium">Process Withdrawals</span>
            </div>
            <p className="text-sm text-gray-600">{stats.pendingWithdrawals} requests pending</p>
          </button>

          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition duration-200 text-left">
            <div className="flex items-center mb-2">
              <Briefcase className="h-5 w-5 text-purple-600 mr-2" />
              <span className="font-medium">Upload Assignment</span>
            </div>
            <p className="text-sm text-gray-600">Add new work</p>
          </button>
        </div>
      </div>
    </div>
  )
}