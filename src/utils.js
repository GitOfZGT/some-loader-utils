import fs from 'fs';

import postcss from 'postcss';
import postcssMergeRules from 'postcss-merge-rules-plus';

const getAllStyleVarFiles = (loaderContext, options) => {
    const styleVarFiles = options.multipleScopeVars;
    let allStyleVarFiles = [{ scopeName: '', path: '' }];
    if (Array.isArray(styleVarFiles)) {
        allStyleVarFiles = styleVarFiles.filter((item) => {
            if (!item.scopeName) {
                loaderContext.emitError(
                    new Error('Not found scopeName in multipleScopeVars')
                );
                return false;
            }
            if (Array.isArray(item.path)) {
                return item.path.every((pathstr) => {
                    const exists = pathstr && fs.existsSync(pathstr);
                    if (!exists) {
                        loaderContext.emitError(
                            new Error(
                                `Not found path: ${pathstr} in multipleScopeVars`
                            )
                        );
                    }
                    return exists;
                });
            }
            if (
                !item.path ||
                typeof item.path !== 'string' ||
                !fs.existsSync(item.path)
            ) {
                loaderContext.emitError(
                    new Error(
                        `Not found path: ${item.path} in multipleScopeVars`
                    )
                );
                return false;
            }
            return true;
        });
    }
    return allStyleVarFiles;
};

const cssFragReg = /[^{}/\\]+{[^{}]*?}/g;
const classNameFragReg = /[^{}/\\]+(?={)/;

const filterKeyFrames = (codes = []) =>
    codes.filter((code) => !/^\s*(@keyframes|from|to|\d+%)/i.test(code));

const addScopeName = (css, scopeName) => {
    const splitCodes = filterKeyFrames(css.match(cssFragReg) || []);

    if (splitCodes.length && scopeName) {
        const fragments = [];
        const resultCode = splitCodes.reduce((codes, curr) => {
            const replacerFragment = curr.replace(classNameFragReg, (a) =>
                a.split(',').reduce((tol, c) => {
                    if (/^\s*html/i.test(c)) {
                        return tol.replace(
                            c,
                            `html.${scopeName}${c.replace(/^\s*html/i, '')}`
                        );
                    }
                    return tol.replace(c, `.${scopeName}\x20${c}`);
                }, a)
            );
            fragments.push(replacerFragment);
            return codes.replace(curr, replacerFragment);
        }, css);
        return {
            cssCode: resultCode,
            sourceFragments: splitCodes,
            fragments,
        };
    }

    return {
        cssCode: css,
        sourceFragments: splitCodes,
        fragments: splitCodes,
    };
};
const removeSameSelector = (css, scopeNames = []) => {
    const splitCodes = filterKeyFrames(css.match(cssFragReg) || []);
    if (
        typeof css === 'string' &&
        css &&
        splitCodes.length &&
        scopeNames.length > 1
    ) {
        const resultCode = splitCodes.reduce((codes, curr) => {
            const replacerFragment = curr.replace(classNameFragReg, (a) => {
                let selectorGroup = a.split(',');
                if (selectorGroup.length > 1) {
                    const isRepeatSeletors = scopeNames.every((name) => {
                        const reg = new RegExp(`^\\s*\\.${name}\\s*`);
                        const htmlReg = new RegExp(`^\\s*\\html.${name}\\s*`);
                        return selectorGroup.some(
                            (selector) =>
                                reg.test(selector) || htmlReg.test(selector)
                        );
                    });
                    if (isRepeatSeletors) {
                        selectorGroup = selectorGroup.map((selector) => {
                            let newSelector = selector;
                            scopeNames.forEach((name) => {
                                const reg = new RegExp(`^\\s*\\.${name}\\s*`);
                                const htmlReg = new RegExp(
                                    `^\\s*\\html.${name}\\s*`
                                );
                                if (reg.test(newSelector)) {
                                    newSelector = newSelector.replace(reg, '');
                                }
                                if (htmlReg.test(newSelector)) {
                                    newSelector = newSelector.replace(
                                        htmlReg,
                                        'html\x20'
                                    );
                                }
                            });
                            return newSelector.replace(/(^\s+|\s+$)/, '');
                        });
                        return [...new Set(selectorGroup)].join(',');
                    }
                }
                return a;
            });
            return codes.replace(curr, replacerFragment);
        }, css);
        return resultCode;
    }
    return css;
};

const mergeRepeatSelectors = (css, resourcePath) =>
    postcss([postcssMergeRules()]).process(css, {
        from: resourcePath,
        to: resourcePath,
        map: false,
    });

/**
 * 把多个 css 内容按 multipleScopeVars 对应顺序合并，并去重
 * @param {Array} cssResults  [
    {
      map: sourceMap || null,
      code: `
        .un-btn {
            position: relative;
            background-color: #0081ff;
        }
        .un-btn .anticon {
            line-height: 1;
        }`,
      deps: ["E:\\sub\\panel1.less", "E:\\sub\\panel2.less"],
    },
    {
      map: sourceMap || null,
      code: `
        .un-btn {
            position: relative;
            background-color: #9c26b0;
        }
        .un-btn .anticon {
            line-height: 1;
        }`,
      deps: ["E:\\sub\\panel1.less", "E:\\sub\\panel2.less"],
    },
  ]
 * @param {Array} allStyleVarFiles
  [
    { scopeName: "theme-default", path: "E:\\sub\\default-vars.less" },
    { scopeName: "theme-mauve", path: "E:\\sub\\mauve-vars.less" },
  ]
 * @param {String} resourcePath  "E:\\sub\\style.less"
 * @returns
 */
const getScopeProcessResult = (
    cssResults = [],
    allStyleVarFiles = [],
    resourcePath
) => {
    const preprocessResult = { deps: [], code: '', errors: [] };
    if (cssResults.length === 1) {
        preprocessResult.code = cssResults[0].code;
        preprocessResult.deps = cssResults[0].deps;
        return Promise.resolve(preprocessResult);
    }
    const fragmentsGroup = [];
    const sourceFragmentsGroup = [];
    cssResults.forEach((item, i) => {
        const { fragments, sourceFragments } = addScopeName(
            item.code,
            allStyleVarFiles[i].scopeName
        );
        fragmentsGroup.push(fragments);
        sourceFragmentsGroup.push(sourceFragments);
        preprocessResult.errors = [
            ...(preprocessResult.errors || []),
            ...(item.errors || []),
        ];
        const deps = Array.isArray(allStyleVarFiles[i].path)
            ? allStyleVarFiles[i].path
            : [allStyleVarFiles[i].path];
        deps.forEach((str) => {
            if (str) {
                preprocessResult.deps.push(str);
            }
        });
    });
    if (cssResults.length && sourceFragmentsGroup.length) {
        const mergePromises = sourceFragmentsGroup[0].map((cssFrag, i) =>
            mergeRepeatSelectors(
                fragmentsGroup.map((g) => g[i]).join('\n'),
                resourcePath
            )
        );
        return Promise.all(mergePromises).then((results) => {
            preprocessResult.code = sourceFragmentsGroup[0].reduce(
                (tol, curr, i) =>
                    tol.replace(curr, () =>
                        removeSameSelector(
                            results[i].css,
                            allStyleVarFiles.map((item) => item.scopeName)
                        )
                    ),
                cssResults[0].code
            );
            preprocessResult.map = cssResults[0].map;
            preprocessResult.deps = [
                ...preprocessResult.deps,
                ...cssResults[0].deps,
            ];
            return preprocessResult;
        });
    }
    // if (cssResults.length && sourceFragmentsGroup.length) {
    //   preprocessResult.code = sourceFragmentsGroup[0].reduce(
    //     (tol, curr, i) =>
    //       tol.replace(curr, () => fragmentsGroup.map((g) => g[i]).join("\n")),
    //     cssResults[0].code
    //   );
    //   preprocessResult.map = cssResults[0].map;
    //   preprocessResult.deps = [...preprocessResult.deps, ...cssResults[0].deps];
    //   return mergeRepeatSelectors(preprocessResult.code, resourcePath).then(
    //     (result) => {
    //       preprocessResult.code = removeSameSelector(
    //         result.css,
    //         allStyleVarFiles.map((item) => item.scopeName)
    //       );
    //       return preprocessResult;
    //     }
    //   );
    // }

    return Promise.resolve(preprocessResult);
};
/**
 *
 * @param {String} url
 * @param {String} type "less" | "sass"
 * @returns code
 */
const replaceFormSass = (url, type) => {
    let code = url ? fs.readFileSync(url).toString() : '';
    if (type === 'sass') {
        if (/\.less$/i.test(url)) {
            code = code.replace(/@/g, '$');
        }
        return code.replace(/!default/g, '');
    }
    if (/\.(scss|sass)$/i.test(url)) {
        code = code.replace(/\$/g, '@').replace(/!default/g, '');
    }
    return code;
};
/**
 *
 * @param {String} url
 * @param {String} type "less" | "sass"
 * @returns code
 */
const getVarsContent = (url, type) => {
    let content = '';
    if (Array.isArray(url)) {
        url.forEach((p) => {
            content += replaceFormSass(p, type);
        });
    } else {
        content = replaceFormSass(url, type);
    }
    return content;
};
/**
 * getScropProcessResult 修正命名 getScopeProcessResult后的兼容
 */
const getScropProcessResult = getScopeProcessResult;
/**
 *
 * @param {Object} options
 * @param {String} options.css css内容
 * @param {Array} options.multipleScopeVars [{scopeName:"theme-default"}]
 * @param {Boolean} options.removeCssScopeName 抽取的css是否移除scopeName
 * @returns { css: String, themeCss: Object , themeCommonCss: String }
 */
const extractThemeCss = ({ css, multipleScopeVars, removeCssScopeName }) => {
    let content = css;
    const themeCss = {};
    let themeCommonCss = '';
    if (
        typeof content === 'string' &&
        content &&
        Array.isArray(multipleScopeVars)
    ) {
        let newContent = content;
        const classNameFrags = content.match(/\w*\.[^{}/\\]+{[^{}]*?}/g) || [];
        classNameFrags.forEach((frag) => {
            const isCommon = multipleScopeVars.every(
                (item) =>
                    item.scopeName &&
                    new RegExp(`\\.${item.scopeName}`).test(frag)
            );
            if (isCommon) {
                newContent = newContent.replace(frag, '');
                themeCommonCss = `${themeCommonCss}${
                    removeCssScopeName
                        ? multipleScopeVars.reduce(
                              (tol, item) =>
                                  tol.replace(
                                      new RegExp(`\\.${item.scopeName}`, 'g'),
                                      ''
                                  ),
                              frag
                          )
                        : frag
                }`;
                return;
            }
            const hasScope = multipleScopeVars.find(
                (item) =>
                    item.scopeName &&
                    new RegExp(`\\.${item.scopeName}`).test(frag)
            );
            if (hasScope) {
                newContent = newContent.replace(frag, '');
                const scopeFrags = themeCss[hasScope.scopeName] || '';
                themeCss[hasScope.scopeName] = `${scopeFrags}${
                    removeCssScopeName
                        ? frag.replace(
                              new RegExp(`\\.${hasScope.scopeName}`, 'g'),
                              ''
                          )
                        : frag
                }`;
            }
        });
        content = newContent;
    }
    return { css: content, themeCss, themeCommonCss };
};

const addScopnameToHtmlClassname = (html, defaultScopeName) => {
    let newHtml = html;
    const htmlTagAttrStrings = html.match(/<\s*html[^<>]*>/gi) || [];

    htmlTagAttrStrings.forEach((attrstr) => {
        const classnameStrings = attrstr.match(/class\s*=['"].+['"]/g);
        if (classnameStrings) {
            classnameStrings.forEach((classstr) => {
                const classnamestr = classstr.replace(
                    /(^class\s*=['"]|['"]$)/g,
                    ''
                );
                const classnames = classnamestr.split(' ');
                if (!classnames.includes(defaultScopeName)) {
                    classnames.push(defaultScopeName);
                    newHtml = newHtml.replace(
                        attrstr,
                        attrstr.replace(
                            classstr,
                            classstr.replace(classnamestr, classnames.join(' '))
                        )
                    );
                }
            });
        } else {
            newHtml = newHtml.replace(
                attrstr,
                `${attrstr.replace(/>$/, '')} class="${defaultScopeName}">`
            );
        }
    });
    return newHtml;
};

export {
    getAllStyleVarFiles,
    addScopeName,
    getScopeProcessResult,
    getScropProcessResult,
    getVarsContent,
    extractThemeCss,
    addScopnameToHtmlClassname,
};
