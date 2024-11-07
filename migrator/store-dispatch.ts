import { SyntaxKind } from "ts-morph";
import { iterateProjectFiles } from "./helpers";
import { loadProject } from "./project";
import { saveProject } from "./utils";
import { execSync } from "child_process";

export function updateStoreDispatchWithCustomer() {
  return iterateProjectFiles((sourceFile, onFileAdded) => {
    sourceFile.forEachDescendant((node) => {
      if (sourceFile.getFilePath().includes("customerAdapter")) return;

      // Check if node is a CallExpression and matches `store.dispatch(customerSlice.actions.<action>())`
      if (node.getKind() === SyntaxKind.CallExpression) {
        const callExpr = node.asKind(SyntaxKind.CallExpression);

        // Ensure it’s calling `store.dispatch`
        if (
          callExpr?.getExpression().getText() === "store.dispatch" ||
          callExpr?.getExpression().getText() === "dispatch"
        ) {
          const firstArg = callExpr.getArguments()[0];

          // Check if the first argument matches `customerSlice.actions.<action>`
          if (firstArg?.getKind() === SyntaxKind.CallExpression) {
            const innerCallExpr = firstArg.asKind(SyntaxKind.CallExpression);
            const innerExpression = innerCallExpr?.getExpression();

            // Ensure inner expression is of the form `customerSlice.actions.<action>`
            if (innerExpression?.getKind() === SyntaxKind.PropertyAccessExpression) {
              const propertyAccessExpr = innerExpression.asKind(SyntaxKind.PropertyAccessExpression);
              const actionAccess = propertyAccessExpr?.getExpression().getText();

              if (actionAccess === "customerSlice.actions") {
                const actionName = propertyAccessExpr?.getName();
                const actionArgs = innerCallExpr?.getArguments().map((arg) => arg.getText());

                // Replace the entire `store.dispatch(customerSlice.actions.<action>(...args))`
                callExpr.replaceWithText(`Customer.actions.${actionName}(${actionArgs?.join(", ")})`);

                sourceFile.addImportDeclaration({
                  moduleSpecifier: "@trading212/onboarding.public.ts.util.customer",
                  namedImports: ["Customer"],
                });

                onFileAdded(sourceFile);
              }
            }
          }
        }
      }
    });
  });
}

function replaceSagaUsage() {
  return iterateProjectFiles((sourceFile, onFileChanged) => {
    sourceFile.forEachDescendant((node) => {
      if (sourceFile.getFilePath().includes("customerAdapter")) return;

      // Check if node is a CallExpression and matches `take`, `call`, or `put`
      if (node.getKind() === SyntaxKind.CallExpression) {
        const callExpr = node.asKind(SyntaxKind.CallExpression);
        const callee = callExpr?.getExpression();

        // Check if the function being called is take, call, or put
        if (callee?.getText() === "take" || callee?.getText() === "call" || callee?.getText() === "put") {
          const args = callExpr?.getArguments();

          // Loop through each argument to find usages of `customerSlice.actions`
          args?.forEach((arg) => {
            if (arg.getKind() === SyntaxKind.PropertyAccessExpression) {
              const propertyAccessExpr = arg.asKind(SyntaxKind.PropertyAccessExpression);
              const actionAccess = propertyAccessExpr?.getExpression();

              // Ensure it matches `customerSlice.actions`
              if (actionAccess?.getText() === "customerSlice.actions") {
                const actionName = propertyAccessExpr?.getName();

                // Replace `customerSlice.actions.<action>` with `Customer.actions.<action>`
                propertyAccessExpr?.replaceWithText(`Customer.actions.${actionName}`);
              }
            } else if (arg.getKind() === SyntaxKind.CallExpression) {
              // Handle cases like `put(customerSlice.actions.someAction())`
              const innerCallExpr = arg.asKind(SyntaxKind.CallExpression);
              const innerExpression = innerCallExpr?.getExpression();

              if (innerExpression?.getKind() === SyntaxKind.PropertyAccessExpression) {
                const propertyAccessExpr = innerExpression.asKind(SyntaxKind.PropertyAccessExpression);
                const actionAccess = propertyAccessExpr?.getExpression();

                if (actionAccess?.getText() === "customerSlice.actions") {
                  const actionName = propertyAccessExpr?.getName();

                  // Replace `customerSlice.actions.<action>(...)` with `Customer.actions.<action>(...)`
                  innerCallExpr?.replaceWithText(
                    `Customer.actions.${actionName}(${innerCallExpr
                      .getArguments()
                      .map((arg) => arg.getText())
                      .join(", ")})`
                  );

                  sourceFile.addImportDeclaration({
                    moduleSpecifier: "@trading212/onboarding.public.ts.util.customer",
                    namedImports: ["Customer"],
                  });

                  onFileChanged(sourceFile);
                }
              }
            }
          });
        }
      }
    });
  });
}

function replaceUseRedux() {
  return iterateProjectFiles((sourceFile, onFileChanged) => {
    sourceFile.forEachDescendant((node) => {
      // Check if node is a CallExpression and matches `useReduxAction(customerSlice.actions.<action>)`
      if (node.getKind() === SyntaxKind.CallExpression) {
        const callExpr = node.asKind(SyntaxKind.CallExpression);

        // Ensure it’s calling `useReduxAction`
        if (callExpr?.getExpression().getText() === "useReduxAction") {
          const firstArg = callExpr.getArguments()[0];

          // Check if the first argument matches `customerSlice.actions.<action>`
          if (firstArg?.getKind() === SyntaxKind.PropertyAccessExpression) {
            const propertyAccessExpr = firstArg.asKind(SyntaxKind.PropertyAccessExpression);
            const actionAccess = propertyAccessExpr?.getExpression();

            // Ensure it’s accessing `customerSlice.actions`
            if (actionAccess?.getText() === "customerSlice.actions") {
              const actionName = propertyAccessExpr?.getName();

              // Replace `useReduxAction(customerSlice.actions.<action>)` with `Customer.actions.<action>`
              callExpr.replaceWithText(`Customer.actions.${actionName}`);

              sourceFile.addImportDeclaration({
                moduleSpecifier: "@trading212/onboarding.public.ts.util.customer",
                namedImports: ["Customer"],
              });

              onFileChanged(sourceFile);
            }
          }
        }
      }
    });
  });
}

function connectorsFix() {
  return iterateProjectFiles((sourceFile, onFileChanged) => {
    sourceFile.forEachDescendant((node) => {
      // Check if node is a CallExpression and matches `connect`
      if (node.getKind() === SyntaxKind.CallExpression) {
        const callExpr = node.asKind(SyntaxKind.CallExpression);

        // Ensure it’s calling `connect`
        if (callExpr?.getExpression().getText() === "connect") {
          const args = callExpr.getArguments();

          // Typically, `connect` has mapStateToProps and mapDispatchToProps arguments
          // mapDispatchToProps is usually the second argument
          const mapDispatchArg = args[1];

          if (mapDispatchArg?.getKind() === SyntaxKind.ObjectLiteralExpression) {
            const objectLiteral = mapDispatchArg.asKind(SyntaxKind.ObjectLiteralExpression);

            // Loop through each property in the object literal
            objectLiteral?.getProperties().forEach((property) => {
              if (property.getKind() === SyntaxKind.PropertyAssignment) {
                const propertyAssignment = property.asKind(SyntaxKind.PropertyAssignment);
                const initializer = propertyAssignment?.getInitializer();

                // Check if the initializer is `customerSlice.actions`
                if (initializer?.getText() === "customerSlice.actions") {
                  // Replace `customerSlice.actions` with `Customer.actions`
                  initializer.replaceWithText("Customer.actions");
                }
              }
            });
          }
        }
      }
    });
  });
}

function run() {
  // const updatedFiles = [] as any[];
  // const updatedFiles2 = [] as any[];

  loadProject();
  const updatedFiles = updateStoreDispatchWithCustomer();
  saveProject();
  const updatedFiles2 = replaceSagaUsage();
  saveProject();
  const updatedFiles3 = replaceUseRedux();
  saveProject();
  const updatedFiles4 = connectorsFix();
  saveProject();
  const allFiles = [...updatedFiles, ...updatedFiles2, ...updatedFiles3, ...updatedFiles4]
    .map((f) => f.getFilePath())
    .join(",");

  execSync(`bun nx format:write --files="${allFiles}"`, {
    stdio: "inherit",
    cwd: "/Users/boris.mutafov/monorepo",
  });
}

run();
