export default ({ env }) => {
	const config: any = {
		// Configuration i18n obligatoire
		i18n: {
			enabled: true,
			config: {
				defaultLocale: 'fr',
				locales: ['fr', 'en', 'it'],
			},
		},
	};
	
	return config;
};
