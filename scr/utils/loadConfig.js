import fs from "fs";
import { resolve } from "path";

const parseFile = (filePath) => {
  const fullPath = resolve(process.cwd(), filePath);
  try {
    return JSON.parse(String(fs.readFileSync(fullPath)) || "{}");
  } catch {
    return {};
  }
};

export default () => {
  const commonConfig = parseFile("common.config");
  const devConfig = parseFile("developement.config");
  const prodConfig = parseFile("production.config");

  console.log(commonConfig);
  console.log(devConfig);
  console.log(prodConfig);
  const config = { ...commonConfig, ...devConfig, ...prodConfig };
  return config;
};
