import { SourceFile } from "ts-morph";
import { project, sourceFiles } from "./project";
import { saveProject } from "./utils";
import pc from 'picocolors'

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

  if(updatedFiles.length > 0) {
    saveProject();
  } else {
    console.log(pc.cyan(`No such occurrences found in the project files. No updates made`));
  }

  return updatedFiles;
}
