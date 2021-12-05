#!/usr/bin/env node
import cac from 'cac';

import fs from 'fs-extra';

import pack from '../../package.json';

import { getCurrentPackRequirePath } from '../packPath';

const cli = cac();
const init = (optionName) => {
    const targetRsoleved = getCurrentPackRequirePath();
    if (fs.existsSync(`${targetRsoleved}/customThemeOptions.json`)) {
        try {
            const opts = JSON.parse(
                fs
                    .readFileSync(`${targetRsoleved}/customThemeOptions.json`)
                    .toString()
            );
            console.log(
                !optionName ? opts : { [optionName]: opts[optionName] }
            );
            // eslint-disable-next-line no-empty
        } catch (e) {}
    }
};
cli.command('inspect [optionName]', 'inspect setCustomTheme options').action(
    init
);
cli.command('ins [optionName]', 'inspect setCustomTheme options').action(init);
cli.help();
cli.version(pack.version);
cli.parse();
