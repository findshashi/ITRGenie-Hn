import { useEffect, useState } from "react";
import Head from "next/head";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import LanguageToggle from "../../components/LanguageToggle";

// ============================================
// TAX CALCULATION FUNCTIONS (language-agnostic)
// ============================================

function calculateSurcharge(tax, income) {
  if (income > 20000000) return tax * 0.25;
  if (income > 10000000) return tax * 0.15;
  if (income > 5000000)  return tax * 0.10;
  return 0;
}

function calculateOldRegimeTax(income, age = "below60") {
  let tax = 0;
  if (age === "above80") {
    if (income <= 500000)  tax = 0;
    else if (income <= 1000000) tax = (income - 500000) * 0.20;
    else tax = 100000 + (income - 1000000) * 0.30;
  } else if (age === "above60") {
    if (income <= 300000)  tax = 0;
    else if (income <= 500000)  tax = (income - 300000) * 0.05;
    else if (income <= 1000000) tax = 10000 + (income - 500000) * 0.20;
    else tax = 110000 + (income - 1000000) * 0.30;
  } else {
    if (income <= 250000)  tax = 0;
    else if (income <= 500000)  tax = (income - 250000) * 0.05;
    else if (income <= 1000000) tax = 12500 + (income - 500000) * 0.20;
    else tax = 112500 + (income - 1000000) * 0.30;
  }
  if (income <= 500000) tax = 0;
  tax += calculateSurcharge(tax, income);
  tax += tax * 0.04;
  return Math.round(tax);
}

function calculateNewRegimeTax(income) {
  const slabs = [
    [400000, 0], [800000, 0.05], [1200000, 0.10],
    [1600000, 0.15], [2000000, 0.20], [2400000, 0.25],
    [Infinity, 0.30],
  ];
  let tax = 0, prev = 0;
  for (const [limit, rate] of slabs) {
    if (income > prev) {
      tax += (Math.min(income, limit) - prev) * rate;
      prev = limit;
    }
  }
  if (income <= 1200000) tax = 0;
  tax += calculateSurcharge(tax, income);
  tax += tax * 0.04;
  return Math.round(tax);
}

function formatCurrency(value) {
  return "₹ " + Math.round(value).toLocaleString("en-IN");
}

function safeVal(val) {
  return Math.max(0, parseFloat(val) || 0);
}

// ============================================
// REUSABLE INPUT FIELD
// ============================================

function InputField({ label, hint, value, onChange }) {
  return (
    <div style={{ marginBottom: "14px" }}>
      <label style={{ display: "block", color: "#a0a8d4", fontSize: "12px", marginBottom: hint ? "2px" : "6px" }}>
        {label}
      </label>
      {hint && (
        <span style={{ display: "block", color: "#5b6399", fontSize: "11px", marginBottom: "4px" }}>
          {hint}
        </span>
      )}
      <div style={{
        display: "flex", alignItems: "center",
        background: "#12163a", border: "1.5px solid #2e3470",
        borderRadius: "8px", overflow: "hidden",
      }}>
        <span style={{ padding: "8px 12px", color: "#5b6399", fontSize: "13px", borderRight: "1.5px solid #2e3470" }}>
          ₹
        </span>
        <input
          type="number"
          min="0"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="0"
          style={{
            background: "transparent", border: "none", outline: "none",
            padding: "8px 12px", color: "#fff", fontSize: "14px", width: "100%",
          }}
        />
      </div>
    </div>
  );
}

// ============================================
// MAIN PAGE
// ============================================

export default function IncomeTaxCalculator() {
  const { t } = useTranslation(["calculator", "common"]);

  const [activeTab, setActiveTab] = useState("quick");
  const [form, setForm] = useState({
    ageGroup: "below60",
    grossIncome: "", deductions: "",
    salary: "", business: "", house: "", other: "",
    d80c: "", d80d: "", hra: "", home: "",
  });
  const [result, setResult] = useState(null);

  function set(key) {
    return (val) => setForm((prev) => ({ ...prev, [key]: val }));
  }

  useEffect(() => {
    let normalIncome, totalOldDed;

    if (activeTab === "quick") {
      normalIncome = safeVal(form.grossIncome);
      const userDed = Math.min(safeVal(form.deductions), normalIncome);
      totalOldDed = userDed + 50000;
    } else {
      const salary = safeVal(form.salary);
      normalIncome = salary + safeVal(form.business) + safeVal(form.house) + safeVal(form.other);
      const d80c = Math.min(safeVal(form.d80c), 150000);
      const d80d = Math.min(safeVal(form.d80d), form.ageGroup !== "below60" ? 50000 : 25000);
      const hra  = Math.min(safeVal(form.hra), salary);
      const home = Math.min(safeVal(form.home), 200000);
      totalOldDed = d80c + d80d + hra + home + 50000;
    }

    const tiOld = Math.max(0, normalIncome - totalOldDed);
    const tiNew = Math.max(0, normalIncome - 75000);
    const oldTax = calculateOldRegimeTax(tiOld, form.ageGroup);
    const newTax = calculateNewRegimeTax(tiNew);

    setResult({
      grossIncome: normalIncome,
      totalOldDed,
      tiOld, tiNew,
      oldTax, newTax,
      saving: Math.abs(oldTax - newTax),
      betterRegime: oldTax <= newTax ? "old" : "new",
    });
  }, [form, activeTab]);

  const isNewBetter = result?.newTax < result?.oldTax;
  const isOldBetter = result?.oldTax < result?.newTax;

  return (
    <>
      <Head>
        <title>{t("calculator:title")} | ITRGenie</title>
        <meta name="description" content="Compare Old vs New Tax Regime for FY 2025-26. Free income tax calculator by ITRGenie." />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </Head>

      <div style={{ fontFamily: "'Inter', sans-serif", background: "#f1f5f9", minHeight: "100vh", paddingBottom: "48px" }}>

        {/* HEADER */}
        <div style={{ background: "#1a1f4e", color: "#fff", padding: "40px 24px 36px", textAlign: "center", position: "relative" }}>
          {/* Language toggle — top right */}
          <div style={{ position: "absolute", top: "16px", right: "20px" }}>
            <LanguageToggle />
          </div>
          <div style={{
            display: "inline-block", background: "rgba(255,255,255,0.1)",
            borderRadius: "20px", padding: "4px 16px", fontSize: "12px",
            fontWeight: "600", letterSpacing: "0.05em", marginBottom: "14px",
          }}>
            {t("calculator:subtitle")}
          </div>
          <h1 style={{ fontSize: "clamp(24px, 5vw, 38px)", fontWeight: "700", margin: "0 0 8px", letterSpacing: "-0.02em" }}>
            {t("calculator:title")}
          </h1>
        </div>

        <div style={{
          maxWidth: "1060px", margin: "28px auto", padding: "0 16px",
          display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", alignItems: "start",
        }}>

          {/* LEFT — INPUTS */}
          <div style={{ background: "#1a1f4e", borderRadius: "16px", padding: "24px" }}>

            {/* TABS */}
            <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
              {["quick", "detailed"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    flex: 1, padding: "8px", borderRadius: "8px", cursor: "pointer",
                    border: "1.5px solid",
                    borderColor: activeTab === tab ? "#5b63d3" : "#2e3470",
                    background: activeTab === tab ? "#2e3470" : "transparent",
                    color: activeTab === tab ? "#fff" : "#8b93c9",
                    fontSize: "12px", fontWeight: "500",
                  }}
                >
                  {t(`calculator:tabs.${tab}`)}
                </button>
              ))}
            </div>

            {/* AGE GROUP — always visible */}
            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", color: "#a0a8d4", fontSize: "12px", marginBottom: "6px" }}>
                {t("calculator:fields.ageGroup")}
              </label>
              <select
                value={form.ageGroup}
                onChange={(e) => set("ageGroup")(e.target.value)}
                style={{
                  width: "100%", background: "#12163a", border: "1.5px solid #2e3470",
                  borderRadius: "8px", padding: "9px 12px", color: "#fff", fontSize: "13px", outline: "none",
                }}
              >
                <option value="below60">{t("calculator:fields.ageBelow60")}</option>
                <option value="above60">{t("calculator:fields.age60to80")}</option>
                <option value="above80">{t("calculator:fields.ageAbove80")}</option>
              </select>
            </div>

            {/* QUICK TAB */}
            {activeTab === "quick" && (
              <>
                <InputField label={t("calculator:fields.grossIncome")} value={form.grossIncome} onChange={set("grossIncome")} />
                <InputField
                  label={t("calculator:fields.deductions")}
                  hint={t("calculator:fields.deductionsHint")}
                  value={form.deductions}
                  onChange={set("deductions")}
                />
              </>
            )}

            {/* DETAILED TAB */}
            {activeTab === "detailed" && (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <InputField label={t("calculator:fields.salaryIncome")}   value={form.salary}   onChange={set("salary")} />
                  <InputField label={t("calculator:fields.businessIncome")} value={form.business} onChange={set("business")} />
                  <InputField label={t("calculator:fields.houseProperty")}  value={form.house}    onChange={set("house")} />
                  <InputField label={t("calculator:fields.otherIncome")}    value={form.other}    onChange={set("other")} />
                </div>
                <hr style={{ border: "none", borderTop: "1px solid #2e3470", margin: "16px 0" }} />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <InputField label={t("calculator:fields.deduction80C")}     value={form.d80c} onChange={set("d80c")} />
                  <InputField label={t("calculator:fields.deduction80D")}     value={form.d80d} onChange={set("d80d")} />
                  <InputField label={t("calculator:fields.hraExemption")}     value={form.hra}  onChange={set("hra")} />
                  <InputField label={t("calculator:fields.homeLoanInterest")} value={form.home} onChange={set("home")} />
                </div>
              </>
            )}
          </div>

          {/* RIGHT — RESULTS */}
          {result && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

              {/* WINNER BANNER */}
              <div style={{
                background: isNewBetter ? "#0f6e56" : isOldBetter ? "#185FA5" : "#2e3470",
                borderRadius: "14px", padding: "24px", color: "#fff", textAlign: "center",
              }}>
                <div style={{ fontSize: "11px", opacity: 0.75, letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: "6px" }}>
                  {t("calculator:results.bestRegime")}
                </div>
                <div style={{ fontSize: "26px", fontWeight: "700", marginBottom: "4px" }}>
                  {result.betterRegime === "old" ? t("calculator:results.oldRegimeTax") : t("calculator:results.newRegimeTax")}
                </div>
                <div style={{ fontSize: "20px", fontWeight: "600", marginBottom: "8px" }}>
                  {formatCurrency(Math.min(result.oldTax, result.newTax))}
                </div>
                {result.saving > 0 && (
                  <div style={{ fontSize: "13px", opacity: 0.85 }}>
                    {t("calculator:results.youSave")} {formatCurrency(result.saving)}
                  </div>
                )}
              </div>

              {/* SIDE BY SIDE CARDS */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                {[
                  { key: "old", label: t("calculator:results.oldRegimeTax"), val: result.oldTax, better: isOldBetter, color: "#185FA5" },
                  { key: "new", label: t("calculator:results.newRegimeTax"), val: result.newTax, better: isNewBetter, color: "#0f6e56" },
                ].map(({ key, label, val, better, color }) => (
                  <div key={key} style={{
                    background: "#1a1f4e", borderRadius: "12px", padding: "16px", textAlign: "center",
                    border: `1.5px solid ${better ? color : "#2e3470"}`,
                  }}>
                    <div style={{ fontSize: "12px", color: "#8b93c9", marginBottom: "6px" }}>{label}</div>
                    <div style={{ fontSize: "20px", fontWeight: "700", color: better ? color : "#fff" }}>
                      {formatCurrency(val)}
                    </div>
                    {better && (
                      <div style={{
                        display: "inline-block", marginTop: "8px", fontSize: "11px",
                        fontWeight: "700", background: "#f5c842", color: "#12163a",
                        borderRadius: "20px", padding: "2px 10px",
                      }}>
                        {t("calculator:results.bestForYou")}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* COMPARISON TABLE */}
              <div style={{ background: "#1a1f4e", borderRadius: "14px", padding: "20px" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                  <thead>
                    <tr>
                      <th style={{ color: "#5b6399", fontWeight: "600", padding: "8px 0", textAlign: "left", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                        {t("calculator:results.particulars")}
                      </th>
                      <th style={{ color: "#5b6399", fontWeight: "600", padding: "8px 0", textAlign: "right", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                        {t("calculator:results.old")}
                      </th>
                      <th style={{ color: "#5b6399", fontWeight: "600", padding: "8px 0", textAlign: "right", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                        {t("calculator:results.new")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { label: t("calculator:results.grossIncome"),      old: result.grossIncome, nw: result.grossIncome },
                      { label: t("calculator:results.standardDeduction"), old: 50000,              nw: 75000 },
                      { label: t("calculator:results.totalDeductions"),   old: result.totalOldDed, nw: 75000 },
                      { label: t("calculator:results.taxableIncome"),     old: result.tiOld,       nw: result.tiNew },
                      { label: t("calculator:results.taxPayable"),        old: result.oldTax,      nw: result.newTax, highlight: true },
                    ].map(({ label, old, nw, highlight }) => (
                      <tr key={label} style={{ background: highlight ? "rgba(91,99,211,0.15)" : "transparent" }}>
                        <td style={{ padding: "9px 0", color: highlight ? "#fff" : "#a0a8d4", borderBottom: "1px solid #1e2455", fontWeight: highlight ? "600" : "400" }}>
                          {label}
                        </td>
                        <td style={{ padding: "9px 0", textAlign: "right", color: highlight ? "#f5c842" : "#a0a8d4", borderBottom: "1px solid #1e2455", fontWeight: highlight ? "600" : "400" }}>
                          {formatCurrency(old)}
                        </td>
                        <td style={{ padding: "9px 0", textAlign: "right", color: highlight ? "#5b63d3" : "#a0a8d4", borderBottom: "1px solid #1e2455", fontWeight: highlight ? "600" : "400" }}>
                          {formatCurrency(nw)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* NOTES */}
              <div style={{ background: "#1a1f4e", borderRadius: "12px", padding: "16px" }}>
                {["stdDeduction", "capitalGains", "surcharge", "disclaimer"].map((key) => (
                  <p key={key} style={{ fontSize: "11px", color: "#5b6399", margin: "0 0 5px", lineHeight: "1.5" }}>
                    · {t(`calculator:notes.${key}`)}
                  </p>
                ))}
              </div>

            </div>
          )}
        </div>

        {/* FOOTER */}
        <div style={{ textAlign: "center", padding: "24px", fontSize: "12px", color: "#94a3b8" }}>
          © 2026 ITRGenie · itrgenie.co.in
        </div>
      </div>
    </>
  );
}

// ============================================
// THIS IS THE KEY — loads translations server-side
// ============================================
export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["common", "calculator"])),
    },
  };
}
