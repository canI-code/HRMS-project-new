const defaultApiUrl = "http://localhost:3000";
const defaultAppUrl = "http://localhost:3001";
const defaultApiVersion = "v1";

const normalizeUrl = (value: string) => value.replace(/\/$/, "");

export const env = {
  apiUrl: normalizeUrl(process.env.NEXT_PUBLIC_API_URL || defaultApiUrl),
  apiVersion: process.env.NEXT_PUBLIC_API_VERSION || defaultApiVersion,
  appName: process.env.NEXT_PUBLIC_APP_NAME || "Own HRMS",
  appUrl: normalizeUrl(process.env.NEXT_PUBLIC_APP_URL || defaultAppUrl),
};

export const apiBaseUrl = `${env.apiUrl}/api/${env.apiVersion}`;
