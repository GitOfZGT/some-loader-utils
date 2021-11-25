export const colorValueReg = {
    hex: /#([0-9a-f]{8}|[0-9a-f]{6}|[0-9a-f]{3})/ig,
    rgb: /rgb\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*\)/ig,
    rgba: /rgba\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*(0|1|1.0|0?.[0-9])\s*\)/ig,
    hsl: /hsl\(\s*\d{1,3}\s*,\s*(0|\d{1,3}%)\s*,\s*(0|\d{1,3}%)\s*\)/ig,
    hsla: /hsla\(\s*\d{1,3}\s*,\s*(0|\d{1,3}%)\s*,\s*(0|\d{1,3}%)\s*,\s*(0|1|1.0|0?.[0-9])\s*\)/ig,
};

export default {};
