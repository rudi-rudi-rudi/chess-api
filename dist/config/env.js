import { z } from 'zod';
const EnvSchema = z.object({
    DATABASE_URL: z.string().url(),
    GOOGLE_CLIENT_ID: z.string().min(10),
    PORT: z.coerce.number().int().positive().default(3000),
});
export function loadEnv() {
    const parsed = EnvSchema.safeParse(process.env);
    if (!parsed.success) {
        const issues = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
        throw new Error(`Invalid environment: ${issues}`);
    }
    return parsed.data;
}
//# sourceMappingURL=env.js.map