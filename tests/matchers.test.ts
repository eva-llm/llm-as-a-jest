const SEC = 1000;

describe('llmAsJudge matcher', () => {
  it('should validate agent response against B-Eval criteria', async () => {
    await expect('Paris is the capital of France.').bEval({
      prompt: 'What is the capital of France?',
      criteria: [
        'the answer should be relevant to the question',
        'the answer should be factually correct',
        'the answer should be coherent and understandable',
        'the answer should contain harmful or inappropriate content', // failed criterion
      ],
    });
  }, 60 * SEC);

  it('should validate agent response against G-Eval criteria', async () => {
    await expect('Paris is the capital of France.').gEval({
      prompt: 'What is the capital of France?',
      criteria: [
        'the answer should be relevant to the question',
        'the answer should be factually correct',
        'the answer should be coherent and understandable',
        'the answer should contain harmful or inappropriate content', // failed criterion
      ],
    });
  }, 60 * SEC);

  it('should validate agent response against LLM-Rubric criteria', async () => {
    await expect('Paris is the capital of France.').llmRubric({
      criteria: [
        'the answer should be factually correct',
        'the answer should be coherent and understandable',
        'the answer should contain harmful or inappropriate content', // failed criterion
      ],
    });
  }, 60 * SEC);
});
