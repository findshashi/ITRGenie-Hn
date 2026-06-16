"use client"

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Layout from '../../components/Layout'
import { supabase } from '../../lib/supabaseClient'

export default function Signup() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [selectedPlan, setSelectedPlan] = useState('')

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [mobile, setMobile] = useState('')
  const [pan, setPan] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const plan = searchParams.get('plan')
    if (plan === 'self-itr') setSelectedPlan('Self ITR Filing - ₹499')
    else if (plan === 'expert-assisted') setSelectedPlan('Expert Assisted Filing - ₹1,499')
    else if (plan === 'live-expert') setSelectedPlan('Live ITR Filing - ₹2,999')
  }, [searchParams])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Validation
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      setLoading(false)
      return
    }

    if (mobile.length !== 10) {
      setError('Please enter a valid 10-digit mobile number')
      setLoading(false)
      return
    }

    // PAN validation (basic format)
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/
    if (!panRegex.test(pan.toUpperCase())) {
      setError('Please enter a valid PAN (e.g., ABCDE1234F)')
      setLoading(false)
      return
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          mobile: mobile,
          pan: pan.toUpperCase(),
          selected_plan: selectedPlan,
        },
      },
    })

    if (error) {
      setError(error.message)
    } else {
      // Create profile record
      if (data.user) {
        await supabase.from('profiles').insert([
          { 
            id: data.user.id, 
            email, 
            full_name: fullName,
            phone: mobile,
            pan: pan.toUpperCase()
          }
        ])
      }
      alert(`Account created successfully! Please check your email for confirmation.\n\nSelected Plan: ${selectedPlan || 'Not specified'}`)
      router.push('/auth/login')
    }
    setLoading(false)
  }

  // Get plan price display
  const getPlanPrice = () => {
    if (selectedPlan.includes('Self')) return '₹499 + GST'
    if (selectedPlan.includes('Expert')) return '₹1,499 + GST'
    if (selectedPlan.includes('Live')) return '₹2,999 + GST'
    return 'To be confirmed'
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-3xl font-bold text-center mb-2">Create Account</h2>
          <p className="text-gray-600 text-center mb-8">Start filing your ITR with TaxGenie</p>

          {selectedPlan && (
            <div className="mb-4 p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
              <p className="text-sm text-center">
                <span className="font-semibold">Selected Plan:</span> {selectedPlan}
                <br />
                <span className="text-indigo-600 font-semibold">{getPlanPrice()}</span>
              </p>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="block text-gray-700 mb-1 text-sm font-medium">Full Name *</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-indigo-600"
                placeholder="John Doe"
                required
              />
            </div>

            <div className="mb-3">
              <label className="block text-gray-700 mb-1 text-sm font-medium">Email ID *</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-indigo-600"
                placeholder="you@example.com"
                required
              />
            </div>

            <div className="mb-3">
              <label className="block text-gray-700 mb-1 text-sm font-medium">Mobile Number *</label>
              <input
                type="tel"
                value={mobile}
                onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-indigo-600"
                placeholder="9876543210"
                maxLength="10"
                required
              />
              <p className="text-xs text-gray-400 mt-1">10-digit mobile number</p>
            </div>

            <div className="mb-3">
              <label className="block text-gray-700 mb-1 text-sm font-medium">PAN Number *</label>
              <input
                type="text"
                value={pan}
                onChange={(e) => setPan(e.target.value.toUpperCase())}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-indigo-600"
                placeholder="ABCDE1234F"
                maxLength="10"
                required
              />
              <p className="text-xs text-gray-400 mt-1">Enter your 10-digit PAN (e.g., ABCDE1234F)</p>
            </div>

            <div className="mb-3">
              <label className="block text-gray-700 mb-1 text-sm font-medium">Password *</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-indigo-600"
                placeholder="Minimum 6 characters"
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 mb-1 text-sm font-medium">Confirm Password *</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-indigo-600"
                placeholder="Re-enter your password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition disabled:opacity-50"
            >
              {loading ? 'Creating account...' : 'Create Free Account'}
            </button>
          </form>

          <p className="text-center mt-6 text-gray-600 text-sm">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-indigo-600 hover:underline">
              Login
            </Link>
          </p>

          <p className="text-center mt-4 text-xs text-gray-400">
            By signing up, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </Layout>
  )
}
