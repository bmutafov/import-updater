# import updater

Automatically migrate state in t212

- `yield select(selector)` to `getSelector()`
- `useReduxState(selector)` to `useSelector()`
- `getSelector(store.getState())` to `getSelector()`
- `selector` references to `getSelector` references

Formats the code on finish, check TS build for errors and if clean TS build make a commit with the changes.

### To install

Update paths in the code to your repo.

```
npm install
```

### To run

Edit `migrator/index.ts`

```
// TO RUN: Uncomment this and change as desired
// run(
//   "getCustomerCountryOfResidence",
//   "getCustomerCountryOfResidence",
//   "@lib/customer",
//   false
// );
```

```
$ npm run build
```

```
cd <path_to_your_monorepo>
node <path_to_this_lib>/dist/index.js

```


### Example output for migrating:

```
 node /tools/dist/migrator/index.js

🚀 Starting migration 🚀
Renaming getCustomerCountryOfResidence to getCustomerCountryOfResidence
Changing imports to module specifier: @lib/customer

⛳️ Checkpoint: Begin
Loading project files...
✔️ Project files loaded. Found 4543 files.
⛳️ Checkpoint: remove definition
Iterating project files...
Deleted function 'getCustomerCountryOfResidence' and its JSDoc comment from file: /js/selectors/customer.ts
No such occurrences found in the project files. No updates made
⛳️ Checkpoint: getStateReplacer
Iterating project files...
/js/components/InviteAFriendContactsScreen.tsx
- getCustomerCountryOfResidence(state)
+ getCustomerCountryOfResidence()
/js/endpoints/useGetEligibleTradingTypesEndpoint.ts
- getCustomerCountryOfResidence(state)
+ getCustomerCountryOfResidence()
/js/endpoints/useGetTradingTypesTagsEndpoint.ts
- getCustomerCountryOfResidence(state)
+ getCustomerCountryOfResidence()
/js/endpoints/useSetPersonalDetails.ts
- getCustomerCountryOfResidence(
        store.getState()
      )
+ getCustomerCountryOfResidence(
)
Saving project...
Project saved...
/js/components/InviteAFriendContactsScreen.tsx
- import { getCustomerCountryOfResidence } from '../selectors/customer'
Declaration remained empty, removing...
+import { getCustomerCountryOfResidence } from "@lib/customer";
/js/endpoints/useGetEligibleTradingTypesEndpoint.ts
- import { getCustomerCountryOfResidence } from '../selectors/customer'
Declaration remained empty, removing...
+import { getCustomerCountryOfResidence } from "@lib/customer";
/js/endpoints/useGetTradingTypesTagsEndpoint.ts
- import { getCustomerCountryOfResidence } from '../selectors/customer'
Declaration remained empty, removing...
+import { getCustomerCountryOfResidence } from "@lib/customer";
/js/endpoints/useSetPersonalDetails.ts
- import { getCustomerCountryOfResidence } from '../selectors/customer'
Declaration remained empty, removing...
+import { getCustomerCountryOfResidence } from "@lib/customer";
Saving project...
Project saved...
⛳️ Checkpoint: reduxReplacer
Iterating project files...
/js/hooks/useTagsByTradingType.ts
- useReduxState(getCustomerCountryOfResidence)
+ useCustomerCountryOfResidence()
Saving project...
Project saved...
/js/hooks/useTagsByTradingType.ts
- import { getCustomerCountryOfResidence } from '../selectors/customer'
Declaration remained empty, removing...
+import { useCustomerCountryOfResidence } from "@lib/customer";
Saving project...
Project saved...
⛳️ Checkpoint: yieldSelectReplacer
Iterating project files...
/js/flows/account-setup.ts
- select(getCustomerCountryOfResidence)
+ getCustomerCountryOfResidence()
/js/utils/consents.ts
- select(getCustomerCountryOfResidence)
+ getCustomerCountryOfResidence()
/js/utils/contacts.ts
- select(getCustomerCountryOfResidence)
+ getCustomerCountryOfResidence()
/js/utils/customer.ts
- select(getCustomerCountryOfResidence)
+ getCustomerCountryOfResidence()
/js/utils/customer.ts
- select(getCustomerCountryOfResidence)
+ getCustomerCountryOfResidence()
/js/utils/signup.ts
- select(getCustomerCountryOfResidence)
+ getCustomerCountryOfResidence()
Saving project...
Project saved...
/js/flows/account-setup.ts
- import {
  getAccountProgressStepAfter,
  getCustomerCountryOfResidence,
  getIsCurrentAccountEligibleForChooseHowToInvest,
  getOnboardingDealer
} from '../selectors/customer'
+import { getCustomerCountryOfResidence } from "@lib/customer";
/js/utils/consents.ts
- import { getCustomerCountryOfResidence } from '../selectors/customer'
Declaration remained empty, removing...
+import { getCustomerCountryOfResidence } from "@lib/customer";
/js/utils/contacts.ts
- import { getCustomerCountryOfResidence } from '../selectors/customer'
Declaration remained empty, removing...
+import { getCustomerCountryOfResidence } from "@lib/customer";
/js/utils/customer.ts
- import {
  getCanDeposit,
  getCurrentAccountProgressStep,
  getCustomerCountryOfResidence,
  getIsCurrentAccountEligibleForChooseHowToInvest,
  getIsReadyToTradeWithActivationStatusCheck,
  getSwitchAccountConfigFromPushNotification
} from '../selectors/customer'
+import { getCustomerCountryOfResidence } from "@lib/customer";
/js/utils/customer.ts
Correct import in /js/utils/customer.ts
+import { getCustomerCountryOfResidence } from "@lib/customer";
/js/utils/signup.ts
- import { getCustomerCountryOfResidence } from '../selectors/customer'
Declaration remained empty, removing...
+import { getCustomerCountryOfResidence } from "@lib/customer";
Saving project...
Project saved...
⛳️ Checkpoint: replace occurrences where is function argument...
Iterating project files...
No such occurrences found in the project files. No updates made
Saving project...
Project saved...
⛳️ Checkpoint: formatting files...
/js/components/InviteAFriendContactsScreen.tsx
/js/endpoints/useGetEligibleTradingTypesEndpoint.ts
/js/endpoints/useGetTradingTypesTagsEndpoint.ts
/js/endpoints/useSetPersonalDetails.ts
/js/hooks/useTagsByTradingType.ts
/js/flows/account-setup.ts
/js/utils/consents.ts
/js/utils/contacts.ts
/js/utils/customer.ts
/js/utils/signup.ts
⛳️ Checkpoint: Check TS
This takes a while...

   ✔    123/123 dependent project tasks succeeded [123 read from cache]

   Hint: you can run the command with --verbose to see the full dependent project outputs

 ————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————


> nx run app:build-ts


 ————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————

 >  NX   Successfully ran target build-ts for project app and 123 task(s) it depends on (26s)

   Nx read the output from the cache instead of running the command for 123 out of 124 tasks.

   View logs and investigate cache misses at https://nx.app/runs/O3KY0qbJu6

TS Check succeeded.
⛳️ Checkpoint: Committing changes...

 Changed the following files:
 M /js/components/InviteAFriendContactsScreen.tsx
 M /js/endpoints/useGetEligibleTradingTypesEndpoint.ts
 M /js/endpoints/useGetTradingTypesTagsEndpoint.ts
 M /js/endpoints/useSetPersonalDetails.ts
 M /js/flows/account-setup.ts
 M /js/hooks/useTagsByTradingType.ts
 M /js/selectors/customer.ts
 M /js/utils/consents.ts
 M /js/utils/contacts.ts
 M /js/utils/customer.ts
 M /js/utils/signup.ts
[STARTED] Preparing lint-staged...
[SUCCESS] Preparing lint-staged...
[STARTED] Running tasks for staged files...
[STARTED] package.json — 11 files
[STARTED] *.ts — 10 files
[STARTED] *.go — 0 files
[SKIPPED] *.go — no files
[STARTED] bun nx format:write --files
[SUCCESS] bun nx format:write --files
[SUCCESS] *.ts — 10 files
[SUCCESS] package.json — 11 files
[SUCCESS] Running tasks for staged files...
[STARTED] Applying modifications from tasks...
[SUCCESS] Applying modifications from tasks...
[STARTED] Cleaning up temporary files...
[SUCCESS] Cleaning up temporary files...
🏁 Finished
```
