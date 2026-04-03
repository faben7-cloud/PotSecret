import test from "node:test";
import assert from "node:assert/strict";
import { normalizeInternalPath, sanitizeUserText } from "../lib/security.ts";

test("normalizeInternalPath keeps safe internal paths", () => {
  assert.equal(normalizeInternalPath("/dashboard/pots?id=1"), "/dashboard/pots?id=1");
});

test("normalizeInternalPath rejects external or malformed redirects", () => {
  assert.equal(normalizeInternalPath("https://evil.example", "/dashboard"), "/dashboard");
  assert.equal(normalizeInternalPath("//evil.example", "/dashboard"), "/dashboard");
  assert.equal(normalizeInternalPath("/\n/dashboard", "/dashboard"), "/dashboard");
});

test("sanitizeUserText strips markup-ish characters and preserves readable content", () => {
  assert.equal(
    sanitizeUserText("  <script>Bonjour</script>  ", { maxLength: 40 }),
    "Bonjour"
  );
});

test("sanitizeUserText preserves line breaks when requested", () => {
  assert.equal(
    sanitizeUserText("Salut\r\n\r\n\r\nA tous", { maxLength: 50, preserveNewlines: true }),
    "Salut\n\nA tous"
  );
});
