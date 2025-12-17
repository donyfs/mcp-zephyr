#!/usr/bin/env node

/**
 * MCP Server for Zephyr Scale Cloud API
 *
 * This server provides tools for managing:
 * - Projects (list, get details)
 * - Folders (list, get, create)
 * - Test Cases (list, get, create, update)
 * - Test Steps (get, append - no individual update/delete)
 * - Test Scripts (get, create/update - mutually exclusive with steps)
 * - Reference Data (statuses, priorities)
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema
} from '@modelcontextprotocol/sdk/types.js';

import projectTools from './tools/project-tools.js';
import folderTools from './tools/folder-tools.js';
import testCaseTools from './tools/test-case-tools.js';
import testStepsTools from './tools/test-steps-tools.js';
import testScriptTools from './tools/test-script-tools.js';
import referenceDataTools from './tools/reference-data-tools.js';

// Combine all tools
const allTools = [
  ...projectTools,
  ...folderTools,
  ...testCaseTools,
  ...testStepsTools,
  ...testScriptTools,
  ...referenceDataTools
];

// Convert tools to MCP format
const mcpTools = allTools.map(tool => ({
  name: tool.name,
  description: tool.description,
  inputSchema: tool.inputSchema
}));

class ZephyrMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'mcp-zephyr',
        version: '1.0.0',
        description: 'MCP server for Zephyr Scale Cloud API - Manage projects, folders, test cases, test steps, and test scripts'
      },
      {
        capabilities: {
          tools: {}
        }
      }
    );

    this.setupHandlers();
  }

  setupHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      console.error('[MCP Server] Listing tools');
      return {
        tools: mcpTools
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      console.error(`[MCP Server] Tool call: ${name}`, args);

      try {
        // Find the tool
        const tool = allTools.find(t => t.name === name);
        if (!tool) {
          throw new Error(`Unknown tool: ${name}`);
        }

        // Execute the tool
        const result = await tool.handler(args);

        console.error(`[MCP Server] Tool ${name} completed successfully`);
        return result;

      } catch (error) {
        console.error(`[MCP Server] Tool ${name} failed:`, error);

        return {
          content: [
            {
              type: 'text',
              text: `Error executing ${name}: ${error.message}`
            }
          ],
          isError: true
        };
      }
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    console.error('[MCP Server] Starting Zephyr MCP Server...');
    console.error('[MCP Server] Available tools:', allTools.map(t => t.name).join(', '));

    try {
      await this.server.connect(transport);
      console.error('[MCP Server] Server connected and ready');
    } catch (error) {
      console.error('[MCP Server] Failed to start server:', error);
      process.exit(1);
    }
  }
}

// Handle process signals gracefully
const server = new ZephyrMCPServer();

process.on('SIGINT', async () => {
  console.error('[MCP Server] Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.error('[MCP Server] Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('[MCP Server] Uncaught exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[MCP Server] Unhandled rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the server
if (import.meta.url === `file://${process.argv[1]}`) {
  server.run().catch((error) => {
    console.error('[MCP Server] Failed to start server:', error);
    process.exit(1);
  });
}

export default ZephyrMCPServer;