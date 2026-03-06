"use client";

import React, { useEffect, useMemo, useState } from "react";
import "./adminUserDetails.css";
import { useParams, useRouter } from "next/navigation";
import { UserInfoService } from "@/services/userinfo.service";

type FundraiserCreated = {
  id: string;
  title: string;
  status: string;
  goalAmount: string | number;
  raisedAmount: string | number;
  createdAt: string;
};

type Donation = {
  id: string;
  fundraiserId: string;
  donationAmount: string | number;
  platformTipAmount: string | number;
  totalAmount: string | number;
  currency: string;
  status: string;
  createdAt: string;
  fundraiser?: { id: string; title: string };
};

type ProcessedPayout = {
  id: string;
  amount: string | number;
  createdAt: string;
  fundraiser?: { id: string; title: string };
};

type UserInfoResponse = {
  id: string;
  profileImageUrl?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
  role?: string | null;
  panDetails?: any;
  createdAt?: string;

  fundraisersCreated: FundraiserCreated[];
  donations: Donation[];
  processedPayouts: ProcessedPayout[];
};

type TabKey = "PROFILE" | "CAMPAIGNS" | "DONATIONS" | "PAYOUTS";

export default function AdminUserDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params?.id as string;

  const [activeTab, setActiveTab] = useState<TabKey>("PROFILE");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<UserInfoResponse | null>(null);
  const [error, setError] = useState("");

  const fetchUser = async () => {
    try {
      setLoading(true);
      setError("");

      console.log("Calling API for userId:", userId);

      const res = await UserInfoService.getByCampaignId(userId);


      console.log("UserInfo API success:", res.data);

      setData(res.data);
    } catch (err: any) {
      console.log("UserInfo API failed:", {
        message: err?.message,
        status: err?.response?.status,
        data: err?.response?.data,
        url: err?.config?.url,
        baseURL: err?.config?.baseURL,
      });

      setError(err?.response?.data?.message || "Failed to fetch user");
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    if (!userId) return;
    fetchUser();
  }, [userId]);

  const fullName = useMemo(() => {
    return (
      [data?.firstName, data?.lastName].filter(Boolean).join(" ") ||
      "Unknown User"
    );
  }, [data]);

  return (
    <div className="admin-user-details-page admin-page-wrapper">
      {/* HEADER */}
      <div className="admin-user-topbar">
        <button className="back-btn" onClick={() => router.push("/admin/users")}>
          ← Back
        </button>

        <div className="admin-user-title">
          <h2>{fullName}</h2>
          <p className="muted">{data?.email || "-"}</p>
        </div>

        <button className="refresh-btn" onClick={fetchUser}>
          Refresh
        </button>
      </div>

      {/* LOADING / ERROR */}
      {loading && <div className="state-box">Loading user info...</div>}
      {!loading && error && <div className="state-box error">{error}</div>}

      {!loading && !error && data && (
        <>
          {/* TABS */}
          <div className="tabs">
            <button
              className={`tab tab-profile ${activeTab === "PROFILE" ? "active" : ""}`}
              onClick={() => setActiveTab("PROFILE")}
            >
              User Details
            </button>

            <button
              className={`tab tab-campaigns ${activeTab === "CAMPAIGNS" ? "active" : ""}`}
              onClick={() => setActiveTab("CAMPAIGNS")}
            >
              Campaigns ({data.fundraisersCreated?.length || 0})
            </button>

            <button
              className={`tab tab-donations ${activeTab === "DONATIONS" ? "active" : ""}`}
              onClick={() => setActiveTab("DONATIONS")}
            >
              Donations ({data.donations?.length || 0})
            </button>

            <button
              className={`tab tab-payouts ${activeTab === "PAYOUTS" ? "active" : ""}`}
              onClick={() => setActiveTab("PAYOUTS")}
            >
              Payouts ({data.processedPayouts?.length || 0})
            </button>
          </div>

          {/* TAB CONTENT */}
          <div className="tab-content">
            {/* ✅ PROFILE TAB */}
            {activeTab === "PROFILE" && (
              <div className="card">
                <h3>User Profile</h3>

                <div className="grid">
                  <div className="info">
                    <span className="label">Name</span>
                    <span className="value">{fullName}</span>
                  </div>

                  <div className="info">
                    <span className="label">Email</span>
                    <span className="value">{data.email || "-"}</span>
                  </div>

                  <div className="info">
                    <span className="label">Phone</span>
                    <span className="value">{data.phoneNumber || "-"}</span>
                  </div>

                  <div className="info">
                    <span className="label">Role</span>
                    <span className="value">{data.role || "-"}</span>
                  </div>

                  <div className="info">
                    <span className="label">Joined On</span>
                    <span className="value">
                      {data.createdAt
                        ? new Date(data.createdAt).toLocaleString("en-IN")
                        : "-"}
                    </span>
                  </div>
                </div>

                <h3 style={{ marginTop: 18 }}>PAN Details</h3>

                <div className="grid">
                  <div className="info">
                    <span className="label">PAN Number</span>
                    <span className="value">{data.panDetails?.panNumber || "-"}</span>
                  </div>

                  <div className="info">
                    <span className="label">PAN Name</span>
                    <span className="value">{data.panDetails?.panName || "-"}</span>
                  </div>

                  <div className="info">
                    <span className="label">Address</span>
                    <span className="value">{data.panDetails?.address || "-"}</span>
                  </div>

                  <div className="info">
                    <span className="label">City</span>
                    <span className="value">{data.panDetails?.city || "-"}</span>
                  </div>
                </div>
              </div>
            )}

            {/* ✅ CAMPAIGNS TAB */}
            {activeTab === "CAMPAIGNS" && (
              <div className="card">
                <h3>Campaigns Created</h3>

                {data.fundraisersCreated?.length ? (
                  <div className="grid-list">
                    {data.fundraisersCreated.map((x) => (
                      <div key={x.id} className="grid-item">
                        <div className="grid-item-top">
                          <div className="title">{x.title}</div>
                          <div className={`status-pill ${x.status}`}>{x.status}</div>

                          <div className="muted">
                            Created: {new Date(x.createdAt).toLocaleDateString("en-IN")}
                          </div>
                        </div>

                        <div className="grid-item-bottom">
                          <div>
                            <div className="bold">₹{x.raisedAmount}</div>
                            <div className="muted">Goal: ₹{x.goalAmount}</div>
                          </div>

                          <div className="grid-item-right">
                            <button
                              className="small-btn"
                              onClick={() => router.push(`/admin/campaigns/${x.id}`)}
                            >
                              View →
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                ) : (
                  <p className="muted">No campaigns created.</p>
                )}
              </div>
            )}

            {/* ✅ DONATIONS TAB */}
            {activeTab === "DONATIONS" && (
              <div className="card">
                <h3>Donations</h3>

                {data.donations?.length ? (
                  <div className="grid-list">
                    {data.donations.map((x) => (
                      <div key={x.id} className="grid-item">
                        <div className="grid-item-top">
                          <div className="title">{x.fundraiser?.title || "Fundraiser"}</div>
                          <div className={`status-pill ${x.status}`}>{x.status}</div>

                          <div className="muted">
                            Date: {new Date(x.createdAt).toLocaleDateString("en-IN")}
                          </div>
                        </div>

                        <div className="grid-item-bottom">
                          <div>
                            <div className="bold">
                              {x.currency} {x.totalAmount}
                            </div>
                            <div className="muted">
                              Donation: {x.currency} {x.donationAmount}
                            </div>
                            <div className="muted">
                              Tip: {x.currency} {x.platformTipAmount}
                            </div>
                          </div>

                          <div className="grid-item-right">
                            {!!x.fundraiserId && (
                              <button
                                className="small-btn"
                                onClick={() => router.push(`/admin/campaigns/${x.fundraiserId}`)}
                              >
                                View →
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                ) : (
                  <p className="muted">No donations found.</p>
                )}
              </div>
            )}

            {/* ✅ PAYOUTS TAB */}
            {activeTab === "PAYOUTS" && (
              <div className="card">
                <h3>Processed Payouts</h3>

                {data.processedPayouts?.length ? (
                  <div className="grid-list">
                    {data.processedPayouts.map((x) => (
                      <div key={x.id} className="grid-item">
                        <div className="grid-item-top">
                          <div className="title">{x.fundraiser?.title || "Fundraiser"}</div>

                          <div className="muted">
                            Date: {new Date(x.createdAt).toLocaleDateString("en-IN")}
                          </div>
                        </div>

                        <div className="grid-item-bottom">
                          <div>
                            <div className="bold">₹{x.amount}</div>
                          </div>

                          <div className="grid-item-right">
                            {!!x.fundraiser?.id && (
                              <button
                                className="small-btn"
                                onClick={() => router.push(`/admin/campaigns/${x.fundraiser?.id}`)}
                              >
                                View →
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                ) : (
                  <p className="muted">No payouts found.</p>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
