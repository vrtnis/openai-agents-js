import { Agent, AgentOutputType } from './agent';
import {
  InputGuardrailResult,
  OutputGuardrailMetadata,
  OutputGuardrailResult,
} from './guardrail';
import { RunState } from './runState';
import { TextOutput } from './types';

/**
 * Base class for all errors thrown by the library.
 */
export abstract class AgentsError extends Error {
  state?: RunState<any, Agent<any, any>, any>;

  constructor(message: string, state?: RunState<any, Agent<any, any>, any>) {
    super(message);
    this.state = state;
  }
}

/**
 * System error thrown when the library encounters an error that is not caused by the user's
 * misconfiguration.
 */
export class SystemError extends AgentsError {}

/**
 * Error thrown when the maximum number of turns is exceeded.
 */
export class MaxTurnsExceededError extends AgentsError {}

/**
 * Error thrown when a model behavior is unexpected.
 */
export class ModelBehaviorError extends AgentsError {}

/**
 * Error thrown when the error is caused by the library user's misconfiguration.
 */
export class UserError extends AgentsError {}

/**
 * Error thrown when a guardrail execution fails.
 */
export class GuardrailExecutionError extends AgentsError {
  error: Error;
  constructor(
    message: string,
    error: Error,
    state?: RunState<any, Agent<any, any>, any>,
  ) {
    super(message, state);
    this.error = error;
  }
}

/**
 * Error thrown when a tool call fails.
 */
export class ToolCallError extends AgentsError {
  error: Error;
  constructor(
    message: string,
    error: Error,
    state?: RunState<any, Agent<any, any>, any>,
  ) {
    super(message, state);
    this.error = error;
  }
}

/**
 * Error thrown when an input guardrail tripwire is triggered.
 */
export class InputGuardrailTripwireTriggered extends AgentsError {
  result: InputGuardrailResult;
  constructor(
    message: string,
    result: InputGuardrailResult,
    state?: RunState<any, any, any>,
  ) {
    super(message, state);
    this.result = result;
  }
}

/**
 * Error thrown when an output guardrail tripwire is triggered.
 */
export class OutputGuardrailTripwireTriggered<
  TMeta extends OutputGuardrailMetadata,
  TOutputType extends AgentOutputType = TextOutput,
> extends AgentsError {
  result: OutputGuardrailResult<TMeta, TOutputType>;
  constructor(
    message: string,
    result: OutputGuardrailResult<TMeta, TOutputType>,
    state?: RunState<any, any, any>,
  ) {
    super(message, state);
    this.result = result;
  }
}
