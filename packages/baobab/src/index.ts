// Public, importable surface of @bookbat/baobab.
// The component itself ships at the "./BookBatClient.astro" subpath
// (Astro components can't be re-exported from a .ts barrel):
//
//   import BookBatClient from "@bookbat/baobab/BookBatClient.astro";
//   import { defaultBookBatClientConfig } from "@bookbat/baobab";

export {
  defaultBookBatClientConfig,
  resolveBookBatClientConfig,
} from "./bookbat-client.config";

export type {
  BookBatClientConfig,
  BookBatClientConfigOverride,
  BookBatExportFormatId,
} from "./bookbat-client.config";
