import { type Plugin } from "@elizaos/core";
import { emotionalMemoryProvider } from "./providers/emotionalMemory.js";

export const solacePlugin: Plugin = {
  name: "solace-plugin",
  description: "Emotional memory and adaptive tone for the Aya agent.",
  actions: [],
  providers: [emotionalMemoryProvider],
  evaluators: [],
};

export default solacePlugin;
