/**
 * Configuration management for MCP Zephyr Server
 */

import { config as dotenvConfig } from 'dotenv';
// 17.2.3 is noisy, silence it
const originalLog = console.log;
console.log = function () { }; // No-op
dotenvConfig();
console.log = originalLog; // Restore

const getBaseUrl = () => {
  const region = process.env.ZEPHYR_REGION?.toLowerCase() || 'us';

  if (process.env.ZEPHYR_BASE_URL) {
    return process.env.ZEPHYR_BASE_URL;
  }

  const baseUrls = {
    us: 'https://api.zephyrscale.smartbear.com/v2',
    eu: 'https://eu.api.zephyrscale.smartbear.com/v2'
  };

  return baseUrls[region] || baseUrls.us;
};

const getApiToken = () => {
  const token = process.env.ZEPHYR_API_TOKEN;
  if (!token) {
    throw new Error('ZEPHYR_API_TOKEN environment variable is required');
  }
  return token;
};

export const config = {
  baseUrl: getBaseUrl(),
  apiToken: getApiToken(),
  region: process.env.ZEPHYR_REGION?.toLowerCase() || 'us',

  // API request settings
  timeout: 30000, // 30 seconds
  maxRetries: 3,
  retryDelay: 1000, // 1 second

  // Pagination defaults
  defaultMaxResults: 50,
  maxMaxResults: 1000,

  // Validation
  projectKeyPattern: /^[A-Z][A-Z_0-9]+$/,
  testCaseKeyPattern: /.+-T[0-9]+/,
  testCycleKeyPattern: /([0-9]+)|(.+-R[0-9]+)/,
  folderIdPattern: /^\d+$/,
  priorityIdPattern: /^\d+$/,
  statusIdPattern: /^\d+$/
};

export default config;