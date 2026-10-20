import { z } from "zod";
import { SERVICE_TYPES, TIME_WINDOWS } from "@/lib/constants";

const phoneRegex = /^[\d\s()+-]{10,20}$/;

export const bookingSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Please enter your full name.")
    .max(100, "Name is too long."),
  phone: z
    .string()
    .trim()
    .regex(phoneRegex, "Enter a valid phone number."),
  email: z.string().trim().email("Enter a valid email address."),
  vehicleYear: z
    .string()
    .trim()
    .regex(/^(19|20)\d{2}$/, "Enter a valid vehicle year."),
  vehicleMake: z
    .string()
    .trim()
    .min(1, "Vehicle make is required.")
    .max(50),
  vehicleModel: z
    .string()
    .trim()
    .min(1, "Vehicle model is required.")
    .max(50),
  vehicleMileage: z
    .string()
    .trim()
    .max(20)
    .optional()
    .or(z.literal("")),
  serviceType: z.enum(SERVICE_TYPES, {
    required_error: "Select a service type.",
  }),
  problemDescription: z
    .string()
    .trim()
    .min(10, "Please describe the issue in a bit more detail.")
    .max(2000, "Description is too long."),
  serviceAddress: z
    .string()
    .trim()
    .min(5, "Enter a service address or ZIP code.")
    .max(200),
  preferredDate: z
    .string()
    .trim()
    .min(1, "Select a preferred date."),
  preferredTime: z.enum(TIME_WINDOWS, {
    required_error: "Select a preferred time window.",
  }),
  consent: z.literal(true, {
    errorMap: () => ({
      message: "Consent is required to submit this request.",
    }),
  }),
  website: z.string().max(0).optional().or(z.literal("")),
});

export type BookingFormValues = z.infer<typeof bookingSchema>;

export const contactSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Please enter your full name.")
    .max(100),
  phone: z
    .string()
    .trim()
    .regex(phoneRegex, "Enter a valid phone number."),
  email: z.string().trim().email("Enter a valid email address."),
  message: z
    .string()
    .trim()
    .min(10, "Please include a short message.")
    .max(2000),
  consent: z.literal(true, {
    errorMap: () => ({
      message: "Consent is required to submit this message.",
    }),
  }),
  website: z.string().max(0).optional().or(z.literal("")),
});

export type ContactFormValues = z.infer<typeof contactSchema>;
