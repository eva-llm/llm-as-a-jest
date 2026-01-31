import guardrails from 'guardrails';

interface LLMAsJudgeOptions {
    prompt: string;
    criteria: Record<string, string | { description: string, steps: string[] }>;
    threshold?: number;
}

interface PluginConfig {
    provider: string;
    model: string;
}

let pluginConfig: PluginConfig = {
    provider: process.env.LLM_PROVIDER || 'openai',
    model: process.env.LLM_MODEL || 'gpt-4o-mini',
};

export function configure(config: PluginConfig): void {
    pluginConfig = { ...pluginConfig, ...config };
}

async function llmAsJudge(
    this: jest.MatcherContext,
    received: string,
    options: LLMAsJudgeOptions
): Promise<jest.CustomMatcherResult> {
    const { prompt, criteria, threshold } = options;

    // NOTE: ok, AI decided to generate type check but imho it should be handled with joi schema validation or missed at all :)
    if (typeof received !== 'string') {
        return {
            pass: false,
            message: () => 'Expected received value to be a string',
        };
    }

    if (!prompt || typeof prompt !== 'string') {
        return {
            pass: false,
            message: () => 'Expected prompt to be a non-empty string',
        };
    }

    if (!criteria || typeof criteria !== 'object' || Object.keys(criteria).length === 0) {
        return {
            pass: false,
            message: () => 'Expected criteria to be a non-empty object',
        };
    }

    try {
        const gd = guardrails({
            provider: pluginConfig.provider,
            model: pluginConfig.model,
            criteria,
            threshold,
        });

        const results: Record<string, any> = {};
        const failures: string[] = [];

        // Check each criterion
        for (const criterion in criteria) {
            const result = await gd.callTool({
                name: criterion,
                arguments: {
                    prompt,
                    reply: received,
                },
            });

            results[criterion] = result;

            // If the criterion check fails, add to failures
            if (result.valid === false) {
                failures.push(`Criterion "${criterion}" failed: ${result.reason}`);
            }
        }

        const pass = failures.length === 0;

        return {
            pass,
            message: () => {
                if (pass) {
                    return 'Expected LLM-As-A-Judge to fail criteria checks, but all passed.';
                } else {
                    return `Expected LLM-As-A-Judge to pass all criteria checks, but some failed:\n${failures.join('\n')}`;
                }
            },
        };
    } catch (error) {
        return {
            pass: false,
            message: () => `LLM-As-A-Judge evaluation failed with error: ${error instanceof Error ? error.message : String(error)}`,
        };
    }
}

expect.extend({
    llmAsJudge,
});

declare global {
    namespace jest {
        interface Matchers<R> {
            llmAsJudge(options: LLMAsJudgeOptions): Promise<R>;
        }
    }
}
