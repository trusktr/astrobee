const path = require('path')
const HtmlPlugin = require('html-webpack-plugin')
const CopyPlugin = require('copy-webpack-plugin')

const outputPath = 'dist'

module.exports = {
	entry: './src/index.tsx',
	output: {path: path.resolve(outputPath), filename: 'index.js'},
	devServer: {contentBase: outputPath},
	resolve: {
		extensions: ['.js', '.ts', '.tsx'],
		alias: {
			// Prevent duplicates of these libraries from being included in the output bundle.
			'@lume/element': path.resolve('node_modules', '@lume/element'),
		},
	},

	module: {
		rules: [
			/**
			 * Source maps
			 */
			{test: /\.js$/, use: ['source-map-loader'], enforce: 'pre'},

			/**
			 * TypeScript
			 */
			{test: /\.ts$/, exclude: /node_modules/, use: [{loader: 'ts-loader', options: {transpileOnly: true}}]},

			/**
			 * TypeScript with LUME-flavored JSX
			 */
			{
				test: /\.tsx$/,
				exclude: /node_modules/,
				use: [
					{loader: 'babel-loader', options: {presets: ['@lume/element/babel-preset.cjs']}},
					{loader: 'ts-loader', options: {transpileOnly: true}},
				],
			},

			/**
			 * Assets
			 * The 'limit: -1' causes all assets to be external (thus cacheable by the browser)
			 */
			{
				test: /\.(dae|jpg)$/,
				exclude: [],
				use: [{loader: 'url-loader', options: {limit: -1, name: '[path][name].[hash].[ext]'}}],
			},
		],
	},
	plugins: [
		// Copies index.html to dist (in dev mode with dev server copies it to memory instead)
		new HtmlPlugin({template: './src/index.html', hash: true}),
		new CopyPlugin({patterns: [{from: 'src/materials/*.png', to: './'}]}),
	],
	devtool: 'source-map',
}
