import Color from 'color';

export const colorValueReg = {
    hex: /#([0-9a-f]{8}|[0-9a-f]{6}|[0-9a-f]{3})/gi,
    rgb: /rgb\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*\)/gi,
    rgba: /rgba\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*(0|1|1.0|0?.[0-9]+)\s*\)/gi,
    hsl: /hsl\(\s*\d{1,3}\s*,\s*(0|\d{1,3}%)\s*,\s*(0|\d{1,3}%)\s*\)/gi,
    hsla: /hsla\(\s*\d{1,3}\s*,\s*(0|\d{1,3}%)\s*,\s*(0|\d{1,3}%)\s*,\s*(0|1|1.0|0?.[0-9]+)\s*\)/gi,
};

export function isSameColor(str1, str2) {
    if (str1 === str2) {
        return true;
    }
    let same = false;
    try {
        const color1 = Color(str1).rgb().array();
        const color2 = Color(str2).rgb().array();
        same =
            color1[0] === color2[0] &&
            color1[1] === color2[1] &&
            color1[2] === color2[2] &&
            color1[3] === color2[3];
    } catch (e) {
        same = false;
    }
    return same;
}

export function removeSpaceInColor(val = '') {
    let newVal = val;
    const rgb = val.match(colorValueReg.rgb) || [];
    const rgba = val.match(colorValueReg.rgba) || [];
    const hsl = val.match(colorValueReg.hsl) || [];
    const hsla = val.match(colorValueReg.hsla) || [];
    const removeSpace = (colors, value) => {
        let replacer = value;
        colors.forEach((c) => {
            replacer = replacer.replace(c, c.replace(/\s+/g, ''));
        });
        return replacer;
    };
    newVal = removeSpace(rgb, newVal);
    newVal = removeSpace(rgba, newVal);
    newVal = removeSpace(hsl, newVal);
    newVal = removeSpace(hsla, newVal);
    return newVal;
}

export default {};
