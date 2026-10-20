"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  contactSchema,
  type ContactFormValues,
} from "@/lib/validations";

type Status = "idle" | "submitting" | "success" | "error";

export function ContactForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [serverMessage, setServerMessage] = useState("");

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      fullName: "",
      phone: "",
      email: "",
      message: "",
      consent: false,
      website: "",
    },
  });

  const onSubmit = async (values: ContactFormValues) => {
    setStatus("submitting");
    setServerMessage("");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const payload = (await response.json()) as {
        ok?: boolean;
        message?: string;
      };

      if (!response.ok || !payload.ok) {
        setStatus("error");
        setServerMessage(
          payload.message ||
            "We could not send your message. Please call us or try again.",
        );
        return;
      }

      setStatus("success");
      setServerMessage(payload.message || "Message sent. We will follow up soon.");
      reset();
    } catch {
      setStatus("error");
      setServerMessage(
        "Network error. Please call us directly or try again in a moment.",
      );
    }
  };

  if (status === "success") {
    return (
      <div
        className="border border-[var(--neon)]/40 bg-[var(--dark-green)]/30 p-8"
        role="status"
        aria-live="polite"
      >
        <h3 className="font-[family-name:var(--font-display)] text-2xl uppercase tracking-[0.08em] text-white">
          Message sent
        </h3>
        <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
          {serverMessage}
        </p>
        <Button
          type="button"
          variant="secondary"
          className="mt-6"
          onClick={() => {
            setStatus("idle");
            setServerMessage("");
          }}
        >
          Send another message
        </Button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="relative space-y-5"
      noValidate
    >
      <div>
        <Label htmlFor="contact-fullName" className="mb-2 block">
          Full name
        </Label>
        <Input
          id="contact-fullName"
          {...register("fullName")}
          aria-invalid={!!errors.fullName}
        />
        {errors.fullName && (
          <p className="mt-1.5 text-sm text-red-400">{errors.fullName.message}</p>
        )}
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="contact-phone" className="mb-2 block">
            Phone
          </Label>
          <Input
            id="contact-phone"
            type="tel"
            {...register("phone")}
            aria-invalid={!!errors.phone}
          />
          {errors.phone && (
            <p className="mt-1.5 text-sm text-red-400">{errors.phone.message}</p>
          )}
        </div>
        <div>
          <Label htmlFor="contact-email" className="mb-2 block">
            Email
          </Label>
          <Input
            id="contact-email"
            type="email"
            {...register("email")}
            aria-invalid={!!errors.email}
          />
          {errors.email && (
            <p className="mt-1.5 text-sm text-red-400">{errors.email.message}</p>
          )}
        </div>
      </div>
      <div>
        <Label htmlFor="contact-message" className="mb-2 block">
          Message
        </Label>
        <Textarea
          id="contact-message"
          rows={5}
          {...register("message")}
          aria-invalid={!!errors.message}
        />
        {errors.message && (
          <p className="mt-1.5 text-sm text-red-400">{errors.message.message}</p>
        )}
      </div>

      <div className="absolute left-[-10000px] top-auto h-px w-px overflow-hidden" aria-hidden>
        <Label htmlFor="contact-website">Website</Label>
        <Input
          id="contact-website"
          tabIndex={-1}
          autoComplete="off"
          {...register("website")}
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-start gap-3">
          <Controller
            control={control}
            name="consent"
            render={({ field }) => (
              <Checkbox
                id="contact-consent"
                checked={field.value}
                onCheckedChange={(checked) =>
                  field.onChange(checked === true)
                }
              />
            )}
          />
          <Label htmlFor="contact-consent" className="leading-relaxed">
            I agree to be contacted about this message.
          </Label>
        </div>
        {errors.consent && (
          <p className="text-sm text-red-400">{errors.consent.message}</p>
        )}
      </div>

      {status === "error" && (
        <p className="text-sm text-red-400" role="alert">
          {serverMessage}
        </p>
      )}

      <Button type="submit" size="lg" disabled={status === "submitting"}>
        {status === "submitting" ? (
          <>
            <Loader2 className="animate-spin" />
            Sending…
          </>
        ) : (
          "Send Message"
        )}
      </Button>
    </form>
  );
}
