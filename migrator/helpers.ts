import { SourceFile, Statement, SyntaxKind, VariableStatement } from "ts-morph";
import { project, sourceFiles } from "./project";
import { saveProject } from "./utils";
import pc from "picocolors";

export function iterateProjectFiles(
  forEachFileFn: (
    file: SourceFile,
    onFileUpdated: (file: SourceFile) => void
  ) => void
) {
  console.log(`Iterating project files...`);

  const updatedFiles: SourceFile[] = [];

  sourceFiles.forEach((file) =>
    forEachFileFn(file, (file) => updatedFiles.push(file))
  );

  if (updatedFiles.length > 0) {
    saveProject();
  } else {
    console.log(
      pc.cyan(`No such occurrences found in the project files. No updates made`)
    );
  }

  return updatedFiles;
}

/**
 * Gets variable names from a list of statements.
 * @param {Statement[]} statements - An array of statements to process.
 * @returns {string[]} - An array of variable names found.
 */
export function getVariableNames(statements: Statement[]): string[] {
  const variableNames: string[] = [];

  statements.forEach((statement) => {
    if (statement.getKind() === SyntaxKind.VariableStatement) {
      const variableStatement = statement as VariableStatement;
      variableStatement.getDeclarations().forEach((declaration) => {
        const name = declaration.getName();
        variableNames.push(name);
      });
    }
  });

  return variableNames;
}

/**
 * Adds exports to the index file for the given hook and getter functions.
 * @param {string} functionName - The base name of the function to export.
 */
export async function addExportsToIndex(
  statements: Statement[],
  fileBaseName: string,
  indexFilePath: string
) {
  const indexFile = project.getSourceFile(indexFilePath);
  if (!indexFile) {
    throw new Error(`Index file not found at path: ${indexFilePath}`);
  }

  // Derive import path based on the function name (assumes file structure where each function is in a separate file named after the function)
  const importPath = `./selectors/${fileBaseName.replace(".ts", "")}`;

  // Construct the export statement
  const exportStatement = `export { ${getVariableNames(statements).join(
    ","
  )} } from '${importPath}';`;
  console.log(indexFilePath);
  console.log("+", pc.green(exportStatement));

  // Check if the export statement already exists in the file
  const existingExport = indexFile
    .getExportDeclarations()
    .some((decl) => decl.getText().includes(exportStatement));

  if (!existingExport) {
    // Add export to the end of the index file
    indexFile.addStatements(exportStatement);
  } else {
  }

  saveProject();
}
