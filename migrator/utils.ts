import { SourceFile, SyntaxKind } from "ts-morph";
import { iterateProjectFiles } from "./helpers";
import { project } from "./project";
import { execSync } from "child_process";
import pc from "picocolors";

/**
 * Finds and deletes a function definition by its name
 */
export function findAndDeleteDefinition(currentNamedImportName: string) {
  return iterateProjectFiles((file, onFileUpdated) => {
    file.forEachDescendant((node) => {
      if (node.getKind() === SyntaxKind.FunctionDeclaration) {
        const funcDecl = node.asKind(SyntaxKind.FunctionDeclaration);

        // Ensure the function name matches the one we want to delete
        if (funcDecl?.getName() === currentNamedImportName) {
          // Search only in the trading-212-app/js directory
          if (
            funcDecl
              .getSourceFile()
              .getFilePath()
              .includes("trading-212-app/js")
          ) {
            // Remove JSDoc comments if they exist
            const jsDocComments = funcDecl.getJsDocs();
            jsDocComments.forEach((jsDoc) => jsDoc.remove());

            // Remove the function declaration itself
            funcDecl.remove();

            console.log(
              pc.green(
                `Deleted function '${currentNamedImportName}' and its JSDoc comment from file: ${file.getFilePath()}`
              )
            );
          }
        }
      }
    });
  });
}

/**
 * Replaces all occurrences of `getOldCustomer(state)` with `getNewCustomer()`
 */
export function getStateReplacer(
  currentNamedImportName: string,
  newNamedImportName: string
) {
  return iterateProjectFiles((file, onFileUpdated) => {
    file.forEachDescendant((node) => {
      if (node.getKind() === SyntaxKind.CallExpression) {
        const callExpr = node.asKind(SyntaxKind.CallExpression);
        const exprText = callExpr?.getExpression().getText();

        if (
          exprText === currentNamedImportName &&
          callExpr?.getArguments().length === 1
        ) {
          console.log(callExpr.getSourceFile().getFilePath());
          console.log("-", pc.red(callExpr.getText()));

          callExpr.removeArgument(0);
          callExpr.setExpression(newNamedImportName);

          console.log("+", pc.green(callExpr.getText()));

          onFileUpdated(file);
        }
      }
    });
  });
}

/**
 * Replaces all occurrences of `useReduxState(currentNamedImportName)` with `useNewNamedImportName()`
 */
export function reduxReplacer(
  currentNamedImportName: string,
  newNamedImportName: string
) {
  return iterateProjectFiles((file, onFileUpdated) => {
    file.forEachDescendant((node) => {
      if (node.getKind() === SyntaxKind.CallExpression) {
        const callExpr = node.asKind(SyntaxKind.CallExpression);
        const exprText = callExpr?.getExpression().getText();

        if (
          exprText === "useReduxState" &&
          callExpr?.getArguments().length === 1 &&
          callExpr.getArguments()[0].getText() === currentNamedImportName
        ) {
          console.log(callExpr.getSourceFile().getFilePath());
          console.log("-", pc.red(callExpr.getText()));

          callExpr.replaceWithText(
            newNamedImportName.replace("get", "use") + "()"
          );

          console.log("+", pc.green(callExpr.getText()));

          onFileUpdated(file);
        }
      }
    });
  });
}

/**
 * Replaces all occurrences of `yield select(currentNamedImportName)` with `yield newNamedImportName()`
 */
export function yieldSelectReplacer(
  currentNamedImportName: string,
  newNamedImportName: string
) {
  return iterateProjectFiles((file, onFileUpdated) => {
    file.forEachDescendant((node) => {
      if (node.getKind() === SyntaxKind.YieldExpression) {
        const yieldExpr = node.asKind(SyntaxKind.YieldExpression);
        const yieldedExpression = yieldExpr?.getExpression();

        if (yieldedExpression?.getKind() === SyntaxKind.CallExpression) {
          const callExpr = yieldedExpression.asKind(SyntaxKind.CallExpression);
          const exprText = callExpr?.getExpression().getText();

          if (
            exprText === "select" &&
            callExpr?.getArguments().length === 1 &&
            callExpr.getArguments()[0].getText() === currentNamedImportName
          ) {
            console.log(callExpr.getSourceFile().getFilePath());
            console.log("-", pc.red(callExpr.getText()));

            const updatedNode = yieldExpr?.replaceWithText(
              newNamedImportName + "()"
            );

            console.log("+", pc.green(updatedNode?.getText()));

            onFileUpdated(file);
          }
        }
      }
    });
  });
}

/**
 * Replaces all occurrences of `getCurrentAccountType` with `getCustomerCurrentAccountType`
 * Where it is passed as a function argument
 */
export function functionArgumentReplacer(
  currentNamedImportName: string,
  newNamedImportName: string
) {
  return iterateProjectFiles((file, onFileUpdated) => {
    file.forEachDescendant((node) => {
      if (node.getKind() === SyntaxKind.CallExpression) {
        const callExpr = node.asKind(SyntaxKind.CallExpression);
        const args = callExpr?.getArguments();

        args?.forEach((arg) => {
          if (arg.getText() === currentNamedImportName) {
            console.log(callExpr?.getSourceFile().getFilePath());
            console.log("-", pc.red(callExpr?.getText()));

            arg.replaceWithText(newNamedImportName);

            console.log("+", pc.green(callExpr?.getText()));

            onFileUpdated(file);
          }
        });
      }
    });
  });
}

/**
 * Updates the import locations of a named import
 * E.g. from `import { getCustomer } from "./customer"` to `import { getNewCustomer } from "@lib/customer"`
 */
export function updateImports(params: {
  sourceFiles: SourceFile[];
  namedImportName: string;
  moduleSpecifier: string;
  renamedImportName?: string;
  shouldRenameToHook?: boolean;
  isTransaction?: boolean;
}) {
  for (const sourceFile of params.sourceFiles) {
    const importDeclarations = sourceFile.getImportDeclarations();

    console.log(sourceFile.getFilePath());

    importDeclarations.forEach((importDecl) => {
      const namedImports = importDecl.getNamedImports();

      namedImports.forEach((namedImport) => {
        if (namedImport.getName() === params.namedImportName) {
          if (importDecl.getModuleSpecifierValue() === params.moduleSpecifier) {
            console.log(`Correct import in ${sourceFile.getFilePath()}`);

            return;
          } else {
            console.log("-", pc.red(importDecl.getText()));
          }

          namedImport.remove();
        }
      });

      if (
        !importDecl.getNamedImports().length &&
        !importDecl.getDefaultImport() &&
        !importDecl.getNamespaceImport()
      ) {
        importDecl.remove();
        console.log(pc.yellow("Declaration remained empty, removing..."));
      }
    });

    let namedImport = params.namedImportName;

    if (params.renamedImportName) {
      namedImport = params.renamedImportName;
    }
    if (params.shouldRenameToHook) {
      namedImport = namedImport.replace("get", "use");
    }

    const newDeclaration = sourceFile.addImportDeclaration({
      moduleSpecifier: params.moduleSpecifier,
      namedImports: [namedImport],
    });

    console.log("+ " + pc.green(newDeclaration.getText()));
  }

  if (!params.isTransaction) {
    saveProject();
  }
}

/**
 * Checks if the TypeScript build is successful.
 */
export function checkTs(showOutput = false) {
  try {
    execSync("pnpm nx run trading-212-app:build-ts", {
      stdio: showOutput ? "inherit" : undefined,
    });

    console.log("TS Check succeeded.");
    return true;
  } catch (error) {
    console.error("TS Check failed", (error as any).message);
    return false;
  }
}

/**
 * Describes the changes made to the project using git status
 */
export function describeChanges() {
  console.log("\n Changed the following files:");
  execSync("git status --porcelain", {
    stdio: "inherit",
  });
}

/**
 * Creates a commit with a message
 */
export function createCommit(
  currentNamedImportName: string,
  newNamedImportName: string
) {
  execSync("git add .");
  execSync(
    `git commit -m 'Customer lib migration: move ${currentNamedImportName} selectors to ${newNamedImportName}'`
  );
}

export function saveProject() {
  console.log("Saving project...");

  project.saveSync();

  console.log("Project saved...");
}
