import { FileText, Lock, Mail, ShieldCheck } from "lucide-react";
import { TopBar } from "../components/TopBar";
import { c, fonts, g, shadow } from "../theme";

type LegalSection = {
  title: string;
  body: string;
};

const termsSections: LegalSection[] = [
  {
    title: "Acceptance of Terms",
    body: "By using CCS Connect, you agree to follow these terms and the policies of the College of Computer Studies. This prototype is intended to support academic communication, campus navigation, and technical assistance workflows.",
  },
  {
    title: "User Responsibilities",
    body: "Users are responsible for keeping their account information accurate, using respectful communication, and reporting incorrect or suspicious activity to the appropriate CCS personnel.",
  },
  {
    title: "Account Registration and Security",
    body: "Accounts may require administrative review before activation. You must protect your password, avoid sharing your account, and sign out on shared devices.",
  },
  {
    title: "Proper Use of the System",
    body: "CCS Connect should be used for legitimate college-related activities such as announcements, messaging, map access, profile management, and technical support reporting.",
  },
  {
    title: "Academic and Communication Guidelines",
    body: "Messages and announcements should remain professional, relevant, and appropriate for the academic community. Misleading, offensive, or disruptive content may be reviewed by administrators.",
  },
  {
    title: "Assistance Request Usage",
    body: "Assistance requests should describe real technical concerns inside the College of Computer Studies. Include accurate locations, clear descriptions, and photo evidence only when relevant.",
  },
  {
    title: "Prohibited Activities",
    body: "Users must not attempt unauthorized access, impersonate others, upload harmful content, misuse notifications, or interfere with the system or other users.",
  },
  {
    title: "System Availability",
    body: "CCS Connect may experience maintenance, connectivity issues, or prototype limitations. The college may update, pause, or modify features when needed.",
  },
  {
    title: "Changes to Terms",
    body: "These placeholder terms may be revised as CCS Connect develops. Continued use of the system means you accept the latest posted version.",
  },
  {
    title: "Contact Information",
    body: "For questions about these terms, contact the College of Computer Studies office or the assigned CCS Connect administrator.",
  },
];

const privacySections: LegalSection[] = [
  {
    title: "Information Collected",
    body: "CCS Connect may collect information needed to operate the prototype, including account details, role, department, app activity, notification records, and support request content.",
  },
  {
    title: "Account Information",
    body: "Names, email addresses, ID numbers, roles, departments, and approval status may be stored to verify users and control access to role-based features.",
  },
  {
    title: "Uploaded Student Documents",
    body: "Student document uploads may be used for account verification. Access should be limited to authorized administrators and handled only for legitimate review purposes.",
  },
  {
    title: "Assistance Request Data",
    body: "Assistance requests may include issue titles, categories, descriptions, locations, priority, status, IT Support remarks, and optional image evidence.",
  },
  {
    title: "Announcements and Notifications",
    body: "The system stores notification and announcement data to deliver updates, track read or dismissed states, and support mobile notification delivery when enabled.",
  },
  {
    title: "How Information Is Used",
    body: "Information is used to authenticate users, route role-specific content, manage account approvals, support technical issue handling, and improve academic communication.",
  },
  {
    title: "Data Storage and Security",
    body: "Data is stored in the configured backend services and protected through authentication, role-based access rules, and database policies where available.",
  },
  {
    title: "User Access and Control",
    body: "Users can view and update supported profile details from the app. Some records, such as account approval data and submitted requests, may require admin or IT Support handling.",
  },
  {
    title: "Limitations of the Prototype System",
    body: "Because CCS Connect is a prototype, some privacy and administrative workflows may change before production use. Placeholder policy text should be reviewed before official deployment.",
  },
  {
    title: "Contact Information",
    body: "For privacy questions, contact the College of Computer Studies office or the CCS Connect administrator responsible for the system.",
  },
];

function LegalContent({
  kind,
  title,
  subtitle,
  sections,
}: {
  kind: "terms" | "privacy";
  title: string;
  subtitle: string;
  sections: LegalSection[];
}) {
  const Icon = kind === "terms" ? FileText : Lock;

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <TopBar title={title} subtitle={subtitle} showBack backPath="/app/settings" />
      <div style={{ flex: 1, overflowY: "auto", background: c.creamLight, padding: 16 }}>
        <div
          style={{
            background: g.header,
            borderRadius: 18,
            padding: 16,
            boxShadow: shadow.card,
            color: c.cream,
            marginBottom: 14,
          }}
        >
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <div
              style={{
                width: 46,
                height: 46,
                borderRadius: 14,
                background: "rgba(255,240,196,0.16)",
                display: "grid",
                placeItems: "center",
                flexShrink: 0,
              }}
            >
              <Icon size={23} />
            </div>
            <div style={{ minWidth: 0 }}>
              <p
                style={{
                  margin: 0,
                  fontFamily: fonts.display,
                  fontSize: 20,
                  fontWeight: 800,
                  lineHeight: 1.15,
                }}
              >
                {title}
              </p>
              <p
                style={{
                  margin: "4px 0 0",
                  fontFamily: fonts.ui,
                  fontSize: 12,
                  color: c.warmGrayLight,
                  lineHeight: 1.4,
                }}
              >
                Placeholder policy for CCS Connect prototype use.
              </p>
            </div>
          </div>
        </div>

        <div
          style={{
            background: c.white,
            borderRadius: 16,
            padding: 14,
            boxShadow: shadow.card,
            marginBottom: 14,
            border: "1px solid rgba(102,11,5,0.08)",
          }}
        >
          <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
            <ShieldCheck size={18} color="#8C1007" style={{ flexShrink: 0, marginTop: 1 }} />
            <p
              style={{
                margin: 0,
                fontFamily: fonts.ui,
                fontSize: 12,
                lineHeight: 1.5,
                color: c.warmGray,
              }}
            >
              This content is provided as realistic placeholder text and should be reviewed by authorized CCS personnel before official publication.
            </p>
          </div>
        </div>

        <div style={{ display: "grid", gap: 10 }}>
          {sections.map((section, index) => (
            <section
              key={section.title}
              style={{
                background: c.white,
                borderRadius: 16,
                padding: 14,
                boxShadow: shadow.card,
                border: "1px solid rgba(102,11,5,0.08)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 7 }}>
                <span
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 8,
                    background: "rgba(140,16,7,0.10)",
                    color: "#8C1007",
                    display: "grid",
                    placeItems: "center",
                    fontFamily: fonts.mono,
                    fontSize: 11,
                    fontWeight: 900,
                    flexShrink: 0,
                  }}
                >
                  {index + 1}
                </span>
                <h2
                  style={{
                    margin: 0,
                    fontFamily: fonts.ui,
                    fontSize: 13,
                    fontWeight: 900,
                    color: c.darkBrown,
                    lineHeight: 1.3,
                  }}
                >
                  {section.title}
                </h2>
              </div>
              <p
                style={{
                  margin: 0,
                  fontFamily: fonts.ui,
                  fontSize: 12,
                  color: c.warmGray,
                  lineHeight: 1.55,
                }}
              >
                {section.body}
              </p>
            </section>
          ))}
        </div>

        <div
          style={{
            background: c.white,
            borderRadius: 16,
            padding: 14,
            boxShadow: shadow.card,
            marginTop: 14,
            marginBottom: 6,
            border: "1px solid rgba(102,11,5,0.08)",
          }}
        >
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <Mail size={17} color="#8C1007" />
            <div>
              <p
                style={{
                  margin: 0,
                  fontFamily: fonts.ui,
                  fontSize: 12,
                  fontWeight: 900,
                  color: c.darkBrown,
                }}
              >
                Need clarification?
              </p>
              <p
                style={{
                  margin: "3px 0 0",
                  fontFamily: fonts.ui,
                  fontSize: 11,
                  color: c.warmGray,
                  lineHeight: 1.4,
                }}
              >
                Contact the College of Computer Studies office or your CCS Connect administrator.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function TermsOfService() {
  return (
    <LegalContent
      kind="terms"
      title="Terms of Service"
      subtitle="Usage guidelines"
      sections={termsSections}
    />
  );
}

export function PrivacyPolicy() {
  return (
    <LegalContent
      kind="privacy"
      title="Privacy Policy"
      subtitle="Data and privacy"
      sections={privacySections}
    />
  );
}
