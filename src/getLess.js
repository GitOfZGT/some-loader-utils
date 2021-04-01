import {
  getScopeProcessResult,
  getAllStyleVarFiles,
  getVarsContent,
} from "./utils";
/**
 *
 * @param {Object} opt
 * @param {Object} opt.implementation
 * @param {Function} opt.getMultipleScopeVars
 * @returns less
 */
export function getLess(opt = {}) {
  const packname = "less";
  const less = opt.implementation || require(packname);
  const { render } = less;
  // eslint-disable-next-line func-names
  less.render = function (input, options = {}, callback) {
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
    const preProcessor = (code) => render.call(less, code, renderOptions);

    return Promise.all(
      allStyleVarFiles.map((file) => {
        const varscontent = getVarsContent(file.path, packname);
        return preProcessor(`${input}\n${varscontent}`);
      })
    )
      .then((prs) =>
        getScopeProcessResult(
          prs.map((item) => {
            return { ...item, code: item.css, deps: item.imports };
          }),
          allStyleVarFiles,
          renderOptions.filename
        )
      )
      .then((result) => {
        const cssResult = {
          css: result.code,
          imports: result.deps,
          map: result.map,
        };
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
  return less;
}

export default getLess;
