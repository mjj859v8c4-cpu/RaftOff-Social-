import { Resend } from "resend";
import type { BookingFormValues, ContactFormValues } from "@/lib/validations";
import { BUSINESS } from "@/lib/constants";

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new Resend(apiKey);
}

function getInbox() {
  return process.env.BOOKING_INBOX_EMAIL || process.env.CONTACT_INBOX_EMAIL;
}

function getFromAddress() {
  return (
    process.env.EMAIL_FROM ||
    "Rochester Mobile Auto Repair <onboarding@resend.dev>"
  );
}

export type EmailDeliveryResult =
  | { ok: true; id?: string; mode: "resend" | "dev-log" }
  | { ok: false; error: string };

export async function sendBookingEmail(
  data: BookingFormValues,
): Promise<EmailDeliveryResult> {
  const inbox = getInbox();
  const subject = `New service request — ${data.fullName} (${data.serviceType})`;
  const text = [
    "New appointment request from the website:",
    "",
    `Name: ${data.fullName}`,
    `Phone: ${data.phone}`,
    `Email: ${data.email}`,
    `Vehicle: ${data.vehicleYear} ${data.vehicleMake} ${data.vehicleModel}`,
    `Mileage: ${data.vehicleMileage || "Not provided"}`,
    `Service: ${data.serviceType}`,
    `Preferred date: ${data.preferredDate}`,
    `Preferred time: ${data.preferredTime}`,
    `Service address / ZIP: ${data.serviceAddress}`,
    "",
    "Problem description:",
    data.problemDescription,
    "",
    "Note: This is a request only. Confirm availability with the customer before scheduling.",
  ].join("\n");

  return deliverEmail({ subject, text, replyTo: data.email, inbox });
}

export async function sendContactEmail(
  data: ContactFormValues,
): Promise<EmailDeliveryResult> {
  const inbox = getInbox();
  const subject = `Website contact — ${data.fullName}`;
  const text = [
    "New contact message from the website:",
    "",
    `Name: ${data.fullName}`,
    `Phone: ${data.phone}`,
    `Email: ${data.email}`,
    "",
    "Message:",
    data.message,
    "",
    `Business phone for reference: ${BUSINESS.phoneDisplay}`,
  ].join("\n");

  return deliverEmail({ subject, text, replyTo: data.email, inbox });
}

async function deliverEmail({
  subject,
  text,
  replyTo,
  inbox,
}: {
  subject: string;
  text: string;
  replyTo: string;
  inbox: string | undefined;
}): Promise<EmailDeliveryResult> {
  const resend = getResendClient();

  // Development fallback: allow local testing without Resend credentials.
  if (!resend || !inbox) {
    if (process.env.NODE_ENV === "production" && process.env.ALLOW_DEV_EMAIL_FALLBACK !== "true") {
      return {
        ok: false,
        error:
          "Email delivery is not configured. Set RESEND_API_KEY and BOOKING_INBOX_EMAIL.",
      };
    }

    console.info("[email:dev-log]", { subject, replyTo, text });
    return { ok: true, mode: "dev-log" };
  }

  try {
    const result = await resend.emails.send({
      from: getFromAddress(),
      to: [inbox],
      replyTo,
      subject,
      text,
    });

    if (result.error) {
      return { ok: false, error: result.error.message };
    }

    return { ok: true, id: result.data?.id, mode: "resend" };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown email delivery error";
    return { ok: false, error: message };
  }
}
