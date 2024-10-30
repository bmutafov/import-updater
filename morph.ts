import { Project } from "ts-morph";
import { execSync } from "child_process";
import { z } from "zod";

const stepSeparator = () => console.log("\n-----------\n");

const ImportUpdaterValidArgs = z.union([
  z.literal("name"),
  z.literal("source"),
]);

const ImportUpdaterArgsSchema = z.object({
  name: z.string().min(1),
  source: z.string().min(1),
});

type ImportUpdaterArgs = z.TypeOf<typeof ImportUpdaterArgsSchema>;

export class ImportUpdater {
  private static TS_CONFIG_PATH =
    "./apps/shared/react/trading-212-app/tsconfig.json";

  private readonly project = new Project();

  private touchedFiles: string[] = [];
  private args: ImportUpdaterArgs = {} as ImportUpdaterArgs;

  constructor() {
    console.log("Finding imports...");

    const matchedFiles = this.project.addSourceFilesFromTsConfig(ImportUpdater.TS_CONFIG_PATH);

    console.log(
      `🚀 Import update started, will check ${matchedFiles.length} files`
    );

    this.args = this.getArgs();
    stepSeparator();
  }

  public run = () => {
    this.updateImports();

    if (!this.touchedFiles.length) {
      console.log("🤠 No files were touched. Exiting...");
      return;
    } else {
      console.log(`✅ Updated imports in ${this.touchedFiles.length} files`);
    }

    stepSeparator();

    console.log("🚧 Formatting touched files...");
    this.formatTouchedFiles();

    stepSeparator();
    
    console.log("🎉 All done!");
  };

  private updateImports = () => {
    this.project.getSourceFiles().forEach((sourceFile) => {
      const importDeclarations = sourceFile.getImportDeclarations();

      let hasTargetedNamedImport = false;

      importDeclarations.forEach((importDecl) => {
        const namedImports = importDecl.getNamedImports();

        namedImports.forEach((namedImport) => {
          if (namedImport.getName() === this.args.name) {
            if (importDecl.getModuleSpecifierValue() === this.args.source) {
              //prettier-ignore
              console.log(`🤠 Import ${this.args.name} from ${this.args.source} already exists in ${sourceFile.getFilePath()}`);

              return;
            } else {
              console.log(`🏓 Updating import in ${sourceFile.getFilePath()}`)
            }

            namedImport.remove();
            hasTargetedNamedImport = true;
          }
        });

        if (
          hasTargetedNamedImport &&
          !importDecl.getNamedImports().length &&
          !importDecl.getDefaultImport() &&
          !importDecl.getNamespaceImport()
        ) {
          importDecl.remove();
        }
      });

      if (hasTargetedNamedImport) {
        sourceFile.addImportDeclaration({
          moduleSpecifier: this.args.source,
          namedImports: [this.args.name],
        });

        this.touchedFiles.push(sourceFile.getFilePath());
      }

      // Save changes
      sourceFile.saveSync();
    });
  };

  private formatTouchedFiles = () => {
    const files = this.touchedFiles.join(",");
    execSync(`bun nx format:write --files="${files}"`, {
      stdio: "inherit",
      cwd: "/Users/boris.mutafov/monorepo",
    });
  };

  private getArgs = () => {
    const argsObject = process.argv.reduce((args, arg) => {
      // long arg
      if (arg.slice(0, 2) === "--") {
        const longArg = arg.split("=");
        const longArgFlag = ImportUpdaterValidArgs.parse(longArg[0].slice(2));
        const longArgValue = longArg.length > 1 ? longArg[1] : "";
        args[longArgFlag] = longArgValue;
      }
      return args;
    }, {} as ImportUpdaterArgs);

    return ImportUpdaterArgsSchema.parse(argsObject);
  };
}
