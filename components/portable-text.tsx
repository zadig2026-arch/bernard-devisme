import { PortableText as BasePortableText, type PortableTextComponents } from "next-sanity";

const components: PortableTextComponents = {
  block: {
    h2: ({ children }) => <h2 className="heading-display text-2xl mt-10 mb-3">{children}</h2>,
    h3: ({ children }) => <h3 className="heading-display text-xl mt-8 mb-2">{children}</h3>,
    blockquote: ({ children }) => (
      <blockquote className="my-6 border-l-2 border-[color:var(--color-accent)] pl-4 italic text-[color:var(--color-ink-muted)]">
        {children}
      </blockquote>
    ),
    normal: ({ children }) => <p className="mb-4">{children}</p>,
  },
  marks: {
    link: ({ children, value }) => (
      <a href={value?.href} className="underline underline-offset-4 hover:text-[color:var(--color-accent)]">
        {children}
      </a>
    ),
    em: ({ children }) => <em className="italic">{children}</em>,
    strong: ({ children }) => <strong className="font-medium">{children}</strong>,
  },
};

export function PortableText({ value }: { value: unknown }) {
  if (!value) return null;
  return (
    <div className="prose-art">
      <BasePortableText value={value as never} components={components} />
    </div>
  );
}
