import { useState, useRef } from "react";

const TIERS = [
  { id: "basic", label: "Basic", price: "€9", desc: "Single document analysis" },
  { id: "pro", label: "Pro", price: "€29", desc: "Deep analysis + negotiation tips" },
];

const CATEGORIES = [
  "Business Contract / Partnership",
  "Job Offer / Salary Negotiation",
  "Property Purchase",
  "Medical Treatment Choice",
  "Investment / Franchise",
  "Other",
];

function Spinner() {
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", padding:"48px 0", gap:16 }}>
      <div style={{
        width:48, height:48, borderRadius:"50%",
        border:"4px solid #e0e7ff", borderTop:"4px solid #6366f1",
        animation:"spin 0.9s linear infinite"
      }}/>
      <p style={{ color:"#6366f1", fontWeight:700, margin:0 }}>Claude is analyzing your decision…</p>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

function ScoreGauge({ score }) {
  const color = score >= 70 ? "#22c55e" : score >= 40 ? "#f59e0b" : "#ef4444";
  const label = score >= 70 ? "✅ Low Risk" : score >= 40 ? "⚠️ Medium Risk" : "🚨 High Risk";
  return (
    <div style={{ background:"#f8fafc", borderRadius:16, padding:24, textAlign:"center", border:"1px solid #e2e8f0", marginBottom:20 }}>
      <div style={{ fontSize:12, color:"#64748b", fontWeight:700, letterSpacing:1, textTransform:"uppercase", marginBottom:8 }}>Confidence Score</div>
      <div style={{ fontSize:64, fontWeight:900, color, lineHeight:1 }}>{score}<span style={{fontSize:28}}>%</span></div>
      <div style={{ marginTop:8, fontWeight:700, color }}>{label}</div>
    </div>
  );
}

function Section({ title, items, bg, icon }) {
  if (!items?.length) return null;
  return (
    <div style={{ marginBottom:18 }}>
      <div style={{ fontWeight:700, fontSize:14, marginBottom:8 }}>{icon} {title}</div>
      {items.map((item,i) => (
        <div key={i} style={{ background:bg, borderRadius:10, padding:"10px 14px", fontSize:13, marginBottom:6, color:"#1e293b", lineHeight:1.5 }}>{item}</div>
      ))}
    </div>
  );
}

export default function App() {
  const [step, setStep] = useState("form");
  const [tier, setTier] = useState("basic");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [description, setDescription] = useState("");
  const [fileText, setFileText] = useState("");
  const [fileName, setFileName] = useState("");
  const [report, setReport] = useState(null);
  const [error, setError] = useState("");
  const fileRef = useRef();

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => setFileText(ev.target.result);
    reader.readAsText(file);
  };

  const handleSubmit = async () => {
    if (!description.trim() && !fileText.trim()) {
      setError("Please describe your decision or upload a document.");
      return;
    }
    setError("");
    setStep("loading");

    const isPro = tier === "pro";
    const prompt = `You are a world-class decision analyst. Analyze this major life decision and return ONLY a valid JSON object, no markdown, no explanation.

Category: ${category}
${fileText ? `Document:\n${fileText.slice(0,3000)}\n` : ""}
${description ? `Description:\n${description}` : ""}

Return this exact JSON structure:
{
  "summary": "2-3 sentence executive summary",
  "confidence_score": <integer 0-100>,
  "pros": ["pro 1","pro 2","pro 3"],
  "cons": ["con 1","con 2","con 3"],
  "risks": ["risk 1","risk 2"],
  "questions_to_ask": ["question 1","question 2","question 3"],
  "recommendation": "Clear 1-2 sentence final recommendation"${isPro ? `,
  "deep_analysis": "3-4 sentences of deeper strategic context",
  "negotiation_tips": ["tip 1","tip 2","tip 3"]` : ""}
}`;

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({
          model:"claude-sonnet-4-20250514",
          max_tokens:1000,
          messages:[{ role:"user", content:prompt }]
        })
      });
      const data = await res.json();
      const text = data.content.map(i => i.text||"").join("");
      const parsed = JSON.parse(text.replace(/```json|```/g,"").trim());
      setReport(parsed);
      setStep("result");
    } catch(err) {
      setError("Something went wrong. Please try again.");
      setStep("form");
    }
  };

  const reset = () => { setStep("form"); setReport(null); setDescription(""); setFileText(""); setFileName(""); setError(""); };

  return (
    <div style={{ minHeight:"100vh", background:"linear-gradient(135deg,#eef2ff,#faf5ff,#f0fdf4)", fontFamily:"system-ui,sans-serif", padding:"32px 16px" }}>
      <div style={{ maxWidth:580, margin:"0 auto" }}>

        <div style={{ textAlign:"center", marginBottom:32 }}>
          <div style={{ fontSize:42, marginBottom:6 }}>🧠</div>
          <h1 style={{ fontSize:28, fontWeight:900, margin:0, background:"linear-gradient(135deg,#6366f1,#8b5cf6)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>Second Opinion</h1>
          <p style={{ color:"#64748b", marginTop:6, fontSize:14 }}>AI-powered analysis for your most important decisions</p>
        </div>

        <div style={{ background:"white", borderRadius:24, padding:28, boxShadow:"0 4px 40px rgba(99,102,241,0.12)" }}>

          {step === "form" && (
            <div>
              {/* Tier */}
              <div style={{ marginBottom:22 }}>
                <label style={{ fontWeight:700, fontSize:12, color:"#475569", display:"block", marginBottom:10, textTransform:"uppercase", letterSpacing:1 }}>Choose Plan</label>
                <div style={{ display:"flex", gap:10 }}>
                  {TIERS.map(t => (
                    <div key={t.id} onClick={() => setTier(t.id)} style={{
                      flex:1, border: tier===t.id ? "2px solid #6366f1" : "2px solid #e2e8f0",
                      borderRadius:14, padding:"14px 12px", cursor:"pointer",
                      background: tier===t.id ? "#eef2ff" : "white", transition:"all 0.2s"
                    }}>
                      <div style={{ fontWeight:800, color: tier===t.id ? "#6366f1" : "#1e293b", fontSize:15 }}>{t.label} <span style={{color:"#6366f1"}}>{t.price}</span></div>
                      <div style={{ fontSize:11, color:"#64748b", marginTop:3 }}>{t.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Category */}
              <div style={{ marginBottom:18 }}>
                <label style={{ fontWeight:700, fontSize:12, color:"#475569", display:"block", marginBottom:8, textTransform:"uppercase", letterSpacing:1 }}>Category</label>
                <select value={category} onChange={e => setCategory(e.target.value)} style={{ width:"100%", padding:"11px 13px", borderRadius:12, border:"2px solid #e2e8f0", fontSize:14, color:"#1e293b", outline:"none" }}>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>

              {/* Description */}
              <div style={{ marginBottom:18 }}>
                <label style={{ fontWeight:700, fontSize:12, color:"#475569", display:"block", marginBottom:8, textTransform:"uppercase", letterSpacing:1 }}>Describe Your Decision</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)}
                  placeholder="e.g. I've been offered a job at a startup with €60k + equity, but my current job pays €75k with stability..."
                  rows={4} style={{ width:"100%", padding:"11px 13px", borderRadius:12, border:"2px solid #e2e8f0", fontSize:13, resize:"vertical", outline:"none", boxSizing:"border-box", fontFamily:"inherit", color:"#1e293b" }}
                />
              </div>

              {/* File upload */}
              <div style={{ marginBottom:22 }}>
                <label style={{ fontWeight:700, fontSize:12, color:"#475569", display:"block", marginBottom:8, textTransform:"uppercase", letterSpacing:1 }}>Upload Document (optional)</label>
                <div onClick={() => fileRef.current.click()} style={{ border:"2px dashed #c7d2fe", borderRadius:12, padding:16, textAlign:"center", cursor:"pointer", background:"#f8faff", color:"#6366f1", fontSize:13, fontWeight:600 }}>
                  {fileName ? `📄 ${fileName}` : "📎 Upload a contract or offer letter (.txt)"}
                </div>
                <input ref={fileRef} type="file" accept=".txt,.md" style={{ display:"none" }} onChange={handleFile} />
              </div>

              {error && <div style={{ color:"#ef4444", fontSize:13, marginBottom:10 }}>{error}</div>}

              <button onClick={handleSubmit} style={{ width:"100%", padding:15, borderRadius:14, background:"linear-gradient(135deg,#6366f1,#8b5cf6)", color:"white", fontWeight:800, fontSize:15, border:"none", cursor:"pointer", boxShadow:"0 4px 20px rgba(99,102,241,0.3)" }}>
                Get My Second Opinion →
              </button>
            </div>
          )}

          {step === "loading" && <Spinner />}

          {step === "result" && report && (
            <div>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
                <h2 style={{ margin:0, fontWeight:800, fontSize:18, color:"#1e293b" }}>Your Report</h2>
                <span style={{ background:"#ede9fe", color:"#7c3aed", borderRadius:999, padding:"3px 10px", fontSize:11, fontWeight:700 }}>{category}</span>
              </div>

              <ScoreGauge score={report.confidence_score} />

              <div style={{ background:"#f1f5f9", borderRadius:12, padding:14, marginBottom:18, fontSize:13, color:"#334155", lineHeight:1.7, borderLeft:"4px solid #6366f1" }}>
                <strong style={{color:"#6366f1"}}>Summary:</strong> {report.summary}
              </div>

              <Section title="Pros" items={report.pros} bg="#f0fdf4" icon="✅" />
              <Section title="Cons" items={report.cons} bg="#fef9c3" icon="⚠️" />
              <Section title="Key Risks" items={report.risks} bg="#fee2e2" icon="🚨" />
              <Section title="Questions to Ask First" items={report.questions_to_ask} bg="#ede9fe" icon="❓" />
              {report.deep_analysis && (
                <div style={{ background:"#eef2ff", borderRadius:12, padding:14, marginBottom:18, fontSize:13, color:"#3730a3", lineHeight:1.7 }}>
                  <strong>🔬 Deep Analysis:</strong> {report.deep_analysis}
                </div>
              )}
              <Section title="Negotiation Tips" items={report.negotiation_tips} bg="#f0f9ff" icon="🤝" />

              <div style={{ background:"linear-gradient(135deg,#6366f1,#8b5cf6)", borderRadius:14, padding:18, color:"white", marginBottom:20 }}>
                <div style={{ fontWeight:800, fontSize:12, opacity:0.85, marginBottom:6, textTransform:"uppercase", letterSpacing:1 }}>💡 Final Recommendation</div>
                <div style={{ fontSize:14, lineHeight:1.6 }}>{report.recommendation}</div>
              </div>

              <button onClick={reset} style={{ width:"100%", padding:13, borderRadius:12, background:"white", color:"#6366f1", fontWeight:700, fontSize:14, border:"2px solid #6366f1", cursor:"pointer" }}>
                ← Analyze Another Decision
              </button>
            </div>
          )}
        </div>

        <p style={{ textAlign:"center", fontSize:11, color:"#94a3b8", marginTop:16 }}>
          Powered by Claude AI · Not a substitute for professional legal or financial advice
        </p>
      </div>
    </div>
  );
}
