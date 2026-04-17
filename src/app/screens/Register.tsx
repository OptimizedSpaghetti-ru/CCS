import { useState, useRef } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import {
  User,
  Hash,
  Mail,
  Book,
  Lock,
  Eye,
  EyeOff,
  ChevronDown,
  CheckCircle2,
  XCircle,
  Upload,
  ImageIcon,
  FileText,
  ArrowLeft,
  ChevronRight,
} from "lucide-react";
import { c, g, fonts, shadow } from "../theme";
import type { CSSProperties, ReactNode } from "react";
import { useApp } from "../context/AppContext";

const successColor = "#16A34A";
const successBg = `${successColor}1F`;
const successText = successColor;
const warningColor = "#D97706";
const errorColor = "#DC2626";
const errorText = errorColor;
const infoAccent = "#3B5280";
const infoSurface = `${infoAccent}1F`;
const infoBorder = `${infoAccent}33`;

function FormField({
  icon,
  label,
  placeholder,
  type = "text",
  value,
  onChange,
  rightEl,
  error,
  success,
  isDark,
}: {
  icon: ReactNode;
  label: string;
  placeholder: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  rightEl?: ReactNode;
  error?: string;
  success?: string;
  isDark: boolean;
}) {
  const labelColor = isDark ? "rgba(255, 232, 217, 0.92)" : c.darkBrown;
  const fieldSurface = isDark ? "#2A141A" : c.white;
  const iconColor = isDark ? "rgba(255, 232, 217, 0.74)" : c.warmGray;
  const inputColor = isDark ? "#FFEFE6" : c.darkBrown;
  const borderColor = error
    ? errorColor
    : success
      ? successColor
      : isDark
        ? "rgba(255, 232, 217, 0.35)"
        : `${c.warmGray}40`;

  return (
    <div>
      <label
        style={{
          fontFamily: fonts.ui,
          fontSize: 11,
          fontWeight: 600,
          color: labelColor,
          display: "block",
          marginBottom: 5,
          textTransform: "uppercase",
          letterSpacing: 0.5,
        }}
      >
        {label}
      </label>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          background: fieldSurface,
          borderRadius: 10,
          padding: "0 14px",
          height: 48,
          border: `2px solid ${borderColor}`,
        }}
      >
        <span style={{ color: iconColor, flexShrink: 0 }}>{icon}</span>
        <input
          className="auth-input"
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            flex: 1,
            background: "transparent",
            border: "none",
            outline: "none",
            fontFamily: fonts.ui,
            fontSize: 14,
            color: inputColor,
            caretColor: inputColor,
            minWidth: 0,
            // CSS variable used by .auth-input::placeholder in global styles.
            ["--auth-placeholder-color" as string]: isDark
              ? "rgba(255, 232, 217, 0.7)"
              : "rgba(45, 27, 14, 0.55)",
          }}
        />
        {rightEl}
      </div>
      {(error || success) && (
        <p
          style={{
            fontFamily: fonts.ui,
            fontSize: 11,
            margin: "5px 2px 0",
            color: error ? errorText : successText,
          }}
        >
          {error || success}
        </p>
      )}
    </div>
  );
}

/* ── File-upload helper ─────────────────────────────────── */
function FileUploadField({
  label,
  hint,
  icon,
  accept,
  file,
  onFile,
  error,
  isDark,
}: {
  label: string;
  hint: string;
  icon: ReactNode;
  accept: string;
  file: File | null;
  onFile: (f: File | null) => void;
  error?: string;
  isDark: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const previewUrl = file ? URL.createObjectURL(file) : null;
  const isImage = file?.type.startsWith("image/");
  const idleSurface = isDark ? "#2A141A" : c.cream;
  const idleBorder = isDark ? "rgba(255, 232, 217, 0.35)" : `${c.warmGray}40`;
  const idleIconSurface = isDark
    ? "rgba(255, 232, 217, 0.1)"
    : `${c.warmGray}1A`;
  const idleHint = isDark ? "rgba(255, 232, 217, 0.72)" : c.warmGray;
  const labelColor = isDark ? "rgba(255, 232, 217, 0.92)" : c.darkBrown;
  const titleColor = isDark ? "#FFEFE6" : c.darkBrown;

  return (
    <div>
      <label
        style={{
          fontFamily: fonts.ui,
          fontSize: 11,
          fontWeight: 600,
          color: labelColor,
          display: "block",
          marginBottom: 5,
          textTransform: "uppercase",
          letterSpacing: 0.5,
        }}
      >
        {label}
      </label>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        style={{
          width: "100%",
          background: file ? successBg : idleSurface,
          border: `2px dashed ${error ? errorColor : file ? successColor : idleBorder}`,
          borderRadius: 10,
          padding: "14px 16px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 12,
          textAlign: "left",
        }}
      >
        {previewUrl && isImage ? (
          <img
            src={previewUrl}
            alt="preview"
            style={{
              width: 48,
              height: 48,
              objectFit: "cover",
              borderRadius: 8,
              flexShrink: 0,
            }}
          />
        ) : (
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 8,
              background: file ? successBg : idleIconSurface,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              color: file ? successColor : c.warmGray,
            }}
          >
            {file ? <CheckCircle2 size={22} /> : icon}
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              margin: 0,
              fontFamily: fonts.ui,
              fontSize: 13,
              fontWeight: 600,
              color: file ? successText : titleColor,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {file ? file.name : `Tap to upload ${label}`}
          </p>
          <p
            style={{
              margin: "2px 0 0",
              fontFamily: fonts.ui,
              fontSize: 11,
              color: file ? successColor : idleHint,
            }}
          >
            {file
              ? `${(file.size / 1024).toFixed(0)} KB — tap to change`
              : hint}
          </p>
        </div>
        <Upload size={16} color={file ? successColor : c.warmGray} />
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        style={{ display: "none" }}
        onChange={(e) => {
          const picked = e.target.files?.[0] ?? null;
          onFile(picked);
          e.target.value = "";
        }}
      />
      {error && (
        <p
          style={{
            fontFamily: fonts.ui,
            fontSize: 11,
            margin: "5px 2px 0",
            color: errorText,
          }}
        >
          {error}
        </p>
      )}
    </div>
  );
}

/* ── Step indicator ─────────────────────────────────────── */
function StepIndicator({ step }: { step: 1 | 2 }) {
  const steps = [
    { n: 1, label: "Account Info" },
    { n: 2, label: "Upload Documents" },
  ];
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 0,
        padding: "0 8px",
      }}
    >
      {steps.map((s, i) => (
        <div key={s.n} style={{ display: "flex", alignItems: "center" }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 3,
            }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                background:
                  step >= s.n
                    ? step === s.n
                      ? g.button
                      : successText
                    : `${c.cream}33`,
                border: step >= s.n ? "none" : `2px solid ${c.cream}4D`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: fonts.ui,
                fontSize: 12,
                fontWeight: 700,
                color: step >= s.n ? c.cream : `${c.cream}60`,
                transition: "all 0.3s",
              }}
            >
              {step > s.n ? <CheckCircle2 size={14} /> : s.n}
            </div>
            <span
              style={{
                fontFamily: fonts.ui,
                fontSize: 9,
                fontWeight: 600,
                color: step >= s.n ? c.cream : `${c.cream}60`,
                whiteSpace: "nowrap",
              }}
            >
              {s.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div
              style={{
                width: 40,
                height: 2,
                background: step > s.n ? successText : `${c.cream}33`,
                margin: "0 6px",
                marginBottom: 16,
                transition: "background 0.3s",
              }}
            />
          )}
        </div>
      ))}
    </div>
  );
}

export function Register() {
  const navigate = useNavigate();
  const { signUp, resolvedThemeMode } = useApp();
  const [step, setStep] = useState<1 | 2>(1);
  const [showPass, setShowPass] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");
  const [submitError, setSubmitError] = useState("");
  const isDark = resolvedThemeMode === "dark";
  const softLine = isDark ? "rgba(255, 232, 217, 0.2)" : `${c.warmGray}33`;
  const softBorder = isDark ? "rgba(255, 232, 217, 0.35)" : `${c.warmGray}40`;
  const headerGhostBg = `${c.cream}1F`;
  const headerGhostBorder = `${c.cream}33`;
  const fieldLabelColor = isDark ? "rgba(255, 232, 217, 0.92)" : c.darkBrown;
  const helperTextColor = isDark ? "rgba(255, 232, 217, 0.72)" : c.warmGray;

  /* ── Step-2 file state ── */
  const [regCardFile, setRegCardFile] = useState<File | null>(null);
  const [profilePicFile, setProfilePicFile] = useState<File | null>(null);
  const [fileErrors, setFileErrors] = useState({ regCard: "", profilePic: "" });

  const studentDepartments = [
    {
      label: "Bachelor of Science in Information Technology (BSIT)",
      code: "BSIT",
    },
    {
      label: "Bachelor of Science in Computer Science (BSCS)",
      code: "BSCS",
    },
    {
      label:
        "Bachelor of Science in Entertainment and Multimedia Computing (BS EMC)",
      code: "BS EMC",
    },
  ] as const;

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    id: "",
    email: "",
    dept: "",
    yearSection: "",
    password: "",
    confirm: "",
  });
  const set = (k: keyof typeof form) => (v: string) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const handleDepartmentChange = (value: string) => {
    setForm((prev) => ({ ...prev, dept: value, yearSection: "" }));
  };

  const isNameValid = (v: string) => /^[A-Za-z][A-Za-z .'-]*$/.test(v.trim());

  const passwordChecks = {
    minLength: form.password.length >= 8,
    uppercase: /[A-Z]/.test(form.password),
    lowercase: /[a-z]/.test(form.password),
    number: /\d/.test(form.password),
    special: /[^A-Za-z0-9]/.test(form.password),
  };

  const passwordStrengthScore =
    Object.values(passwordChecks).filter(Boolean).length;
  const strengthMeta =
    passwordStrengthScore <= 2
      ? { label: "Weak", color: errorColor }
      : passwordStrengthScore <= 4
        ? { label: "Medium", color: warningColor }
        : { label: "Strong", color: successColor };

  const selectedStudentDepartment = studentDepartments.find(
    (department) => department.label === form.dept,
  );
  const selectedCourseCode = selectedStudentDepartment?.code || "";
  const yearLabels = {
    1: "1st Year",
    2: "2nd Year",
    3: "3rd Year",
    4: "4th Year",
  } as const;
  const semesters = ["Y1", "Y2"] as const;
  const sections = [1, 2, 3, 4, 5] as const;

  const yearSectionGroups =
    selectedCourseCode === ""
      ? []
      : ([1, 2, 3, 4] as const).map((year) => ({
          label: yearLabels[year],
          options: semesters.flatMap((semester) =>
            sections.map(
              (section) =>
                `${selectedCourseCode} ${year}-${semester}-${section}`,
            ),
          ),
        }));

  const selectStyles: CSSProperties = {
    background: isDark ? "#2A141A" : c.white,
    border: `1.5px solid ${softBorder}`,
    borderRadius: 10,
    padding: "14px 12px",
    width: "100%",
    color: isDark ? "#FFEFE6" : c.darkBrown,
    caretColor: isDark ? "#FFEFE6" : c.darkBrown,
    fontSize: 14,
    appearance: "none",
    fontFamily: fonts.ui,
    outline: "none",
  };

  const errors = {
    firstName: !form.firstName.trim()
      ? "First name is required."
      : !isNameValid(form.firstName)
        ? "Use letters only for first name."
        : "",
    lastName: !form.lastName.trim()
      ? "Last name is required."
      : !isNameValid(form.lastName)
        ? "Use letters only for last name."
        : "",
    id: !form.id.trim()
      ? "Student ID is required."
      : /^\d{11}$/.test(form.id.trim())
        ? ""
        : "Format must be 11 digits (e.g. 01230001234).",
    email: !form.email.trim()
      ? "Email is required."
      : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())
        ? "Enter a valid email address."
        : !form.email.trim().toLowerCase().endsWith("@student.fatima.edu.ph")
          ? "Use your @student.fatima.edu.ph email."
          : "",
    dept: !form.dept.trim()
      ? "Department is required."
      : form.dept.trim().length < 2
        ? "Department must be at least 2 characters."
        : "",
    yearSection: !form.yearSection.trim()
      ? "Please select your year and section"
      : "",
    password: !form.password
      ? "Password is required."
      : passwordStrengthScore < 3
        ? "Password is too weak. Add uppercase, number, or symbol."
        : "",
    confirm: !form.confirm
      ? "Please confirm your password."
      : form.confirm !== form.password
        ? "Passwords do not match."
        : "",
  };

  const isStep1Valid = Object.values(errors).every((v) => v === "");
  const showMatchIndicator = form.confirm.length > 0;
  const isPasswordMatch = form.confirm === form.password;

  /* ── Step 1 → Step 2 ── */
  const handleProceedToStep2 = () => {
    setSubmitError("");
    if (!isStep1Valid) {
      setSubmitError("Complete all required fields before proceeding.");
      return;
    }
    setStep(2);
  };

  /* ── Final submit ── */
  const handleRegister = async () => {
    setSubmitError("");
    setSubmitMessage("");

    const newFileErrors = {
      regCard: !regCardFile ? "Registration card / ID is required." : "",
      profilePic: !profilePicFile ? "1x1 profile picture is required." : "",
    };
    setFileErrors(newFileErrors);
    if (newFileErrors.regCard || newFileErrors.profilePic) return;

    setIsSubmitting(true);
    const result = await signUp({
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      identifier: form.id.trim(),
      email: form.email.trim(),
      department: form.dept.trim(),
      yearSection: form.yearSection.trim(),
      program: "",
      role: "student",
      password: form.password,
      regCardFile: regCardFile ?? undefined,
      profilePicFile: profilePicFile ?? undefined,
    });
    setIsSubmitting(false);

    if (result.error) {
      setSubmitError(result.error);
      return;
    }

    navigate("/pending-approval", {
      replace: true,
      state: {
        email: form.email.trim(),
        name: `${form.firstName} ${form.lastName}`.trim(),
      },
    });
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        flex: 1,
        display: "flex",
        flexDirection: "column",
        background: c.creamLight,
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div style={{ background: g.header, paddingBottom: 24, flexShrink: 0 }}>
        <div style={{ padding: "8px 24px 0" }}>
          <button
            onClick={() => (step === 2 ? setStep(1) : navigate("/login"))}
            style={{
              background: headerGhostBg,
              border: `1px solid ${headerGhostBorder}`,
              borderRadius: 8,
              width: 34,
              height: 34,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              marginBottom: 14,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path
                d="M11 4L6 9L11 14"
                stroke={c.cream}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <h1
            style={{
              fontFamily: fonts.display,
              fontSize: 26,
              fontWeight: 700,
              color: c.cream,
              margin: 0,
            }}
          >
            {step === 1 ? "Create Account" : "Upload Documents"}
          </h1>
          <p
            style={{
              fontFamily: fonts.ui,
              fontSize: 13,
              color: c.warmGrayLight,
              margin: "3px 0 16px",
            }}
          >
            {step === 1
              ? "Join the CCS Connect community"
              : "Required for student verification"}
          </p>

          <StepIndicator step={step} />
        </div>
      </div>

      {/* Form area */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px 32px" }}>
        <AnimatePresence mode="wait">
          {/* ═══ STEP 1 ═══ */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              style={{ display: "flex", flexDirection: "column", gap: 12 }}
            >
              <div style={{ display: "flex", gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <FormField
                    icon={<User size={16} />}
                    label="First Name"
                    placeholder="Juan"
                    value={form.firstName}
                    onChange={set("firstName")}
                    error={errors.firstName}
                    success={
                      !errors.firstName && form.firstName.trim()
                        ? "Looks good."
                        : ""
                    }
                    isDark={isDark}
                  />
                </div>
              </div>
              <FormField
                icon={<User size={16} />}
                label="Last Name"
                placeholder="Dela Cruz"
                value={form.lastName}
                onChange={set("lastName")}
                error={errors.lastName}
                success={
                  !errors.lastName && form.lastName.trim() ? "Looks good." : ""
                }
                isDark={isDark}
              />
              <FormField
                icon={<Hash size={16} />}
                label="Student ID"
                placeholder="e.g. 01230001234"
                value={form.id}
                onChange={set("id")}
                error={errors.id}
                success={!errors.id && form.id.trim() ? "Looks good." : ""}
                isDark={isDark}
              />
              <FormField
                icon={<Mail size={16} />}
                label="Email Address"
                placeholder="yourname@student.fatima.edu.ph"
                type="email"
                value={form.email}
                onChange={set("email")}
                error={errors.email}
                success={
                  !errors.email && form.email.trim() ? "Looks good." : ""
                }
                isDark={isDark}
              />
              <div>
                <label
                  style={{
                    fontFamily: fonts.ui,
                    fontSize: 11,
                    fontWeight: 600,
                    color: fieldLabelColor,
                    display: "block",
                    marginBottom: 5,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                  }}
                >
                  Department
                </label>
                <div style={{ position: "relative" }}>
                  <select
                    value={form.dept}
                    onChange={(event) =>
                      handleDepartmentChange(event.target.value)
                    }
                    style={selectStyles}
                  >
                    <option value="">Select department</option>
                    {studentDepartments.map((department) => (
                      <option key={department.code} value={department.label}>
                        {department.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={16}
                    color={helperTextColor}
                    style={{
                      position: "absolute",
                      right: 12,
                      top: "50%",
                      transform: "translateY(-50%)",
                      pointerEvents: "none",
                    }}
                  />
                </div>
                {(errors.dept || form.dept.trim()) && (
                  <p
                    style={{
                      fontFamily: fonts.ui,
                      fontSize: 11,
                      margin: "5px 2px 0",
                      color: errors.dept ? errorText : successText,
                    }}
                  >
                    {errors.dept || "Looks good."}
                  </p>
                )}
              </div>

              <div>
                <label
                  style={{
                    fontFamily: fonts.ui,
                    fontSize: 11,
                    fontWeight: 600,
                    color: fieldLabelColor,
                    display: "block",
                    marginBottom: 5,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                  }}
                >
                  Year and Section
                </label>
                <div style={{ position: "relative" }}>
                  <select
                    value={form.yearSection}
                    onChange={(event) => set("yearSection")(event.target.value)}
                    disabled={!form.dept}
                    style={{
                      ...selectStyles,
                      opacity: !form.dept ? 0.5 : 1,
                      cursor: !form.dept ? "not-allowed" : "pointer",
                    }}
                  >
                    <option value="">
                      {!form.dept
                        ? "Select department first"
                        : "Select year and section"}
                    </option>
                    {yearSectionGroups.map((group) => (
                      <optgroup key={group.label} label={group.label}>
                        {group.options.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                  <ChevronDown
                    size={16}
                    color={helperTextColor}
                    style={{
                      position: "absolute",
                      right: 12,
                      top: "50%",
                      transform: "translateY(-50%)",
                      pointerEvents: "none",
                    }}
                  />
                </div>
                {(errors.yearSection || form.yearSection.trim()) && (
                  <p
                    style={{
                      fontFamily: fonts.ui,
                      fontSize: 11,
                      margin: "5px 2px 0",
                      color: errors.yearSection ? errorText : successText,
                    }}
                  >
                    {errors.yearSection || "Looks good."}
                  </p>
                )}
              </div>
              <FormField
                icon={<Lock size={16} />}
                label="Password"
                placeholder="Min. 8 characters"
                type={showPass ? "text" : "password"}
                value={form.password}
                onChange={set("password")}
                error={errors.password}
                success={
                  !errors.password && form.password
                    ? "Password meets requirements."
                    : ""
                }
                isDark={isDark}
                rightEl={
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: helperTextColor,
                      padding: 0,
                    }}
                  >
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                }
              />
              {form.password.length > 0 && (
                <div
                  style={{
                    background: c.white,
                    borderRadius: 10,
                    padding: "10px 12px",
                    border: `1px solid ${softLine}`,
                    marginTop: -4,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: 6,
                    }}
                  >
                    <span
                      style={{
                        fontFamily: fonts.ui,
                        fontSize: 11,
                        color: helperTextColor,
                      }}
                    >
                      Password Strength
                    </span>
                    <span
                      style={{
                        fontFamily: fonts.ui,
                        fontSize: 11,
                        fontWeight: 700,
                        color: strengthMeta.color,
                      }}
                    >
                      {strengthMeta.label}
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: 4 }}>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <div
                        key={s}
                        style={{
                          flex: 1,
                          height: 6,
                          borderRadius: 4,
                          background:
                            passwordStrengthScore >= s
                              ? strengthMeta.color
                              : softLine,
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}
              <FormField
                icon={<Lock size={16} />}
                label="Confirm Password"
                placeholder="Re-enter password"
                type="password"
                value={form.confirm}
                onChange={set("confirm")}
                error={errors.confirm}
                success={
                  !errors.confirm && form.confirm ? "Passwords match." : ""
                }
                isDark={isDark}
              />
              {showMatchIndicator && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    marginTop: -6,
                    color: isPasswordMatch ? successText : errorText,
                  }}
                >
                  {isPasswordMatch ? (
                    <CheckCircle2 size={14} />
                  ) : (
                    <XCircle size={14} />
                  )}
                  <span style={{ fontFamily: fonts.ui, fontSize: 11 }}>
                    {isPasswordMatch
                      ? "Confirm password matches."
                      : "Confirm password does not match."}
                  </span>
                </div>
              )}

              {/* CTA */}
              <button
                onClick={handleProceedToStep2}
                disabled={!isStep1Valid}
                style={{
                  background: isStep1Valid ? g.button : `${c.warmGray}40`,
                  border: "none",
                  borderRadius: 12,
                  height: 52,
                  width: "100%",
                  fontFamily: fonts.ui,
                  fontSize: 16,
                  fontWeight: 600,
                  color: isStep1Valid ? c.cream : c.warmGray,
                  cursor: isStep1Valid ? "pointer" : "not-allowed",
                  boxShadow: isStep1Valid ? shadow.button : "none",
                  marginTop: 8,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                Continue to Upload Documents
                <ChevronRight size={18} />
              </button>

              {submitError && (
                <p
                  style={{
                    margin: "2px 0 0",
                    fontFamily: fonts.ui,
                    fontSize: 12,
                    color: errorText,
                    textAlign: "center",
                  }}
                >
                  {submitError}
                </p>
              )}

              {submitMessage && (
                <p
                  style={{
                    margin: "2px 0 0",
                    fontFamily: fonts.ui,
                    fontSize: 12,
                    color: successText,
                    textAlign: "center",
                  }}
                >
                  {submitMessage}
                </p>
              )}

              <div style={{ textAlign: "center" }}>
                <span
                  style={{
                    fontFamily: fonts.ui,
                    fontSize: 14,
                    color: c.warmGray,
                  }}
                >
                  Already have an account?{" "}
                </span>
                <button
                  onClick={() => navigate("/login")}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontFamily: fonts.ui,
                    fontSize: 14,
                    color: c.baseRed,
                    fontWeight: 600,
                  }}
                >
                  Log In
                </button>
              </div>
            </motion.div>
          )}

          {/* ═══ STEP 2 (students only) ═══ */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 24 }}
              transition={{ duration: 0.25 }}
              style={{ display: "flex", flexDirection: "column", gap: 16 }}
            >
              {/* Info banner */}
              <div
                style={{
                  background: c.white,
                  borderRadius: 12,
                  padding: "12px 14px",
                  border: `1.5px solid ${infoBorder}`,
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 10,
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: infoSurface,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <FileText size={16} color={infoAccent} />
                </div>
                <div>
                  <p
                    style={{
                      margin: 0,
                      fontFamily: fonts.ui,
                      fontSize: 13,
                      fontWeight: 700,
                      color: c.darkBrown,
                    }}
                  >
                    Document Verification
                  </p>
                  <p
                    style={{
                      margin: "3px 0 0",
                      fontFamily: fonts.ui,
                      fontSize: 12,
                      color: c.warmGray,
                      lineHeight: 1.5,
                    }}
                  >
                    Upload your registration card/school ID and a 1x1 photo.
                    These will be reviewed by an admin before your account is
                    approved.
                  </p>
                </div>
              </div>

              <FileUploadField
                label="Registration Card / School ID"
                hint="JPG, PNG or PDF — max 5 MB"
                icon={<FileText size={22} />}
                accept="image/*,application/pdf"
                file={regCardFile}
                isDark={isDark}
                onFile={(f) => {
                  setRegCardFile(f);
                  setFileErrors((prev) => ({ ...prev, regCard: "" }));
                }}
                error={fileErrors.regCard}
              />

              <FileUploadField
                label="1x1 Profile Picture"
                hint="JPG or PNG — max 3 MB. This will be your profile photo."
                icon={<ImageIcon size={22} />}
                accept="image/jpeg,image/png,image/webp"
                file={profilePicFile}
                isDark={isDark}
                onFile={(f) => {
                  setProfilePicFile(f);
                  setFileErrors((prev) => ({ ...prev, profilePic: "" }));
                }}
                error={fileErrors.profilePic}
              />

              {/* Account summary */}
              <div
                style={{
                  background: c.white,
                  borderRadius: 12,
                  padding: "12px 14px",
                  border: `1px solid ${c.warmGray}1F`,
                }}
              >
                <p
                  style={{
                    margin: "0 0 8px",
                    fontFamily: fonts.ui,
                    fontSize: 10,
                    fontWeight: 700,
                    color: c.warmGray,
                    textTransform: "uppercase",
                    letterSpacing: 0.6,
                  }}
                >
                  Account Summary
                </p>
                {[
                  ["Name", `${form.firstName} ${form.lastName}`],
                  ["Student ID", form.id],
                  ["Email", form.email],
                  ["Department", form.dept],
                  ["Year & Section", form.yearSection],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "4px 0",
                      borderBottom: `1px solid ${c.warmGray}14`,
                    }}
                  >
                    <span
                      style={{
                        fontFamily: fonts.ui,
                        fontSize: 11,
                        color: c.warmGray,
                      }}
                    >
                      {label}
                    </span>
                    <span
                      style={{
                        fontFamily: fonts.ui,
                        fontSize: 12,
                        fontWeight: 600,
                        color: c.darkBrown,
                        maxWidth: 180,
                        textAlign: "right",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {value || "—"}
                    </span>
                  </div>
                ))}
              </div>

              <button
                onClick={handleRegister}
                disabled={isSubmitting}
                style={{
                  background: isSubmitting ? `${c.warmGray}40` : g.button,
                  border: "none",
                  borderRadius: 12,
                  height: 52,
                  width: "100%",
                  fontFamily: fonts.ui,
                  fontSize: 16,
                  fontWeight: 600,
                  color: isSubmitting ? c.warmGray : c.cream,
                  cursor: isSubmitting ? "not-allowed" : "pointer",
                  boxShadow: isSubmitting ? "none" : shadow.button,
                }}
              >
                {isSubmitting ? "Creating Account…" : "Submit Registration"}
              </button>

              <button
                onClick={() => setStep(1)}
                disabled={isSubmitting}
                style={{
                  background: "none",
                  border: `1.5px solid ${c.warmGray}4D`,
                  borderRadius: 12,
                  height: 44,
                  width: "100%",
                  fontFamily: fonts.ui,
                  fontSize: 14,
                  fontWeight: 600,
                  color: c.warmGray,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                }}
              >
                <ArrowLeft size={16} />
                Back to Account Info
              </button>

              {submitError && (
                <p
                  style={{
                    margin: "2px 0 0",
                    fontFamily: fonts.ui,
                    fontSize: 12,
                    color: errorText,
                    textAlign: "center",
                  }}
                >
                  {submitError}
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
