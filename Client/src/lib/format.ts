export const n = (v: any) => {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
};

export const num = (v: any) => {
  const x = n(v);
  return x.toLocaleString("en-IN");
};

export const inr = (v: any) => {
  const x = n(v);
  return x.toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  });
};

// ✅ add this
export const pct = (v: any, digits = 0) => {
  const x = n(v);
  return `${x.toFixed(digits)}%`;
};
