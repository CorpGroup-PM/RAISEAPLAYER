import AdminNavbar from "@/components/admin/AdminNavbar";
import AdminAllPayoutsTable from "@/components/admin/payouts/AdminAllPayoutsTable";

export default function AdminPayoutsPage() {
  return (
    <>
      <AdminNavbar />
      <main style={{ paddingTop: "70px", padding: "24px" }}>
        <AdminAllPayoutsTable />
      </main>
    </>
  );
}
