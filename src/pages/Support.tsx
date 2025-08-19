import { MessageCircle, Mail, Phone, HelpCircle } from 'lucide-react'

export default function Support() {
  const whatsappNumber = "+923001234567" // Replace with actual number
  const supportEmail = "support@assignmentpro.com"

  const faqs = [
    {
      question: "How do I get started as a writer?",
      answer: "Register your account, upload your payment screenshot, and wait for admin approval. Once approved, you can start downloading and completing assignments."
    },
    {
      question: "When will I get paid for my work?",
      answer: "Payments are processed within 24-48 hours after your work is approved by our admin team."
    },
    {
      question: "What file formats can I submit?",
      answer: "We accept PDF, DOC, and DOCX formats for assignment submissions."
    },
    {
      question: "How do I request a withdrawal?",
      answer: "Go to the Withdrawals page, click 'Request Withdrawal', enter your payment details, and submit. Withdrawals are processed within 2-3 business days."
    },
    {
      question: "What if my work gets rejected?",
      answer: "If your work is rejected, you can contact support for feedback and resubmit an improved version."
    }
  ]

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Support & Help</h1>
        <p className="text-gray-600 mt-1">Get help with your account and assignments</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Contact Options */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact Us</h2>
            
            <div className="space-y-4">
              <a
                href={`https://wa.me/${whatsappNumber.replace('+', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center p-4 border border-green-200 rounded-lg hover:bg-green-50 transition duration-200"
              >
                <div className="p-2 bg-green-100 rounded-lg">
                  <MessageCircle className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <h3 className="font-semibold text-gray-900">WhatsApp Support</h3>
                  <p className="text-sm text-gray-600">Chat with our support team</p>
                  <p className="text-sm text-green-600 font-medium">{whatsappNumber}</p>
                </div>
              </a>

              <a
                href={`mailto:${supportEmail}`}
                className="flex items-center p-4 border border-blue-200 rounded-lg hover:bg-blue-50 transition duration-200"
              >
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Mail className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <h3 className="font-semibold text-gray-900">Email Support</h3>
                  <p className="text-sm text-gray-600">Send us an email</p>
                  <p className="text-sm text-blue-600 font-medium">{supportEmail}</p>
                </div>
              </a>

              <div className="flex items-center p-4 border border-gray-200 rounded-lg">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <Phone className="h-6 w-6 text-gray-600" />
                </div>
                <div className="ml-4">
                  <h3 className="font-semibold text-gray-900">Support Hours</h3>
                  <p className="text-sm text-gray-600">Monday - Friday: 9 AM - 6 PM</p>
                  <p className="text-sm text-gray-600">Saturday - Sunday: 10 AM - 4 PM</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Frequently Asked Questions
          </h2>
          
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <details key={index} className="group">
                <summary className="flex items-center justify-between p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition duration-200">
                  <span className="font-medium text-gray-900">{faq.question}</span>
                  <HelpCircle className="h-5 w-5 text-gray-400 group-open:text-blue-600 transition-colors" />
                </summary>
                <div className="mt-2 p-4 bg-gray-50 rounded-lg">
                  <p className="text-gray-600 text-sm">{faq.answer}</p>
                </div>
              </details>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Help Tips */}
      <div className="mt-8 bg-blue-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Tips</h3>
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Before Submitting Work:</h4>
            <ul className="space-y-1 text-gray-600">
              <li>• Double-check your work for quality</li>
              <li>• Ensure proper formatting</li>
              <li>• Save in the correct file format</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Payment Issues:</h4>
            <ul className="space-y-1 text-gray-600">
              <li>• Check your account balance</li>
              <li>• Verify payment details</li>
              <li>• Contact support if delayed</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}