import postcss from 'postcss';

import colorParse from 'parse-color';

import fs from 'fs-extra';

import { getCurrentPackRequirePath } from './packPath';

export default (
    opts = {
        allStyleVarFiles: [],
        allCssCodes: [],
        startIndex: 0,
        arbitraryMode: false,
    },
    themeRuleValues = [],
    themeRuleMap = {}
) => {
    const targetRsoleved = getCurrentPackRequirePath();
    // 是否使用了插件来抽取主题css到独立的文件
    let isExtracted = false;
    if (fs.existsSync(`${targetRsoleved}/pulignParams.js`)) {
        const param = require(`${targetRsoleved}/pulignParams.js`);
        isExtracted = param.extract;
    }
    const { allStyleVarFiles, arbitraryMode } = opts;
    function addScopeName(selector, scopeName) {
        if (/^(\.[^:]+)?:root/i.test(selector)) {
            return `.${scopeName}${selector}`;
        }
        if (/^html/i.test(selector)) {
            return selector.replace(
                /^html[^\s]*(?=\s*)/gi,
                (word) => `${word}.${scopeName}`
            );
        }
        return `.${scopeName}\x20${selector}`;
    }
    // allStyleVarFiles的个数与allCssCodes对应的
    // 除去startIndex的，其他的css转成ast
    const restCssAsts = opts.allCssCodes
        .filter((item, i) => i !== opts.startIndex)
        .map((code) => postcss.parse(code));
    return {
        postcssPlugin: 'postcss-addScopeName',
        Rule(rule, { Rule, Declaration }) {
            // 与当前样式规则不相同的其他主题样式规则
            const themeRules = [];
            // 当前规则中与其他主题规则中不相同的属性
            const currentThemeProps = {};
            // 当前规则中所有属性，按顺序去重
            const currentRuleNodeMap = {};
            rule.nodes.forEach((node) => {
                if (node.type === 'decl') {
                    currentRuleNodeMap[node.prop] = node;
                }
            });
            const currentThemeKeyframes = [];

            const extractThemeKeyframesMap = {};
            const getThemeRules = (themeRule) => {
                const childNodes = [];
                // 先将主题规则属性按顺序去重
                const themeRuleNodeMap = {};
                themeRule.nodes.forEach((node) => {
                    if (node.type === 'decl') {
                        themeRuleNodeMap[node.prop] = node;
                    }
                });
                Object.keys(currentRuleNodeMap).forEach((prop) => {
                    if (!themeRuleNodeMap[prop]) {
                        return;
                    }
                    // 比对属性值不相等的就进行分离
                    if (
                        currentRuleNodeMap[prop].value !==
                        themeRuleNodeMap[prop].value
                    ) {
                        themeRuleValues.add(themeRuleNodeMap[prop].value);

                        childNodes.push(themeRuleNodeMap[prop]);
                        currentThemeProps[prop] = currentRuleNodeMap[prop];
                    }
                    delete themeRuleNodeMap[prop];
                });
                // 假如比对后还有剩余，也纳入主题属性
                Object.keys(themeRuleNodeMap).forEach((prop) => {
                    childNodes.push(themeRuleNodeMap[prop]);
                });

                themeRule.nodes = childNodes;
                themeRules.push(themeRule.clone());
                themeRule.remove();
            };
            const restVarFiles = allStyleVarFiles.slice(0);
            restVarFiles.splice(opts.startIndex, 1);
            restCssAsts.forEach((root, i) => {
                for (
                    let index = 0;
                    index < (root.nodes || []).length;
                    index++
                ) {
                    const themeRule = root.nodes[index];

                    /* ast第一层节点属于选择器类型的
                     *  找到与rule选择器匹配的
                     */

                    if (
                        themeRule.type === 'rule' &&
                        themeRule.selector === rule.selector
                    ) {
                        getThemeRules(themeRule);
                        break;
                    }
                    // 当这条规则在@media内
                    else if (
                        rule.parent.type === 'atrule' &&
                        rule.parent.name === 'media'
                    ) {
                        if (
                            themeRule.type === 'atrule' &&
                            themeRule.name === 'media' &&
                            themeRule.params === rule.parent.params
                        ) {
                            // 刚好是同一个@media时，就往里面找到匹配的规则处理
                            for (
                                let i = 0;
                                i < (themeRule.nodes || []).length;
                                i++
                            ) {
                                const atruleChild = themeRule.nodes[i];
                                if (
                                    atruleChild.type === 'rule' &&
                                    atruleChild.selector === rule.selector
                                ) {
                                    getThemeRules(atruleChild);
                                }
                            }
                            break;
                        }
                    }
                    // 当这条规则在@keyframes内
                    else if (
                        rule.parent.type === 'atrule' &&
                        rule.parent.name === 'keyframes'
                    ) {
                        // 又当@keyframes在@media内部时
                        if (
                            rule.parent.parent &&
                            rule.parent.parent.type === 'atrule' &&
                            rule.parent.parent.name === 'media'
                        ) {
                            // 当刚好是同一个@media，往里面找到匹配的@keyframes
                            if (
                                themeRule.type === 'atrule' &&
                                themeRule.name === 'media' &&
                                rule.parent.parent.params === themeRule.params
                            ) {
                                for (
                                    let i = 0;
                                    i < (themeRule.nodes || []).length;
                                    i++
                                ) {
                                    const atruleChild = themeRule.nodes[i];
                                    if (
                                        atruleChild.type === 'atrule' &&
                                        atruleChild.name === 'keyframes' &&
                                        atruleChild.params ===
                                            rule.parent.params
                                    ) {
                                        if (!arbitraryMode) {
                                            currentThemeKeyframes.push(
                                                atruleChild.clone()
                                            );
                                            const currentMedia =
                                                rule.parent.parent.clone();
                                            currentMedia.removeAll();
                                            currentMedia.append(
                                                rule.parent.clone()
                                            );
                                            extractThemeKeyframesMap[
                                                allStyleVarFiles[
                                                    opts.startIndex
                                                ].scopeName
                                            ] = currentMedia;
                                        }
                                        const media = themeRule.clone();
                                        media.removeAll();
                                        media.append(atruleChild.clone());
                                        extractThemeKeyframesMap[
                                            restVarFiles[i].scopeName
                                        ] = media;
                                        atruleChild.remove();
                                        break;
                                    }
                                }
                                break;
                            }
                        } else if (
                            themeRule.type === 'atrule' &&
                            themeRule.name === 'keyframes' &&
                            themeRule.params === rule.parent.params
                        ) {
                            if (!arbitraryMode) {
                                currentThemeKeyframes.push(themeRule.clone());
                                extractThemeKeyframesMap[
                                    allStyleVarFiles[opts.startIndex].scopeName
                                ] = rule.parent.clone();
                            }
                            extractThemeKeyframesMap[
                                restVarFiles[i].scopeName
                            ] = themeRule.clone();
                            themeRule.remove();
                            break;
                        }
                    }
                }
            });
            const root = rule.parent;
            rule.nodes.forEach((node) => {
                if (
                    node.type === 'decl' &&
                    currentThemeProps[node.prop] === node
                ) {
                    node.remove();
                }
            });

            if (themeRules.length) {
                const firstThemeRule = rule.clone();
                if (!arbitraryMode) {
                    firstThemeRule.removeAll();
                }
                Object.keys(currentThemeProps).forEach((key) => {
                    for (let index = 0; index < themeRules.length; index++) {
                        const tRule = themeRules[index];
                        // 如果当前规则的样式属性在其他主题规则中不存在，说明该样式属性是所有主题样式属性，但是在上面比对中发现值一致未被添加，这里要添加回去
                        if (
                            !tRule.nodes.some(
                                (node) =>
                                    node.type === 'decl' && node.prop === key
                            )
                        ) {
                            tRule.append(currentThemeProps[key].clone());
                        }
                    }
                    if (!arbitraryMode) {
                        firstThemeRule.append(currentThemeProps[key].clone());
                    }
                });
                if (!arbitraryMode) {
                    // 保持themeRules的顺序对应 opts.allStyleVarFiles的顺序，然后添加scopeName
                    themeRules.splice(opts.startIndex, 0, firstThemeRule);
                }
                const scopeItems = !arbitraryMode
                    ? allStyleVarFiles
                    : restVarFiles;
                themeRules.forEach((item, i) => {
                    if (item && item.nodes.length) {
                        if (!arbitraryMode) {
                            // eslint-disable-next-line no-param-reassign
                            item.selectors = item.selectors.map((selector) =>
                                addScopeName(selector, scopeItems[i].scopeName)
                            );
                            if (!isExtracted) {
                                root.insertBefore(rule, item);
                            }
                        }
                        let themeCssItem = item;
                        if (
                            rule.parent.type === 'atrule' &&
                            rule.parent.name === 'media'
                        ) {
                            const pclone = rule.parent.clone();
                            pclone.removeAll();
                            pclone.append(item.clone());
                            themeCssItem = pclone;
                        }
                        const scopeSet =
                            themeRuleMap[scopeItems[i].scopeName] || new Set();
                        scopeSet.add(themeCssItem.toString());
                        themeRuleMap[scopeItems[i].scopeName] = scopeSet;
                    }
                });
                if (!arbitraryMode) {
                    const selectorMap = rule.selectors.reduce((tol, key) => {
                        return { ...tol, [key]: true };
                    }, {});

                    scopeItems.forEach((item) => {
                        if (
                            item.includeStyles &&
                            typeof item.includeStyles === 'object' &&
                            !Array.isArray(item.includeStyles)
                        ) {
                            const includeKey = Object.keys(
                                item.includeStyles
                            ).find((key) => {
                                const selectors = key
                                    .replace(/,\s+/g, ',')
                                    .split(',');
                                return selectors.every((s) => selectorMap[s]);
                            });
                            if (includeKey) {
                                const newRule = new Rule({
                                    selector: rule.selector,
                                });
                                newRule.selectors = newRule.selectors.map(
                                    (selector) =>
                                        addScopeName(selector, item.scopeName)
                                );
                                Object.keys(
                                    item.includeStyles[includeKey]
                                ).forEach((prop) => {
                                    const decl = new Declaration({
                                        prop,
                                        value: item.includeStyles[includeKey][
                                            prop
                                        ],
                                    });
                                    newRule.append(decl);
                                    const currDecl = rule.nodes.find((node) => {
                                        if (node.prop === decl.prop) {
                                            if (node.value === decl.value) {
                                                return true;
                                            }

                                            let colorHex = null;
                                            let isQueit = false;

                                            try {
                                                colorHex = colorParse(
                                                    node.value
                                                );

                                                if (
                                                    colorHex &&
                                                    colorHex.hex ===
                                                        colorParse(decl.value)
                                                            .hex
                                                ) {
                                                    isQueit = true;
                                                }
                                            } catch (e) {
                                                console.warn(e);
                                            }

                                            return isQueit;
                                        }

                                        return false;
                                    });

                                    if (currDecl) {
                                        rule.removeChild(currDecl);
                                    }
                                });
                                const scopeSet =
                                    themeRuleMap[item.scopeName] || new Set();
                                scopeSet.add(newRule.toString());
                                themeRuleMap[item.scopeName] = scopeSet;
                                if (!isExtracted) {
                                    root.insertBefore(rule, newRule);
                                }
                            }
                        }
                    });
                }
                if (!rule.nodes.length) {
                    rule.remove();
                }
            }
            if (!arbitraryMode && !isExtracted) {
                currentThemeKeyframes.forEach((item) => {
                    rule.parent.parent.insertBefore(rule.parent, item);
                });
            }

            for (const key in extractThemeKeyframesMap) {
                if (Object.hasOwnProperty.call(extractThemeKeyframesMap, key)) {
                    const keyframesRule = extractThemeKeyframesMap[key];
                    const scopeSet = themeRuleMap[key] || new Set();
                    scopeSet.add(keyframesRule.toString());
                    themeRuleMap[key] = scopeSet;
                }
            }
        },
    };
};
