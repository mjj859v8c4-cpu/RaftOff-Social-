"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { SERVICE_TYPES, TIME_WINDOWS } from "@/lib/constants";
import {
  bookingSchema,
  type BookingFormValues,
} from "@/lib/validations";

type Status = "idle" | "submitting" | "success" | "error";

export function BookingForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [serverMessage, setServerMessage] = useState("");

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      fullName: "",
      phone: "",
      email: "",
      vehicleYear: "",
      vehicleMake: "",
      vehicleModel: "",
      vehicleMileage: "",
      serviceType: undefined,
      problemDescription: "",
      serviceAddress: "",
      preferredDate: "",
      preferredTime: undefined,
      consent: undefined,
      website: "",
    },
  });

  const onSubmit = async (values: BookingFormValues) => {
    setStatus("submitting");
    setServerMessage("");

    try {
      const response = await fetch("/api/book", {
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
            "We could not submit your request. Please call us or try again.",
        );
        return;
      }

      setStatus("success");
      setServerMessage(
        payload.message ||
          "Request received. We will contact you to confirm availability.",
      );
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
          Request received
        </h3>
        <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
          {serverMessage}
        </p>
        <p className="mt-4 text-sm text-[var(--muted)]">
          Appointment requests are not confirmed until Rochester Mobile Auto
          Repair contacts you to verify scheduling and availability.
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
          Submit another request
        </Button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-6"
      noValidate
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Full name" error={errors.fullName?.message}>
          <Input
            autoComplete="name"
            {...register("fullName")}
            aria-invalid={!!errors.fullName}
          />
        </Field>
        <Field label="Phone number" error={errors.phone?.message}>
          <Input
            type="tel"
            autoComplete="tel"
            placeholder="(248) 555-0100"
            {...register("phone")}
            aria-invalid={!!errors.phone}
          />
        </Field>
        <Field label="Email" error={errors.email?.message} className="sm:col-span-2">
          <Input
            type="email"
            autoComplete="email"
            {...register("email")}
            aria-invalid={!!errors.email}
          />
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <Field label="Vehicle year" error={errors.vehicleYear?.message}>
          <Input
            inputMode="numeric"
            placeholder="2018"
            {...register("vehicleYear")}
            aria-invalid={!!errors.vehicleYear}
          />
        </Field>
        <Field label="Vehicle make" error={errors.vehicleMake?.message}>
          <Input
            placeholder="Toyota"
            {...register("vehicleMake")}
            aria-invalid={!!errors.vehicleMake}
          />
        </Field>
        <Field label="Vehicle model" error={errors.vehicleModel?.message}>
          <Input
            placeholder="Camry"
            {...register("vehicleModel")}
            aria-invalid={!!errors.vehicleModel}
          />
        </Field>
      </div>

      <Field
        label="Vehicle mileage (optional)"
        error={errors.vehicleMileage?.message}
      >
        <Input
          inputMode="numeric"
          placeholder="85,000"
          {...register("vehicleMileage")}
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Type of service" error={errors.serviceType?.message}>
          <Controller
            control={control}
            name="serviceType"
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger aria-invalid={!!errors.serviceType}>
                  <SelectValue placeholder="Select a service" />
                </SelectTrigger>
                <SelectContent>
                  {SERVICE_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </Field>
        <Field
          label="Service address or ZIP code"
          error={errors.serviceAddress?.message}
        >
          <Input
            autoComplete="street-address"
            placeholder="Rochester Hills, MI 48309"
            {...register("serviceAddress")}
            aria-invalid={!!errors.serviceAddress}
          />
        </Field>
      </div>

      <Field
        label="Description of problem"
        error={errors.problemDescription?.message}
      >
        <Textarea
          rows={5}
          placeholder="Describe the symptoms, warning lights, or maintenance you need."
          {...register("problemDescription")}
          aria-invalid={!!errors.problemDescription}
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Preferred date" error={errors.preferredDate?.message}>
          <Input
            type="date"
            {...register("preferredDate")}
            aria-invalid={!!errors.preferredDate}
          />
        </Field>
        <Field
          label="Preferred time window"
          error={errors.preferredTime?.message}
        >
          <Controller
            control={control}
            name="preferredTime"
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger aria-invalid={!!errors.preferredTime}>
                  <SelectValue placeholder="Select a time window" />
                </SelectTrigger>
                <SelectContent>
                  {TIME_WINDOWS.map((window) => (
                    <SelectItem key={window} value={window}>
                      {window}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </Field>
      </div>

      {/* Honeypot spam protection — hidden from users */}
      <div className="absolute left-[-10000px] top-auto h-px w-px overflow-hidden" aria-hidden>
        <Label htmlFor="website">Website</Label>
        <Input
          id="website"
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
                checked={field.value === true}
                onCheckedChange={(checked) =>
                  field.onChange(checked === true ? true : undefined)
                }
                id="consent"
                aria-invalid={!!errors.consent}
              />
            )}
          />
          <Label htmlFor="consent" className="leading-relaxed">
            I agree to be contacted by Rochester Mobile Auto Repair about this
            service request by phone, text, or email.
          </Label>
        </div>
        {errors.consent && (
          <p className="text-sm text-red-400">{errors.consent.message}</p>
        )}
      </div>

      <p className="text-xs leading-relaxed text-[var(--muted)]">
        Submitting this form requests an appointment. It does not confirm a
        booking until we contact you to verify availability.
      </p>

      {status === "error" && (
        <p className="text-sm text-red-400" role="alert">
          {serverMessage}
        </p>
      )}

      <Button type="submit" size="lg" disabled={status === "submitting"}>
        {status === "submitting" ? (
          <>
            <Loader2 className="animate-spin" />
            Submitting…
          </>
        ) : (
          "Submit Request"
        )}
      </Button>
    </form>
  );
}

function Field({
  label,
  error,
  children,
  className,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <Label className="mb-2 block">{label}</Label>
      {children}
      {error && <p className="mt-1.5 text-sm text-red-400">{error}</p>}
    </div>
  );
}
