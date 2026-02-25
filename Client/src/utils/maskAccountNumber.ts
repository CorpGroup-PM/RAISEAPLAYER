export const maskAccountNumber = (accountNumber?: string) => {
  if (!accountNumber) return "";
  return "******" + accountNumber.slice(-4);
};
