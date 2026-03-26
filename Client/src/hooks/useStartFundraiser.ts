"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { UserService } from "@/services/user.service";
import { toastManager } from "@/lib/toast-manager";

export function useStartFundraiser() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  const [kycCheckLoading, setKycCheckLoading] = useState(false);
  const [isKycModalOpen, setIsKycModalOpen] = useState(false);

  const handleStartFundraiser = async () => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    setKycCheckLoading(true);
    try {
      const res = await UserService.getKycStatus();
      if (!res.data.panCompleted || !res.data.aadhaarCompleted) {
        setIsKycModalOpen(true);
      } else {
        router.push("/start-fundraiser");
      }
    } catch {
      toastManager.show(
        "Unable to verify KYC status. Please try again.",
        "error",
      );
    } finally {
      setKycCheckLoading(false);
    }
  };

  return {
    handleStartFundraiser,
    kycCheckLoading,
    isKycModalOpen,
    closeKycModal: () => setIsKycModalOpen(false),
  };
}
