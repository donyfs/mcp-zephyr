/**
 * MCP Tools for Zephyr Test Steps Management
 */

import ZephyrClient from '../zephyr-client.js';
import { config } from '../config.js';
import { formatError } from '../utils/error-handler.js';

const client = new ZephyrClient();

/**
 * Gets test steps for a specific test case
 */
async function getTestSteps(args) {
  try {
    const { testCaseKey, maxResults, startAt } = args;

    if (!testCaseKey) {
      throw new Error('testCaseKey is required');
    }

    if (!config.testCaseKeyPattern.test(testCaseKey)) {
      throw new Error('Invalid testCaseKey format. Must match pattern: [A-Z]+-T[0-9]+');
    }

    const params = {
      maxResults: maxResults || config.defaultMaxResults,
      startAt: startAt || 0
    };

    const response = await client.getTestSteps(testCaseKey, params);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            testCaseKey,
            testSteps: response.values || response,
            total: response.total || response.length,
            startAt: response.startAt || 0,
            maxResults: response.maxResults || params.maxResults,
            note: 'Test steps are returned in paged format (100 items per page max)'
          }, null, 2)
        }
      ]
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: formatError(error, `fetching test steps for ${args.testCaseKey}`)
        }
      ],
      isError: true
    };
  }
}

/**
 * Appends new test steps to a test case
 */
async function appendTestSteps(args) {
  try {
    const { testCaseKey, steps } = args;

    if (!testCaseKey) {
      throw new Error('testCaseKey is required');
    }

    if (!config.testCaseKeyPattern.test(testCaseKey)) {
      throw new Error('Invalid testCaseKey format. Must match pattern: [A-Z]+-T[0-9]+');
    }

    if (!steps || !Array.isArray(steps)) {
      throw new Error('steps must be provided as an array');
    }

    if (steps.length === 0) {
      throw new Error('At least one step must be provided');
    }

    if (steps.length > 100) {
      throw new Error('Maximum 100 steps can be added per request');
    }

    // Validate each step and format according to TestStepsInput schema
    const formattedSteps = steps.map((step, index) => {
      if (!step.description) {
        throw new Error(`Step ${index + 1} is missing required field: description`);
      }

      const formattedStep = {
        inline: {
          description: step.description
        }
      };

      // Optional fields
      if (step.expectedResult !== undefined) {
        formattedStep.inline.expectedResult = step.expectedResult;
      }

      if (step.data !== undefined) {
        formattedStep.inline.testData = step.data;
      }

      if (step.attachments !== undefined) {
        formattedStep.inline.attachments = step.attachments;
      }

      return formattedStep;
    });

    // Format according to TestStepsInput schema
    const payload = {
      mode: 'OVERWRITE',
      items: formattedSteps
    };

    const result = await client.appendTestSteps(testCaseKey, payload);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            message: `Successfully added ${steps.length} test steps to ${testCaseKey}`,
            testCaseKey,
            stepsAdded: steps.length,
            result,
            warning: 'If this test case had a test script, it has been implicitly removed'
          }, null, 2)
        }
      ]
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: formatError(error, `appending test steps to ${args.testCaseKey}`)
        }
      ],
      isError: true
    };
  }
}

/**
 * Helper function to get all test steps for a test case (handles pagination automatically)
 */
async function getAllTestSteps(args) {
  try {
    const { testCaseKey } = args;

    if (!testCaseKey) {
      throw new Error('testCaseKey is required');
    }

    if (!config.testCaseKeyPattern.test(testCaseKey)) {
      throw new Error('Invalid testCaseKey format. Must match pattern: [A-Z]+-T[0-9]+');
    }

    const allSteps = [];
    let startAt = 0;
    const maxResults = 100; // Use maximum for efficiency

    while (true) {
      const response = await client.getTestSteps(testCaseKey, { maxResults, startAt });

      if (response.values) {
        allSteps.push(...response.values);
      } else if (Array.isArray(response)) {
        allSteps.push(...response);
      }

      // Check if we have all results
      const total = response.total || response.size || 0;
      if (allSteps.length >= total || response.values?.length < maxResults) {
        break;
      }

      startAt += maxResults;
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            testCaseKey,
            testSteps: allSteps,
            totalSteps: allSteps.length,
            note: 'All test steps retrieved (pagination handled automatically)'
          }, null, 2)
        }
      ]
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: formatError(error, `fetching all test steps for ${args.testCaseKey}`)
        }
      ],
      isError: true
    };
  }
}

export const testStepsTools = [
  {
    name: 'get_test_steps',
    description: 'Get test steps for a test case (paged response, 100 items per page)',
    inputSchema: {
      type: 'object',
      properties: {
        testCaseKey: {
          type: 'string',
          description: 'Test case key (format: [A-Z]+-T[0-9]+)',
          pattern: config.testCaseKeyPattern.source
        },
        maxResults: {
          type: 'number',
          description: 'Maximum number of steps to return (default: 50, max: 100)',
          minimum: 1,
          maximum: 100,
          default: 50
        },
        startAt: {
          type: 'number',
          description: 'Starting position for pagination (default: 0)',
          minimum: 0,
          default: 0
        }
      },
      required: ['testCaseKey']
    },
    handler: getTestSteps
  },
  {
    name: 'get_all_test_steps',
    description: 'Get all test steps for a test case (handles pagination automatically)',
    inputSchema: {
      type: 'object',
      properties: {
        testCaseKey: {
          type: 'string',
          description: 'Test case key (format: [A-Z]+-T[0-9]+)',
          pattern: config.testCaseKeyPattern.source
        }
      },
      required: ['testCaseKey']
    },
    handler: getAllTestSteps
  },
  {
    name: 'append_test_steps',
    description: 'Append new test steps to a test case (max 100 steps per request)',
    inputSchema: {
      type: 'object',
      properties: {
        testCaseKey: {
          type: 'string',
          description: 'Test case key to append steps to (format: [A-Z]+-T[0-9]+)',
          pattern: config.testCaseKeyPattern.source
        },
        steps: {
          type: 'array',
          description: 'Array of test steps to append (max 100 steps)',
          items: {
            type: 'object',
            properties: {
              description: {
                type: 'string',
                description: 'Step description (required)',
                minLength: 1
              },
              expectedResult: {
                type: 'string',
                description: 'Expected result for this step'
              },
              data: {
                type: 'string',
                description: 'Test data for this step'
              },
              attachments: {
                type: 'array',
                description: 'Array of attachment objects',
                items: {
                  type: 'object'
                }
              }
            },
            required: ['description']
          },
          minItems: 1,
          maxItems: 100
        }
      },
      required: ['testCaseKey', 'steps']
    },
    handler: appendTestSteps
  }
];

export default testStepsTools;