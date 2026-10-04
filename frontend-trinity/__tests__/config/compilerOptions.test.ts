import fs from "fs";
import path from "path";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { buildCompilerOptions } = require("../../config/compilerOptions");

describe("Trinity 운영 빌드 console 제거 설정", () => {
  it("production 에서는 console.error 만 남기고 나머지를 제거한다", () => {
    expect(buildCompilerOptions("production")).toEqual({
      removeConsole: { exclude: ["error"] },
    });
  });

  it("development·test 에서는 console 을 그대로 둔다", () => {
    expect(buildCompilerOptions("development")).toEqual({});
    expect(buildCompilerOptions("test")).toEqual({});
  });

  it("next.config.mjs 가 NODE_ENV 기준으로 compiler 옵션을 연결한다", () => {
    const source = fs.readFileSync(path.join(__dirname, "../../next.config.mjs"), "utf8");
    expect(source).toContain("compiler: compilerOptions.buildCompilerOptions(process.env.NODE_ENV)");
  });
});
