/**
 * MCP Tools for Zephyr Test Script Management
 */

import ZephyrClient from '../zephyr-client.js';
import { config } from '../config.js';
import { formatError } from '../utils/error-handler.js';

const client = new ZephyrClient();

/**
 * Gets the test script (Gherkin format) for a test case
 */
async function getTestScript(args) {
  try {
    const { testCaseKey } = args;

    if (!testCaseKey) {
      throw new Error('testCaseKey is required');
    }

    if (!config.testCaseKeyPattern.test(testCaseKey)) {
      throw new Error('Invalid testCaseKey format. Must match pattern: [A-Z]+-T[0-9]+');
    }

    const script = await client.getTestScript(testCaseKey);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            testCaseKey,
            testScript: script,
            note: 'Test script is returned in Gherkin format (BDD style)'
          }, null, 2)
        }
      ]
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: formatError(error, `fetching test script for ${args.testCaseKey}`)
        }
      ],
      isError: true
    };
  }
}

/**
 * Creates or updates a test script for a test case
 */
async function createTestScript(args) {
  try {
    const { testCaseKey, text, type } = args;

    if (!testCaseKey) {
      throw new Error('testCaseKey is required');
    }

    if (!config.testCaseKeyPattern.test(testCaseKey)) {
      throw new Error('Invalid testCaseKey format. Must match pattern: [A-Z]+-T[0-9]+');
    }

    if (!text) {
      throw new Error('text (script content) is required');
    }

    if (typeof text !== 'string' || text.trim().length === 0) {
      throw new Error('text must be a non-empty string');
    }

    const scriptData = {
      text: text.trim()
    };

    // Optional type field (defaults to bdd/Gherkin if not specified)
    if (type) {
      if (typeof type !== 'string' || !['bdd', 'plain'].includes(type.toLowerCase())) {
        throw new Error('type must be either "bdd" (Gherkin) or "plain"');
      }
      scriptData.type = type.toLowerCase();
    } else {
      scriptData.type = 'bdd'; // Default to bdd
    }

    const result = await client.createTestScript(testCaseKey, scriptData);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            message: `Test script ${scriptData.type === 'bdd' ? 'created/updated' : 'created/updated'} successfully for ${testCaseKey}`,
            testCaseKey,
            scriptType: scriptData.type,
            result,
            warning: 'If this test case had existing test steps, they have been implicitly removed as test scripts and steps are mutually exclusive',
            note: scriptData.type === 'bdd' ? 'Script should be in Gherkin format (Given/When/Then/And/But)' : 'Plain text script format'
          }, null, 2)
        }
      ]
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: formatError(error, `creating test script for ${args.testCaseKey}`)
        }
      ],
      isError: true
    };
  }
}

/**
 * Creates a BDD (Gherkin) test script with helper validation
 */
async function createBddTestScript(args) {
  try {
    const { testCaseKey, feature, scenario, steps } = args;

    if (!testCaseKey) {
      throw new Error('testCaseKey is required');
    }

    if (!config.testCaseKeyPattern.test(testCaseKey)) {
      throw new Error('Invalid testCaseKey format. Must match pattern: [A-Z]+-T[0-9]+');
    }

    // Build Gherkin script
    let gherkinScript = '';

    if (feature) {
      gherkinScript += `Feature: ${feature}\n\n`;
    }

    if (scenario) {
      gherkinScript += `Scenario: ${scenario}\n`;
    }

    if (steps && Array.isArray(steps)) {
      if (steps.length === 0) {
        throw new Error('At least one step must be provided');
      }

      const validStepKeywords = ['Given', 'When', 'Then', 'And', 'But'];

      steps.forEach((step, index) => {
        if (typeof step !== 'string' || step.trim().length === 0) {
          throw new Error(`Step ${index + 1} must be a non-empty string`);
        }

        const stepText = step.trim();
        const hasKeyword = validStepKeywords.some(keyword =>
          stepText.toLowerCase().startsWith(keyword.toLowerCase())
        );

        if (!hasKeyword) {
          throw new Error(`Step ${index + 1} must start with a Gherkin keyword: Given, When, Then, And, or But`);
        }

        gherkinScript += `    ${stepText}\n`;
      });
    } else if (!feature && !scenario) {
      throw new Error('Either steps array or feature/scenario text must be provided');
    }

    // Create the script using the base function
    const result = await createTestScript({
      testCaseKey,
      text: gherkinScript,
      type: 'bdd'
    });

    // Add additional info to the response
    const originalContent = result.content[0].text;
    let parsedContent;

    try {
      parsedContent = JSON.parse(originalContent);
    } catch (parseError) {
      // If JSON parsing fails, return the original result with error info
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              error: 'Failed to parse createTestScript response',
              originalResponse: originalContent,
              parseError: parseError.message,
              bddHelper: {
                feature,
                scenario,
                stepsCount: steps ? steps.length : 0,
                generatedScript: gherkinScript
              }
            }, null, 2)
          }
        ],
        isError: true
      };
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            ...parsedContent,
            bddHelper: {
              feature,
              scenario,
              stepsCount: steps ? steps.length : 0,
              generatedScript: gherkinScript
            }
          }, null, 2)
        }
      ]
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: formatError(error, `creating BDD test script for ${args.testCaseKey}`)
        }
      ],
      isError: true
    };
  }
}

export const testScriptTools = [
  {
    name: 'get_test_script',
    description: 'Get the test script (Gherkin format) for a test case',
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
    handler: getTestScript
  },
  {
    name: 'create_test_script',
    description: 'Create or update a test script for a test case (removes existing test steps)',
    inputSchema: {
      type: 'object',
      properties: {
        testCaseKey: {
          type: 'string',
          description: 'Test case key (format: [A-Z]+-T[0-9]+)',
          pattern: config.testCaseKeyPattern.source
        },
        text: {
          type: 'string',
          description: 'Test script content (Gherkin format for bdd type, plain text for plain type)',
          minLength: 1
        },
        type: {
          type: 'string',
          description: 'Script type (default: bdd)',
          enum: ['bdd', 'plain'],
          default: 'bdd'
        }
      },
      required: ['testCaseKey', 'text']
    },
    handler: createTestScript
  },
  {
    name: 'create_bdd_test_script',
    description: 'Create a BDD test script using Gherkin format with helper validation',
    inputSchema: {
      type: 'object',
      properties: {
        testCaseKey: {
          type: 'string',
          description: 'Test case key (format: [A-Z]+-T[0-9]+)',
          pattern: config.testCaseKeyPattern.source
        },
        feature: {
          type: 'string',
          description: 'Feature description for the BDD script'
        },
        scenario: {
          type: 'string',
          description: 'Scenario description for the BDD script'
        },
        steps: {
          type: 'array',
          description: 'Array of Gherkin steps (must start with Given/When/Then/And/But)',
          items: {
            type: 'string',
            description: 'Gherkin step (e.g., "Given I am logged in" or "When I click the button")'
          },
          minItems: 1
        }
      },
      required: ['testCaseKey']
    },
    handler: createBddTestScript
  }
];

export default testScriptTools;