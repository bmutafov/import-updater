import { Project, SourceFile } from "ts-morph";

export const project = new Project({
  tsConfigFilePath: './apps/shared/react/trading-212-app/tsconfig.json'
});

export let sourceFiles: SourceFile[] = [];

export function loadProject() {
  console.log('Loading project files...');
  sourceFiles = project.getSourceFiles();
  console.log(`✔️ Project files loaded. Found ${sourceFiles.length} files.`);
  // new ImportUpdater2('getCustomerRegisterDate', '@trading212/onboarding.public.ts.util.customer')
}