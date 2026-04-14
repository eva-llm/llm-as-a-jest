import { configure } from './jest.setup';

jest.mock('@eva-llm/eva-judge', () => ({
    llmRubric: jest.fn(),
    gEval: jest.fn(),
    bEval: jest.fn(),
}));

import {
    llmRubric as llmRubricJudge,
    gEval as gEvalJudge,
    bEval as bEvalJudge,
} from '@eva-llm/eva-judge';

const mockedLlmRubric = llmRubricJudge as jest.MockedFunction<typeof llmRubricJudge>;
const mockedGEval = gEvalJudge as jest.MockedFunction<typeof gEvalJudge>;
const mockedBEval = bEvalJudge as jest.MockedFunction<typeof bEvalJudge>;

const rubricResult = (overrides: Partial<{ reason: string; pass: boolean; score: number }> = {}) => ({
    reason: 'test reason',
    pass: true,
    score: 0.9,
    ...overrides,
});

const gevalResult = (overrides: Partial<{ reason: string; score: number }> = {}) => ({
    reason: 'test reason',
    score: 0.9,
    ...overrides,
});

beforeEach(() => {
    jest.clearAllMocks();
    // Reset to defaults
    configure({
        provider: 'openai',
        model: 'gpt-4.1-mini',
        threshold: 0.5,
        temperature: 0.0,
        verbose: false,
    });
});

describe('configure', () => {
    it('should override default config values', async () => {
        configure({
            provider: 'anthropic',
            model: 'claude-3',
            threshold: 0.8,
            temperature: 0.5,
            verbose: true,
        });

        mockedGEval.mockResolvedValue(gevalResult());

        await expect('test answer').gEval({
            criteria: 'test criterion',
        });

        expect(mockedGEval).toHaveBeenCalledWith(
            'test answer',
            'test criterion',
            'anthropic',
            'claude-3',
            { temperature: 0.5 },
        );
    });

    it('should allow partial config overrides', async () => {
        configure({
            provider: 'openai',
            model: 'gpt-4.1-mini',
            threshold: 0.5,
            temperature: 0.0,
            verbose: false,
        });
        configure({
            provider: 'custom',
            model: 'gpt-4.1-mini',
            threshold: 0.5,
            temperature: 0.0,
            verbose: false,
        });

        mockedLlmRubric.mockResolvedValue(rubricResult());

        await expect('answer').llmRubric({ criteria: 'test' });

        expect(mockedLlmRubric).toHaveBeenCalledWith(
            'answer',
            'test',
            'custom',
            'gpt-4.1-mini',
            { temperature: 0.0 },
        );
    });
});

describe('llmRubric matcher', () => {
    it('should pass when judge returns pass=true and score above threshold', async () => {
        mockedLlmRubric.mockResolvedValue(rubricResult());

        await expect('Paris is the capital of France.').llmRubric({
            criteria: 'answer should be factually correct',
        });
    });

    it('should fail when judge returns pass=false', async () => {
        mockedLlmRubric.mockResolvedValue(rubricResult({ score: 0.8, pass: false }));

        await expect('wrong answer').not.llmRubric({
            criteria: 'answer should be factually correct',
        });
    });

    it('should fail when score is below threshold', async () => {
        mockedLlmRubric.mockResolvedValue(rubricResult({ score: 0.3 }));

        await expect('answer').not.llmRubric({
            criteria: 'test criterion',
            threshold: 0.5,
        });
    });

    it('should pass multiple criteria when all pass', async () => {
        mockedLlmRubric
            .mockResolvedValueOnce(rubricResult({ score: 0.9 }))
            .mockResolvedValueOnce(rubricResult({ score: 0.8 }));

        await expect('good answer').llmRubric({
            criteria: ['criterion 1', 'criterion 2'],
        });

        expect(mockedLlmRubric).toHaveBeenCalledTimes(2);
    });

    it('should fail when any criterion fails among multiple', async () => {
        mockedLlmRubric
            .mockResolvedValueOnce(rubricResult({ score: 0.9 }))
            .mockResolvedValueOnce(rubricResult({ score: 0.2, pass: false }));

        await expect('answer').not.llmRubric({
            criteria: ['good criterion', 'bad criterion'],
        });
    });

    it('should use custom provider, model, and temperature', async () => {
        mockedLlmRubric.mockResolvedValue(rubricResult());

        await expect('answer').llmRubric({
            criteria: 'test',
            provider: 'anthropic',
            model: 'claude-3',
            temperature: 0.7,
        });

        expect(mockedLlmRubric).toHaveBeenCalledWith(
            'answer',
            'test',
            'anthropic',
            'claude-3',
            { temperature: 0.7 },
        );
    });

    it('should pass vercel options to judge', async () => {
        mockedLlmRubric.mockResolvedValue(rubricResult());

        await expect('answer').llmRubric({
            criteria: 'test',
            options: { maxTokens: 100 },
        });

        expect(mockedLlmRubric).toHaveBeenCalledWith(
            'answer',
            'test',
            'openai',
            'gpt-4.1-mini',
            { maxTokens: 100, temperature: 0.0 },
        );
    });

    it('should handle rejected promises from judge', async () => {
        mockedLlmRubric.mockRejectedValue(new Error('API error'));

        await expect('answer').not.llmRubric({
            criteria: 'test criterion',
        });
    });

    it('should handle non-Error rejections from judge', async () => {
        mockedLlmRubric.mockRejectedValue('string error');

        await expect('answer').not.llmRubric({
            criteria: 'test criterion',
        });
    });

    it('should catch thrown errors and return fail result', async () => {
        mockedLlmRubric.mockImplementation(() => {
            throw new Error('Unexpected crash');
        });

        await expect('answer').not.llmRubric({
            criteria: 'test criterion',
        });
    });

    it('should truncate answer in failure message when not verbose', async () => {
        mockedLlmRubric.mockResolvedValue(rubricResult({ score: 0.1, pass: false }));
        const longAnswer = 'a'.repeat(500);

        try {
            await expect(longAnswer).llmRubric({
                criteria: 'test',
                verbose: false,
            });
        } catch (e: any) {
            expect(e.message).toContain('... [500 chars total]');
            expect(e.message).not.toContain('a'.repeat(500));
        }
    });

    it('should show full answer in failure message when verbose', async () => {
        mockedLlmRubric.mockResolvedValue(rubricResult({ score: 0.1, pass: false }));
        const longAnswer = 'a'.repeat(500);

        try {
            await expect(longAnswer).llmRubric({
                criteria: 'test',
                verbose: true,
            });
        } catch (e: any) {
            expect(e.message).toContain('a'.repeat(500));
        }
    });
});

describe('gEval matcher', () => {
    it('should pass when score is above threshold', async () => {
        mockedGEval.mockResolvedValue(gevalResult());

        await expect('good answer').gEval({
            criteria: 'answer should be correct',
        });
    });

    it('should fail when score is below threshold', async () => {
        mockedGEval.mockResolvedValue(gevalResult({ score: 0.3 }));

        await expect('bad answer').not.gEval({
            criteria: 'answer should be correct',
            threshold: 0.5,
        });
    });

    it('should pass query and answer to judge when query is provided', async () => {
        mockedGEval.mockResolvedValue(gevalResult());

        await expect('Paris').gEval({
            query: 'What is the capital of France?',
            criteria: 'relevance',
        });

        expect(mockedGEval).toHaveBeenCalledWith(
            { query: 'What is the capital of France?', answer: 'Paris' },
            'relevance',
            'openai',
            'gpt-4.1-mini',
            { temperature: 0.0 },
        );
    });

    it('should pass only received string when query is not provided', async () => {
        mockedGEval.mockResolvedValue(gevalResult());

        await expect('Paris').gEval({
            criteria: 'relevance',
        });

        expect(mockedGEval).toHaveBeenCalledWith(
            'Paris',
            'relevance',
            'openai',
            'gpt-4.1-mini',
            { temperature: 0.0 },
        );
    });

    it('should handle multiple criteria', async () => {
        mockedGEval
            .mockResolvedValueOnce(gevalResult({ score: 0.9 }))
            .mockResolvedValueOnce(gevalResult({ score: 0.8 }));

        await expect('answer').gEval({
            criteria: ['criterion 1', 'criterion 2'],
        });

        expect(mockedGEval).toHaveBeenCalledTimes(2);
    });

    it('should fail when one of multiple criteria scores below threshold', async () => {
        mockedGEval
            .mockResolvedValueOnce(gevalResult({ score: 0.9 }))
            .mockResolvedValueOnce(gevalResult({ score: 0.1 }));

        await expect('answer').not.gEval({
            criteria: ['good criterion', 'bad criterion'],
        });
    });

    it('should use custom provider and model', async () => {
        mockedGEval.mockResolvedValue(gevalResult());

        await expect('answer').gEval({
            criteria: 'test',
            provider: 'google',
            model: 'gemini-pro',
            temperature: 0.3,
        });

        expect(mockedGEval).toHaveBeenCalledWith(
            'answer',
            'test',
            'google',
            'gemini-pro',
            { temperature: 0.3 },
        );
    });

    it('should handle rejected promises', async () => {
        mockedGEval.mockRejectedValue(new Error('API failure'));

        await expect('answer').not.gEval({
            criteria: 'test',
        });
    });

    it('should handle non-Error rejections', async () => {
        mockedGEval.mockRejectedValue('network timeout');

        await expect('answer').not.gEval({
            criteria: 'test',
        });
    });

    it('should catch thrown errors and return fail result', async () => {
        mockedGEval.mockImplementation(() => {
            throw new Error('Unexpected crash');
        });

        await expect('answer').not.gEval({
            criteria: 'test',
        });
    });

    it('should pass vercel options to judge', async () => {
        mockedGEval.mockResolvedValue(gevalResult());

        await expect('answer').gEval({
            criteria: 'test',
            options: { maxTokens: 200, topP: 0.9 },
        });

        expect(mockedGEval).toHaveBeenCalledWith(
            'answer',
            'test',
            'openai',
            'gpt-4.1-mini',
            { maxTokens: 200, topP: 0.9, temperature: 0.0 },
        );
    });
});

describe('bEval matcher', () => {
    it('should pass when score is above threshold', async () => {
        mockedBEval.mockResolvedValue(gevalResult({ score: 1 }));

        await expect('good answer').bEval({
            criteria: 'answer should be correct',
        });
    });

    it('should fail when score is at or below threshold', async () => {
        mockedBEval.mockResolvedValue(gevalResult({ score: 0 }));

        await expect('bad answer').not.bEval({
            criteria: 'answer should be correct',
            threshold: 0.5,
        });
    });

    it('should pass query and answer to judge when query is provided', async () => {
        mockedBEval.mockResolvedValue(gevalResult({ score: 1 }));

        await expect('Paris').bEval({
            query: 'What is the capital of France?',
            criteria: 'relevance',
        });

        expect(mockedBEval).toHaveBeenCalledWith(
            { query: 'What is the capital of France?', answer: 'Paris' },
            'relevance',
            'openai',
            'gpt-4.1-mini',
            { temperature: 0.0 },
        );
    });

    it('should pass only received string when query is not provided', async () => {
        mockedBEval.mockResolvedValue(gevalResult({ score: 1 }));

        await expect('Paris').bEval({
            criteria: 'relevance',
        });

        expect(mockedBEval).toHaveBeenCalledWith(
            'Paris',
            'relevance',
            'openai',
            'gpt-4.1-mini',
            { temperature: 0.0 },
        );
    });

    it('should handle multiple criteria', async () => {
        mockedBEval
            .mockResolvedValueOnce(gevalResult({ score: 1 }))
            .mockResolvedValueOnce(gevalResult({ score: 1 }));

        await expect('answer').bEval({
            criteria: ['criterion 1', 'criterion 2'],
        });

        expect(mockedBEval).toHaveBeenCalledTimes(2);
    });

    it('should fail when one of multiple criteria scores below threshold', async () => {
        mockedBEval
            .mockResolvedValueOnce(gevalResult({ score: 1 }))
            .mockResolvedValueOnce(gevalResult({ score: 0 }));

        await expect('answer').not.bEval({
            criteria: ['good criterion', 'bad criterion'],
        });
    });

    it('should handle rejected promises', async () => {
        mockedBEval.mockRejectedValue(new Error('API failure'));

        await expect('answer').not.bEval({
            criteria: 'test',
        });
    });

    it('should handle non-Error rejections', async () => {
        mockedBEval.mockRejectedValue(42);

        await expect('answer').not.bEval({
            criteria: 'test',
        });
    });

    it('should catch thrown errors and return fail result', async () => {
        mockedBEval.mockImplementation(() => {
            throw new Error('Unexpected crash');
        });

        await expect('answer').not.bEval({
            criteria: 'test',
        });
    });

    it('should use custom threshold', async () => {
        mockedBEval.mockResolvedValue(gevalResult({ score: 0.7 }));

        // Should pass with threshold 0.5
        await expect('answer').bEval({
            criteria: 'test',
            threshold: 0.5,
        });

        // Should fail with threshold 0.9
        await expect('answer').not.bEval({
            criteria: 'test',
            threshold: 0.9,
        });
    });

    it('should pass vercel options to judge', async () => {
        mockedBEval.mockResolvedValue(gevalResult({ score: 1 }));

        await expect('answer').bEval({
            criteria: 'test',
            options: { maxRetries: 3 },
        });

        expect(mockedBEval).toHaveBeenCalledWith(
            'answer',
            'test',
            'openai',
            'gpt-4.1-mini',
            { maxRetries: 3, temperature: 0.0 },
        );
    });
});
