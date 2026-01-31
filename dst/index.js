"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.configure = configure;
const guardrails_1 = __importDefault(require("guardrails"));
let pluginConfig = {
    provider: process.env.LLM_PROVIDER || 'openai',
    model: process.env.LLM_MODEL || 'gpt-4o-mini',
};
function configure(config) {
    pluginConfig = { ...pluginConfig, ...config };
}
async function llmAsJudge(received, options) {
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
        const gd = (0, guardrails_1.default)({
            provider: pluginConfig.provider,
            model: pluginConfig.model,
            criteria,
            threshold,
        });
        const results = {};
        const failures = [];
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
                }
                else {
                    return `Expected LLM-As-A-Judge to pass all criteria checks, but some failed:\n${failures.join('\n')}`;
                }
            },
        };
    }
    catch (error) {
        return {
            pass: false,
            message: () => `LLM-As-A-Judge evaluation failed with error: ${error instanceof Error ? error.message : String(error)}`,
        };
    }
}
expect.extend({
    llmAsJudge,
});
//# sourceMappingURL=index.js.map