import { mutation, query, internalMutation } from "./_generated/server";
import { v } from "convex/values";

// `plans.userId` holds the Clerk user id (`identity.subject`, e.g. "user_2ab...").
// It has to be the Clerk id rather than `identity.tokenIdentifier`, because the
// Vapi voice flow writes plans through an unauthenticated HTTP action whose only
// handle on the user is the Clerk id passed in as a template variable. Every
// reader and writer below must therefore agree on this one key.

export const createPlan = mutation({
    args: {
        name: v.string(),
        workoutPlan: v.object({
            schedule: v.array(v.string()),
            exercises: v.array(
                v.object({
                    day: v.string(),
                    routines: v.array(
                        v.object({
                            name: v.string(),
                            sets: v.number(),
                            reps: v.number(),
                        })
                    ),
                })
            ),
        }),
        dietPlan: v.object({
            dailyCalories: v.number(),
            meals: v.array(
                v.object({
                    name: v.string(),
                    foods: v.array(v.string()),
                })
            ),
        }),
        isActive: v.boolean(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("User must be authenticated to create a plan");

        const userId = identity.subject;

        const activePlans = await ctx.db
            .query("plans")
            .withIndex("by_user_id", (q) => q.eq("userId", userId))
            .filter((q) => q.eq(q.field("isActive"), true))
            .collect();

        for (const plan of activePlans) {
            await ctx.db.patch(plan._id, { isActive: false });
        }

        const planId = await ctx.db.insert("plans", {
            ...args,
            userId,
        });

        return planId;
    },
});

export const createPlanInternal = internalMutation({
    args: {
        userId: v.string(),
        name: v.string(),
        workoutPlan: v.object({
            schedule: v.array(v.string()),
            exercises: v.array(
                v.object({
                    day: v.string(),
                    routines: v.array(
                        v.object({
                            name: v.string(),
                            sets: v.number(),
                            reps: v.number(),
                        })
                    ),
                })
            ),
        }),
        dietPlan: v.object({
            dailyCalories: v.number(),
            meals: v.array(
                v.object({
                    name: v.string(),
                    foods: v.array(v.string()),
                })
            ),
        }),
        isActive: v.boolean(),
    },
    handler: async (ctx, args) => {
        const activePlans = await ctx.db
            .query("plans")
            .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
            .filter((q) => q.eq(q.field("isActive"), true))
            .collect();

        for (const plan of activePlans) {
            await ctx.db.patch(plan._id, { isActive: false });
        }

        const planId = await ctx.db.insert("plans", {
            userId: args.userId,
            name: args.name,
            workoutPlan: args.workoutPlan,
            dietPlan: args.dietPlan,
            isActive: args.isActive,
        });

        return planId;
    },
});

export const getUserPlans = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        const plans = await ctx.db
            .query("plans")
            .withIndex("by_user_id", (q) => q.eq("userId", identity.subject))
            .order("desc")
            .collect();

        return plans;
    },
});