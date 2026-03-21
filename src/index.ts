import { llmRubric as llmRubricJudge, gEval as gEvalJudge } from 'eva-judge';

interface LLMRubricOptions {
    criteria: string | string[];
    threshold?: number;
    temperature?: number;
}

interface GEvalOptions {
    prompt: string;
    criteria: string | string[];
    threshold?: number;
    temperature?: number;
}

interface PluginConfig {
    provider: string;
    model: string;
    threshold: number;
    temperature: number;
}

let pluginConfig: PluginConfig = {
    provider: 'openai',
    model: 'gpt-5-mini',
    threshold: 0.5,
    temperature: 0.0,
};

export function configure(config: PluginConfig): void {
    pluginConfig = { ...pluginConfig, ...config };
}

async function llmRubric(
    this: jest.MatcherContext,
    received: string,
    options: LLMRubricOptions
): Promise<jest.CustomMatcherResult> {
    const { criteria, threshold, temperature } = options;
    const _criteria = Array.isArray(criteria) ? criteria : [criteria];
    const _threshold = threshold ?? pluginConfig.threshold;
    const _temperature = temperature ?? pluginConfig.temperature;
    const results: Record<string, any> = {};
    const failures: string[] = [];

    try {


        for (const criterion of _criteria) {
            const result = await llmRubricJudge(
                received,
                criterion,
                pluginConfig.provider,
                pluginConfig.model,
                { temperature: _temperature },
            );

            results[criterion] = result;

            if (!result.pass || result.score <= _threshold) {
                failures.push(`Criterion "${criterion}" failed: ${result.reason}`);
            }
        }

        const pass = failures.length === 0;

        return {
            pass,
            message: () => {
                if (pass) {
                    return 'Expected LLM-Rubric to fail criteria checks, but all passed.';
                } else {
                    return `Expected LLM-Rubric to pass all criteria checks, but some failed:\n${failures.join('\n')}`;
                }
            },
        };
    } catch (error) {
        return {
            pass: false,
            message: () => `LLM-Rubric evaluation failed with error: ${error instanceof Error ? error.message : String(error)}`,
        };
    }
}

async function gEval(
    this: jest.MatcherContext,
    received: string,
    options: GEvalOptions
): Promise<jest.CustomMatcherResult> {
    const { prompt, criteria, threshold, temperature } = options;
    const _criteria = Array.isArray(criteria) ? criteria : [criteria];
    const _threshold = threshold ?? pluginConfig.threshold;
    const _temperature = temperature ?? pluginConfig.temperature;
    const results: Record<string, any> = {};
    const failures: string[] = [];

    try {
        for (const criterion of _criteria) {
            const result = await gEvalJudge(
                prompt,
                received,
                criterion,
                pluginConfig.provider,
                pluginConfig.model,
                { temperature: _temperature },
            );

            results[criterion] = result;

            if (result.score <= _threshold) {
                failures.push(`Criterion "${criterion}" failed: ${result.reason}`);
            }
        }

        const pass = failures.length === 0;

        return {
            pass,
            message: () => {
                if (pass) {
                    return 'Expected G-Eval to fail criteria checks, but all passed.';
                } else {
                    return `Expected G-Eval to pass all criteria checks, but some failed:\n${failures.join('\n')}`;
                }
            },
        };
    } catch (error) {
        return {
            pass: false,
            message: () => `G-Eval evaluation failed with error: ${error instanceof Error ? error.message : String(error)}`,
        };
    }
}

expect.extend({
    llmRubric,
    gEval,
});

declare global {
    namespace jest {
        interface Matchers<R> {
            llmRubric(options: LLMRubricOptions): Promise<R>;
            gEval(options: GEvalOptions): Promise<R>;
        }
    }
}
