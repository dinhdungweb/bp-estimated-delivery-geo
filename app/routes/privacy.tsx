import type { MetaFunction } from "react-router";

export const meta: MetaFunction = () => [
  { title: "Privacy Policy | BP Estimated Delivery Date Pro" },
  {
    name: "description",
    content:
      "Privacy policy for BP Estimated Delivery Date Pro by Bluepeaks Studio.",
  },
];

const sections = [
  {
    title: "Information we collect",
    body: [
      "Store and merchant information, including store owner name, email address, phone number, physical address, store domain, Shopify plan and app installation details.",
      "Store data needed to provide the app, including products, collections, Shopify Markets settings, Online Store theme data, and order data available through Shopify permissions.",
      "Customer and visitor context used to calculate delivery estimates, including geolocation, IP address, browser, operating system, country, region, product context and delivery-rule matches.",
      "App usage and configuration data, including delivery rules, widget settings, analytics events, billing status and support messages.",
    ],
  },
  {
    title: "How we use information",
    body: [
      "Provide geo-targeted estimated delivery dates and delivery widgets on merchant storefronts.",
      "Let merchants configure delivery rules, country and region targeting, cut-off times, holidays, templates and analytics.",
      "Operate billing, app access, support, troubleshooting, fraud prevention, security and service reliability.",
      "Comply with Shopify platform requirements, legal obligations and privacy requests.",
    ],
  },
  {
    title: "Sharing and service providers",
    body: [
      "We do not sell personal information.",
      "We may share information with Shopify and trusted infrastructure, hosting, analytics, billing and support providers only as needed to operate the app.",
      "We may disclose information when required by law or to protect the rights, safety and security of merchants, customers, Shopify, Bluepeaks Studio or the public.",
    ],
  },
  {
    title: "Data retention",
    body: [
      "We keep app configuration, delivery rules, analytics and account data only for as long as needed to provide the app, comply with legal obligations, resolve disputes and enforce agreements.",
      "When a merchant uninstalls the app or submits a valid deletion request, we delete or anonymize personal data unless retention is required by law, security, billing or legitimate business obligations.",
    ],
  },
  {
    title: "Privacy requests",
    body: [
      "Merchants and customers may request access, correction, deletion or restriction of personal information by contacting us.",
      "We respond to Shopify mandatory privacy webhooks for customer data requests, customer redaction and shop redaction.",
      "If you are a customer of a merchant using the app, please contact the merchant directly first because they control their Shopify store data.",
    ],
  },
  {
    title: "Security",
    body: [
      "We use administrative, technical and organizational safeguards designed to protect information from unauthorized access, loss, misuse or disclosure.",
      "No method of transmission or storage is completely secure, so we cannot guarantee absolute security.",
    ],
  },
  {
    title: "Changes to this policy",
    body: [
      "We may update this policy from time to time. The latest version will be posted on this page with the updated effective date.",
    ],
  },
];

export default function PrivacyPolicy() {
  return (
    <main style={styles.page}>
      <article style={styles.article}>
        <p style={styles.kicker}>Bluepeaks Studio</p>
        <h1 style={styles.title}>Privacy Policy</h1>
        <p style={styles.subtitle}>BP Estimated Delivery Date Pro</p>
        <p style={styles.updated}>Effective date: May 25, 2026</p>

        <p style={styles.paragraph}>
          This Privacy Policy explains how Bluepeaks Studio collects, uses,
          shares and protects information when merchants install or use BP
          Estimated Delivery Date Pro, including storefront delivery widgets,
          app configuration, analytics and support workflows.
        </p>

        {sections.map((section) => (
          <section key={section.title} style={styles.section}>
            <h2 style={styles.heading}>{section.title}</h2>
            <ul style={styles.list}>
              {section.body.map((item) => (
                <li key={item} style={styles.item}>
                  {item}
                </li>
              ))}
            </ul>
          </section>
        ))}

        <section style={styles.section}>
          <h2 style={styles.heading}>Contact us</h2>
          <p style={styles.paragraph}>
            For privacy questions or requests, contact Bluepeaks Studio at{" "}
            <a href="mailto:support@bluepeaks.top" style={styles.link}>
              support@bluepeaks.top
            </a>
            .
          </p>
        </section>
      </article>
    </main>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f6f7f8",
    color: "#202223",
    fontFamily:
      "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    padding: "48px 20px",
  },
  article: {
    maxWidth: "840px",
    margin: "0 auto",
    background: "#ffffff",
    border: "1px solid #dfe3e8",
    borderRadius: "8px",
    padding: "40px",
    boxShadow: "0 1px 2px rgba(0, 0, 0, 0.04)",
  },
  kicker: {
    margin: "0 0 8px",
    color: "#5c5f62",
    fontSize: "14px",
    fontWeight: 600,
  },
  title: {
    margin: 0,
    fontSize: "36px",
    lineHeight: 1.15,
    fontWeight: 700,
  },
  subtitle: {
    margin: "12px 0 0",
    color: "#5c5f62",
    fontSize: "18px",
  },
  updated: {
    margin: "8px 0 28px",
    color: "#6d7175",
    fontSize: "14px",
  },
  section: {
    marginTop: "28px",
  },
  heading: {
    margin: "0 0 12px",
    fontSize: "22px",
    lineHeight: 1.3,
    fontWeight: 700,
  },
  paragraph: {
    margin: 0,
    color: "#3b3f43",
    fontSize: "16px",
    lineHeight: 1.65,
  },
  list: {
    margin: 0,
    paddingLeft: "22px",
  },
  item: {
    marginBottom: "10px",
    color: "#3b3f43",
    fontSize: "16px",
    lineHeight: 1.6,
  },
  link: {
    color: "#005bd3",
  },
} satisfies Record<string, React.CSSProperties>;
