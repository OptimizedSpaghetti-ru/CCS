import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  AlertCircle,
  Calculator,
  CheckCircle2,
  Plus,
  RotateCcw,
  Trash2,
  Trophy,
} from "lucide-react";
import { TopBar } from "../components/TopBar";
import { c, fonts, g, shadow } from "../theme";
import { useApp } from "../context/AppContext";
import type { CSSProperties } from "react";

type SubjectRow = {
  id: string;
  name: string;
  units: string;
  grade: string;
};

type FieldErrors = Partial<Record<keyof Omit<SubjectRow, "id">, string>>;

type CalculationResult = {
  gwa: number;
  totalUnits: number;
  weightedTotal: number;
  qualified: boolean;
  reason: string;
};

const minGrade = 1;
const maxGrade = 5;
const deanListLimit = 1.75;

function createSubject(index: number): SubjectRow {
  return {
    id: `${Date.now()}-${index}-${Math.random().toString(16).slice(2)}`,
    name: `Subject ${index}`,
    units: "",
    grade: "",
  };
}

function parsePositiveNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

function formatGwa(value: number) {
  return value.toFixed(2);
}

function validateSubjects(subjects: SubjectRow[]) {
  const errors: Record<string, FieldErrors> = {};

  subjects.forEach((subject) => {
    const subjectErrors: FieldErrors = {};
    const units = parsePositiveNumber(subject.units);
    const grade = parsePositiveNumber(subject.grade);

    if (!subject.name.trim()) {
      subjectErrors.name = "Subject name is required.";
    }

    if (!subject.units.trim()) {
      subjectErrors.units = "Units are required.";
    } else if (!Number.isFinite(units) || units <= 0) {
      subjectErrors.units = "Units must be a positive number.";
    }

    if (!subject.grade.trim()) {
      subjectErrors.grade = "Grade is required.";
    } else if (!Number.isFinite(grade) || grade < minGrade || grade > maxGrade) {
      subjectErrors.grade = "Grade must be from 1.00 to 5.00.";
    }

    if (Object.keys(subjectErrors).length > 0) {
      errors[subject.id] = subjectErrors;
    }
  });

  return errors;
}

function inputStyle(isDark: boolean, hasError: boolean): CSSProperties {
  return {
    width: "100%",
    minHeight: 44,
    borderRadius: 12,
    border: `1.5px solid ${
      hasError
        ? "#B91C1C"
        : isDark
          ? "rgba(255,240,196,0.18)"
          : "rgba(102,11,5,0.16)"
    }`,
    background: isDark ? "rgba(255,240,196,0.06)" : "#FFFBEF",
    color: c.darkBrown,
    fontFamily: fonts.ui,
    fontSize: 14,
    fontWeight: 700,
    padding: "0 12px",
    outline: "none",
  };
}

function labelStyle(): CSSProperties {
  return {
    margin: "0 0 5px",
    fontFamily: fonts.ui,
    fontSize: 11,
    fontWeight: 900,
    color: c.warmGray,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  };
}

function errorStyle(): CSSProperties {
  return {
    margin: "5px 0 0",
    color: "#DC2626",
    fontFamily: fonts.ui,
    fontSize: 11,
    fontWeight: 700,
    lineHeight: 1.35,
  };
}

export function GWAComputation() {
  const { resolvedThemeMode } = useApp();
  const isDark = resolvedThemeMode === "dark";
  const [subjects, setSubjects] = useState<SubjectRow[]>([
    createSubject(1),
    createSubject(2),
    createSubject(3),
  ]);
  const [errors, setErrors] = useState<Record<string, FieldErrors>>({});
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [notice, setNotice] = useState("");
  const [resultVersion, setResultVersion] = useState(0);

  const palette = useMemo(
    () => ({
      deepest: "#3E0703",
      deep: "#660B05",
      bright: "#8C1007",
      cream: "#FFF0C4",
      surface: isDark ? c.white : "#FFFFFF",
      softSurface: isDark ? "rgba(255,240,196,0.07)" : "rgba(255,240,196,0.52)",
      border: isDark ? "rgba(255,240,196,0.12)" : "rgba(102,11,5,0.10)",
    }),
    [isDark],
  );

  const updateSubject = (
    id: string,
    key: keyof Omit<SubjectRow, "id">,
    value: string,
  ) => {
    setSubjects((current) =>
      current.map((subject) =>
        subject.id === id ? { ...subject, [key]: value } : subject,
      ),
    );
    setErrors((current) => {
      const subjectErrors = current[id];
      if (!subjectErrors?.[key]) return current;
      const nextSubjectErrors = { ...subjectErrors };
      delete nextSubjectErrors[key];
      const next = { ...current };
      if (Object.keys(nextSubjectErrors).length === 0) {
        delete next[id];
      } else {
        next[id] = nextSubjectErrors;
      }
      return next;
    });
    setNotice("");
  };

  const addSubject = () => {
    setSubjects((current) => [...current, createSubject(current.length + 1)]);
    setNotice("");
  };

  const removeSubject = (id: string) => {
    setSubjects((current) => {
      if (current.length === 1) return current;
      return current.filter((subject) => subject.id !== id);
    });
    setErrors((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });
    setResult(null);
    setNotice("");
  };

  const resetCalculator = () => {
    setSubjects([createSubject(1), createSubject(2), createSubject(3)]);
    setErrors({});
    setResult(null);
    setNotice("");
  };

  const calculateGwa = () => {
    const nextErrors = validateSubjects(subjects);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setResult(null);
      setNotice("Please fix the highlighted fields before calculating.");
      return;
    }

    const values = subjects.map((subject) => ({
      units: Number(subject.units),
      grade: Number(subject.grade),
    }));
    const totalUnits = values.reduce((sum, subject) => sum + subject.units, 0);
    const weightedTotal = values.reduce(
      (sum, subject) => sum + subject.units * subject.grade,
      0,
    );
    const gwa = weightedTotal / totalUnits;
    const hasGradeBelowDeanStandard = values.some(
      (subject) => subject.grade > deanListLimit,
    );

    let qualified = false;
    let reason = "Your GWA is higher than 1.75.";

    if (gwa >= minGrade && gwa <= deanListLimit && !hasGradeBelowDeanStandard) {
      qualified = true;
      reason = "Your GWA is within the required range.";
    } else if (hasGradeBelowDeanStandard) {
      reason = "You have a grade lower than 1.75.";
    }

    setNotice("");
    setResult({
      gwa,
      totalUnits,
      weightedTotal,
      qualified,
      reason,
    });
    setResultVersion((version) => version + 1);
  };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <TopBar
        title="GWA Computation"
        subtitle="Student grade calculator"
        showBack
        rightContent={
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 12,
              background: "rgba(255,240,196,0.15)",
              color: c.cream,
              display: "grid",
              placeItems: "center",
            }}
          >
            <Calculator size={18} />
          </div>
        }
      />

      <div
        style={{
          flex: 1,
          overflowY: "auto",
          background: c.creamLight,
          padding: 16,
        }}
      >
        <section
          style={{
            background: g.header,
            borderRadius: 18,
            padding: 16,
            color: palette.cream,
            boxShadow: shadow.card,
            marginBottom: 14,
            border: "1px solid rgba(255,240,196,0.12)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 14,
                background: "rgba(255,240,196,0.16)",
                display: "grid",
                placeItems: "center",
                flexShrink: 0,
              }}
            >
              <Calculator size={24} />
            </div>
            <div style={{ minWidth: 0 }}>
              <p
                style={{
                  margin: 0,
                  fontFamily: fonts.display,
                  fontSize: 21,
                  fontWeight: 800,
                  lineHeight: 1.2,
                }}
              >
                GWA Calculator
              </p>
              <p
                style={{
                  margin: "4px 0 0",
                  fontFamily: fonts.ui,
                  fontSize: 12,
                  color: c.warmGrayLight,
                  lineHeight: 1.45,
                }}
              >
                Add your subjects, units, and final grades to check your weighted
                average.
              </p>
            </div>
          </div>
        </section>

        <section
          style={{
            background: palette.surface,
            borderRadius: 18,
            padding: 14,
            boxShadow: shadow.card,
            border: `1px solid ${palette.border}`,
            marginBottom: 14,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 10,
              marginBottom: 12,
            }}
          >
            <div>
              <p
                style={{
                  margin: 0,
                  fontFamily: fonts.ui,
                  fontSize: 14,
                  fontWeight: 900,
                  color: c.darkBrown,
                }}
              >
                Subjects
              </p>
              <p
                style={{
                  margin: "2px 0 0",
                  fontFamily: fonts.ui,
                  fontSize: 11,
                  color: c.warmGray,
                }}
              >
                Valid grades: 1.00 to 5.00
              </p>
            </div>
            <button
              type="button"
              onClick={addSubject}
              className="hover-press"
              style={{
                border: "none",
                borderRadius: 12,
                minHeight: 40,
                padding: "0 12px",
                background: palette.bright,
                color: palette.cream,
                fontFamily: fonts.ui,
                fontSize: 12,
                fontWeight: 900,
                display: "flex",
                alignItems: "center",
                gap: 6,
                cursor: "pointer",
                boxShadow: "0 6px 16px rgba(140,16,7,0.25)",
              }}
            >
              <Plus size={16} />
              Add
            </button>
          </div>

          <AnimatePresence initial={false}>
            {subjects.map((subject, index) => {
              const subjectErrors = errors[subject.id] ?? {};
              return (
                <motion.div
                  key={subject.id}
                  layout
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.97 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                  style={{
                    borderRadius: 16,
                    background: palette.softSurface,
                    border: `1px solid ${palette.border}`,
                    padding: 12,
                    marginBottom: index === subjects.length - 1 ? 0 : 10,
                  }}
                >
                  <div style={{ display: "grid", gap: 10 }}>
                    <div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 10,
                          marginBottom: 5,
                        }}
                      >
                        <label htmlFor={`subject-name-${subject.id}`} style={labelStyle()}>
                          Subject label/name
                        </label>
                        <button
                          type="button"
                          onClick={() => removeSubject(subject.id)}
                          disabled={subjects.length === 1}
                          aria-label={`Remove ${subject.name || "subject"}`}
                          className="hover-press"
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 12,
                            border: `1px solid ${
                              subjects.length === 1
                                ? "rgba(139,115,85,0.12)"
                                : "rgba(185,28,28,0.22)"
                            }`,
                            background:
                              subjects.length === 1
                                ? "rgba(139,115,85,0.08)"
                                : "rgba(185,28,28,0.10)",
                            color: subjects.length === 1 ? c.warmGray : "#B91C1C",
                            display: "grid",
                            placeItems: "center",
                            cursor: subjects.length === 1 ? "not-allowed" : "pointer",
                            opacity: subjects.length === 1 ? 0.58 : 1,
                          }}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                      <input
                        id={`subject-name-${subject.id}`}
                        value={subject.name}
                        onChange={(event) =>
                          updateSubject(subject.id, "name", event.target.value)
                        }
                        placeholder={`Subject ${index + 1}`}
                        style={inputStyle(isDark, Boolean(subjectErrors.name))}
                      />
                      {subjectErrors.name && (
                        <p style={errorStyle()}>{subjectErrors.name}</p>
                      )}
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                      <div>
                        <label htmlFor={`subject-units-${subject.id}`} style={labelStyle()}>
                          Units
                        </label>
                        <input
                          id={`subject-units-${subject.id}`}
                          value={subject.units}
                          onChange={(event) =>
                            updateSubject(subject.id, "units", event.target.value)
                          }
                          inputMode="decimal"
                          type="number"
                          min="0"
                          step="0.5"
                          placeholder="3"
                          style={inputStyle(isDark, Boolean(subjectErrors.units))}
                        />
                        {subjectErrors.units && (
                          <p style={errorStyle()}>{subjectErrors.units}</p>
                        )}
                      </div>
                      <div>
                        <label htmlFor={`subject-grade-${subject.id}`} style={labelStyle()}>
                          Grade
                        </label>
                        <input
                          id={`subject-grade-${subject.id}`}
                          value={subject.grade}
                          onChange={(event) =>
                            updateSubject(subject.id, "grade", event.target.value)
                          }
                          inputMode="decimal"
                          type="number"
                          min="1"
                          max="5"
                          step="0.25"
                          placeholder="1.75"
                          style={inputStyle(isDark, Boolean(subjectErrors.grade))}
                        />
                        {subjectErrors.grade && (
                          <p style={errorStyle()}>{subjectErrors.grade}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </section>

        {notice && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              borderRadius: 14,
              padding: 12,
              background: isDark ? "rgba(220,38,38,0.16)" : "rgba(254,226,226,0.95)",
              color: isDark ? "#FCA5A5" : "#991B1B",
              border: "1px solid rgba(220,38,38,0.22)",
              display: "flex",
              gap: 8,
              alignItems: "flex-start",
              marginBottom: 14,
            }}
          >
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
            <p
              style={{
                margin: 0,
                fontFamily: fonts.ui,
                fontSize: 12,
                fontWeight: 800,
                lineHeight: 1.4,
              }}
            >
              {notice}
            </p>
          </motion.div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 48px", gap: 10 }}>
          <button
            type="button"
            onClick={calculateGwa}
            className="hover-lift"
            style={{
              border: "none",
              borderRadius: 14,
              minHeight: 50,
              background: `linear-gradient(135deg, ${palette.deepest} 0%, ${palette.deep} 48%, ${palette.bright} 100%)`,
              color: palette.cream,
              fontFamily: fonts.ui,
              fontSize: 14,
              fontWeight: 900,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              cursor: "pointer",
              boxShadow: "0 10px 22px rgba(102,11,5,0.26)",
            }}
          >
            <Calculator size={18} />
            Calculate GWA
          </button>
          <button
            type="button"
            onClick={resetCalculator}
            aria-label="Reset calculator"
            className="hover-press"
            style={{
              border: `1px solid ${palette.border}`,
              borderRadius: 14,
              minHeight: 50,
              background: palette.surface,
              color: palette.bright,
              display: "grid",
              placeItems: "center",
              cursor: "pointer",
              boxShadow: shadow.card,
            }}
          >
            <RotateCcw size={18} />
          </button>
        </div>

        <AnimatePresence mode="wait">
          {result && (
            <motion.section
              key={resultVersion}
              initial={{ opacity: 0, y: 14, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              style={{
                marginTop: 14,
                display: "grid",
                gap: 12,
              }}
            >
              <div
                style={{
                  borderRadius: 18,
                  padding: 16,
                  background: palette.surface,
                  boxShadow: shadow.card,
                  border: `1px solid ${palette.border}`,
                }}
              >
                <p
                  style={{
                    margin: 0,
                    fontFamily: fonts.ui,
                    fontSize: 11,
                    color: c.warmGray,
                    fontWeight: 900,
                    letterSpacing: 0.6,
                    textTransform: "uppercase",
                  }}
                >
                  Final GWA
                </p>
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-end",
                    justifyContent: "space-between",
                    gap: 12,
                    marginTop: 4,
                  }}
                >
                  <p
                    style={{
                      margin: 0,
                      fontFamily: fonts.display,
                      fontSize: 42,
                      lineHeight: 1,
                      fontWeight: 900,
                      color: palette.bright,
                    }}
                  >
                    {formatGwa(result.gwa)}
                  </p>
                  <div style={{ textAlign: "right" }}>
                    <p
                      style={{
                        margin: 0,
                        fontFamily: fonts.mono,
                        fontSize: 11,
                        color: c.darkBrown,
                      }}
                    >
                      Units: {result.totalUnits}
                    </p>
                    <p
                      style={{
                        margin: "3px 0 0",
                        fontFamily: fonts.mono,
                        fontSize: 10,
                        color: c.warmGray,
                      }}
                    >
                      Weighted: {result.weightedTotal.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              <div
                style={{
                  borderRadius: 18,
                  padding: 15,
                  background: result.qualified
                    ? isDark
                      ? "rgba(5,150,105,0.16)"
                      : "rgba(220,252,231,0.96)"
                    : isDark
                      ? "rgba(185,28,28,0.16)"
                      : "rgba(254,226,226,0.96)",
                  border: `1px solid ${
                    result.qualified ? "rgba(5,150,105,0.26)" : "rgba(185,28,28,0.24)"
                  }`,
                  boxShadow: shadow.card,
                  display: "flex",
                  gap: 12,
                  alignItems: "flex-start",
                }}
              >
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 14,
                    background: result.qualified ? "#059669" : "#B91C1C",
                    color: "#FFFFFF",
                    display: "grid",
                    placeItems: "center",
                    flexShrink: 0,
                  }}
                >
                  {result.qualified ? <Trophy size={20} /> : <AlertCircle size={20} />}
                </div>
                <div style={{ minWidth: 0 }}>
                  <p
                    style={{
                      margin: 0,
                      fontFamily: fonts.ui,
                      fontSize: 14,
                      fontWeight: 900,
                      color: result.qualified
                        ? isDark
                          ? "#A7F3D0"
                          : "#065F46"
                        : isDark
                          ? "#FCA5A5"
                          : "#991B1B",
                      lineHeight: 1.25,
                    }}
                  >
                    {result.qualified
                      ? "Qualified for Dean's List"
                      : "Not Qualified for Dean's List"}
                  </p>
                  <p
                    style={{
                      margin: "5px 0 0",
                      fontFamily: fonts.ui,
                      fontSize: 12,
                      fontWeight: 700,
                      color: result.qualified
                        ? isDark
                          ? "#D1FAE5"
                          : "#047857"
                        : isDark
                          ? "#FECACA"
                          : "#B91C1C",
                      lineHeight: 1.45,
                    }}
                  >
                    {result.reason}
                  </p>
                </div>
                {result.qualified && (
                  <CheckCircle2
                    size={18}
                    color={isDark ? "#A7F3D0" : "#059669"}
                    style={{ marginLeft: "auto", flexShrink: 0 }}
                  />
                )}
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        <div style={{ height: 12 }} />
      </div>
    </div>
  );
}
