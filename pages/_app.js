import { appWithTranslation } from "next-i18next";
import "../styles/globals.css"; // keep your existing import

function MyApp({ Component, pageProps }) {
  return <Component {...pageProps} />;
}

// This single wrapper enables i18n across ALL pages
export default appWithTranslation(MyApp);
