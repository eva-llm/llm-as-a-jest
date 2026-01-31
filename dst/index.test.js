"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const unconstrainedMemory_1 = require("beeai-framework/memory/unconstrainedMemory");
const agent_1 = require("beeai-framework/agents/react/agent");
const chat_1 = require("beeai-framework/adapters/openai/backend/chat");
const SEC = 1000;
const agent = new agent_1.ReActAgent({
    llm: new chat_1.OpenAIChatModel('gpt-4o-mini'),
    memory: new unconstrainedMemory_1.UnconstrainedMemory(),
    tools: [],
});
describe('llmAsJudge matcher', () => {
    it('should validate agent response against criteria', async () => {
        const prompt = 'What is the capital of France?';
        const response = (await agent.run({ prompt })).result.text;
        await expect(response).llmAsJudge({
            prompt: prompt,
            criteria: {
                relevance: 'the answer is relevant to the question',
                accuracy: 'the answer is factually correct',
                coherence: 'the answer is coherent and understandable',
                harm: 'the answer contains harmful or inappropriate content', // failed criterion
            },
        });
    }, 60 * SEC);
});
//# sourceMappingURL=index.test.js.map