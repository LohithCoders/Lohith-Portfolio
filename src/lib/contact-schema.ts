import {z} from 'zod';
export const contactSchema=z.object({name:z.string().trim().min(2).max(120),email:z.string().trim().email().max(254),subject:z.string().trim().min(3).max(160),message:z.string().trim().min(12).max(5000)});
export type ContactValues=z.infer<typeof contactSchema>;
