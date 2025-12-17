# MCP Zephyr Server

A comprehensive Model Context Protocol (MCP) server for Zephyr Scale Cloud API that enables seamless integration with your test management workflows.

## 🚀 Features

### Core Capabilities
- **Project Management**: List and retrieve project details
- **Folder Organization**: Create and manage hierarchical folder structures
- **Test Case Management**: Create, read, and update operations for test cases
- **Test Steps Management**: Get and append test steps (note: no individual step update/delete)
- **Test Script Management**: Create and manage BDD/Gherkin test scripts (mutually exclusive with steps)
- **Reference Data**: Access statuses and priorities for test case configuration

### 🛠️ Available Tools

#### Project Tools
- `list_projects` - Get all Zephyr-integrated Jira projects
- `get_project` - Retrieve detailed project information

#### Folder Tools
- `list_folders` - List folders with project/folder filtering
- `get_folder` - Get detailed folder information
- `create_folder` - Create new folders with optional parent hierarchy

#### Test Case Tools
- `list_test_cases` - List test cases with filtering (project, folder)
- `get_test_case` - Retrieve detailed test case information
- `create_test_case` - Create new test cases with full configuration
- `update_test_case` - Update existing test cases

#### Test Steps Tools
- `get_test_steps` - Get test steps (paged, 100 items max)
- `get_all_test_steps` - Get all test steps (auto-pagination)
- `append_test_steps` - Add new steps to existing sequence (max 100 per request)

#### Test Script Tools
- `get_test_script` - Get BDD/Gherkin test script
- `create_test_script` - Create/update test script (removes existing steps)
- `create_bdd_test_script` - Helper for BDD script creation with validation

#### Reference Data Tools
- `list_statuses` - Get all available statuses (Draft, Ready, Approved, etc.)
- `list_priorities` - Get all available priorities (High, Medium, Low, etc.)
- `get_reference_data` - Get both statuses and priorities in one call

## 📋 Prerequisites

- Node.js 18.0.0 or higher
- Zephyr Scale Cloud account with API access
- Jira project with Zephyr integration enabled

## 🔧 Installation

1. **Clone or download this repository**
2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and add your Zephyr API token:
   ```env
   ZEPHYR_API_TOKEN=your_bearer_token_here
   ZEPHYR_REGION=us
   ```

## 🔑 Getting Your API Token

1. Log in to your Jira Cloud instance
2. Click on your profile picture in the bottom left
3. Select "Zephyr API keys"
4. Generate a new API token
5. Copy the token to your `.env` file

## 🚀 Running the Server

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

### With MCP Client
```bash
# Start the server
npm start

# In another terminal, use with your MCP client
# Configuration will be automatically discovered
```

## 📝 Usage Examples

### Basic Project Operations
```javascript
// List all projects
{
  "tool": "list_projects",
  "arguments": {
    "maxResults": 50
  }
}

// Get specific project
{
  "tool": "get_project",
  "arguments": {
    "projectId": "PROJ"
  }
}
```

### Folder Management
```javascript
// Create a folder
{
  "tool": "create_folder",
  "arguments": {
    "name": "Smoke Tests",
    "projectKey": "PROJ",
    "parentFolderId": "123"
  }
}
```

### Test Case Creation
```javascript
// Create a comprehensive test case
{
  "tool": "create_test_case",
  "arguments": {
    "name": "User Login Test",
    "projectKey": "PROJ",
    "description": "Verify user can log in with valid credentials",
    "priorityName": "High",
    "statusName": "Ready",
    "folderId": "123",
    "component": "Authentication",
    "labels": ["smoke", "regression"],
    "objective": "Verify login functionality",
    "precondition": "User exists in system",
    "estimatedTime": 5
  }
}
```

### Test Steps Management
```javascript
// Append test steps
{
  "tool": "append_test_steps",
  "arguments": {
    "testCaseKey": "PROJ-T1",
    "steps": [
      {
        "description": "Navigate to login page",
        "expectedResult": "Login page is displayed"
      },
      {
        "description": "Enter valid username and password",
        "expectedResult": "Credentials are accepted"
      },
      {
        "description": "Click login button",
        "expectedResult": "User is logged in and redirected to dashboard"
      }
    ]
  }
}
```

### BDD Test Script Creation
```javascript
// Create BDD script with helper
{
  "tool": "create_bdd_test_script",
  "arguments": {
    "testCaseKey": "PROJ-T2",
    "feature": "User Authentication",
    "scenario": "Successful login with valid credentials",
    "steps": [
      "Given I am on the login page",
      "And I have valid user credentials",
      "When I enter my username and password",
      "And I click the login button",
      "Then I should be redirected to the dashboard",
      "And I should see my username displayed"
    ]
  }
}
```

### Get Reference Data
```javascript
// Get all statuses and priorities
{
  "tool": "get_reference_data"
}
```

## ⚠️ Important Notes

### Test Steps vs Test Scripts
- **Mutually Exclusive**: A test case can have either test steps OR a test script, not both
- **Script Creation Warning**: Creating a test script automatically removes existing test steps
- **Step Limitations**: Individual test steps cannot be updated or deleted, only appended in batches

### API Constraints
- **Pagination**: Most endpoints support pagination (max 1000 items per request)
- **Step Limits**: Maximum 100 test steps can be added per request
- **Rate Limits**: Respect Zephyr Cloud API rate limits
- **Region Support**: US and EU regions supported via configuration

### Data Format
- **Test Case Keys**: Format `[A-Z]+-T[0-9]+` (e.g., `PROJ-T1`)
- **Project Keys**: Format `[A-Z][A-Z_0-9]+` (e.g., `PROJ`, `PROJ123`)
- **Folder IDs**: Numeric strings (e.g., `"123"`)
- **Test Scripts**: Gherkin format for BDD, plain text for simple scripts

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm test -- --coverage
```

## 🔍 Code Quality

```bash
# Run linter
npm run lint

# Fix linting issues
npm run lint:fix
```

## 🏗️ Project Structure

```
mcp-zephyr/
├── src/
│   ├── config.js              # Configuration management
│   ├── zephyr-client.js       # API client with error handling
│   ├── index.js               # Main MCP server entry point
│   └── tools/                 # MCP tool implementations
│       ├── project-tools.js
│       ├── folder-tools.js
│       ├── test-case-tools.js
│       ├── test-steps-tools.js
│       ├── test-script-tools.js
│       └── reference-data-tools.js
├── tests/                     # Unit tests
│   ├── setup.js
│   ├── config.test.js
│   ├── zephyr-client.test.js
│   └── tools/
│       └── project-tools.test.js
├── .env.example               # Environment template
├── package.json               # Dependencies and scripts
├── eslint.config.js           # ESLint configuration
├── jest.config.js             # Jest test configuration
└── README.md                  # This file
```

## 🔌 MCP Integration

This server implements the Model Context Protocol specification:

- **Tool Discovery**: Automatic tool listing via `ListToolsRequestSchema`
- **Tool Execution**: Standardized tool calling via `CallToolRequestSchema`
- **Error Handling**: Consistent error responses for all operations
- **JSON Schema**: Input validation for all tool parameters

## 🐛 Troubleshooting

### Common Issues

1. **"ZEPHYR_API_TOKEN environment variable is required"**
   - Ensure you've created `.env` file with a valid API token
   - Check that the token is not expired

2. **"Invalid testCaseKey format"**
   - Test case keys must match pattern `[A-Z]+-T[0-9]+`
   - Examples: `PROJ-T1`, `PROJECT123-T456`

3. **"Request timeout"**
   - Check your internet connection
   - Try reducing `maxResults` parameter for large requests

4. **"Test case not found"**
   - Verify the test case key exists in your Zephyr instance
   - Ensure you have proper project permissions

### Debug Mode

Enable debug logging by setting the environment variable:
```bash
DEBUG=* npm start
```

## 📄 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run the test suite
6. Submit a pull request

## 🆘 Support

- **Zephyr Documentation**: [Zephyr Scale Cloud API Docs](https://support.smartbear.com/zephyr-scale-cloud/api-docs/)
- **MCP Specification**: [Model Context Protocol](https://modelcontextprotocol.io/)
- **Issues**: Report bugs via GitHub Issues