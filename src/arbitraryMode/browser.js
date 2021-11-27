import Color from 'color';

function getTargetColor(newPrimaryColor, resultColor, percentGias) {
    const primaryHsvArr = newPrimaryColor.hsv().array();
    const getTargetVal = (index) =>
        primaryHsvArr[index] - percentGias[index] * primaryHsvArr[index];
    const targetColor = Color.hsv([
        getTargetVal(0),
        getTargetVal(1),
        getTargetVal(2),
    ]).alpha(newPrimaryColor.valpha);
    return targetColor;
}

function getReplaceStyleValues({
    primaryColor = '',
    gradientReplacer = {},
    targetValueReplacer = {},
    sourceColorMap = {},
    hybridValueMap = {},
    otherValues = [],
}) {
    const replaceColorMap = {};
    for (const key in sourceColorMap) {
        if (Object.hasOwnProperty.call(sourceColorMap, key)) {
            if (targetValueReplacer[key]) {
                replaceColorMap[key] = targetValueReplacer[key];
            } else {
                const item = sourceColorMap[key];
                const newColor = getTargetColor(
                    Color(
                        gradientReplacer[item.varColorString] || primaryColor
                    ),
                    Color(key),
                    item.percentGias
                );
                replaceColorMap[key] =
                    newColor.valpha < 1
                        ? newColor.rgb().toString()
                        : newColor.hex().toString();
            }
        }
    }
    const replaceHybridValueMap = {};
    for (const sourceValue in hybridValueMap) {
        if (Object.hasOwnProperty.call(hybridValueMap, sourceValue)) {
            const temp = hybridValueMap[sourceValue];
            const sourceColors = Object.keys(sourceColorMap);
            const findColor = sourceColors.find((colorStr) =>
                sourceValue.includes(colorStr)
            );
            if (findColor) {
                replaceHybridValueMap[sourceValue] = (
                    targetValueReplacer[temp] || temp
                ).replace('#{color}', replaceColorMap[findColor]);
            }
        }
    }
    const replaceOtherValueMap = {};
    otherValues.forEach((val) => {
        if (targetValueReplacer[val]) {
            replaceOtherValueMap[val] = targetValueReplacer[val];
        }
    });
    return { replaceColorMap, replaceHybridValueMap, replaceOtherValueMap };
}

function setNewThemeStyle({
    styleTagId,
    primaryColor,
    gradientReplacer,
    targetValueReplacer,
    sourceThemeStyle,
    sourceColorMap,
    hybridValueMap,
    otherValues,
}) {
    const { replaceColorMap, replaceHybridValueMap, replaceOtherValueMap } =
        getReplaceStyleValues({
            primaryColor,
            gradientReplacer,
            targetValueReplacer,
            sourceColorMap,
            hybridValueMap,
            otherValues,
        });

    let newStyleContent = sourceThemeStyle;
    Object.keys(replaceOtherValueMap).forEach((sourceValue) => {
        newStyleContent = newStyleContent.replace(
            new RegExp(sourceValue, 'gi'),
            replaceOtherValueMap[sourceValue]
        );
    });
    Object.keys(replaceHybridValueMap).forEach((sourceValue) => {
        newStyleContent = newStyleContent.replace(
            new RegExp(sourceValue, 'gi'),
            replaceHybridValueMap[sourceValue]
        );
    });
    Object.keys(replaceColorMap).forEach((sourceValue) => {
        newStyleContent = newStyleContent.replace(
            new RegExp(sourceValue, 'gi'),
            replaceColorMap[sourceValue]
        );
    });
    // console.log(newStyleContent);
    // eslint-disable-next-line no-undef
    let styleTag = document.getElementById(styleTagId);
    if (styleTag) {
        styleTag.innerHTML = newStyleContent;
    } else {
        // eslint-disable-next-line no-undef
        styleTag = document.createElement('style');
        styleTag.id = styleTagId;
        styleTag.type = 'text/css';
        styleTag.innerHTML = newStyleContent;
        // eslint-disable-next-line no-undef
        document.body.appendChild(styleTag);
    }
}

export { getTargetColor, setNewThemeStyle };
export default {};
