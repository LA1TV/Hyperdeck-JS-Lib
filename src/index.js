// Here we export what we want to be accessible from the library to the developer

module.exports = {
	Hyperdeck: require('./hyperdeck/hyperdeck'),
	HyperdeckCore: require('./hyperdeck/hyperdeck-core'),
	Logger: require('./logger')
};