import { httpRouter } from "convex/server";
import { WebhookEvent } from "@clerk/nextjs/server";
import { Webhook } from "svix";
import { api, internal } from "./_generated/api";
import { httpAction } from "./_generated/server";
import { GoogleGenerativeAI } from "@google/generative-ai"

const http = httpRouter()

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

http.route({
    path: "/clerk-webhook",
    method: "POST",
    handler: httpAction(async (ctx, request) => {
        const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
        if (!webhookSecret) {
            throw new Error("CLERK_WEBHOOK_SECRET is not set");
        }

        const svix_id = request.headers.get("svix-id");
        const svix_timestamp = request.headers.get("svix-timestamp");
        const svix_signature = request.headers.get("svix-signature");

        if (!svix_id || !svix_timestamp || !svix_signature) {
            return new Response("Missing Svix headers", {
                status: 400,
            })
        }

        const payload = await request.json();
        const body = JSON.stringify(payload);

        const wh = new Webhook(webhookSecret);
        let evt: WebhookEvent;

        try {
            evt = wh.verify(body, {
                "svix-id": svix_id,
                "svix-signature": svix_signature,
                "svix-timestamp": svix_timestamp,
            }) as WebhookEvent
        } catch (err) {
            console.error("Error verifying webhook:", err);
            return new Response("Error occurred", { status: 400 });

        }

        const eventType = evt.type

        if (eventType === "user.created") {
            const { id, first_name, last_name, image_url, email_addresses } = evt.data;

            const email = email_addresses[0].email_address;

            const name = `${first_name || ""} ${last_name || ""}`.trim();

            try {
                await ctx.runMutation(api.users.syncUser, {
                    email,
                    name,
                    image: image_url,
                    clerkId: id
                })
            } catch (error) {
                console.log("Error creating user:", error);
                return new Response("Error creating user", { status: 500 });

            }
        }

        // Without this, deleting a Clerk account leaves its `users` row behind
        // forever. Those orphans are indistinguishable from live accounts when
        // reading the table, which makes "which Clerk id is this person?" an
        // unanswerable question from Convex alone.
        if (eventType === "user.deleted") {
            const { id } = evt.data;

            if (id) {
                try {
                    await ctx.runMutation(internal.users.deleteUser, { clerkId: id });
                } catch (error) {
                    console.log("Error deleting user:", error);
                    return new Response("Error deleting user", { status: 500 });
                }
            }
        }

        if (eventType === "user.updated") {
            const { id, email_addresses, first_name, last_name, image_url } = evt.data;

            const email = email_addresses[0].email_address;
            const name = `${first_name || ""} ${last_name || ""}`.trim();

            try {
                await ctx.runMutation(api.users.updateUser, {
                    clerkId: id,
                    email,
                    name,
                    image: image_url,
                });
            } catch (error) {
                console.log("Error updating user:", error);
                return new Response("Error updating user", { status: 500 });
            }
        }


        return new Response("Webhooks processed successfully", { status: 200 });



    })

})

// Vapi posts this endpoint in one of two shapes depending on how it is wired:
//
//   1. A workflow "API Request" node sends the arguments as a flat JSON body:
//      { "user_id": "...", "age": "25", ... }
//
//   2. An assistant/squad *tool* sends the tool-call envelope, with the
//      arguments nested (and sometimes JSON-encoded as a string):
//      { "message": { "type": "tool-calls",
//                     "toolCallList": [{ "id": "call_x", "name": "...",
//                                        "arguments": { "user_id": "..." } }] } }
//
// Reading the body as if it were always shape 1 silently yields `undefined` for
// every field, so accept both.
function extractToolCall(body: any): {
    toolCallId: string | null;
    args: Record<string, any>;
} {
    const message = body?.message;
    const list = message?.toolCallList ?? message?.toolCalls ?? [];
    const first = Array.isArray(list) ? list[0] : undefined;

    if (!first) return { toolCallId: null, args: body ?? {} };

    const rawArgs = first.arguments ?? first.function?.arguments ?? {};
    const args = typeof rawArgs === "string" ? JSON.parse(rawArgs) : rawArgs;

    return { toolCallId: first.id ?? first.toolCallId ?? null, args };
}

// A Clerk user id always looks like "user_<base58ish>". Anything else reaching
// this endpoint as a user_id is either an un-substituted template ("{{user_id}}")
// or — far more commonly — a value the LLM invented because the template
// variable never made it into its prompt (e.g. it slugified the caller's spoken
// name into "arindam_sarkar"). Writing such a value produces a plan that no
// signed-in user can ever read back, so reject it outright.
function isClerkUserId(value: unknown): value is string {
    return typeof value === "string" && /^user_[A-Za-z0-9]+$/.test(value);
}

// The template variable `{{user_id}}` is not substituted on every Vapi call path
// (notably squad calls, where `vapi.start` cannot deliver variableValues), so
// fall back to the overrides carried on the call object itself.
//
// ORDER MATTERS. The call-level overrides are set by our own client from the
// authenticated Clerk session, so they are trustworthy. `args.user_id` is
// whatever the model chose to put in the tool call — trusted last, and only when
// it actually looks like a Clerk id.
function extractUserId(body: any, args: Record<string, any>): string | undefined {
    const call = body?.message?.call;
    const candidates = [
        call?.assistantOverrides?.variableValues?.user_id,
        call?.squadOverrides?.variableValues?.user_id,
        call?.metadata?.user_id,
        args.user_id,
    ];

    return candidates.find(isClerkUserId);
}

// A tool call must always get HTTP 200 with a `results` array — Vapi treats any
// other response as a hard tool failure and hands the assistant nothing to say,
// which is why a failure here shows up as the agent going quiet mid-call.
function respond(
    toolCallId: string | null,
    payload: any,
    plainStatus: number
): Response {
    const body = toolCallId
        ? { results: [{ toolCallId, result: JSON.stringify(payload) }] }
        : payload;

    return new Response(JSON.stringify(body), {
        status: toolCallId ? 200 : plainStatus,
        headers: { "Content-Type": "application/json" },
    });
}

// validate and fix workout plan to ensure it has proper numeric types
function validateWorkoutPlan(plan: any) {
    const validatedPlan = {
        schedule: plan.schedule,
        exercises: plan.exercises.map((exercise: any) => ({
            day: exercise.day,
            routines: exercise.routines.map((routine: any) => ({
                name: routine.name,
                sets: typeof routine.sets === "number" ? routine.sets : parseInt(routine.sets) || 1,
                reps: typeof routine.reps === "number" ? routine.reps : parseInt(routine.reps) || 10,
            })),
        })),
    };
    return validatedPlan;
}

// validate diet plan to ensure it strictly follows schema
function validateDietPlan(plan: any) {
    // only keep the fields we want
    const validatedPlan = {
        dailyCalories: plan.dailyCalories,
        meals: plan.meals.map((meal: any) => ({
            name: meal.name,
            foods: meal.foods,
        })),
    };
    return validatedPlan;
}


http.route({
    path: "/vapi/generate-program",
    method: "POST",
    handler: httpAction(async (ctx, request) => {
        let toolCallId: string | null = null;

        try {
            const body = await request.json();
            console.log("Raw Vapi body:", JSON.stringify(body));

            const extracted = extractToolCall(body);
            toolCallId = extracted.toolCallId;
            const args = extracted.args;

            const {
                age,
                height,
                weight,
                injuries,
                workout_days,
                fitness_goal,
                fitness_level,
                dietary_restrictions,
            } = args;

            const user_id = extractUserId(body, args);

            console.log("Parsed tool args:", { toolCallId, user_id, ...args });

            // Fail fast and loudly. Without this the two Gemini calls below run
            // against `undefined` inputs and the request dies at the mutation
            // validator instead, which hides the real cause.
            if (!user_id) {
                console.error(
                    "No usable Clerk user_id in payload. args.user_id was:",
                    JSON.stringify(args.user_id),
                    "full body:",
                    JSON.stringify(body)
                );
                return respond(
                    toolCallId,
                    {
                        success: false,
                        error:
                            "Missing a valid Clerk user_id (expected the form user_xxx). " +
                            "The assistant must forward the {{user_id}} template variable " +
                            "verbatim and must never invent one from the caller's name. " +
                            "Check that variableValues reached the assistant.",
                    },
                    400
                );
            }

            const model = genAI.getGenerativeModel({
                model: "gemini-3.5-flash-lite",
                generationConfig: {
                    temperature: 0.4, // lower temperature for more predictable outputs
                    topP: 0.9,
                    responseMimeType: "application/json",
                },
            });

            const workoutPrompt = `You are an experienced fitness coach creating a personalized workout plan based on:
            Age: ${age}
            Height: ${height}
            Weight: ${weight}
            Injuries or limitations: ${injuries}
            Available days for workout: ${workout_days}
            Fitness goal: ${fitness_goal}
            Fitness level: ${fitness_level}
            
            As a professional coach:
            - Consider muscle group splits to avoid overtraining the same muscles on consecutive days
            - Design exercises that match the fitness level and account for any injuries
            - Structure the workouts to specifically target the user's fitness goal
            
            CRITICAL SCHEMA INSTRUCTIONS:
            - Your output MUST contain ONLY the fields specified below, NO ADDITIONAL FIELDS
            - "sets" and "reps" MUST ALWAYS be NUMBERS, never strings
            - For example: "sets": 3, "reps": 10
            - Do NOT use text like "reps": "As many as possible" or "reps": "To failure"
            - Instead use specific numbers like "reps": 12 or "reps": 15
            - For cardio, use "sets": 1, "reps": 1 or another appropriate number
            - NEVER include strings for numerical fields
            - NEVER add extra fields not shown in the example below

            Return a JSON object with this EXACT structure:
            {
                "schedule": ["Monday", "Wednesday", "Friday"],
                "exercises": [
                {
                    "day": "Monday",
                    "routines": [
                    {
                        "name": "Exercise Name",
                        "sets": 3,
                        "reps": 10
                    }
                    ]
                }
                ]
            }
            
            DO NOT add any fields that are not in this example. Your response must be a valid JSON object with no additional text.`;

            const workoutResult = await model.generateContent(workoutPrompt);
            const workoutPlanText = workoutResult.response.text();

            // VALIDATE THE INPUT COMING FROM AI
            let workoutPlan = JSON.parse(workoutPlanText);
            workoutPlan = validateWorkoutPlan(workoutPlan);

            const dietPrompt = `You are an experienced nutrition coach creating a personalized diet plan based on:

            Age: ${age}
            Height: ${height}
            Weight: ${weight}
            Fitness goal: ${fitness_goal}
            Dietary restrictions: ${dietary_restrictions}
            
            As a professional nutrition coach:
            - Calculate appropriate daily calorie intake based on the person's stats and goals
            - Create a balanced meal plan with proper macro nutrient distribution
            - Include a variety of nutrient-dense foods while respecting dietary restrictions
            - Consider meal timing around workouts for optimal performance and recovery
            
            CRITICAL SCHEMA INSTRUCTIONS:
            - Your output MUST contain ONLY the fields specified below, NO ADDITIONAL FIELDS
            - "dailyCalories" MUST be a NUMBER, not a string
            - DO NOT add fields like "supplements", "macros", "notes", or ANYTHING else
            - ONLY include the EXACT fields shown in the example below
            - Each meal should include ONLY a "name" and "foods" array

            Return a JSON object with this EXACT structure and no other fields:
            {
            "dailyCalories": 2000,
            "meals": [
                {
                "name": "Breakfast",
                "foods": ["Oatmeal with berries", "Greek yogurt", "Black coffee"]
                },
                {
                "name": "Lunch",
                "foods": ["Grilled chicken salad", "Whole grain bread", "Water"]
                }
            ]
            }
            
            DO NOT add any fields that are not in this example. Your response must be a valid JSON object with no additional text.`;

            const dietResult = await model.generateContent(dietPrompt);
            const dietPlanText = dietResult.response.text();

            // VALIDATE THE INPUT COMING FROM AI
            let dietPlan = JSON.parse(dietPlanText);
            dietPlan = validateDietPlan(dietPlan);

            // save to our DB: CONVEX
            const planId = await ctx.runMutation(internal.plans.createPlanInternal, {
                userId: user_id,
                dietPlan,
                isActive: true,
                workoutPlan,
                name: `${fitness_goal} Plan - ${new Date().toLocaleDateString()}`,
            });

            return respond(
                toolCallId,
                {
                    success: true,
                    data: {
                        planId,
                        workoutPlan,
                        dietPlan,
                    },
                },
                200
            );
        } catch (error) {
            console.error("Error generating fitness plan:", error);
            return respond(
                toolCallId,
                {
                    success: false,
                    error: error instanceof Error ? error.message : String(error),
                },
                500
            );
        }
    }),
});



export default http;