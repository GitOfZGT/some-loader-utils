# @zougt/some-loader-utils

开始作为[`@zougt/less-loader`](https://github.com/GitOfZGT/less-loader)和[`@zougt/sass-loader`](https://github.com/GitOfZGT/less-loader)的公共依赖

提供了方法：

- [getAllStyleVarFiles](#getAllStyleVarFiles)
- [getVarsContent](#getVarsContent)
- [getScopeProcessResult](#getScopeProcessResult)

之后可能不再维护[`@zougt/less-loader`](https://github.com/GitOfZGT/less-loader)和[`@zougt/sass-loader`](https://github.com/GitOfZGT/less-loader)同步 fork 更新，提供了[`less-loader`](https://github.com/webpack-contrib/less-loader)和[`sass-loader`](https://github.com/webpack-contrib/sass-loader)的 `implementation` 版本的多主题变量文件编译方案的方法：

- [getLess](#getLess)
- [getSass](#getSass)

使得基于`less`、`sass`的(新、旧)项目实现在线预设主题的动态切换变得很简单  

## 安装与使用

```bash
# use npm
npm install @zougt/some-loader-utils -D
# use yarn
yarn add @zougt/some-loader-utils -D
```

## getLess

Type `Function`

获取支持多个变量文件的`less`编译器

used in [`less-loader`](https://github.com/webpack-contrib/less-loader)

```js
const path = require("path");
// const less = require("less");
const { getLess } = require("@zougt/some-loader-utils");

const multipleScopeVars = [
  {
    scopeName: "theme-default",
    path: path.resolve("src/theme/default-vars.less"),
  },
  {
    scopeName: "theme-mauve",
    path: path.resolve("src/theme/mauve-vars.less"),
  },
];
module.exports = {
  module: {
    rules: [
      {
        test: /\.less$/i,
        loader: "less-loader",
        options: {
          lessOptions: {
            // 不使用 getMultipleScopeVars时，也可从这里传入 multipleScopeVars
            // multipleScopeVars
          },
          implementation: getLess({
            // getMultipleScopeVars优先于 lessOptions.multipleScopeVars
            getMultipleScopeVars: (lessOptions) => multipleScopeVars,
            // 可选项
            // implementation:less
          }),
        },
      },
    ],
  },
};
```

## getSass

Type `Function`

获取支持多个变量文件的`sass`编译器

used in [`sass-loader`](https://github.com/webpack-contrib/sass-loader)

```js
const path = require("path");
// const sass = require("sass");
const { getSass } = require("@zougt/some-loader-utils");
const multipleScopeVars = [
  {
    scopeName: "theme-default",
    path: path.resolve("src/theme/default-vars.scss"),
  },
  {
    scopeName: "theme-mauve",
    path: path.resolve("src/theme/mauve-vars.scss"),
  },
];
module.exports = {
  module: {
    rules: [
      {
        test: /\.scss$/i,
        loader: "sass-loader",
        options: {
          sassOptions: {
            // 不使用 getMultipleScopeVars 时，也可从这里传入 multipleScopeVars
            // multipleScopeVars
          },
          implementation: getSass({
            // getMultipleScopeVars优先于 sassOptions.multipleScopeVars
            getMultipleScopeVars: (sassOptions) => multipleScopeVars,
            // 可选项
            // implementation:less
          }),
        },
      },
    ],
  },
};
```

## 多主题编译示例

请查看[多主题编译示例](https://github.com/GitOfZGT/less-loader#%E7%A4%BA%E4%BE%8B)

如需对编译后的主题 css 抽取成独立的文件请看 webpack 插件[`@zougt/theme-css-extract-webpack-plugin`](https://github.com/GitOfZGT/theme-css-extract-webpack-plugin)

以上是基于 webpack 的多主题的编译方案实现，如需 vite 版本的请看 vite 插件[@zougt/vite-plugin-theme-preprocessor](https://github.com/GitOfZGT/vite-plugin-theme-preprocessor)

# 依赖方法

## getAllStyleVarFiles

Type `Function`

用于处理`multipleScopeVars`属性

### multipleScopeVars

Type `object[]`

#### multipleScopeVars[].scopeName

Type `string`

#### multipleScopeVars[].path

```js
const multipleScopeVars = [
  {
    scopeName: "theme-default",
    path: path.resolve("src/theme/default-vars.less"),
  },
  {
    scopeName: "theme-mauve",
    path: path.resolve("src/theme/mauve-vars.less"),
  },
];
const allStyleVarFiles = getAllStyleVarFiles(
  {
    emitError: (msg) => {
      throw new Error(msg);
    },
  },
  { multipleScopeVars }
);
```

## getVarsContent

Type `Function`

用于获取 multipleScopeVars[].path 文件的内容

```js
const lessVarscontent = getVarsContent(allStyleVarFiles[0].path, "less");
const sassVarscontent = getVarsContent(allStyleVarFiles[0].path, "sass");
```

## getScopeProcessResult

Type `Function`

把多个 css 内容按 multipleScopeVars 对应顺序合并，并去重

```js
const result = getScopeProcessResult(
  [
    {
      map: sourceMap || null,
      code: `
        .un-btn {
            position: relative;
            background-color: #0081ff;
        }
        .un-btn .anticon {
            line-height: 1;
        }`,
      deps: ["E:\\sub\\panel1.less", "E:\\sub\\panel2.less"],
    },
    {
      map: sourceMap || null,
      code: `
        .un-btn {
            position: relative;
            background-color: #9c26b0;
        }
        .un-btn .anticon {
            line-height: 1;
        }`,
      deps: ["E:\\sub\\panel1.less", "E:\\sub\\panel2.less"],
    },
  ],
  [
    { scopeName: "theme-default", path: "E:\\sub\\default-vars.less" },
    { scopeName: "theme-mauve", path: "E:\\sub\\mauve-vars.less" },
  ],
  "E:\\sub\\style.less"
);

//result
//  {
//   code: `
//         .un-btn {
//             position: relative;
//         }
//         .theme-default .un-btn{
//             background-color: #0081ff;
//         }
//         .theme-mauve .un-btn{
//             background-color: #9c26b0;
//         }
//         .un-btn .anticon {
//             line-height: 1;
//         }`,
//   deps: [
//     "E:\\sub\\default-vars.less",
//     "E:\\sub\\mauve-vars.less",
//     "E:\\sub\\panel1.less",
//     "E:\\sub\\panel2.less",
//   ],
//   map: sourceMap || null,
// };
```
