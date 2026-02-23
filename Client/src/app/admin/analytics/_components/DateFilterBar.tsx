import {
  getTodayISO,
  getLast7DaysISO,
  getStartOfWeekISO,
  getStartOfMonthISO,
  getStartOfYearISO,
} from "@/lib/date-utils";

export default function DateFilterBar({
  from,
  to,
  setFrom,
  setTo,
  onApply,
  loading,
}: {
  from: string;
  to: string;
  setFrom: (v: string) => void;
  setTo: (v: string) => void;
  onApply: (range: { from: string; to: string }) => void;
  loading: boolean;
}) {
  const apply = (f: string, t: string) => {
    setFrom(f);
    setTo(t);
    onApply({ from: f, to: t });
  };

  return (
    <div className="aaStickyBar">
      <div className="aaFilterBar">
        <div className="aaDates">
          <div className="aaField">
            <div className="aaFieldLabel">From</div>
            <input
              className="aaInput"
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </div>

          <div className="aaField">
            <div className="aaFieldLabel">To</div>
            <input
              className="aaInput"
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>

          <button
            className="aaBtn aaBtnPrimary"
            disabled={loading}
            onClick={() => onApply({ from, to })}
          >
            {loading ? "Loading..." : "Apply"}
          </button>

          <button
            className="aaBtn"
            disabled={loading}
            onClick={() => apply(getLast7DaysISO(), getTodayISO())}
          >
            Reset
          </button>
        </div>
        <div className="aaPresets">
          <button
            className="aaPreset"
            disabled={loading}
            onClick={() => apply(getTodayISO(), getTodayISO())}
          >
            Today
          </button>
          <button
            className="aaPreset"
            disabled={loading}
            onClick={() => apply(getStartOfWeekISO(), getTodayISO())}
          >
            This Week
          </button>
          <button
            className="aaPreset"
            disabled={loading}
            onClick={() => apply(getStartOfMonthISO(), getTodayISO())}
          >
            This Month
          </button>
          <button
            className="aaPreset"
            disabled={loading}
            onClick={() => apply(getStartOfYearISO(), getTodayISO())}
          >
            This Year
          </button>
        </div>
      </div>
    </div>
  );
}
