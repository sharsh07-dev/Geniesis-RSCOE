"use client";

import React, { useState, useRef, useEffect } from "react";
import { Globe, Check, ChevronDown } from "lucide-react";
import { useLanguage, broadcastLangChange } from "../../hooks/useLanguage";
import { SUPPORTED_LANGUAGES, type SupportedLang } from "../../lib/i18n/translations";

interface LanguageSelectorProps {
  variant?: "topbar" | "login" | "settings";
}

export default function LanguageSelector({ variant = "topbar" }: LanguageSelectorProps) {
  const { lang } = useLanguage();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentLang = SUPPORTED_LANGUAGES.find((l) => l.code === lang) || SUPPORTED_LANGUAGES[0];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (code: SupportedLang) => {
    broadcastLangChange(code);
    setOpen(false);
  };

  return (
    <div ref={containerRef} style={{ position: "relative", display: "inline-block" }}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          background: variant === "login" ? "#F8FAFC" : "#F1F5F9",
          border: "1px solid #CBD5E1",
          borderRadius: "8px",
          padding: variant === "login" ? "8px 12px" : "6px 10px",
          fontSize: "12px",
          fontWeight: 700,
          color: "#0F172A",
          cursor: "pointer",
          transition: "all 0.15s ease",
          boxShadow: variant === "login" ? "0 1px 3px rgba(0,0,0,0.06)" : "none",
        }}
        title="Select Language / भाषा चुनें"
        aria-label="Select Language"
      >
        <Globe size={15} color="#059669" />
        <span>{currentLang.nativeName}</span>
        <ChevronDown size={13} color="#64748B" />
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            right: 0,
            background: "#FFFFFF",
            border: "1px solid #E2E8F0",
            borderRadius: "12px",
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.12), 0 8px 10px -6px rgba(0, 0, 0, 0.04)",
            padding: "6px",
            minWidth: "160px",
            maxHeight: "320px",
            overflowY: "auto",
            zIndex: 1500,
          }}
        >
          <div
            style={{
              fontSize: "10px",
              fontWeight: 800,
              color: "#94A3B8",
              textTransform: "uppercase",
              padding: "4px 8px 6px",
              letterSpacing: "0.05em",
            }}
          >
            Languages • भाषाएं
          </div>

          {SUPPORTED_LANGUAGES.map((l) => {
            const isSelected = l.code === lang;
            return (
              <button
                key={l.code}
                type="button"
                onClick={() => handleSelect(l.code)}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "7px 10px",
                  border: "none",
                  background: isSelected ? "#ECFDF5" : "transparent",
                  color: isSelected ? "#047857" : "#1E293B",
                  fontSize: "12px",
                  fontWeight: isSelected ? 700 : 500,
                  borderRadius: "6px",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "background 0.1s ease",
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) e.currentTarget.style.background = "#F1F5F9";
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) e.currentTarget.style.background = "transparent";
                }}
              >
                <div>
                  <span style={{ fontWeight: 600 }}>{l.nativeName}</span>
                  <span style={{ fontSize: "10px", color: "#64748B", marginLeft: "6px" }}>
                    ({l.name})
                  </span>
                </div>
                {isSelected && <Check size={14} color="#059669" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
