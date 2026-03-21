"use client";

import { snapTimeToQuarterHour } from "@/lib/timeQuarters";

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const QUARTERS = ["00", "15", "30", "45"] as const;

function parseParts(value: string): { hour: string; minute: string } {
  const v = value.trim();
  if (!v) return { hour: "", minute: "00" };
  const snapped = snapTimeToQuarterHour(v);
  const [h, rawM] = snapped.split(":");
  const m = rawM ?? "00";
  const minute = (QUARTERS as readonly string[]).includes(m) ? m : "00";
  return { hour: h ?? "00", minute };
}

export type TimeQuarterSelectProps = {
  value: string;
  onChange: (time: string) => void;
  /** Måste alltid ha tid (t.ex. starttid) */
  required?: boolean;
  /** Tillåt tomt värde – tom timrad rensar (sluttid, filter) */
  allowEmpty?: boolean;
  /** Yttre wrapper (t.ex. klass för filter-rad) */
  className?: string;
  /** Klass på båda select (field-select eller filter-select) */
  selectClassName?: string;
  /** Tillgängligt namn för gruppen */
  groupAriaLabel: string;
  /** Etikett för tom timme när allowEmpty */
  emptyLabel?: string;
};

export default function TimeQuarterSelect({
  value,
  onChange,
  required = false,
  allowEmpty = false,
  className = "",
  selectClassName = "field-select",
  groupAriaLabel,
  emptyLabel = "Ingen",
}: TimeQuarterSelectProps) {
  const { hour, minute } = parseParts(value);
  const minuteDisabled = allowEmpty && !hour;

  function handleHourChange(newHour: string) {
    if (!newHour) {
      onChange("");
      return;
    }
    const keepMinute = value.trim().includes(":") ? parseParts(value).minute : "00";
    onChange(`${newHour}:${keepMinute}`);
  }

  function handleMinuteChange(newMinute: string) {
    const h = hour || (required ? "12" : "");
    if (!h) return;
    onChange(`${h}:${newMinute}`);
  }

  return (
    <div
      className={`time-quarter-selects ${className}`.trim()}
      role="group"
      aria-label={groupAriaLabel}
    >
      <select
        className={selectClassName}
        aria-label={`${groupAriaLabel} – timme`}
        value={hour}
        onChange={(e) => handleHourChange(e.target.value)}
        required={required}
      >
        {allowEmpty && !required && (
          <option value="">{emptyLabel}</option>
        )}
        {HOURS.map((h) => (
          <option key={h} value={h}>
            {h}
          </option>
        ))}
      </select>
      <span className="time-quarter-sep" aria-hidden>
        :
      </span>
      <select
        className={selectClassName}
        aria-label={`${groupAriaLabel} – minut (kvartal)`}
        value={minuteDisabled ? "00" : minute}
        disabled={minuteDisabled}
        onChange={(e) => handleMinuteChange(e.target.value)}
      >
        {QUARTERS.map((m) => (
          <option key={m} value={m}>
            {m}
          </option>
        ))}
      </select>
    </div>
  );
}
