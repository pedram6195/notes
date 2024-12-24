import { BackgroundSyncPlugin } from "workbox-background-sync";
import { registerRoute } from "workbox-routing";
import { NetworkFirst } from "workbox-strategies";
import { precacheAndRoute, cleanupOutdatedCaches } from "workbox-precaching";
import { clientsClaim } from "workbox-core";

self.skipWaiting();
clientsClaim();
cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") self.skipWaiting();
});

// Create the Background Sync Plugin
const syncPlugin = new BackgroundSyncPlugin("notes-sync-queue", {
  maxRetentionTime: 24 * 60, // Retry for 24 hours
  onSync: async ({ queue }) => {
    let entry;
    while ((entry = await queue.shiftRequest())) {
      try {
        const response = await fetch(entry.request);
        if (!response.ok && response.status !== 404) {
          // Re-add to the queue if not a successful response or already deleted
          await queue.unshiftRequest(entry);
          throw new Error("Failed to sync request");
        }
      } catch (error) {
        console.error("Replay failed for request:", entry.request, error);
        await queue.unshiftRequest(entry); // Re-add to queue for retry
        throw error;
      }
    }
  },
});

// Register Route for Notes API
registerRoute(
  ({ url }) => url.pathname.startsWith("/notes"),
  new NetworkFirst({
    cacheName: "notes-api-cache",
    networkTimeoutSeconds: 5,
    plugins: [syncPlugin],
  }),
  "POST"
);
