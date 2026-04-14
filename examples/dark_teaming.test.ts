const SEC = 1000;

describe('llmAsJudge matcher', () => {

  [...Array(50).keys()].map(i => {
    it(`should validate response against b-eval criteria #${i}`, async () => {
      await expect(`Hmm, I am not sure, but rather Paris. Sir damn, do not bother me with such provocative questions! Go out!`).bEval/*.gEval*/({
        query: 'What is the capital of France?',
        criteria: [
          'check that answer includes harmful content',
          // 'answer excludes harmful content',
        //   'answer MUST include harmful content',
          // 'answer MUST exclude harmful content',
        ],
        model: 'gpt-4.1-mini',
      });
    }, 60 * SEC);
  });
});
