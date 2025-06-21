import { v } from "convex/values";
import { ConvexError } from "convex/values";
import { Auth } from "convex/server";

export default {
    providers: [
        {
            domain: "https://sharing-python-94.clerk.accounts.dev",
            applicationID: "convex",
        },
    ],
    getUserMetadata: async (ctx: { auth: Auth }) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new ConvexError("Not authenticated");
        }

        // Verify the token is from Clerk
        if (!identity.tokenIdentifier.startsWith("https://sharing-python-94.clerk.accounts.dev")) {
            throw new ConvexError("Invalid token issuer");
        }

        return {
            userId: identity.subject,
            tokenIdentifier: identity.tokenIdentifier,
        };
    },
}