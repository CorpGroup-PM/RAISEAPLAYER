"use client";

import { useEffect, useState } from "react";
import "./adminUsers.css";
import { adminAnalytics } from "@/services/adminAnalytics.service";
import { useRouter } from "next/navigation";

type AdminUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  isEmailVerified: boolean;
  createdAt: string;
  updatedAt: string;
};

export default function AdminUsersPage() {
   const router = useRouter();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const res = await adminAnalytics.listAllUsers();
      setUsers(res.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <>
      <div className="admin-users-page admin-page-wrapper">
        <div className="admin-users-head">
          <h2>All Users</h2>
          <span className="count">{users.length} users</span>
        </div>

        <div className="admin-users-table-wrap">
          <table className="admin-users-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Email Status</th>
                <th>Joined On</th>
              </tr>
            </thead>

            <tbody>
              {loading && (
                <tr>
                  <td colSpan={5} className="admin-empty">
                    Loading...
                  </td>
                </tr>
              )}

              {!loading && users.length === 0 && (
                <tr>
                  <td colSpan={5} className="admin-empty">
                    No users found
                  </td>
                </tr>
              )}

              {users.map((u) => (
                <tr key={u.id}>
                  {/* NAME */}
                 <td>
                    <button
                      className="user-link-btn"
                      onClick={() => router.push(`/admin/users/${u.id}`)}
                      title="View user info"
                    >
                      {[u.firstName, u.lastName].filter(Boolean).join(" ") ||
                        "—"}
                    </button>
                  </td>

                  {/* EMAIL */}
                  <td>{u.email}</td>

                  {/* PHONE */}
                  <td>{u.phoneNumber || "—"}</td>

                  {/* VERIFIED */}
                  <td>
                    <span
                      className={`status-chip ${
                        u.isEmailVerified ? "verified" : "pending"
                      }`}
                    >
                      {u.isEmailVerified ? "Verified" : "Not Verified"}
                    </span>
                  </td>

                  {/* CREATED */}
                  <td>
                    {new Date(u.createdAt).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
