const Color = require('color');
// const differenceAggMap1 = require('./differenceAggMap2')
// // const differenceAggMap2 = require('./differenceAggMap2')

// const agg= new Set();
// for (const key in differenceAggMap1) {
//     if (Object.hasOwnProperty.call(differenceAggMap1, key)) {
//         const element = differenceAggMap1[key];
//         element.forEach(val=>{
//             agg.add(val)
//         })
//     }
// }
// console.log(Array.from(agg))
// console.log(Color('#09A500').hsv().array())
// console.log(Color('#CADCC9').hsv().array())
// console.log(Color('hsla(120,0%,75%,0.3)').hsv())

// 298 84 64
// 298 2 86
// 0 82 -12

// const values = [
//     '#F4791E',
//     '#fef2e9',
//     '#fde4d2',
//     '#f4791e',
//     '#f6944b',
//     '#fbc9a5',
//     '#f8af78',
//     '#fcd7bc',
//     '#dc6d1b',
//     '#fabc8f',
//     '#fef4ed',
//     '#fffcfb',
//     '#fef8f4',
//     '#f6964f',
// ];
// const values =[
//     '#9D26B0', '#F4791E', '#f5e9f7',
//     '#ebd4ef', '#9d26b0', '#b151c0',
//     '#d8a8df', '#fef2e9', '#fde4d2',
//     '#f4791e', '#f6944b', '#fbc9a5',
//     '#c47dd0', '#f8af78', '#e2bee7',
//     '#8d229e', '#ce93d8', '#fcd7bc',
//     '#dc6d1b', '#fabc8f', '#f7eef9',
//     '#fef4ed', '#fdfbfd', '#fffcfb',
//     '#faf4fb', '#fef8f4', '#be36d3',
//     '#f6964f'
//   ]
// const values = [
//     '#9D26B0',
//     '-1px 0 0 0 #c47dd0',
//     '5px 12px',
//     '#f5e9f7',
//     '#ebd4ef',
//     '#9d26b0',
//     '#b151c0',
//     '#d8a8df',
//     '#faf4fb',
//     '2px dashed #9D26B0',
//     '0 0 2px 2px #9D26B0',
//     '10px',
//     '#be36d3',
//     '10px 10px 0 20px',
//     '10px 10px 10px 20px',
//     '10px 20px',
//     '10px 20px 20px 20px',
//     '#e2bee7',
//     '#8d229e',
//     '#ce93d8',
//     '#c47dd0',
//     '5px',
//     '#fdfbfd',
//     '2px solid #9D26B0',
//     '0 0 2px 2px #9D26B0 inset',
//     '#f7eef9',
// ].reduce((tol, curr) => {
//     const n = curr.split(/\s+/);
//     return [...tol, ...n.filter((c) => c.includes('#'))];
// }, []);
// const primaryArr = Color('#9D26B0').hsv().array();
// values.forEach((val) => {
//     const carr = Color(val).hsv().array();

//     console.log(carr.map((v, i) => primaryArr[i] - v));
// });
// const jiezhi = [
//     [0, 0, 0],
//     [0.41382922996353955, 38.50524475524475, -12.549019607843135],
//     [0.3105590062112924, 72.74107471475892, -27.84313725490196],
//     [0.6280193236716514, 67.1120197793838, -24.705882352941174],
//     [0, 0, 0],
//     [-0.15276145710913624, 20.596590909090907, -6.274509803921575],
//     [-0.6245059288537504, 53.74541377904606, -18.431372549019613],
//     [0.3105590062114061, 75.62024628757698, -29.411764705882348],
//     [0, 0, 0],
//     [0, 0, 0],
//     [-0.2353918582108463, 4.001507970702292, -13.725490196078425],
//     [-0.9437963944856165, 60.66017316017316, -21.5686274509804],
//     [-0.03506311360433756, -0.07192174913694771, 7.058823529411761],
//     [0.43478260869574115, 46.464646464646464, -15.686274509803923],
//     [0.41382922996353955, 38.50524475524475, -12.549019607843135],
//     [-8.260869565217263, 77.6185770750988, -30.196078431372555],
//     [0, 0, 0],
//     [0, 0, 0],
//     [2.648221343873729, 73.99142022635999, -28.627450980392155],
// ];
// function outAllHex(color) {
//     const primaryArr = Color(color).hsv().array();
//     const outhex = jiezhi.map((item) =>
//         Color.hsv(
//             item.map((v, i) => {
//                 const newv = primaryArr[i] - v;
//                 const max = i === 0 ? 360 : 100;
//                 return newv < 0 ? 0 : newv > max ? max : newv;
//             })
//         )
//             .hex()
//             .toString()
//     );
//     console.log(outhex);
// }
// outAllHex('#F4791E');

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

function getTargetColor(newPrimaryColor, resultColor, percentGias) {
    const primaryHsvArr = newPrimaryColor.hsv().array();
    const getTargetVal = (index) =>
        primaryHsvArr[index] - percentGias[index] * primaryHsvArr[index];
    const targetColor = Color.hsv([
        getTargetVal(0),
        getTargetVal(1),
        getTargetVal(2),
    ]);
    targetColor.valpha = resultColor.valpha;
    return targetColor;
}

// console.log(Color('#CA359D').hsv().rgb());

// const percentGias = getHsvPercentGias(Color('#CA359D'), Color('#B6E8E6'));
// console.log(getTargetColor(Color('#296CDC'),Color('#B6E8E6'),percentGias).hex());

function mix(color1, color2, weight) {
    const rgb1 = color1.rgb();
    const rgb2 = color2.rgb();
    weight = weight ? parseInt(weight, 10) : 50;
    const p = weight / 100.0;
    const w = p * 2 - 1;
    const a = rgb1.valpha - rgb2.valpha;
    const w1 = ((w * a === -1 ? w : (w + a) / (1 + w * a)) + 1) / 2.0;
    const alpha = rgb1.valpha * p + rgb2.valpha * (1 - p);
    const getRgbVal = (index) =>
        Math.round(rgb1.color[index] * w1 + rgb2.color[index] * (1 - w1));
    // const rgb = [getRgbVal(0), getRgbVal(1), getRgbVal(2)];
    return Color(
        `rgba(${getRgbVal(0)}, ${getRgbVal(1)}, ${getRgbVal(2)}, ${alpha})`
    );
}

function reverseMix(defaultPrimary, resultColor, weight) {
    const pRgb = defaultPrimary.rgb();
    const rRgb = resultColor.rgb();
    weight = weight ? parseInt(weight, 10) : 50;
    const p = weight / 100.0;
    const w = p * 2 - 1;
    const xalpha = (resultColor.valpha - pRgb.valpha * (1 - p)) / p;
    const a = xalpha - pRgb.valpha;
    const w1 = ((w * a === -1 ? w : (w + a) / (1 + w * a)) + 1) / 2.0;
    const getRgbVal = (index) =>
        Math.round((rRgb.color[index] - pRgb.color[index] * (1 - w1)) / w1);
    // const rgb = [getRgbVal(0), getRgbVal(1), getRgbVal(2)];
    return Color(
        `rgba(${getRgbVal(0)}, ${getRgbVal(1)}, ${getRgbVal(2)}, ${xalpha})`
    );
}
// const mixWeights = {
//     '#ea9fa3': '30%',
// };
// const resultColorString = '#ea9fa3';
// const defaultPrimary = Color('#F6CD9F');
// const resultColor = Color(resultColorString);
// const xColor = reverseMix(
//     defaultPrimary,
//     resultColor,
//     mixWeights[resultColorString]
// );
// const primaryColor = Color('#34DC70');
// const targetColor = mix(xColor, primaryColor, mixWeights[resultColorString]);
// console.log(Color('blanchedalmond'));

const values = [
    '#9D26B0',
    '-1px 0 0 0 #c47dd0',
    '5px 12px',
    '#f5e9f7',
    '#ebd4ef',
    '#9d26b0',
    '#b151c0',
    '#d8a8df',
    '#faf4fb',
    '2px dashed #9D26B0',
    '0 0 2px 2px #9D26B0',
    '10px',
    '#be36d3',
    '10px 10px 0 20px',
    '10px 10px 10px 20px',
    '10px 20px',
    '10px 20px 20px 20px',
    '#e2bee7',
    '#8d229e',
    '#ce93d8',
    '#c47dd0',
    '5px',
    '#fdfbfd',
    '2px solid #9D26B0',
    '0 0 2px 2px #9D26B0 inset',
    '#f7eef9',
];

const colorValueReg = {
    hex: /#([0-9a-f]{8}|[0-9a-f]{6}|[0-9a-f]{3})/gi,
    rgb: /rgb\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*\)/gi,
    rgba: /rgba\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*(0|1|1.0|0?.[0-9])\s*\)/gi,
    hsl: /hsl\(\s*\d{1,3}\s*,\s*(0|\d{1,3}%)\s*,\s*(0|\d{1,3}%)\s*\)/gi,
    hsla: /hsla\(\s*\d{1,3}\s*,\s*(0|\d{1,3}%)\s*,\s*(0|\d{1,3}%)\s*,\s*(0|1|1.0|0?.[0-9])\s*\)/gi,
};

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
const { cssColors, hybridValueMap, otherValues } = separatValue(values);
const varsColorValues = ['#9D26B0'];
const defaultPrimaryColor = '#9D26B0';
function getResultColorReplaceMap({ varsColorValues, defaultPrimaryColor }) {
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
const sourceColorMap = getResultColorReplaceMap({
    varsColorValues,
    defaultPrimaryColor,
});
// console.log(mixWeightsMap);

function getReplaceStyleValues({
    primaryColor = '',
    targetValueReplacer = {},
    sourceColorMap = {},
    hybridValueMap = {},
    otherValues = [],
}) {
    const replaceColorMap = {};
    for (const key in sourceColorMap) {
        if (Object.hasOwnProperty.call(sourceColorMap, key)) {
            const item = sourceColorMap[key];
            replaceColorMap[key] = getTargetColor(
                Color(primaryColor),
                Color(key),
                item.percentGias
            )
                .hex()
                .toString();
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
    targetValueReplacer,
    sourceThemeStyle,
    sourceColorMap,
    hybridValueMap,
    otherValues,
}) {
    const { replaceColorMap, replaceHybridValueMap, replaceOtherValueMap } =
        getReplaceStyleValues({
            primaryColor,
            targetValueReplacer,
            sourceColorMap,
            hybridValueMap,
            otherValues,
        });

    console.log(replaceColorMap, replaceHybridValueMap, replaceOtherValueMap);
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
    console.log(newStyleContent)
    // const styleTag = document.getElementById(styleTagId);
    // if (styleTag) {
    //     styleTag.content = newStyleContent;
    // }
}

const sourceThemeStyle = `.el-checkbox.is-bordered.is-checked {  border-color: #9D26B0;}.el-checkbox__input.is-checked .el-checkbox__inner {  background-color: #9D26B0;  border-color: #9D26B0;}.el-checkbox__input.is-checked + .el-checkbox__label {  color: #9D26B0;}.el-checkbox__input.is-focus .el-checkbox__inner {  border-color: #9D26B0;}.el-checkbox__input.is-indeterminate .el-checkbox__inner {  background-color: #9D26B0;  border-color: #9D26B0;}.el-checkbox__inner:hover {  border-color: #9D26B0;}.el-checkbox-button__inner:hover {  color: #9D26B0;}.el-checkbox-button.is-checked .el-checkbox-button__inner {  background-color: #9D26B0;  border-color: #9D26B0;  box-shadow: -1px 0 0 0 #c47dd0;}.el-checkbox-button.is-checked:first-child .el-checkbox-button__inner {  border-left-color: #9D26B0;}.el-checkbox-button.is-focus .el-checkbox-button__inner {  border-color: #9D26B0;}.el-checkbox-button--mini .el-checkbox-button__inner {  padding: 5px 12px;}.el-checkbox-button--mini .el-checkbox-button__inner.is-round {  padding: 5px 12px;}.el-tag {  background-color: #f5e9f7;  border-color: #ebd4ef;  color: #9D26B0;}.el-tag.is-hit {  border-color: #9D26B0;}.el-tag .el-tag__close {  color: #9d26b0;}.el-tag .el-tag__close:hover {  background-color: #9d26b0;}.el-tag--dark {  background-color: #9d26b0;  border-color: #9d26b0;}.el-tag--dark.is-hit {  border-color: #9D26B0;}.el-tag--dark .el-tag__close:hover {  background-color: #b151c0;}.el-tag--plain {  border-color: #d8a8df;  color: #9d26b0;}.el-tag--plain.is-hit {  border-color: #9D26B0;}.el-tag--plain .el-tag__close {  color: #9d26b0;}.el-tag--plain .el-tag__close:hover {  background-color: #9d26b0;}.el-table-filter__list-item:hover {  background-color: #f5e9f7;  color: #b151c0;}.el-table-filter__list-item.is-active {  background-color: #9D26B0;}.el-table-filter__bottom button:hover {  color: #9D26B0;}.yb-main-aside .el-menu:not([class~=el-menu--collapse]) .el-menu-item.is-active::after {  background-color: #f5e9f7;}.yb-main-aside-footer:hover {  background-color: #faf4fb;}.yb-main-body-tab-center .router-tab__item.is-active,.yb-main-body-tab-center .router-tab__item:hover {  color: #9D26B0;}.el-textarea__inner:focus {  border-color: #9D26B0;}.el-input__inner:focus {  border-color: #9D26B0;}.el-input.is-active .el-input__inner {  border-color: #9D26B0;}.el-input-number__increase:hover, .el-input-number__decrease:hover {  color: #9D26B0;}.el-input-number__increase:hover:not(.is-disabled) ~ .el-input .el-input__inner:not(.is-disabled), .el-input-number__decrease:hover:not(.is-disabled) ~ .el-input .el-input__inner:not(.is-disabled) {  border-color: #9D26B0;}.el-tag {  background-color: #f5e9f7;  border-color: #ebd4ef;  color: #9D26B0;}.el-tag.is-hit {  border-color: #9D26B0;}.el-tag .el-tag__close {  color: #9d26b0;}.el-tag .el-tag__close:hover {  background-color: #9d26b0;}.el-tag--dark {  background-color: #9d26b0;  border-color: #9d26b0;}.el-tag--dark.is-hit {  border-color: #9D26B0;}.el-tag--dark .el-tag__close:hover {  background-color: #b151c0;}.el-tag--plain {  border-color: #d8a8df;  color: #9d26b0;}.el-tag--plain.is-hit {  border-color: #9D26B0;}.el-tag--plain .el-tag__close {  color: #9d26b0;}.el-tag--plain .el-tag__close:hover {  background-color: #9d26b0;}.el-progress-bar__inner {  background-color: #9D26B0;}.el-upload--picture-card:hover {  border-color: #9D26B0;  color: #9D26B0;}.el-upload:focus {  border-color: #9D26B0;  color: #9D26B0;}.el-upload:focus .el-upload-dragger {  border-color: #9D26B0;}.el-upload-dragger .el-upload__text em {  color: #9D26B0;}.el-upload-dragger:hover {  border-color: #9D26B0;}.el-upload-dragger.is-dragover {  border: 2px dashed #9D26B0;}.el-upload-list__item .el-icon-close-tip {  color: #9D26B0;}.el-upload-list__item.is-success .el-upload-list__item-name:hover, .el-upload-list__item.is-success .el-upload-list__item-name:focus {  color: #9D26B0;}.el-upload-list__item-delete:hover {  color: #9D26B0;}.yb-page-404-content span {  color: #9D26B0;}.el-textarea__inner:focus {  border-color: #9D26B0;}.el-input__inner:focus {  border-color: #9D26B0;}.el-input.is-active .el-input__inner {  border-color: #9D26B0;}.el-tag {  background-color: #f5e9f7;  border-color: #ebd4ef;  color: #9D26B0;}.el-tag.is-hit {  border-color: #9D26B0;}.el-tag .el-tag__close {  color: #9d26b0;}.el-tag .el-tag__close:hover {  background-color: #9d26b0;}.el-tag--dark {  background-color: #9d26b0;  border-color: #9d26b0;}.el-tag--dark.is-hit {  border-color: #9D26B0;}.el-tag--dark .el-tag__close:hover {  background-color: #b151c0;}.el-tag--plain {  border-color: #d8a8df;  color: #9d26b0;}.el-tag--plain.is-hit {  border-color: #9D26B0;}.el-tag--plain .el-tag__close {  color: #9d26b0;}.el-tag--plain .el-tag__close:hover {  background-color: #9d26b0;}.el-checkbox.is-bordered.is-checked {  border-color: #9D26B0;}.el-checkbox__input.is-checked .el-checkbox__inner {  background-color: #9D26B0;  border-color: #9D26B0;}.el-checkbox__input.is-checked + .el-checkbox__label {  color: #9D26B0;}.el-checkbox__input.is-focus .el-checkbox__inner {  border-color: #9D26B0;}.el-checkbox__input.is-indeterminate .el-checkbox__inner {  background-color: #9D26B0;  border-color: #9D26B0;}.el-checkbox__inner:hover {  border-color: #9D26B0;}.el-checkbox-button__inner:hover {  color: #9D26B0;}.el-checkbox-button.is-checked .el-checkbox-button__inner {  background-color: #9D26B0;  border-color: #9D26B0;  box-shadow: -1px 0 0 0 #c47dd0;}.el-checkbox-button.is-checked:first-child .el-checkbox-button__inner {  border-left-color: #9D26B0;}.el-checkbox-button.is-focus .el-checkbox-button__inner {  border-color: #9D26B0;}.el-checkbox-button--mini .el-checkbox-button__inner {  padding: 5px 12px;}.el-checkbox-button--mini .el-checkbox-button__inner.is-round {  padding: 5px 12px;}.el-radio.is-bordered.is-checked {  border-color: #9D26B0;}.el-radio__input.is-checked .el-radio__inner {  border-color: #9D26B0;  background: #9D26B0;}.el-radio__input.is-checked + .el-radio__label {  color: #9D26B0;}.el-radio__input.is-focus .el-radio__inner {  border-color: #9D26B0;}.el-radio__inner:hover {  border-color: #9D26B0;}.el-radio:focus:not(.is-focus):not(:active):not(.is-disabled) .el-radio__inner {  box-shadow: 0 0 2px 2px #9D26B0;}.el-cascader-node.in-active-path, .el-cascader-node.is-selectable.in-checked-path, .el-cascader-node.is-active {  color: #9D26B0;}.el-cascader .el-input .el-input__inner:focus {  border-color: #9D26B0;}.el-cascader .el-input.is-focus .el-input__inner {  border-color: #9D26B0;}.el-cascader__suggestion-item.is-checked {  color: #9D26B0;}.el-drawer__header {  padding: 10px;}.yb-ball-loading:not(:required) {  background: #9D26B0;}.yb-ball-loading:not(:required)::after {  background: #be36d3;}.yb-table-control-icon:hover {  color: #9D26B0;}.type-radio::v-deep .el-radio.is-checked .el-radio__inner {  color: #9D26B0;}.el-drawer__header {  margin-bottom: 10px;  padding: 10px 10px 0 20px;}.el-dialog__header {  padding: 10px 10px 10px 20px;}.el-dialog__body {  padding: 10px 20px;}.el-dialog__footer {  padding: 10px 20px 20px 20px;}.el-loading-spinner .el-loading-text {  color: #9D26B0;}.el-loading-spinner .path {  stroke: #9D26B0;}.el-loading-spinner i {  color: #9D26B0;}.el-button:hover, .el-button:focus {  color: #9D26B0;  border-color: #e2bee7;  background-color: #f5e9f7;}.el-button:active {  color: #8d229e;  border-color: #8d229e;}.el-button.is-plain:hover, .el-button.is-plain:focus {  border-color: #9D26B0;  color: #9D26B0;}.el-button.is-plain:active {  border-color: #8d229e;  color: #8d229e;}.el-button.is-active {  color: #8d229e;  border-color: #8d229e;}.el-button--primary {  background-color: #9D26B0;  border-color: #9D26B0;}.el-button--primary:hover, .el-button--primary:focus {  background: #b151c0;  border-color: #b151c0;}.el-button--primary:active {  background: #8d229e;  border-color: #8d229e;}.el-button--primary.is-active {  background: #8d229e;  border-color: #8d229e;}.el-button--primary.is-disabled, .el-button--primary.is-disabled:hover, .el-button--primary.is-disabled:focus, .el-button--primary.is-disabled:active {  background-color: #ce93d8;  border-color: #ce93d8;}.el-button--primary.is-plain {  color: #9D26B0;  background: #f5e9f7;  border-color: #d8a8df;}.el-button--primary.is-plain:hover, .el-button--primary.is-plain:focus {  background: #9D26B0;  border-color: #9D26B0;}.el-button--primary.is-plain:active {  background: #8d229e;  border-color: #8d229e;}.el-button--primary.is-plain.is-disabled, .el-button--primary.is-plain.is-disabled:hover, .el-button--primary.is-plain.is-disabled:focus, .el-button--primary.is-plain.is-disabled:active {  color: #c47dd0;  background-color: #f5e9f7;  border-color: #ebd4ef;}.el-button--mini {  padding: 5px 12px;}.el-button--mini.is-round {  padding: 5px 12px;}.el-button--mini.is-circle {  padding: 5px;}.el-button--text {  color: #9D26B0;}.el-button--text:hover, .el-button--text:focus {  color: #b151c0;}.el-button--text:active {  color: #8d229e;}.el-progress-bar__inner {  background-color: #9D26B0;}.el-drawer__header {  margin-bottom: 10px;  padding: 10px 10px 0 20px;}.el-dialog__header {  padding: 10px 10px 10px 20px;}.el-dialog__body {  padding: 10px 20px;}.el-dialog__footer {  padding: 10px 20px 20px 20px;}.el-date-table td.today span {  color: #9D26B0;}.el-date-table td.available:hover {  color: #9D26B0;}.el-date-table td.current:not(.disabled) span {  background-color: #9D26B0;}.el-date-table td.start-date span, .el-date-table td.end-date span {  background-color: #9D26B0;}.el-date-table td.selected span {  background-color: #9D26B0;}.el-month-table td.today .cell {  color: #9D26B0;}.el-month-table td .cell:hover {  color: #9D26B0;}.el-month-table td.start-date .cell, .el-month-table td.end-date .cell {  background-color: #9D26B0;}.el-month-table td.current:not(.disabled) .cell {  color: #9D26B0;}.el-year-table td.today .cell {  color: #9D26B0;}.el-year-table td .cell:hover {  color: #9D26B0;}.el-year-table td.current:not(.disabled) .cell {  color: #9D26B0;}.el-time-spinner__arrow:hover {  color: #9D26B0;}.el-range-editor.is-active {  border-color: #9D26B0;}.el-range-editor.is-active:hover {  border-color: #9D26B0;}.el-picker-panel__shortcut:hover {  color: #9D26B0;}.el-picker-panel__shortcut.active {  color: #9D26B0;}.el-picker-panel__icon-btn:hover {  color: #9D26B0;}.el-date-picker__header-label:hover {  color: #9D26B0;}.el-date-picker__header-label.active {  color: #9D26B0;}.el-time-panel__btn.confirm {  color: #9D26B0;}.el-textarea__inner:focus {  border-color: #9D26B0;}.el-input__inner:focus {  border-color: #9D26B0;}.el-input.is-active .el-input__inner {  border-color: #9D26B0;}.el-radio.is-bordered.is-checked {  border-color: #9D26B0;}.el-radio__input.is-checked .el-radio__inner {  border-color: #9D26B0;  background: #9D26B0;}.el-radio__input.is-checked + .el-radio__label {  color: #9D26B0;}.el-radio__input.is-focus .el-radio__inner {  border-color: #9D26B0;}.el-radio__inner:hover {  border-color: #9D26B0;}.el-radio:focus:not(.is-focus):not(:active):not(.is-disabled) .el-radio__inner {  box-shadow: 0 0 2px 2px #9D26B0;}.el-checkbox.is-bordered.is-checked {  border-color: #9D26B0;}.el-checkbox__input.is-checked .el-checkbox__inner {  background-color: #9D26B0;  border-color: #9D26B0;}.el-checkbox__input.is-checked + .el-checkbox__label {  color: #9D26B0;}.el-checkbox__input.is-focus .el-checkbox__inner {  border-color: #9D26B0;}.el-checkbox__input.is-indeterminate .el-checkbox__inner {  background-color: #9D26B0;  border-color: #9D26B0;}.el-checkbox__inner:hover {  border-color: #9D26B0;}.el-checkbox-button__inner:hover {  color: #9D26B0;}.el-checkbox-button.is-checked .el-checkbox-button__inner {  background-color: #9D26B0;  border-color: #9D26B0;  box-shadow: -1px 0 0 0 #c47dd0;}.el-checkbox-button.is-checked:first-child .el-checkbox-button__inner {  border-left-color: #9D26B0;}.el-checkbox-button.is-focus .el-checkbox-button__inner {  border-color: #9D26B0;}.el-checkbox-button--mini .el-checkbox-button__inner {  padding: 5px 12px;}.el-checkbox-button--mini .el-checkbox-button__inner.is-round {  padding: 5px 12px;}.el-tag {  background-color: #f5e9f7;  border-color: #ebd4ef;  color: #9D26B0;}.el-tag.is-hit {  border-color: #9D26B0;}.el-tag .el-tag__close {  color: #9d26b0;}.el-tag .el-tag__close:hover {  background-color: #9d26b0;}.el-tag--dark {  background-color: #9d26b0;  border-color: #9d26b0;}.el-tag--dark.is-hit {  border-color: #9D26B0;}.el-tag--dark .el-tag__close:hover {  background-color: #b151c0;}.el-tag--plain {  border-color: #d8a8df;  color: #9d26b0;}.el-tag--plain.is-hit {  border-color: #9D26B0;}.el-tag--plain .el-tag__close {  color: #9d26b0;}.el-tag--plain .el-tag__close:hover {  background-color: #9d26b0;}.el-table th.el-table__cell > .cell.highlight {  color: #9D26B0;}.el-table .ascending .sort-caret.ascending {  border-bottom-color: #9D26B0;}.el-table .descending .sort-caret.descending {  border-top-color: #9D26B0;}.el-table--striped .el-table__body tr.el-table__row--striped.current-row td.el-table__cell {  background-color: #f5e9f7;}.el-table__body tr.current-row > td.el-table__cell {  background-color: #f5e9f7;}.el-select-dropdown.is-multiple .el-select-dropdown__item.selected {  color: #9D26B0;}.el-textarea__inner:focus {  border-color: #9D26B0;}.el-input__inner:focus {  border-color: #9D26B0;}.el-input.is-active .el-input__inner {  border-color: #9D26B0;}.el-tag {  background-color: #f5e9f7;  border-color: #ebd4ef;  color: #9D26B0;}.el-tag.is-hit {  border-color: #9D26B0;}.el-tag .el-tag__close {  color: #9d26b0;}.el-tag .el-tag__close:hover {  background-color: #9d26b0;}.el-tag--dark {  background-color: #9d26b0;  border-color: #9d26b0;}.el-tag--dark.is-hit {  border-color: #9D26B0;}.el-tag--dark .el-tag__close:hover {  background-color: #b151c0;}.el-tag--plain {  border-color: #d8a8df;  color: #9d26b0;}.el-tag--plain.is-hit {  border-color: #9D26B0;}.el-tag--plain .el-tag__close {  color: #9d26b0;}.el-tag--plain .el-tag__close:hover {  background-color: #9d26b0;}.el-select-dropdown__item.selected {  color: #9D26B0;}.el-select .el-input__inner:focus {  border-color: #9D26B0;}.el-select .el-input.is-focus .el-input__inner {  border-color: #9D26B0;}.el-pagination button:hover {  color: #9D26B0;}.el-pagination__sizes .el-input .el-input__inner:hover {  border-color: #9D26B0;}.el-pagination.is-background .btn-prev,.el-pagination.is-background .btn-next,.el-pagination.is-background .el-pager li {  background-color: #fdfbfd;}.el-pagination.is-background .el-pager li:not(.disabled):hover {  color: #9D26B0;}.el-pagination.is-background .el-pager li:not(.disabled).active {  background-color: #9D26B0;}.el-pager li:hover {  color: #9D26B0;}.el-pager li.active {  color: #9D26B0;}.el-select-dropdown.is-multiple .el-select-dropdown__item.selected {  color: #9D26B0;}.el-textarea__inner:focus {  border-color: #9D26B0;}.el-input__inner:focus {  border-color: #9D26B0;}.el-input.is-active .el-input__inner {  border-color: #9D26B0;}.el-tag {  background-color: #f5e9f7;  border-color: #ebd4ef;  color: #9D26B0;}.el-tag.is-hit {  border-color: #9D26B0;}.el-tag .el-tag__close {  color: #9d26b0;}.el-tag .el-tag__close:hover {  background-color: #9d26b0;}.el-tag--dark {  background-color: #9d26b0;  border-color: #9d26b0;}.el-tag--dark.is-hit {  border-color: #9D26B0;}.el-tag--dark .el-tag__close:hover {  background-color: #b151c0;}.el-tag--plain {  border-color: #d8a8df;  color: #9d26b0;}.el-tag--plain.is-hit {  border-color: #9D26B0;}.el-tag--plain .el-tag__close {  color: #9d26b0;}.el-tag--plain .el-tag__close:hover {  background-color: #9d26b0;}.el-select-dropdown__item.selected {  color: #9D26B0;}.el-select .el-input__inner:focus {  border-color: #9D26B0;}.el-select .el-input.is-focus .el-input__inner {  border-color: #9D26B0;}.el-textarea__inner:focus {  border-color: #9D26B0;}.el-input__inner:focus {  border-color: #9D26B0;}.el-input.is-active .el-input__inner {  border-color: #9D26B0;}.el-menu--horizontal > .el-submenu.is-active .el-submenu__title {  border-bottom: 2px solid #9D26B0;}.el-menu--horizontal > .el-menu-item.is-active {  border-bottom: 2px solid #9D26B0;}.el-menu-item:hover, .el-menu-item:focus {  background-color: #f5e9f7;}.el-menu-item.is-active {  color: #9D26B0;}.el-submenu__title:hover, .el-submenu__title:focus {  background-color: #f5e9f7;}.el-submenu__title:hover {  background-color: #f5e9f7;}.el-submenu.is-active .el-submenu__title {  border-bottom-color: #9D26B0;}.el-button:hover, .el-button:focus {  color: #9D26B0;  border-color: #e2bee7;  background-color: #f5e9f7;}.el-button:active {  color: #8d229e;  border-color: #8d229e;}.el-button.is-plain:hover, .el-button.is-plain:focus {  border-color: #9D26B0;  color: #9D26B0;}.el-button.is-plain:active {  border-color: #8d229e;  color: #8d229e;}.el-button.is-active {  color: #8d229e;  border-color: #8d229e;}.el-button--primary {  background-color: #9D26B0;  border-color: #9D26B0;}.el-button--primary:hover, .el-button--primary:focus {  background: #b151c0;  border-color: #b151c0;}.el-button--primary:active {  background: #8d229e;  border-color: #8d229e;}.el-button--primary.is-active {  background: #8d229e;  border-color: #8d229e;}.el-button--primary.is-disabled, .el-button--primary.is-disabled:hover, .el-button--primary.is-disabled:focus, .el-button--primary.is-disabled:active {  background-color: #ce93d8;  border-color: #ce93d8;}.el-button--primary.is-plain {  color: #9D26B0;  background: #f5e9f7;  border-color: #d8a8df;}.el-button--primary.is-plain:hover, .el-button--primary.is-plain:focus {  background: #9D26B0;  border-color: #9D26B0;}.el-button--primary.is-plain:active {  background: #8d229e;  border-color: #8d229e;}.el-button--primary.is-plain.is-disabled, .el-button--primary.is-plain.is-disabled:hover, .el-button--primary.is-plain.is-disabled:focus, .el-button--primary.is-plain.is-disabled:active {  color: #c47dd0;  background-color: #f5e9f7;  border-color: #ebd4ef;}.el-button--mini {  padding: 5px 12px;}.el-button--mini.is-round {  padding: 5px 12px;}.el-button--mini.is-circle {  padding: 5px;}.el-button--text {  color: #9D26B0;}.el-button--text:hover, .el-button--text:focus {  color: #b151c0;}.el-button--text:active {  color: #8d229e;}.el-dropdown-menu__item:not(.is-disabled):hover, .el-dropdown-menu__item:focus {  background-color: #f5e9f7;  color: #b151c0;}.el-tabs__active-bar {  background-color: #9D26B0;}.el-tabs__new-tab:hover {  color: #9D26B0;}.el-tabs__item:focus.is-active.is-focus:not(:active) {  box-shadow: 0 0 2px 2px #9D26B0 inset;}.el-tabs__item.is-active {  color: #9D26B0;}.el-tabs__item:hover {  color: #9D26B0;}.el-tabs--border-card > .el-tabs__header .el-tabs__item.is-active {  color: #9D26B0;}.el-tabs--border-card > .el-tabs__header .el-tabs__item:not(.is-disabled):hover {  color: #9D26B0;}.el-checkbox.is-bordered.is-checked {  border-color: #9D26B0;}.el-checkbox__input.is-checked .el-checkbox__inner {  background-color: #9D26B0;  border-color: #9D26B0;}.el-checkbox__input.is-checked + .el-checkbox__label {  color: #9D26B0;}.el-checkbox__input.is-focus .el-checkbox__inner {  border-color: #9D26B0;}.el-checkbox__input.is-indeterminate .el-checkbox__inner {  background-color: #9D26B0;  border-color: #9D26B0;}.el-checkbox__inner:hover {  border-color: #9D26B0;}.el-checkbox-button__inner:hover {  color: #9D26B0;}.el-checkbox-button.is-checked .el-checkbox-button__inner {  background-color: #9D26B0;  border-color: #9D26B0;  box-shadow: -1px 0 0 0 #c47dd0;}.el-checkbox-button.is-checked:first-child .el-checkbox-button__inner {  border-left-color: #9D26B0;}.el-checkbox-button.is-focus .el-checkbox-button__inner {  border-color: #9D26B0;}.el-checkbox-button--mini .el-checkbox-button__inner {  padding: 5px 12px;}.el-checkbox-button--mini .el-checkbox-button__inner.is-round {  padding: 5px 12px;}.el-radio.is-bordered.is-checked {  border-color: #9D26B0;}.el-radio__input.is-checked .el-radio__inner {  border-color: #9D26B0;  background: #9D26B0;}.el-radio__input.is-checked + .el-radio__label {  color: #9D26B0;}.el-radio__input.is-focus .el-radio__inner {  border-color: #9D26B0;}.el-radio__inner:hover {  border-color: #9D26B0;}.el-radio:focus:not(.is-focus):not(:active):not(.is-disabled) .el-radio__inner {  box-shadow: 0 0 2px 2px #9D26B0;}.el-cascader-node.in-active-path, .el-cascader-node.is-selectable.in-checked-path, .el-cascader-node.is-active {  color: #9D26B0;}.yb-main-header {  background-color: #9D26B0;}.el-checkbox.is-bordered.is-checked {  border-color: #9D26B0;}.el-checkbox__input.is-checked .el-checkbox__inner {  background-color: #9D26B0;  border-color: #9D26B0;}.el-checkbox__input.is-checked + .el-checkbox__label {  color: #9D26B0;}.el-checkbox__input.is-focus .el-checkbox__inner {  border-color: #9D26B0;}.el-checkbox__input.is-indeterminate .el-checkbox__inner {  background-color: #9D26B0;  border-color: #9D26B0;}.el-checkbox__inner:hover {  border-color: #9D26B0;}.el-checkbox-button__inner:hover {  color: #9D26B0;}.el-checkbox-button.is-checked .el-checkbox-button__inner {  background-color: #9D26B0;  border-color: #9D26B0;  box-shadow: -1px 0 0 0 #c47dd0;}.el-checkbox-button.is-checked:first-child .el-checkbox-button__inner {  border-left-color: #9D26B0;}.el-checkbox-button.is-focus .el-checkbox-button__inner {  border-color: #9D26B0;}.el-checkbox-button--mini .el-checkbox-button__inner {  padding: 5px 12px;}.el-checkbox-button--mini .el-checkbox-button__inner.is-round {  padding: 5px 12px;}.el-button:hover, .el-button:focus {  color: #9D26B0;  border-color: #e2bee7;  background-color: #f5e9f7;}.el-button:active {  color: #8d229e;  border-color: #8d229e;}.el-button.is-plain:hover, .el-button.is-plain:focus {  border-color: #9D26B0;  color: #9D26B0;}.el-button.is-plain:active {  border-color: #8d229e;  color: #8d229e;}.el-button.is-active {  color: #8d229e;  border-color: #8d229e;}.el-button--primary {  background-color: #9D26B0;  border-color: #9D26B0;}.el-button--primary:hover, .el-button--primary:focus {  background: #b151c0;  border-color: #b151c0;}.el-button--primary:active {  background: #8d229e;  border-color: #8d229e;}.el-button--primary.is-active {  background: #8d229e;  border-color: #8d229e;}.el-button--primary.is-disabled, .el-button--primary.is-disabled:hover, .el-button--primary.is-disabled:focus, .el-button--primary.is-disabled:active {  background-color: #ce93d8;  border-color: #ce93d8;}.el-button--primary.is-plain {  color: #9D26B0;  background: #f5e9f7;  border-color: #d8a8df;}.el-button--primary.is-plain:hover, .el-button--primary.is-plain:focus {  background: #9D26B0;  border-color: #9D26B0;}.el-button--primary.is-plain:active {  background: #8d229e;  border-color: #8d229e;}.el-button--primary.is-plain.is-disabled, .el-button--primary.is-plain.is-disabled:hover, .el-button--primary.is-plain.is-disabled:focus, .el-button--primary.is-plain.is-disabled:active {  color: #c47dd0;  background-color: #f5e9f7;  border-color: #ebd4ef;}.el-button--mini {  padding: 5px 12px;}.el-button--mini.is-round {  padding: 5px 12px;}.el-button--mini.is-circle {  padding: 5px;}.el-button--text {  color: #9D26B0;}.el-button--text:hover, .el-button--text:focus {  color: #b151c0;}.el-button--text:active {  color: #8d229e;}.el-textarea__inner:focus {  border-color: #9D26B0;}.el-input__inner:focus {  border-color: #9D26B0;}.el-input.is-active .el-input__inner {  border-color: #9D26B0;}.el-message-box__headerbtn:focus .el-message-box__close, .el-message-box__headerbtn:hover .el-message-box__close {  color: #9D26B0;}.el-checkbox.is-bordered.is-checked {  border-color: #9D26B0;}.el-checkbox__input.is-checked .el-checkbox__inner {  background-color: #9D26B0;  border-color: #9D26B0;}.el-checkbox__input.is-checked + .el-checkbox__label {  color: #9D26B0;}.el-checkbox__input.is-focus .el-checkbox__inner {  border-color: #9D26B0;}.el-checkbox__input.is-indeterminate .el-checkbox__inner {  background-color: #9D26B0;  border-color: #9D26B0;}.el-checkbox__inner:hover {  border-color: #9D26B0;}.el-checkbox-button__inner:hover {  color: #9D26B0;}.el-checkbox-button.is-checked .el-checkbox-button__inner {  background-color: #9D26B0;  border-color: #9D26B0;  box-shadow: -1px 0 0 0 #c47dd0;}.el-checkbox-button.is-checked:first-child .el-checkbox-button__inner {  border-left-color: #9D26B0;}.el-checkbox-button.is-focus .el-checkbox-button__inner {  border-color: #9D26B0;}.el-checkbox-button--mini .el-checkbox-button__inner {  padding: 5px 12px;}.el-checkbox-button--mini .el-checkbox-button__inner.is-round {  padding: 5px 12px;}.el-tree__drop-indicator {  background-color: #9D26B0;}.el-tree-node.is-drop-inner > .el-tree-node__content .el-tree-node__label {  background-color: #9D26B0;}.el-tree--highlight-current .el-tree-node.is-current > .el-tree-node__content {  background-color: #f7eef9;}.el-select-dropdown__item.selected {  color: #9D26B0;}.el-table__body tr.current-row::after {  background-color: #9D26B0;}`;
/**
 *
 * @param {string} options.primaryColor 新的主题色
 * @param {object} options.targetValueReplacer 可用于非颜色值的替换，如"padding:10px;" 中的 "10px"
 */
 function setCustomTheme({ primaryColor, targetValueReplacer }) {
    setNewThemeStyle({
        primaryColor,
        targetValueReplacer,
        styleTagId: 'coustom-theme-tagid',
        sourceThemeStyle,
        sourceColorMap,
        hybridValueMap,
        otherValues,
    });
}

setCustomTheme({ primaryColor: '#F4791E' ,targetValueReplacer:{"5px 12px":"6px 18px"}});
