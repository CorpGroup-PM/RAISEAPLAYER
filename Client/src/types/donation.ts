export type Donor = {
  id: string | null;
  firstName: string;
  lastName?: string;
};

export type Donation = {
  id: string;
  donationAmount: number;
  createdAt: string;

  isAnonymous: boolean;

  guestName?: string | null;

  donatedAt: string;
  donor?: {
    id: string | null;
    firstName: string;
    lastName: string;
  } | null;
};
