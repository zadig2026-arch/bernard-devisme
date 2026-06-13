import { SeriesIndex } from "@/components/series-index";

export const metadata = { title: "Œuvres" };

export default async function OeuvresPage() {
  return (
    <div className="container-page py-16 md:py-20">
      <header>
        <h1 className="heading-display text-3xl md:text-5xl">Œuvres</h1>
      </header>
      <div className="mt-12">
        <SeriesIndex />
      </div>
    </div>
  );
}
