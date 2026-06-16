import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";

export default function LanguageToggle({ style = {} }) {
  const router = useRouter();
  const { i18n } = useTranslation();

  const isHindi = i18n.language === "hi";

  function switchLanguage() {
    const newLocale = isHindi ? "en" : "hi";
    router.push(router.asPath, router.asPath, { locale: newLocale });
  }

  return (
    <button
      onClick={switchLanguage}
      aria-label="Switch language"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding: "6px 14px",
        borderRadius: "20px",
        border: "1.5px solid rgba(255,255,255,0.25)",
        background: "rgba(255,255,255,0.1)",
        color: "#fff",
        fontSize: "13px",
        fontWeight: "500",
        cursor: "pointer",
        transition: "background 0.2s",
        fontFamily: "inherit",
        ...style,
      }}
      onMouseEnter={(e) => (e.target.style.background = "rgba(255,255,255,0.2)")}
      onMouseLeave={(e) => (e.target.style.background = "rgba(255,255,255,0.1)")}
    >
      {isHindi ? (
        <>
          <span style={{ fontSize: "15px" }}>EN</span>
          <span style={{ opacity: 0.6, fontSize: "11px" }}>English</span>
        </>
      ) : (
        <>
          <span style={{ fontSize: "15px" }}>हि</span>
          <span style={{ opacity: 0.6, fontSize: "11px" }}>हिंदी</span>
        </>
      )}
    </button>
  );
}
