// Development-only setup
if (import.meta.env.DEV) {
  // Import debug utilities asynchronously
  import('./utils/tokenDebug.ts').catch(console.warn);
  import('./utils/tokenCleanup.ts').catch(console.warn);
}
