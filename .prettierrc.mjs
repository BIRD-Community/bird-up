/** @type {import("prettier").Config} */
export default {
	semi: false,
	plugins: ["prettier-plugin-astro", "prettier-plugin-drone-class"],
	overrides: [
		{
			files: "*.astro",
			options: {
				parser: "astro",
				astroAllowShorthand: true,
			},
		},
	],
	printWidth: Infinity,
	trailingComma: "es5",
	useTabs: true,
	endOfLine: "auto",
}
