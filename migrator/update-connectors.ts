import { Project, SourceFile } from "ts-morph";
import { loadProject } from "./project";
import { updateConnectors, updateImports } from "./utils";
import { execSync } from "child_process";

function updateConnector() {
  loadProject();
  // const { namedImportName, renamedImportName, moduleSpecifier, isTransaction = false } = params;

  const getters = getExportsStartingWithGet();
  const allFiles: SourceFile[] = [];

  for (const getter of getters) {
    console.log("Updating connector for getter:", getter.exportName);

    const fixedInFiles = updateConnectors({
      namedImportName: getter.exportName,
    });

    allFiles.push(...fixedInFiles);
    console.log("Replace in files count: ", fixedInFiles.length);

    updateImports({
      namedImportName: getter.exportName,
      renamedImportName: getter.exportName,
      moduleSpecifier: "@trading212/onboarding.public.ts.util.customer",
      sourceFiles: fixedInFiles,
      isTransaction: false,
      shouldRenameToHook: true,
    });
  }

  console.log("⛳️ Checkpoint: formatting files...");
  const filesAsString = allFiles.map((f) => f.getFilePath()).join(",");

  execSync(`bun nx format:write --files="${filesAsString}"`, {
    stdio: "inherit",
    cwd: "/Users/boris.mutafov/monorepo",
  });
}

function getExportsStartingWithGet() {
  const project = new Project({
    tsConfigFilePath: `./libs/onboarding/public/ts/util/onboarding.public.ts.util.customer/tsconfig.json`,
  });
  const sourceFiles = project.getSourceFiles(
    `./libs/onboarding/public/ts/util/onboarding.public.ts.util.customer/src/selectors/*.ts`
  );

  const getExports: { file: string; exportName: string }[] = [];

  for (const sourceFile of sourceFiles) {
    const exports = sourceFile.getExportedDeclarations();

    exports.forEach((declarations, exportName) => {
      if (exportName.startsWith("get")) {
        getExports.push({
          file: sourceFile.getFilePath(),
          exportName,
        });
      }
    });
  }

  return getExports;
}

updateConnector();
