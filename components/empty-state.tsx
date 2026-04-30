export function EmptyState({ title, body }: { title: string; body?: string }) {
  return (
    <div className="border border-dashed border-[color:var(--color-rule)] p-10 text-center">
      <p className="heading-display text-2xl">{title}</p>
      {body && <p className="mt-2 text-sm text-[color:var(--color-ink-muted)]">{body}</p>}
    </div>
  );
}
