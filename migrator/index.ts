import { execSync } from "child_process";
import { loadProject } from "./project";
import {
  getStateReplacer,
  reduxReplacer,
  yieldSelectReplacer,
  updateImports,
  findAndDeleteDefinition,
  checkTs,
  createCommit,
  describeChanges,
  functionArgumentReplacer,
  saveProject,
  getCommitMessage,
  createSelectAccessors,
  updateConnectors,
} from "./utils";
import pc from "picocolors";

function run(params: {
  namedImportName: string;
  renamedImportName: string;
  moduleSpecifier: string;
  isTransaction?: boolean;
}) {
  const {
    namedImportName,
    renamedImportName,
    moduleSpecifier,
    isTransaction = false,
  } = params;

  console.log("");
  console.log("🚀 Starting migration 🚀");
  console.log(`Renaming ${namedImportName} to ${renamedImportName}`);
  console.log("Changing imports to module specifier:", moduleSpecifier);
  if (isTransaction) {
    console.log(
      "🚨 Transaction mode enabled. Will save changes to disk when all is finished"
    );
  }
  console.log("");

  console.log("⛳️ Checkpoint: Begin");
  loadProject();

  // console.log("⛳️ Checkpoint: Extend selector");
  // createSelectAccessors(namedImportName.replace('get', 'select'));

  console.log("⛳️ Checkpoint: remove definition");
  findAndDeleteDefinition(namedImportName);

  console.log("⛳️ Checkpoint: getStateReplacer");
  const getStateReplacedInFiles = getStateReplacer(
    namedImportName,
    renamedImportName
  );
  updateImports({
    namedImportName,
    renamedImportName,
    moduleSpecifier,
    sourceFiles: getStateReplacedInFiles,
    isTransaction,
  });

  console.log("⛳️ Checkpoint: useReduxState/useSelector replacer");
  const reduxReplacedInFiles = reduxReplacer(
    namedImportName,
    renamedImportName
  );
  updateImports({
    namedImportName,
    renamedImportName,
    moduleSpecifier,
    sourceFiles: reduxReplacedInFiles,
    shouldRenameToHook: true,
    isTransaction,
  });

  console.log("⛳️ Checkpoint: useOnceFromReduxState replacer");
  const replacedInOnceHooks = reduxReplacer(namedImportName, renamedImportName);
  updateImports({
    namedImportName,
    renamedImportName,
    moduleSpecifier,
    sourceFiles: replacedInOnceHooks,
    shouldRenameToHook: true,
    isTransaction,
  });

  console.log("⛳️ Checkpoint: yieldSelectReplacer");
  const yieldSelectReplacedInFiles = yieldSelectReplacer(
    namedImportName,
    renamedImportName
  );
  updateImports({
    namedImportName,
    renamedImportName,
    moduleSpecifier,
    sourceFiles: yieldSelectReplacedInFiles,
    isTransaction,
  });

  console.log(
    "⛳️ Checkpoint: replace occurrences where is function argument..."
  );
  const functionArgumentReplacedInFiles = functionArgumentReplacer(
    namedImportName,
    renamedImportName
  );
  updateImports({
    namedImportName,
    renamedImportName,
    moduleSpecifier,
    sourceFiles: functionArgumentReplacedInFiles,
    isTransaction,
  });

  console.log(
    "⛳️ Checkpoint: replace occurrences where is connector..."
  );
  const connectorUpdates = updateConnectors({
    namedImportName,
  });
  updateImports({
    namedImportName,
    renamedImportName,
    moduleSpecifier,
    sourceFiles: connectorUpdates,
    isTransaction,
    shouldRenameToHook: true,
  });

  if (isTransaction) {
    saveProject();
  }

  console.log("⛳️ Checkpoint: formatting files...");
  const allFiles = [
    ...getStateReplacedInFiles,
    ...reduxReplacedInFiles,
    ...replacedInOnceHooks,
    ...connectorUpdates,
    ...yieldSelectReplacedInFiles,
    ...functionArgumentReplacedInFiles,
  ]
    .map((f) => f.getFilePath())
    .join(",");

  execSync(`bun nx format:write --files="${allFiles}"`, {
    stdio: "inherit",
    cwd: "/Users/boris.mutafov/monorepo",
  });

  // console.log("⛳️ Checkpoint: Check TS");
  // console.log("This takes a while...");

  // const tsBuildSuccess = checkTs(true);

  // if (!tsBuildSuccess) {
  //   console.log("🚨 TS Build failed. Please continue with manual review...");
  //   console.log("\n 💡 When done use commit message:");
  //   console.log(
  //     pc.yellow(getCommitMessage(namedImportName, renamedImportName))
  //   );
  //   process.exit(1);
  // }

  // console.log("⛳️ Checkpoint: Committing changes...");

  // describeChanges();

  // createCommit(namedImportName, renamedImportName);

  console.log("🏁 Finished");
}

// TO RUN: Uncomment this and change as desired
run({
  namedImportName: "getCustomerDealer",
  renamedImportName: "getCustomerDealer",
  moduleSpecifier: "@trading212/onboarding.public.ts.util.customer",
  isTransaction: false,
});
