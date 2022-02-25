import pack from '../package.json';

export function getCurrentPackRequirePath() {
    const targetRsoleved = require
        .resolve(pack.name)
        .replace(/[\\/]dist[\\/]index\.js$/, '')
        .replace(/\\/g, '/');
    return targetRsoleved;
}

export default {};
