import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { db, Withdrawal } from '../lib/firebase'
import { 
  collection, 
  query, 
  orderBy, 
  getDocs, 
  where,
  addDoc,
  onSnapshot
} from 'firebase/firestore'
import { 
  DollarSign, 
  Clock, 
  CheckCircle, 
  X, 
  Plus
} from 'lucide-react'

export default function Withdrawals() {
  const { profile } = useAuth()
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([])
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [requestForm, setRequestForm] = useState({
    amount: '',
    paymentMethod: 'easypaisa',
    paymentDetails: ''
  })
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (profile?.is_approved) {
      fetchWithdrawals()
      setupRealTimeListeners()
    } else {
      setLoading(false)
    }
  }, [profile])

  const fetchWithdrawals = async () => {
    try {
      const withdrawalsQuery = query(
        collection(db, 'withdrawals'),
        where('worker_id', '==', profile?.id),
        orderBy('requested_at', 'desc')
      )
      const withdrawalsSnapshot = await getDocs(withdrawalsQuery)
      const withdrawalsData = withdrawalsSnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      })) as Withdrawal[]

      setWithdrawals(withdrawalsData)
    } catch (error) {
      console.error('Error fetching withdrawals:', error)
    } finally {
      setLoading(false)
    }
  }

  const setupRealTimeListeners = () => {
    if (!profile?.id) return

    // Real-time listener for withdrawals
    const withdrawalsQuery = query(
      collection(db, 'withdrawals'),
      where('worker_id', '==', profile.id),
      orderBy('requested_at', 'desc')
    )
    
    const unsubscribeWithdrawals = onSnapshot(withdrawalsQuery, (snapshot) => {
      const withdrawalsData = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      })) as Withdrawal[]
      setWithdrawals(withdrawalsData)
    })

    // Cleanup function
    return () => {
      unsubscribeWithdrawals()
    }
  }

  const handleRequestWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      await addDoc(collection(db, 'withdrawals'), {
        worker_id: profile?.id,
        amount: parseFloat(requestForm.amount),
        payment_method: requestForm.paymentMethod,
        payment_details: requestForm.paymentDetails,
        status: 'pending',
        requested_at: new Date().toISOString()
      })

      setShowRequestModal(false)
      setRequestForm({ amount: '', paymentMethod: 'easypaisa', paymentDetails: '' })
    } catch (error) {
      console.error('Error requesting withdrawal:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const availableBalance = profile?.total_earnings || 0
  const pendingAmount = withdrawals
    .filter(w => w.status === 'pending')
    .reduce((sum, w) => sum + w.amount, 0)

  if (!profile?.is_approved) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Account Pending Approval</h2>
        <p className="text-gray-600 max-w-md mx-auto">
          Your account is currently under review. You'll be able to access withdrawals once 
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

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Withdrawal Management</h1>
        <p className="text-gray-600 mt-1">Request withdrawals and track your payment history</p>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-teal-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-teal-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Available Balance</h3>
              <p className="text-2xl font-bold text-gray-900">${availableBalance}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Pending Withdrawal</h3>
              <p className="text-2xl font-bold text-gray-900">${pendingAmount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <button
            onClick={() => setShowRequestModal(true)}
            disabled={availableBalance <= 0}
            className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200 flex items-center justify-center"
          >
            <Plus className="h-5 w-5 mr-2" />
            Request Withdrawal
          </button>
        </div>
      </div>

      {/* Withdrawal History */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Withdrawal History</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {withdrawals.length === 0 ? (
            <div className="text-center py-12">
              <DollarSign className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No withdrawals yet</h3>
              <p className="text-gray-600">Request your first withdrawal to get started</p>
            </div>
          ) : (
            withdrawals.map((withdrawal) => (
              <div key={withdrawal.id} className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <span className="text-lg font-semibold text-gray-900">
                        ${withdrawal.amount}
                      </span>
                      <span className={`ml-3 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        withdrawal.status === 'approved' 
                          ? 'bg-green-100 text-green-800'
                          : withdrawal.status === 'rejected'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {withdrawal.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 capitalize mb-1">
                      <strong>Method:</strong> {withdrawal.payment_method}
                    </p>
                    <p className="text-sm text-gray-600">
                      <strong>Details:</strong> {withdrawal.payment_details}
                    </p>
                  </div>
                  <div className="mt-4 sm:mt-0 text-sm text-gray-500">
                    <p>Requested: {new Date(withdrawal.requested_at).toLocaleDateString()}</p>
                    {withdrawal.processed_at && (
                      <p>Processed: {new Date(withdrawal.processed_at).toLocaleDateString()}</p>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Request Withdrawal Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Request Withdrawal</h3>
              <button
                onClick={() => setShowRequestModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleRequestWithdrawal} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount (Available: ${availableBalance})
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  max={availableBalance}
                  required
                  value={requestForm.amount}
                  onChange={(e) => setRequestForm({ ...requestForm, amount: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Method
                </label>
                <select
                  value={requestForm.paymentMethod}
                  onChange={(e) => setRequestForm({ ...requestForm, paymentMethod: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="easypaisa">EasyPaisa</option>
                  <option value="jazzcash">JazzCash</option>
                  <option value="bank">Bank Transfer</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Account Details
                </label>
                <textarea
                  required
                  placeholder="Enter your account number, name, etc."
                  value={requestForm.paymentDetails}
                  onChange={(e) => setRequestForm({ ...requestForm, paymentDetails: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowRequestModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitting ? 'Requesting...' : 'Request Withdrawal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}