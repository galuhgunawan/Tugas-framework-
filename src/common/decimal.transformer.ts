import { ValueTransformer } from 'typeorm';

/** PostgreSQL mengembalikan DECIMAL sebagai string; ubah menjadi number di aplikasi. */
export const DecimalTransformer: ValueTransformer = {
  to: (value?: number | null) => value,
  from: (value?: string | null) =>
    value === null || value === undefined ? value : parseFloat(value),
};

/** Pembulatan 2 digit agar aman dari error floating-point. */
export const round2 = (n: number): number => Math.round(n * 100) / 100;
