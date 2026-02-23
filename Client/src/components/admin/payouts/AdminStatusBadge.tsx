export default function AdminStatusBadge({ status }: { status: string }) {
  // const map: any = {
  //   PENDING: "#facc15",
  //   APPROVED: "#3b82f6",
  //   PROCESSING: "#a1a1aa",
  //   PAID: "#22c55e",
  //   FAILED: "#ef4444",
  //   REJECTED: "#dc2626",
  //   CANCELLED: "#9ca3af",
  // };
  const map: any = {
    PENDING: "",
    APPROVED: "",
    PROCESSING: "",
    PAID: "",
    FAILED: "",
    REJECTED: "",
    CANCELLED: "",
  };

  return (
    <span
      style={{
        background: map[status],
        color: "#111827",
        // padding: "4px 10px",
        // borderRadius: "999px",
        fontSize: "12px",
        fontWeight: 700,
      }}
    >
      {status}
    </span>
  );
}
