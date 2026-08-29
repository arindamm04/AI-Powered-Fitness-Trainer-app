import { mutation, query, internalMutation } from "./_generated/server";
import { v } from "convex/values";

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

        const userId = identity.tokenIdentifier;

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
            .withIndex("by_user_id", (q) => q.eq("userId", identity.tokenIdentifier))
            .order("desc")
            .collect();

        return plans;
    },
});