// @ts-check
import { defineConfig } from "astro/config"
import node from "@astrojs/node"
import configuration from "./config.json" with { type: "json" }

// https://astro.build/config
export default defineConfig({
	output: "server",
	adapter: node({
		mode: "standalone",
	}),
	integrations: [],
	prefetch: {
		defaultStrategy: "hover",
	},
	trailingSlash: "never",
	server: {
		port: configuration.port
	}
})
