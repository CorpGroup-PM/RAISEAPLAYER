export default function StatusCard({ status }: { status: string }) {
  const map: any = {
    PENDING:"",
    APPROVED: "",
    PROCESSING: "",
    PAID: "",
    REJECTED: "",
    FAILED: "",
    CANCELLED: "",
  };

  return (
   <span
      style={{
        background: map[status],
        color: "#111827",
        // padding: "4px 10px",
        borderRadius: "999px",
        fontSize: "12px",
        fontWeight: 700,
      }}
    >
      {status}
    </span>
  );
}
