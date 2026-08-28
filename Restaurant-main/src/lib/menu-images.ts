type OpenverseImage = {
  thumbnail?: string;
  url?: string;
};

type OpenverseResponse = {
  results?: OpenverseImage[];
};

const imageCache = new Map<string, Promise<string>>();

function hasAny(text: string, terms: string[]) {
  return terms.some((term) => text.includes(term));
}

export function getMenuImageQuery({
  name,
  description,
  category,
}: {
  name: string;
  description: string;
  category: string;
}) {
  const searchableText = `${name} ${description}`.toLowerCase();

  if (hasAny(searchableText, ["pizza", "piza", "piz"])) return "pizza";
  if (hasAny(searchableText, ["cookie", "dessert", "sweet"])) {
    return "chocolate chip cookie";
  }
  if (hasAny(searchableText, ["coke", "cola", "soda", "fountain", "drink"])) {
    return "cola soft drink";
  }
  if (hasAny(searchableText, ["salad", "veggie", "vegetable"])) {
    return hasAny(searchableText, ["ham"]) ? "ham salad" : "fresh salad";
  }
  if (hasAny(searchableText, ["b.m.t", "bmt", "italian"])) {
    return "italian sub sandwich";
  }
  if (hasAny(searchableText, ["chicken"])) return "chicken sandwich";
  if (hasAny(searchableText, ["turkey"])) return "turkey sandwich";
  if (hasAny(searchableText, ["steak", "beef", "philly"])) {
    return "steak sandwich";
  }
  if (hasAny(searchableText, ["ham"])) return "ham sandwich";
  if (category === "sandwiches") return "sub sandwich";
  if (category === "pizza") return "pizza";
  if (category === "drinks") return "cola soft drink";
  if (category === "desserts") return "dessert";
  return "restaurant food";
}

async function requestOpenverseImage(query: string) {
  const endpoint = new URL("https://api.openverse.org/v1/images/");
  endpoint.searchParams.set("q", query);
  endpoint.searchParams.set("page_size", "1");
  endpoint.searchParams.set("mature", "false");

  try {
    const response = await fetch(endpoint);
    if (!response.ok) return "";

    const data = (await response.json()) as OpenverseResponse;
    return data.results?.[0]?.thumbnail || data.results?.[0]?.url || "";
  } catch {
    return "";
  }
}

export function fetchMenuImage({
  name,
  description,
  category,
  imageSearchText,
}: {
  name: string;
  description: string;
  category: string;
  imageSearchText?: string;
}) {
  const query = getMenuImageQuery({
    name: imageSearchText || name,
    description,
    category,
  });
  const cachedRequest = imageCache.get(query);
  if (cachedRequest) return cachedRequest;

  const request = requestOpenverseImage(query);
  imageCache.set(query, request);
  return request;
}
