// prettier.config.js
/**
 * @type {import('prettier').Config}
 * @see https://www.prettier.cn/docs/options.html
 */
export default {
  // 尾随逗号
  trailingComma: "all",
  // 单引号
  singleQuote: true,
  // 分号
  semi: false,
  // 打印宽度
  printWidth: 80,
  // 箭头函数参数括号
  arrowParens: "always",
  //  proseWrap
  proseWrap: "always",
  // 换行符
  endOfLine: "lf",
  // 实验性三元运算符
  experimentalTernaries: false,
  // 缩进宽度
  tabWidth: 2,
  // 使用制表符缩进
  useTabs: false,
  // 属性引号
  quoteProps: "consistent",
  // JSX 单引号
  jsxSingleQuote: false,
  // 大括号内的空格
  bracketSpacing: true,
  // 大括号与元素在同一行
  bracketSameLine: false,
  // JSX 大括号与元素在同一行
  jsxBracketSameLine: false,
  // Vue 脚本和样式缩进
  vueIndentScriptAndStyle: false,
  // 每个属性独占一行
  singleAttributePerLine: false,
};
