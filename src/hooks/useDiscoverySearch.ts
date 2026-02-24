import { useState, useRef, useEffect, useCallback } from "react";
import { useLazySearchQuery } from "../services/searchApi";
import type {
  ProductResult,
  CategoryResult,
  BannerResult,
} from "../services/searchApi";

const DEBOUNCE_MS = 400;

export type SectionKey = "products" | "categories" | "banners";

function maxScore(arr: { score: number }[]): number {
  return arr.length ? Math.max(...arr.map((r) => r.score)) : -1;
}

export function useDiscoverySearch() {
  const [query, setQuery] = useState("");
  const [dismissed, setDismissed] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const [triggerSearch, { data, isFetching, isError, isUninitialized }] =
    useLazySearchQuery();

  // Debounced search — only triggers the API, no setState
  useEffect(() => {
    const q = query.trim();
    if (!q) return;
    const timer = setTimeout(() => {
      triggerSearch({ q });
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query, triggerSearch]);

  // Close dropdown on outside click
  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
      setDismissed(true);
    }
  }, []);

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [handleClickOutside]);

  const handleQueryChange = (val: string) => {
    setQuery(val);
    setDismissed(false);
  };

  const products = (data?.filter((r) => r.type === "product") ??
    []) as ProductResult[];
  const categories = (data?.filter((r) => r.type === "category") ??
    []) as CategoryResult[];
  const banners = (data?.filter((r) => r.type === "banner") ??
    []) as BannerResult[];
  const hasResults =
    products.length > 0 || categories.length > 0 || banners.length > 0;

  const scores: Record<SectionKey, number> = {
    products: maxScore(products),
    categories: maxScore(categories),
    banners: maxScore(banners),
  };
  const sectionOrder: SectionKey[] = (
    ["products", "categories", "banners"] as SectionKey[]
  )
    .slice()
    .sort((a, b) => scores[b] - scores[a]);

  const showDropdown = !dismissed && query.trim().length > 0;

  return {
    query,
    handleQueryChange,
    wrapperRef,
    showDropdown,
    setDismissed,
    products,
    categories,
    banners,
    hasResults,
    sectionOrder,
    isFetching,
    isError,
    isUninitialized,
  };
}
