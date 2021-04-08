import {
  getScopeProcessResult,
  getAllStyleVarFiles,
  getVarsContent,
  // eslint-disable-next-line import/no-extraneous-dependencies
} from "./utils";

/**
 *
 * @param {Object} opt
 * @param {Object} opt.implementation
 * @param {Function} opt.getMultipleScopeVars
 * @returns less
 */
export function getSass(opt = {}) {
  const packname = "sass";

  const sass = opt.implementation || require(packname);

  const { render } = sass;

  // eslint-disable-next-line func-names
  sass.render = function (options = {}, callback) {
    const renderOptions = { ...options };

    const multipleScopeVars =
      typeof opt.getMultipleScopeVars === "function"
        ? opt.getMultipleScopeVars(renderOptions)
        : renderOptions.multipleScopeVars;

    delete renderOptions.multipleScopeVars;

    const allStyleVarFiles = getAllStyleVarFiles(
      {
        emitError: (msg) => {
          throw new Error(msg);
        },
      },
      { multipleScopeVars }
    );
    const preProcessor = (code) =>
      new Promise((resolve, reject) => {
        render.call(sass, { ...renderOptions, data: code }, (err, res) => {
          if (err) {
            reject(err);
          } else {
            resolve(res);
          }
        });
      });
    let cssResult = {};
    return Promise.all(
      allStyleVarFiles.map((file) => {
        const varscontent = getVarsContent(file.path, packname);
        return preProcessor(`${varscontent}\n${renderOptions.data}`);
      })
    )
      .then((prs) => {
        // eslint-disable-next-line prefer-destructuring
        cssResult = prs[0];

        return getScopeProcessResult(
          prs.map((item) => {
            return {
              ...item,
              code: item.css.toString(),
              deps: item.stats.includedFiles,
            };
          }),
          allStyleVarFiles,
          renderOptions.file
        );
      })

      .then((result) => {
        cssResult.css = result.code;
        cssResult.stats.includedFiles = result.deps;

        if (callback) {
          callback(null, cssResult);
          return null;
        }

        return cssResult;
      })

      .catch((error) => {
        if (callback) {
          callback(error);
        }
      });
  };
  return sass;
}

export default getSass;