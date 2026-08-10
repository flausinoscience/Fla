#!/usr/bin/env node

import { render } from "ink";
import AgentBanner from "./ui/Banner.js";
import App from "./ui/App.js";
import { createToolRegistry } from "./agent/toolRegistry.js";

const asciiArt = `
┏┓┓        ┓•
┣ ┃┏┓  ┏┏┓┏┫┓┏┓┏┓  ┏┓┏┓┏┓┏┓╋
┻ ┗┗┻  ┗┗┛┗┻┗┛┗┗┫  ┗┻┗┫┗ ┛┗┗
                ┛     ┛     `;

const registry = createToolRegistry({ workspaceRoot: process.cwd() });
const systemPrompt = "...";

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

render(
  <App
    provider={/* ollamaAdapter still stubbed */}
    registry={registry}
    systemPrompt={systemPrompt}
  />,
);
