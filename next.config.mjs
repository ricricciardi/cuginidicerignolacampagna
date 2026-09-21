export default {
  // PGlite (database finto per lo sviluppo) carica file wasm: non va impacchettato.
  serverExternalPackages: ['@electric-sql/pglite'],
};
