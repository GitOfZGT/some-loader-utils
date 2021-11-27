import Color from 'color';

import fs from 'fs-extra';

import prettier from 'prettier';

import { extractThemeCss } from '../utils';

import { getCurrentPackRequirePath } from '../packPath';

import { colorValueReg } from './utils';

function getHsvPercentGias(primaryColor, resultColor) {
    const primaryHsvArr = primaryColor.hsv().array();
    const resultHsvArr = resultColor.hsv().array();
    const getGiasPercent = (index) =>
        primaryHsvArr[index] !== 0
            ? (primaryHsvArr[index] - resultHsvArr[index]) /
              primaryHsvArr[index]
            : primaryHsvArr[index];
    return [getGiasPercent(0), getGiasPercent(1), getGiasPercent(2)];
}

function separatValue(cssValues) {
    const cssColors = [];
    const hybridValueMap = {};
    const otherValues = [];
    cssValues.forEach((val) => {
        const hasSpace = /\s+/.test(val);
        const hex = val.match(colorValueReg.hex);
        const rgb = val.match(colorValueReg.rgb);
        const rgba = val.match(colorValueReg.rgba);
        const hsl = val.match(colorValueReg.hsl);
        const hsla = val.match(colorValueReg.hsla);
        if (!hex && !rgb && !rgba && !hsl && !hsla) {
            otherValues.push(val);
        } else {
            let residueVal = val;
            const getResidueVal = (colorArr, cssColors, residueVal) => {
                let newVal = residueVal;
                if (colorArr) {
                    colorArr.forEach((cval) => {
                        cssColors.push(cval);
                        newVal = residueVal.replace(
                            cval,
                            hasSpace ? '#{color}' : ''
                        );
                    });
                }
                return newVal;
            };
            residueVal = getResidueVal(hex, cssColors, residueVal);
            residueVal = getResidueVal(rgb, cssColors, residueVal);
            residueVal = getResidueVal(rgba, cssColors, residueVal);
            residueVal = getResidueVal(hsl, cssColors, residueVal);
            residueVal = getResidueVal(hsla, cssColors, residueVal);
            if (residueVal) {
                hybridValueMap[residueVal] = val;
            }
        }
    });
    return {
        cssColors: Array.from(new Set(cssColors)),
        hybridValueMap,
        otherValues,
    };
}
function getResultColorReplaceMap({
    cssColors,
    varsColorValues,
    defaultPrimaryColor,
}) {
    const sourceColorMap = {};
    // const mixWeightsMap = {};
    cssColors.forEach((colorString) => {
        const resultColor = Color(colorString).hsv();
        let finded = false;
        for (let index = 0; index < varsColorValues.length; index++) {
            const varStr = varsColorValues[index];
            const varColor = Color(varStr).hsv();
            if (varColor.color[0] === resultColor.color[0]) {
                sourceColorMap[colorString] = {
                    percentGias: getHsvPercentGias(varColor, resultColor),
                    varColorString: varStr,
                };
                finded = true;
                break;
            }
        }
        if (!finded) {
            const varColor = Color(defaultPrimaryColor).hsv();
            sourceColorMap[colorString] = {
                percentGias: getHsvPercentGias(varColor, resultColor),
                varColorString: defaultPrimaryColor,
            };
            // if (varColor.color[0] > resultColor.color[0]) {
            //     sourceColorMap[colorString].percentGias = getHsvPercentGias(
            //         varColor,
            //         resultColor
            //     );
            // } else {
            //     mixWeightsMap[colorString] = '50%';
            // }
        }
    });
    return sourceColorMap;
}
function getThemeStyleContent() {
    return extractThemeCss({}).then(({ themeCss, themeRuleValues }) => {
        let styleContent = '';
        Object.values(themeCss).forEach((css) => {
            styleContent = `${styleContent}${css}`;
        });
        return { styleContent, themeRuleValues };
    });
}
let cacheThemeStyleConent = '';
function createSetCustomThemeFile({
    defaultPrimaryColor,
    customThemeOutputPath,
    styleTagId = 'coustom-theme-tagid',
}) {
    return getThemeStyleContent().then(({ styleContent, themeRuleValues }) => {
        if (cacheThemeStyleConent !== styleContent) {
            const targetRsoleved = getCurrentPackRequirePath();
            const baseVarColors = JSON.parse(
                fs
                    .readFileSync(`${targetRsoleved}/baseVarColors.json`)
                    .toString()
            );

            const { cssColors, hybridValueMap, otherValues } =
                separatValue(themeRuleValues);
            const sourceColorMap = getResultColorReplaceMap({
                cssColors,
                varsColorValues: baseVarColors,
                defaultPrimaryColor,
            });

            const targetValueReplacer = Object.keys(sourceColorMap)
                .concat(Object.values(hybridValueMap))
                .concat(otherValues)
                .reduce((tol, curr) => {
                    return { ...tol, [curr]: curr };
                }, {});
            const gradientReplacer = Object.keys(sourceColorMap)
                .map((key) => sourceColorMap[key].varColorString)
                .reduce((tol, curr) => {
                    return { ...tol, [curr]: curr };
                }, {});

            const fileContent = `
import { setNewThemeStyle } from '@zougt/some-loader-utils/dist/arbitraryMode/browser';
export const sourceThemeStyle = ${JSON.stringify(styleContent)};
export const hybridValueMap = ${JSON.stringify(hybridValueMap)};
export const otherValues = ${JSON.stringify(otherValues)};
export const sourceColorMap = ${JSON.stringify(sourceColorMap)};
/**
 * 通常只需 primaryColor ， gradientReplacer 和 targetValueReplacer 作为辅助使用
 * 
 * @param {string} options.primaryColor 新的主题色,替换所有颜色
 * @param {string} options.gradientReplacer 存在多个梯度主色，可单独替换某个梯度
 * @param {object} options.targetValueReplacer 可用于非颜色值的替换，如"padding:10px;" 中的 "10px"
 */
 export default function setCustomTheme({ primaryColor, gradientReplacer, targetValueReplacer }) {
    /**
     * gradientReplacer 可用属性：
     * ${JSON.stringify(gradientReplacer)}
     * targetValueReplacer 可用属性：（如果是颜色值，则是精确替换颜色）
     * ${JSON.stringify(targetValueReplacer)}
    */
    setNewThemeStyle({
        primaryColor,
        gradientReplacer,
        targetValueReplacer,
        styleTagId: "${styleTagId}",
        sourceThemeStyle,
        sourceColorMap,
        hybridValueMap,
        otherValues,
    });
}`;
            return prettier.resolveConfig(process.cwd()).then((options) => {
                fs.writeFileSync(
                    customThemeOutputPath,
                    prettier.format(fileContent, options || {})
                );
                cacheThemeStyleConent = styleContent;
                return { styleContent, styleTagId };
            });
        }
        return { styleContent, styleTagId };
    });
}

// eslint-disable-next-line import/prefer-default-export
export { createSetCustomThemeFile };
