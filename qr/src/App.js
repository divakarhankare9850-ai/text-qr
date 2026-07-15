import React, { useState, useRef, useCallback } from "react";
import { QRCodeCanvas } from "qrcode.react";

/**
 * QR Code Generator
 * ------------------------------------------------------------
 * A single-file, self-contained React application that generates
 * QR codes entirely client-side. No backend, no storage, no
 * external API calls — everything happens in the browser.
 * ------------------------------------------------------------
 */

const MAX_CHARACTERS = 2000; // Reasonable upper bound for QR-encodable text

export default function App() {
  // ---------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------
  const [inputText, setInputText] = useState(""); // Live textarea value
  const [qrValue, setQrValue] = useState(""); // Value actually rendered as QR
  const [statusMessage, setStatusMessage] = useState(""); // Toast-style message
  const [statusType, setStatusType] = useState("success"); // "success" | "error"

  // Ref to the hidden canvas rendered by QRCodeCanvas (used for PNG export)
  const qrCanvasRef = useRef(null);

  // ---------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------

  // Show a temporary status message, then auto-clear it after a delay.
  const showStatus = useCallback((message, type = "success") => {
    setStatusMessage(message);
    setStatusType(type);
    window.clearTimeout(showStatus._timer);
    showStatus._timer = window.setTimeout(() => {
      setStatusMessage("");
    }, 2500);
  }, []);

  const isInputEmpty = inputText.trim().length === 0;

  // ---------------------------------------------------------------------
  // Event Handlers
  // ---------------------------------------------------------------------

  const handleTextChange = (event) => {
    const value = event.target.value.slice(0, MAX_CHARACTERS);
    setInputText(value);
  };

  const handleGenerate = () => {
    if (isInputEmpty) {
      showStatus("Please enter some text before generating a QR code.", "error");
      return;
    }
    setQrValue(inputText.trim());
    showStatus("QR Code generated successfully ✅", "success");
  };

  const handleClear = () => {
    setInputText("");
    setQrValue("");
    showStatus("Input cleared", "success");
  };

  const handleCopyText = async () => {
    if (isInputEmpty) {
      showStatus("Nothing to copy yet.", "error");
      return;
    }
    try {
      await navigator.clipboard.writeText(inputText);
      showStatus("Copied to clipboard 📋", "success");
    } catch (err) {
      showStatus("Unable to copy. Please copy manually.", "error");
    }
  };

  const handleDownload = () => {
    if (!qrValue) {
      showStatus("Generate a QR code first.", "error");
      return;
    }

    // qrcode.react renders an actual <canvas> element we can access via ref.
    const canvas = qrCanvasRef.current;
    if (!canvas) {
      showStatus("QR code not ready yet. Try again.", "error");
      return;
    }

    try {
      const pngUrl = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.href = pngUrl;
      downloadLink.download = "qr-code.png";
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      showStatus("Downloaded successfully ⬇️", "success");
    } catch (err) {
      showStatus("Download failed. Please try again.", "error");
    }
  };

  // Allow Ctrl/Cmd + Enter to trigger generation from the textarea
  const handleKeyDown = (event) => {
    const isEnter = event.key === "Enter";
    const isModifier = event.ctrlKey || event.metaKey;
    if (isEnter && isModifier) {
      event.preventDefault();
      handleGenerate();
    }
  };

  // ---------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------
  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.heading}>QR Code Generator</h1>
        <p style={styles.subheading}>
          Turn any text, URL, email, phone number, or Wi-Fi string into a
          scannable QR code — instantly, right in your browser.
        </p>

        {/* Text Input */}
        <label htmlFor="qr-text-input" style={styles.label}>
          Your text
        </label>
        <textarea
          id="qr-text-input"
          style={styles.textarea}
          value={inputText}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          placeholder="Enter text, URL, email, phone number, or anything..."
          rows={5}
        />

        {/* Character Count */}
        <div style={styles.charCountRow}>
          <span style={styles.charCount}>
            {inputText.length} / {MAX_CHARACTERS} characters
          </span>
          {isInputEmpty && (
            <span style={styles.validationHint}>
              Type something to enable QR generation
            </span>
          )}
        </div>

        {/* Action Buttons: Generate / Clear / Copy */}
        <div style={styles.buttonRow}>
          <button
            style={{
              ...styles.button,
              ...styles.primaryButton,
              ...(isInputEmpty ? styles.disabledButton : {}),
            }}
            onClick={handleGenerate}
            disabled={isInputEmpty}
            title="Generate QR Code"
          >
            ⚡ Generate QR
          </button>

          <button
            style={{ ...styles.button, ...styles.secondaryButton }}
            onClick={handleClear}
            title="Clear input"
          >
            🗑️ Clear
          </button>

          <button
            style={{
              ...styles.button,
              ...styles.secondaryButton,
              ...(isInputEmpty ? styles.disabledButton : {}),
            }}
            onClick={handleCopyText}
            disabled={isInputEmpty}
            title="Copy text to clipboard"
          >
            📋 Copy Text
          </button>
        </div>

        {/* Status Message */}
        {statusMessage && (
          <div
            style={{
              ...styles.statusMessage,
              ...(statusType === "error"
                ? styles.statusError
                : styles.statusSuccess),
            }}
          >
            {statusMessage}
          </div>
        )}

        {/* QR Code Preview */}
        <div style={styles.qrPreviewWrapper}>
          {qrValue ? (
            <div style={styles.qrCard}>
              <QRCodeCanvas
                value={qrValue}
                size={250}
                bgColor="#ffffff"
                fgColor="#000000"
                level="H" // High error correction for reliable scanning
                includeMargin={true} // Quiet zone around the QR code
                ref={qrCanvasRef}
              />
            </div>
          ) : (
            <div style={styles.qrPlaceholder}>
              <span style={styles.qrPlaceholderIcon}>🔳</span>
              <span>Your QR code will appear here</span>
            </div>
          )}
        </div>

        {/* Download Button */}
        <button
          style={{
            ...styles.button,
            ...styles.downloadButton,
            ...(!qrValue ? styles.disabledButton : {}),
          }}
          onClick={handleDownload}
          disabled={!qrValue}
          title="Download QR Code as PNG"
        >
          ⬇️ Download QR Code (PNG)
        </button>

        <footer style={styles.footer}>
          Generated entirely in your browser — nothing is sent, stored, or
          saved anywhere.
        </footer>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
// Styles (single JS object — no external CSS files)
// ---------------------------------------------------------------------
const styles = {
  page: {
    minHeight: "100vh",
    width: "100%",
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start",
    padding: "40px 16px",
    boxSizing: "border-box",
    background: "linear-gradient(135deg, #eef2ff 0%, #f8fafc 50%, #eef2ff 100%)",
    fontFamily:
      "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  },
  card: {
    width: "100%",
    maxWidth: "480px",
    background: "#ffffff",
    borderRadius: "20px",
    boxShadow:
      "0 10px 30px rgba(15, 23, 42, 0.08), 0 2px 8px rgba(15, 23, 42, 0.06)",
    padding: "36px 32px",
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    transition: "box-shadow 0.3s ease, transform 0.3s ease",
  },
  heading: {
    margin: 0,
    fontSize: "28px",
    fontWeight: 800,
    color: "#1e1b4b",
    textAlign: "center",
    letterSpacing: "-0.02em",
  },
  subheading: {
    margin: "8px 0 20px 0",
    fontSize: "14px",
    color: "#64748b",
    textAlign: "center",
    lineHeight: 1.5,
  },
  label: {
    fontSize: "13px",
    fontWeight: 600,
    color: "#334155",
    marginBottom: "6px",
  },
  textarea: {
    width: "100%",
    minHeight: "110px",
    resize: "vertical",
    padding: "14px",
    fontSize: "15px",
    borderRadius: "12px",
    border: "1.5px solid #e2e8f0",
    outline: "none",
    boxSizing: "border-box",
    fontFamily: "inherit",
    color: "#1e293b",
    background: "#f8fafc",
    transition: "border-color 0.2s ease, box-shadow 0.2s ease",
  },
  charCountRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "6px",
    margin: "8px 0 18px 0",
  },
  charCount: {
    fontSize: "12px",
    color: "#94a3b8",
  },
  validationHint: {
    fontSize: "12px",
    color: "#f59e0b",
    fontWeight: 500,
  },
  buttonRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
    marginBottom: "8px",
  },
  button: {
    flex: "1 1 auto",
    minWidth: "110px",
    padding: "12px 16px",
    fontSize: "14px",
    fontWeight: 600,
    borderRadius: "12px",
    border: "none",
    cursor: "pointer",
    transition: "transform 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease",
    boxSizing: "border-box",
  },
  primaryButton: {
    background: "linear-gradient(135deg, #6366f1, #4f46e5)",
    color: "#ffffff",
    boxShadow: "0 4px 12px rgba(79, 70, 229, 0.35)",
  },
  secondaryButton: {
    background: "#f1f5f9",
    color: "#334155",
    border: "1.5px solid #e2e8f0",
  },
  downloadButton: {
    width: "100%",
    marginTop: "18px",
    background: "linear-gradient(135deg, #10b981, #059669)",
    color: "#ffffff",
    boxShadow: "0 4px 12px rgba(5, 150, 105, 0.3)",
  },
  disabledButton: {
    opacity: 0.5,
    cursor: "not-allowed",
    boxShadow: "none",
    transform: "none",
  },
  statusMessage: {
    padding: "10px 14px",
    borderRadius: "10px",
    fontSize: "13px",
    fontWeight: 500,
    textAlign: "center",
    marginBottom: "10px",
    transition: "opacity 0.3s ease",
  },
  statusSuccess: {
    background: "#ecfdf5",
    color: "#047857",
    border: "1px solid #a7f3d0",
  },
  statusError: {
    background: "#fef2f2",
    color: "#b91c1c",
    border: "1px solid #fecaca",
  },
  qrPreviewWrapper: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    margin: "12px 0",
    minHeight: "282px",
  },
  qrCard: {
    background: "#ffffff",
    padding: "16px",
    borderRadius: "16px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 6px 20px rgba(15, 23, 42, 0.08)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  qrPlaceholder: {
    width: "250px",
    height: "250px",
    borderRadius: "16px",
    border: "2px dashed #cbd5e1",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    gap: "10px",
    color: "#94a3b8",
    fontSize: "13px",
    textAlign: "center",
    padding: "16px",
    boxSizing: "border-box",
  },
  qrPlaceholderIcon: {
    fontSize: "36px",
  },
  footer: {
    marginTop: "20px",
    fontSize: "11px",
    color: "#94a3b8",
    textAlign: "center",
    lineHeight: 1.5,
  },
};
