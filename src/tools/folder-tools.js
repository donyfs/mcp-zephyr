/**
 * MCP Tools for Zephyr Folder Management
 */

import ZephyrClient from '../zephyr-client.js';
import { config } from '../config.js';
import { formatError } from '../utils/error-handler.js';

const client = new ZephyrClient();

/**
 * Lists folders in a project or specific folder
 */
async function listFolders(args) {
  try {
    const params = {
      projectKey: args.projectKey,
      folderId: args.folderId,
      maxResults: args.maxResults || config.defaultMaxResults,
      startAt: args.startAt || 0
    };

    const response = await client.getFolders(params);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            folders: response.values || response,
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
          text: formatError(error, 'fetching folders')
        }
      ],
      isError: true
    };
  }
}

/**
 * Gets detailed information about a specific folder
 */
async function getFolder(args) {
  try {
    const { folderId } = args;
    if (!folderId) {
      throw new Error('folderId is required');
    }

    if (!config.folderIdPattern.test(folderId)) {
      throw new Error('Invalid folderId format. Must be a numeric ID.');
    }

    const folder = await client.getFolder(folderId);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(folder, null, 2)
        }
      ]
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: formatError(error, `fetching folder ${args.folderId}`)
        }
      ],
      isError: true
    };
  }
}

/**
 * Creates a new folder
 */
async function createFolder(args) {
  try {
    const { name, projectKey, parentFolderId, folderType } = args;

    if (!name) {
      throw new Error('folder name is required');
    }

    if (!projectKey) {
      throw new Error('projectKey is required');
    }

    if (!config.projectKeyPattern.test(projectKey)) {
      throw new Error('Invalid projectKey format. Must match pattern: [A-Z][A-Z_0-9]+');
    }

    // Validate folderType against allowed enum values
    const validFolderTypes = ['TEST_CASE', 'TEST_PLAN', 'TEST_CYCLE'];
    const selectedFolderType = folderType || 'TEST_CASE';

    if (!validFolderTypes.includes(selectedFolderType)) {
      throw new Error(`folderType must be one of: ${validFolderTypes.join(', ')}`);
    }

    const folderData = {
      name,
      projectKey,
      folderType: selectedFolderType
    };

    if (parentFolderId) {
      if (!config.folderIdPattern.test(parentFolderId)) {
        throw new Error('Invalid parentFolderId format. Must be a numeric ID.');
      }
      folderData.parentId = parseInt(parentFolderId);
    }

    const result = await client.createFolder(folderData);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            message: 'Folder created successfully',
            folder: result
          }, null, 2)
        }
      ]
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: formatError(error, 'creating folder')
        }
      ],
      isError: true
    };
  }
}

export const folderTools = [
  {
    name: 'list_folders',
    description: 'List folders in a project or specific folder',
    inputSchema: {
      type: 'object',
      properties: {
        projectKey: {
          type: 'string',
          description: 'Jira project key to filter folders',
          pattern: config.projectKeyPattern.source
        },
        folderId: {
          type: 'string',
          description: 'Parent folder ID to list subfolders',
          pattern: config.folderIdPattern.source
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
    handler: listFolders
  },
  {
    name: 'get_folder',
    description: 'Get detailed information about a specific folder',
    inputSchema: {
      type: 'object',
      properties: {
        folderId: {
          type: 'string',
          description: 'Folder ID to retrieve',
          pattern: config.folderIdPattern.source
        }
      },
      required: ['folderId']
    },
    handler: getFolder
  },
  {
    name: 'create_folder',
    description: 'Create a new folder in a project',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Name of the folder to create',
          minLength: 1,
          maxLength: 255
        },
        projectKey: {
          type: 'string',
          description: 'Jira project key where the folder will be created',
          pattern: config.projectKeyPattern.source
        },
        parentFolderId: {
          type: 'string',
          description: 'Optional parent folder ID to create a subfolder',
          pattern: config.folderIdPattern.source
        },
        folderType: {
          type: 'string',
          description: 'Folder type (default: TEST_CASE)',
          enum: ['TEST_CASE', 'TEST_PLAN', 'TEST_CYCLE'],
          default: 'TEST_CASE'
        }
      },
      required: ['name', 'projectKey']
    },
    handler: createFolder
  }
];

export default folderTools;