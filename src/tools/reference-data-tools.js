/**
 * MCP Tools for Zephyr Reference Data (Statuses and Priorities)
 */

import ZephyrClient from '../zephyr-client.js';
import { formatError } from '../utils/error-handler.js';

const client = new ZephyrClient();

/**
 * Lists all available statuses in Zephyr
 */
async function listStatuses() {
  try {
    const statuses = await client.getStatuses();

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            statuses: statuses.values || statuses,
            total: statuses.total || statuses.length,
            note: 'These statuses can be used when creating or updating test cases'
          }, null, 2)
        }
      ]
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: formatError(error, 'fetching statuses')
        }
      ],
      isError: true
    };
  }
}

/**
 * Lists all available priorities in Zephyr
 */
async function listPriorities() {
  try {
    const priorities = await client.getPriorities();

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            priorities: priorities.values || priorities,
            total: priorities.total || priorities.length,
            note: 'These priorities can be used when creating or updating test cases'
          }, null, 2)
        }
      ]
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: formatError(error, 'fetching priorities')
        }
      ],
      isError: true
    };
  }
}

/**
 * Gets both statuses and priorities in a single call
 */
async function getReferenceData() {
  try {
    const [statusesResponse, prioritiesResponse] = await Promise.all([
      client.getStatuses(),
      client.getPriorities()
    ]);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            statuses: statusesResponse.values || statusesResponse,
            priorities: prioritiesResponse.values || prioritiesResponse,
            summary: {
              totalStatuses: (statusesResponse.values || statusesResponse).length,
              totalPriorities: (prioritiesResponse.values || prioritiesResponse).length
            },
            usage: 'Use these values for statusName and priorityName fields when creating/updating test cases'
          }, null, 2)
        }
      ]
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: formatError(error, 'fetching reference data')
        }
      ],
      isError: true
    };
  }
}

export const referenceDataTools = [
  {
    name: 'list_statuses',
    description: 'List all available test case statuses (e.g., Draft, Ready, Approved)',
    inputSchema: {
      type: 'object',
      properties: {}
    },
    handler: listStatuses
  },
  {
    name: 'list_priorities',
    description: 'List all available test case priorities (e.g., High, Medium, Low)',
    inputSchema: {
      type: 'object',
      properties: {}
    },
    handler: listPriorities
  },
  {
    name: 'get_reference_data',
    description: 'Get all reference data (statuses and priorities) in a single call',
    inputSchema: {
      type: 'object',
      properties: {}
    },
    handler: getReferenceData
  }
];

export default referenceDataTools;