import {
    llmRubric as llmRubricJudge,
    gEval as gEvalJudge,
    bEval as bEvalJudge,
} from '@eva-llm/eva-judge';


type VercelOptions = Record<string, any>;
/**
 * Options for the llmRubric matcher.
 */
interface LLMRubricOptions {
    criteria: string | string[];
    threshold?: number;
    temperature?: number;
    provider?: string;
    model?: string;
    verbose?: boolean;
    options?: VercelOptions;
}

/**
 * Options for the gEval matcher.
 */
interface GEvalOptions {
    query?: string;
    criteria: string | string[];
    threshold?: number;
    temperature?: number;
    provider?: string;
    model?: string;
    verbose?: boolean;
    options?: VercelOptions;
}

/**
 * Configuration for the LLM plugin.
 */
interface PluginConfig {
    provider: string;
    model: string;
    threshold: number;
    temperature: number;
    verbose: boolean;
}

let pluginConfig: PluginConfig = {
    provider: 'openai',
    model: 'gpt-4.1-mini',
    threshold: 0.5,
    temperature: 0.0,
    verbose: false,
};

/**
 * Configure the LLM plugin for all matchers.
 * @param config Partial or full plugin configuration to override defaults.
 */
export function configure(config: PluginConfig): void {
    pluginConfig = { ...pluginConfig, ...config };
}

const truncate = (text: string, maxLength: number): string => {
    if (text.length <= maxLength) {
        return text;
    }

    return text.slice(0, maxLength) + `... [${text.length} chars total]`;
}

const QUERY_TRUNCATE_LENGTH = 150;
const ANSWER_TRUNCATE_LENGTH = 300;

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
    const {
        criteria,
        threshold = pluginConfig.threshold,
        temperature = pluginConfig.temperature,
        provider = pluginConfig.provider,
        model = pluginConfig.model,
        verbose = pluginConfig.verbose,
        options: vercelOptions = {},
    } = options;
    const _criteria = Array.isArray(criteria) ? criteria : [criteria];
    const failures: string[] = [];

    try {
        const settledResults = await Promise.allSettled(
            _criteria.map(criterion =>
                llmRubricJudge(
                    received,
                    criterion,
                    provider,
                    model,
                    { ...vercelOptions, temperature },
                )
            )
        );

        settledResults.forEach((settled, idx) => {
            const criterion = _criteria[idx];

            if (settled.status === 'fulfilled') {
                const result = settled.value;

                if (!result.pass || result.score <= threshold) {
                    failures.push(`Criterion "${criterion}" failed: ${JSON.stringify(result)}`);
                }
            } else {
                failures.push(`Criterion "${criterion}" failed with error: ${settled.reason instanceof Error ? settled.reason.message : String(settled.reason)}`);
            }
        });

        const pass = failures.length === 0;

        return {
            pass,
            message: () => {
                if (pass) {
                    return 'Expected LLM-Rubric to fail criteria checks, but all passed.';
                } else {
                    return `Expected LLM-Rubric to pass all criteria checks for answer "${verbose ? received : truncate(received, ANSWER_TRUNCATE_LENGTH)}", but some failed:\n${failures.join('\n')}`;
                }
            },
        };
    } catch (error) {
        return {
            pass: false,
            message: () => `LLM-Rubric evaluation for answer "${verbose ? received : truncate(received, ANSWER_TRUNCATE_LENGTH)}" failed with error: ${error instanceof Error ? error.message : String(error)}`,
        };
    }
}

/**
 * Jest custom matcher for evaluating a string (e.g. agent answer) using G-Eval (0.0-1.0) with a prompt and criteria.
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
    const {
        query,
        criteria,
        threshold = pluginConfig.threshold,
        temperature = pluginConfig.temperature,
        provider = pluginConfig.provider,
        model = pluginConfig.model,
        verbose = pluginConfig.verbose,
        options: vercelOptions = {},
    } = options;
    const _criteria = Array.isArray(criteria) ? criteria : [criteria];
    const failures: string[] = [];

    try {
        const settledResults = await Promise.allSettled(
            _criteria.map(criterion =>
                gEvalJudge(
                    query ? { query, answer: received } : received,
                    criterion,
                    provider,
                    model,
                    { ...vercelOptions, temperature },
                )
            )
        );

        settledResults.forEach((settled, idx) => {
            const criterion = _criteria[idx];

            if (settled.status === 'fulfilled') {
                const result = settled.value;

                if (result.score <= threshold) {
                    failures.push(`Criterion "${criterion}" failed: ${JSON.stringify(result)}`);
                }
            } else {
                failures.push(`Criterion "${criterion}" failed with error: ${settled.reason instanceof Error ? settled.reason.message : String(settled.reason)}`);
            }
        });

        const pass = failures.length === 0;

        return {
            pass,
            message: () => {
                if (pass) {
                    return 'Expected G-Eval to fail criteria checks, but all passed.';
                } else {
                    return `Expected G-Eval to pass all criteria checks for ${`query "${verbose ? query : truncate(query, QUERY_TRUNCATE_LENGTH)}" and `}answer "${verbose ? received : truncate(received, ANSWER_TRUNCATE_LENGTH)}", but some failed:\n${failures.join('\n')}`;
                }
            },
        };
    } catch (error) {
        return {
            pass: false,
            message: () => `G-Eval evaluation for ${`query "${verbose ? query : truncate(query, QUERY_TRUNCATE_LENGTH)}" and `}answer "${verbose ? received : truncate(received, ANSWER_TRUNCATE_LENGTH)}" failed with error: ${error instanceof Error ? error.message : String(error)}`,
        };
    }
}

/**
 * Jest custom matcher for evaluating a string (e.g. agent answer) using binary G-Eval (0|1) with a prompt and criteria.
 * @param this Jest matcher context
 * @param received The string to evaluate
 * @param options GEvalOptions for prompt, criteria, threshold, and temperature
 * @returns Promise resolving to a Jest CustomMatcherResult
 */
async function bEval(
    this: jest.MatcherContext,
    received: string,
    options: GEvalOptions
): Promise<jest.CustomMatcherResult> {
    const {
        query,
        criteria,
        threshold = pluginConfig.threshold,
        temperature = pluginConfig.temperature,
        provider = pluginConfig.provider,
        model = pluginConfig.model,
        verbose = pluginConfig.verbose,
        options: vercelOptions = {},
    } = options;
    const _criteria = Array.isArray(criteria) ? criteria : [criteria];
    const failures: string[] = [];

    try {
        const settledResults = await Promise.allSettled(
            _criteria.map(criterion =>
                bEvalJudge(
                    query ? { query, answer: received } : received,
                    criterion,
                    provider,
                    model,
                    { ...vercelOptions, temperature },
                )
            )
        );

        settledResults.forEach((settled, idx) => {
            const criterion = _criteria[idx];

            if (settled.status === 'fulfilled') {
                const result = settled.value;

                if (result.score <= threshold) {
                    failures.push(`Criterion "${criterion}" failed: ${JSON.stringify(result)}`);
                }
            } else {
                failures.push(`Criterion "${criterion}" failed with error: ${settled.reason instanceof Error ? settled.reason.message : String(settled.reason)}`);
            }
        });

        const pass = failures.length === 0;

        return {
            pass,
            message: () => {
                if (pass) {
                    return 'Expected B-Eval to fail criteria checks, but all passed.';
                } else {
                    return `Expected B-Eval to pass all criteria checks for ${`query "${verbose ? query : truncate(query, QUERY_TRUNCATE_LENGTH)}" and `}answer "${verbose ? received : truncate(received, ANSWER_TRUNCATE_LENGTH)}", but some failed:\n${failures.join('\n')}`;
                }
            },
        };
    } catch (error) {
        return {
            pass: false,
            message: () => `B-Eval evaluation for ${`query "${verbose ? query : truncate(query, QUERY_TRUNCATE_LENGTH)}" and `}answer "${verbose ? received : truncate(received, ANSWER_TRUNCATE_LENGTH)}" failed with error: ${error instanceof Error ? error.message : String(error)}`,
        };
    }
}

/**
 * Extends Jest expect with llmRubric, gEval, bEval matchers.
 */
expect.extend({
    llmRubric,
    gEval,
    bEval,
});

/**
 * Adds llmRubric, gEval, and bEval to Jest's Matchers interface for TypeScript support.
 */
declare global {
    namespace jest {
        interface Matchers<R> {
            llmRubric(options: LLMRubricOptions): Promise<R>;
            gEval(options: GEvalOptions): Promise<R>;
            bEval(options: GEvalOptions): Promise<R>;
        }
    }
}
