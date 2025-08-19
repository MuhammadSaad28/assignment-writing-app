import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase, Assignment, Submission } from '../lib/supabase'
import FileUpload from '../components/FileUpload'
import { 
  Download, 
  Upload, 
  DollarSign, 
  Calendar,
  CheckCircle,
  Clock,
  X
} from 'lucide-react'

export default function Assignments() {
  const { profile } = useAuth()
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const { data: assignmentsData } = await supabase
        .from('assignments')
        .select('*')
        .order('created_at', { ascending: false })

      const { data: submissionsData } = await supabase
        .from('submissions')
        .select('*')
        .eq('worker_id', profile?.id)

      setAssignments(assignmentsData || [])
      setSubmissions(submissionsData || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitWork = async () => {
    if (!uploadFile || !selectedAssignment) return

    setSubmitting(true)
    try {
      // In a real app, you'd upload the file to storage first
      const { error } = await supabase
        .from('submissions')
        .insert([{
          assignment_id: selectedAssignment.id,
          worker_id: profile?.id,
          file_url: `uploads/${uploadFile.name}`, // Mock URL
          status: 'pending'
        }])

      if (error) throw error

      // Refresh submissions
      fetchData()
      setShowUploadModal(false)
      setUploadFile(null)
      setSelectedAssignment(null)
    } catch (error) {
      console.error('Error submitting work:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const getSubmissionStatus = (assignmentId: string) => {
    return submissions.find(s => s.assignment_id === assignmentId)
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
        <h1 className="text-2xl font-bold text-gray-900">Available Assignments</h1>
        <p className="text-gray-600 mt-1">Download assignments and submit your completed work</p>
      </div>

      <div className="grid gap-6">
        {assignments.map((assignment) => {
          const submission = getSubmissionStatus(assignment.id)
          
          return (
            <div key={assignment.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {assignment.title}
                  </h3>
                  <p className="text-gray-600 mb-4">{assignment.description}</p>
                  
                  <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                    <div className="flex items-center">
                      <DollarSign className="h-4 w-4 mr-1 text-teal-600" />
                      ${assignment.payment_amount}
                    </div>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                      {new Date(assignment.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <div className="mt-4 sm:mt-0 sm:ml-6 flex flex-col sm:flex-row gap-2">
                  {submission ? (
                    <div className="flex items-center">
                      {submission.status === 'approved' ? (
                        <div className="flex items-center text-green-600">
                          <CheckCircle className="h-5 w-5 mr-2" />
                          <span className="font-medium">Approved</span>
                        </div>
                      ) : submission.status === 'rejected' ? (
                        <div className="flex items-center text-red-600">
                          <X className="h-5 w-5 mr-2" />
                          <span className="font-medium">Rejected</span>
                        </div>
                      ) : (
                        <div className="flex items-center text-yellow-600">
                          <Clock className="h-5 w-5 mr-2" />
                          <span className="font-medium">Pending Review</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <>
                      <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition duration-200">
                        <Download className="h-4 w-4 mr-2" />
                        Download PDF
                      </button>
                      <button
                        onClick={() => {
                          setSelectedAssignment(assignment)
                          setShowUploadModal(true)
                        }}
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition duration-200"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Submit Work
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Submit Your Work</h3>
              <button
                onClick={() => {
                  setShowUploadModal(false)
                  setUploadFile(null)
                  setSelectedAssignment(null)
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-gray-600 mb-4">
              Assignment: <strong>{selectedAssignment?.title}</strong>
            </p>

            <FileUpload
              onFileSelect={setUploadFile}
              accept=".pdf,.doc,.docx"
              label="Upload your completed work"
              className="mb-6"
            />

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowUploadModal(false)
                  setUploadFile(null)
                  setSelectedAssignment(null)
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitWork}
                disabled={!uploadFile || submitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit Work'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}