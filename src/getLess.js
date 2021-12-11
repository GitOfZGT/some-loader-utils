import {
    getScopeProcessResult,
    getAllStyleVarFiles,
    getVarsContent,
    createArbitraryModeVarColors,
    getPluginParams,
} from './utils';
/**
 *
 * @param {Object} opt
 * @param {Object} opt.implementation
 * @param {Function} opt.getMultipleScopeVars
 * @returns less
 */
export function getLess(opt = {}) {
    const packname = 'less';
    let less = opt.implementation;
    if (!less) {
        try {
            less = require(packname);
        } catch (e) {
            throw new Error(
                `Dependency "${packname}" not found. Did you install it?`
            );
        }
    }
    const { render } = less;
    // eslint-disable-next-line func-names
    less.render = function (input, options = {}, callback) {
        const renderOptions = { ...options };
        const defaultPluginOpt = getPluginParams(opt);
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
            { multipleScopeVars, arbitraryMode: defaultPluginOpt.arbitraryMode }
        );
        const preProcessor = (code) => render.call(less, code, renderOptions);
        // 按allStyleVarFiles的个数对当前文件编译多次得到多个结果
        const rePromise = Promise.all(
            allStyleVarFiles.map((file) => {
                const varscontent = getVarsContent(file.path, packname);
                if (defaultPluginOpt.arbitraryMode) {
                    createArbitraryModeVarColors(varscontent);
                }

                return preProcessor(
                    `${input}\n${varscontent}\n${file.varsContent || ''}`
                );
            })
        )
            .then((prs) =>
                getScopeProcessResult(
                    prs.map((item) => {
                        return { ...item, code: item.css, deps: item.imports };
                    }),
                    allStyleVarFiles,
                    renderOptions.filename,
                    defaultPluginOpt.includeStyleWithColors,
                    defaultPluginOpt.arbitraryMode,
                    defaultPluginOpt.extract
                )
            )
            .then((result) => {
                const cssResult = {
                    css: result.code,
                    imports: result.deps,
                    map: result.map,
                };
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
    return less;
}

export default getLess;
