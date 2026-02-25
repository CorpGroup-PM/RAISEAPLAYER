"use client";

import React from "react";
import "./StatusBadge.css";

type StatusBadgeProps = {
  status?: string;
};

const getStatusClass = (status?: string) => {
  switch (status) {
    case "ACTIVE":
      return "status-green";

    case "PENDING_REVIEW":
      return "status-yellow";

    case "REJECTED":
        return "status-red";

    case "SUSPENDED":
        return "status-gray";
    case "APPROVED":
      return "status-blue";

    default:
      return "status-gray";
  }
};

const formatStatus = (status?: string) => {
  if (!status) return "UNKNOWN";
  return status.replace("_", " ");
};

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  return (
    <span className={`status-pill ${getStatusClass(status)}`}>
      {formatStatus(status)}
    </span>
  );
};

export default StatusBadge;
