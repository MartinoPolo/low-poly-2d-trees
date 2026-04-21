export default {
	extends: ['stylelint-config-standard', 'stylelint-config-html/svelte'],
	rules: {
		'at-rule-no-unknown': [
			true,
			{ ignoreAtRules: ['custom-variant', 'theme', 'utility', 'plugin', 'source'] },
		],
		'selector-pseudo-class-no-unknown': [true, { ignorePseudoClasses: ['global'] }],
		'custom-property-empty-line-before': null,
		'import-notation': 'string',
	},
};
