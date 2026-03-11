export default function AdminStatusBadge({ status }: { status: string }) {
  const cls = status.toLowerCase();
  return (
    <span className={`apBadge ${cls}`}>
      {status}
    </span>
  );
}
