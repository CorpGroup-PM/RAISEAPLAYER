import { api } from "@/lib/api-client";

export const SupportersService = {
  getSupporters: (fundraiserId: string) =>
    api.get(`/fundraisers-supporters/${fundraiserId}/supporters`),
};
