"use client";

import { useState, useRef } from "react";

interface Props {
  sessionId: string;
  apiBase: string;
  endpoint?: string;
  onComplete: (result: Record<string, unknown>) => void;
  addLog: (level: string, msg: string) => void;
}


export default function IdentityVerify({
  sessionId,
  apiBase,
  endpoint = "/vendor/verify-identity",
  onComplete,
  addLog,
}: Props) {

  const [nin, setNin] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dob, setDob] = useState("");
  const [selfie, setSelfie] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  /** Resize + compress image to JPEG at max 640px wide, quality 0.7 (~80–120 KB) */
  const compressImage = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        const MAX = 640;
        let { width, height } = img;
        if (width > MAX) { height = Math.round(height * MAX / width); width = MAX; }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d")!.drawImage(img, 0, 0, width, height);
        URL.revokeObjectURL(url);
        resolve(canvas.toDataURL("image/jpeg", 0.7));
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Failed to load image")); };
      img.src = url;
    });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) { setSelfie(null); return; }
    if (!file.type.startsWith("image/")) { setError("Please upload a valid image."); return; }
    if (file.size > 10 * 1024 * 1024) { setError("Image must be less than 10MB."); return; }
    setError(null);
    try {
      const compressed = await compressImage(file);
      setSelfie(compressed);
      const kb = Math.round(compressed.length * 3 / 4 / 1024);
      addLog("info", `Selfie compressed: ~${kb} KB`);
    } catch {
      setError("Failed to process image.");
      addLog("error", "Failed to compress selfie image");
    }
  };

  const resetForm = () => {
    setNin(""); setFirstName(""); setLastName(""); setDob(""); setSelfie(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selfie) { setError("Please upload a selfie image."); return; }
    if (nin.length !== 11) { setError("NIN must be exactly 11 digits."); return; }
    setLoading(true);
    setError(null);
    try {
      addLog("info", `POST ${apiBase}${endpoint}`);
      const res = await fetch(`${apiBase}${endpoint}`, {

        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          nin,
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          date_of_birth: dob,
          selfie_image: selfie,
        }),
      });
      let data: any = {};
      try { data = await res.json(); } catch { throw new Error("Invalid server response"); }
      if (!res.ok) throw new Error(data?.detail || data?.message || `HTTP ${res.status}`);
      addLog("success", `Identity verified → ${JSON.stringify(data)}`);
      onComplete(data);
      resetForm();
    } catch (err: any) {
      const message = err?.message || "Identity verification failed";
      setError(message);
      addLog("error", `Identity verify failed: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fadeup" style={{ maxWidth: "100%", width: "100%" }}>
      <div style={{ marginBottom: "24px" }}>
        <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: "clamp(20px, 6vw, 28px)", fontWeight: 700, letterSpacing: "-0.02em", marginBottom: "6px" }}>
          Identity Verification
        </h2>
        <p style={{ color: "var(--vault-text-dim)", fontSize: "12px" }}>
          NIN verification via Youverify — step 3 of 3
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px", maxWidth: "480px" }}>

        {/* NIN */}
        <div>
          <label style={labelStyle}>NIN</label>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={nin}
            onChange={e => setNin(e.target.value.replace(/\D/g, "").slice(0, 11))}
            placeholder="11-digit NIN"
            required
            style={inputStyle}
          />
        </div>

        {/* First + Last name row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <div>
            <label style={labelStyle}>First Name</label>
            <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} required placeholder="John" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Last Name</label>
            <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} required placeholder="Doe" style={inputStyle} />
          </div>
        </div>

        {/* Date of birth */}
        <div>
          <label style={labelStyle}>Date of Birth</label>
          <input type="date" value={dob} onChange={e => setDob(e.target.value)} required style={inputStyle} />
        </div>

        {/* Selfie */}
        <div>
          <label style={labelStyle}>Selfie Image</label>
          <div
            style={{
              border: "1px dashed var(--vault-border)",
              borderRadius: "2px",
              padding: "16px",
              textAlign: "center",
              cursor: "pointer",
              background: selfie ? "rgba(0,230,118,0.04)" : "var(--vault-surface)",
              borderColor: selfie ? "var(--vault-green)" : "var(--vault-border)",
              transition: "all 0.2s",
            }}
            onClick={() => fileInputRef.current?.click()}
          >
            {selfie ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
                <img src={selfie} alt="Selfie preview" style={{ width: 100, height: 100, objectFit: "cover", borderRadius: "50%", border: "2px solid var(--vault-green)" }} />
                <span style={{ fontSize: "11px", color: "var(--vault-green)" }}>✓ Image selected — tap to change</span>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: "24px", marginBottom: "8px" }}>📷</div>
                <div style={{ fontSize: "12px", color: "var(--vault-text-dim)" }}>Tap to upload or take a selfie</div>
              </div>
            )}
          </div>
          <input
            type="file"
            accept="image/*"
            capture="user"
            ref={fileInputRef}
            onChange={handleFileChange}
            style={{ display: "none" }}
          />
        </div>

        {error && (
          <div style={{
            background: "rgba(255,61,87,0.08)",
            color: "var(--vault-red)",
            padding: "10px 14px",
            borderRadius: "2px",
            border: "1px solid var(--vault-red)",
            fontSize: "12px",
          }}>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="vault-btn vault-btn-primary"
          style={{ width: "100%", opacity: loading ? 0.6 : 1, cursor: loading ? "not-allowed" : "pointer" }}
        >
          {loading ? "Verifying..." : "Verify Identity"}
        </button>
      </form>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block",
  color: "var(--vault-text-dim)",
  fontSize: "10px",
  letterSpacing: "0.1em",
  marginBottom: "6px",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: "2px",
  border: "1px solid var(--vault-border)",
  background: "var(--vault-surface)",
  color: "var(--vault-white)",
  fontSize: "13px",
  outline: "none",
  fontFamily: "DM Mono, monospace",
};