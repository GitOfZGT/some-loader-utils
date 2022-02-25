/* eslint-disable import/no-dynamic-require */
/* eslint-disable import/extensions */
/* eslint-disable import/no-unresolved */

import fs from 'fs-extra';

import { v5 as uuidv5 } from 'uuid';

import postcss from 'postcss';

import cssnano from 'cssnano';

import lite from 'cssnano-preset-lite';

import postcssAddScopeName from './postcss-addScopeName';

import { colorValueReg } from './arbitraryMode/utils';

// import browerColorMap from './arbitraryMode/colors';

import { getCurrentPackRequirePath } from './packPath';

function getBlendVarFiles(allStyleVarFiles) {
    const allStyleVarFilesCopy = allStyleVarFiles.slice(0);
    let blendVarItem = null;
    for (let index = 0; index < allStyleVarFiles.length; index++) {
        const item = allStyleVarFiles[index];
        if (item.arbitraryMode) {
            blendVarItem = item;
            allStyleVarFilesCopy.splice(index, 1);
            break;
        }
    }
    allStyleVarFilesCopy.forEach((item) => {
        item.arbitraryMode = false;
    });
    if (blendVarItem) {
        allStyleVarFilesCopy.push(blendVarItem);
    }
    return {
        allStyleVarFiles: allStyleVarFilesCopy,
        blendVarFile: blendVarItem,
    };
}
const getAllStyleVarFiles = (loaderContext, options) => {
    const varsSet = {};
    (options.multipleScopeVars || []).forEach((item) => {
        varsSet[item.scopeName] = item;
    });
    const styleVarFiles = Object.keys(varsSet).reduce(
        (tol, key) => [...tol, varsSet[key]],
        []
    );
    let allStyleVarFiles = [{ scopeName: '', path: '' }];
    if (Array.isArray(styleVarFiles) && styleVarFiles.length) {
        if (styleVarFiles.length === 1) {
            allStyleVarFiles = styleVarFiles.map((item) => {
                if (Array.isArray(item.path)) {
                    const exist = item.path.every((pathstr) => {
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
                    if (!exist) {
                        return { scopeName: '', path: '' };
                    }
                } else if (
                    (!item.path ||
                        typeof item.path !== 'string' ||
                        !fs.existsSync(item.path)) &&
                    typeof item.varsContent !== 'string'
                ) {
                    loaderContext.emitError(
                        new Error(
                            `Not found path or varsContent: ${item.path}  in multipleScopeVars`
                        )
                    );
                    return { scopeName: '', path: '' };
                }
                if (options.arbitraryMode) {
                    if (!item.scopeName) {
                        return { ...item, scopeName: 'theme-default' };
                    }
                    return item;
                }
                return { ...item, scopeName: '' };
            });
            return (
                options.arbitraryMode ? [{ scopeName: '', path: '' }] : []
            ).concat(
                allStyleVarFiles.filter(
                    (item) =>
                        !!item.path || typeof item.varsContent === 'string'
                )
            );
        }
        allStyleVarFiles = styleVarFiles.filter((item) => {
            if (!item.scopeName) {
                loaderContext.emitError(
                    new Error('Not found scopeName in multipleScopeVars')
                );
                return false;
            }
            if (Array.isArray(item.path)) {
                return (
                    item.path.every((pathstr) => {
                        const exists = pathstr && fs.existsSync(pathstr);
                        if (!exists) {
                            loaderContext.emitError(
                                new Error(
                                    `Not found path : ${pathstr} in multipleScopeVars`
                                )
                            );
                        }
                        return exists;
                    }) || typeof item.varsContent === 'string'
                );
            }
            if (
                (!item.path ||
                    typeof item.path !== 'string' ||
                    !fs.existsSync(item.path)) &&
                typeof item.varsContent !== 'string'
            ) {
                loaderContext.emitError(
                    new Error(
                        `Not found path or varsContent: ${item.path} in multipleScopeVars`
                    )
                );
                return false;
            }
            return true;
        });
    }
    return options.arbitraryMode
        ? allStyleVarFiles.slice(0, 2)
        : getBlendVarFiles(allStyleVarFiles).allStyleVarFiles;
};

// const cssFragReg = /[^{}/\\]+{[^{}]*?}/g;
// const classNameFragReg = /[^{}/\\]+(?={)/;

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
    resourcePath,
    includeStyleWithColors,
    arbitraryMode,
    extract
) => {
    const preprocessResult = { deps: [], code: '', errors: [] };
    if (cssResults.length === 1) {
        preprocessResult.code = cssResults[0].code;
        preprocessResult.deps = cssResults[0].deps;
        return Promise.resolve(preprocessResult);
    }
    cssResults.forEach((item, i) => {
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
    preprocessResult.deps = [
        ...preprocessResult.deps,
        ...(cssResults[0].deps || []),
    ];
    /**
     * 用cssResults的第一个css内容进入postcss
     */
    const startIndex = 0;
    const themeRuleValues = new Set();
    const themeRuleMap = {};
    return postcss([
        postcssAddScopeName(
            {
                allStyleVarFiles,
                allCssCodes: cssResults.map((r) => r.code),
                // 除去allCssCodes中的第几个
                startIndex,
                arbitraryMode,
                includeStyleWithColors,
                extract,
            },
            themeRuleValues,
            themeRuleMap
        ),
    ])
        .process(cssResults[startIndex].code, {
            from: resourcePath,
            to: resourcePath,
        })
        .then((postResult) => {
            const MY_NAMESPACE = '1b671a64-40d5-491e-99b0-da01ff1f3341';
            const filename = uuidv5(resourcePath, MY_NAMESPACE);
            const dirName = 'extractTheme';
            const targetRsoleved = getCurrentPackRequirePath();
            if (!fs.existsSync(`${targetRsoleved}/${dirName}`)) {
                fs.mkdirSync(`${targetRsoleved}/${dirName}`);
            }
            const cssRules = {};
            for (const key in themeRuleMap) {
                if (Object.hasOwnProperty.call(themeRuleMap, key)) {
                    const ruleSet = themeRuleMap[key];
                    const cssArr = Array.from(ruleSet);
                    if (cssArr.length) {
                        cssRules[key] = cssArr;
                    }
                }
            }
            const themeRuleValuesArr = Array.from(themeRuleValues);

            const filecontent = {
                cssRules,
                ruleValues: themeRuleValuesArr,
                resourcePath,
            };
            fs.writeFileSync(
                `${targetRsoleved}/${dirName}/${filename}.json`,
                JSON.stringify(filecontent, null, 4)
            );

            preprocessResult.code = postResult.css;
            return preprocessResult;
        });
};

/**
 * getScropProcessResult 修正命名 getScopeProcessResult后的兼容
 */
const getScropProcessResult = getScopeProcessResult;
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
function removeThemeFiles() {
    const dirName = 'extractTheme';
    const targetRsoleved = getCurrentPackRequirePath();
    if (fs.existsSync(`${targetRsoleved}/${dirName}`)) {
        fs.removeSync(`${targetRsoleved}/${dirName}`);
    }
}
function getExtractThemeCode(opt) {
    const { scopeName = '', excludeScopeNames = [] } = opt || {};
    const targetRsoleved = getCurrentPackRequirePath();
    const dirName = 'extractTheme';
    if (fs.existsSync(`${targetRsoleved}/${dirName}`)) {
        const files = fs.readdirSync(`${targetRsoleved}/${dirName}`) || [];
        const themeRuleCodes = {};
        let themeRuleValues = [];
        files.forEach((file) => {
            const { cssRules, ruleValues } = JSON.parse(
                fs
                    .readFileSync(`${targetRsoleved}/${dirName}/${file}`)
                    .toString()
            );
            if (scopeName) {
                if (cssRules[scopeName]) {
                    let scopeCssArr = themeRuleCodes[scopeName] || [];
                    scopeCssArr = scopeCssArr.concat(cssRules[scopeName]);
                    themeRuleCodes[scopeName] = scopeCssArr;
                }
            } else {
                Object.keys(cssRules)
                    .filter((key) => !(excludeScopeNames || []).includes(key))
                    .forEach((key) => {
                        let scopeCssArr = themeRuleCodes[key] || [];
                        scopeCssArr = scopeCssArr.concat(cssRules[key]);
                        themeRuleCodes[key] = scopeCssArr;
                    });
            }
            themeRuleValues = themeRuleValues.concat(ruleValues);
        });
        return {
            themeRuleCodes,
            themeRuleValues: Array.from(new Set(themeRuleValues)),
        };
    }
    return { themeRules: {}, themeRuleValues: [] };
}

/**
 *
 * @param {Object} options
 * @param {Boolean} options.removeCssScopeName 抽取的css是否移除scopeName
 * @returns { css: String, themeCss: Object , themeCommonCss: String }
 */
const extractThemeCss = ({
    removeCssScopeName,
    scopeName,
    excludeScopeNames,
}) => {
    const { themeRuleCodes, themeRuleValues } = getExtractThemeCode({
        scopeName,
        excludeScopeNames,
    });

    const allPro = Object.keys(themeRuleCodes || {}).map((key) => {
        const codes = (
            removeCssScopeName
                ? themeRuleCodes[key].map((frag) =>
                      frag.replace(new RegExp(`\\.${key}`, 'g'), '')
                  )
                : themeRuleCodes[key]
        ).join('');
        return postcss([
            cssnano({
                preset: lite({}),
            }),
        ])
            .process(codes)
            .then((postResult) => {
                return { key, css: postResult.css };
            });
    });
    return Promise.all(allPro).then((res) => {
        const themeCss = {};
        res.forEach((item) => {
            themeCss[item.key] = item.css;
        });
        return { themeCss, themeRuleValues };
    });
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

function createArbitraryModeVarColors(filecontent) {
    if (filecontent) {
        const hex = (filecontent.match(colorValueReg.hex) || []).map((color) =>
            color.replace(/\s+/g, '')
        );
        const rgb = (filecontent.match(colorValueReg.rgb) || []).map((color) =>
            color.replace(/\s+/g, '')
        );
        const rgba = (filecontent.match(colorValueReg.rgba) || []).map(
            (color) => color.replace(/\s+/g, '')
        );
        const hsl = (filecontent.match(colorValueReg.hsl) || []).map((color) =>
            color.replace(/\s+/g, '').replace(/,0(?=,|\))/g, ',0%')
        );
        const hsla = (filecontent.match(colorValueReg.hsla) || []).map(
            (color) => color.replace(/\s+/g, '').replace(/,0(?=,)/g, ',0%')
        );
        // const browerColorReg = new RegExp(
        //     `(?<=:\\s*)(${Object.keys(browerColorMap).join('|')})(?=\\s*)`,
        //     'ig'
        // );
        // const browerColors = filecontent.match(browerColorReg) || [];
        const colors = Array.from(
            new Set(
                [].concat(hex).concat(rgb).concat(rgba).concat(hsl).concat(hsla)
            )
        );
        const targetRsoleved = getCurrentPackRequirePath();
        fs.writeFileSync(
            `${targetRsoleved}/baseVarColors.json`,
            JSON.stringify({ baseVarColors: colors })
        );
    }
}

function createPulignParamsFile(options = {}) {
    const targetRsoleved = getCurrentPackRequirePath();
    fs.writeFileSync(
        `${targetRsoleved}/pulignParams.js`,
        `module.exports = ${JSON.stringify(options)};`
    );
}

function getPluginParams(opt) {
    const targetRsoleved = getCurrentPackRequirePath();
    // webpack等插件将与getSass相同的参数，打入到pulignParams.js，这里就获取到作为默认参数
    let defaultPluginOpt = {};
    const parmasPath = `${targetRsoleved}/pulignParams.js`;
    if (fs.existsSync(parmasPath)) {
        defaultPluginOpt = require(parmasPath);
    }
    defaultPluginOpt = { ...defaultPluginOpt, ...opt };
    return defaultPluginOpt;
}

export {
    getAllStyleVarFiles,
    getScopeProcessResult,
    getScropProcessResult,
    getVarsContent,
    extractThemeCss,
    addScopnameToHtmlClassname,
    removeThemeFiles,
    createArbitraryModeVarColors,
    getCurrentPackRequirePath,
    createPulignParamsFile,
    getPluginParams,
    getBlendVarFiles,
};
