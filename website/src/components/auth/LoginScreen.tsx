// ============================================================
// Login Screen — Dual-role Authentication (G1Care)
// Clean, Crisp White Theme with Human Graphic Designer Aesthetics
// ============================================================

"use client";

import React, { useState } from "react";
import { useAuth, type UserRole } from "../../hooks/useAuth";
import { useCountdown } from "../../hooks/useCountdown";
import { useLanguage } from "../../hooks/useLanguage";
import LanguageSelector from "../layout/LanguageSelector";
import { isValidCardId, normalizeCardSuffix } from "../../lib/utils/cardId";
import LogoAnimated from "../common/LogoAnimated";
import styles from "./LoginScreen.module.css";

interface LoginScreenProps {
    onEmergencyAccess?: () => void;
}

export default function LoginScreen({ onEmergencyAccess }: LoginScreenProps) {
    const { t } = useLanguage();
    const {
        state, initiateLogin, verifyDob, verifyOtp,
        doctorLogin, quickLoginPatient, quickLoginDoctor, error, isLoading, lockStatus,
    } = useAuth();

    const [role, setRole] = useState<UserRole>("patient");
    const [mode, setMode] = useState<"login" | "register">("login");

    // Patient fields
    const [cardId, setCardId] = useState("");
    const fullCardId = `AS-${cardId}`;
    const [dob, setDob] = useState("");
    const [otp, setOtp] = useState("");
    const [maskedPhone, setMaskedPhone] = useState("");
    const [devOtp, setDevOtp] = useState("");

    // Doctor fields
    const [doctorId, setDoctorId] = useState("");
    const [password, setPassword] = useState("");

    // Registration fields
    const [regName, setRegName] = useState("");
    const [regPhone, setRegPhone] = useState("");
    const [regDob, setRegDob] = useState("");
    const [regEmail, setRegEmail] = useState("");
    const [regMci, setRegMci] = useState("");
    const [regInstitution, setRegInstitution] = useState("");
    const [regDesignation, setRegDesignation] = useState("");
    const [regPassword, setRegPassword] = useState("");
    const [regLoading, setRegLoading] = useState(false);
    const [regError, setRegError] = useState<string | null>(null);
    const [regSuccess, setRegSuccess] = useState<{ cardId?: string; name: string; userType: string } | null>(null);

    const otpCountdown = useCountdown({
        duration: 300,
        onExpire: () => alert("OTP expired. Please request a new one."),
    });

    // Handlers
    const handleCardIdSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isValidCardId(fullCardId)) return;
        await initiateLogin(fullCardId);
    };

    const handleDobSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const challengeParams = await verifyDob(fullCardId, dob);
        if (challengeParams.maskedPhone) setMaskedPhone(challengeParams.maskedPhone);
        if (challengeParams.devOtp) setDevOtp(challengeParams.devOtp);
    };

    const handleOtpSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await verifyOtp(fullCardId, otp);
        } catch { /* error is set in auth context */ }
    };

    const handleDoctorLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await doctorLogin(doctorId.trim(), password);
        } catch { /* error set in context */ }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setRegLoading(true);
        setRegError(null);
        setRegSuccess(null);

        const body = role === "patient"
            ? { userType: "patient", name: regName, phone: regPhone, dob: regDob }
            : {
                userType: "doctor",
                name: regName, email: regEmail, phone: regPhone,
                mciNumber: regMci, institution: regInstitution || undefined,
                designation: regDesignation || undefined, password: regPassword,
            };

        try {
            const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            const data = await res.json();
            if (!res.ok) {
                setRegError(data.error || "Registration failed");
            } else {
                setRegSuccess({ cardId: data.cardId, name: data.name, userType: data.userType });
                setRegName(""); setRegPhone(""); setRegDob(""); setRegEmail("");
                setRegMci(""); setRegInstitution(""); setRegDesignation(""); setRegPassword("");
            }
        } catch {
            setRegError("Network error — please try again");
        } finally {
            setRegLoading(false);
        }
    };

    const switchToLogin = () => {
        setMode("login");
        setRegError(null);
        setRegSuccess(null);
    };

    if (lockStatus.isLocked) {
        return (
            <div className={styles.container}>
                <div className={styles.card}>
                    <div className={styles.lockIcon}>🔒</div>
                    <h2 className={styles.title}>Account Locked</h2>
                    <p className={styles.subtitle}>
                        Too many failed attempts. Try again after{" "}
                        {lockStatus.lockUntil
                            ? new Date(lockStatus.lockUntil).toLocaleTimeString()
                            : "30 minutes"}.
                    </p>
                </div>
            </div>
        );
    }

    const isWide = mode === "register" && role === "doctor";

    return (
        <div className={styles.container}>
            <div className={`${styles.card} ${isWide ? styles.cardWide : ""}`}>
                {/* Language Switcher */}
                <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "4px" }}>
                    <LanguageSelector variant="login" />
                </div>

                {/* Brand Header */}
                <div className={styles.brandHeader}>
                    <div className={styles.logoBadge}>
                        <LogoAnimated width={240} background="none" showText={false} />
                    </div>
                    <h1 className={styles.brandTitle}>G1CARE</h1>
                    <p className={styles.brandSubtitle}>Scan. Consent. Treat. Update.</p>
                </div>

                {/* 1-Click Quick Demo Login Pill Bar */}
                <div className={styles.quickAccessCard}>
                    <div className={styles.quickAccessHeader}>
                        <span className={styles.quickBadge}>Instant Demo Access</span>
                        <span className={styles.quickSub}>Skip password & OTP for evaluation</span>
                    </div>
                    <div className={styles.quickBtnGroup}>
                        <button
                            type="button"
                            onClick={() => quickLoginPatient()}
                            className={`${styles.quickBtn} ${styles.quickBtnPatient}`}
                        >
                            <span className={styles.quickIcon}>👤</span>
                            <div className={styles.quickText}>
                                <span className={styles.quickRole}>{t("login_patient_demo")}</span>
                                <span className={styles.quickName}>Rohit Dhangar</span>
                            </div>
                        </button>
                        <button
                            type="button"
                            onClick={() => quickLoginDoctor()}
                            className={`${styles.quickBtn} ${styles.quickBtnDoctor}`}
                        >
                            <span className={styles.quickIcon}>🩺</span>
                            <div className={styles.quickText}>
                                <span className={styles.quickRole}>{t("login_doctor_demo")}</span>
                                <span className={styles.quickName}>Dr. Ananya Sharma</span>
                            </div>
                        </button>
                    </div>
                </div>

                {/* Role Switcher Tabs */}
                <div className={styles.roleTabs}>
                    <button
                        className={`${styles.roleTab} ${role === "patient" ? styles.roleTabActive : ""}`}
                        onClick={() => setRole("patient")}
                        type="button"
                    >
                        <span>👤</span> {t("role_patient")}
                    </button>
                    <button
                        className={`${styles.roleTab} ${role === "doctor" ? styles.roleTabActive : ""}`}
                        onClick={() => setRole("doctor")}
                        type="button"
                    >
                        <span>🩺</span> {t("role_doctor")}
                    </button>
                </div>

                {/* LOGIN MODE */}
                {mode === "login" && (
                    <>
                        {error && (
                            <div className={styles.errorBanner}>
                                <span>⚠️</span> {error.replace(/^[A-Z_]+:\s*/, "")}
                            </div>
                        )}

                        {/* Patient Auth Flow */}
                        {role === "patient" && (
                            <>
                                <div className={styles.stepsBar}>
                                    <div className={`${styles.stepPill} ${state !== "UNAUTHENTICATED" ? styles.stepPillActive : ""}`}>
                                        <span className={styles.stepNum}>1</span> Card ID
                                    </div>
                                    <div className={styles.stepDivider} />
                                    <div className={`${styles.stepPill} ${state === "DOB_VERIFIED" || state === "OTP_SENT" || state === "AUTHENTICATED" ? styles.stepPillActive : ""}`}>
                                        <span className={styles.stepNum}>2</span> DOB
                                    </div>
                                    <div className={styles.stepDivider} />
                                    <div className={`${styles.stepPill} ${state === "OTP_SENT" || state === "AUTHENTICATED" ? styles.stepPillActive : ""}`}>
                                        <span className={styles.stepNum}>3</span> OTP
                                    </div>
                                </div>

                                {state === "UNAUTHENTICATED" && (
                                    <form onSubmit={handleCardIdSubmit} className={styles.formGroup}>
                                        <label className={styles.fieldLabel}>ArogyaSutra Health Card ID</label>
                                        <div className={styles.cardInputWrapper}>
                                            <span className={styles.cardPrefix}>AS-</span>
                                            <input
                                                type="text"
                                                className={styles.cardInput}
                                                placeholder="XXXX-XXXX-XXXX"
                                                value={cardId}
                                                onChange={(e) => setCardId(normalizeCardSuffix(e.target.value))}
                                                maxLength={17}
                                                autoFocus
                                            />
                                        </div>
                                        <p className={styles.fieldHint}>Located on your printed card or digital profile</p>
                                        <button type="submit" className={styles.primaryBtn} disabled={isLoading || !isValidCardId(fullCardId)}>
                                            {isLoading ? "Verifying Card..." : "Continue to Verification"}
                                        </button>
                                    </form>
                                )}

                                {state === "CARD_ID_ENTERED" && (
                                    <form onSubmit={handleDobSubmit} className={styles.formGroup}>
                                        <label className={styles.fieldLabel}>Date of Birth</label>
                                        <input
                                            type="date"
                                            className={styles.stdInput}
                                            value={dob}
                                            onChange={(e) => setDob(e.target.value)}
                                            autoFocus
                                        />
                                        <button type="submit" className={styles.primaryBtn} disabled={isLoading || !dob}>
                                            {isLoading ? "Verifying..." : "Verify & Send OTP"}
                                        </button>
                                    </form>
                                )}

                                {state === "OTP_SENT" && (
                                    <form onSubmit={handleOtpSubmit} className={styles.formGroup}>
                                        <label className={styles.fieldLabel}>One-Time Password (OTP)</label>
                                        {maskedPhone && <p className={styles.fieldHint}>Sent via SMS to {maskedPhone}</p>}
                                        {devOtp && (
                                            <p className={styles.devOtpBanner}>
                                                🧪 Demo OTP: <strong>{devOtp}</strong>
                                            </p>
                                        )}
                                        <div className={styles.otpGrid}>
                                            {[0, 1, 2, 3, 4, 5].map((i) => (
                                                <input
                                                    key={i}
                                                    type="text"
                                                    className={styles.otpBox}
                                                    maxLength={1}
                                                    value={otp[i] || ""}
                                                    onChange={(e) => {
                                                        const val = e.target.value.replace(/\D/g, "");
                                                        const newOtp = otp.split("");
                                                        newOtp[i] = val;
                                                        setOtp(newOtp.join(""));
                                                        if (val && e.target.nextElementSibling) {
                                                            (e.target.nextElementSibling as HTMLInputElement).focus();
                                                        }
                                                    }}
                                                    onKeyDown={(e) => {
                                                        if (e.key === "Backspace" && !otp[i] && e.currentTarget.previousElementSibling) {
                                                            (e.currentTarget.previousElementSibling as HTMLInputElement).focus();
                                                        }
                                                    }}
                                                    autoFocus={i === 0}
                                                />
                                            ))}
                                        </div>
                                        <div className={styles.countdownText}>{otpCountdown.formatted} remaining</div>
                                        <button type="submit" className={styles.primaryBtn} disabled={isLoading || otp.length !== 6}>
                                            {isLoading ? "Authenticating..." : "Authenticate & Unlock"}
                                        </button>
                                    </form>
                                )}
                            </>
                        )}

                        {/* Doctor Auth Flow */}
                        {role === "doctor" && (
                            <form onSubmit={handleDoctorLogin} className={styles.formGroup}>
                                <div>
                                    <label className={styles.fieldLabel}>MCI Number / Username</label>
                                    <input
                                        type="text"
                                        className={styles.stdInput}
                                        placeholder="e.g. MCI-12345"
                                        value={doctorId}
                                        onChange={(e) => setDoctorId(e.target.value)}
                                        autoFocus
                                    />
                                </div>
                                <div>
                                    <label className={styles.fieldLabel}>Password</label>
                                    <input
                                        type="password"
                                        className={styles.stdInput}
                                        placeholder="Enter account password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className={styles.primaryBtn}
                                    disabled={isLoading || !doctorId.trim() || !password}
                                >
                                    {isLoading ? "Authenticating..." : "Sign In to Clinical Portal"}
                                </button>
                            </form>
                        )}

                        <div className={styles.switchRow}>
                            <span>Don&apos;t have an account?</span>
                            <button type="button" className={styles.switchLink} onClick={() => setMode("register")}>
                                Register new profile
                            </button>
                        </div>
                    </>
                )}

                {/* REGISTER MODE */}
                {mode === "register" && (
                    <>
                        {regError && <div className={styles.errorBanner}><span>⚠️</span> {regError}</div>}

                        {regSuccess ? (
                            <div className={styles.regSuccessBox}>
                                <div className={styles.successBadge}>✅</div>
                                <h3>{regSuccess.userType === "patient" ? "Patient" : "Doctor"} Account Created</h3>
                                {regSuccess.cardId && (
                                    <div className={styles.cardIdBadge}>
                                        <span>Your Card ID</span>
                                        <strong>{regSuccess.cardId}</strong>
                                    </div>
                                )}
                                <button type="button" className={styles.primaryBtn} onClick={switchToLogin}>
                                    Return to Sign In
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleRegister} className={styles.formGroup}>
                                <div>
                                    <label className={styles.fieldLabel}>Full Name</label>
                                    <input
                                        type="text"
                                        className={styles.stdInput}
                                        placeholder="Full Name"
                                        value={regName}
                                        onChange={(e) => setRegName(e.target.value)}
                                        required
                                        autoFocus
                                    />
                                </div>
                                {role === "patient" ? (
                                    <>
                                        <div>
                                            <label className={styles.fieldLabel}>Phone Number</label>
                                            <input
                                                type="tel"
                                                className={styles.stdInput}
                                                placeholder="+919876543210"
                                                value={regPhone}
                                                onChange={(e) => setRegPhone(e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className={styles.fieldLabel}>Date of Birth</label>
                                            <input
                                                type="date"
                                                className={styles.stdInput}
                                                value={regDob}
                                                onChange={(e) => setRegDob(e.target.value)}
                                                required
                                            />
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className={styles.twoCol}>
                                            <div>
                                                <label className={styles.fieldLabel}>Email</label>
                                                <input type="email" className={styles.stdInput} placeholder="doctor@hospital.in" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} required />
                                            </div>
                                            <div>
                                                <label className={styles.fieldLabel}>Phone</label>
                                                <input type="tel" className={styles.stdInput} placeholder="+919876543210" value={regPhone} onChange={(e) => setRegPhone(e.target.value)} required />
                                            </div>
                                        </div>
                                        <div className={styles.twoCol}>
                                            <div>
                                                <label className={styles.fieldLabel}>MCI Number</label>
                                                <input type="text" className={styles.stdInput} placeholder="MCI-12345" value={regMci} onChange={(e) => setRegMci(e.target.value)} required />
                                            </div>
                                            <div>
                                                <label className={styles.fieldLabel}>Password</label>
                                                <input type="password" className={styles.stdInput} placeholder="••••••••••••" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} required minLength={12} />
                                            </div>
                                        </div>
                                    </>
                                )}
                                <button type="submit" className={styles.primaryBtn} disabled={regLoading}>
                                    {regLoading ? "Registering..." : `Create ${role === "patient" ? "Patient" : "Doctor"} Profile`}
                                </button>
                            </form>
                        )}

                        <div className={styles.switchRow}>
                            <span>Already registered?</span>
                            <button type="button" className={styles.switchLink} onClick={switchToLogin}>
                                Back to Sign In
                            </button>
                        </div>
                    </>
                )}

                {/* Emergency Break-Glass Footer */}
                {mode === "login" && onEmergencyAccess && (
                    <div className={styles.emergencyWrapper}>
                        <div className={styles.emergencyDivider}><span>FIRST RESPONDER EMERGENCY ACCESS</span></div>
                        <button className={styles.emergencyButton} onClick={onEmergencyAccess} type="button">
                            🆘 Emergency Break-Glass Access
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
