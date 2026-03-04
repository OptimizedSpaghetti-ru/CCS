import { useState } from "react";
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
  GraduationCap,
  BookOpen,
  ChevronDown,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { c, g, fonts, shadow } from "../theme";
import type { CSSProperties, ReactNode } from "react";
import { useApp } from "../context/AppContext";

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
}) {
  const borderColor = error ? "#DC2626" : success ? "#16A34A" : "transparent";

  return (
    <div>
      <label
        style={{
          fontFamily: fonts.ui,
          fontSize: 11,
          fontWeight: 600,
          color: c.darkBrown,
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
          background: c.cream,
          borderRadius: 10,
          padding: "0 14px",
          height: 48,
          border: `2px solid ${borderColor}`,
        }}
      >
        <span style={{ color: c.warmGray, flexShrink: 0 }}>{icon}</span>
        <input
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
            color: c.darkBrown,
            minWidth: 0,
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
            color: error ? "#B91C1C" : "#15803D",
          }}
        >
          {error || success}
        </p>
      )}
    </div>
  );
}

export function Register() {
  const navigate = useNavigate();
  const { signUp } = useApp();
  const [role, setRole] = useState<"student" | "faculty">("student");
  const [showPass, setShowPass] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");
  const [submitError, setSubmitError] = useState("");

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
    program: "",
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
      ? { label: "Weak", color: "#DC2626" }
      : passwordStrengthScore <= 4
        ? { label: "Medium", color: "#D97706" }
        : { label: "Strong", color: "#16A34A" };

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
    background: "#FFF0C4",
    border: "1px solid #8B7355",
    borderRadius: 10,
    padding: "14px 12px",
    width: "100%",
    color: "#2D1B0E",
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
      ? `${role === "student" ? "Student" : "Employee"} ID is required.`
      : role === "student"
        ? /^\d{11}$/.test(form.id.trim())
          ? ""
          : "Format must be 11 digits (e.g. 01230001234)."
        : /^FAC-\d{4}-\d{3}$/i.test(form.id.trim())
          ? ""
          : "Format must be FAC-YYYY-000.",
    email: !form.email.trim()
      ? "Email is required."
      : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())
        ? "Enter a valid email address."
        : role === "student" &&
            !form.email.trim().toLowerCase().endsWith("@student.fatima.edu.ph")
          ? "Use your @student.fatima.edu.ph email."
          : role === "faculty" &&
              !form.email.trim().toLowerCase().endsWith("@fatima.edu.ph")
            ? "Use your @fatima.edu.ph email."
            : "",
    dept: !form.dept.trim()
      ? "Department is required."
      : form.dept.trim().length < 2
        ? "Department must be at least 2 characters."
        : "",
    yearSection:
      role === "student"
        ? !form.yearSection.trim()
          ? "Please select your year and section"
          : ""
        : "",
    program:
      role === "faculty"
        ? !form.program.trim()
          ? "Program handled is required."
          : ""
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

  const isFormValid = Object.values(errors).every((v) => v === "");
  const showMatchIndicator = form.confirm.length > 0;
  const isPasswordMatch = form.confirm === form.password;

  const handleRegister = async () => {
    setSubmitError("");
    setSubmitMessage("");

    if (!isFormValid) {
      setSubmitError("Complete all required fields before creating account.");
      return;
    }

    setIsSubmitting(true);
    const result = await signUp({
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      identifier: form.id.trim(),
      email: form.email.trim(),
      department: form.dept.trim(),
      yearSection: role === "student" ? form.yearSection.trim() : "",
      program: role === "faculty" ? form.program.trim() : "",
      role,
      password: form.password,
    });
    setIsSubmitting(false);

    if (result.error) {
      setSubmitError(result.error);
      return;
    }

    // Redirect to pending-approval screen with the user's email
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
            onClick={() => navigate("/login")}
            style={{
              background: "rgba(255,240,196,0.15)",
              border: "1px solid rgba(255,240,196,0.2)",
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
            Create Account
          </h1>
          <p
            style={{
              fontFamily: fonts.ui,
              fontSize: 13,
              color: c.warmGrayLight,
              margin: "3px 0 16px",
            }}
          >
            Join the CCS Connect community
          </p>

          {/* Role Tab Switcher */}
          <div
            style={{
              display: "flex",
              background: "rgba(255,240,196,0.12)",
              borderRadius: 12,
              padding: 4,
              gap: 4,
            }}
          >
            {(["student", "faculty"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRole(r)}
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  height: 36,
                  borderRadius: 9,
                  border: "none",
                  cursor: "pointer",
                  fontFamily: fonts.ui,
                  fontSize: 13,
                  fontWeight: 600,
                  background: role === r ? g.button : "transparent",
                  color: role === r ? c.cream : `${c.cream}80`,
                  transition: "all 0.2s",
                }}
              >
                {r === "student" ? (
                  <GraduationCap size={15} />
                ) : (
                  <BookOpen size={15} />
                )}
                {r === "student" ? "Student" : "Faculty"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Form */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px 32px" }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={role}
            initial={{ opacity: 0, x: role === "student" ? -20 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: role === "student" ? 20 : -20 }}
            transition={{ duration: 0.25 }}
            style={{ display: "flex", flexDirection: "column", gap: 12 }}
          >
            {/* Role Badge Preview */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: c.white,
                borderRadius: 10,
                padding: "10px 14px",
                border: `1.5px solid rgba(140,16,7,0.15)`,
                marginBottom: 4,
              }}
            >
              <div
                style={{
                  background: role === "student" ? "#3B5280" : g.button,
                  borderRadius: 20,
                  padding: "3px 10px",
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                }}
              >
                {role === "student" ? (
                  <GraduationCap size={12} color={c.white} />
                ) : (
                  <BookOpen size={12} color={c.white} />
                )}
                <span
                  style={{
                    fontFamily: fonts.ui,
                    fontSize: 11,
                    fontWeight: 600,
                    color: c.white,
                  }}
                >
                  {role === "student" ? "Student" : "Faculty"}
                </span>
              </div>
              <span
                style={{
                  fontFamily: fonts.ui,
                  fontSize: 12,
                  color: c.warmGray,
                }}
              >
                Registering as{" "}
                {role === "student" ? "a student" : "faculty member"}
              </span>
            </div>

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
            />
            <FormField
              icon={<Hash size={16} />}
              label={role === "student" ? "Student ID" : "Employee ID"}
              placeholder={
                role === "student" ? "e.g. 01230001234" : "e.g. FAC-2018-045"
              }
              value={form.id}
              onChange={set("id")}
              error={errors.id}
              success={!errors.id && form.id.trim() ? "Looks good." : ""}
            />
            <FormField
              icon={<Mail size={16} />}
              label="Email Address"
              placeholder={
                role === "student"
                  ? "yourname@student.fatima.edu.ph"
                  : "yourname@fatima.edu.ph"
              }
              type="email"
              value={form.email}
              onChange={set("email")}
              error={errors.email}
              success={!errors.email && form.email.trim() ? "Looks good." : ""}
            />
            {role === "student" ? (
              <>
                <div>
                  <label
                    style={{
                      fontFamily: fonts.ui,
                      fontSize: 11,
                      fontWeight: 600,
                      color: c.darkBrown,
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
                      color={c.warmGray}
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
                        color: errors.dept ? "#B91C1C" : "#15803D",
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
                      color: c.darkBrown,
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
                      onChange={(event) =>
                        set("yearSection")(event.target.value)
                      }
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
                      color={c.warmGray}
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
                        color: errors.yearSection ? "#B91C1C" : "#15803D",
                      }}
                    >
                      {errors.yearSection || "Looks good."}
                    </p>
                  )}
                </div>
              </>
            ) : (
              <FormField
                icon={<Book size={16} />}
                label="Department"
                placeholder="e.g. BSCS, BSIT, BSCS-SE"
                value={form.dept}
                onChange={set("dept")}
                error={errors.dept}
                success={!errors.dept && form.dept.trim() ? "Looks good." : ""}
              />
            )}

            {role === "faculty" && (
              <FormField
                icon={<Book size={16} />}
                label="Program Handled"
                placeholder="e.g. BSCS, BSIT"
                value={form.program}
                onChange={set("program")}
                error={errors.program}
                success={
                  !errors.program && form.program.trim() ? "Looks good." : ""
                }
              />
            )}
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
              rightEl={
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: c.warmGray,
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
                  border: "1px solid rgba(139,115,85,0.15)",
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
                      color: c.warmGray,
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
                  {[1, 2, 3, 4, 5].map((step) => (
                    <div
                      key={step}
                      style={{
                        flex: 1,
                        height: 6,
                        borderRadius: 4,
                        background:
                          passwordStrengthScore >= step
                            ? strengthMeta.color
                            : "rgba(139,115,85,0.2)",
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
            />
            {showMatchIndicator && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  marginTop: -6,
                  color: isPasswordMatch ? "#15803D" : "#B91C1C",
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

            <button
              onClick={handleRegister}
              disabled={!isFormValid || isSubmitting}
              style={{
                background:
                  isFormValid && !isSubmitting
                    ? g.button
                    : "rgba(139,115,85,0.25)",
                border: "none",
                borderRadius: 12,
                height: 52,
                width: "100%",
                fontFamily: fonts.ui,
                fontSize: 16,
                fontWeight: 600,
                color: isFormValid && !isSubmitting ? c.cream : c.warmGray,
                cursor:
                  isFormValid && !isSubmitting ? "pointer" : "not-allowed",
                boxShadow:
                  isFormValid && !isSubmitting ? shadow.button : "none",
                marginTop: 8,
              }}
            >
              {isSubmitting ? "Creating Account..." : "Create Account"}
            </button>

            {submitError && (
              <p
                style={{
                  margin: "2px 0 0",
                  fontFamily: fonts.ui,
                  fontSize: 12,
                  color: "#B91C1C",
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
                  color: "#15803D",
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
        </AnimatePresence>
      </div>
    </div>
  );
}
