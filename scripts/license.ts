import { init, type ModuleInfo } from "license-checker";
import { promisify } from "node:util";
import fs from "node:fs";
import path from "node:path";

const check = promisify(init);
const rootPath = path.resolve(__dirname, "..");

async function getLicenseText(info: ModuleInfo) {
  if (info.licenseText) {
    return info.licenseText;
  }

  if (info.licenseFile) {
    return fs.promises.readFile(info.licenseFile, "utf-8");
  }

  return "";
}

async function formatLicenseInfo(moduleName: string, info: ModuleInfo) {
  const licenseText = await getLicenseText(info);
  return `------------------------
${moduleName}
------------------------

${licenseText}`;
}

const legacySystemicLicenseText = `------------------------
systemic@4.1.2
------------------------
MIT License

Copyright (c) 2016-2022 GuideSmiths Ltd.
Copyright (c) One Beyond 2022 to present.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
`;

async function main() {
  const licenses = await check({
    start: rootPath,
    production: true,
  });

  const formattedLicenses = await Promise.all(
    Object.entries(licenses).map(([moduleName, info]) => formatLicenseInfo(moduleName, info)),
  );

  const licenseText = formattedLicenses.concat(legacySystemicLicenseText).join("\n\n");
  await fs.promises.writeFile(path.join(rootPath, "dist", "LICENSES"), licenseText);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
