"use client";

/* Studio field primitives.

   The rule this file exists for: no vocabulary in the studio is a closed list.
   Every picker ships the researched defaults AND accepts an author-defined
   value, because the product has to fit roles, industries and taxonomies we
   never anticipated. `Combo` is the workhorse — a native select for the common
   path, plus a "Custom…" option that turns the control into a free text field
   and keeps the custom value in the list from then on. */

import { useEffect, useId, useRef, useState } from "react";
import { CircleHelp, Plus, RotateCcw, X } from "lucide-react";

export const INPUT =
  "iris-focus w-full rounded-lg border border-hairline bg-surface px-3 py-2.5 text-[13px] text-hi placeholder:text-lo";
export const LABEL = "mb-1.5 block font-mono text-[10px] uppercase tracking-[.08em] text-lo";
export const CARD = "rounded-xl border border-hairline bg-surface";
export const BTN =
  "iris-focus rounded-lg border border-hairline px-3 py-2 text-[12px] text-mid hover:border-hairline-strong hover:text-hi";

const CUSTOM = "__custom__";

export function Field({
  label, children, hint, htmlFor,
}: { label: string; children: React.ReactNode; hint?: string; htmlFor?: string }) {
  return (
    <div className="block">
      <label className={LABEL} htmlFor={htmlFor}>{label}</label>
      {children}
      {hint && <p className="mt-1 text-[10px] leading-relaxed text-lo">{hint}</p>}
    </div>
  );
}

export function Why({ text }: { text?: string }) {
  if (!text) return null;
  return (
    <span className="group relative inline-flex" tabIndex={0} aria-label="Why this value">
      <CircleHelp className="size-3.5 text-lo" />
      <span className="pointer-events-none absolute right-0 top-5 z-30 hidden w-64 rounded-lg border border-hairline bg-void2 p-3 text-[11px] leading-relaxed text-mid group-hover:block group-focus:block">
        {text}
      </span>
    </span>
  );
}

export function Toggle({
  checked, onChange, label, help,
}: { checked: boolean; onChange: (v: boolean) => void; label: string; help?: string }) {
  return (
    <div className="flex items-start gap-3">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`iris-focus mt-0.5 h-5 w-9 shrink-0 rounded-full border p-0.5 transition-colors ${checked ? "border-irisb bg-irisb/20" : "border-hairline-strong bg-void2"}`}
      >
        <span className={`block size-3.5 rounded-full transition-transform ${checked ? "translate-x-4 bg-irisb" : "bg-lo"}`} />
      </button>
      <span>
        <span className="block text-[13px] text-hi">{label}</span>
        {help && <span className="mt-0.5 block text-[11px] leading-relaxed text-lo">{help}</span>}
      </span>
    </div>
  );
}

/* ---------- Combo: a picker that never traps you in its own vocabulary ---------- */

export function Combo({
  value, onChange, options, label, format, placeholder, className, allowCustom = false,
}: {
  value: string;
  onChange: (v: string) => void;
  options: readonly string[];
  label?: string;
  /* display transform for machine-ish values ("full_time" → "full time") */
  format?: (v: string) => string;
  placeholder?: string;
  className?: string;
  /* Opt-in, because most pickers here drive real behavior: an integrity tier or
     a paste policy the runtime doesn't know is a bug, not flexibility. Set it
     on the vocabulary fields whose type is `Open<…>` — role families, industry
     packs, seniorities — where an author-defined value is the point. */
  allowCustom?: boolean;
}) {
  const [custom, setCustom] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const show = format ?? ((v: string) => v);
  /* a value that is not in the built-ins is itself a custom entry — keep it listed */
  const list = value && !options.includes(value) ? [...options, value] : options;

  useEffect(() => {
    if (custom) inputRef.current?.focus();
  }, [custom]);

  if (custom) {
    return (
      <div className={`flex items-center gap-1.5 ${className ?? ""}`}>
        <input
          ref={inputRef}
          className={INPUT}
          aria-label={label ? `${label} — custom value` : "Custom value"}
          placeholder={placeholder ?? "Type your own…"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === "Escape") setCustom(false); }}
        />
        <button
          type="button"
          className={BTN}
          aria-label="Back to the list"
          title="Back to the list"
          onClick={() => setCustom(false)}
        >
          <RotateCcw className="size-3.5" />
        </button>
      </div>
    );
  }

  return (
    <select
      className={`${INPUT} ${className ?? ""}`}
      aria-label={label}
      value={value}
      onChange={(e) => {
        if (e.target.value === CUSTOM) { setCustom(true); return; }
        onChange(e.target.value);
      }}
    >
      {value === "" && <option value="">{placeholder ?? "Select…"}</option>}
      {list.map((o) => <option key={o} value={o}>{show(o)}</option>)}
      {allowCustom && <option value={CUSTOM}>＋ Custom…</option>}
    </select>
  );
}

/* ---------- NumberInput: empty is empty, not 0 or NaN ---------- */

export function NumberInput({
  value, onChange, min, max, step, placeholder, className, label, suffix,
}: {
  value: number | undefined;
  onChange: (v: number | undefined) => void;
  min?: number; max?: number; step?: number;
  placeholder?: string; className?: string; label?: string; suffix?: string;
}) {
  const [raw, setRaw] = useState<string>(value === undefined ? "" : String(value));
  const id = useId();
  /* keep in sync when the value changes elsewhere (rebalancing, presets) */
  useEffect(() => {
    setRaw((current) => (current === "" && value === undefined) || Number(current) === value ? current : value === undefined ? "" : String(value));
  }, [value]);

  const control = (
    <input
      id={id}
      type="number"
      inputMode="decimal"
      aria-label={label}
      className={className ?? INPUT}
      min={min} max={max} step={step}
      placeholder={placeholder}
      value={raw}
      onChange={(e) => {
        setRaw(e.target.value);
        if (e.target.value.trim() === "") { onChange(undefined); return; }
        const n = Number(e.target.value);
        if (Number.isFinite(n)) onChange(clamp(n, min, max));
      }}
      onBlur={() => { if (value !== undefined) setRaw(String(value)); }}
    />
  );
  if (!suffix) return control;
  return (
    <span className="flex items-center gap-2">
      {control}
      <span className="shrink-0 font-mono text-[10px] text-lo">{suffix}</span>
    </span>
  );
}

function clamp(n: number, min?: number, max?: number): number {
  if (min !== undefined && n < min) return min;
  if (max !== undefined && n > max) return max;
  return n;
}

/* ---------- TagList: any list-of-strings field, add/remove your own ---------- */

export function TagList({
  values, onChange, placeholder, label,
}: { values: string[]; onChange: (v: string[]) => void; placeholder?: string; label?: string }) {
  const [entry, setEntry] = useState("");
  const commit = () => {
    const v = entry.trim();
    if (!v || values.includes(v)) { setEntry(""); return; }
    onChange([...values, v]);
    setEntry("");
  };
  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        {values.map((v) => (
          <span key={v} className="inline-flex items-center gap-1.5 rounded-full border border-hairline bg-void2 py-1 pl-2.5 pr-1.5 text-[11px] text-mid">
            {v}
            <button
              type="button"
              aria-label={`Remove ${v}`}
              onClick={() => onChange(values.filter((x) => x !== v))}
              className="iris-focus rounded-full p-0.5 hover:text-hi"
            >
              <X className="size-3" />
            </button>
          </span>
        ))}
        {values.length === 0 && <span className="text-[11px] text-lo">Nothing added yet.</span>}
      </div>
      <div className="mt-2 flex items-center gap-1.5">
        <input
          className={INPUT}
          aria-label={label ? `Add to ${label}` : "Add an entry"}
          placeholder={placeholder ?? "Add an entry and press Enter"}
          value={entry}
          onChange={(e) => setEntry(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); commit(); } }}
        />
        <button type="button" className={BTN} onClick={commit} aria-label="Add entry"><Plus className="size-3.5" /></button>
      </div>
    </div>
  );
}

/* ---------- MultiSelect: fixed vocabulary, multiple picks, custom allowed ---------- */

export function ChipMulti({
  values, options, onChange, format, allowCustom = true, label,
}: {
  values: string[];
  options: readonly string[];
  onChange: (v: string[]) => void;
  format?: (v: string) => string;
  allowCustom?: boolean;
  label?: string;
}) {
  const [adding, setAdding] = useState(false);
  const [entry, setEntry] = useState("");
  const show = format ?? ((v: string) => v);
  const all = [...options, ...values.filter((v) => !options.includes(v))];
  const toggle = (o: string) =>
    onChange(values.includes(o) ? values.filter((v) => v !== o) : [...values, o]);
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {all.map((o) => {
        const on = values.includes(o);
        return (
          <button
            key={o}
            type="button"
            aria-pressed={on}
            onClick={() => toggle(o)}
            className={`iris-focus rounded-full border px-2.5 py-1 text-[10px] ${on ? "border-irisb/50 bg-irisb/10 text-irisc" : "border-hairline text-lo hover:text-mid"}`}
          >{show(o)}</button>
        );
      })}
      {allowCustom && (adding ? (
        <input
          autoFocus
          className="w-40 rounded-full border border-hairline bg-void2 px-2.5 py-1 text-[10px] text-hi outline-none"
          aria-label={label ? `Add to ${label}` : "Add option"}
          placeholder="Custom…"
          value={entry}
          onChange={(e) => setEntry(e.target.value)}
          onBlur={() => { setAdding(false); setEntry(""); }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              const v = entry.trim();
              if (v && !values.includes(v)) onChange([...values, v]);
              setEntry(""); setAdding(false);
            }
            if (e.key === "Escape") { setEntry(""); setAdding(false); }
          }}
        />
      ) : (
        <button type="button" onClick={() => setAdding(true)} className="iris-focus rounded-full border border-dashed border-hairline px-2.5 py-1 text-[10px] text-lo hover:text-hi">
          ＋ Custom
        </button>
      ))}
    </div>
  );
}
