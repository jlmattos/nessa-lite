"use client";

import { useRef } from "react";

/**
 * Friendly number input: tapping selects everything (type to replace, no
 * deleting), and leaving it blank restores the previous value.
 */
export function NumberInput({
  value,
  onChange,
  placeholder,
  inputMode = "decimal",
  className = "",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  inputMode?: "decimal" | "numeric";
  className?: string;
}) {
  const focusValue = useRef("");
  return (
    <input
      type="text"
      inputMode={inputMode}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value.replace(/[^0-9.]/g, ""))}
      onFocus={(e) => {
        focusValue.current = e.target.value;
        const el = e.target;
        requestAnimationFrame(() => el.select());
      }}
      onBlur={(e) => {
        if (e.target.value.trim() === "" && focusValue.current !== "") {
          onChange(focusValue.current);
        }
      }}
      className={`w-full h-14 rounded-2xl border border-line bg-surface text-center text-xl font-semibold text-foreground placeholder:text-muted/40 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent-soft transition-shadow ${className}`}
    />
  );
}
