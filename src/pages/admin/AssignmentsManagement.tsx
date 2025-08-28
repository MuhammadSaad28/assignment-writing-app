import { useState, useEffect } from 'react'
import { db, storage } from '../../lib/firebase'
import { 
  collection, 
  getDocs,
  addDoc,
  updateDoc,
  doc,
  deleteDoc,
  onSnapshot
} from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { 
  Plus,
  Edit,
  Trash2,
  Download,
  Eye,
  XCircle,
  CheckCircle,
  AlertCircle,
  Briefcase
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

export default function AssignmentsManagement() {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null)
  const [uploading, setUploading] = useState(false)
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    payment_amount: '',
    file: null as File | null,
    status: 'active' as 'active' | 'inactive'
  })

  useEffect(() => {
    fetchAssignments()
    setupRealTimeListener()
  }, [])

  const fetchAssignments = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'assignments'))
      const assignmentsData = querySnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      })) as Assignment[]
      setAssignments(assignmentsData)
    } catch (error) {
      console.error('Error fetching assignments:', error)
    } finally {
      setLoading(false)
    }
  }

  const setupRealTimeListener = () => {
    const unsubscribe = onSnapshot(collection(db, 'assignments'), (snapshot) => {
      const assignmentsData = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      })) as Assignment[]
      setAssignments(assignmentsData)
    })

    return () => unsubscribe()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setUploading(true)

    try {
      let fileURL = editingAssignment?.file_url || ''

      // Upload new file if provided
      if (formData.file) {
        const storageRef = ref(storage, `assignments/${Date.now()}-${formData.file.name}`)
        await uploadBytes(storageRef, formData.file)
        fileURL = await getDownloadURL(storageRef)
      }

      const assignmentData = {
        title: formData.title,
        description: formData.description,
        payment_amount: parseFloat(formData.payment_amount),
        file_url: fileURL,
        status: formData.status,
        created_at: editingAssignment?.created_at || new Date().toISOString()
      }

      if (editingAssignment) {
        // Update existing assignment
        await updateDoc(doc(db, 'assignments', editingAssignment.id), assignmentData)
      } else {
        // Create new assignment
        await addDoc(collection(db, 'assignments'), assignmentData)
      }

      resetForm()
    } catch (error) {
      console.error('Error saving assignment:', error)
    } finally {
      setUploading(false)
    }
  }

  const handleEdit = (assignment: Assignment) => {
    setEditingAssignment(assignment)
    setFormData({
      title: assignment.title,
      description: assignment.description,
      payment_amount: assignment.payment_amount.toString(),
      file: null,
      status: assignment.status
    })
    setShowForm(true)
  }

  const handleDelete = async (assignment: Assignment) => {
    if (window.confirm('Are you sure you want to delete this assignment? This action cannot be undone.')) {
      try {
        // Delete the file from storage if it exists
        if (assignment.file_url) {
          try {
            const fileRef = ref(storage, assignment.file_url)
            await deleteObject(fileRef)
          } catch (error) {
            console.log('File not found in storage, continuing with deletion')
          }
        }

        // Delete the document
        await deleteDoc(doc(db, 'assignments', assignment.id))
      } catch (error) {
        console.error('Error deleting assignment:', error)
      }
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      payment_amount: '',
      file: null,
      status: 'active'
    })
    setEditingAssignment(null)
    setShowForm(false)
  }

  const toggleAssignmentStatus = async (assignment: Assignment) => {
    try {
      const newStatus = assignment.status === 'active' ? 'inactive' : 'active'
      await updateDoc(doc(db, 'assignments', assignment.id), {
        status: newStatus
      })
    } catch (error) {
      console.error('Error updating assignment status:', error)
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
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Assignments Management</h1>
          <p className="text-gray-600 mt-1">Create and manage assignments for workers</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition flex items-center space-x-2"
        >
          <Plus className="h-5 w-5" />
          <span>Add Assignment</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Briefcase className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Total Assignments</h3>
              <p className="text-2xl font-bold text-gray-900">{assignments.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Active</h3>
              <p className="text-2xl font-bold text-gray-900">
                {assignments.filter(a => a.status === 'active').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-gray-100 rounded-lg">
              <AlertCircle className="h-6 w-6 text-gray-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Inactive</h3>
              <p className="text-2xl font-bold text-gray-900">
                {assignments.filter(a => a.status === 'inactive').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Assignments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {assignments.map((assignment) => (
          <div key={assignment.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                  {assignment.title}
                </h3>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  assignment.status === 'active' 
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {assignment.status}
                </span>
              </div>
              
              <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                {assignment.description}
              </p>
              
              <div className="flex justify-between items-center mb-4">
                <span className="text-lg font-bold text-green-600">
                  ${assignment.payment_amount}
                </span>
                <span className="text-sm text-gray-500">
                  {new Date(assignment.created_at).toLocaleDateString()}
                </span>
              </div>

              <div className="flex justify-between items-center space-x-2">
                <a
                  href={assignment.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 bg-blue-50 text-blue-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-100 transition flex items-center justify-center space-x-1"
                >
                  <Download className="h-4 w-4" />
                  <span>Download</span>
                </a>
                
                <button
                  onClick={() => toggleAssignmentStatus(assignment)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                    assignment.status === 'active'
                      ? 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100'
                      : 'bg-green-50 text-green-700 hover:bg-green-100'
                  }`}
                >
                  {assignment.status === 'active' ? 'Deactivate' : 'Activate'}
                </button>
              </div>

              <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
                <button
                  onClick={() => handleEdit(assignment)}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center space-x-1"
                >
                  <Edit className="h-4 w-4" />
                  <span>Edit</span>
                </button>
                
                <button
                  onClick={() => handleDelete(assignment)}
                  className="text-red-600 hover:text-red-800 text-sm font-medium flex items-center space-x-1"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Assignment Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900">
                {editingAssignment ? 'Edit Assignment' : 'Create New Assignment'}
              </h3>
              <button
                onClick={resetForm}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter assignment title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={4}
                  placeholder="Enter detailed assignment description"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Payment Amount ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.payment_amount}
                    onChange={(e) => setFormData({ ...formData, payment_amount: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assignment File {!editingAssignment && '(Required)'}
                </label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.txt"
                  onChange={(e) => setFormData({ ...formData, file: e.target.files?.[0] || null })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {editingAssignment && (
                  <p className="text-sm text-gray-500 mt-1">
                    Leave empty to keep the current file
                  </p>
                )}
              </div>

              <div className="flex justify-end space-x-3 pt-6">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition"
                >
                  {uploading ? 'Saving...' : (editingAssignment ? 'Update Assignment' : 'Create Assignment')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
