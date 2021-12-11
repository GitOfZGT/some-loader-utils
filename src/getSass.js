import { v5 as uuidv5 } from 'uuid';

import {
    getScopeProcessResult,
    getAllStyleVarFiles,
    getVarsContent,
    createArbitraryModeVarColors,
    getPluginParams,
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

    const { render } = sass;

    // eslint-disable-next-line func-names
    sass.render = function (options = {}, callback) {
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
                if (defaultPluginOpt.arbitraryMode) {
                    createArbitraryModeVarColors(varscontent);
                }
                return preProcessor(
                    `${file.varsContent || ''}${varscontent}\n${
                        renderOptions.data
                    }`
                );
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
                    // sass-loader v8.x 没有传入renderOptions.file, 用uuid生成一个，防止报错
                    renderOptions.file ||
                        (renderOptions.data &&
                            uuidv5(
                                renderOptions.data,
                                '4725327a-3250-4226-86cf-ae5ce775795b'
                            )),
                    defaultPluginOpt.includeStyleWithColors,
                    defaultPluginOpt.arbitraryMode,
                    defaultPluginOpt.extract
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
