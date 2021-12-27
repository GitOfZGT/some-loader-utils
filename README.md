# @zougt/some-loader-utils

提供了

-   [getLess](#getLess)，本质上不是针对 less-loader 的扩展，而是[less 包](https://github.com/less/less.js)的扩展
-   [getSass](#getSass)，本质上不是针对 sass-loader 的扩展，而是[sass 包](https://github.com/sass/dart-sass)的扩展

让你轻松实现基于`less`、`sass`的 web 应用在线动态主题切换。

有[动态主题模式](#动态主题模式)和[预设主题模式](#预设主题模式)

特点：

-   使用成本很低
-   不限 ui 框架，Element-ui、iview、Ant-design 等等等（只要基于 less/sass）
-   不依赖 css3 vars
-   浏览器兼容性良好（IE9+ ?）

[demo repositories](https://github.com/GitOfZGT/dynamic-theme-demos)

# 动态主题模式

> v1.4.0+支持

可用颜色板选择任意颜色切换相关的梯度颜色，这里以 scss 为例

[one inline demo](https://gitofzgt.github.io/dynamic-theme-demos/webpack-vuecli4-elementui-dynamic-theme/)

[one demo repository](https://github.com/GitOfZGT/dynamic-theme-demos/tree/master/projects/webpack-vuecli4-elementui-dynamic-theme/)

![效果图](https://img-blog.csdnimg.cn/56589b227df9470c83389b4fc0adbaaf.gif#pic_center)

## 在 webpack 中使用

```bash
# use npm or pnpm
npm install color@3.2.1 @zougt/some-loader-utils @zougt/theme-css-extract-webpack-plugin -D
# use yarn
yarn add color@3.2.1 @zougt/some-loader-utils @zougt/theme-css-extract-webpack-plugin -D
```

**webpack.config.js**

```js
const path = require('path');

const { getSass } = require('@zougt/some-loader-utils');

const ThemeCssExtractWebpackPlugin = require('@zougt/theme-css-extract-webpack-plugin');

const multipleScopeVars = [
    {
        // 必需,任意名称
        scopeName: 'theme-vars',
        // path和varsContent选一个
        path: path.resolve('src/theme/theme-vars.scss'),
        // varsContent:`@--color-primary:#9c26b;`
    },
];

module.exports = {
    module: {
        rules: [
            {
                // 添加 setCustomTheme 的热更新loader
                test: /setCustomTheme\.js$/,
                enforce: 'pre',
                loader: require.resolve(
                    '@zougt/theme-css-extract-webpack-plugin/dist/hot-loader/index.js'
                ),
            },
            {
                test: /\.(scss|sass)$/i,
                // 请确保支持 implementation 属性的 sass-loader版本，webpack4 => sass-loader v10.x，webpack5 => sass-loader v12.x，请安装sass， 非 node-sass
                loader: 'sass-loader',
                options: {
                    implementation: getSass({
                        // getMultipleScopeVars优先于 sassOptions.multipleScopeVars
                        getMultipleScopeVars: (lessOptions) =>
                            multipleScopeVars,
                        // 可选项
                        // implementation:sass
                    }),
                },
            },
        ],
    },
    plugins: [
        new ThemeCssExtractWebpackPlugin({
            // 启用动态主题模式
            arbitraryMode: true,
            // 默认主题色，与"src/theme/theme-vars.scss"的@--color-primary主题色相同
            defaultPrimaryColor: '#512da7',
            multipleScopeVars,
            // 【注意】includeStyleWithColors作用： css中不是由主题色变量生成的颜色，也让它抽取到主题css内，可以提高权重
            includeStyleWithColors: [
                {
                    // color也可以是array，如 ["#ffffff","#000"]
                    color: '#ffffff',
                    // 排除属性，如 不提取背景色的#ffffff
                    // excludeCssProps:["background","background-color"]
                    // 排除选择器，如 不提取以下选择器的 #ffffff
                    // excludeSelectors: [
                    //   ".ant-btn-link:hover, .ant-btn-link:focus, .ant-btn-link:active",
                    // ],
                },
            ],
            // 是否在html默认添加主题的style标签
            InjectDefaultStyleTagToHtml: true,
            // setCustomTheme.js的一个依赖的生成路径，默认是 @zougt/theme-css-extract-webpack-plugin/dist/hot-loader/setCustomThemeContent.js
            customThemeOutputPath: '',
            // 调整色相值偏差，某些颜色值是由主题色通过mix等函数转化后，两者色相值不相等，无法确认是梯度颜色，可以调整low和high，允许偏差范围， 例如 hueDiffControls:{low: 2,high:2}
            // hueDiffControls: {
            //     low: 0,
            //     high: 0,
            // },
        }),
    ],
};
```

**src/theme/theme-vars.scss**

```scss
/*说明：此文件不应该被其他@import，此文件的变量并不是来设置项目的主题（当然，你可以作为加载时的默认主题），主要作用是，这里的变量值只要与项目的原变量值有差别，编译后就会抽取跟随主题色梯度变化的css*/

/*注意（重要）：此文件的内容一旦固定下来就不需要改，在线动态切换主题，调用setCustomTheme方法即可*/

/*注意（强调）：变量值改动会影响 gradientReplacer 和 targetValueReplacer 的可用属性的变化，所以内容一旦固定下来就不需要改（强调）*/

/*主题色，通常与  插件的 defaultPrimaryColor 相同， 使用setCustomTheme({primaryColor})切换*/

$--color-primary: #512da7;

/*与此颜色对应的样式，默认情况也会跟主色变化的，要切换它对应的梯度颜色，使用setCustomTheme({gradientReplacer:{"#F7D06B":"#F7D06B"}})切换 */
$--color-success: #f7d06b;

// /*圆角值，尽量与原值差别大一点，方便分析 targetValueReplacer 的可用属性，非颜色值的切换，可以使用 setCustomTheme({targetValueReplacer:{"6px"}}) 精准替换*/
// @border-radius-base:6px;
```

**在线切换主题**

动态主题切换必须使用的 "setCustomTheme" 模块，会自动处理项目中包括组件库涉及的梯度颜色替换

```js
// color@4 使用了Numeric separators，如需良好兼容性应该安装 color@3
import Color from 'color';
// setCustomTheme的参数必须提供Color模块，至于为什么不把 Color 直接依赖进去是有原因的
import setCustomTheme from '@zougt/theme-css-extract-webpack-plugin/dist/setCustomTheme';
// 设置任意主题色既可
setCustomTheme({
    Color,
    primaryColor: '#FF005A',
    //gradientReplacer:{},
    //targetValueReplacer:{}
});
```

`setCustomTheme` 的可选参数 gradientReplacer 与 targetValueReplacer 的可用属性会跟随 .scss 内容变化的，所以整个项目动态主题的模型应该最开始固化下来

```shell
# npm run dev 之后
# 可以在终端使用 z-theme 命令查看  gradientReplacer 与 targetValueReplacer 的可用属性
npx z-theme inspect
```

## 预设主题模式

只预设多种可选主题，这里以less为例

[one inline demo](https://gitofzgt.github.io/dynamic-theme-demos/webpack-vuecli4-antdvue-preset-theme/)

[one demo repository](https://github.com/GitOfZGT/dynamic-theme-demos/tree/master/projects/webpack-vuecli4-antdvue-preset-theme/)

![效果图](https://img-blog.csdnimg.cn/c11382d232a84aebab80b9f87eb66cc5.gif#pic_center)

## 在 webpack 中使用

```bash
# use npm or pnpm
npm install @zougt/some-loader-utils @zougt/theme-css-extract-webpack-plugin -D
# use yarn
yarn add @zougt/some-loader-utils @zougt/theme-css-extract-webpack-plugin -D
```

**webpack.config.js**

```js
const path = require('path');
const webpack = require('webpack');

const { getLess } = require('@zougt/some-loader-utils');

const ThemeCssExtractWebpackPlugin = require('@zougt/theme-css-extract-webpack-plugin');

const multipleScopeVars = [
    {
        // 必需
        scopeName: 'theme-default',
        // path 和 varsContent 必选一个
        path: path.resolve('src/theme/theme-default.less'),
        // varsContent参数等效于 path文件的内容
        // varsContent:`@primary-color:${defaultPrimaryColor};`
    },

    {
        scopeName: 'theme-red',
        path: path.resolve('src/theme/theme-red.less'),
    },
];
const extract = process.env.NODE_ENV === 'production';
const publicPath = '/';
const assetsDir = 'assets';
const extractCssOutputDir = `${assetsDir}/css`;

module.exports = {
    output: {
        publicPath,
    },
    module: {
        rules: [
            {
                test: /\.less$/i,
                // webpack4 => less-loader v7.x , webpack5 => less-loader v10.x
                loader: 'less-loader',
                options: {
                    lessOptions: {
                        javascriptEnabled: true,
                    },
                    implementation: getLess({
                        // getMultipleScopeVars优先于 lessOptions.multipleScopeVars
                        getMultipleScopeVars: (lessOptions) =>
                            multipleScopeVars,
                        // 可选项
                        // implementation:less
                    }),
                },
            },
        ],
    },
    plugins: [
        // 添加参数到浏览器端
        new webpack.DefinePlugin({
            'env.themeConfig': {
                multipleScopeVars: JSON.stringify(multipleScopeVars),
                extract: JSON.stringify(extract),
                publicPath: JSON.stringify(publicPath),
                extractCssOutputDir: JSON.stringify(extractCssOutputDir),
            },
        }),

        new ThemeCssExtractWebpackPlugin({
            multipleScopeVars,
            // 【注意】includeStyleWithColors作用： css中不是由主题色变量生成的颜色，也让它抽取到主题css内，可以提高权重
            includeStyleWithColors: [
                {
                    // color也可以是array，如 ["#ffffff","#000"]
                    color: '#ffffff',
                    // 排除属性，如 不提取背景色的#ffffff
                    // excludeCssProps:["background","background-color"]
                    // 排除选择器，如 不提取以下选择器的 #ffffff
                    // excludeSelectors: [
                    //   ".ant-btn-link:hover, .ant-btn-link:focus, .ant-btn-link:active",
                    // ],
                },
                {
                    color: ['transparent', 'none'],
                },
            ],
            // 默认使用哪份主题，默认取 multipleScopeVars[0].scopeName
            defaultScopeName: '',
            // 在生产模式是否抽取独立的主题css文件，extract为true以下属性有效
            extract,
            // 独立主题css文件的输出路径
            outputDir: extractCssOutputDir,
            // 会选取defaultScopeName对应的主题css文件在html添加link
            themeLinkTagId: 'theme-link-tag',
            // 是否对抽取的css文件内对应scopeName的权重类名移除
            removeCssScopeName: false,
        }),
    ],
};
```

**在线切换主题**

预设主题切换，需要做的事情

1、开发时只需，html 标签的 calss 添加对应的 scopeName，移除上个 scopeName  
2、打包后，如果开启 extract: true，需要切换对应的 link 标签的 href

可以选择使用如下封装好的方法

```js
import { toggleTheme } from '@zougt/theme-css-extract-webpack-plugin/dist/toggleTheme';
// env.themeConfig 来源 (webpack.DefinePlugin)
const themeConfig = env.themeConfig;
toggleTheme({
    scopeName,
    multipleScopeVars: themeConfig.multipleScopeVars,
    extract: themeConfig.extract,
    publicPath: themeConfig.publicPath,
    outputDir: themeConfig.extractCssOutputDir,
    // customLinkHref: (href) => href,
    // themeLinkTagId: "theme-link-tag",
    // removeCssScopeName: false,
    // loading: {
    //   show: () => {},
    //   hide: () => {},
    // },
});
```

**预设多主题编译原理示例（以 sass 为例）**

**主题包含的可能不只是颜色部分**

```scss
//src/theme/default-vars.scss
/**
*此scss变量文件作为multipleScopeVars去编译时，会自动移除!default以达到变量提升
*同时此scss变量文件作为默认主题变量文件，被其他.scss通过 @import 时，必需 !default
*/
$primary-color: #0081ff !default;
$--border-radius-base: 4px !default;
```

```scss
//src/theme/mauve-vars.scss
$primary-color: #9c26b0 !default;
$--border-radius-base: 8px !default;
```

```scss
//src/components/Button/style.scss
@import '../../theme/default-vars';
.un-btn {
    position: relative;
    display: inline-block;
    font-weight: 400;
    white-space: nowrap;
    text-align: center;
    border: 1px solid transparent;
    background-color: $primary-color;
    border-radius: $--border-radius-base;
    .anticon {
        line-height: 1;
    }
}
```

编译之后

src/components/Button/style.css

```css
.un-btn {
    position: relative;
    display: inline-block;
    font-weight: 400;
    white-space: nowrap;
    text-align: center;
    border: 1px solid transparent;
}
.theme-default .un-btn {
    background-color: #0081ff;
    border-radius: 4px;
}
.theme-mauve .un-btn {
    background-color: #9c26b0;
    border-radius: 8px;
}
.un-btn .anticon {
    line-height: 1;
}
```

在`html`中改变 classname 切换主题，只作用于 html 标签 ：

```html
<!DOCTYPE html>
<html lang="zh" class="theme-default">
    <head>
        <meta charset="utf-8" />
        <title>title</title>
    </head>
    <body>
        <div id="app"></div>
        <!-- built files will be auto injected -->
    </body>
</html>
```

```js
document.documentElement.className = 'theme-mauve';
```

### 使用 Css Modules

如果是模块化的 scss，得到的 css 类似：

```css
.src-components-Button-style_theme-default-3CPvz
    .src-components-Button-style_un-btn-1n85E {
    background-color: #0081ff;
}
.src-components-Button-style_theme-mauve-3yajX
    .src-components-Button-style_un-btn-1n85E {
    background-color: #9c26b0;
}
```

实际需要的结果应该是这样：

```css
.theme-default .src-components-Button-style_un-btn-1n85E {
    background-color: #0081ff;
}
.theme-mauve .src-components-Button-style_un-btn-1n85E {
    background-color: #9c26b0;
}
```

在 webpack.config.js 需要对`css-loader` (v4.0+) 的 modules 属性添加 getLocalIdent:

```js
const path = require('path');
// const sass = require("sass");
const { getSass } = require('@zougt/some-loader-utils');
const { interpolateName } = require('loader-utils');
function normalizePath(file) {
    return path.sep === '\\' ? file.replace(/\\/g, '/') : file;
}
const multipleScopeVars = [
    {
        scopeName: 'theme-default',
        path: path.resolve('src/theme/default-vars.scss'),
    },
    {
        scopeName: 'theme-mauve',
        path: path.resolve('src/theme/mauve-vars.scss'),
    },
];
module.exports = {
    module: {
        rules: [
            {
                test: /\.module.scss$/i,
                use: [
                    {
                        loader: 'css-loader',
                        options: {
                            importLoaders: 1,
                            modules: {
                                localIdentName:
                                    process.env.NODE_ENV === 'production'
                                        ? '[hash:base64:5]'
                                        : '[path][name]_[local]-[hash:base64:5]',
                                //使用 getLocalIdent 自定义模块化名称 ， css-loader v4.0+
                                getLocalIdent: (
                                    loaderContext,
                                    localIdentName,
                                    localName,
                                    options
                                ) => {
                                    if (
                                        multipleScopeVars.some(
                                            (item) =>
                                                item.scopeName === localName
                                        )
                                    ) {
                                        //localName 属于 multipleScopeVars 的不用模块化
                                        return localName;
                                    }
                                    const { context, hashPrefix } = options;
                                    const { resourcePath } = loaderContext;
                                    const request = normalizePath(
                                        path.relative(context, resourcePath)
                                    );
                                    // eslint-disable-next-line no-param-reassign
                                    options.content = `${
                                        hashPrefix + request
                                    }\x00${localName}`;
                                    const inname = interpolateName(
                                        loaderContext,
                                        localIdentName,
                                        options
                                    );

                                    return inname.replace(
                                        /\\?\[local\\?]/gi,
                                        localName
                                    );
                                },
                            },
                        },
                    },
                    {
                        loader: 'sass-loader',
                        options: {
                            implementation: getSass({
                                // getMultipleScopeVars优先于 sassOptions.multipleScopeVars
                                getMultipleScopeVars: (sassOptions) =>
                                    multipleScopeVars,
                                // 可选项
                                // implementation:sass
                            }),
                        },
                    },
                ],
            },
        ],
    },
};
```

> 以上是基于 webpack 的多主题的编译方案实现，如需 vite 版本的请看 vite 插件[@zougt/vite-plugin-theme-preprocessor](https://github.com/GitOfZGT/vite-plugin-theme-preprocessor)

### multipleScopeVars

必需的

> 当 multipleScopeVars 只有一项时， scopeName 就没有意义，但是 path 可以起到 变量提升的作用

Type `object[]`

#### multipleScopeVars[].scopeName

Type `string`

#### multipleScopeVars[].path

必需的，变量文件的绝对路径

Type `string || string[]`

```js
const multipleScopeVars = [
    {
        scopeName: 'theme-default',
        path: path.resolve('src/theme/default-vars.less'),
    },
    {
        scopeName: 'theme-mauve',
        path: path.resolve('src/theme/mauve-vars.less'),
    },
];
```

### multipleScopeVars[].includeStyles

> v1.3.0 支持 includeStyles,只在预设主题模式有效

Type: `Object`

当存在以下情况时，可以用这个属性处理

```css
.theme-blue .el-button:focus,
.theme-blue .el-button:hover {
    /*这里的color值由 $primary-color 编译得来的，所以选择器前面加了 .theme-blue 提高了权重*/
    color: #0281ff;
    border-color: #b3d9ff;
    background-color: #e6f2ff;
}
.el-button--primary:focus,
.el-button--primary:hover {
    /*这里的color值不是由 变量 编译得来的，这时就会被上面那个 color 覆盖了， 实际上这里的color才是需要的效果*/
    color: #fff;
}
```

```js
const includeStyles = {
    '.el-button--primary:hover, .el-button--primary:focus': {
        color: '#FFFFFF',
    },
};
const multipleScopeVars = [
    {
        scopeName: 'theme-default',
        path: path.resolve('src/theme/default-vars.less'),
        includeStyles,
    },
    {
        scopeName: 'theme-mauve',
        path: path.resolve('src/theme/mauve-vars.less'),
        includeStyles,
    },
];
```

得到

```css
.theme-blue .el-button:focus,
.theme-blue .el-button:hover {
    /*这里的color值由 $primary-color 编译得来的，所以选择器前面加了 .theme-blue 提高了权重*/
    color: #0281ff;
    border-color: #b3d9ff;
    background-color: #e6f2ff;
}
.theme-blue .el-button--primary:focus,
.theme-blue .el-button--primary:hover {
    /*这里的color值不是由 变量 编译得来的，通过includeStyles也提高了权重得到实际的效果*/
    color: #ffffff;
}
```

出现权重问题效果图

![includeStyles](https://user-images.githubusercontent.com/21262000/133917696-804f8a75-2540-48e4-8b46-84ddc0b3fef1.png)

使用了 includeStyles 的效果图

![includeStyles](https://user-images.githubusercontent.com/21262000/133917724-4d64f4e5-af9b-4dd6-8481-b10b20f3204f.png)
