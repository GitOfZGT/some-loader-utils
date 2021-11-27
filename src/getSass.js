import {
    getScopeProcessResult,
    getAllStyleVarFiles,
    getVarsContent,
    removeThemeFiles,
    createArbitraryModeVarColors
    // eslint-disable-next-line import/no-extraneous-dependencies
} from './utils';

/**
 *
 * @param {Object} opt
 * @param {Object} opt.implementation
 * @param {Function} opt.getMultipleScopeVars
 * @returns sass
 */
export function getSass(opt = {}) {
    const packname = 'sass';

    let sass = opt.implementation;
    if (!sass) {
        try {
            sass = require(packname);
        } catch (e) {
            throw new Error(
                `Dependency "${packname}" not found. Did you install it?`
            );
        }
    }

    removeThemeFiles();

    const { render } = sass;

    // eslint-disable-next-line func-names
    sass.render = function (options = {}, callback) {
        const renderOptions = { ...options };

        const multipleScopeVars =
            typeof opt.getMultipleScopeVars === 'function'
                ? opt.getMultipleScopeVars(renderOptions)
                : renderOptions.multipleScopeVars;

        delete renderOptions.multipleScopeVars;

        const allStyleVarFiles = getAllStyleVarFiles(
            {
                emitError: (msg) => {
                    throw new Error(msg);
                },
            },
            { multipleScopeVars, arbitraryMode: opt.arbitraryMode }
        );
        const preProcessor = (code) =>
            new Promise((resolve, reject) => {
                render.call(
                    sass,
                    { ...renderOptions, data: code },
                    (err, res) => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve(res);
                        }
                    }
                );
            });
        let cssResult = {};
        // 按allStyleVarFiles的个数对当前文件编译多次得到多个结果
        const rePromise = Promise.all(
            allStyleVarFiles.map((file) => {
                const varscontent = getVarsContent(file.path, packname);
                if(opt.arbitraryMode){
                    createArbitraryModeVarColors(varscontent)
                }
                return preProcessor(`${varscontent}\n${renderOptions.data}`);
            })
        )
            .then((prs) => {
                // eslint-disable-next-line prefer-destructuring
                cssResult = prs[0];

                return getScopeProcessResult(
                    prs.map((item) => {
                        return {
                            ...item,
                            code: item.css.toString(),
                            deps: item.stats.includedFiles,
                        };
                    }),
                    allStyleVarFiles,
                    renderOptions.file,
                    opt.arbitraryMode
                );
            })

            .then((result) => {
                cssResult.css = result.code;
                cssResult.stats.includedFiles = result.deps;

                if (callback) {
                    callback(null, cssResult);
                    return null;
                }

                return cssResult;
            });
        if (callback) {
            rePromise.catch(callback);
        }
        return rePromise;
    };
    return sass;
}

export default getSass;
