import { SourceFile, Statement, SyntaxKind } from "ts-morph";
import { addExportsToIndex, getVariableNames, iterateProjectFiles } from "./helpers";
import { project } from "./project";
import { execSync } from "child_process";
import pc from "picocolors";
import path from "path";

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
          if (funcDecl.getSourceFile().getFilePath().includes("trading-212-app/js")) {
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

export function createSelectAccessors(functionName: string) {
  // Snippet templates for the hooks and getter
  const snippets = {
    customerHook: (filenameBase: string) =>
      `export const useCustomer${filenameBase} = () => {
  return useCustomerStore(select${filenameBase})
}`,
    customerGetter: (filenameBase: string) =>
      `export const getCustomer${filenameBase} = () => {
  return select${filenameBase}(useCustomerStore.getState())
}`,
  };

  const addedFiles = project.addSourceFilesFromTsConfig(
    "/Users/boris.mutafov/monorepo/libs/onboarding/public/ts/util/onboarding.public.ts.util.customer/tsconfig.json"
  );

  for (const file of addedFiles) {
    const functionDecl = file.getVariableDeclaration(functionName) || file.getFunction(functionName);

    // If the function declaration is found in this file
    if (functionDecl) {
      const fileNameBase = path.basename(file.getFilePath(), ".ts").replace(/^customer/, "");

      // Generate hook and getter functions
      const hookFunction = snippets.customerHook(fileNameBase);
      const getterFunction = snippets.customerGetter(fileNameBase);

      // Write the new functions into the file
      const addedStatements = file.addStatements(`${hookFunction}\n\n${getterFunction}`);

      console.log(file.getFilePath());
      console.log("+", pc.green(addedStatements.map((s) => s.getText()).join("\n")));

      addExportsToIndex(
        addedStatements,
        file.getBaseName(),
        "/Users/boris.mutafov/monorepo/libs/onboarding/public/ts/util/onboarding.public.ts.util.customer/src/index.ts"
      );

      const newDeclaration = file.addImportDeclaration({
        moduleSpecifier: "../customerStore",
        namedImports: ["useCustomerStore"],
      });

      console.log("+", pc.green(newDeclaration.getText()));

      // Save the file after modifications
      project.saveSync();
      return file;
    }
  }
}

/**
 * Replaces all occurrences of `getOldCustomer(state)` with `getNewCustomer()`
 */
export function getStateReplacer(currentNamedImportName: string, newNamedImportName: string) {
  return iterateProjectFiles((file, onFileUpdated) => {
    file.forEachDescendant((node) => {
      if (node.getKind() === SyntaxKind.CallExpression) {
        const callExpr = node.asKind(SyntaxKind.CallExpression);
        const exprText = callExpr?.getExpression().getText();

        if (exprText === currentNamedImportName && callExpr?.getArguments().length === 1) {
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
export function reduxReplacer(currentNamedImportName: string, newNamedImportName: string) {
  return iterateProjectFiles((file, onFileUpdated) => {
    file.forEachDescendant((node) => {
      if (node.getKind() === SyntaxKind.CallExpression) {
        const callExpr = node.asKind(SyntaxKind.CallExpression);
        const exprText = callExpr?.getExpression().getText();

        if (
          (exprText === "useReduxState" || exprText === "useSelector") &&
          callExpr?.getArguments().length === 1 &&
          callExpr.getArguments()[0].getText() === currentNamedImportName
        ) {
          console.log(callExpr.getSourceFile().getFilePath());
          console.log("-", pc.red(callExpr.getText()));

          callExpr.replaceWithText(newNamedImportName.replace("get", "use") + "()");

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
export function reduxOnceReplacer(currentNamedImportName: string, newNamedImportName: string) {
  return iterateProjectFiles((file, onFileUpdated) => {
    file.forEachDescendant((node) => {
      if (node.getKind() === SyntaxKind.CallExpression) {
        const callExpr = node.asKind(SyntaxKind.CallExpression);
        const exprText = callExpr?.getExpression().getText();

        if (
          exprText === "useOnceFromReduxState" &&
          callExpr?.getArguments().length === 1 &&
          callExpr.getArguments()[0].getText() === currentNamedImportName
        ) {
          console.log(callExpr.getSourceFile().getFilePath());
          console.log("-", pc.red(callExpr.getText()));

          callExpr.replaceWithText(`useOnce(${newNamedImportName.replace("get", "use") + "()"})`);

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
export function yieldSelectReplacer(currentNamedImportName: string, newNamedImportName: string) {
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

            const updatedNode = yieldExpr?.replaceWithText(newNamedImportName + "()");

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
export function functionArgumentReplacer(currentNamedImportName: string, newNamedImportName: string) {
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
            console.log(`Correct import in $import { stat } from "fs";
{sourceFile.getFilePath()}`);

            return;
          } else {
            console.log("-", pc.red(importDecl.getText()));
          }

          namedImport.remove();
        }
      });

      if (!importDecl.getNamedImports().length && !importDecl.getDefaultImport() && !importDecl.getNamespaceImport()) {
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
export function createCommit(currentNamedImportName: string, newNamedImportName: string) {
  execSync("git add .");
  execSync(`git commit -m '${getCommitMessage(currentNamedImportName, newNamedImportName)}'`);
}

export function saveProject() {
  console.log("Saving project...");

  project.saveSync();

  console.log("Project saved...");
}

export function getCommitMessage(currentNamedImportName: string, newNamedImportName: string) {
  return `Customer lib migration: move ${currentNamedImportName} selectors to ${newNamedImportName}`;
}

export function updateConnectors(params: { namedImportName: string }) {
  return iterateProjectFiles((sourceFile, onFileUpdated) => {
    let removedPropName: string | null = null;

    const hookName = params.namedImportName.replace("get", "use");

    // Step 1: Find all `connect()` calls with `mapStateToProps`
    const connectCalls = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression).filter((call) => {
      const expression = call.getExpression();
      return expression.getText() === "connect";
    });

    for (const connectCall of connectCalls) {
      const args = connectCall.getArguments();

      if (
        (args.length > 0 && args[0].asKind(SyntaxKind.FunctionExpression)) ||
        args[0].asKind(SyntaxKind.ArrowFunction)
      ) {
        const mapStateToProps = args[0];

        // Step 2: Find `getCustomer()` usage and remove the corresponding key from `mapStateToProps`
        mapStateToProps.getDescendantsOfKind(SyntaxKind.PropertyAssignment).forEach((property) => {
          const initializer = property.getInitializer();
          if (initializer?.getText() === params.namedImportName + "()") {
            removedPropName = property.getName();

            console.log("-", pc.red(property.getText()));

            property.remove();
          }
        });

        // Step 3: Add or extend `ZustandConnectedProps` type if `getCustomer()` was used
        if (removedPropName) {
          console.log(sourceFile.getFilePath());

          const typeAliasName = "ZustandConnectedProps";
          const newPropDefinition = ` ${removedPropName}: ReturnType<typeof ${hookName}>`;

          // Check if type alias already exists; if so, modify it
          const existingTypeAlias = sourceFile.getTypeAlias(typeAliasName);

          if (existingTypeAlias) {
            // Extend existing type with new property
            const currentDefinition = existingTypeAlias.getTypeNode()?.getText() || "{}";
            // Create a new type literal node
            const newTypeLiteral = `${currentDefinition.replace(/}$/, `,${newPropDefinition} }`)}`;
            existingTypeAlias.setType(newTypeLiteral);

            console.log("+", pc.green(newTypeLiteral));
          } else {
            // Create a new type alias
            const typeAlias = `\ntype ${typeAliasName} = {${newPropDefinition} }; \n`;

            try {
              // Insert the new type alias before PropsT
              sourceFile.insertStatements(
                connectCall.getChildIndex() + sourceFile.getImportDeclarations().length,
                typeAlias
              );
            } catch (e) {
              sourceFile.addStatements(typeAlias);
            }

            console.log("+", pc.green(typeAlias));
          }

          // Step 4: Find `PropsT` type and extend it with `ZustandConnectedProps`
          const propsType = sourceFile
            .getDescendantsOfKind(SyntaxKind.TypeAliasDeclaration)
            .find((typeAlias) => typeAlias.getName() === "PropsT");

          if (propsType) {
            const oldType = propsType.getTypeNode()?.getText() || "unknown";
            console.log("-", pc.red(propsType.getText()));
            // Remove the old PropsT definition
            propsType.remove();

            // Add the new PropsT definition with the updated type
            const newPropsTypeDefinition = `\ntype PropsT = ${oldType} & ${typeAliasName}; \n`;

            console.log("+", pc.green(newPropsTypeDefinition));

            sourceFile.insertStatements(
              connectCall.getChildIndex() + sourceFile.getImportDeclarations().length,
              newPropsTypeDefinition
            );
          }

          // Step 5: Replace `connector` call with `zustandConnector`
          const connectorCalls = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression).filter((call) => {
            const expression = call.getExpression();
            return expression.getText() === "connector";
          });

          connectorCalls.forEach((connectorCall) => {
            const connectorArgs = connectorCall.getArguments();
            if (connectorArgs.length > 0) {
              const componentArg = connectorArgs[connectorArgs.length - 1]; // The last argument is the component

              console.log("-", pc.red(connectorCall.getText()));

              connectorCall.replaceWithText(
                `connector(withZustandStore({ ${removedPropName}: ${hookName} }, ${componentArg.getText()}))`
              );

              console.log("+", pc.green(connectorCall.getText()));
            }
          });

          // Step 6:Add import to withZustandStore
          sourceFile.addImportDeclaration({
            moduleSpecifier: "../higher-order-components/withZustandStore",
            namedImports: ["withZustandStore"],
          });

          console.log("+", pc.green(`import { withZustandStore } from "../higher-order-components/withZustandStore";`));

          // Step 7: Mark the file as changed
          onFileUpdated(sourceFile);
        }
      }
    }
  });
}
