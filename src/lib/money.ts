// All amounts are stored as strings by Prisma's Decimal; round to 2dp when computing.
export const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
export const money = (n: number) => round2(n).toFixed(2);
