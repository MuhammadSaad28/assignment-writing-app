import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase, Assignment, Submission } from '../lib/supabase'
import { 
  Briefcase, 
  DollarSign, 
  Upload, 
  CheckCircle, 
  Clock,
  AlertCircle
} from 'lucide-react'

export default function Dashboard() {
  const { profile } = useAuth()
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (profile?.is_approved) {
      fetchData()
    } else {
      setLoading(false)
    }
  }, [profile])

  const fetchData = async () => {
    try {
      // Fetch assignments
      const { data: assignmentsData } = await supabase
        .from('assignments')
        .select('*')
        .order('created_at', { ascending: false })

      // Fetch user's submissions
      const { data: submissionsData } = await supabase
        .from('submissions')
        .select(`
          *,
          assignment:assignments(*)
        `)
        .eq('worker_id', profile?.id)
        .order('submitted_at', { ascending: false })

      setAssignments(assignmentsData || [])
      setSubmissions(submissionsData || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!profile?.is_approved) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="mx-auto h-16 w-16 text-yellow-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Account Pending Approval</h2>
        <p className="text-gray-600 max-w-md mx-auto">
          Your account is currently under review. You'll be able to access assignments once 
          an administrator approves your account.
        </p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const approvedSubmissions = submissions.filter(s => s.status === 'approved')
  const pendingSubmissions = submissions.filter(s => s.status === 'pending')

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {profile?.full_name}!
        </h1>
        <p className="text-gray-600 mt-1">Here's your assignment overview</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Briefcase className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Available</h3>
              <p className="text-2xl font-bold text-gray-900">{assignments.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Pending</h3>
              <p className="text-2xl font-bold text-gray-900">{pendingSubmissions.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Completed</h3>
              <p className="text-2xl font-bold text-gray-900">{approvedSubmissions.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-teal-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-teal-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Earnings</h3>
              <p className="text-2xl font-bold text-gray-900">${profile?.total_earnings || 0}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Recent Assignments */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Recent Assignments</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {assignments.slice(0, 5).map((assignment) => (
              <div key={assignment.id} className="p-6">
                <h4 className="font-semibold text-gray-900 mb-2">{assignment.title}</h4>
                <p className="text-sm text-gray-600 mb-3">{assignment.description}</p>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-teal-600">
                    ${assignment.payment_amount}
                  </span>
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition duration-200">
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Submissions */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Your Submissions</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {submissions.slice(0, 5).map((submission) => (
              <div key={submission.id} className="p-6">
                <h4 className="font-semibold text-gray-900 mb-2">
                  {submission.assignment?.title}
                </h4>
                <div className="flex justify-between items-center">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    submission.status === 'approved' 
                      ? 'bg-green-100 text-green-800'
                      : submission.status === 'rejected'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {submission.status}
                  </span>
                  <span className="text-sm text-gray-500">
                    {new Date(submission.submitted_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}