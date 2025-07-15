import type { Client } from '@modelcontextprotocol/sdk/client/index.js';

import {
  BaseMCPServerStdio,
  BaseMCPServerStreamableHttp,
  CallToolResultContent,
  DefaultMCPServerStdioOptions,
  InitializeResult,
  MCPServerStdioOptions,
  MCPServerStreamableHttpOptions,
  MCPTool,
  invalidateServerToolsCache,
} from '../../mcp';
import logger from '../../logger';
import type { ToolFilterContext } from '../../mcpUtil';
import type { RunContext } from '../../runContext';
import type { Agent } from '../../agent';

export interface SessionMessage {
  message: any;
}

function failedToImport(error: unknown): never {
  logger.error(
    `
Failed to load the MCP SDK. Please install the @modelcontextprotocol/sdk package.

npm install @modelcontextprotocol/sdk
    `.trim(),
  );
  throw error;
}

export class NodeMCPServerStdio extends BaseMCPServerStdio {
  protected session: Client | null = null;
  protected _cacheDirty = true;
  protected _toolsList: any[] = [];
  protected serverInitializeResult: InitializeResult | null = null;
  protected clientSessionTimeoutSeconds?: number;

  params: DefaultMCPServerStdioOptions;
  private _name: string;
  private transport: any = null;

  constructor(params: MCPServerStdioOptions) {
    super(params);
    this.clientSessionTimeoutSeconds = params.clientSessionTimeoutSeconds ?? 5;
    if ('fullCommand' in params) {
      const elements = params.fullCommand.split(' ');
      const command = elements.shift();
      if (!command) {
        throw new Error('Invalid fullCommand: ' + params.fullCommand);
      }
      this.params = {
        ...params,
        command: command,
        args: elements,
        encoding: params.encoding || 'utf-8',
        encodingErrorHandler: params.encodingErrorHandler || 'strict',
      };
    } else {
      this.params = params;
    }
    this._name = params.name || `stdio: ${this.params.command}`;
  }

  async connect(): Promise<void> {
    try {
      const { StdioClientTransport } = await import(
        '@modelcontextprotocol/sdk/client/stdio.js'
      ).catch(failedToImport);
      const { Client } = await import(
        '@modelcontextprotocol/sdk/client/index.js'
      ).catch(failedToImport);
      this.transport = new StdioClientTransport({
        command: this.params.command,
        args: this.params.args,
        env: this.params.env,
        cwd: this.params.cwd,
      });
      this.session = new Client({
        name: this._name,
        version: '1.0.0', // You may want to make this configurable
      });
      await this.session.connect(this.transport);
      this.serverInitializeResult = {
        serverInfo: { name: this._name, version: '1.0.0' },
      } as InitializeResult;
    } catch (e) {
      this.logger.error('Error initializing MCP server:', e);
      await this.close();
      throw e;
    }
    this.debugLog(() => `Connected to MCP server: ${this._name}`);
  }

  invalidateToolsCache() {
    invalidateServerToolsCache(this.name);
    this._cacheDirty = true;
  }

  // The response element type is intentionally left as `any` to avoid explosing MCP SDK type dependencies.
  protected async _applyToolFilter(
    tools: MCPTool[],
    runContext?: RunContext<any>,
    agent?: Agent<any, any>,
  ): Promise<MCPTool[]> {
    if (!this.toolFilter) {
      return tools;
    }

    if (typeof this.toolFilter === 'function') {
      const ctx = {
        runContext: runContext as RunContext<any>,
        agent: agent as Agent<any, any>,
        serverName: this.name,
      } as ToolFilterContext<any>;
      const filtered: MCPTool[] = [];
      for (const t of tools) {
        try {
          const res = this.toolFilter(ctx, t);
          const include = res instanceof Promise ? await res : res;
          if (include) filtered.push(t);
        } catch (e) {
          this.logger.error(
            `Error applying tool filter to tool '${t.name}' on server '${this.name}': ${e}`,
          );
        }
      }
      return filtered;
    }

    let filtered = tools;
    if (this.toolFilter.allowedToolNames) {
      const allowed = new Set(this.toolFilter.allowedToolNames);
      filtered = filtered.filter((t) => allowed.has(t.name));
    }
    if (this.toolFilter.blockedToolNames) {
      const blocked = new Set(this.toolFilter.blockedToolNames);
      filtered = filtered.filter((t) => !blocked.has(t.name));
    }
    return filtered;
  }

  async listTools(
    runContext?: RunContext<any>,
    agent?: Agent<any, any>,
  ): Promise<MCPTool[]> {
    const { ListToolsResultSchema } = await import(
      '@modelcontextprotocol/sdk/types.js'
    ).catch(failedToImport);
    if (!this.session) {
      throw new Error(
        'Server not initialized. Make sure you call connect() first.',
      );
    }
    let tools: MCPTool[];
    if (this.cacheToolsList && !this._cacheDirty && this._toolsList) {
      tools = this._toolsList;
    } else {
      this._cacheDirty = false;
      const response = await this.session.listTools();
      this.debugLog(() => `Listed tools: ${JSON.stringify(response)}`);
      this._toolsList = ListToolsResultSchema.parse(response).tools;
      tools = this._toolsList;
    }
    return this._applyToolFilter(tools, runContext, agent);
  }

  async callTool(
    toolName: string,
    args: Record<string, unknown> | null,
  ): Promise<CallToolResultContent> {
    const { CallToolResultSchema } = await import(
      '@modelcontextprotocol/sdk/types.js'
    ).catch(failedToImport);
    if (!this.session) {
      throw new Error(
        'Server not initialized. Make sure you call connect() first.',
      );
    }
    const response = await this.session.callTool({
      name: toolName,
      arguments: args ?? {},
    });
    const parsed = CallToolResultSchema.parse(response);
    const result = parsed.content;
    this.debugLog(
      () =>
        `Called tool ${toolName} (args: ${JSON.stringify(args)}, result: ${JSON.stringify(result)})`,
    );
    return result as CallToolResultContent;
  }

  get name() {
    return this._name;
  }

  async close(): Promise<void> {
    if (this.transport) {
      await this.transport.close();
      this.transport = null;
    }
    if (this.session) {
      await this.session.close();
      this.session = null;
    }
  }
}

export class NodeMCPServerStreamableHttp extends BaseMCPServerStreamableHttp {
  protected session: Client | null = null;
  protected _cacheDirty = true;
  protected _toolsList: any[] = [];
  protected serverInitializeResult: InitializeResult | null = null;
  protected clientSessionTimeoutSeconds?: number;

  params: MCPServerStreamableHttpOptions;
  private _name: string;
  private transport: any = null;

  constructor(params: MCPServerStreamableHttpOptions) {
    super(params);
    this.clientSessionTimeoutSeconds = params.clientSessionTimeoutSeconds ?? 5;
    this.params = params;
    this._name = params.name || `streamable-http: ${this.params.url}`;
  }

  async connect(): Promise<void> {
    try {
      const { StreamableHTTPClientTransport } = await import(
        '@modelcontextprotocol/sdk/client/streamableHttp.js'
      ).catch(failedToImport);
      const { Client } = await import(
        '@modelcontextprotocol/sdk/client/index.js'
      ).catch(failedToImport);
      this.transport = new StreamableHTTPClientTransport(
        new URL(this.params.url),
        {
          authProvider: this.params.authProvider,
          requestInit: this.params.requestInit,
          reconnectionOptions: this.params.reconnectionOptions,
          sessionId: this.params.sessionId,
        },
      );
      this.session = new Client({
        name: this._name,
        version: '1.0.0', // You may want to make this configurable
      });
      await this.session.connect(this.transport);
      this.serverInitializeResult = {
        serverInfo: { name: this._name, version: '1.0.0' },
      } as InitializeResult;
    } catch (e) {
      this.logger.error('Error initializing MCP server:', e);
      await this.close();
      throw e;
    }
    this.debugLog(() => `Connected to MCP server: ${this._name}`);
  }

  invalidateToolsCache() {
    invalidateServerToolsCache(this.name);
    this._cacheDirty = true;
  }

  // The response element type is intentionally left as `any` to avoid explosing MCP SDK type dependencies.
  protected async _applyToolFilter(
    tools: MCPTool[],
    runContext?: RunContext<any>,
    agent?: Agent<any, any>,
  ): Promise<MCPTool[]> {
    if (!this.toolFilter) {
      return tools;
    }
    if (typeof this.toolFilter === 'function') {
      const ctx: ToolFilterContext<any> = {
        runContext: runContext as RunContext<any>,
        agent: agent as Agent<any, any>,
        serverName: this.name,
      };
      const filtered: MCPTool[] = [];
      for (const t of tools) {
        try {
          const res = this.toolFilter(ctx, t);
          const include = res instanceof Promise ? await res : res;
          if (include) filtered.push(t);
        } catch (e) {
          this.logger.error(
            `Error applying tool filter to tool '${t.name}' on server '${this.name}': ${e}`,
          );
        }
      }
      return filtered;
    }

    let filtered = tools;
    if (this.toolFilter.allowedToolNames) {
      const allowed = new Set(this.toolFilter.allowedToolNames);
      filtered = filtered.filter((t) => allowed.has(t.name));
    }
    if (this.toolFilter.blockedToolNames) {
      const blocked = new Set(this.toolFilter.blockedToolNames);
      filtered = filtered.filter((t) => !blocked.has(t.name));
    }
    return filtered;
  }

  async listTools(
    runContext?: RunContext<any>,
    agent?: Agent<any, any>,
  ): Promise<MCPTool[]> {
    const { ListToolsResultSchema } = await import(
      '@modelcontextprotocol/sdk/types.js'
    ).catch(failedToImport);
    if (!this.session) {
      throw new Error(
        'Server not initialized. Make sure you call connect() first.',
      );
    }
    let tools: MCPTool[];
    if (this.cacheToolsList && !this._cacheDirty && this._toolsList) {
      tools = this._toolsList;
    } else {
      this._cacheDirty = false;
      const response = await this.session.listTools();
      this.debugLog(() => `Listed tools: ${JSON.stringify(response)}`);
      this._toolsList = ListToolsResultSchema.parse(response).tools;
      tools = this._toolsList;
    }
    return this._applyToolFilter(tools, runContext, agent);
  }

  async callTool(
    toolName: string,
    args: Record<string, unknown> | null,
  ): Promise<CallToolResultContent> {
    const { CallToolResultSchema } = await import(
      '@modelcontextprotocol/sdk/types.js'
    ).catch(failedToImport);
    if (!this.session) {
      throw new Error(
        'Server not initialized. Make sure you call connect() first.',
      );
    }
    const response = await this.session.callTool({
      name: toolName,
      arguments: args ?? {},
    });
    const parsed = CallToolResultSchema.parse(response);
    const result = parsed.content;
    this.debugLog(
      () =>
        `Called tool ${toolName} (args: ${JSON.stringify(args)}, result: ${JSON.stringify(result)})`,
    );
    return result as CallToolResultContent;
  }

  get name() {
    return this._name;
  }

  async close(): Promise<void> {
    if (this.transport) {
      await this.transport.close();
      this.transport = null;
    }
    if (this.session) {
      await this.session.close();
      this.session = null;
    }
  }
}
