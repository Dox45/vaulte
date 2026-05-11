"use client";

import { useState, useRef } from "react";

interface Props {
  sessionId: string;
  apiBase: string;
  onComplete: (result: Record<string, unknown>) => void;
  addLog: (level: string, msg: string) => void;
}

export default function IdentityVerify({
  sessionId,
  apiBase,
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

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];

    if (!file) {
      setSelfie(null);
      return;
    }

    // validation
    if (!file.type.startsWith("image/")) {
      setError("Please upload a valid image.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be less than 5MB.");
      return;
    }

    setError(null);

    const reader = new FileReader();

    reader.onload = () => {
      setSelfie(reader.result as string);
      addLog("info", `Selfie loaded (${file.name})`);
    };

    reader.onerror = () => {
      setError("Failed to read image.");
      addLog("error", "Failed to read selfie image");
    };

    reader.readAsDataURL(file);
  };

  const resetForm = () => {
    setNin("");
    setFirstName("");
    setLastName("");
    setDob("");
    setSelfie(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    if (!selfie) {
      setError("Please upload a selfie image.");
      return;
    }

    if (nin.length !== 11) {
      setError("NIN must be exactly 11 digits.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      addLog(
        "info",
        `POST ${apiBase}/vendor/verify-identity`
      );

      const payload = {
        session_id: sessionId,
        nin,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        date_of_birth: dob,
        selfie_image: selfie,
      };

      addLog(
        "info",
        `Submitting identity verification for ${firstName} ${lastName}`
      );

      const res = await fetch(
        `${apiBase}/vendor/verify-identity`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      let data: any = {};

      try {
        data = await res.json();
      } catch {
        throw new Error("Invalid server response");
      }

      if (!res.ok) {
        throw new Error(
          data?.detail ||
            data?.message ||
            `HTTP ${res.status}`
        );
      }

      addLog(
        "success",
        `Identity verified → ${JSON.stringify(data)}`
      );

      onComplete(data);

      resetForm();
    } catch (err: any) {
      console.error(err);

      const message =
        err?.message || "Identity verification failed";

      setError(message);

      addLog(
        "error",
        `Identity verify failed: ${message}`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        maxWidth: 420,
        margin: "0 auto",
        padding: 24,
        background: "#181818",
        borderRadius: 12,
        border: "1px solid #2a2a2a",
      }}
    >
      <h3
        style={{
          color: "#fff",
          marginBottom: 20,
          fontSize: 22,
        }}
      >
        Step 3: NIN Identity Verification
      </h3>

      <div style={{ marginBottom: 14 }}>
        <label
          style={{
            display: "block",
            color: "#ccc",
            marginBottom: 6,
          }}
        >
          NIN
        </label>

        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={nin}
          onChange={(e) =>
            setNin(
              e.target.value.replace(/\D/g, "").slice(0, 11)
            )
          }
          placeholder="12345678901"
          required
          style={inputStyle}
        />
      </div>

      <div style={{ marginBottom: 14 }}>
        <label
          style={{
            display: "block",
            color: "#ccc",
            marginBottom: 6,
          }}
        >
          First Name
        </label>

        <input
          type="text"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          required
          placeholder="John"
          style={inputStyle}
        />
      </div>

      <div style={{ marginBottom: 14 }}>
        <label
          style={{
            display: "block",
            color: "#ccc",
            marginBottom: 6,
          }}
        >
          Last Name
        </label>

        <input
          type="text"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          required
          placeholder="Doe"
          style={inputStyle}
        />
      </div>

      <div style={{ marginBottom: 14 }}>
        <label
          style={{
            display: "block",
            color: "#ccc",
            marginBottom: 6,
          }}
        >
          Date of Birth
        </label>

        <input
          type="date"
          value={dob}
          onChange={(e) => setDob(e.target.value)}
          required
          style={inputStyle}
        />
      </div>

      <div style={{ marginBottom: 18 }}>
        <label
          style={{
            display: "block",
            color: "#ccc",
            marginBottom: 6,
          }}
        >
          Selfie Image
        </label>

        <input
          type="file"
          accept="image/*"
          capture="user"
          ref={fileInputRef}
          onChange={handleFileChange}
          required
          style={{
            color: "#ddd",
          }}
        />

        {selfie && (
          <div
            style={{
              marginTop: 12,
              textAlign: "center",
            }}
          >
            <img
              src={selfie}
              alt="Selfie preview"
              style={{
                width: 120,
                height: 120,
                objectFit: "cover",
                borderRadius: 12,
                border: "2px solid #333",
              }}
            />
          </div>
        )}
      </div>

      {error && (
        <div
          style={{
            background: "#3a1212",
            color: "#ff9b9b",
            padding: 10,
            borderRadius: 8,
            marginBottom: 16,
            fontSize: 14,
          }}
        >
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        style={{
          width: "100%",
          padding: 12,
          background: loading ? "#666" : "#00e676",
          color: "#181818",
          border: "none",
          borderRadius: 8,
          fontWeight: 700,
          fontSize: 15,
          cursor: loading ? "not-allowed" : "pointer",
          transition: "0.2s ease",
        }}
      >
        {loading ? "Verifying..." : "Verify Identity"}
      </button>
    </form>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 8,
  border: "1px solid #333",
  background: "#101010",
  color: "#fff",
  fontSize: 14,
  outline: "none",
};