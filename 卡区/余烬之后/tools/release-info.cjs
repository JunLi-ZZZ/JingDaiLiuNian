const config = require('../card.config.cjs');
const { version } = require('../package.json');
const releaseName = `${config.name} v${version}`;
module.exports = { version, releaseName, worldbookName: releaseName, artifactStem: `${config.name}-${version}` };
