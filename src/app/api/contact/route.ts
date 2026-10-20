import { NextResponse } from "next/server";
import { sendContactEmail } from "@/lib/email";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { contactSchema } from "@/lib/validations";

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const limited = rateLimit(`contact:${ip}`, 5, 15 * 60 * 1000);

  if (!limited.success) {
    return NextResponse.json(
      {
        ok: false,
        message:
          "Too many messages from this network. Please call us or try again later.",
      },
      { status: 429 },
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

  const parsed = contactSchema.safeParse(json);
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

  if (parsed.data.website) {
    return NextResponse.json({
      ok: true,
      message: "Message received. We will follow up soon.",
    });
  }

  const delivery = await sendContactEmail(parsed.data);
  if (!delivery.ok) {
    return NextResponse.json(
      {
        ok: false,
        message:
          "We could not send your message right now. Please call (248) 928-4118.",
      },
      { status: 502 },
    );
  }

  return NextResponse.json({
    ok: true,
    message: "Message received. We will follow up soon.",
  });
}
