import { z } from "zod";

export const filterSchema = z.object({
  clientNumber: z
    .string()
    .optional()
    .refine((val) => !val || /^\d+$/.test(val), {
      message: "O número do cliente deve conter apenas dígitos",
    }),
  startDate: z
    .string()
    .optional()
    .refine((val) => !val || /^\d{4}-\d{2}$/.test(val), {
      message: "Data inicial inválida",
    }),
  endDate: z
    .string()
    .optional()
    .refine((val) => !val || /^\d{4}-\d{2}$/.test(val), {
      message: "Data final inválida",
    }),
}).refine((data) => {
  if (data.startDate && data.endDate) {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    return start <= end;
  }
  return true;
}, {
  message: "Data final não pode ser menor que a data inicial",
  path: ["endDate"],
});

export type FilterFormData = z.infer<typeof filterSchema>;
