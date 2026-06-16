import Layout from '../components/Layout'
import { useState, useEffect } from 'react'

export default function Home() {
  // State for the new tax calculator widget
  const [tab, setTab] = useState('simple') // 'simple' or 'detailed'
  // Simple tab fields
  const [ageGroup, setAgeGroup] = useState('below60')
  const [grossIncome, setGrossIncome] = useState(1200000)
  const [deductions, setDeductions] = useState(150000)
  // Detailed tab fields
  const [detSalary, setDetSalary] = useState(0)
  const [detBusiness, setDetBusiness] = useState(0)
  const [detHouse, setDetHouse] = useState(0)
  const [detOther, setDetOther] = useState(0)
  const [det80c, setDet80c] = useState(0)
  const [det80d, setDet80d] = useState(0)
  const [detHRA, setDetHRA] = useState(0)
  const [detHomeLoan, setDetHomeLoan] = useState(0)

  // Tax calculation results
  const [results, setResults] = useState({ oldTax: 0, newTax: 0, oldTaxable: 0, newTaxable: 0, totalDeductionsOld: 0 })

  // Helper: format currency
  const formatCurrency = (amount) => {
    return '₹ ' + Math.round(amount).toLocaleString('en-IN')
  }

  // Surcharge calculation
  const calculateSurcharge = (tax, income) => {
    if (income > 20000000) return tax * 0.25
    if (income > 10000000) return tax * 0.15
    if (income > 5000000) return tax * 0.10
    return 0
  }

  // Old regime tax calculation
  const calculateOldTax = (taxableIncome, age) => {
    let tax = 0
    if (age === 'above80') {
      if (taxableIncome <= 500000) tax = 0
      else if (taxableIncome <= 1000000) tax = (taxableIncome - 500000) * 0.20
      else tax = 100000 + (taxableIncome - 1000000) * 0.30
    } else if (age === 'above60') {
      if (taxableIncome <= 300000) tax = 0
      else if (taxableIncome <= 500000) tax = (taxableIncome - 300000) * 0.05
      else if (taxableIncome <= 1000000) tax = 10000 + (taxableIncome - 500000) * 0.20
      else tax = 110000 + (taxableIncome - 1000000) * 0.30
    } else {
      if (taxableIncome <= 250000) tax = 0
      else if (taxableIncome <= 500000) tax = (taxableIncome - 250000) * 0.05
      else if (taxableIncome <= 1000000) tax = 12500 + (taxableIncome - 500000) * 0.20
      else tax = 112500 + (taxableIncome - 1000000) * 0.30
    }
    if (taxableIncome <= 500000) tax = 0 // rebate under section 87A
    const surcharge = calculateSurcharge(tax, taxableIncome)
    const cess = (tax + surcharge) * 0.04
    return Math.round(tax + surcharge + cess)
  }

  // New regime tax calculation
  const calculateNewTax = (taxableIncome) => {
    let remaining = taxableIncome
    let tax = 0
    const slabs = [
      { limit: 400000, rate: 0 },
      { limit: 800000, rate: 0.05 },
      { limit: 1200000, rate: 0.10 },
      { limit: 1600000, rate: 0.15 },
      { limit: 2000000, rate: 0.20 },
      { limit: 2400000, rate: 0.25 },
      { limit: Infinity, rate: 0.30 }
    ]
    let prevLimit = 0
    for (const slab of slabs) {
      if (remaining > 0) {
        const taxableInSlab = Math.min(remaining, slab.limit - prevLimit)
        tax += taxableInSlab * slab.rate
        remaining -= taxableInSlab
        prevLimit = slab.limit
      }
    }
    if (taxableIncome <= 1200000) tax = 0 // rebate
    const surcharge = calculateSurcharge(tax, taxableIncome)
    const cess = (tax + surcharge) * 0.04
    return Math.round(tax + surcharge + cess)
  }

  // Update results based on active tab
  const updateResults = () => {
    let gross = 0
    let oldDeductions = 0
    let taxableIncomeOld = 0
    let taxableIncomeNew = 0
    let totalOldDed = 0

    if (tab === 'simple') {
      gross = grossIncome
      const totalDed = Math.min(deductions, gross) + 50000 // standard deduction 50k for old regime
      totalOldDed = totalDed
      taxableIncomeOld = Math.max(0, gross - totalDed)
      taxableIncomeNew = Math.max(0, gross - 75000) // new regime standard deduction 75k
    } else {
      // Detailed tab: calculate total income
      const salary = detSalary
      const business = detBusiness
      const house = detHouse
      const other = detOther
      gross = salary + business + house + other
      // Deductions under old regime
      const d80c = Math.min(det80c, 150000)
      const d80d = Math.min(det80d, ageGroup !== 'below60' ? 50000 : 25000)
      const hra = Math.min(detHRA, salary)
      const homeLoan = Math.min(detHomeLoan, 200000)
      totalOldDed = d80c + d80d + hra + homeLoan + 50000
      taxableIncomeOld = Math.max(0, gross - totalOldDed)
      taxableIncomeNew = Math.max(0, gross - 75000)
    }

    const oldTaxVal = calculateOldTax(taxableIncomeOld, ageGroup)
    const newTaxVal = calculateNewTax(taxableIncomeNew)

    setResults({
      oldTax: oldTaxVal,
      newTax: newTaxVal,
      oldTaxable: taxableIncomeOld,
      newTaxable: taxableIncomeNew,
      totalDeductionsOld: totalOldDed
    })
  }

  useEffect(() => {
    updateResults()
  }, [tab, ageGroup, grossIncome, deductions, detSalary, detBusiness, detHouse, detOther, det80c, det80d, detHRA, detHomeLoan])

  const saving = Math.abs(results.oldTax - results.newTax)
  const betterRegime = results.oldTax < results.newTax ? 'Old Regime' : 'New Regime'
  const showSaving = saving > 0 && (tab === 'simple' ? grossIncome > 0 : true)

  return (
    <Layout>
      {/* Hero Section (unchanged) */}
      <section className="bg-gradient-to-br from-gray-900 to-indigo-800 text-white">
        <div className="max-w-7xl mx-auto px-6 py-20 md:py-28 lg:py-32">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center bg-white/20 rounded-full px-4 py-1.5 text-sm backdrop-blur-sm mb-5">
                <i className="fas fa-shield-alt mr-2 text-yellow-300"></i>
                <span>Income Tax e-filing simplified · AY 2026-27</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-extrabold leading-tight">
                File Your ITR with <span className="text-yellow-300">ITRGenie</span>
              </h1>
              <p className="text-lg text-gray-100 mt-5 max-w-lg">
                Automated document upload, draft PDF generation, expert review & end-to-end digital KYC workflow for all ITR forms.
              </p>
              <div className="flex flex-wrap gap-4 mt-8">
                <a href="/auth/signup" className="bg-white text-indigo-700 px-6 py-3 rounded-lg font-semibold shadow-lg hover:bg-gray-100 transition flex items-center">
                  <i className="fas fa-user-plus mr-2"></i> Start Filing Now
                </a>
                <a href="#pricing" className="border border-white/40 px-6 py-3 rounded-lg font-semibold hover:bg-white/10 transition">
                  <i className="fas fa-tag mr-2"></i> View Pricing
                </a>
              </div>
            </div>

            {/* === NEW TAX CALCULATOR WIDGET (replaces old one) === */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 shadow-xl border border-white/20 transition-all duration-300">
              {/* Calculator header */}
              <div className="flex items-center gap-3 mb-4 border-b border-white/20 pb-2">
                <div className="bg-yellow-400 rounded-lg w-8 h-8 flex items-center justify-center">
                  <i className="fas fa-calculator text-indigo-900 text-sm"></i>
                </div>
                <div>
                  <div className="text-white font-medium">ITRGenie Tax Calculator</div>
                  <div className="text-indigo-200 text-xs">AY 2026–27 · FY 2025–26 · Real-time comparison</div>
                </div>
              </div>

              {/* Tab buttons */}
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setTab('simple')}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${tab === 'simple' ? 'bg-indigo-600 text-white' : 'bg-white/10 text-indigo-200 hover:bg-white/20'}`}
                >
                  Quick Calculate
                </button>
                <button
                  onClick={() => setTab('detailed')}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${tab === 'detailed' ? 'bg-indigo-600 text-white' : 'bg-white/10 text-indigo-200 hover:bg-white/20'}`}
                >
                  Detailed Breakdown
                </button>
              </div>

              {/* Simple Tab */}
              {tab === 'simple' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-indigo-200 text-sm mb-1">Age group</label>
                    <select
                      value={ageGroup}
                      onChange={(e) => setAgeGroup(e.target.value)}
                      className="w-full px-3 py-2 bg-white/10 border border-white/30 rounded-lg text-white text-sm focus:outline-none focus:border-yellow-400"
                    >
                      <option value="below60">Below 60 yrs</option>
                      <option value="above60">Senior (60–80)</option>
                      <option value="above80">Super Senior (80+)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-indigo-200 text-sm mb-1">Gross total income</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-300">₹</span>
                      <input
                        type="number"
                        value={grossIncome}
                        onChange={(e) => setGrossIncome(Number(e.target.value) || 0)}
                        className="w-full pl-8 pr-4 py-2 bg-white/10 border border-white/30 rounded-lg text-white text-sm focus:outline-none focus:border-yellow-400"
                        placeholder="e.g. 1200000"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-indigo-200 text-sm mb-1">
                      Chapter VI-A Deductions <span className="text-indigo-400 text-xs">(80C, 80D, HRA, Home Loan, etc.)</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-300">₹</span>
                      <input
                        type="number"
                        value={deductions}
                        onChange={(e) => setDeductions(Number(e.target.value) || 0)}
                        className="w-full pl-8 pr-4 py-2 bg-white/10 border border-white/30 rounded-lg text-white text-sm focus:outline-none focus:border-yellow-400"
                        placeholder="e.g. 150000"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Detailed Tab */}
              {tab === 'detailed' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-indigo-200 text-xs mb-1">Salary income</label>
                      <input type="number" value={detSalary} onChange={(e) => setDetSalary(Number(e.target.value) || 0)} className="w-full px-3 py-2 bg-white/10 border border-white/30 rounded-lg text-white text-sm" />
                    </div>
                    <div>
                      <label className="block text-indigo-200 text-xs mb-1">Business income</label>
                      <input type="number" value={detBusiness} onChange={(e) => setDetBusiness(Number(e.target.value) || 0)} className="w-full px-3 py-2 bg-white/10 border border-white/30 rounded-lg text-white text-sm" />
                    </div>
                    <div>
                      <label className="block text-indigo-200 text-xs mb-1">House property</label>
                      <input type="number" value={detHouse} onChange={(e) => setDetHouse(Number(e.target.value) || 0)} className="w-full px-3 py-2 bg-white/10 border border-white/30 rounded-lg text-white text-sm" />
                    </div>
                    <div>
                      <label className="block text-indigo-200 text-xs mb-1">Other income</label>
                      <input type="number" value={detOther} onChange={(e) => setDetOther(Number(e.target.value) || 0)} className="w-full px-3 py-2 bg-white/10 border border-white/30 rounded-lg text-white text-sm" />
                    </div>
                  </div>
                  <hr className="border-white/20" />
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-indigo-200 text-xs mb-1">80C (max ₹1.5L)</label>
                      <input type="number" value={det80c} onChange={(e) => setDet80c(Number(e.target.value) || 0)} className="w-full px-3 py-2 bg-white/10 border border-white/30 rounded-lg text-white text-sm" />
                    </div>
                    <div>
                      <label className="block text-indigo-200 text-xs mb-1">80D health insurance</label>
                      <input type="number" value={det80d} onChange={(e) => setDet80d(Number(e.target.value) || 0)} className="w-full px-3 py-2 bg-white/10 border border-white/30 rounded-lg text-white text-sm" />
                    </div>
                    <div>
                      <label className="block text-indigo-200 text-xs mb-1">HRA exemption</label>
                      <input type="number" value={detHRA} onChange={(e) => setDetHRA(Number(e.target.value) || 0)} className="w-full px-3 py-2 bg-white/10 border border-white/30 rounded-lg text-white text-sm" />
                    </div>
                    <div>
                      <label className="block text-indigo-200 text-xs mb-1">Home loan interest</label>
                      <input type="number" value={detHomeLoan} onChange={(e) => setDetHomeLoan(Number(e.target.value) || 0)} className="w-full px-3 py-2 bg-white/10 border border-white/30 rounded-lg text-white text-sm" />
                    </div>
                  </div>
                </div>
              )}

              <hr className="border-white/20 my-4" />

              {/* Results cards */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className={`bg-white/10 rounded-xl p-3 text-center transition ${results.oldTax < results.newTax ? 'ring-2 ring-yellow-400' : ''}`}>
                  <div className="text-indigo-200 text-xs">Old regime tax</div>
                  <div className="text-white text-xl font-bold">{formatCurrency(results.oldTax)}</div>
                  {results.oldTax < results.newTax && <div className="text-yellow-300 text-xs mt-1">Best for you</div>}
                </div>
                <div className={`bg-white/10 rounded-xl p-3 text-center transition ${results.newTax < results.oldTax ? 'ring-2 ring-yellow-400' : ''}`}>
                  <div className="text-indigo-200 text-xs">New regime tax</div>
                  <div className="text-white text-xl font-bold">{formatCurrency(results.newTax)}</div>
                  {results.newTax < results.oldTax && <div className="text-yellow-300 text-xs mt-1">Best for you</div>}
                </div>
              </div>

              {/* Detailed summary */}
              <div className="bg-white/5 rounded-xl p-3 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-indigo-300">Particulars</span>
                  <span className="text-indigo-300">Old</span>
                  <span className="text-indigo-300">New</span>
                </div>
                <div className="flex justify-between">
                  <span>Gross income</span>
                  <span>{formatCurrency(tab === 'simple' ? grossIncome : (detSalary+detBusiness+detHouse+detOther))}</span>
                  <span>{formatCurrency(tab === 'simple' ? grossIncome : (detSalary+detBusiness+detHouse+detOther))}</span>
                </div>
                <div className="flex justify-between">
                  <span>Standard deduction</span>
                  <span>₹ 50,000</span>
                  <span>₹ 75,000</span>
                </div>
                <div className="flex justify-between">
                  <span>Total deductions</span>
                  <span>{formatCurrency(results.totalDeductionsOld)}</span>
                  <span>₹ 75,000</span>
                </div>
                <div className="flex justify-between">
                  <span>Taxable income</span>
                  <span>{formatCurrency(results.oldTaxable)}</span>
                  <span>{formatCurrency(results.newTaxable)}</span>
                </div>
                <div className="flex justify-between font-semibold pt-1 border-t border-white/20">
                  <span>Tax payable</span>
                  <span className="text-yellow-300">{formatCurrency(results.oldTax)}</span>
                  <span className="text-yellow-300">{formatCurrency(results.newTax)}</span>
                </div>
              </div>

              {/* Saving message */}
              {showSaving && saving > 0 && (
                <div className="mt-3 bg-indigo-800/50 rounded-lg p-2 flex justify-between items-center">
                  <span className="text-indigo-200 text-xs">You save with {betterRegime}</span>
                  <span className="text-green-300 text-sm font-bold">{formatCurrency(saving)}</span>
                </div>
              )}

              <div className="text-indigo-300 text-xs text-center mt-3">
                Real-time calculation · Includes 4% cess & surcharge · Estimates only
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section - 6 Plans (unchanged - keep your existing code) */}
      <div id="pricing" className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center max-w-3xl mx-auto">
          <span className="text-indigo-600 font-semibold text-sm uppercase tracking-wider">Pricing that grows with you</span>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mt-2">Choose the plan that fits your needs</h2>
          <p className="text-gray-500 mt-4">From self-filing to expert-assisted – for every income profile</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mt-12">
          {/* Plan 1 - Self Filing */}
          <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 card-hover">
            <h3 className="text-xl font-bold text-gray-800">Self Filing</h3>
            <div className="mt-2"><span className="text-4xl font-black">₹499</span><span className="text-gray-500"> + GST</span></div>
            <p className="text-sm text-gray-500 mt-1">Do-it-yourself with smart guidance</p>
            <ul className="mt-5 space-y-2 text-sm">
              <li className="flex items-center gap-2"><i className="fas fa-check-circle text-green-500"></i> Step-by-step e-filing</li>
              <li className="flex items-center gap-2"><i className="fas fa-check-circle text-green-500"></i> Automated income import</li>
              <li className="flex items-center gap-2"><i className="fas fa-check-circle text-green-500"></i> Real-time error check</li>
            </ul>
            <a href="/auth/signup?plan=self-itr"><button className="mt-6 w-full bg-indigo-600 text-white py-2 rounded-xl font-medium hover:bg-indigo-700">Buy now →</button></a>
          </div>

          {/* Plan 2 - Most popular */}
          <div className="bg-white rounded-2xl shadow-md border-2 border-indigo-200 p-6 relative card-hover">
            <span className="absolute -top-3 left-6 bg-indigo-600 text-white text-xs px-3 py-1 rounded-full">Most popular</span>
            <h3 className="text-xl font-bold text-gray-800">Expert Assisted</h3>
            <div className="mt-2"><span className="text-4xl font-black">₹1,499</span><span className="text-gray-500"> + GST</span></div>
            <p className="text-sm text-gray-500 mt-1">Tax pro review + filing support</p>
            <ul className="mt-5 space-y-2 text-sm">
              <li className="flex items-center gap-2"><i className="fas fa-check-circle text-green-500"></i> Dedicated tax expert</li>
              <li className="flex items-center gap-2"><i className="fas fa-check-circle text-green-500"></i> Form 16 & AIS analysis</li>
              <li className="flex items-center gap-2"><i className="fas fa-check-circle text-green-500"></i> 48h filing turnaround</li>
            </ul>
            <a href="/auth/signup?plan=expert-assisted"><button className="mt-6 w-full bg-indigo-600 text-white py-2 rounded-xl font-medium hover:bg-indigo-700">Buy now →</button></a>
          </div>

          {/* Plan 3 - CA Assisted */}
          <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 card-hover">
            <h3 className="text-xl font-bold text-gray-800">CA Assisted</h3>
            <div className="mt-2"><span className="text-4xl font-black">₹2,499</span><span className="text-gray-500"> + GST</span></div>
            <p className="text-sm text-gray-500 mt-1">Complete CA-managed filing</p>
            <ul className="mt-5 space-y-2 text-sm">
              <li className="flex items-center gap-2"><i className="fas fa-check-circle text-green-500"></i> CA review & compliance</li>
              <li className="flex items-center gap-2"><i className="fas fa-check-circle text-green-500"></i> Capital gains & crypto</li>
              <li className="flex items-center gap-2"><i className="fas fa-check-circle text-green-500"></i> Priority query resolution</li>
            </ul>
            <a href="/auth/signup?plan=ca-assisted"><button className="mt-6 w-full bg-indigo-600 text-white py-2 rounded-xl font-medium hover:bg-indigo-700">Buy now →</button></a>
          </div>

          {/* Plan 4 - Live with Expert */}
          <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 card-hover">
            <h3 className="text-xl font-bold text-gray-800">Live with Expert</h3>
            <div className="mt-2"><span className="text-4xl font-black">₹2,999</span><span className="text-gray-500"> + GST</span></div>
            <p className="text-sm text-gray-500 mt-1">Real-time screen share + filing</p>
            <ul className="mt-5 space-y-2 text-sm">
              <li className="flex items-center gap-2"><i className="fas fa-check-circle text-green-500"></i> 1-on-1 live session</li>
              <li className="flex items-center gap-2"><i className="fas fa-check-circle text-green-500"></i> Same-day finalisation</li>
              <li className="flex items-center gap-2"><i className="fas fa-check-circle text-green-500"></i> All CA Assisted features</li>
            </ul>
            <a href="/auth/signup?plan=live-expert"><button className="mt-6 w-full bg-indigo-600 text-white py-2 rounded-xl font-medium hover:bg-indigo-700">Buy now →</button></a>
          </div>

          {/* Plan 5 - HNI Global */}
          <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 card-hover">
            <div className="flex items-center gap-2 mb-2">
              <i className="fas fa-star text-yellow-500"></i>
              <span className="text-xs font-semibold text-gray-600">⭐ Global Wealth Builder</span>
            </div>
            <h3 className="text-xl font-bold text-gray-800">HNI Global</h3>
            <div className="mt-2"><span className="text-4xl font-black">₹4,999</span><span className="text-gray-500 line-through ml-2">₹9,999</span><span className="text-green-600 text-sm ml-2">-50%</span></div>
            <ul className="mt-5 space-y-2 text-sm">
              <li className="flex items-center gap-2"><i className="fas fa-check-circle text-green-500"></i> ESOPs & RSU gains</li>
              <li className="flex items-center gap-2"><i className="fas fa-check-circle text-green-500"></i> US Stocks & foreign income</li>
              <li className="flex items-center gap-2"><i className="fas fa-check-circle text-green-500"></i> Strategic tax advisory</li>
            </ul>
            <a href="/auth/signup?plan=hni-global"><button className="mt-6 w-full bg-indigo-600 text-white py-2 rounded-xl font-medium hover:bg-indigo-700">Buy now →</button></a>
          </div>

          {/* Plan 6 - Enterprise */}
          <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 card-hover">
            <h3 className="text-xl font-bold text-gray-800">Enterprise</h3>
            <div className="mt-2"><span className="text-4xl font-black">Custom</span></div>
            <ul className="mt-5 space-y-2 text-sm">
              <li className="flex items-center gap-2"><i className="fas fa-check-circle text-green-500"></i> Bulk filing support</li>
              <li className="flex items-center gap-2"><i className="fas fa-check-circle text-green-500"></i> Dedicated account manager</li>
              <li className="flex items-center gap-2"><i className="fas fa-check-circle text-green-500"></i> API integration</li>
            </ul>
            <a href="/auth/signup?plan=enterprise"><button className="mt-6 w-full bg-indigo-600 text-white py-2 rounded-xl font-medium hover:bg-indigo-700">Contact Sales →</button></a>
          </div>
        </div>

        {/* Confused about plan card */}
        <div className="mt-12 bg-gradient-to-br from-indigo-50 to-white rounded-2xl shadow-md border border-indigo-100 p-6 flex flex-col justify-center items-center text-center">
          <i className="fas fa-question-circle text-4xl text-indigo-500 mb-3"></i>
          <h3 className="text-xl font-bold text-gray-800">Confused about the right plan?</h3>
          <p className="text-gray-600 text-sm mt-2">Share your income sources & get a personalised recommendation.</p>
          <button className="mt-5 bg-indigo-600 text-white px-5 py-2 rounded-full font-medium hover:bg-indigo-700">Talk to expert →</button>
        </div>
      </div>

      {/* Live with Expert Section (unchanged) */}
      <div className="max-w-7xl mx-auto px-6 pb-20">
        <div className="relative bg-gradient-to-r from-indigo-600 to-purple-700 rounded-3xl overflow-hidden shadow-2xl">
          <div className="relative z-10 grid md:grid-cols-2 gap-8 p-8 md:p-12">
            <div className="text-white">
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-1.5 text-sm mb-6">
                <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span></span>
                <span>LIVE SESSION</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Live with an Expert</h2>
              <p className="text-indigo-100 mb-6">Connect with a tax expert on Google Meet or Zoom. Complete your ITR in one sitting.</p>
              <div className="space-y-3 mb-8">
                <div className="flex items-center gap-3"><i className="fas fa-check-circle text-yellow-300"></i><span>Google Meet or Zoom session</span></div>
                <div className="flex items-center gap-3"><i className="fas fa-check-circle text-yellow-300"></i><span>Expert files while you watch</span></div>
                <div className="flex items-center gap-3"><i className="fas fa-check-circle text-yellow-300"></i><span>Same-day completion</span></div>
              </div>
              <a href="/auth/signup?plan=live-expert"><button className="bg-white text-indigo-700 px-8 py-3 rounded-xl font-bold shadow-lg hover:bg-gray-100 transition">🎥 Book Live ITR Session →</button></a>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/10 rounded-xl p-4 text-center"><i className="fas fa-video text-3xl text-yellow-300 mb-2"></i><p className="text-white font-semibold">Live Screen Share</p></div>
              <div className="bg-white/10 rounded-xl p-4 text-center"><i className="fas fa-clock text-3xl text-yellow-300 mb-2"></i><p className="text-white font-semibold">60-Minute Session</p></div>
              <div className="bg-white/10 rounded-xl p-4 text-center"><i className="fas fa-shield-alt text-3xl text-yellow-300 mb-2"></i><p className="text-white font-semibold">100% Secure</p></div>
              <div className="bg-white/10 rounded-xl p-4 text-center"><i className="fas fa-file-pdf text-3xl text-yellow-300 mb-2"></i><p className="text-white font-semibold">Instant Download</p></div>
            </div>
          </div>
        </div>
      </div>

      {/* How it Works Section (unchanged) */}
      <div id="how-it-works" className="bg-gray-50 py-16 border-t">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-2xl font-bold text-gray-800">How ITRGenie Works</h2>
          <div className="grid md:grid-cols-4 gap-6 mt-10">
            <div><i className="fas fa-user-plus text-3xl text-indigo-500"></i><h4 className="font-bold mt-2">1. Signup</h4></div>
            <div><i className="fas fa-id-card text-3xl text-indigo-500"></i><h4 className="font-bold mt-2">2. Complete KYC</h4></div>
            <div><i className="fas fa-file-alt text-3xl text-indigo-500"></i><h4 className="font-bold mt-2">3. Fill ITR Form</h4></div>
            <div><i className="fas fa-credit-card text-3xl text-indigo-500"></i><h4 className="font-bold mt-2">4. Payment & File</h4></div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
