import { api } from "@/lib/api-client";

export const FundraiserReviewService = {
  create(
   
    payload: {
      name: string;
      rating: number;
      message: string;
    }
  ) {
    return api.post(
      `/fundraiser/review`,
      payload
    );
  },
};
