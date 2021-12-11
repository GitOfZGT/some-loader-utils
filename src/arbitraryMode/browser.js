/** 此文件内容，可能会不使用babel等工具编译，保证最好兼容性 */
/* eslint-disable prefer-destructuring */
/* eslint-disable prefer-arrow-callback */
/* eslint-disable func-names */
/* eslint-disable vars-on-top */
/* eslint-disable object-shorthand */
/* eslint-disable no-var */
/* eslint-disable import/prefer-default-export */
/* eslint-disable no-unused-vars */
/**
 *  @param {object} options
 *  @param {function} options.Color see https://github.com/Qix-/color
 *  */
function getSetNewThemeMethod(options) {
    var Color = options.Color;

    function getTargetColor(newPrimaryColor, percentGias) {
        var primaryHsvArr = newPrimaryColor.hsv().array();
        var getTargetVal = function (index) {
            return (
                primaryHsvArr[index] - percentGias[index] * primaryHsvArr[index]
            );
        };
        var targetColor = Color.hsv([
            getTargetVal(0),
            getTargetVal(1),
            getTargetVal(2),
            newPrimaryColor.valpha - percentGias[3] * newPrimaryColor.valpha,
        ]);
        return targetColor;
    }
    /**
     *
     * @param {object} opt
     * @param {string} opt.primaryColor 切换主题色
     * @param {string} opt.defaultPrimaryColor 默认主题色
     * @param {string} opt.sourceThemeStyle 源主题样式
     * @param {object} opt.sourceColorMap 梯度映射
     * @param {object} opt.hybridValueMap 混合值的映射
     * @param {array} opt.otherValues 非颜色的值
     * @param {object} [opt.gradientReplacer] 存在多个梯度主色，可对应替换梯度主色
     * @param {object} [opt.targetValueReplacer] 可用于非颜色值的替换，如"padding:10px;" 中的 "10px"，（如果是颜色值，则是精确替换颜色）
     */
    function getReplaceStyleValues(opt) {
        var primaryColor = opt.primaryColor || '';
        var gradientReplacer = opt.gradientReplacer || {};
        var targetValueReplacer = opt.targetValueReplacer || {};
        var sourceColorMap = opt.sourceColorMap || {};
        var hybridValueMap = opt.hybridValueMap || {};
        var otherValues = opt.otherValues || [];

        var replaceColorMap = {};
        for (var key in sourceColorMap) {
            if (Object.hasOwnProperty.call(sourceColorMap, key)) {
                if (targetValueReplacer[key]) {
                    replaceColorMap[key] = targetValueReplacer[key];
                } else {
                    var item = sourceColorMap[key];
                    var replacer = gradientReplacer[item.sourceVarColorString];
                    var newColor = getTargetColor(
                        Color(replacer || primaryColor),
                        replacer ? item.sourcePercentGias : item.percentGias
                    );
                    replaceColorMap[key] =
                        newColor.valpha < 1
                            ? newColor.rgb().toString()
                            : newColor.hex().toString();
                }
            }
        }
        var replaceHybridValueMap = {};
        Object.keys(hybridValueMap).forEach(function (temp) {
            var sourceValue = hybridValueMap[temp];
            var sourceColors = Object.keys(sourceColorMap);
            var findColor = sourceColors.find(function (colorStr) {
                return sourceValue.includes(colorStr);
            });
            if (findColor) {
                replaceHybridValueMap[sourceValue] = (
                    targetValueReplacer[temp] || temp
                ).replace('#{color}', replaceColorMap[findColor]);
            }
        });
        var replaceOtherValueMap = {};
        otherValues.forEach(function (val) {
            if (targetValueReplacer[val]) {
                replaceOtherValueMap[val] = targetValueReplacer[val];
            }
        });
        return {
            replaceColorMap: replaceColorMap,
            replaceHybridValueMap: replaceHybridValueMap,
            replaceOtherValueMap: replaceOtherValueMap,
        };
    }
    /**
     *
     * @param {object} opt
     * @param {string} opt.primaryColor 主题色
     * @param {string} opt.styleTagId html中主题样式的style tag id
     * @param {string} opt.sourceThemeStyle 源主题样式
     * @param {object} opt.sourceColorMap 梯度映射
     * @param {object} opt.hybridValueMap 混合值的映射
     * @param {array} opt.otherValues 非颜色的值
     * @param {object} [opt.gradientReplacer] 存在多个梯度主色，可对应替换梯度主色
     * @param {object} [opt.targetValueReplacer] 可用于非颜色值的替换，如"padding:10px;" 中的 "10px"，（如果是颜色值，则是精确替换颜色）
     */
    function setNewThemeStyle(opt) {
        var styleTagId = opt.styleTagId || '';
        var sourceThemeStyle = opt.sourceThemeStyle || '';
        var resultParam = getReplaceStyleValues(opt);
        var replaceColorMap = resultParam.replaceColorMap;
        var replaceHybridValueMap = resultParam.replaceHybridValueMap;
        var replaceOtherValueMap = resultParam.replaceOtherValueMap;

        var newStyleContent = sourceThemeStyle;
        Object.keys(replaceOtherValueMap).forEach(function (sourceValue) {
            newStyleContent = newStyleContent.replace(
                new RegExp(sourceValue.replace(/(\(|\)|\.)/g, '\\$1'), 'gi'),
                replaceOtherValueMap[sourceValue]
            );
        });
        Object.keys(replaceHybridValueMap).forEach(function (sourceValue) {
            newStyleContent = newStyleContent.replace(
                new RegExp(sourceValue.replace(/(\(|\)|\.)/g, '\\$1'), 'gi'),
                replaceHybridValueMap[sourceValue]
            );
        });
        Object.keys(replaceColorMap).forEach(function (sourceValue) {
            newStyleContent = newStyleContent.replace(
                new RegExp(sourceValue.replace(/(\(|\)|\.)/g, '\\$1'), 'gi'),
                replaceColorMap[sourceValue]
            );
        });
        // console.log(newStyleContent);
        // eslint-disable-next-line no-undef
        var styleTag = document.getElementById(styleTagId);
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
    return { setNewThemeStyle: setNewThemeStyle };
}

// 此行代码会在某些情况，会在不使用babel等编译时被移除掉
export { getSetNewThemeMethod };
