# llm-as-a-jest

A Jest plugin for evaluating agent or LLM-generated answers using LLM-based criteria matchers. This package is ideal for testing agentic systems, chatbots, or any AI-generated responses where correctness, relevance, and safety are important.

## Features
- **gEval matcher**: Evaluate responses using a prompt and multiple criteria.
- **llmRubric matcher**: Score responses against a rubric of criteria.
- Customizable LLM provider, model, threshold, and temperature.

## Installation

```bash
npm install llm-as-a-jest
# or
pnpm add llm-as-a-jest
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
