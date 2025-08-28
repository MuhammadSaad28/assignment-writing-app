import { useState, useEffect } from 'react'
import { db, storage } from '../../lib/firebase'
import { 
  collection, 
  query, 
  getDocs, 
  where,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  deleteDoc
} from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { 
  Users, 
  Briefcase, 
  DollarSign, 
  Clock,
  CheckCircle,
  XCircle,
  Plus,
  Upload,
  Edit,
  Trash2,
  Eye,
  Download
} from 'lucide-react'

interface Assignment {
  id: string
  title: string
  description: string
  file_url: string
  payment_amount: number
  created_at: string
  status: 'active' | 'inactive'
}

interface User {
  id: string
  full_name: string
  email: string
  phone: string
  role: 'worker' | 'admin'
  is_approved: boolean
  total_earnings: number
  created_at: string
}

interface Submission {
  id: string
  assignment_id: string
  worker_id: string
  file_url: string
  status: 'pending' | 'approved' | 'rejected'
  submitted_at: string
  worker_name?: string
  assignment_title?: string
}

interface Withdrawal {
  id: string
  worker_id: string
  amount: number
  payment_method: string
  payment_details: string
  status: 'pending' | 'approved' | 'rejected'
  requested_at: string
  worker_name?: string
}

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    pendingUsers: 0,
    totalAssignments: 0,
    pendingSubmissions: 0,
    approvedSubmissions: 0,
    pendingWithdrawals: 0
  })
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('dashboard')
  
  // Assignment form state
  const [showAssignmentForm, setShowAssignmentForm] = useState(false)
  const [assignmentForm, setAssignmentForm] = useState({
    title: '',
    description: '',
    payment_amount: '',
    file: null as File | null
  })
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    fetchData()
    setupRealTimeListeners()
  }, [])

  const fetchData = async () => {
    try {
      const [profilesSnapshot, assignmentsSnapshot, submissionsSnapshot, withdrawalsSnapshot] = await Promise.all([
        getDocs(collection(db, 'profiles')),
        getDocs(collection(db, 'assignments')),
        getDocs(collection(db, 'submissions')),
        getDocs(collection(db, 'withdrawals'))
      ])

      const profiles = profilesSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as User[]
      const assignmentsData = assignmentsSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as Assignment[]
      const submissionsData = submissionsSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as Submission[]
      const withdrawalsData = withdrawalsSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as Withdrawal[]

      setUsers(profiles)
      setAssignments(assignmentsData)
      setSubmissions(submissionsData)
      setWithdrawals(withdrawalsData)

      setStats({
        totalUsers: profiles.length,
        pendingUsers: profiles.filter(p => !p.is_approved).length,
        totalAssignments: assignmentsData.length,
        pendingSubmissions: submissionsData.filter(s => s.status === 'pending').length,
        approvedSubmissions: submissionsData.filter(s => s.status === 'approved').length,
        pendingWithdrawals: withdrawalsData.filter(w => w.status === 'pending').length
      })
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const setupRealTimeListeners = () => {
    // Real-time listeners for all collections
    const unsubscribeProfiles = onSnapshot(collection(db, 'profiles'), (snapshot) => {
      const profiles = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as User[]
      setUsers(profiles)
      setStats(prev => ({
        ...prev,
        totalUsers: profiles.length,
        pendingUsers: profiles.filter(p => !p.is_approved).length
      }))
    })

    const unsubscribeAssignments = onSnapshot(collection(db, 'assignments'), (snapshot) => {
      const assignmentsData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as Assignment[]
      setAssignments(assignmentsData)
      setStats(prev => ({
        ...prev,
        totalAssignments: assignmentsData.length
      }))
    })

    const unsubscribeSubmissions = onSnapshot(collection(db, 'submissions'), (snapshot) => {
      const submissionsData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as Submission[]
      setSubmissions(submissionsData)
      setStats(prev => ({
        ...prev,
        pendingSubmissions: submissionsData.filter(s => s.status === 'pending').length,
        approvedSubmissions: submissionsData.filter(s => s.status === 'approved').length
      }))
    })

    const unsubscribeWithdrawals = onSnapshot(collection(db, 'withdrawals'), (snapshot) => {
      const withdrawalsData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as Withdrawal[]
      setWithdrawals(withdrawalsData)
      setStats(prev => ({
        ...prev,
        pendingWithdrawals: withdrawalsData.filter(w => w.status === 'pending').length
      }))
    })

    return () => {
      unsubscribeProfiles()
      unsubscribeAssignments()
      unsubscribeSubmissions()
      unsubscribeWithdrawals()
    }
  }

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!assignmentForm.file) return

    setUploading(true)
    try {
      // Upload assignment file
      const storageRef = ref(storage, `assignments/${Date.now()}-${assignmentForm.file.name}`)
      await uploadBytes(storageRef, assignmentForm.file)
      const fileURL = await getDownloadURL(storageRef)

      // Create assignment document
      await addDoc(collection(db, 'assignments'), {
        title: assignmentForm.title,
        description: assignmentForm.description,
        payment_amount: parseFloat(assignmentForm.payment_amount),
        file_url: fileURL,
        status: 'active',
        created_at: new Date().toISOString()
      })

      setShowAssignmentForm(false)
      setAssignmentForm({ title: '', description: '', payment_amount: '', file: null })
    } catch (error) {
      console.error('Error creating assignment:', error)
    } finally {
      setUploading(false)
    }
  }

  const handleApproveUser = async (userId: string) => {
    try {
      await updateDoc(doc(db, 'profiles', userId), {
        is_approved: true
      })
    } catch (error) {
      console.error('Error approving user:', error)
    }
  }

  const handleRejectUser = async (userId: string) => {
    try {
      await updateDoc(doc(db, 'profiles', userId), {
        is_approved: false
      })
    } catch (error) {
      console.error('Error rejecting user:', error)
    }
  }

  const handleApproveSubmission = async (submissionId: string) => {
    try {
      await updateDoc(doc(db, 'submissions', submissionId), {
        status: 'approved',
        reviewed_at: new Date().toISOString()
      })
    } catch (error) {
      console.error('Error approving submission:', error)
    }
  }

  const handleRejectSubmission = async (submissionId: string) => {
    try {
      await updateDoc(doc(db, 'submissions', submissionId), {
        status: 'rejected',
        reviewed_at: new Date().toISOString()
      })
    } catch (error) {
      console.error('Error rejecting submission:', error)
    }
  }

  const handleApproveWithdrawal = async (withdrawalId: string) => {
    try {
      await updateDoc(doc(db, 'withdrawals', withdrawalId), {
        status: 'approved',
        processed_at: new Date().toISOString()
      })
    } catch (error) {
      console.error('Error approving withdrawal:', error)
    }
  }

  const handleRejectWithdrawal = async (withdrawalId: string) => {
    try {
      await updateDoc(doc(db, 'withdrawals', withdrawalId), {
        status: 'rejected',
        processed_at: new Date().toISOString()
      })
    } catch (error) {
      console.error('Error rejecting withdrawal:', error)
    }
  }

  const handleDeleteAssignment = async (assignmentId: string) => {
    if (window.confirm('Are you sure you want to delete this assignment?')) {
      try {
        await deleteDoc(doc(db, 'assignments', assignmentId))
      } catch (error) {
        console.error('Error deleting assignment:', error)
      }
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
        <p className="text-gray-600 mt-1">Manage your assignment writing platform</p>
      </div>

      {/* Navigation Tabs */}
      <div className="mb-6">
        <nav className="flex space-x-8">
          {[
            { id: 'dashboard', label: 'Overview', icon: Briefcase },
            { id: 'assignments', label: 'Assignments', icon: Upload },
            { id: 'users', label: 'Users', icon: Users },
            { id: 'submissions', label: 'Submissions', icon: CheckCircle },
            { id: 'withdrawals', label: 'Withdrawals', icon: DollarSign }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg font-medium transition ${
                activeTab === id
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span>{label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Dashboard Overview */}
      {activeTab === 'dashboard' && (
        <div>
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
        </div>
      )}

      {/* Assignments Management */}
      {activeTab === 'assignments' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Manage Assignments</h2>
            <button
              onClick={() => setShowAssignmentForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition flex items-center space-x-2"
            >
              <Plus className="h-5 w-5" />
              <span>Add Assignment</span>
            </button>
          </div>

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {assignments.map((assignment) => (
                    <tr key={assignment.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{assignment.title}</div>
                          <div className="text-sm text-gray-500">{assignment.description}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${assignment.payment_amount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          assignment.status === 'active' 
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {assignment.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(assignment.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <a
                          href={assignment.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Download className="h-4 w-4" />
                        </a>
                        <button
                          onClick={() => handleDeleteAssignment(assignment.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Users Management */}
      {activeTab === 'users' && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Manage Users</h2>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Earnings</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{user.full_name}</div>
                        <div className="text-sm text-gray-500">{user.phone}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.role === 'admin' 
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.is_approved 
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {user.is_approved ? 'Approved' : 'Pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${user.total_earnings}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        {!user.is_approved && user.role === 'worker' && (
                          <>
                            <button
                              onClick={() => handleApproveUser(user.id)}
                              className="text-green-600 hover:text-green-900"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleRejectUser(user.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Reject
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Submissions Management */}
      {activeTab === 'submissions' && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Review Submissions</h2>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Worker</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assignment</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {submissions.map((submission) => {
                    const worker = users.find(u => u.id === submission.worker_id)
                    const assignment = assignments.find(a => a.id === submission.assignment_id)
                    
                    return (
                      <tr key={submission.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{worker?.full_name || 'Unknown'}</div>
                          <div className="text-sm text-gray-500">{worker?.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{assignment?.title || 'Unknown'}</div>
                          <div className="text-sm text-gray-500">${assignment?.payment_amount}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            submission.status === 'approved' 
                              ? 'bg-green-100 text-green-800'
                              : submission.status === 'rejected'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {submission.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(submission.submitted_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          <a
                            href={submission.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Download className="h-4 w-4" />
                          </a>
                          {submission.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleApproveSubmission(submission.id)}
                                className="text-green-600 hover:text-green-900"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleRejectSubmission(submission.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                Reject
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Withdrawals Management */}
      {activeTab === 'withdrawals' && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Process Withdrawals</h2>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Worker</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {withdrawals.map((withdrawal) => {
                    const worker = users.find(u => u.id === withdrawal.worker_id)
                    
                    return (
                      <tr key={withdrawal.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{worker?.full_name || 'Unknown'}</div>
                          <div className="text-sm text-gray-500">{worker?.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          ${withdrawal.amount}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                          {withdrawal.payment_method}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {withdrawal.payment_details}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            withdrawal.status === 'approved' 
                              ? 'bg-green-100 text-green-800'
                              : withdrawal.status === 'rejected'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {withdrawal.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          {withdrawal.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleApproveWithdrawal(withdrawal.id)}
                                className="text-green-600 hover:text-green-900"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleRejectWithdrawal(withdrawal.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                Reject
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Assignment Creation Modal */}
      {showAssignmentForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Create New Assignment</h3>
              <button
                onClick={() => setShowAssignmentForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAssignment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={assignmentForm.title}
                  onChange={(e) => setAssignmentForm({ ...assignmentForm, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  required
                  value={assignmentForm.description}
                  onChange={(e) => setAssignmentForm({ ...assignmentForm, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Amount ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={assignmentForm.payment_amount}
                  onChange={(e) => setAssignmentForm({ ...assignmentForm, payment_amount: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assignment File</label>
                <input
                  type="file"
                  required
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => setAssignmentForm({ ...assignmentForm, file: e.target.files?.[0] || null })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAssignmentForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {uploading ? 'Creating...' : 'Create Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}