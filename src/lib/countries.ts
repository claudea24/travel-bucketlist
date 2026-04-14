import { Country } from "./types";

const BASE_URL = "https://restcountries.com/v3.1";
const FIELDS = "name,cca3,capital,region,subregion,population,flags,latlng,area,languages,currencies,continents";

export async function getAllCountries(): Promise<Country[]> {
  const res = await fetch(`${BASE_URL}/all?fields=${FIELDS}`);
  if (!res.ok) return [];
  return res.json();
}

export async function searchCountries(query: string): Promise<Country[]> {
  if (!query.trim()) return [];
  const res = await fetch(`${BASE_URL}/name/${encodeURIComponent(query)}?fields=${FIELDS}`);
  if (!res.ok) return [];
  return res.json();
}

export async function getCountryByCode(code: string): Promise<Country | null> {
  const res = await fetch(`${BASE_URL}/alpha/${encodeURIComponent(code)}?fields=${FIELDS}`);
  if (!res.ok) return null;
  const data = await res.json();
  // /alpha/ with fields returns the object directly (not an array)
  return Array.isArray(data) ? data[0] : data;
}

export async function getCountriesByRegion(region: string): Promise<Country[]> {
  const res = await fetch(`${BASE_URL}/region/${encodeURIComponent(region)}?fields=${FIELDS}`);
  if (!res.ok) return [];
  return res.json();
}

export const REGIONS = ["Africa", "Americas", "Asia", "Europe", "Oceania"];
