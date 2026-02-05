/**
 * MCP Tools for Zephyr Test Case Management
 */

import ZephyrClient from '../zephyr-client.js';
import { config } from '../config.js';
import { formatError } from '../utils/error-handler.js';

const client = new ZephyrClient();

/**
 * Lists test cases with optional filtering
 */
async function listTestCases(args) {
  try {
    const params = {
      projectKey: args.projectKey,
      folderId: args.folderId,
      maxResults: args.maxResults || config.defaultMaxResults,
      startAt: args.startAt || 0
    };

    // Validate projectKey if provided
    if (params.projectKey && !config.projectKeyPattern.test(params.projectKey)) {
      throw new Error('Invalid projectKey format. Must match pattern: [A-Z][A-Z_0-9]+');
    }

    // Validate folderId if provided
    if (params.folderId && (!Number.isInteger(params.folderId) || params.folderId < 1)) {
      throw new Error('Invalid folderId format. Must be a positive integer.');
    }

    const response = await client.getTestCases(params);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            testCases: response.values || response,
            total: response.total || response.length,
            startAt: response.startAt || 0,
            maxResults: response.maxResults || params.maxResults
          }, null, 2)
        }
      ]
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: formatError(error, 'fetching test cases')
        }
      ],
      isError: true
    };
  }
}

/**
 * Gets detailed information about a specific test case
 */
async function getTestCase(args) {
  try {
    const { testCaseKey } = args;
    if (!testCaseKey) {
      throw new Error('testCaseKey is required');
    }

    if (!config.testCaseKeyPattern.test(testCaseKey)) {
      throw new Error('Invalid testCaseKey format. Must match pattern: [A-Z]+-T[0-9]+');
    }

    const testCase = await client.getTestCase(testCaseKey);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(testCase, null, 2)
        }
      ]
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: formatError(error, `fetching test case ${args.testCaseKey}`)
        }
      ],
      isError: true
    };
  }
}

/**
 * Creates a new test case
 */
async function createTestCase(args) {
  try {
    const {
      name,
      projectKey,
      description,
      folderId,
      component,
      labels,
      objective,
      precondition,
      estimatedTime
    } = args;

    if (!name) {
      throw new Error('name is required');
    }

    if (!projectKey) {
      throw new Error('projectKey is required');
    }

    if (!config.projectKeyPattern.test(projectKey)) {
      throw new Error('Invalid projectKey format. Must match pattern: [A-Z][A-Z_0-9]+');
    }

    const testCaseData = {
      name,
      projectKey
    };

    // Optional fields
    if (description) testCaseData.description = description;
    if (component) testCaseData.component = component;
    if (labels) testCaseData.labels = Array.isArray(labels) ? labels : [labels];
    if (objective) testCaseData.objective = objective;
    if (precondition) testCaseData.precondition = precondition;
    if (estimatedTime) testCaseData.estimatedTime = estimatedTime * 60000; // Convert minutes to milliseconds
    if (folderId) {
      if (typeof folderId === 'string') {
        if (!config.folderIdPattern.test(folderId)) {
          throw new Error('Invalid folderId format. Must be a numeric ID.');
        }
        testCaseData.folderId = parseInt(folderId);
      } else {
        testCaseData.folderId = folderId;
      }
    }

    const result = await client.createTestCase(testCaseData);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            message: 'Test case created successfully',
            testCase: result
          }, null, 2)
        }
      ]
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: formatError(error, 'creating test case')
        }
      ],
      isError: true
    };
  }
}

/**
 * Updates an existing test case
 */
async function updateTestCase(args) {
  try {
    const {
      testCaseKey,
      name,
      description,
      folderId,
      component,
      labels,
      objective,
      precondition,
      estimatedTime
    } = args;

    if (!testCaseKey) {
      throw new Error('testCaseKey is required');
    }

    if (!config.testCaseKeyPattern.test(testCaseKey)) {
      throw new Error('Invalid testCaseKey format. Must match pattern: [A-Z]+-T[0-9]+');
    }

    const currentTestCase = await client.getTestCase(testCaseKey);
    const testCaseData = {
      id: currentTestCase.id,
      key: testCaseKey,
      name: name !== undefined ? name : currentTestCase.name,
      project: {
        id: currentTestCase.project.id
      },
      status: {
        id: currentTestCase.status.id
      },
      priority: {
        id: currentTestCase.priority.id
      },
      folder: {
        id: folderId !== undefined ? folderId : currentTestCase.folder.id
      },
      objective: objective !== undefined ? objective : currentTestCase.objective,
      precondition: precondition !== undefined ? precondition : currentTestCase.precondition,
      estimatedTime: estimatedTime !== undefined
        ? estimatedTime * 60000 // Convert minutes to milliseconds
        : currentTestCase.estimatedTime,
      labels: labels !== undefined
        ? (Array.isArray(labels) ? labels : [labels])
        : currentTestCase.labels || [],
      description: description !== undefined ? description : currentTestCase.description,
      component: component !== undefined ? component : currentTestCase.component,
      owner: currentTestCase.owner,
      customFields: currentTestCase.customFields || {}
    };
    
    const result = await client.updateTestCase(testCaseKey, testCaseData);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            message: 'Test case updated successfully',
            testCase: result
          }, null, 2)
        }
      ]
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: formatError(error, `updating test case ${args.testCaseKey}`)
        }
      ],
      isError: true
    };
  }
}

export const testCaseTools = [
  {
    name: 'list_test_cases',
    description: 'List test cases with optional filtering by project and folder',
    inputSchema: {
      type: 'object',
      properties: {
        projectKey: {
          type: 'string',
          description: 'Jira project key to filter test cases',
          pattern: config.projectKeyPattern.source
        },
        folderId: {
          type: 'integer',
          description: 'Folder ID to filter test cases',
          minimum: 1
        },
        maxResults: {
          type: 'number',
          description: 'Maximum number of results to return (default: 50, max: 1000)',
          minimum: 1,
          maximum: config.maxMaxResults,
          default: config.defaultMaxResults
        },
        startAt: {
          type: 'number',
          description: 'Starting position for pagination (default: 0)',
          minimum: 0,
          default: 0
        }
      }
    },
    handler: listTestCases
  },
  {
    name: 'get_test_case',
    description: 'Get detailed information about a specific test case',
    inputSchema: {
      type: 'object',
      properties: {
        testCaseKey: {
          type: 'string',
          description: 'Test case key to retrieve (format: [A-Z]+-T[0-9]+)',
          pattern: config.testCaseKeyPattern.source
        }
      },
      required: ['testCaseKey']
    },
    handler: getTestCase
  },
  {
    name: 'create_test_case',
    description: 'Create a new test case',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Name of the test case',
          minLength: 1,
          maxLength: 255
        },
        projectKey: {
          type: 'string',
          description: 'Jira project key where the test case will be created',
          pattern: config.projectKeyPattern.source
        },
        description: {
          type: 'string',
          description: 'Description of the test case'
        },
        folderId: {
          type: 'integer',
          description: 'Folder ID where the test case will be created',
          minimum: 1
        },
        component: {
          type: 'integer',
          description: 'Component ID for the test case',
          minimum: 1
        },
        labels: {
          oneOf: [
            { type: 'string' },
            { type: 'array', items: { type: 'string' } }
          ],
          description: 'Labels for the test case (single string or array of strings)'
        },
        objective: {
          type: 'string',
          description: 'Test objective'
        },
        precondition: {
          type: 'string',
          description: 'Test precondition'
        },
        estimatedTime: {
          type: 'integer',
          description: 'Estimated time in minutes (will be converted to milliseconds)',
          minimum: 0
        }
      },
      required: ['name', 'projectKey']
    },
    handler: createTestCase
  },
  {
    name: 'update_test_case',
    description: 'Update an existing test case',
    inputSchema: {
      type: 'object',
      properties: {
        testCaseKey: {
          type: 'string',
          description: 'Test case key to update (format: [A-Z]+-T[0-9]+)',
          pattern: config.testCaseKeyPattern.source
        },
        name: {
          type: 'string',
          description: 'Updated name of the test case',
          minLength: 1,
          maxLength: 255
        },
        description: {
          type: 'string',
          description: 'Updated description of the test case'
        },
        folderId: {
          type: 'integer',
          description: 'Updated folder ID',
          minimum: 1
        },
        component: {
          type: 'integer',
          description: 'Updated component ID',
          minimum: 1
        },
        labels: {
          oneOf: [
            { type: 'string' },
            { type: 'array', items: { type: 'string' } }
          ],
          description: 'Updated labels (single string or array of strings)'
        },
        objective: {
          type: 'string',
          description: 'Updated test objective'
        },
        precondition: {
          type: 'string',
          description: 'Updated test precondition'
        },
        estimatedTime: {
          type: 'integer',
          description: 'Updated estimated time in minutes (will be converted to milliseconds)',
          minimum: 0
        }
      },
      required: ['testCaseKey']
    },
    handler: updateTestCase
  }
];

export default testCaseTools;