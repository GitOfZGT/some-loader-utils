import postcss from 'postcss';

export default (
    opts = { allStyleVarFiles: [], allCssCodes: [], startIndex: 0 }
) => {
    // allStyleVarFiles的个数与allCssCodes对应的
    // 除去startIndex的，其他的css转成ast
    const restCssAsts = opts.allCssCodes
        .filter((item, i) => i !== opts.startIndex)
        .map((code) => postcss.parse(code));
    return {
        postcssPlugin: 'postcss-addScopeName',
        Rule(rule) {
            const themeRules = [];
            const currentThemeProps = {};
            restCssAsts.forEach((root) => {
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
                        let childNodes = [];
                        rule.nodes.forEach((cn) => {
                            if (cn.type === 'decl') {
                                // 过滤出样式属性相同，值不同的节点
                                const decls = themeRule.nodes.filter((ccn) => {
                                    if (ccn.type !== 'decl') {
                                        return false;
                                    }

                                    if (
                                        ccn.prop === cn.prop &&
                                        ccn.value !== cn.value
                                    ) {
                                        currentThemeProps[cn.prop] = cn.value;
                                        return true;
                                    }

                                    return false;
                                });

                                childNodes = childNodes.concat(decls);
                                decls.forEach((n) => {
                                    themeRule.removeChild(n);
                                });
                            }
                        });

                        themeRule.nodes = childNodes;
                        themeRules.push(themeRule.clone());
                        themeRule.remove();
                        break;
                    }
                }
            });
            const root = rule.parent;
            rule.nodes.forEach((node) => {
                if (
                    node.type === 'decl' &&
                    currentThemeProps[node.prop] === node.value
                ) {
                    node.remove();
                }
            });

            if (themeRules.length) {
                const ruleClone = rule.clone();
                ruleClone.removeAll();
                Object.keys(currentThemeProps).forEach((key) => {
                    ruleClone.append({
                        prop: key,
                        value: currentThemeProps[key],
                    });
                });
                // 保持themeRules的顺序对应 opts.allStyleVarFiles的顺序，然后添加scopeName
                themeRules.splice(opts.startIndex, 0, ruleClone);
                themeRules.forEach((item, i) => {
                    if (item && item.nodes.length) {
                        // eslint-disable-next-line no-param-reassign
                        item.selectors = item.selectors.map((selector) => {
                            if (/^html/i.test(selector)) {
                                return selector.replace(
                                    /^html[^\s]*(?=\s*)/gi,
                                    (word) =>
                                        `${word}.${opts.allStyleVarFiles[i].scopeName}`
                                );
                            }

                            return `.${opts.allStyleVarFiles[i].scopeName} ${selector}`;
                        });
                        root.insertBefore(rule, item);
                    }
                });

                if (!rule.nodes.length) {
                    rule.remove();
                }
            }
        },
    };
};
