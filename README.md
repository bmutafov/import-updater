# import updater

Automatically update imports for a given type/var/fn/etc in all files.

### To install

Update paths in the code to your repo.
```
npm install
npm run build
npm i -g
```

### To run
from monorepo
```
import-updater --source=<new_import_source_lib> --name=<import_to_be_updated>
```

e.g. Update all imports for LogInTypeT
```
import-updater --source=@trading212/onboarding.public.ts.util.types --name=LogInTypeT
```