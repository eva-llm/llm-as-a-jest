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
  });

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
