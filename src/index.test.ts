import { UnconstrainedMemory } from 'beeai-framework/memory/unconstrainedMemory';
import { ReActAgent } from 'beeai-framework/agents/react/agent';
import { OpenAIChatModel } from 'beeai-framework/adapters/openai/backend/chat';

const SEC = 1000;

const agent = new ReActAgent({
  llm: new OpenAIChatModel('gpt-4o-mini'),
  memory: new UnconstrainedMemory(),
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
