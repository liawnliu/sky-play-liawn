const fs = require("fs");
const path = require("path");

const mainPath = path.join("./bin/main.js");
const mainjsCtx = fs.readFileSync(mainPath, {
  encoding: "utf-8",
});

const tag = '"nodejs ui";';
const val = `
${tag}
${mainjsCtx}`;

fs.writeFileSync(mainPath, val, {
  encoding: "utf-8",
});

console.log('添加 "nodejs" 头成功');
