# Objective

A powerful visual interface for creating AI-powered data generation workflows with cost management and version control.

## Overview

Objective is a Next.js application that provides a streamlined dashboard for building structured data generation pipelines using various OpenAI models (GPT-4, o1, o3 series, and more). The application features a three-column workflow that guides you from input configuration through AI generation to structured output.

## Key Features

### 🎯 **Three-Column Workflow**

- **Input Column**: Configure data sources (manual strings or API fetch requests)
- **Generator Column**: Set up AI models with custom system messages and JSON schemas
- **Output Column**: View generated results with detailed cost and token analytics

### 🤖 **AI Model Support**

- Latest GPT models (GPT-4.1, GPT-4o series)
- Reasoning models (o1, o3 series) with special reasoning capabilities
- Real-time cost estimation and token counting
- Model comparison with pricing per million tokens

### 📋 **Schema Management**

- Visual schema builder for structured data generation
- Raw JSON schema editing with code editor
- Schema import/export functionality
- Real-time schema validation and preview

### 💰 **Cost Management**

- Real-time token counting for inputs, system messages, and schemas
- Accurate cost estimation before generation
- High-cost warnings and context size limits
- Model recommendations for cost optimization

### 🔄 **Version Control**

- Save and manage different versions of input configurations
- Generator card versioning with rollback capabilities
- Track changes with unsaved state indicators
- Compare different configuration versions

### ⚡ **Advanced Features**

- AI-assisted prompt and schema generation
- Fetch request configuration for API data sources
- Token visualization and breakdown analysis
- Responsive design with mobile support
- Dark/light theme support

## Use Cases

- **Data Generation**: Create structured datasets using AI models
- **API Testing**: Test and validate API responses with AI processing
- **Prompt Engineering**: Develop and iterate on AI prompts with cost tracking
- **Schema Design**: Build and test JSON schemas for data validation
- **Workflow Automation**: Create reusable AI data processing pipelines

## Technology Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS, Radix UI components
- **AI Integration**: AI SDK with OpenAI support
- **State Management**: Zustand
- **Token Analysis**: Tiktoken for accurate token counting
- **Validation**: Zod for schema validation

## Getting Started

1. Clone the repository
2. Install dependencies: `pnpm install`
3. Run the development server: `pnpm dev`
4. Open [http://localhost:3000](http://localhost:3000) in your browser

## License

This project is private and proprietary.
