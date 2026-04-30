import { groq } from "next-sanity";

export const homeQuery = groq`{
  "settings": *[_type == "siteSettings"][0]{ intro, agentInfo },
  "featuredArtworks": *[_type == "artwork" && featured == true]|order(year desc)[0...6]{
    _id, title, "slug": slug.current, year, medium, dimensions, images
  },
  "series": *[_type == "series"]|order(period desc)[0...3]{
    _id, title, "slug": slug.current, period, statement, coverArtwork->{ images, title }
  },
  "latestJournal": *[_type == "journalEntry"]|order(date desc)[0...3]{
    _id, title, "slug": slug.current, date, excerpt, images[0]
  }
}`;

export const allArtworksQuery = groq`*[_type == "artwork"]|order(year desc, _createdAt desc){
  _id, title, "slug": slug.current, year, medium, dimensions,
  "series": series->{title, "slug": slug.current},
  status, images
}`;

export const artworkBySlugQuery = groq`*[_type == "artwork" && slug.current == $slug][0]{
  _id, title, year, medium, dimensions, status, description, inventoryNumber, images,
  "series": series->{title, "slug": slug.current},
  "exhibitions": *[_type == "exhibition" && references(^._id)]|order(startDate desc){
    title, "slug": slug.current, venue, city, startDate, endDate
  },
  "related": *[_type == "artwork" && series._ref == ^.series._ref && _id != ^._id]|order(year desc)[0...4]{
    _id, title, "slug": slug.current, year, images
  }
}`;

export const allSeriesQuery = groq`*[_type == "series"]|order(period desc){
  _id, title, "slug": slug.current, period, statement,
  "count": count(*[_type == "artwork" && references(^._id)]),
  coverArtwork->{ images, title }
}`;

export const seriesBySlugQuery = groq`*[_type == "series" && slug.current == $slug][0]{
  _id, title, period, statement,
  "artworks": *[_type == "artwork" && references(^._id)]|order(year desc){
    _id, title, "slug": slug.current, year, medium, dimensions, images
  }
}`;

export const allExhibitionsQuery = groq`*[_type == "exhibition"]|order(startDate desc){
  _id, title, "slug": slug.current, venue, city, startDate, endDate, type, coverImage
}`;

export const exhibitionBySlugQuery = groq`*[_type == "exhibition" && slug.current == $slug][0]{
  _id, title, venue, city, startDate, endDate, type, description, coverImage, gallery,
  "artworks": artworks[]->{ _id, title, "slug": slug.current, year, images },
  "press": press[]->{ _id, author, title, publication, date, excerpt }
}`;

export const allJournalQuery = groq`*[_type == "journalEntry"]|order(date desc){
  _id, title, "slug": slug.current, date, excerpt, images[0]
}`;

export const journalBySlugQuery = groq`*[_type == "journalEntry" && slug.current == $slug][0]{
  _id, title, date, body, images,
  "relatedArtworks": relatedArtworks[]->{ _id, title, "slug": slug.current, images }
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
