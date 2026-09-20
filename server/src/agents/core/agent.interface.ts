import { AgentContext, AgentResult } from './agent.types.js';

export interface InvestigationAgent<TInput = any, TOutput = any> {
  readonly name: string;
  readonly description: string;
  execute(input: TInput, context: AgentContext): Promise<AgentResult<TOutput>>;
}
