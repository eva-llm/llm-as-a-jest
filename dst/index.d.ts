interface LLMAsJudgeOptions {
    prompt: string;
    criteria: Record<string, string | {
        description: string;
        steps: string[];
    }>;
    threshold?: number;
}
interface PluginConfig {
    provider: string;
    model: string;
}
export declare function configure(config: PluginConfig): void;
declare global {
    namespace jest {
        interface Matchers<R> {
            llmAsJudge(options: LLMAsJudgeOptions): Promise<R>;
        }
    }
}
export {};
