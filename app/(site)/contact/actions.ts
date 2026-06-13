"use server";

type Result = { ok: boolean; error?: string };

export async function sendContact(formData: FormData): Promise<Result> {
  const honeypot = formData.get("website");
  if (honeypot) return { ok: true };

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const subject = String(formData.get("subject") ?? "").trim() || "Contact via le site";
  const message = String(formData.get("message") ?? "").trim();

  if (!name || !email || !message) {
    return { ok: false, error: "Merci de remplir les champs requis." };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: "Email invalide." };
  }

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO_EMAIL;

  if (!apiKey || !to) {
    console.warn("[contact] Resend not configured — message:", { name, email, subject, message });
    return { ok: true };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      from: "Site Bernard Devisme <noreply@devismebernardpeintre.com>",
      to: [to],
      reply_to: email,
      subject: `[Site] ${subject}`,
      text: `De : ${name} <${email}>\n\n${message}`,
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    console.error("[contact] Resend error:", detail);
    return { ok: false, error: "Le serveur n'a pas pu envoyer le message. Réessayez plus tard." };
  }

  return { ok: true };
}
