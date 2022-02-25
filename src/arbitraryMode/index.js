import path from 'path';

import Color from 'color';

import fs from 'fs-extra';

import prettier from 'prettier';

import { extractThemeCss } from '../utils';

import { getCurrentPackRequirePath } from '../packPath';

import { colorValueReg, isSameColor } from './utils';

function mix(color1, color2, weight) {
    const p = weight / 100.0;
    const w = p * 2 - 1;
    const a = color1.hsl().valpha - color2.hsl().valpha;

    const w1 = ((w * a === -1 ? w : (w + a) / (1 + w * a)) + 1) / 2.0;
    const w2 = 1 - w1;
    const alpha = color1.hsl().valpha * p + color2.hsl().valpha * (1 - p);
    const arr1 = color1.rgb().array();
    const arr2 = color2.rgb().array();
    const rgb = [
        arr1[0] * w1 + arr2[0] * w2,
        arr1[1] * w1 + arr2[1] * w2,
        arr1[2] * w1 + arr2[2] * w2,
        alpha,
    ];

    return Color.rgb(rgb);
}
function getMixColorAndWeight({ primaryColor, targetColor, otherMixColors }) {
    const arr = ['#ffffff', '#000000']
        .concat(otherMixColors || [])
        .map((cstr) => Color(cstr));
    const arr1 = targetColor.rgb().array();
    let weight = 0;
    let mixColor = null;
    for (let i = 0; i < arr.length; i++) {
        const color1 = arr[i];
        for (let j = 1; j <= 100; j++) {
            const sourceColor = mix(color1, primaryColor, j);
            const arr2 = sourceColor.rgb().array();
            if (
                Math.round(arr1[0]) === Math.round(arr2[0]) &&
                Math.round(arr1[1]) === Math.round(arr2[1]) &&
                Math.round(arr1[2]) === Math.round(arr2[2])
            ) {
                weight = j;
                mixColor = color1;
                break;
            }
        }
        if (mixColor) {
            break;
        }
    }
    return { mixColor, weight, valpha: targetColor.valpha };
}

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
    otherMixColors,
    defaultPrimaryColor,
    includeStyleWithColors,
    hueDiffControls,
}) {
    // if (defaultPrimaryColor) {

    // const defaultColor = Color(defaultPrimaryColor).hsv();
    // if (
    //     !varsColorValues.some((varStr) => {
    //         const varColor = Color(varStr).hsv();
    //         return (
    //             defaultColor.color[0] === varColor.color[0] &&
    //             defaultColor.color[1] === varColor.color[1] &&
    //             defaultColor.color[2] === varColor.color[2] &&
    //             defaultColor.valpha === varColor.valpha
    //         );
    //     })
    // ) {
    //     console.warn(
    //         `warning: defaultPrimaryColor:${defaultPrimaryColor} can not found in multipleScopeVars[].path`
    //     );
    // }
    // }
    let primaryVarColor = null;
    try {
        primaryVarColor = Color(defaultPrimaryColor).hsv();
    } catch (e) {
        throw Error(
            `error:defaultPrimaryColor: ${defaultPrimaryColor}  not a color value`
        );
    }
    const hueDiffControler = { low: 0, high: 0, ...(hueDiffControls || {}) };
    const sourceColorMap = {};

    cssColors.forEach((colorString) => {
        // 在 includeStyleWithColors 存在的颜色值就不会根据主色转换，除非启用了includeStyleWithColors[].inGradient:true
        if (
            includeStyleWithColors
                .filter((item) => !item.inGradient)
                .some((item) => {
                    if (Array.isArray(item.color)) {
                        return item.color.some((co) =>
                            isSameColor(co, colorString)
                        );
                    }
                    return isSameColor(item.color, colorString);
                })
        ) {
            return;
        }
        const resultColor = Color(colorString).hsv();
        let finded = false;
        for (let index = 0; index < varsColorValues.length; index++) {
            const varStr = varsColorValues[index];
            const varColor = Color(varStr).hsv();
            const varHue = Math.floor(varColor.color[0]);
            const hues = [varHue];
            for (let i = 0; i < hueDiffControler.low; i++) {
                const h = varHue - (i + 1);
                hues.push(h < 0 ? 0 : h);
            }
            for (let i = 0; i < hueDiffControler.high; i++) {
                const h = varHue + (i + 1);
                hues.push(h > 360 ? 360 : h);
            }
            const reHue = Math.floor(resultColor.color[0]);
            if (hues.some((h) => h === reHue)) {
                const { mixColor, weight, valpha } = getMixColorAndWeight({
                    primaryColor: varColor,
                    targetColor: resultColor,
                    otherMixColors,
                });
                if (mixColor) {
                    sourceColorMap[colorString] = {
                        mixColorString: mixColor.hex(),
                        weight,
                        // varColorString: defaultPrimaryColor,
                        sourceVarColorString: varStr,
                        valpha,
                    };
                } else {
                    sourceColorMap[colorString] = {
                        percentGias: getHsvPercentGias(
                            primaryVarColor,
                            resultColor
                        ),
                        // varColorString: defaultPrimaryColor,
                        sourcePercentGias: getHsvPercentGias(
                            varColor,
                            resultColor
                        ),
                        sourceVarColorString: varStr,
                    };
                }
                finded = true;
                break;
            }
        }
        if (!finded && defaultPrimaryColor) {
            const { mixColor, weight } = getMixColorAndWeight({
                primaryColor: primaryVarColor,
                targetColor: resultColor,
                otherMixColors,
            });
            if (mixColor) {
                sourceColorMap[colorString] = {
                    mixColorString: mixColor.hex(),
                    weight,
                    // varColorString: defaultPrimaryColor,
                };
            } else {
                sourceColorMap[colorString] = {
                    percentGias: getHsvPercentGias(
                        primaryVarColor,
                        resultColor
                    ),
                    // varColorString: defaultPrimaryColor,
                };
            }
        }
    });
    return sourceColorMap;
}
function getThemeStyleContent(scopeName, removeCssScopeName) {
    return extractThemeCss({ scopeName, removeCssScopeName }).then(
        ({ themeCss, themeRuleValues }) => {
            let styleContent = '';
            Object.values(themeCss).forEach((css) => {
                styleContent = `${styleContent}${css}`;
            });
            return { styleContent, themeRuleValues };
        }
    );
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
    hueDiffControls,
    otherMixColors,
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
        hueDiffControls,
        otherMixColors,
    });

    const targetValueReplacer = Object.keys(sourceColorMap)
        .concat(Object.keys(hybridValueMap))
        .concat(otherValues)
        .reduce((tol, curr) => {
            return { ...tol, [curr]: curr };
        }, {});
    const gradientReplacer = Object.keys(sourceColorMap)
        .map((key) => sourceColorMap[key].sourceVarColorString)
        .reduce((tol, curr) => {
            return { ...tol, [curr]: curr };
        }, {});
    const browerCodes = fs
        .readFileSync(path.join(__dirname, './browser.js'))
        .toString();

    fs.outputFile(
        `${targetRsoleved}/customThemeOptions.json`,

        JSON.stringify({
            Color: 'see https://github.com/Qix-/color',
            primaryColor: defaultPrimaryColor,
            gradientReplacer,
            targetValueReplacer,
        }),
        () => {}
    );

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
            { ...(options || {}), parser: 'babel' }
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
