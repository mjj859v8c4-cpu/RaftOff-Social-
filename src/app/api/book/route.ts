import { NextResponse } from "next/server";
import { sendBookingEmail } from "@/lib/email";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { bookingSchema } from "@/lib/validations";

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const limited = rateLimit(`book:${ip}`, 5, 15 * 60 * 1000);

  if (!limited.success) {
    return NextResponse.json(
      {
        ok: false,
        message:
          "Too many requests from this network. Please call us or try again later.",
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(
            Math.max(1, Math.ceil((limited.resetAt - Date.now()) / 1000)),
          ),
        },
      },
    );
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, message: "Invalid request body." },
      { status: 400 },
    );
  }

  const parsed = bookingSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        message: "Please check the form fields and try again.",
        errors: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  // Honeypot triggered — pretend success to avoid tipping off bots.
  if (parsed.data.website) {
    return NextResponse.json({
      ok: true,
      message:
        "Request received. We will contact you to confirm availability.",
    });
  }

  const delivery = await sendBookingEmail(parsed.data);
  if (!delivery.ok) {
    return NextResponse.json(
      {
        ok: false,
        message:
          "We could not deliver your request right now. Please call (248) 928-4118.",
      },
      { status: 502 },
    );
  }

  return NextResponse.json({
    ok: true,
    message:
      "Request received. We will contact you to confirm availability. This request is not a confirmed appointment until we reach out.",
  });
}
