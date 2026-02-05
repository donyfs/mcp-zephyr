/**
 * Zephyr Scale Cloud API Client
 */

import axios from 'axios';
import config from './config.js';

class ZephyrClient {
  constructor() {
    this.client = axios.create({
      baseURL: config.baseUrl,
      timeout: config.timeout,
      headers: {
        'Authorization': `Bearer ${config.apiToken}`
      }
    });

    // Request interceptor for debugging
    this.client.interceptors.request.use(
      (request) => {
        console.debug(`[Zephyr API] ${request.method?.toUpperCase()} ${request.url}`);
        return request;
      },
      (error) => {
        console.error('[Zephyr API] Request error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => {
        console.debug(`[Zephyr API] Response ${response.status} from ${response.config.url}`);
        return response;
      },
      (error) => {
        const errorDetails = {
          status: error.response?.status,
          statusText: error.response?.statusText,
          url: error.config?.url,
          method: error.config?.method?.toUpperCase(),
          message: error.message,
          requestData: error.config?.data,
          params: error.config?.params
        };
        // Include response data if available
        if (error.response?.data) {
          errorDetails.responseData = error.response.data;
        }

        console.error('[Zephyr API] Response error:', errorDetails);
        return Promise.reject(errorDetails);
      }
    );
  }

  async request(method, url, data = null, params = {}) {
    const response = await this.client.request({
      method,
      url,
      data,
      params: {
        ...params,
        // Remove null/undefined values
        ...Object.fromEntries(
          // eslint-disable-next-line no-unused-vars
          Object.entries(params).filter(([_, value]) => value != null)
        )
      }
    });
    return response.data;

  }

  // Utility methods for pagination
  async getAllPaginated(requestFn, maxResults = config.defaultMaxResults) {
    const allResults = [];
    let startAt = 0;

    while (true) {
      const response = await requestFn({ maxResults, startAt });

      if (response.values) {
        allResults.push(...response.values);
      } else if (Array.isArray(response)) {
        allResults.push(...response);
      }

      // Check if we have all results
      const total = response.total || response.size;
      if (allResults.length >= total || response.values?.length < maxResults) {
        break;
      }

      startAt += maxResults;
    }

    return allResults;
  }

  // Projects
  async getProjects(params = {}) {
    return this.request('GET', '/projects', null, params);
  }

  async getProject(projectId) {
    return this.request('GET', `/projects/${projectId}`);
  }

  // Folders
  async getFolders(params = {}) {
    return this.request('GET', '/folders', null, params);
  }

  async getFolder(folderId) {
    return this.request('GET', `/folders/${folderId}`);
  }

  async createFolder(folderData) {
    return this.request('POST', '/folders', folderData);
  }

  // Test Cases
  async getTestCases(params = {}) {
    return this.request('GET', '/testcases', null, params);
  }

  async getTestCase(testCaseKey) {
    return this.request('GET', `/testcases/${testCaseKey}`);
  }

  async createTestCase(testCaseData) {
    return this.request('POST', '/testcases', testCaseData);
  }

  async updateTestCase(testCaseKey, testCaseData) {
    return this.request('PUT', `/testcases/${testCaseKey}`, testCaseData);
  }

  // Test Steps
  async getTestSteps(testCaseKey, params = {}) {
    return this.request('GET', `/testcases/${testCaseKey}/teststeps`, null, params);
  }

  async appendTestSteps(testCaseKey, stepsData) {
    return this.request('POST', `/testcases/${testCaseKey}/teststeps`, stepsData);
  }

  // Test Script
  async getTestScript(testCaseKey) {
    return this.request('GET', `/testcases/${testCaseKey}/testscript`);
  }

  async createTestScript(testCaseKey, scriptData) {
    return this.request('POST', `/testcases/${testCaseKey}/testscript`, scriptData);
  }

  // Statuses and Priorities
  async getStatuses() {
    return this.request('GET', '/statuses');
  }

  async getPriorities() {
    return this.request('GET', '/priorities');
  }
}

export default ZephyrClient;