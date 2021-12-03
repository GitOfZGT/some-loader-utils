/* eslint-disable import/prefer-default-export */
/* eslint-disable no-unused-vars */
/**
 *  @param {object} options
 *  @param {function} options.Color see https://github.com/Qix-/color
 *  */
function getSetNewThemeMethod(options) {
    const { Color } = options;

    function getTargetColor(newPrimaryColor, percentGias) {
        const primaryHsvArr = newPrimaryColor.hsv().array();
        const getTargetVal = (index) =>
            primaryHsvArr[index] - percentGias[index] * primaryHsvArr[index];
        const targetColor = Color.hsv([
            getTargetVal(0),
            getTargetVal(1),
            getTargetVal(2),
            newPrimaryColor.valpha - percentGias[3] * newPrimaryColor.valpha,
        ]);
        return targetColor;
    }
    /**
     *
     * @param {object} options
     * @param {string} options.primaryColor 切换主题色
     * @param {string} options.defaultPrimaryColor 默认主题色
     * @param {string} options.sourceThemeStyle 源主题样式
     * @param {object} options.sourceColorMap 梯度映射
     * @param {object} options.hybridValueMap 混合值的映射
     * @param {array} options.otherValues 非颜色的值
     * @param {object} [options.gradientReplacer] 存在多个梯度主色，可对应替换梯度主色
     * @param {object} [options.targetValueReplacer] 可用于非颜色值的替换，如"padding:10px;" 中的 "10px"，（如果是颜色值，则是精确替换颜色）
     */
    function getReplaceStyleValues({
        defaultPrimaryColor = '',
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
                            gradientReplacer[item.varColorString] ||
                                (Color(defaultPrimaryColor).hsv().array()[0] ===
                                Color(item.varColorString).hsv().array()[0]
                                    ? primaryColor
                                    : item.varColorString)
                        ),
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
        Object.keys(hybridValueMap).forEach((temp) => {
            const sourceValue = hybridValueMap[temp];
            const sourceColors = Object.keys(sourceColorMap);
            const findColor = sourceColors.find((colorStr) =>
                sourceValue.includes(colorStr)
            );
            if (findColor) {
                replaceHybridValueMap[sourceValue] = (
                    targetValueReplacer[temp] || temp
                ).replace('#{color}', replaceColorMap[findColor]);
            }
        });
        const replaceOtherValueMap = {};
        otherValues.forEach((val) => {
            if (targetValueReplacer[val]) {
                replaceOtherValueMap[val] = targetValueReplacer[val];
            }
        });
        return { replaceColorMap, replaceHybridValueMap, replaceOtherValueMap };
    }
    /**
     *
     * @param {object} options
     * @param {string} options.primaryColor 主题色
     * @param {string} options.styleTagId html中主题样式的style tag id
     * @param {string} options.sourceThemeStyle 源主题样式
     * @param {object} options.sourceColorMap 梯度映射
     * @param {object} options.hybridValueMap 混合值的映射
     * @param {array} options.otherValues 非颜色的值
     * @param {object} [options.gradientReplacer] 存在多个梯度主色，可对应替换梯度主色
     * @param {object} [options.targetValueReplacer] 可用于非颜色值的替换，如"padding:10px;" 中的 "10px"，（如果是颜色值，则是精确替换颜色）
     */
    function setNewThemeStyle({
        styleTagId,
        defaultPrimaryColor,
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
                defaultPrimaryColor,
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
                new RegExp(sourceValue.replace(/(\(|\)|\.)/g, '\\$1'), 'gi'),
                replaceOtherValueMap[sourceValue]
            );
        });
        Object.keys(replaceHybridValueMap).forEach((sourceValue) => {
            newStyleContent = newStyleContent.replace(
                new RegExp(sourceValue.replace(/(\(|\)|\.)/g, '\\$1'), 'gi'),
                replaceHybridValueMap[sourceValue]
            );
        });
        Object.keys(replaceColorMap).forEach((sourceValue) => {
            newStyleContent = newStyleContent.replace(
                new RegExp(sourceValue.replace(/(\(|\)|\.)/g, '\\$1'), 'gi'),
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
    return { setNewThemeStyle };
}

export { getSetNewThemeMethod };
