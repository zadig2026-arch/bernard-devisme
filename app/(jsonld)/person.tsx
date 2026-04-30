export function PersonJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: "Bernard Devisme",
    jobTitle: "Peintre, sculpteur, infographiste",
    birthDate: "1947",
    nationality: "FR",
    alumniOf: { "@type": "CollegeOrUniversity", name: "Beaux-Arts de Paris" },
    address: {
      "@type": "PostalAddress",
      postalCode: "17810",
      addressLocality: "Nieul-les-Saintes",
      addressCountry: "FR",
    },
    url: "https://www.devismebernardpeintre.com",
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
