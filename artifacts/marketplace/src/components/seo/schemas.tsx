const BASE_URL = "https://die-kleine-boerse.de";

export function MarketplaceSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Autobörse",
    alternateName: ["Automarkt", "Fahrzeug-Kleinanzeigen"],
    url: BASE_URL,
    description:
      "Autos, Motorräder und Fahrzeuge kaufen und verkaufen. Dein lokaler Marktplatz für Fahrzeug-Kleinanzeigen in Deutschland.",
    potentialAction: {
      "@type": "SearchAction",
      target: `${BASE_URL}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

interface ListingSchemaProps {
  id: string;
  title: string;
  description?: string | null;
  price: number;
  currency?: string;
  imageUrl?: string | null;
  seller?: string | null;
  location?: string | null;
  condition?: string;
  url?: string;
}

export function ListingSchema({
  id,
  title,
  description,
  price,
  currency = "EUR",
  imageUrl,
  seller,
  location,
  condition = "UsedCondition",
  url,
}: ListingSchemaProps) {
  const listingUrl = url || `${BASE_URL}/listings/${id}`;

  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: title,
    description: description || title,
    url: listingUrl,
    offers: {
      "@type": "Offer",
      price: price.toFixed(2),
      priceCurrency: currency,
      availability: "https://schema.org/InStock",
      url: listingUrl,
      itemCondition: `https://schema.org/${condition}`,
    },
  };

  if (imageUrl) schema.image = imageUrl;
  if (seller) {
    schema.brand = { "@type": "Brand", name: seller };
  }
  if (location) {
    schema.offers = {
      ...(schema.offers as object),
      seller: {
        "@type": "LocalBusiness",
        name: seller || "CURATED. Seller",
        address: { "@type": "PostalAddress", addressLocality: location },
      },
    };
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function BreadcrumbSchema({
  items,
}: {
  items: { name: string; url: string }[];
}) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${BASE_URL}${item.url}`,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
