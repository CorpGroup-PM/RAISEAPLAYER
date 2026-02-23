import { api } from "@/lib/api-client";

export const FundraiserService = {
  createFundraiser(payload: any) {
    return api.post("/fundraiser/create", payload);
  },

  getMyCampaigns() {
    return api.get("/fundraiser/me/campaigns");
  },

  getCampaignById(id: string) {
    return api.get(`/fundraiser/${id}`);
  },
  uploadCoverImage(id: string, file: File) {
    const formData = new FormData();
    formData.append("file", file);

    return api.put(`/fundraiser/${id}/cover-image`, formData);
  },


  uploadPlayerMedia(id: string, files: File[]) {
    const formData = new FormData();

    files.forEach((file) => {
      formData.append("players", file); // 👈 MUST be "players"
    });

    return api.post(`/fundraiser/${id}/media/player`, formData);
  },


  addYoutubeMedia(id: string, youtubeUrls: string[]) {
    return api.post(`/fundraiser/${id}/media/youtube`, {
      youtubeUrl: youtubeUrls,
    });
  },

deletePlayerMedia(id: string, playerImage: string) {
  return api.delete(`/fundraiser/${id}/media/player`, {
    data: {
      playerImage, 
    },
  });
},

deleteYoutubeMedia(id: string, youTubeUrl: string) {
  return api.delete(`/fundraiser/${id}/media/youtube`, {
    data: {
      youTubeUrl, 
    },
  });
},

addCampaignUpdate(
  fundraiserId: string,
  payload: { title: string; content: string }
) {
  return api.post(
    `/fundraiser/${fundraiserId}/updates`,
    payload
  );
},

 getPublicFundraisers(params?: { page?: number; limit?: number }) {
    return api.get("/fundraiser/fundraisers/user", { params });
  },

   getpublicCampaignById(id: string) {
    return api.get(`/fundraiser/${id}/public`);
  },
  
   fundRaisedTopSix() {
    return api.get("/fundraiser/fundraisedtopsix");
  },

  publicReviews() {
  return api.get("/fundraiser/review/publics");
}


};


