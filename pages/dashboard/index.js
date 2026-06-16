import Layout from '../../components/Layout'

export default function Dashboard() {
  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <h1 className="text-3xl font-bold mb-2">My Dashboard</h1>
          <p className="text-gray-600 mb-8">Welcome back to ITRGenie</p>
          
          {/* Stats Cards */}
          <div className="grid md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white p-6 rounded-lg shadow">
              <p className="text-gray-500 text-sm">ITR Status</p>
              <p className="text-2xl font-bold text-green-600">Not Filed</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <p className="text-gray-500 text-sm">Estimated Refund</p>
              <p className="text-2xl font-bold">₹0</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <p className="text-gray-500 text-sm">FY 2024-25</p>
              <p className="text-2xl font-bold">AY 2025-26</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <p className="text-gray-500 text-sm">Documents</p>
              <p className="text-2xl font-bold">0</p>
            </div>
          </div>
          
          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
            <div className="grid md:grid-cols-3 gap-4">
              <button className="bg-primary text-white py-3 rounded-lg font-semibold hover:bg-blue-700">
                Start New Filing
              </button>
              <button className="bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300">
                Upload Documents
              </button>
              <button className="bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300">
                Download Forms
              </button>
            </div>
          </div>
          
          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow p-6 mt-8">
            <h2 className="text-xl font-bold mb-4">Recent Activity</h2>
            <p className="text-gray-500 text-center py-8">No recent activity. Start your first filing!</p>
          </div>
        </div>
      </div>
    </Layout>
  )
}