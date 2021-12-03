import path from 'path';

import Color from 'color';

import fs from 'fs-extra';

import prettier from 'prettier';

import { extractThemeCss } from '../utils';

import { getCurrentPackRequirePath } from '../packPath';

import { colorValueReg, isSameColor } from './utils';

function getHsvPercentGias(primaryColor, resultColor) {
    const primaryHsvArr = primaryColor.hsv().array();
    const resultHsvArr = resultColor.hsv().array();
    const getGiasPercent = (index) =>
        primaryHsvArr[index] !== 0
            ? (primaryHsvArr[index] - resultHsvArr[index]) /
              primaryHsvArr[index]
            : primaryHsvArr[index];
    return [
        getGiasPercent(0),
        getGiasPercent(1),
        getGiasPercent(2),
        primaryColor.valpha !== 0
            ? (primaryColor.valpha - resultColor.valpha) / primaryColor.valpha
            : primaryColor.valpha,
    ];
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
    includeStyleWithColors,
}) {
    if (defaultPrimaryColor) {
        const defaultColor = Color(defaultPrimaryColor).hsv();
        if (
            !varsColorValues.some((varStr) => {
                const varColor = Color(varStr).hsv();
                return (
                    defaultColor.color[0] === varColor.color[0] &&
                    defaultColor.color[1] === varColor.color[1] &&
                    defaultColor.color[2] === varColor.color[2] &&
                    defaultColor.valpha === varColor.valpha
                );
            })
        ) {
            console.warn(
                `warning: defaultPrimaryColor:${defaultPrimaryColor} can not found in multipleScopeVars[].path`
            );
        }
    }
    const sourceColorMap = {};
    // const mixWeightsMap = {};
    cssColors.forEach((colorString) => {
        // 在 includeStyleWithColors 存在的颜色值就不会根据主色转换
        if (
            includeStyleWithColors
                .filter((item) => !item.inGradient)
                .some((item) => isSameColor(item.color, colorString))
        ) {
            return;
        }
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
        if (!finded && defaultPrimaryColor) {
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

function createSetCustomThemeFile({
    defaultPrimaryColor,
    styleTagId = 'coustom-theme-tagid',
    includeStyleWithColors,
    styleContent,
    themeRuleValues,
    customThemeOutputPath,
    appendedContent,
    preAppendedContent,
    importUtils,
}) {
    if (typeof defaultPrimaryColor !== 'string' || !defaultPrimaryColor) {
        throw Error('defaultPrimaryColor can not found.');
    }
    const targetRsoleved = getCurrentPackRequirePath();
    let baseVarColorsJson = {};
    if (fs.existsSync(`${targetRsoleved}/baseVarColors.json`)) {
        baseVarColorsJson = JSON.parse(
            fs.readFileSync(`${targetRsoleved}/baseVarColors.json`).toString()
        );
    }

    const { cssColors, hybridValueMap, otherValues } =
        separatValue(themeRuleValues);
    const sourceColorMap = getResultColorReplaceMap({
        cssColors,
        varsColorValues: baseVarColorsJson.baseVarColors || [],
        defaultPrimaryColor,
        includeStyleWithColors,
    });

    const targetValueReplacer = Object.keys(sourceColorMap)
        .concat(Object.keys(hybridValueMap))
        .concat(otherValues)
        .reduce((tol, curr) => {
            return { ...tol, [curr]: curr };
        }, {});
    const gradientReplacer = Object.keys(sourceColorMap)
        .map((key) => sourceColorMap[key].varColorString)
        .reduce((tol, curr) => {
            return { ...tol, [curr]: curr };
        }, {});
    const browerCodes = fs
        .readFileSync(path.join(__dirname, './browser.js'))
        .toString();
    const fileContent = `
${
    importUtils
        ? 'import { getSetNewThemeMethod } from "@zougt/some-loader-utils/dist/arbitraryMode/browser";'
        : ''
}
 ${
     !importUtils
         ? browerCodes
               .replace(
                   /import\s+([^\s]+|\{[^{}]+\})\s+from ['"][^'"]+['"];?/g,
                   ''
               )
               .replace(/export\s+\{[^{}]+\};?/g, '')
         : ''
 }\n    
var saveThemeOptions = {
    defaultPrimaryColor:${JSON.stringify(defaultPrimaryColor)},
    primaryColor:${JSON.stringify(defaultPrimaryColor)},
    sourceThemeStyle:${JSON.stringify(styleContent)},
    hybridValueMap:${JSON.stringify(hybridValueMap)},
    otherValues:${JSON.stringify(otherValues)},
    sourceColorMap:${JSON.stringify(sourceColorMap)},
    styleTagId: "${styleTagId}"
};
function setSaveThemeOptions(opt){saveThemeOptions=Object.assign(saveThemeOptions,opt||{});};
/**
 * 通常只需 primaryColor ， gradientReplacer 和 targetValueReplacer 作为辅助使用
 *
 * @param {object} options
 * @param {function} options.Color  required , 传入即可， 来源： https://github.com/Qix-/color
 * @param {string} options.primaryColor 新的主题色,替换所有颜色
 * @param {object} [options.gradientReplacer=${JSON.stringify(
     gradientReplacer
 )}] 存在多个梯度主色，可对应替换梯度主色
 * @param {object} [options.targetValueReplacer=${JSON.stringify(
     targetValueReplacer
 )}] 可用于非颜色值的替换，如"padding:10px;" 中的 "10px"，（如果是颜色值，则是精确替换颜色）
 */
function setCustomTheme(options) {
    setSaveThemeOptions(options);
    getSetNewThemeMethod({Color:options.Color}).setNewThemeStyle(saveThemeOptions);
}`;
    return prettier.resolveConfig(process.cwd()).then((options) => {
        const setCustomThemeConent = prettier.format(
            `${preAppendedContent || ''}${fileContent}${appendedContent || ''}`,
            options || {}
        );
        if (customThemeOutputPath) {
            fs.outputFileSync(customThemeOutputPath, setCustomThemeConent);
        }
        return {
            styleContent,
            setCustomThemeConent,
            hybridValueMap,
            otherValues,
            sourceColorMap,
        };
    });
}

// eslint-disable-next-line import/prefer-default-export
export { createSetCustomThemeFile, getThemeStyleContent };
