"use client";

import { useState, useTransition } from "react";
import { sendContact } from "./actions";

export function ContactForm() {
  const [pending, startTransition] = useTransition();
  const [state, setState] = useState<{ ok?: boolean; error?: string } | null>(null);

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        startTransition(async () => {
          const result = await sendContact(formData);
          setState(result);
          if (result.ok) e.currentTarget.reset();
        });
      }}
    >
      <Field label="Nom" name="name" required />
      <Field label="Email" name="email" type="email" required />
      <Field label="Sujet" name="subject" />
      <div className="grid gap-2">
        <label className="text-sm" htmlFor="message">Message</label>
        <textarea
          id="message"
          name="message"
          required
          rows={6}
          className="border border-[color:var(--color-rule)] bg-transparent p-3 text-sm focus:border-[color:var(--color-ink)] focus:outline-none"
        />
      </div>
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      <button
        type="submit"
        disabled={pending}
        className="border border-[color:var(--color-ink)] px-6 py-3 text-sm hover:bg-[color:var(--color-ink)] hover:text-[color:var(--color-paper)] disabled:opacity-50"
      >
        {pending ? "Envoi…" : "Envoyer"}
      </button>
      {state?.ok && (
        <p className="text-sm text-[color:var(--color-accent)]">
          Message reçu. Nous vous répondons dans les meilleurs délais.
        </p>
      )}
      {state?.error && (
        <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>
      )}
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div className="grid gap-2">
      <label className="text-sm" htmlFor={name}>
        {label}
        {required && <span aria-hidden> *</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        className="border border-[color:var(--color-rule)] bg-transparent p-3 text-sm focus:border-[color:var(--color-ink)] focus:outline-none"
      />
    </div>
  );
}
