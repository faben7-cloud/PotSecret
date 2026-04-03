type SanitizeTextOptions = {
  maxLength: number;
  preserveNewlines?: boolean;
};

function clampText(value: string, maxLength: number) {
  return value.length > maxLength ? value.slice(0, maxLength) : value;
}

export function sanitizeUserText(
  value: string | null | undefined,
  { maxLength, preserveNewlines = false }: SanitizeTextOptions
) {
  if (!value) {
    return null;
  }

  let normalized = value
    .normalize("NFKC")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/<[^>]*>/g, "")
    .replace(/[<>]/g, "");

  if (preserveNewlines) {
    normalized = normalized
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n")
      .replace(/[^\S\n]+/g, " ")
      .replace(/\n{3,}/g, "\n\n");
  } else {
    normalized = normalized.replace(/\s+/g, " ");
  }

  const trimmed = clampText(normalized.trim(), maxLength);
  return trimmed.length > 0 ? trimmed : null;
}

export function sanitizeRequiredTitle(value: string | null | undefined, minLength = 3, maxLength = 120) {
  const sanitized = sanitizeUserText(value, { maxLength });

  if (!sanitized || sanitized.length < minLength) {
    return null;
  }

  return sanitized;
}

export function normalizeInternalPath(value: string | null | undefined, fallback = "/dashboard") {
  if (!value) {
    return fallback;
  }

  const candidate = value.trim();

  if (!candidate.startsWith("/") || candidate.startsWith("//") || /[\r\n]/.test(candidate)) {
    return fallback;
  }

  try {
    const normalized = new URL(candidate, "http://localhost");

    if (normalized.origin !== "http://localhost") {
      return fallback;
    }

    return `${normalized.pathname}${normalized.search}${normalized.hash}`;
  } catch {
    return fallback;
  }
}
