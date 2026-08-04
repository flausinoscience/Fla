#!/usr/bin/env node

import { render } from "ink";
import AgentBanner from "./ui/Banner.js";
import { App } from "./ui/App.js";

const asciiArt = `
┏┓┓        ┓•
┣ ┃┏┓  ┏┏┓┏┫┓┏┓┏┓  ┏┓┏┓┏┓┏┓╋
┻ ┗┗┻  ┗┗┛┗┻┗┛┗┗┫  ┗┻┗┫┗ ┛┗┗
                ┛     ┛     `;

const bannerInstance = render(
  <AgentBanner
    asciiArt={asciiArt}
    model="gemma (mock)"
    projectFolder="~/projects/demo"
    gitBranch="main"
    contextMaxTokens={8192}
  />,
);
bannerInstance.unmount();

render(<App />);
