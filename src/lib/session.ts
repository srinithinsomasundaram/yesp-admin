"use client";

import { getStoredTokens, getMfaPendingUser, setMfaPendingUser, clearMfaPendingUser } from "./api";

export { getMfaPendingUser, setMfaPendingUser, clearMfaPendingUser };

export function isAuthenticated(): boolean {
  return getStoredTokens() !== null;
}
