import postcss from 'postcss';

import { isSameColor, removeSpaceInColor } from './arbitraryMode/utils';

export default (
    opts = {
        allStyleVarFiles: [],
        allCssCodes: [],
        startIndex: 0,
        arbitraryMode: false,
        includeStyleWithColors: [],
        extract: false,
    },
    themeRuleValues = [],
    themeRuleMap = {}
) => {
    const { allStyleVarFiles, arbitraryMode, extract } = opts;
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
            let blendRule = null;
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
            const getThemeRules = (themeRule, varFile) => {
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
                    // 比对属性值不相等的，或者存在 includeStyleWithColors 中对应的颜值，就进行分离
                    if (
                        currentRuleNodeMap[prop].value !==
                            themeRuleNodeMap[prop].value ||
                        (!varFile.arbitraryMode &&
                            (opts.includeStyleWithColors || []).some((item) => {
                                if (
                                    Array.isArray(item.excludeSelectors) &&
                                    themeRuleNodeMap[prop].parent &&
                                    themeRuleNodeMap[prop].parent.type ===
                                        'rule'
                                ) {
                                    const { selectors } =
                                        themeRuleNodeMap[prop].parent;
                                    if (
                                        item.excludeSelectors.some(
                                            (selectorStr) =>
                                                selectorStr.replace(
                                                    /,\s+/g,
                                                    ','
                                                ) === selectors.join(',')
                                        )
                                    ) {
                                        return false;
                                    }
                                }
                                const isExcludeProperty =
                                    Array.isArray(item.excludeCssProps) &&
                                    item.excludeCssProps.includes(prop);
                                if (isExcludeProperty) {
                                    return false;
                                }
                                if (Array.isArray(item.color)) {
                                    return item.color.some((co) =>
                                        isSameColor(
                                            co,
                                            themeRuleNodeMap[prop].value
                                        )
                                    );
                                }
                                return isSameColor(
                                    item.color,
                                    themeRuleNodeMap[prop].value
                                );
                            }))
                    ) {
                        themeRuleValues.add(
                            removeSpaceInColor(themeRuleNodeMap[prop].value)
                        );

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
                if (!arbitraryMode && varFile.arbitraryMode) {
                    blendRule = themeRule.clone();
                } else {
                    themeRules.push(themeRule.clone());
                }
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
                    const isSameRule =
                        themeRule.type === 'rule' &&
                        themeRule.selector === rule.selector;
                    if (isSameRule) {
                        getThemeRules(themeRule, restVarFiles[i]);
                        break;
                    }
                    // 当这条规则在@media内
                    const isInMedia =
                        rule.parent.type === 'atrule' &&
                        rule.parent.name === 'media';
                    const isSameInMedia =
                        themeRule.type === 'atrule' &&
                        themeRule.name === 'media' &&
                        themeRule.params === rule.parent.params;
                    if (isInMedia && isSameInMedia) {
                        // 刚好是同一个@media时，就往里面找到匹配的规则处理
                        const atruleChild = (themeRule.nodes || []).find(
                            (item) =>
                                item.type === 'rule' &&
                                item.selector === rule.selector
                        );
                        if (atruleChild) {
                            getThemeRules(atruleChild, restVarFiles[i]);
                        }

                        break;
                    }
                    // 当这条规则在@keyframes内
                    const isInKeyframes =
                        rule.parent.type === 'atrule' &&
                        rule.parent.name === 'keyframes';
                    if (isInKeyframes) {
                        // 又当@keyframes在@media内部时
                        const isKeyframeInMedia =
                            rule.parent.parent &&
                            rule.parent.parent.type === 'atrule' &&
                            rule.parent.parent.name === 'media';
                        const isSameKeyframeInMedia =
                            themeRule.type === 'atrule' &&
                            themeRule.name === 'media' &&
                            rule.parent.parent &&
                            rule.parent.parent.params === themeRule.params;
                        if (isKeyframeInMedia && isSameKeyframeInMedia) {
                            // 当刚好是同一个@media，往里面找到匹配的@keyframes
                            const atruleChild = (themeRule.nodes || []).find(
                                (item) =>
                                    item.type === 'atrule' &&
                                    item.name === 'keyframes' &&
                                    item.params === rule.parent.params
                            );

                            if (atruleChild) {
                                const childRules = atruleChild.nodes || [];
                                const existsDiffValue = childRules.some(
                                    (item) => {
                                        const isExst =
                                            item.type === 'rule' &&
                                            item.selector === rule.selector &&
                                            item.nodes.some((node) => {
                                                const isDiffValue =
                                                    node.type === 'decl' &&
                                                    currentRuleNodeMap[
                                                        node.prop
                                                    ].value !== node.value;
                                                if (isDiffValue) {
                                                    themeRuleValues.add(
                                                        removeSpaceInColor(
                                                            node.value
                                                        )
                                                    );
                                                }
                                                return isDiffValue;
                                            });
                                        return isExst;
                                    }
                                );
                                if (existsDiffValue) {
                                    if (
                                        !arbitraryMode &&
                                        !restVarFiles[i].arbitraryMode
                                    ) {
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
                                        rule.parent.remove();
                                    }
                                    const media = themeRule.clone();
                                    media.removeAll();
                                    media.append(atruleChild.clone());
                                    extractThemeKeyframesMap[
                                        restVarFiles[i].scopeName
                                    ] = media;
                                    atruleChild.remove();
                                }
                            }

                            break;
                        }
                        const isSameKeyFrame =
                            themeRule.type === 'atrule' &&
                            themeRule.name === 'keyframes' &&
                            themeRule.params === rule.parent.params;
                        if (isSameKeyFrame) {
                            const childRules = themeRule.nodes || [];
                            const existsDiffValue = childRules.some((item) => {
                                const isExst =
                                    item.type === 'rule' &&
                                    item.selector === rule.selector &&
                                    item.nodes.some((node) => {
                                        const isDiffValue =
                                            node.type === 'decl' &&
                                            currentRuleNodeMap[node.prop]
                                                .value !== node.value;

                                        if (isDiffValue) {
                                            themeRuleValues.add(
                                                removeSpaceInColor(node.value)
                                            );
                                        }
                                        return isDiffValue;
                                    });
                                return isExst;
                            });
                            if (existsDiffValue) {
                                if (
                                    !arbitraryMode &&
                                    !restVarFiles[i].arbitraryMode
                                ) {
                                    currentThemeKeyframes.push(
                                        themeRule.clone()
                                    );
                                    extractThemeKeyframesMap[
                                        allStyleVarFiles[
                                            opts.startIndex
                                        ].scopeName
                                    ] = rule.parent.clone();
                                    rule.parent.remove();
                                }
                                extractThemeKeyframesMap[
                                    restVarFiles[i].scopeName
                                ] = themeRule.clone();
                                themeRule.remove();
                                break;
                            }
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
                let arbitraryModeScopeItem = null;
                const scopeItems = (
                    !arbitraryMode ? allStyleVarFiles : restVarFiles
                ).filter((item) => {
                    if (item.arbitraryMode) {
                        arbitraryModeScopeItem = item;
                    }
                    return !item.arbitraryMode;
                });

                themeRules.forEach((item, i) => {
                    if (item && item.nodes.length) {
                        const removeNodes = [];
                        if (blendRule && blendRule.nodes.length) {
                            item.nodes.forEach((node) => {
                                if (
                                    node.type === 'decl' &&
                                    blendRule.nodes.some(
                                        (b) =>
                                            b.type === 'decl' &&
                                            b.prop === node.prop &&
                                            b.value === node.prop
                                    )
                                ) {
                                    removeNodes.push(node);
                                }
                            });
                        }
                        removeNodes.forEach((node) => {
                            item.removeChild(node);
                        });
                        if (!arbitraryMode && item.nodes.length) {
                            // eslint-disable-next-line no-param-reassign
                            item.selectors = item.selectors.map((selector) =>
                                addScopeName(selector, scopeItems[i].scopeName)
                            );
                            if (!extract) {
                                root.insertBefore(rule, item);
                            }
                        }
                        let themeCssItem = item;
                        if (
                            themeCssItem.nodes.length &&
                            rule.parent.type === 'atrule' &&
                            rule.parent.name === 'media'
                        ) {
                            const pclone = rule.parent.clone();
                            pclone.removeAll();
                            pclone.append(item.clone());
                            themeCssItem = pclone;
                        }
                        if (themeCssItem.nodes.length) {
                            const scopeSet =
                                themeRuleMap[scopeItems[i].scopeName] ||
                                new Set();
                            scopeSet.add(themeCssItem.toString());
                            themeRuleMap[scopeItems[i].scopeName] = scopeSet;
                        }
                    }
                });
                if (!arbitraryMode && blendRule && arbitraryModeScopeItem) {
                    let themeCssItem = blendRule;
                    if (themeCssItem.nodes.length) {
                        // eslint-disable-next-line no-param-reassign
                        themeCssItem.selectors = themeCssItem.selectors.map(
                            (selector) =>
                                addScopeName(
                                    selector,
                                    arbitraryModeScopeItem.scopeName
                                )
                        );
                    }

                    if (
                        themeCssItem.nodes.length &&
                        rule.parent.type === 'atrule' &&
                        rule.parent.name === 'media'
                    ) {
                        const pclone = rule.parent.clone();
                        pclone.removeAll();
                        pclone.append(themeCssItem.clone());
                        themeCssItem = pclone;
                    }
                    if (themeCssItem.nodes.length) {
                        const scopeSet =
                            themeRuleMap[arbitraryModeScopeItem.scopeName] ||
                            new Set();
                        scopeSet.add(themeCssItem.toString());
                        themeRuleMap[arbitraryModeScopeItem.scopeName] =
                            scopeSet;
                    }
                }
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
                                            return (
                                                node.value === decl.value ||
                                                isSameColor(
                                                    node.value,
                                                    decl.value
                                                )
                                            );
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
                                if (!extract) {
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
            if (!arbitraryMode && !extract) {
                currentThemeKeyframes.forEach((item) => {
                    if (rule.parent && rule.parent.parent) {
                        rule.parent.parent.insertBefore(rule.parent, item);
                    }
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
