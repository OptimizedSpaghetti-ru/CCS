import { useNavigate } from "react-router";
import {
  Bell,
  ChevronRight,
  HelpCircle,
  KeyRound,
  LifeBuoy,
  Map,
  Megaphone,
  MessageCircle,
  ShieldCheck,
  Wrench,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { TopBar } from "../components/TopBar";
import { c, fonts, g, shadow } from "../theme";
import { useApp } from "../context/AppContext";

const faqs = [
  {
    question: "How do I reset my password?",
    answer:
      "Open Profile, go to Login & Security, then update your password. If you cannot sign in, contact the CCS office or an administrator for account recovery.",
  },
  {
    question: "Why is my account still pending?",
    answer:
      "New accounts need admin verification before full access is enabled. Students may also need submitted documents reviewed before approval.",
  },
  {
    question: "How do I view announcements?",
    answer:
      "Open Notifications from the bottom navigation. Recent announcements also appear on Home when they are addressed to your role.",
  },
  {
    question: "How do I submit an assistance request?",
    answer:
      "Use the Submit Assistance Request shortcut on this page or open Assistance from Profile. Add a clear title, category, description, location, and photo evidence when available.",
  },
  {
    question: "Why am I not receiving notifications?",
    answer:
      "Check Notification Settings, confirm mobile permissions are enabled, and make sure your account is approved and signed in on the device.",
  },
  {
    question: "How do I use the indoor map?",
    answer:
      "Open Map from the bottom navigation, search for a room or facility, then select the location card to view details and floor guidance.",
  },
];

const guideItems = [
  "Refresh the app if data looks outdated.",
  "Check your internet connection before retrying uploads.",
  "Use a clear room name or lab number when reporting equipment issues.",
  "Attach a photo when the problem involves hardware, peripherals, or lab equipment.",
];

function roleLabel(role: string) {
  if (role === "it_support") return "IT Support";
  return role.charAt(0).toUpperCase() + role.slice(1);
}

function SupportCard({
  icon: Icon,
  title,
  body,
}: {
  icon: LucideIcon;
  title: string;
  body: string;
}) {
  return (
    <div
      style={{
        background: c.white,
        borderRadius: 16,
        padding: 14,
        boxShadow: shadow.card,
        border: "1px solid rgba(102,11,5,0.08)",
      }}
    >
      <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 11,
            background: "rgba(140,16,7,0.10)",
            display: "grid",
            placeItems: "center",
            flexShrink: 0,
          }}
        >
          <Icon size={17} color="#8C1007" />
        </div>
        <div style={{ minWidth: 0 }}>
          <p
            style={{
              margin: 0,
              fontFamily: fonts.ui,
              fontSize: 13,
              fontWeight: 900,
              color: c.darkBrown,
            }}
          >
            {title}
          </p>
          <p
            style={{
              margin: "4px 0 0",
              fontFamily: fonts.ui,
              fontSize: 12,
              color: c.warmGray,
              lineHeight: 1.45,
            }}
          >
            {body}
          </p>
        </div>
      </div>
    </div>
  );
}

export function HelpSupport() {
  const navigate = useNavigate();
  const { currentUser } = useApp();
  const isITSupport = currentUser.role === "it_support";

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <TopBar title="Help & Support" subtitle="CCS Connect support center" showBack />
      <div style={{ flex: 1, overflowY: "auto", background: c.creamLight, padding: 16 }}>
        <div
          style={{
            background: g.header,
            borderRadius: 18,
            padding: 16,
            color: c.cream,
            boxShadow: shadow.card,
            marginBottom: 14,
            overflow: "hidden",
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
              <LifeBuoy size={23} />
            </div>
            <div style={{ minWidth: 0 }}>
              <p
                style={{
                  margin: 0,
                  fontFamily: fonts.display,
                  fontSize: 20,
                  fontWeight: 800,
                }}
              >
                How can we help?
              </p>
              <p
                style={{
                  margin: "3px 0 0",
                  fontFamily: fonts.ui,
                  fontSize: 12,
                  color: c.warmGrayLight,
                  lineHeight: 1.4,
                }}
              >
                Signed in as {roleLabel(currentUser.role)}
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => navigate(isITSupport ? "/app/it-support" : "/app/assistance")}
          style={{
            width: "100%",
            border: "none",
            borderRadius: 16,
            background: c.white,
            boxShadow: shadow.card,
            padding: 14,
            display: "flex",
            alignItems: "center",
            gap: 12,
            textAlign: "left",
            cursor: "pointer",
            marginBottom: 14,
          }}
        >
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 13,
              background: g.button,
              color: c.cream,
              display: "grid",
              placeItems: "center",
              flexShrink: 0,
            }}
          >
            <Wrench size={20} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p
              style={{
                margin: 0,
                fontFamily: fonts.ui,
                fontSize: 14,
                fontWeight: 900,
                color: c.darkBrown,
              }}
            >
              {isITSupport ? "Open Support Queue" : "Submit Assistance Request"}
            </p>
            <p
              style={{
                margin: "3px 0 0",
                fontFamily: fonts.ui,
                fontSize: 12,
                color: c.warmGray,
                lineHeight: 1.35,
              }}
            >
              {isITSupport
                ? "Review and manage submitted technical reports."
                : "Report system errors, broken equipment, internet issues, or lab concerns."}
            </p>
          </div>
          <ChevronRight size={18} color={c.warmGray} />
        </button>

        <div style={{ display: "grid", gap: 10, marginBottom: 14 }}>
          <SupportCard
            icon={KeyRound}
            title="Account and login help"
            body="Use Login & Security for password changes. Pending accounts must be reviewed by an administrator before access is granted."
          />
          <SupportCard
            icon={Megaphone}
            title="Announcements and notifications"
            body="Announcements appear in Home and Notifications. Mobile alerts depend on your device permissions and app notification settings."
          />
          <SupportCard
            icon={Map}
            title="Navigation and map help"
            body="Search rooms, laboratories, and offices from the Map tab. Select a location to see building and floor details."
          />
          <SupportCard
            icon={ShieldCheck}
            title="Privacy and account safety"
            body="Keep your password private and sign out on shared devices. Report suspicious account activity to an administrator."
          />
        </div>

        <section
          style={{
            background: c.white,
            borderRadius: 16,
            padding: 14,
            boxShadow: shadow.card,
            marginBottom: 14,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <HelpCircle size={16} color="#8C1007" />
            <p
              style={{
                margin: 0,
                fontFamily: fonts.ui,
                fontSize: 13,
                fontWeight: 900,
                color: c.darkBrown,
              }}
            >
              Frequently Asked Questions
            </p>
          </div>
          <div style={{ display: "grid", gap: 10 }}>
            {faqs.map((faq) => (
              <div
                key={faq.question}
                style={{
                  borderRadius: 13,
                  background: "rgba(255,240,196,0.42)",
                  border: "1px solid rgba(102,11,5,0.08)",
                  padding: 11,
                }}
              >
                <p
                  style={{
                    margin: 0,
                    fontFamily: fonts.ui,
                    fontSize: 12,
                    fontWeight: 900,
                    color: c.darkBrown,
                    lineHeight: 1.35,
                  }}
                >
                  {faq.question}
                </p>
                <p
                  style={{
                    margin: "5px 0 0",
                    fontFamily: fonts.ui,
                    fontSize: 11,
                    color: c.warmGray,
                    lineHeight: 1.45,
                  }}
                >
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section
          style={{
            background: c.white,
            borderRadius: 16,
            padding: 14,
            boxShadow: shadow.card,
            marginBottom: 14,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <MessageCircle size={16} color="#8C1007" />
            <p
              style={{
                margin: 0,
                fontFamily: fonts.ui,
                fontSize: 13,
                fontWeight: 900,
                color: c.darkBrown,
              }}
            >
              Contact Support
            </p>
          </div>
          <p
            style={{
              margin: 0,
              fontFamily: fonts.ui,
              fontSize: 12,
              color: c.warmGray,
              lineHeight: 1.5,
            }}
          >
            For urgent CCS Connect access concerns, visit the College of Computer Studies office or message your class adviser. For equipment, internet, software, or laboratory issues, submit an Assistance request so IT Support can track the report.
          </p>
        </section>

        <section
          style={{
            background: c.white,
            borderRadius: 16,
            padding: 14,
            boxShadow: shadow.card,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <Bell size={16} color="#8C1007" />
            <p
              style={{
                margin: 0,
                fontFamily: fonts.ui,
                fontSize: 13,
                fontWeight: 900,
                color: c.darkBrown,
              }}
            >
              General Troubleshooting
            </p>
          </div>
          <div style={{ display: "grid", gap: 8 }}>
            {guideItems.map((item) => (
              <div key={item} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: 999,
                    background: "#8C1007",
                    marginTop: 5,
                    flexShrink: 0,
                  }}
                />
                <p
                  style={{
                    margin: 0,
                    fontFamily: fonts.ui,
                    fontSize: 12,
                    color: c.warmGray,
                    lineHeight: 1.45,
                  }}
                >
                  {item}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
