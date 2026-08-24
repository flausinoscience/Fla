#!/usr/bin/env node

import { render } from "ink";
import AgentBanner from "./ui/Banner.js";
import App from "./ui/App.js";
import { createToolRegistry } from "./agent/toolRegistry.js";
import createOllamaProvider from "./agent/llmAdapters/ollamaAdapter.js";

const asciiArt = `
┏┓┓        ┓•
┣ ┃┏┓  ┏┏┓┏┫┓┏┓┏┓  ┏┓┏┓┏┓┏┓╋
┻ ┗┗┻  ┗┗┛┗┻┗┛┗┗┫  ┗┻┗┫┗ ┛┗┗
                ┛     ┛     `;

const registry = createToolRegistry({ workspaceRoot: process.cwd() });
const systemPrompt = "You are a coding agent called Fla.";
const provider = createOllamaProvider({ model: "gemma4:e2b-it-qat" });

const bannerInstance = render(
  <AgentBanner
    asciiArt={asciiArt}
    model="not yet wired"
    projectFolder={process.cwd()}
    gitBranch="main"
    contextMaxTokens={8192}
  />,
);
bannerInstance.unmount();

render(<App provider={provider} registry={registry} systemPrompt={systemPrompt} />);
