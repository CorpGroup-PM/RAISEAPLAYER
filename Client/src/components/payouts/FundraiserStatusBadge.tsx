export default function StatusCard({ status }: { status: string }) {
  const styles: Record<string, React.CSSProperties> = {
    PENDING:    { background: "#fef3c7", color: "#b45309" },
    APPROVED:   { background: "#dbeafe", color: "#1d4ed8" },
    PROCESSING: { background: "#e0f2fe", color: "#0369a1" },
    PAID:       { background: "#dcfce7", color: "#15803d" },
    REJECTED:   { background: "#ffe4e6", color: "#be123c" },
    FAILED:     { background: "#ffe4e6", color: "#be123c" },
    CANCELLED:  { background: "#f1f5f9", color: "#64748b" },
  };

  const style = styles[status] ?? { background: "#f1f5f9", color: "#64748b" };

  return (
    <span
      style={{
        ...style,
        display: "inline-block",
        padding: "3px 10px",
        borderRadius: "999px",
        fontSize: "11px",
        fontWeight: 600,
        whiteSpace: "nowrap",
        letterSpacing: "0.02em",
      }}
    >
      {status}
    </span>
  );
}
