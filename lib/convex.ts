import { ConvexClient } from "convex/browser";

/**
 * Creates and returns a Convex client instance
 * @param authToken - Optional authentication token for server-side usage
 * @returns A Convex client instance
 */
export function getConvexClient(authToken?: string) {
    // You'll need to replace this with your actual Convex URL
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL || "https://wry-kangaroo-220.convex.cloud";

    if (!convexUrl) {
        throw new Error("NEXT_PUBLIC_CONVEX_URL environment variable is not set");
    }

    const client = new ConvexClient(convexUrl);
    
    // Set authentication if token is provided (for server-side usage)
    if (authToken) {
        client.setAuth(() => Promise.resolve(authToken));
    }

    return client;
}
