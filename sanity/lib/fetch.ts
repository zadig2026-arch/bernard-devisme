import { client } from "./client";
import { projectId } from "@/sanity/env";

export async function sanityFetch<T>(
  query: string,
  params: Record<string, unknown> = {},
  fallback: T,
): Promise<T> {
  if (!projectId || projectId === "placeholder") return fallback;
  try {
    return await client.fetch<T>(query, params, {
      next: { revalidate: 60, tags: ["sanity"] },
    });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[sanityFetch] failed:", (error as Error).message);
    }
    return fallback;
  }
}
