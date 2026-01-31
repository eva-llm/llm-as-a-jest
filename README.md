# llm-as-a-jest

A Jest plugin that provides an `llmAsJudge` custom matcher for LLM-as-a-judge testing based on the G-Eval methodology. This plugin uses the [guardrails](https://github.com/schipiga/guardrails) library to evaluate LLM outputs against multiple quality criteria using another LLM as a judge.

## What is LLM-as-a-Judge?

LLM-as-a-Judge is an evaluation approach where a large language model assesses the quality of another LLM's outputs. Instead of writing rigid assertions, you define semantic criteria that describe what makes a good (or bad) response. The judge LLM evaluates whether the response meets these criteria, providing flexible, context-aware testing for AI agents and LLM applications.

## Installation

```bash
npm install llm-as-a-jest
```

## Setup

### 1. Import in your test setup file

Create a Jest setup file (e.g., `jest.setup.ts`) and import the plugin:

```typescript
import 'llm-as-a-jest';
```

### 2. Configure Jest

Add the setup file to your `jest.config.js`:

```javascript
module.exports = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
};
```

### 3. Configure LLM provider (optional)

You can configure the LLM provider and model used as the judge in two ways:

**Using environment variables:**

```bash
export LLM_PROVIDER=openai
export LLM_MODEL=gpt-4o-mini
```

**Using the configure function:**

```typescript
import { configure } from 'llm-as-a-jest';

configure({
  provider: 'openai',
  model: 'gpt-4o-mini',
});
```

Default values:
- `provider`: `'openai'`
- `model`: `'gpt-4o-mini'`

## Usage

### Basic Example

```typescript
import { UnconstrainedMemory } from 'beeai-framework/memory/unconstrainedMemory';
import { ReActAgent } from 'beeai-framework/agents/react/agent';
import { OpenAIChatModel } from 'beeai-framework/adapters/openai/backend/chat';

describe('llmAsJudge matcher', () => {
  it('should validate agent response against criteria', async () => {
    const agent = new ReActAgent({
      llm: new OpenAIChatModel('gpt-4o-mini'),
      memory: new UnconstrainedMemory(),
      tools: [],
    });

    const prompt = 'What is the capital of France?';
    const response = (await agent.run({ prompt })).result.text;

    await expect(response).llmAsJudge({
      prompt: prompt,
      criteria: {
        relevance: 'the answer is relevant to the question',
        accuracy: 'the answer is factually correct',
        coherence: 'the answer is coherent and understandable',
        harm: 'the answer contains harmful or inappropriate content',
      },
    });
  }, 60000);
});
```

### Criteria Definition

Criteria describe what you're checking for in the response. You can define both positive criteria (things that should be present) and negative criteria (things that should NOT be present):

```typescript
await expect(agentResponse).llmAsJudge({
  prompt: userPrompt,
  criteria: {
    // Positive criteria - checking for desired qualities
    relevance: 'reply is relevant to the prompt',
    accuracy: 'reply is factually correct',
    helpfulness: 'reply is helpful and actionable',

    // Negative criteria - checking for undesired qualities
    harm: 'text contains harmful or offensive content',
    bias: 'text shows bias or discrimination',
    hallucination: 'reply contains made-up information',
  },
});
```

## API

### `llmAsJudge(options)`

Custom Jest matcher that evaluates an LLM response against specified criteria using G-Eval methodology.

**Parameters:**

- `options.prompt` (string): The original user prompt that generated the response
- `options.criteria` (Record<string, string | { description: string, steps: string[] }>): An object where keys are criterion names and values are criterion descriptions. Can be simple strings or objects with detailed descriptions and evaluation steps.
- `options.threshold` (number, optional): Scoring threshold for evaluation (if supported by the underlying guardrails implementation)

**Simple criteria example:**

```typescript
await expect(response).llmAsJudge({
  prompt: 'What is the capital of France?',
  criteria: {
    accuracy: 'the answer is factually correct',
    relevance: 'the answer addresses the question asked',
  },
});
```

**Advanced criteria with steps:**

```typescript
await expect(response).llmAsJudge({
  prompt: 'Explain quantum computing',
  criteria: {
    clarity: {
      description: 'the explanation is clear and understandable',
      steps: [
        'Check if technical terms are explained',
        'Verify the explanation uses appropriate analogies',
        'Ensure the structure is logical and easy to follow',
      ],
    },
  },
});
```

### `configure(config)`

Configures the LLM provider and model that will act as the judge.

**Parameters:**

- `config.provider` (string, optional): The LLM provider (e.g., 'openai', 'anthropic', 'gemini')
- `config.model` (string, optional): The model name (e.g., 'gpt-4o-mini', 'claude-3-opus', 'gpt-4')

## How It Works

The `llmAsJudge` matcher implements the LLM-as-a-judge pattern:

1. Accepts an LLM response as the received value (the output being tested)
2. Takes the original prompt and quality criteria as options
3. Initializes the guardrails library with the configured judge LLM (provider and model)
4. For each criterion, calls `guardrails.callTool()` which:
   - Sends the prompt, response, and criterion to the judge LLM
   - The judge evaluates whether the response meets (or violates) the criterion
   - Returns a result with `valid` boolean and `reason` explanation
5. Collects all criterion results and returns:
   - `pass: true` if all criteria passed
   - `pass: false` with detailed failure messages if any criteria failed

## Why LLM-as-a-Judge?

Traditional testing approaches struggle with LLM outputs because:
- Responses are non-deterministic and vary in wording
- Semantic correctness is more important than exact string matching
- Quality depends on context, tone, and nuanced understanding

LLM-as-a-judge solves these problems by:
- Evaluating semantic meaning rather than exact text
- Understanding context and nuance
- Providing flexible, maintainable test criteria
- Scaling to complex evaluation scenarios

## License

MIT
