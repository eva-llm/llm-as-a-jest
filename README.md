# llm-as-a-jest

A `jest` plugin for evaluating human messages, agent or LLM-generated answers using LLM-based criteria matchers: **LLM-Rubric**, **G-Eval**, **B-Eval**. This package fits for testing agentic systems, chatbots, or any text, where needs to check correctness, relevance, and safety with advanced possibilities of AI.

## Quick start

```bash
npm install @eva-llm/llm-as-a-jest
```

```json
{
  "setupFilesAfterEnv": ["@eva-llm/llm-as-a-jest/jest.setup"]
}
```

```ts
const SEC = 1000;

describe('llmAsJudge matcher', () => {

  it('should do smoke tests', async () => {
    const query = 'What is the capital of France?';
    const answer = 'Paris is the capital of France.';

    await expect(answer).gEval({
      criteria: 'answer should be factually correct',
    });

    await expect(answer).gEval({
      query,
      criteria: 'answer should be coherent to question',
    });

    await expect(answer).bEval({
      criteria: 'answer should be factually correct',
    });

    await expect(answer).bEval({
      query,
      criteria: 'answer should be coherent to question',
    });

    await expect(answer).llmRubric({
      criteria: 'answer should be factually correct',
    });
  }, 60 * SEC);
});
```

## Matchers

- **llmRubric** - Evaluates a text against a rubric using an LLM. Returns a reason, pass/fail, and normalized score.
- **gEval** - Evaluates a text or query-answer pair against criteria and derived steps using an LLM. Returns a reason and normalized score (0.0-1.0).
- **bEval** - Evaluates a text or query-answer pair against criteria and derived steps using an LLM, but with binary scoring (0 or 1). Returns a reason and a normalized score (0 or 1).

## Matcher Options

### GEvalOptions (for G-Eval and B-Eval):
- `query` (string, optional): The question for answer if to evaluate query-answer pair.
- `criteria` (string | string[]): Criteria or rubric for evaluation. (required)
- `threshold` (number, optional): Pass threshold (default: `pluginConfig.threshold`).
- `temperature` (number, optional): LLM temperature (default: `pluginConfig.temperature`).
- `provider` (string, optional): LLM provider to use (default: `pluginConfig.provider`).
- `model` (string, optional): LLM model to use (default: `pluginConfig.model`).
- `verbose` (boolean, optional): If needs to show non-truncated query and answer in failed test error (default: `pluginConfig.verbose`).

### LLMRubricOptions (for LLM-Rubric):
- `criteria` (string | string[]): Criteria or rubric for evaluation. (required)
- `threshold` (number, optional): Pass threshold (default: `pluginConfig.threshold`).
- `temperature` (number, optional): LLM temperature (default: `pluginConfig.temperature`).
- `provider` (string, optional): LLM provider to use (default: `pluginConfig.provider`).
- `model` (string, optional): LLM model to use (default: `pluginConfig.model`).
- `verbose` (boolean, optional): If needs to show non-truncated query and answer in failed test error (default: `pluginConfig.verbose`).

## Default Plugin Configuration

You can override the default plugin configuration using the `configure` function. The defaults are:

```js
{
  provider: 'openai',
  model: 'gpt-4.1-mini',
  threshold: 0.5,
  temperature: 0.0, // Recommended for judging
  verbose: false, // truncated query and answer in failed test error
}
```

Call `configure({ ... })` in your setup to change these values globally for all matchers.

## LLM Providers and Settings

The following LLM providers are supported (via [Vercel ai-sdk](https://github.com/vercel/ai)): 

- OpenAI (`openai`)
- Anthropic (`anthropic`)
- Google (`google`)
- Mistral (`mistral`)
- Amazon Bedrock (`bedrock`)
- Azure (`azure`)
- DeepSeek (`deepseek`)
- Groq (`groq`)
- Perplexity (`perplexity`)
- xAI (`xai`)

Specify the provider name and model name in `llmRubric`, `gEval`, or `bEval`.

> **Note:** Each provider integration is based on its respective ai-sdk package. Be sure to follow the provider's documentation for setup and authentication. Most providers require you to export an API key or token as an environment variable (e.g., `export OPENAI_API_KEY=...`).

More info about available providers and models in [@eva-llm/eva-judge](https://eva-llm.github.io/eva-judge).

## License
MIT
