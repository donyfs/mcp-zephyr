/**
 * MCP Tools for Zephyr Project Management
 */

import ZephyrClient from '../zephyr-client.js';
import { config } from '../config.js';
import { formatError } from '../utils/error-handler.js';

const client = new ZephyrClient();

/**
 * Lists all Zephyr-integrated Jira projects
 */
async function listProjects(args) {
  try {
    const params = {
      maxResults: args.maxResults || config.defaultMaxResults,
      startAt: args.startAt || 0
    };

    const response = await client.getProjects(params);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            projects: response.values || response,
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
          text: formatError(error, 'fetching projects')
        }
      ],
      isError: true
    };
  }
}

/**
 * Gets detailed information about a specific project
 */
async function getProject(args) {
  try {
    const { projectId } = args;
    if (!projectId) {
      throw new Error('projectId is required');
    }

    const project = await client.getProject(projectId);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(project, null, 2)
        }
      ]
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: formatError(error, `fetching project ${args.projectId}`)
        }
      ],
      isError: true
    };
  }
}

export const projectTools = [
  {
    name: 'list_projects',
    description: 'List all Zephyr-integrated Jira projects',
    inputSchema: {
      type: 'object',
      properties: {
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
    handler: listProjects
  },
  {
    name: 'get_project',
    description: 'Get detailed information about a specific Zephyr project',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: {
          type: 'string',
          description: 'Project ID or key to retrieve',
          pattern: '^[A-Z][A-Z_0-9]+$|^\\d+$'
        }
      },
      required: ['projectId']
    },
    handler: getProject
  }
];

export default projectTools;