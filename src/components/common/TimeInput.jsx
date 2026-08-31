import { useEffect, useRef, useState } from "react";

// Native <input type="time"> renders inconsistently across browsers/OS (some show
// AM/PM segments + a clock icon, others show plain 24h digits with no way to tell
// which segment is focused). This renders identically everywhere and always lets
// you type digits directly. Value/onChange still use the native "HH:MM" 24h format
// so it's a drop-in replacement wherever <input type="time"> was used.
const TimeInput = ({ value, onChange, className = "" }) => {
  const [hour, setHour] = useState("");
  const [minute, setMinute] = useState("");
  const [meridiem, setMeridiem] = useState("AM");
  const minuteRef = useRef(null);
  const lastEmitted = useRef(null);

  useEffect(() => {
    // Skip re-deriving from our own just-emitted value — otherwise typing a single
    // minute digit (e.g. "3") round-trips through the parent, comes back padded as
    // "03", and overwrites the field before the second digit ("0" of "30") lands.
    if (value === lastEmitted.current) return;
    if (!value) {
      setHour("");
      setMinute("");
      setMeridiem("AM");
      return;
    }
    const [h, m] = value.split(":").map(Number);
    setMeridiem(h >= 12 ? "PM" : "AM");
    setHour(String(h % 12 === 0 ? 12 : h % 12));
    setMinute(String(m).padStart(2, "0"));
  }, [value]);

  const emit = (h, m, mer) => {
    const hh = parseInt(h, 10);
    const mm = parseInt(m, 10);
    if (!h || !m || isNaN(hh) || isNaN(mm) || hh < 1 || hh > 12 || mm > 59) return;
    let h24 = hh % 12;
    if (mer === "PM") h24 += 12;
    const composed = `${String(h24).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
    lastEmitted.current = composed;
    onChange(composed);
  };

  const handleHourChange = (e) => {
    let v = e.target.value.replace(/\D/g, "").slice(0, 2);
    if (v && parseInt(v, 10) > 12) v = "12";
    setHour(v);
    emit(v, minute, meridiem);
    if (v.length === 2) minuteRef.current?.focus();
  };

  const handleMinuteChange = (e) => {
    let v = e.target.value.replace(/\D/g, "").slice(0, 2);
    if (v && parseInt(v, 10) > 59) v = "59";
    setMinute(v);
    emit(hour, v, meridiem);
  };

  const toggleMeridiem = (mer) => {
    setMeridiem(mer);
    emit(hour, minute, mer);
  };

  return (
    <div
      className={`flex items-center gap-1.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 focus-within:border-purple-500 focus-within:ring-2 focus-within:ring-purple-500/20 transition-all duration-200 ${className}`}
    >
      <input
        type="text"
        inputMode="numeric"
        placeholder="HH"
        maxLength={2}
        value={hour}
        onChange={handleHourChange}
        className="w-8 bg-transparent text-center text-gray-900 dark:text-white outline-none"
      />
      <span className="text-gray-400 dark:text-gray-500">:</span>
      <input
        ref={minuteRef}
        type="text"
        inputMode="numeric"
        placeholder="MM"
        maxLength={2}
        value={minute}
        onChange={handleMinuteChange}
        className="w-8 bg-transparent text-center text-gray-900 dark:text-white outline-none"
      />
      <div className="flex ml-auto rounded-lg overflow-hidden border border-gray-200 dark:border-white/10 shrink-0">
        {["AM", "PM"].map((mer) => (
          <button
            key={mer}
            type="button"
            onClick={() => toggleMeridiem(mer)}
            className={`px-2 py-1 text-xs font-bold transition-colors ${
              meridiem === mer
                ? "text-white"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white"
            }`}
            style={meridiem === mer ? { background: "linear-gradient(135deg, #9E2FD0, #7b22a8)" } : {}}
          >
            {mer}
          </button>
        ))}
      </div>
    </div>
  );
};

export default TimeInput;
