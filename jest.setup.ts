import { llmRubric as llmRubricJudge, gEval as gEvalJudge } from '@eva-llm/eva-judge';

/**
 * Options for the llmRubric matcher.
 */
interface LLMRubricOptions {
    criteria: string | string[];
    threshold?: number;
    temperature?: number;
}

/**
 * Options for the gEval matcher.
 */
interface GEvalOptions {
    prompt: string;
    criteria: string | string[];
    threshold?: number;
    temperature?: number;
}

/**
 * Configuration for the LLM plugin.
 */
interface PluginConfig {
    provider: string;
    model: string;
    threshold: number;
    temperature: number;
}

let pluginConfig: PluginConfig = {
    provider: 'openai',
    model: 'gpt-4.1-mini',
    threshold: 0.5,
    temperature: 0.0,
};

/**
 * Configure the LLM plugin for all matchers.
 * @param config Partial or full plugin configuration to override defaults.
 */
export function configure(config: PluginConfig): void {
    pluginConfig = { ...pluginConfig, ...config };
}

/**
 * Jest custom matcher for evaluating a string (e.g. agent answer) using LLM-Rubric with criteria.
 * @param this Jest matcher context
 * @param received The string to evaluate
 * @param options LLMRubricOptions for criteria, threshold, and temperature
 * @returns Promise resolving to a Jest CustomMatcherResult
 */
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
                failures.push(`Criterion "${criterion}" failed: ${JSON.stringify(result)}`);
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

/**
 * Jest custom matcher for evaluating a string (e.g. agent answer) using G-Eval with a prompt and criteria.
 * @param this Jest matcher context
 * @param received The string to evaluate
 * @param options GEvalOptions for prompt, criteria, threshold, and temperature
 * @returns Promise resolving to a Jest CustomMatcherResult
 */
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
                failures.push(`Criterion "${criterion}" failed: ${JSON.stringify(result)}`);
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

/**
 * Extends Jest expect with llmRubric and gEval matchers.
 */
expect.extend({
    llmRubric,
    gEval,
});

/**
 * Adds llmRubric and gEval to Jest's Matchers interface for TypeScript support.
 */
declare global {
    namespace jest {
        interface Matchers<R> {
            llmRubric(options: LLMRubricOptions): Promise<R>;
            gEval(options: GEvalOptions): Promise<R>;
        }
    }
}
