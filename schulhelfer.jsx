import { useState, useEffect, useRef } from "react";

const SUBJECTS = [
  { name: "Deutsch", emoji: "📖", color: "#E84855" },
  { name: "Mathematik", emoji: "📐", color: "#3185FC" },
  { name: "Englisch", emoji: "🇬🇧", color: "#5B2C6F" },
  { name: "Französisch", emoji: "🇫🇷", color: "#2471A3" },
  { name: "Spanisch", emoji: "🇪🇸", color: "#D4AC0D" },
  { name: "Latein", emoji: "🏛️", color: "#7D6608" },
  { name: "Geschichte", emoji: "⏳", color: "#A0522D" },
  { name: "Politik/Wirtschaft", emoji: "🏛️", color: "#1A5276" },
  { name: "Erdkunde", emoji: "🌍", color: "#1E8449" },
  { name: "Physik", emoji: "⚛️", color: "#2E86C1" },
  { name: "Chemie", emoji: "🧪", color: "#6C3483" },
  { name: "Biologie", emoji: "🧬", color: "#27AE60" },
  { name: "Informatik", emoji: "💻", color: "#1ABC9C" },
  { name: "Kunst", emoji: "🎨", color: "#E74C3C" },
  { name: "Musik", emoji: "🎵", color: "#8E44AD" },
  { name: "Sport", emoji: "⚽", color: "#E67E22" },
  { name: "Religion", emoji: "✝️", color: "#7F8C8D" },
  { name: "Ethik", emoji: "🤔", color: "#566573" },
  { name: "Philosophie", emoji: "💭", color: "#5D6D7E" },
  { name: "Seminarfach", emoji: "📝", color: "#34495E" },
];

const POINT_LABELS = {
  15: "1+", 14: "1", 13: "1-",
  12: "2+", 11: "2", 10: "2-",
  9: "3+", 8: "3", 7: "3-",
  6: "4+", 5: "4", 4: "4-",
  3: "5+", 2: "5", 1: "5-",
  0: "6",
};

function getPointColor(p) {
  if (p >= 13) return "#16a34a";
  if (p >= 10) return "#65a30d";
  if (p >= 7) return "#ca8a04";
  if (p >= 4) return "#ea580c";
  return "#dc2626";
}

function getSubject(name) {
  return SUBJECTS.find((s) => s.name === name) || SUBJECTS[0];
}

// Storage helpers
async function loadData(key, fallback) {
  try {
    const res = await window.storage.get(key);
    return res ? JSON.parse(res.value) : fallback;
  } catch {
    return fallback;
  }
}

async function saveData(key, value) {
  try {
    await window.storage.set(key, JSON.stringify(value));
  } catch (e) {
    console.error("Storage error:", e);
  }
}

export default function SchulHelfer() {
  const [tab, setTab] = useState("homework");
  const [homework, setHomework] = useState([]);
  const [grades, setGrades] = useState([]);
  const [loaded, setLoaded] = useState(false);

  // Homework form
  const [hwSubject, setHwSubject] = useState(SUBJECTS[0].name);
  const [hwText, setHwText] = useState("");
  const [hwDate, setHwDate] = useState("");
  const [showHwForm, setShowHwForm] = useState(false);

  // Grade form
  const [grSubject, setGrSubject] = useState(SUBJECTS[0].name);
  const [grPoints, setGrPoints] = useState(10);
  const [grType, setGrType] = useState("Klausur");
  const [grNote, setGrNote] = useState("");
  const [showGrForm, setShowGrForm] = useState(false);

  const hwRef = useRef(null);
  const grRef = useRef(null);

  useEffect(() => {
    (async () => {
      const hw = await loadData("schulhelfer-homework", []);
      const gr = await loadData("schulhelfer-grades", []);
      setHomework(hw);
      setGrades(gr);
      setLoaded(true);
    })();
  }, []);

  useEffect(() => {
    if (loaded) saveData("schulhelfer-homework", homework);
  }, [homework, loaded]);

  useEffect(() => {
    if (loaded) saveData("schulhelfer-grades", grades);
  }, [grades, loaded]);

  // Homework actions
  const addHomework = () => {
    if (!hwText.trim()) return;
    const item = {
      id: Date.now(),
      subject: hwSubject,
      text: hwText.trim(),
      due: hwDate || null,
      done: false,
    };
    setHomework([item, ...homework]);
    setHwText("");
    setHwDate("");
    setShowHwForm(false);
  };

  const toggleDone = (id) => {
    setHomework(homework.map((h) => (h.id === id ? { ...h, done: !h.done } : h)));
  };

  const removeHomework = (id) => {
    setHomework(homework.filter((h) => h.id !== id));
  };

  // Grade actions
  const addGrade = () => {
    const item = {
      id: Date.now(),
      subject: grSubject,
      points: grPoints,
      type: grType,
      note: grNote.trim(),
      date: new Date().toISOString().slice(0, 10),
    };
    setGrades([item, ...grades]);
    setGrNote("");
    setShowGrForm(false);
  };

  const removeGrade = (id) => {
    setGrades(grades.filter((g) => g.id !== id));
  };

  // Calculate averages
  const avgBySubject = {};
  grades.forEach((g) => {
    if (!avgBySubject[g.subject]) avgBySubject[g.subject] = [];
    avgBySubject[g.subject].push(g.points);
  });

  const totalAvg =
    grades.length > 0
      ? (grades.reduce((s, g) => s + g.points, 0) / grades.length).toFixed(1)
      : null;

  const openHomework = homework.filter((h) => !h.done);
  const doneHomework = homework.filter((h) => h.done);

  if (!loaded) {
    return (
      <div style={styles.loadWrap}>
        <div style={styles.spinner} />
      </div>
    );
  }

  return (
    <div style={styles.root}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerInner}>
          <span style={styles.logo}>🎓</span>
          <h1 style={styles.title}>SchulHelfer</h1>
          <p style={styles.subtitle}>Oberstufe im Griff</p>
        </div>
      </div>

      {/* Tabs */}
      <div style={styles.tabBar}>
        <button
          onClick={() => setTab("homework")}
          style={{
            ...styles.tabBtn,
            ...(tab === "homework" ? styles.tabActive : {}),
          }}
        >
          <span style={styles.tabEmoji}>📋</span>
          <span>Hausaufgaben</span>
          {openHomework.length > 0 && (
            <span style={styles.badge}>{openHomework.length}</span>
          )}
        </button>
        <button
          onClick={() => setTab("grades")}
          style={{
            ...styles.tabBtn,
            ...(tab === "grades" ? styles.tabActive : {}),
          }}
        >
          <span style={styles.tabEmoji}>📊</span>
          <span>Noten</span>
        </button>
      </div>

      <div style={styles.content}>
        {/* ---- HOMEWORK TAB ---- */}
        {tab === "homework" && (
          <div>
            {!showHwForm ? (
              <button style={styles.addBtn} onClick={() => setShowHwForm(true)}>
                + Neue Hausaufgabe
              </button>
            ) : (
              <div style={styles.formCard}>
                <h3 style={styles.formTitle}>Neue Hausaufgabe</h3>
                <label style={styles.label}>Fach</label>
                <select
                  value={hwSubject}
                  onChange={(e) => setHwSubject(e.target.value)}
                  style={styles.select}
                >
                  {SUBJECTS.map((s) => (
                    <option key={s.name} value={s.name}>
                      {s.emoji} {s.name}
                    </option>
                  ))}
                </select>
                <label style={styles.label}>Aufgabe</label>
                <input
                  ref={hwRef}
                  type="text"
                  value={hwText}
                  onChange={(e) => setHwText(e.target.value)}
                  placeholder="z.B. S. 42 Nr. 3a-d"
                  style={styles.input}
                  onKeyDown={(e) => e.key === "Enter" && addHomework()}
                />
                <label style={styles.label}>Fällig am (optional)</label>
                <input
                  type="date"
                  value={hwDate}
                  onChange={(e) => setHwDate(e.target.value)}
                  style={styles.input}
                />
                <div style={styles.formActions}>
                  <button style={styles.cancelBtn} onClick={() => setShowHwForm(false)}>
                    Abbrechen
                  </button>
                  <button style={styles.submitBtn} onClick={addHomework}>
                    Hinzufügen
                  </button>
                </div>
              </div>
            )}

            {openHomework.length === 0 && doneHomework.length === 0 && (
              <div style={styles.empty}>
                <span style={{ fontSize: 48 }}>📚</span>
                <p style={styles.emptyText}>Keine Hausaufgaben eingetragen.</p>
                <p style={styles.emptyHint}>Tippe auf "+ Neue Hausaufgabe" um loszulegen!</p>
              </div>
            )}

            {openHomework.map((h) => {
              const subj = getSubject(h.subject);
              const overdue = h.due && new Date(h.due) < new Date(new Date().toDateString());
              return (
                <div key={h.id} style={styles.hwCard}>
                  <div style={styles.hwLeft} onClick={() => toggleDone(h.id)}>
                    <div
                      style={{
                        ...styles.checkbox,
                        borderColor: subj.color,
                      }}
                    />
                  </div>
                  <div style={styles.hwBody}>
                    <div style={styles.hwHeader}>
                      <span
                        style={{
                          ...styles.subjectTag,
                          backgroundColor: subj.color + "18",
                          color: subj.color,
                        }}
                      >
                        {subj.emoji} {subj.name}
                      </span>
                      {overdue && <span style={styles.overdueTag}>Überfällig!</span>}
                    </div>
                    <p style={styles.hwText}>{h.text}</p>
                    {h.due && (
                      <p style={{ ...styles.hwDue, color: overdue ? "#dc2626" : "#6b7280" }}>
                        Fällig: {new Date(h.due).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" })}
                      </p>
                    )}
                  </div>
                  <button style={styles.deleteBtn} onClick={() => removeHomework(h.id)}>
                    ✕
                  </button>
                </div>
              );
            })}

            {doneHomework.length > 0 && (
              <>
                <div style={styles.sectionHeader}>
                  <span style={styles.sectionLine} />
                  <span style={styles.sectionLabel}>Erledigt ({doneHomework.length})</span>
                  <span style={styles.sectionLine} />
                </div>
                {doneHomework.map((h) => {
                  const subj = getSubject(h.subject);
                  return (
                    <div key={h.id} style={{ ...styles.hwCard, opacity: 0.55 }}>
                      <div style={styles.hwLeft} onClick={() => toggleDone(h.id)}>
                        <div
                          style={{
                            ...styles.checkbox,
                            ...styles.checkboxDone,
                            borderColor: subj.color,
                            backgroundColor: subj.color,
                          }}
                        >
                          ✓
                        </div>
                      </div>
                      <div style={styles.hwBody}>
                        <span
                          style={{
                            ...styles.subjectTag,
                            backgroundColor: subj.color + "18",
                            color: subj.color,
                            fontSize: 11,
                          }}
                        >
                          {subj.emoji} {subj.name}
                        </span>
                        <p style={{ ...styles.hwText, textDecoration: "line-through" }}>{h.text}</p>
                      </div>
                      <button style={styles.deleteBtn} onClick={() => removeHomework(h.id)}>
                        ✕
                      </button>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        )}

        {/* ---- GRADES TAB ---- */}
        {tab === "grades" && (
          <div>
            {/* Average overview */}
            {totalAvg !== null && (
              <div style={styles.avgCard}>
                <div style={styles.avgMain}>
                  <span style={styles.avgLabel}>Gesamtschnitt</span>
                  <span style={{ ...styles.avgValue, color: getPointColor(Math.round(totalAvg)) }}>
                    {totalAvg} Punkte
                  </span>
                  <span style={styles.avgNote}>
                    ≈ Note {POINT_LABELS[Math.round(totalAvg)]} &nbsp;·&nbsp; {grades.length} Einträge
                  </span>
                </div>
              </div>
            )}

            {/* Per-subject averages */}
            {Object.keys(avgBySubject).length > 0 && (
              <div style={styles.subjectGrid}>
                {Object.entries(avgBySubject).map(([name, pts]) => {
                  const avg = (pts.reduce((a, b) => a + b, 0) / pts.length).toFixed(1);
                  const subj = getSubject(name);
                  return (
                    <div key={name} style={styles.subjectAvgCard}>
                      <span style={{ fontSize: 20 }}>{subj.emoji}</span>
                      <span style={styles.subjectAvgName}>{subj.name}</span>
                      <span style={{ ...styles.subjectAvgVal, color: getPointColor(Math.round(avg)) }}>
                        {avg}
                      </span>
                      <span style={styles.subjectAvgSub}>{pts.length}× · ≈{POINT_LABELS[Math.round(avg)]}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {!showGrForm ? (
              <button style={styles.addBtn} onClick={() => setShowGrForm(true)}>
                + Neue Note eintragen
              </button>
            ) : (
              <div style={styles.formCard}>
                <h3 style={styles.formTitle}>Note eintragen</h3>
                <label style={styles.label}>Fach</label>
                <select
                  value={grSubject}
                  onChange={(e) => setGrSubject(e.target.value)}
                  style={styles.select}
                >
                  {SUBJECTS.map((s) => (
                    <option key={s.name} value={s.name}>
                      {s.emoji} {s.name}
                    </option>
                  ))}
                </select>

                <label style={styles.label}>Art</label>
                <div style={styles.typeRow}>
                  {["Klausur", "Mündlich", "Sonstige"].map((t) => (
                    <button
                      key={t}
                      onClick={() => setGrType(t)}
                      style={{
                        ...styles.typeBtn,
                        ...(grType === t ? styles.typeBtnActive : {}),
                      }}
                    >
                      {t}
                    </button>
                  ))}
                </div>

                <label style={styles.label}>
                  Punkte: <strong>{grPoints}</strong> ({POINT_LABELS[grPoints]})
                </label>
                <div style={styles.pointsRow}>
                  <span style={styles.pointsLabel}>0</span>
                  <input
                    type="range"
                    min={0}
                    max={15}
                    value={grPoints}
                    onChange={(e) => setGrPoints(Number(e.target.value))}
                    style={{
                      ...styles.slider,
                      background: `linear-gradient(to right, ${getPointColor(grPoints)} 0%, ${getPointColor(grPoints)} ${(grPoints / 15) * 100}%, #ddd ${(grPoints / 15) * 100}%, #ddd 100%)`,
                    }}
                  />
                  <span style={styles.pointsLabel}>15</span>
                </div>
                <div style={styles.quickPoints}>
                  {[15, 13, 11, 9, 7, 5, 3, 0].map((p) => (
                    <button
                      key={p}
                      onClick={() => setGrPoints(p)}
                      style={{
                        ...styles.quickBtn,
                        backgroundColor: grPoints === p ? getPointColor(p) : "#f3f4f6",
                        color: grPoints === p ? "#fff" : "#374151",
                      }}
                    >
                      {p}
                    </button>
                  ))}
                </div>

                <label style={styles.label}>Anmerkung (optional)</label>
                <input
                  ref={grRef}
                  type="text"
                  value={grNote}
                  onChange={(e) => setGrNote(e.target.value)}
                  placeholder="z.B. Gedichtanalyse"
                  style={styles.input}
                  onKeyDown={(e) => e.key === "Enter" && addGrade()}
                />
                <div style={styles.formActions}>
                  <button style={styles.cancelBtn} onClick={() => setShowGrForm(false)}>
                    Abbrechen
                  </button>
                  <button style={styles.submitBtn} onClick={addGrade}>
                    Eintragen
                  </button>
                </div>
              </div>
            )}

            {grades.length === 0 && (
              <div style={styles.empty}>
                <span style={{ fontSize: 48 }}>📊</span>
                <p style={styles.emptyText}>Noch keine Noten eingetragen.</p>
                <p style={styles.emptyHint}>Trage deine Punkte ein, um deinen Schnitt zu sehen!</p>
              </div>
            )}

            {grades.map((g) => {
              const subj = getSubject(g.subject);
              return (
                <div key={g.id} style={styles.gradeCard}>
                  <div
                    style={{
                      ...styles.gradePoints,
                      backgroundColor: getPointColor(g.points) + "15",
                      color: getPointColor(g.points),
                    }}
                  >
                    <span style={styles.gradeNum}>{g.points}</span>
                    <span style={styles.gradeNote2}>{POINT_LABELS[g.points]}</span>
                  </div>
                  <div style={styles.gradeBody}>
                    <div style={styles.gradeTop}>
                      <span
                        style={{
                          ...styles.subjectTag,
                          backgroundColor: subj.color + "18",
                          color: subj.color,
                        }}
                      >
                        {subj.emoji} {subj.name}
                      </span>
                      <span style={styles.gradeType}>{g.type}</span>
                    </div>
                    {g.note && <p style={styles.gradeNoteText}>{g.note}</p>}
                    <p style={styles.gradeDate}>
                      {new Date(g.date).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" })}
                    </p>
                  </div>
                  <button style={styles.deleteBtn} onClick={() => removeGrade(g.id)}>
                    ✕
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  root: {
    fontFamily: "'Nunito', 'Segoe UI', sans-serif",
    maxWidth: 520,
    margin: "0 auto",
    minHeight: "100vh",
    background: "linear-gradient(160deg, #fdf6ee 0%, #eef2ff 50%, #f0fdf4 100%)",
    position: "relative",
  },
  loadWrap: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "100vh",
  },
  spinner: {
    width: 36,
    height: 36,
    border: "4px solid #e5e7eb",
    borderTopColor: "#6366f1",
    borderRadius: "50%",
    animation: "spin 0.7s linear infinite",
  },
  header: {
    background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #a855f7 100%)",
    padding: "32px 20px 28px",
    borderRadius: "0 0 28px 28px",
    boxShadow: "0 8px 32px rgba(79,70,229,0.25)",
  },
  headerInner: {
    textAlign: "center",
  },
  logo: {
    fontSize: 40,
    display: "block",
    marginBottom: 4,
    filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.2))",
  },
  title: {
    margin: 0,
    fontSize: 28,
    fontWeight: 800,
    color: "#fff",
    letterSpacing: "-0.5px",
  },
  subtitle: {
    margin: "4px 0 0",
    fontSize: 14,
    color: "rgba(255,255,255,0.75)",
    fontWeight: 500,
  },
  tabBar: {
    display: "flex",
    gap: 8,
    padding: "14px 16px 0",
    position: "sticky",
    top: 0,
    zIndex: 10,
    background: "linear-gradient(160deg, #fdf6ee 0%, #eef2ff 50%)",
  },
  tabBtn: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    padding: "10px 8px",
    border: "none",
    borderRadius: 14,
    background: "#fff",
    color: "#6b7280",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.2s",
    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
    fontFamily: "inherit",
    position: "relative",
  },
  tabActive: {
    background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
    color: "#fff",
    boxShadow: "0 4px 16px rgba(79,70,229,0.3)",
  },
  tabEmoji: {
    fontSize: 16,
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    background: "#ef4444",
    color: "#fff",
    fontSize: 11,
    fontWeight: 700,
    borderRadius: 10,
    padding: "1px 7px",
    minWidth: 18,
    textAlign: "center",
  },
  content: {
    padding: "14px 16px 32px",
  },
  addBtn: {
    width: "100%",
    padding: "14px",
    border: "2px dashed #c7d2fe",
    borderRadius: 16,
    background: "rgba(255,255,255,0.6)",
    color: "#6366f1",
    fontSize: 15,
    fontWeight: 700,
    cursor: "pointer",
    transition: "all 0.2s",
    marginBottom: 14,
    fontFamily: "inherit",
  },
  formCard: {
    background: "#fff",
    borderRadius: 20,
    padding: "20px",
    marginBottom: 14,
    boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
    border: "1px solid rgba(99,102,241,0.15)",
  },
  formTitle: {
    margin: "0 0 14px",
    fontSize: 17,
    fontWeight: 700,
    color: "#1f2937",
  },
  label: {
    display: "block",
    fontSize: 12,
    fontWeight: 600,
    color: "#6b7280",
    marginBottom: 4,
    marginTop: 10,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  select: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 10,
    border: "1.5px solid #e5e7eb",
    fontSize: 14,
    fontFamily: "inherit",
    background: "#fafafa",
    color: "#1f2937",
    outline: "none",
    boxSizing: "border-box",
  },
  input: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 10,
    border: "1.5px solid #e5e7eb",
    fontSize: 14,
    fontFamily: "inherit",
    background: "#fafafa",
    color: "#1f2937",
    outline: "none",
    boxSizing: "border-box",
  },
  typeRow: {
    display: "flex",
    gap: 6,
    marginTop: 2,
  },
  typeBtn: {
    flex: 1,
    padding: "8px",
    border: "1.5px solid #e5e7eb",
    borderRadius: 10,
    background: "#fafafa",
    fontSize: 13,
    fontWeight: 600,
    color: "#6b7280",
    cursor: "pointer",
    transition: "all 0.15s",
    fontFamily: "inherit",
  },
  typeBtnActive: {
    borderColor: "#6366f1",
    background: "#eef2ff",
    color: "#4f46e5",
  },
  pointsRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginTop: 2,
  },
  pointsLabel: {
    fontSize: 12,
    fontWeight: 700,
    color: "#9ca3af",
    minWidth: 16,
    textAlign: "center",
  },
  slider: {
    flex: 1,
    height: 6,
    borderRadius: 4,
    appearance: "auto",
    outline: "none",
    cursor: "pointer",
    accentColor: "#6366f1",
  },
  quickPoints: {
    display: "flex",
    gap: 4,
    marginTop: 8,
    flexWrap: "wrap",
  },
  quickBtn: {
    width: 38,
    height: 32,
    border: "none",
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    transition: "all 0.15s",
    fontFamily: "inherit",
  },
  formActions: {
    display: "flex",
    gap: 8,
    marginTop: 16,
  },
  cancelBtn: {
    flex: 1,
    padding: "10px",
    border: "1.5px solid #e5e7eb",
    borderRadius: 12,
    background: "#fff",
    color: "#6b7280",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  submitBtn: {
    flex: 1,
    padding: "10px",
    border: "none",
    borderRadius: 12,
    background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
    color: "#fff",
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(99,102,241,0.3)",
    fontFamily: "inherit",
  },
  empty: {
    textAlign: "center",
    padding: "40px 20px",
  },
  emptyText: {
    fontSize: 16,
    fontWeight: 600,
    color: "#6b7280",
    margin: "12px 0 4px",
  },
  emptyHint: {
    fontSize: 13,
    color: "#9ca3af",
    margin: 0,
  },
  hwCard: {
    display: "flex",
    alignItems: "flex-start",
    gap: 10,
    background: "#fff",
    borderRadius: 16,
    padding: "14px",
    marginBottom: 8,
    boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
    transition: "all 0.2s",
  },
  hwLeft: {
    cursor: "pointer",
    paddingTop: 2,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 7,
    border: "2.5px solid",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.15s",
    fontSize: 13,
    color: "transparent",
    fontWeight: 700,
  },
  checkboxDone: {
    color: "#fff",
    fontSize: 13,
  },
  hwBody: {
    flex: 1,
    minWidth: 0,
  },
  hwHeader: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
    marginBottom: 4,
  },
  subjectTag: {
    display: "inline-flex",
    alignItems: "center",
    gap: 3,
    padding: "2px 8px",
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 700,
    whiteSpace: "nowrap",
  },
  overdueTag: {
    fontSize: 11,
    fontWeight: 700,
    color: "#dc2626",
    background: "#fef2f2",
    padding: "2px 6px",
    borderRadius: 5,
  },
  hwText: {
    margin: "2px 0",
    fontSize: 14,
    color: "#1f2937",
    lineHeight: 1.4,
    wordBreak: "break-word",
  },
  hwDue: {
    margin: "2px 0 0",
    fontSize: 12,
    fontWeight: 500,
  },
  deleteBtn: {
    border: "none",
    background: "none",
    color: "#d1d5db",
    fontSize: 16,
    cursor: "pointer",
    padding: "4px",
    lineHeight: 1,
    borderRadius: 6,
    transition: "color 0.15s",
    fontFamily: "inherit",
  },
  sectionHeader: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    margin: "16px 0 8px",
  },
  sectionLine: {
    flex: 1,
    height: 1,
    background: "#e5e7eb",
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: 600,
    color: "#9ca3af",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  avgCard: {
    background: "linear-gradient(135deg, #fff 0%, #f5f3ff 100%)",
    borderRadius: 20,
    padding: "20px",
    marginBottom: 14,
    boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
    border: "1px solid rgba(99,102,241,0.12)",
    textAlign: "center",
  },
  avgMain: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 2,
  },
  avgLabel: {
    fontSize: 12,
    fontWeight: 600,
    color: "#9ca3af",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  avgValue: {
    fontSize: 32,
    fontWeight: 800,
    letterSpacing: "-1px",
  },
  avgNote: {
    fontSize: 13,
    color: "#6b7280",
    fontWeight: 500,
  },
  subjectGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
    gap: 8,
    marginBottom: 14,
  },
  subjectAvgCard: {
    background: "#fff",
    borderRadius: 14,
    padding: "12px 10px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 2,
    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
  },
  subjectAvgName: {
    fontSize: 12,
    fontWeight: 600,
    color: "#4b5563",
  },
  subjectAvgVal: {
    fontSize: 24,
    fontWeight: 800,
    letterSpacing: "-0.5px",
  },
  subjectAvgSub: {
    fontSize: 11,
    color: "#9ca3af",
    fontWeight: 500,
  },
  gradeCard: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    background: "#fff",
    borderRadius: 16,
    padding: "12px 14px",
    marginBottom: 8,
    boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
  },
  gradePoints: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    width: 50,
    height: 50,
    borderRadius: 14,
    flexShrink: 0,
  },
  gradeNum: {
    fontSize: 22,
    fontWeight: 800,
    lineHeight: 1,
  },
  gradeNote2: {
    fontSize: 10,
    fontWeight: 600,
    opacity: 0.8,
  },
  gradeBody: {
    flex: 1,
    minWidth: 0,
  },
  gradeTop: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    marginBottom: 2,
  },
  gradeType: {
    fontSize: 11,
    fontWeight: 600,
    color: "#9ca3af",
    textTransform: "uppercase",
    letterSpacing: "0.3px",
  },
  gradeNoteText: {
    margin: "2px 0",
    fontSize: 13,
    color: "#4b5563",
  },
  gradeDate: {
    margin: "2px 0 0",
    fontSize: 12,
    color: "#9ca3af",
  },
};
