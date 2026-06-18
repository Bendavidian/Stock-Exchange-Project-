export const API_KEY = "SUxxyaC5TEKgSYc2nRrYfgofnBk3mkLt";
export const BASE_URL = "https://financialmodelingprep.com/stable";
// Set to true while developing to avoid using API quota.
export const USE_MOCK_DATA = true;

export function isApiKeyConfigured() {
  return (
    typeof API_KEY === "string" &&
    API_KEY.trim().length > 0
  );
}
