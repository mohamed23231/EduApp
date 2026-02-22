import type { AxiosError } from "axios";
import type { TFunction } from "i18next";
import type { ApiErrorEnvelope } from "@/shared/types/api";

export function isAxiosError(error: unknown): error is AxiosError {
  return (error as AxiosError)?.isAxiosError === true;
}

export function extractErrorMessage(
  error: unknown,
  t: TFunction,
  fallbackKey = "parent.common.genericError",
): string {
  if (!isAxiosError(error)) {
    return t(fallbackKey);
  }

  const backendMessage = (error.response?.data as ApiErrorEnvelope)?.message;
  if (backendMessage && backendMessage.trim().length > 0) {
    return backendMessage;
  }

  if (!error.response) {
    return t("parent.common.offlineError");
  }

  return t(fallbackKey);
}
