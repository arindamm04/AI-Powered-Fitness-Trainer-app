import { mutation} from "./_generated/server";
import { v } from "convex/values";

// Called by the client whenever an authenticated user loads the app. Unlike the
// Clerk `user.created` webhook (which fires only once, at sign-up), this also
// runs on every sign-in, so a user can never end up without a row. Idempotent.
export const store = mutation({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Called store without authentication");

        // `subject` is the Clerk user id (user_xxx) — the same value the webhook
        // writes as `clerkId`, so both paths converge on one row.
        const clerkId = identity.subject;

        const existingUser = await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
        .first();

        if (existingUser) return existingUser._id;

        return await ctx.db.insert("users", {
            clerkId,
            email: identity.email ?? "",
            name: identity.name ?? "",
            image: identity.pictureUrl,
        });
    },
});

export const syncUser = mutation({
    args: {
    name: v.string(),
    email: v.string(),
    clerkId: v.string(),
    image: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const existingUser = await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
        .first();

        if (existingUser) return;

        return await ctx.db.insert("users", args);
    },
});

/*export const updateUser = mutation({
    args: {
    name: v.string(),
    email: v.string(),
    clerkId: v.string(),
    image: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const existingUser = await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
        .first();

        if (!existingUser) return;

        return await ctx.db.patch(existingUser._id, args);
    },
});*/

