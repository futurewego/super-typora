// electron-builder afterPack 钩子：
// 1) 清掉 iCloud/Finder 残留的扩展属性（否则 codesign 报 "resource fork ... detritus"）；
// 2) 给 .app 打 ad-hoc 签名，使其在 Apple Silicon 上可直接运行（无需 Apple 开发者证书）。
const { execSync } = require("child_process");

exports.default = async function afterPack(context) {
  if (context.electronPlatformName !== "darwin") {
    return;
  }
  const productName = context.packager.appInfo.productFilename;
  const appPath = `${context.appOutDir}/${productName}.app`;
  try {
    execSync(`xattr -cr "${appPath}"`, { stdio: "ignore" });
    execSync(`codesign --deep --force -s - "${appPath}"`, { stdio: "ignore" });
    console.log(`  • [afterPack] ad-hoc 签名完成: ${appPath}`);
  } catch (error) {
    console.error(`  • [afterPack] 签名失败: ${error.message}`);
  }
};
