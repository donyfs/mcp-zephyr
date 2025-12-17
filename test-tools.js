#!/usr/bin/env node

/**
 * Manual test script for MCP tools
 * This script allows you to test individual tools without running the full MCP server
 */

import projectTools from './src/tools/project-tools.js';
import folderTools from './src/tools/folder-tools.js';
import testCaseTools from './src/tools/test-case-tools.js';
import testStepsTools from './src/tools/test-steps-tools.js';
import testScriptTools from './src/tools/test-script-tools.js';
import referenceDataTools from './src/tools/reference-data-tools.js';

// Load environment variables
import dotenv from 'dotenv';
dotenv.config();

// Combine all tools
const allTools = [
  ...projectTools,
  ...folderTools,
  ...testCaseTools,
  ...testStepsTools,
  ...testScriptTools,
  ...referenceDataTools
];

// Create tool lookup
const toolMap = {};
allTools.forEach(tool => {
  toolMap[tool.name] = tool;
});

async function testTool(toolName, args = {}) {
  console.log(`\n=== Testing tool: ${toolName} ===`);
  console.log('Arguments:', JSON.stringify(args, null, 2));

  const tool = toolMap[toolName];
  if (!tool) {
    console.error(`Tool "${toolName}" not found!`);
    console.log('Available tools:', Object.keys(toolMap).sort());
    return;
  }

  try {
    const result = await tool.handler(args);
    console.log('\n✅ SUCCESS:');
    if (result.content && result.content[0]) {
      if (result.content[0].type === 'text') {
        try {
          // Try to parse as JSON for pretty printing
          const jsonData = JSON.parse(result.content[0].text);
          console.log(JSON.stringify(jsonData, null, 2));
        } catch {
          // Not JSON, print as text
          console.log(result.content[0].text);
        }
      } else {
        console.log(JSON.stringify(result.content[0], null, 2));
      }
    } else {
      console.log(JSON.stringify(result, null, 2));
    }
  } catch (error) {
    console.log('\n❌ ERROR:');
    console.log(error.message);
    console.log(error.stack);
  }
}

function listTools() {
  console.log('\n=== Available Tools ===');
  allTools.forEach(tool => {
    console.log(`\n📋 ${tool.name}`);
    console.log(`   ${tool.description}`);
    if (tool.inputSchema && tool.inputSchema.properties) {
      const params = Object.keys(tool.inputSchema.properties);
      if (params.length > 0) {
        console.log(`   Parameters: ${params.join(', ')}`);
      } else {
        console.log('   Parameters: none');
      }
    }
  });
}

// Command line interface
const args = process.argv.slice(2);

if (args.length === 0) {
  console.log('Usage: node test-tools.js <tool-name> [JSON-args]');
  console.log('');
  console.log('Examples:');
  console.log('  node test-tools.js list_projects');
  console.log('  node test-tools.js list_projects \'{"maxResults": 10}\'');
  console.log('  node test-tools.js get_project \'{"projectId": "PROJ1"}\'');
  console.log('  node test-tools.js list_statuses');
  console.log('  node test-tools.js list_priorities');
  console.log('');
  console.log('Use --list to see all available tools');
  process.exit(0);
}

if (args[0] === '--list') {
  listTools();
  process.exit(0);
}

const toolName = args[0];
let toolArgs = {};

if (args[1]) {
  try {
    toolArgs = JSON.parse(args[1]);
  } catch (error) {
    console.error('Invalid JSON arguments:', error.message);
    process.exit(1);
  }
}

// Check if environment variables are set
if (!process.env.ZEPHYR_API_TOKEN) {
  console.error('⚠️  Warning: ZEPHYR_API_TOKEN not set. Create a .env file or export the variable.');
  console.error('   Get your API token from: Jira -> Profile picture -> "Zephyr API keys"');
}

testTool(toolName, toolArgs);