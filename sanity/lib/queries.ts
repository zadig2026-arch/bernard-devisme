import { groq } from "next-sanity";

export const homeQuery = groq`{
  "settings": *[_type == "siteSettings"][0]{ intro, agentInfo },
  "featuredArtworks": *[_type == "artwork" && featured == true]|order(year desc)[0...6]{
    _id, title, "slug": slug.current, year, medium, dimensions, "images": images[defined(asset)]
  },
  "series": *[_type == "series"]|order(period desc)[0...3]{
    _id, title, "slug": slug.current, period, statement, coverArtwork->{ "images": images[defined(asset)], title }
  },
  "latestJournal": *[_type == "journalEntry"]|order(date desc)[0...3]{
    _id, title, "slug": slug.current, date, excerpt, "images": images[defined(asset)][0]
  }
}`;

export const allArtworksQuery = groq`*[_type == "artwork"]|order(year desc, _createdAt desc){
  _id, title, "slug": slug.current, year, medium, dimensions, saleStatus,
  "series": series->{title, "slug": slug.current},
  "images": images[defined(asset)]
}`;

export const artworkBySlugQuery = groq`*[_type == "artwork" && slug.current == $slug][0]{
  _id, title, year, medium, dimensions, description, "images": images[defined(asset)], saleStatus,
  "audioUrl": audio.asset->url,
  "videoUrl": video.asset->url,
  "series": series->{title, "slug": slug.current},
  "exhibitions": *[_type == "exhibition" && references(^._id)]|order(startDate desc){
    title, "slug": slug.current, venue, city, startDate, endDate
  },
  "related": *[_type == "artwork" && series._ref == ^.series._ref && _id != ^._id]|order(year desc)[0...4]{
    _id, title, "slug": slug.current, year, "images": images[defined(asset)]
  }
}`;

export const allSeriesQuery = groq`*[_type == "series"]|order(period desc){
  _id, title, "slug": slug.current, period, statement,
  "count": count(*[_type == "artwork" && references(^._id)]),
  coverArtwork->{ "images": images[defined(asset)], title }
}`;

export const seriesBySlugQuery = groq`*[_type == "series" && slug.current == $slug][0]{
  _id, title, period, statement,
  subseries[]{_key, title, text},
  "artworks": *[_type == "artwork" && references(^._id)]|order(year desc){
    _id, title, "slug": slug.current, year, medium, dimensions, saleStatus, "images": images[defined(asset)],
    subseries,
    "audioUrl": audio.asset->url,
    "videoUrl": video.asset->url
  }
}`;

export const allExhibitionsQuery = groq`*[_type == "exhibition"]|order(startDate desc){
  _id, title, "slug": slug.current, venue, city, startDate, endDate, type,
  "coverImage": select(defined(coverImage.asset) => coverImage, null)
}`;

export const exhibitionBySlugQuery = groq`*[_type == "exhibition" && slug.current == $slug][0]{
  _id, title, venue, city, startDate, endDate, type, description,
  "coverImage": select(defined(coverImage.asset) => coverImage, null), "gallery": gallery[defined(asset)],
  "artworks": artworks[]->{ _id, title, "slug": slug.current, year, "images": images[defined(asset)] },
  "press": press[]->{ _id, author, title, publication, date, excerpt }
}`;

export const allJournalQuery = groq`*[_type == "journalEntry"]|order(date desc){
  _id, title, "slug": slug.current, date, excerpt, "images": images[defined(asset)][0]
}`;

export const journalBySlugQuery = groq`*[_type == "journalEntry" && slug.current == $slug][0]{
  _id, title, date, body, "images": images[defined(asset)],
  "relatedArtworks": relatedArtworks[]->{ _id, title, "slug": slug.current, "images": images[defined(asset)] }
}`;

export const pageBySlugQuery = groq`*[_type == "page" && slug.current == $slug][0]{
  title, body
}`;

export const settingsQuery = groq`*[_type == "siteSettings"][0]{
  intro, contactEmail, agentInfo, socialLinks
}`;

export const allArtworkSlugsQuery = groq`*[_type == "artwork" && defined(slug.current)][].slug.current`;
export const allSeriesSlugsQuery = groq`*[_type == "series" && defined(slug.current)][].slug.current`;
export const allExhibitionSlugsQuery = groq`*[_type == "exhibition" && defined(slug.current)][].slug.current`;
export const allJournalSlugsQuery = groq`*[_type == "journalEntry" && defined(slug.current)][].slug.current`;
