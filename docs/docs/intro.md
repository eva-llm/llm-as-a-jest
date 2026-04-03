---
sidebar_position: 1
---

# llm-as-a-jest

A Jest plugin for evaluating agent or LLM-generated answers using LLM-based criteria matchers. This package is ideal for testing agentic systems, chatbots, or any AI-generated responses where correctness, relevance, and safety are important.

## Features
- **gEval matcher**: Evaluate responses using a prompt and multiple criteria.
- **llmRubric matcher**: Score responses against a rubric of criteria.
- **bEval matcher**: Binary (0/1) evaluation using G-Eval for strict pass/fail.
- Customizable LLM provider, model, threshold, and temperature.

## Installation

```bash
npm install @eva-llm/llm-as-a-jest
# or
pnpm add @eva-llm/llm-as-a-jest
```

## Usage

Add the setup file to your Jest configuration:

```json
{
  "setupFilesAfterEnv": ["<rootDir>/jest.setup.ts"]
}
```


### Example: Validating Agent Answers

Suppose you have an agent that answers questions. You can test its output like this:

```typescript
await expect('Paris is the capital of France.').gEval({
  prompt: 'What is the capital of France?',
  criteria: [
    'the answer should be relevant to the question',
    'the answer should be factually correct',
    'the answer should be coherent and understandable',
    'the answer should not contain harmful or inappropriate content',
  ],
});

await expect('Paris is the capital of France.').llmRubric({
  criteria: [
    'the answer should be factually correct',
    'the answer should be coherent and understandable',
    'the answer should not contain harmful or inappropriate content',
  ],
});

// Binary G-Eval: strict pass/fail (score 0 or 1)
await expect('Paris is the capital of France.').bEval({
  prompt: 'What is the capital of France?',
  criteria: [
    'the answer should be factually correct',
    'the answer should be relevant to the question',
  ],
});
```

### Agentic Testing Example


You can use these matchers to test agentic workflows, such as multi-step reasoning or tool use:

```typescript
const prompt = 'Summarize the main points of the following article...';
const agentAnswer = await agent.run(prompt);

await expect(agentAnswer).gEval({
  prompt,
  criteria: [
    'the summary should capture all main points',
    'the summary should be concise and clear',
    'the summary should not contain hallucinated facts',
  ],
});
```

## When to Use
- Testing LLM or agent answers for factuality, relevance, and safety
- Automated evaluation of chatbot or agentic system outputs
- Ensuring your AI system meets quality standards

## License
MIT

## LLM Providers and Settings

The list of supported LLM providers and their configuration details are available in the README of the [@eva-llm/eva-judge](https://github.com/eva-llm/eva-judge) package. Please refer there for up-to-date provider names, model options, and environment variable requirements.


## Matcher Options

All three matchers accept options objects to customize evaluation:

- **GEvalOptions** (for `gEval` and `bEval`)
  - `prompt` (string): The prompt/question to evaluate against. (required)
  - `criteria` (string | string[]): Criteria or rubric for evaluation. (required)
  - `threshold` (number, optional): Pass threshold (default: pluginConfig.threshold).
  - `temperature` (number, optional): LLM temperature (default: pluginConfig.temperature).
  - `provider` (string, optional): LLM provider to use (default: pluginConfig.provider).
  - `model` (string, optional): LLM model to use (default: pluginConfig.model).

- **LLMRubricOptions** (for `llmRubric`)
  - `criteria` (string | string[]): Criteria or rubric for evaluation. (required)
  - `threshold` (number, optional): Pass threshold (default: pluginConfig.threshold).
  - `temperature` (number, optional): LLM temperature (default: pluginConfig.temperature).
  - `provider` (string, optional): LLM provider to use (default: pluginConfig.provider).
  - `model` (string, optional): LLM model to use (default: pluginConfig.model).

**bEval** is a binary (0 or 1) version of G-Eval, useful for strict pass/fail checks.

## Default Plugin Configuration

You can override the default plugin configuration using the `configure` function. The defaults are:

```js
{
  provider: 'openai',
  model: 'gpt-4.1-mini',
  threshold: 0.5,
  temperature: 0.0, // Recommended for judging
}
```

Call `configure({ ... })` in your setup to change these values globally for all matchers.
