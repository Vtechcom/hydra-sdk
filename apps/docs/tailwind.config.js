import typography from '@tailwindcss/typography'

/** @type {import('tailwindcss').Config} */
export default {
	content: {
		files: [
			// all directories and extensions will correspond to your Nuxt config
			'srcDir/components/**/*.{vue,js,jsx,mjs,ts,tsx}',
			'srcDir/layouts/**/*.{vue,js,jsx,mjs,ts,tsx}',
			'srcDir/pages/**/*.{vue,js,jsx,mjs,ts,tsx}',
			'srcDir/plugins/**/*.{js,ts,mjs}',
			'srcDir/composables/**/*.{js,ts,mjs}',
			'srcDir/utils/**/*.{js,ts,mjs}',
			'srcDir/{A,a}pp.{vue,js,jsx,mjs,ts,tsx}',
			'srcDir/{E,e}rror.{vue,js,jsx,mjs,ts,tsx}',
			'srcDir/app.config.{js,ts,mjs}',
			'srcDir/app/spa-loading-template.html'
		]
	},

	theme: {
		extend: {
			fontFamily: {
				mono: ['jetbrains', 'monospace'],
				tiemposFine: ['TestTiemposFine', 'serif'],
				tiemposHeadline: ['TestTiemposHeadline', 'serif'],
				tiemposText: ['TestTiemposText', 'serif']
			},
			colors: {
				white: {
					50: '#ffffff',
					100: '#f8f8f8',
					200: '#e2e2e2',
					300: '#c9c9c9',
					400: '#adadad',
					500: '#919191',
					600: '#747474',
					700: '#565656',
					800: '#3a3a3a',
					900: '#1f1f1f',
					950: '#111111'
				},
				black: {
					50: '#f1f1f1',
					100: '#dbdbdb',
					200: '#bababa',
					300: '#9d9d9d',
					400: '#838383',
					500: '#6b6b6b',
					600: '#545454',
					700: '#3f3f3f',
					800: '#2c2c2c',
					900: '#1a1a1a',
					950: '#000000'
				},
				primary: {
					50: '#EAFBF1',
					100: '#D4F7E3',
					200: '#A8EFC7',
					300: '#7CE7AB',
					400: '#50DF8F',
					500: '#16BD4F', // màu bạn đang dùng
					600: '#139C42',
					700: '#0F7B34',
					800: '#0B5A26',
					900: '#073919'
				},
				secondary: {
					50: '#F2F5F8',
					100: '#E6E9ED',
					200: '#CDD2D7',
					300: '#B0B5BD',
					400: '#939AA3',
					500: '#292D32', // màu bạn đang dùng
					600: '#5A616A',
					700: '#43484E',
					800: '#2C2E31',
					900: '#151618'
				},
				green: {
					25: '#F6FEF9',
					50: '#ECFDF3',
					100: '#D1FADF',
					200: '#A6F4C5',
					300: '#6CE9A6',
					400: '#32D583',
					500: '#12B76A',
					600: '#039855',
					700: '#027A48',
					800: '#05603A',
					900: '#054F31'
				},
				success: {
					25: '#F6FEF9',
					50: '#ECFDF3',
					100: '#D1FADF',
					200: '#A6F4C5',
					300: '#6CE9A6',
					400: '#32D583',
					500: '#12B76A',
					600: '#039855',
					700: '#027A48',
					800: '#05603A',
					900: '#054F31'
				},
				error: {
					25: '#FFFBFA',
					50: '#FEF3F2',
					100: '#FEE4E2',
					200: '#FECDCA',
					300: '#FDA29B',
					400: '#F97066',
					500: '#F04438',
					600: '#D92D20',
					700: '#B42318',
					800: '#912018',
					900: '#7A271A'
				},
				warning: {
					25: '#FFFCF5',
					50: '#FFFAEB',
					100: '#FEF0C7',
					200: '#FEDF89',
					300: '#FEC84B',
					400: '#FDB022',
					500: '#F79009',
					600: '#DC6803',
					700: '#B54708',
					800: '#93370D',
					900: '#7A2E0E'
				},
				gray: {
					25: '#FCFCFD',
					50: '#F9FAFB',
					100: '#F2F4F7',
					200: '#EAECF0',
					300: '#D0D5DD',
					400: '#98A2B3',
					500: '#667085',
					600: '#475467',
					700: '#344054',
					800: '#1D2939',
					900: '#1E2329'
				}
			}
		}
	},
	plugins: [typography()]
}
