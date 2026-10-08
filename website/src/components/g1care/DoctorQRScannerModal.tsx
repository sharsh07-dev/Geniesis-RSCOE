"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Camera,
  QrCode,
  CheckCircle,
  ShieldAlert,
  ArrowRight,
  UserCheck,
  X,
  Upload,
  SwitchCamera,
  RefreshCw,
  Sparkles,
  AlertCircle
} from "lucide-react";
import jsQR from "jsqr";
import { validateAndScanQRToken, requestPatientConsent } from "../../lib/services/g1care.service";
import { EncounterSession, ConsentScope, ConsentRequest } from "../../lib/types/g1care";
import { useLanguage } from "../../hooks/useLanguage";
import styles from "./G1Care.module.css";

interface DoctorQRScannerModalProps {
  providerId: string;
  providerName: string;
  facilityName: string;
  registrationNumber: string;
  isOpen: boolean;
  onClose: () => void;
  onRequestSent: (consent: ConsentRequest, session: EncounterSession) => void;
}

const DEFAULT_SCOPES: ConsentScope[] = [
  "diagnoses",
  "medications",
  "allergies",
  "lab_reports",
  "prescriptions",
  "previous_encounters",
];

export default function DoctorQRScannerModal({
  providerId,
  providerName,
  facilityName,
  registrationNumber,
  isOpen,
  onClose,
  onRequestSent,
}: DoctorQRScannerModalProps) {
  const { t } = useLanguage();
  const [tokenInput, setTokenInput] = useState("");
  const [session, setSession] = useState<EncounterSession | null>(null);
  const [purpose, setPurpose] = useState("General Consultation");
  const [selectedScopes, setSelectedScopes] = useState<ConsentScope[]>(DEFAULT_SCOPES);
  const [duration, setDuration] = useState(30);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Camera stream states
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraPermissionState, setCameraPermissionState] = useState<"idle" | "requesting" | "granted" | "denied" | "unsupported">("idle");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Detect camera devices
  useEffect(() => {
    if (typeof navigator !== "undefined" && navigator.mediaDevices?.enumerateDevices) {
      navigator.mediaDevices.enumerateDevices().then((devices) => {
        const videoInputs = devices.filter((d) => d.kind === "videoinput");
        setHasMultipleCameras(videoInputs.length > 1);
      }).catch(() => {
        // ignore device listing error
      });
    }
  }, []);

  // Play pleasant success sound on QR detect
  const playSuccessChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "sine";
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.18);
        osc.start();
        osc.stop(ctx.currentTime + 0.18);
      }
    } catch {
      // Audio autoplay policy fallback
    }
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      try {
        navigator.vibrate([100, 50, 100]);
      } catch {
        // vibrate fallback
      }
    }
  };

  // Helper to extract clean token if QR encoded JSON or URL
  const extractToken = (raw: string): string => {
    const trimmed = raw.trim();
    if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
      try {
        const obj = JSON.parse(trimmed);
        return obj.token || obj.encounterCode || obj.code || obj.sessionId || trimmed;
      } catch {
        // ignore
      }
    }
    if (trimmed.includes("://")) {
      try {
        const url = new URL(trimmed);
        const qToken = url.searchParams.get("token") || url.searchParams.get("code") || url.searchParams.get("session");
        if (qToken) return qToken;
      } catch {
        // ignore
      }
    }
    return trimmed;
  };

  const stopCamera = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // ignore
        }
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  const startCamera = async (overrideFacing?: "environment" | "user") => {
    stopCamera();
    setCameraError(null);
    setCameraPermissionState("requesting");

    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setCameraPermissionState("unsupported");
      setCameraError("Camera capture is not supported in this browser environment or requires HTTPS.");
      return;
    }

    const targetFacing = overrideFacing || facingMode;

    try {
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: targetFacing },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });
      } catch {
        // If ideal facingMode constraint fails (e.g. desktop webcams), retry with generic video
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }

      streamRef.current = stream;
      setCameraPermissionState("granted");

      if (videoRef.current) {
        const video = videoRef.current;
        video.srcObject = stream;
        video.setAttribute("playsinline", "true");
        video.muted = true;
        
        // Wait for video to begin playing before scanning loop
        await video.play();
        setCameraActive(true);
        animationFrameRef.current = requestAnimationFrame(tickScan);
      }
    } catch (e: unknown) {
      const err = e as Error;
      console.warn("Camera access error:", err);
      stopCamera();
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setCameraPermissionState("denied");
        setCameraError("Camera permission was denied. Please allow camera access in your browser settings (click the lock 🔒 icon in the address bar).");
      } else {
        setCameraPermissionState("denied");
        setCameraError(`Unable to start camera: ${err.message || "Device busy or unavailable"}.`);
      }
    }
  };

  // Scanning loop
  const tickScan = () => {
    if (videoRef.current && videoRef.current.videoWidth > 0 && videoRef.current.videoHeight > 0) {
      const video = videoRef.current;
      const canvas = canvasRef.current || document.createElement("canvas");

      // Scale down high-resolution cameras (e.g. 1080p/4k) to ideal 640px scanning width for instant 60fps processing
      const maxScanWidth = 640;
      const scale = video.videoWidth > maxScanWidth ? maxScanWidth / video.videoWidth : 1;
      const scanWidth = Math.round(video.videoWidth * scale);
      const scanHeight = Math.round(video.videoHeight * scale);

      canvas.width = scanWidth;
      canvas.height = scanHeight;

      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (ctx) {
        ctx.drawImage(video, 0, 0, scanWidth, scanHeight);
        const imageData = ctx.getImageData(0, 0, scanWidth, scanHeight);
        const code = jsQR(imageData.data, scanWidth, scanHeight, {
          inversionAttempts: "attemptBoth",
        });

        if (code && code.data) {
          // QR Code Captured in real-time!
          playSuccessChime();
          const token = extractToken(code.data);
          stopCamera();
          setTokenInput(token);
          handleScanOrSubmitToken(token);
          return;
        }
      }
    }
    animationFrameRef.current = requestAnimationFrame(tickScan);
  };

  // Toggle front/rear camera
  const handleToggleFacingMode = () => {
    const nextMode = facingMode === "environment" ? "user" : "environment";
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  // File Upload QR handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const imgData = ctx.getImageData(0, 0, img.width, img.height);
          const code = jsQR(imgData.data, imgData.width, imgData.height, {
            inversionAttempts: "attemptBoth",
          });
          if (code && code.data) {
            playSuccessChime();
            const token = extractToken(code.data);
            stopCamera();
            setTokenInput(token);
            handleScanOrSubmitToken(token);
          } else {
            setError("No valid QR code could be detected in the uploaded image. Please try another image or enter the token below.");
          }
        }
      };
      img.onerror = () => {
        setError("Could not read image file. Please try again.");
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Start/stop camera on modal open/close
  useEffect(() => {
    if (isOpen && !session) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, session]);

  if (!isOpen) return null;

  const handleScanOrSubmitToken = async (overrideToken?: string) => {
    const token = overrideToken || tokenInput;
    if (!token.trim()) {
      setError("Please enter or scan a valid encounter code.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const validatedSession = await validateAndScanQRToken(token.trim(), providerId, providerName, facilityName);
      setSession(validatedSession);
      stopCamera();
    } catch (e: unknown) {
      const err = e as Error;
      setError(err.message || "Failed to validate QR session code.");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoScan = () => {
    const demoToken = (typeof window !== "undefined" && localStorage.getItem("g1care_active_token_pat_101")) || "DEMO789012";
    setTokenInput(demoToken);
    stopCamera();
    handleScanOrSubmitToken(demoToken);
  };

  const toggleScope = (scope: ConsentScope) => {
    setSelectedScopes((prev) =>
      prev.includes(scope) ? prev.filter((s) => s !== scope) : [...prev, scope]
    );
  };

  const handleSendConsentRequest = async () => {
    if (!session) return;
    setLoading(true);
    setError(null);
    try {
      const req = await requestPatientConsent(
        session.sessionId,
        providerId,
        providerName,
        facilityName,
        registrationNumber,
        purpose,
        selectedScopes,
        duration
      );
      onRequestSent(req, session);
      onClose();
    } catch (e: unknown) {
      const err = e as Error;
      setError(err.message || "Failed to send consent request.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.scannerModalCard}>
        <button className={styles.closeBtn} onClick={onClose} aria-label="Close modal">
          <X size={20} />
        </button>

        {!session ? (
          <div className={styles.scanStepInitial}>
            <div className={styles.modalHeaderIcon}>
              <Camera size={32} color="#059669" />
            </div>
            <h2 className={styles.modalTitle}>Scan Patient QR</h2>
            <p className={styles.modalSubtitle}>
              Align patient&apos;s G1Care Health QR inside camera view or input encounter code.
            </p>

            {/* Video Viewport / Camera Box */}
            <div
              style={{
                position: "relative",
                width: "100%",
                height: "260px",
                background: "#0F172A",
                borderRadius: "16px",
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "16px",
                border: "2px solid #E2E8F0",
                boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
              }}
            >
              {/* Live Video Feed */}
              <video
                ref={videoRef}
                playsInline
                muted
                autoPlay
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: cameraActive ? "block" : "none",
                }}
              />
              <canvas ref={canvasRef} style={{ display: "none" }} />

              {/* Scanning Crosshair & Beam */}
              {cameraActive && (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    pointerEvents: "none",
                  }}
                >
                  {/* Outer mask */}
                  <div
                    style={{
                      position: "relative",
                      width: "180px",
                      height: "180px",
                      borderRadius: "16px",
                      border: "2px dashed rgba(16, 185, 129, 0.9)",
                      boxShadow: "0 0 0 9999px rgba(15, 23, 42, 0.45)",
                    }}
                  >
                    {/* Corner Reticles */}
                    <div style={{ position: "absolute", top: "-2px", left: "-2px", width: "20px", height: "20px", borderTop: "4px solid #10B981", borderLeft: "4px solid #10B981", borderRadius: "4px 0 0 0" }} />
                    <div style={{ position: "absolute", top: "-2px", right: "-2px", width: "20px", height: "20px", borderTop: "4px solid #10B981", borderRight: "4px solid #10B981", borderRadius: "0 4px 0 0" }} />
                    <div style={{ position: "absolute", bottom: "-2px", left: "-2px", width: "20px", height: "20px", borderBottom: "4px solid #10B981", borderLeft: "4px solid #10B981", borderRadius: "0 0 0 4px" }} />
                    <div style={{ position: "absolute", bottom: "-2px", right: "-2px", width: "20px", height: "20px", borderBottom: "4px solid #10B981", borderRight: "4px solid #10B981", borderRadius: "0 0 4px 0" }} />

                    {/* Animated Scanning Beam */}
                    <div
                      style={{
                        position: "absolute",
                        left: "4px",
                        right: "4px",
                        height: "2px",
                        background: "linear-gradient(90deg, transparent, #10B981, transparent)",
                        boxShadow: "0 0 12px #10B981",
                        animation: "scanBeam 2s ease-in-out infinite alternate",
                      }}
                    />
                  </div>

                  {/* Camera Top Status Pill */}
                  <div
                    style={{
                      position: "absolute",
                      top: "12px",
                      background: "rgba(15, 23, 42, 0.75)",
                      backdropFilter: "blur(6px)",
                      color: "#10B981",
                      fontSize: "11px",
                      fontWeight: 700,
                      padding: "4px 10px",
                      borderRadius: "20px",
                      border: "1px solid rgba(16, 185, 129, 0.3)",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      letterSpacing: "0.03em",
                    }}
                  >
                    <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#10B981", display: "inline-block" }} />
                    CAMERA SCANNING LIVE
                  </div>

                  {/* Flip camera control */}
                  {hasMultipleCameras && (
                    <button
                      type="button"
                      onClick={handleToggleFacingMode}
                      style={{
                        position: "absolute",
                        top: "10px",
                        right: "10px",
                        background: "rgba(15, 23, 42, 0.8)",
                        color: "#FFFFFF",
                        border: "1px solid #475569",
                        borderRadius: "8px",
                        padding: "6px",
                        cursor: "pointer",
                        pointerEvents: "auto",
                      }}
                      title="Flip camera"
                    >
                      <SwitchCamera size={16} />
                    </button>
                  )}
                </div>
              )}

              {/* Inactive / Request Permission View */}
              {!cameraActive && (
                <div style={{ textAlign: "center", padding: "20px 24px", color: "#94A3B8" }}>
                  <div
                    style={{
                      width: "60px",
                      height: "60px",
                      borderRadius: "50%",
                      background: "#1E293B",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "0 auto 12px",
                      border: "1px solid #334155",
                    }}
                  >
                    <Camera size={28} color="#10B981" />
                  </div>

                  <h4 style={{ color: "#F8FAFC", fontSize: "14px", fontWeight: 700, margin: "0 0 6px" }}>
                    {cameraPermissionState === "denied"
                      ? "Camera Access Denied"
                      : cameraPermissionState === "requesting"
                      ? "Requesting Camera..."
                      : "Camera Permission Needed"}
                  </h4>

                  <p style={{ fontSize: "12px", color: "#94A3B8", margin: "0 0 14px", lineHeight: 1.4, maxWidth: "320px" }}>
                    {cameraError || "Enable device camera to scan the patient QR code automatically, or upload an image."}
                  </p>

                  <div style={{ display: "flex", gap: "8px", justifyContent: "center", flexWrap: "wrap" }}>
                    <button
                      type="button"
                      onClick={() => startCamera()}
                      style={{
                        padding: "8px 16px",
                        background: "#059669",
                        color: "#FFFFFF",
                        border: "none",
                        borderRadius: "8px",
                        fontSize: "12px",
                        fontWeight: 700,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <Camera size={14} /> Enable Camera
                    </button>

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        padding: "8px 14px",
                        background: "#334155",
                        color: "#F8FAFC",
                        border: "1px solid #475569",
                        borderRadius: "8px",
                        fontSize: "12px",
                        fontWeight: 600,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <Upload size={14} /> Upload QR Image
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Actions Bar */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#059669",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "4px 0",
                }}
              >
                <Upload size={14} /> Upload QR code photo from gallery
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                style={{ display: "none" }}
              />

              {cameraActive && hasMultipleCameras && (
                <button
                  type="button"
                  onClick={handleToggleFacingMode}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#64748B",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <SwitchCamera size={14} /> Switch Camera
                </button>
              )}
            </div>

            {/* Fallback Token Input */}
            <div className={styles.tokenFallbackBox}>
              <span className={styles.fallbackOr}>OR ENTER ENCOUNTER TOKEN</span>
              <div className={styles.inputGroup}>
                <input
                  type="text"
                  className={styles.tokenInput}
                  placeholder="e.g. DEMO789012"
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleScanOrSubmitToken();
                  }}
                />
                <button
                  className={styles.primaryBtn}
                  onClick={() => handleScanOrSubmitToken()}
                  disabled={loading}
                >
                  {loading ? "Validating..." : "Validate Token"}
                </button>
              </div>

              <button className={styles.demoFallbackBtn} onClick={handleDemoScan}>
                ⚡ Auto-Scan Demo Token
              </button>
            </div>

            {error && (
              <div className={styles.errorMessage} style={{ marginTop: "12px" }}>
                <ShieldAlert size={16} /> {error}
              </div>
            )}
          </div>
        ) : (
          <div className={styles.scanStepFound}>
            <div className={styles.foundHeaderBadge}>
              <CheckCircle size={24} color="#059669" />
              <span>PATIENT FOUND ✓</span>
            </div>

            <div className={styles.patientMetaCard}>
              <div className={styles.patientAvatar}>
                <UserCheck size={24} color="#059669" />
              </div>
              <div className={styles.patientMetaText}>
                <h3>{session.patientName}</h3>
                <span>
                  Health ID: <strong>{session.healthId}</strong>
                </span>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Encounter Purpose:</label>
              <select
                className={styles.selectInput}
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
              >
                <option value="General Consultation">General Consultation</option>
                <option value="Follow-up Checkup">Follow-up Checkup</option>
                <option value="Emergency Care">Emergency Care</option>
                <option value="Diagnostic Review">Diagnostic Review</option>
                <option value="Specialist Referral">Specialist Referral</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Requested Record Categories:</label>
              <div className={styles.scopesChecklist}>
                {DEFAULT_SCOPES.map((scope) => (
                  <label key={scope} className={styles.scopeCheckItem}>
                    <input
                      type="checkbox"
                      checked={selectedScopes.includes(scope)}
                      onChange={() => toggleScope(scope)}
                    />
                    <span>{scope.replace("_", " ").toUpperCase()}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Access Duration Limit:</label>
              <select
                className={styles.selectInput}
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
              >
                <option value={15}>15 Minutes</option>
                <option value={30}>30 Minutes</option>
                <option value={60}>1 Hour</option>
                <option value={120}>2 Hours</option>
              </select>
            </div>

            {error && (
              <div className={styles.errorMessage}>
                <ShieldAlert size={16} /> {error}
              </div>
            )}

            <div className={styles.modalFooterActions}>
              <button
                className={styles.secondaryBtn}
                onClick={() => {
                  setSession(null);
                  startCamera();
                }}
              >
                Cancel & Rescan
              </button>
              <button
                className={styles.primaryBtn}
                onClick={handleSendConsentRequest}
                disabled={loading}
              >
                {loading ? "Sending Request..." : "REQUEST CONSENT"} <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
