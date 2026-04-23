# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Releases from v0.10.0 onward are generated automatically by [release-please](https://github.com/googleapis/release-please) from Conventional Commit messages.

## [0.9.2](https://github.com/sivanbecker/shopping-recipies-events/compare/shopping-recipes-events-v0.9.1...shopping-recipes-events-v0.9.2) (2026-04-23)


### Features

* **ux:** replace spinner placeholders with skeleton loaders across all pages ([1810e6f](https://github.com/sivanbecker/shopping-recipies-events/commit/1810e6f7451d0963a477a4a35802edcccef2e0fe))
* **ux:** replace spinner placeholders with skeleton loaders across all pages ([a2f1df6](https://github.com/sivanbecker/shopping-recipies-events/commit/a2f1df60e0166f023cb80d1e6c582a04830468f3))
* **ux:** show app version in profile dropdown menu ([b0ba587](https://github.com/sivanbecker/shopping-recipies-events/commit/b0ba587d624bb432edb4a8fd479bf1ba64cc7e19))
* **ux:** show app version in profile dropdown menu ([92e8fc2](https://github.com/sivanbecker/shopping-recipies-events/commit/92e8fc273411fa071f8e83d988bf6fa1ae2d7899))
* **ux:** show item count per category in shopping list ([f0bde4f](https://github.com/sivanbecker/shopping-recipies-events/commit/f0bde4fdba84887753f3126b3dd3dc1f49853228))
* **ux:** show item count per category in shopping list ([67fc2bf](https://github.com/sivanbecker/shopping-recipies-events/commit/67fc2bfb208d8037eb8117b2e8d992c624e0cd3b))


### Performance

* **db:** add indexes for list items, product lookups, and active lists (stage 10.4) ([24f45dd](https://github.com/sivanbecker/shopping-recipies-events/commit/24f45ddc503dd3a34249a6b7628f77f80ecc365e))
* **db:** add indexes for list items, product lookups, and active lists (stage 10.4) ([2d6e363](https://github.com/sivanbecker/shopping-recipies-events/commit/2d6e36329aa40b163ed11bd267c61c9a42ad7cc8))
* **realtime:** add server-side filter to shopping_items subscription (stage 10.6) ([bb2ff62](https://github.com/sivanbecker/shopping-recipies-events/commit/bb2ff6240e0bb3fd90725e2287e6c5e199e270b9))
* **realtime:** add server-side filter to shopping_items subscription (stage 10.6) ([1628888](https://github.com/sivanbecker/shopping-recipies-events/commit/162888860d36a817fb6c33aed0b38754af1fe748))
* **routes:** lazy-load all page components for faster initial bundle (stage 10.5) ([a134ee8](https://github.com/sivanbecker/shopping-recipies-events/commit/a134ee8c1bea750c3bd8a2206a785f08f00101ff))
* **routes:** lazy-load all page components for faster initial bundle (stage 10.5) ([6986754](https://github.com/sivanbecker/shopping-recipies-events/commit/6986754d20f6942fefc3b405d87720f0da6f069d))
* **routes:** prefetch detail page chunks on list/events page mount ([a08b3e5](https://github.com/sivanbecker/shopping-recipies-events/commit/a08b3e5d20097b44425d2d0c34eff8077a845b36))
* **routes:** prefetch RecipeDetailPage chunk on RecipesPage mount ([63203d1](https://github.com/sivanbecker/shopping-recipies-events/commit/63203d128b31ff8a9ca787c8759c898d113c0c1a))


### Documentation

* add PR [#96](https://github.com/sivanbecker/shopping-recipies-events/issues/96) app version in profile menu to plan and progress ([35ae920](https://github.com/sivanbecker/shopping-recipies-events/commit/35ae92075abd5916fa77c6714886f328e93352b7))
* add Stage 11 — Theming & Appearance to project plan ([#86](https://github.com/sivanbecker/shopping-recipies-events/issues/86)) ([e28ac15](https://github.com/sivanbecker/shopping-recipies-events/commit/e28ac15698219f3c0e2cebecf3dc7fa57f6a5318))
* add Stage 12 — Android App & Quick Add Missing Item widget to project plan ([#88](https://github.com/sivanbecker/shopping-recipies-events/issues/88)) ([12c603d](https://github.com/sivanbecker/shopping-recipies-events/commit/12c603d3def5944e514117ca58e1674f93f3a9af))
* default PR merges to --merge (true merge commits) ([c50c900](https://github.com/sivanbecker/shopping-recipies-events/commit/c50c900acd9977c533d141a8b0edfcd068a4c604))
* default PR merges to --merge (true merge commits) in CLAUDE.md ([70e9732](https://github.com/sivanbecker/shopping-recipies-events/commit/70e973216061158229596cf4da3b81da303c1dbd))
* mark stage 10 complete and update skeleton loaders + category count progress ([a33ab2d](https://github.com/sivanbecker/shopping-recipies-events/commit/a33ab2da653f9e323a23ea10ee958e4d2976dd38))
* mark stage 10 complete, skeleton loaders done, category count progress ([3e525b1](https://github.com/sivanbecker/shopping-recipies-events/commit/3e525b1e2a4726fb6a4abdc16964273cece319f5))

## [0.9.1](https://github.com/sivanbecker/shopping-recipies-events/compare/shopping-recipes-events-v0.9.0...shopping-recipes-events-v0.9.1) (2026-04-22)


### Features

* add 'canDrive' functionality to contacts and update invitee management ([74c4709](https://github.com/sivanbecker/shopping-recipies-events/commit/74c4709f319470113a72e1ca30841f519b5f46d5))
* add add-category Claude Code skill ([e496a00](https://github.com/sivanbecker/shopping-recipies-events/commit/e496a006176ec431e48b834533f647cb4861db62))
* add add-category Claude Code skill ([e1019da](https://github.com/sivanbecker/shopping-recipies-events/commit/e1019da62cc696aa7656f0af1ed498329e0a1504))
* add Claude code instructions for branching workflow and quality gates ([eb19100](https://github.com/sivanbecker/shopping-recipies-events/commit/eb1910090c9c214c163d88a2d522b267f0a3f288))
* add dark mode support (partial — all pages except RecipeForm/Events) ([bdf2cef](https://github.com/sivanbecker/shopping-recipies-events/commit/bdf2cef66602b56ace21a0ef1f71575e80828e67))
* add format check to CI workflow and update scripts in package.json ([f253193](https://github.com/sivanbecker/shopping-recipies-events/commit/f253193a839515ba32b01ad1288f4e42a427c2d7))
* add Google OAuth social login ([d85fc93](https://github.com/sivanbecker/shopping-recipies-events/commit/d85fc93d72a53131874028606fb0d4c056846b33))
* add Google OAuth social login (Stage 1.5) ([e43c37b](https://github.com/sivanbecker/shopping-recipies-events/commit/e43c37b802d574ec7759ebd0707659ce6de0f251))
* add host equipment inventory to profile and equipment tab deduction ([e55d089](https://github.com/sivanbecker/shopping-recipies-events/commit/e55d089fac72b87b4978d2faac71012b393d7f8d))
* add host equipment inventory tracking to Profile and Equipment Tab. update project plan and progress ([542ce78](https://github.com/sivanbecker/shopping-recipies-events/commit/542ce7806292449062c5e60f104201da9d733185))
* add ideadd skill for automated BRAINDUMP.md updates ([fdd3191](https://github.com/sivanbecker/shopping-recipies-events/commit/fdd319164f605202a41d3822826ac7585e51a417))
* add initial pages for events, lists, products, recipes, and profile with basic structure and translations ([78ea29e](https://github.com/sivanbecker/shopping-recipies-events/commit/78ea29ea908ee6e0108c1e76dbdf791dd806790b))
* add mark-category-done via checkbox and swipe-right on category headers ([9a048f9](https://github.com/sivanbecker/shopping-recipies-events/commit/9a048f95350572acf7adf7276f96dd293fbd22b6))
* add migration for baking category in categories table ([62f78f0](https://github.com/sivanbecker/shopping-recipies-events/commit/62f78f08916c13f71a0405ae758fbba6afd5e18c))
* add migration for basic products category in categories table ([1ff4354](https://github.com/sivanbecker/shopping-recipies-events/commit/1ff4354a5cdc57e4e6254f9d988a78aff10f5ada))
* add no driver warning for invitees needing transport ([f2dcd51](https://github.com/sivanbecker/shopping-recipies-events/commit/f2dcd512e5ef8f7e087ef1b6e1cf12ac6100fd95))
* add planned bulk import feature for CSV/JSON in project documentation ([e912c5a](https://github.com/sivanbecker/shopping-recipies-events/commit/e912c5a36dfabd1b20729f304d5859d21fb7cf65))
* add product to shopping list from products page (task 2.7) ([0434167](https://github.com/sivanbecker/shopping-recipies-events/commit/0434167e8e2be67246bf5a4d4d44385bf2d5fbea))
* add product to shopping list from Products page (task 2.7) ([b6a3e0f](https://github.com/sivanbecker/shopping-recipies-events/commit/b6a3e0f06d43db91013d8cd70f958dc67b8d08f1))
* add profile avatar dropdown to header ([1a1e01b](https://github.com/sivanbecker/shopping-recipies-events/commit/1a1e01b974b91e017ed329920386486428b8f851))
* add project progress documentation with stages and tasks outline ([9ab680e](https://github.com/sivanbecker/shopping-recipies-events/commit/9ab680e02bdefe8d72fc267c269491b3304dcdb2))
* add PWA manifest for proper mobile/Android install ([02b9153](https://github.com/sivanbecker/shopping-recipies-events/commit/02b9153a3cd5782081c813df6792592ad7a467fa))
* add PWA manifest for proper mobile/Android install support ([0af3a8f](https://github.com/sivanbecker/shopping-recipies-events/commit/0af3a8ff2507334ffbefb42e8de80336b97e45fc))
* add README.md with project overview, setup instructions, and commands ([5512126](https://github.com/sivanbecker/shopping-recipies-events/commit/5512126eb8c6bb33198f31166992a812bdb30a34))
* add recipes DB migration (Stage 5.1) ([65a87bf](https://github.com/sivanbecker/shopping-recipies-events/commit/65a87bf0ab56dc300b31d771b29ee00fa30583cb))
* add RecipesTab and ShoppingTab components for event management ([1d1bb79](https://github.com/sivanbecker/shopping-recipies-events/commit/1d1bb791bbfb4bf11042bb0cc9251c9b85529bac))
* add shopping unit conversion for recipe ingredients ([a5da678](https://github.com/sivanbecker/shopping-recipies-events/commit/a5da678a18ba541b6c8655a34915c8998afb1984))
* add Trivy security scanning ([137606b](https://github.com/sivanbecker/shopping-recipies-events/commit/137606bf93b63c1a3275a9fb1d9d59e064360079))
* add Trivy security scanning ([409ca14](https://github.com/sivanbecker/shopping-recipies-events/commit/409ca14b806b5f59565e448fbb026f73ee23e494))
* add voice input buttons for Hebrew and English product name fields ([ac0f865](https://github.com/sivanbecker/shopping-recipies-events/commit/ac0f865eb421858c571e9ca7d205ae1d6787489d))
* add voice search mic button to add-item sheet ([103c984](https://github.com/sivanbecker/shopping-recipies-events/commit/103c9840e7a1aced5ef8875f2fd5986cd9d248ad))
* add voice search to products page ([fdb57cd](https://github.com/sivanbecker/shopping-recipies-events/commit/fdb57cdfd63aa8f4131686f138045c4957f37733))
* add voice search to products page ([f862cd5](https://github.com/sivanbecker/shopping-recipies-events/commit/f862cd50b991b47049d8a63ed50e0502f8947041))
* add חטיפים and מתוקים categories ([6f16850](https://github.com/sivanbecker/shopping-recipies-events/commit/6f16850e553212cd44f1e1df9460ee0a39ccdd2e))
* add חטיפים and מתוקים categories ([b39b292](https://github.com/sivanbecker/shopping-recipies-events/commit/b39b292e05caa94ab9d7aed198b2a97861973550))
* add נייר ומוצרים לבית category ([3d72d26](https://github.com/sivanbecker/shopping-recipies-events/commit/3d72d26a87fa3710447bf8ef7ebe4f3914ef4ac9))
* add נייר ומוצרים לבית category ([ee44cd4](https://github.com/sivanbecker/shopping-recipies-events/commit/ee44cd45f465abad36d95f65bfb7295db3cf2f19))
* add פארם (Pharm) category ([56d28dd](https://github.com/sivanbecker/shopping-recipies-events/commit/56d28dd186312b6489634f22ad5289c2a32cc71f))
* add פארם (Pharm) category ([60aaa48](https://github.com/sivanbecker/shopping-recipies-events/commit/60aaa48ddb9a0ab4e224a348044bcbde9754d8d5))
* AI auto-suggest for product fields via Gemini Flash ([07c611e](https://github.com/sivanbecker/shopping-recipies-events/commit/07c611ebe6e41b6d4feb2ac098487433943f90c3))
* AI auto-suggest product fields via Gemini Flash ([17d2b25](https://github.com/sivanbecker/shopping-recipies-events/commit/17d2b25caae513c1dff57a5045eee76b68de1239))
* always show avatars on lists and include owner in member list ([a572481](https://github.com/sivanbecker/shopping-recipies-events/commit/a572481e37008e0156fba75038c5a7e135076c90))
* clear buttons, char filtering, and strict voice-to-field binding ([bc16205](https://github.com/sivanbecker/shopping-recipies-events/commit/bc162052f00866f4cfde9ccc06eb85127ec5fc70))
* clone shopping list — stage 3.5 ([b2e012f](https://github.com/sivanbecker/shopping-recipies-events/commit/b2e012fb92538da70e7281fe30fde7718e541805))
* clone shopping list (stage 3.5) ([d9f42b3](https://github.com/sivanbecker/shopping-recipies-events/commit/d9f42b3f96b771a022846f76fc6123a9c52508fd))
* collaboration & permissions upgrade for shopping lists ([2a5ac2e](https://github.com/sivanbecker/shopping-recipies-events/commit/2a5ac2eda0addaaff7ab1797b74f62b55316990e))
* collaboration & permissions upgrade for shopping lists ([f13aad4](https://github.com/sivanbecker/shopping-recipies-events/commit/f13aad4d8147a3f8be36a5c309351c9a97ce5370))
* complete dark mode for RecipeFormPage, Events pages, and FOUC prevention ([c2af3eb](https://github.com/sivanbecker/shopping-recipies-events/commit/c2af3ebad6a25d0ca3a5dfb015f99a4984f2ad5d))
* contacts enhancements — labels, account linking, contact-based sharing ([3ae0556](https://github.com/sivanbecker/shopping-recipies-events/commit/3ae05562a98174b778d4db1e823faecaeae58ae6))
* contacts enhancements — labels, account linking, contact-based sharing ([a7b3bb1](https://github.com/sivanbecker/shopping-recipies-events/commit/a7b3bb15af2d2f2f6a515b0f4f2574327d65b3bc))
* countdown bar on undo toast ([f0ada74](https://github.com/sivanbecker/shopping-recipies-events/commit/f0ada748757f0df498e72e068a4eb459c38b823f))
* dark mode support for all pages ([cbbd9e8](https://github.com/sivanbecker/shopping-recipies-events/commit/cbbd9e8c38f60654dadae9cfbc7589de909d3ae5))
* display Google profile picture in avatars ([61aaeb1](https://github.com/sivanbecker/shopping-recipies-events/commit/61aaeb1e913a257e5d22d18457337360333c5f86))
* enable interim voice results for faster search response ([23b8591](https://github.com/sivanbecker/shopping-recipies-events/commit/23b85913b64ff7f3e744cd7990a2e381e802ab5b))
* enhance product import functionality with duplicate name checks and update import summary dialog ([3b864d3](https://github.com/sivanbecker/shopping-recipies-events/commit/3b864d303ebfd5cd5b17fe93f0f7d33645a59e18))
* enlarge category headers in shopping list ([c51be0e](https://github.com/sivanbecker/shopping-recipies-events/commit/c51be0e99690c478dcd8189074fdee37bac90ad6))
* enlarge category headers in shopping list for mobile readability ([1617867](https://github.com/sivanbecker/shopping-recipies-events/commit/1617867241e8e91e16ccd6c7748e63b79bdac2f5))
* enlarge category headers in shopping list for mobile readability ([d9fa958](https://github.com/sivanbecker/shopping-recipies-events/commit/d9fa958e4c3e7e26c82136d7c1033b5de1b597b4))
* event detail tabs with invitees, equipment, recipes, and shopping ([fe5bcc5](https://github.com/sivanbecker/shopping-recipies-events/commit/fe5bcc5200d6d7ebd6e7762b99d633d4311afe5b))
* **events:** add event comments drawer and post-mortem dialog ([f08d03c](https://github.com/sivanbecker/shopping-recipies-events/commit/f08d03cd0fdbb413b03ca8db242e214563464ad5))
* **events:** event comments drawer + post-mortem dialog ([97b5c7b](https://github.com/sivanbecker/shopping-recipies-events/commit/97b5c7b537441b0ce068a473d70e7a8581ff4121))
* **events:** event sharing (Stage 9.2) ([0d4dc62](https://github.com/sivanbecker/shopping-recipies-events/commit/0d4dc62df0b74ab5e76b8d19de9c8b14bce5dce2))
* **events:** event sharing with members, share dialog, avatar stack ([ead53b9](https://github.com/sivanbecker/shopping-recipies-events/commit/ead53b9fa04e02edd71c75a6baa29f6657978714))
* **events:** implement full event management features including creation, editing, and deletion ([ca590a6](https://github.com/sivanbecker/shopping-recipies-events/commit/ca590a61a542a8c39428c203227dc5b17c7ea295))
* **events:** show photo album chip on event cards ([8e86eb9](https://github.com/sivanbecker/shopping-recipies-events/commit/8e86eb9c8feb418260aacb2d75d19274c2d718b0))
* **events:** show photo album chip on event cards ([b5b36cb](https://github.com/sivanbecker/shopping-recipies-events/commit/b5b36cbb8bfa5e2687b210fde85e3edb45748e93))
* faster voice search with interim results ([f783f4d](https://github.com/sivanbecker/shopping-recipies-events/commit/f783f4d4af70999c25387b58955731fd5208a948))
* group shopping list items by category with collapsible sections ([bf804aa](https://github.com/sivanbecker/shopping-recipies-events/commit/bf804aa6ab6d733a37e4ce9f4a903acb856baf4f))
* group shopping list items by category with collapsible sections ([4b1f20b](https://github.com/sivanbecker/shopping-recipies-events/commit/4b1f20b7461228bbfe3781939a9a8f54d79b394e))
* header profile avatar dropdown ([ce010aa](https://github.com/sivanbecker/shopping-recipies-events/commit/ce010aa5fd98e72880505205dfc25ff63f57578c))
* host equipment inventory in profile + equipment tab deduction ([198c218](https://github.com/sivanbecker/shopping-recipies-events/commit/198c218d458a86f81e35510b29216a9218acfe95))
* ideadd skill — wait for PR checks before merging ([f7090f9](https://github.com/sivanbecker/shopping-recipies-events/commit/f7090f9a1f9e52f38837d6d2f6feec97c462d78f))
* ignore OWASP scan documentation in .gitignore ([4ca15ba](https://github.com/sivanbecker/shopping-recipies-events/commit/4ca15ba60df80e9803d94c355a371d7a6af2582b))
* ignore OWASP scan documentation in .gitignore ([a0d837b](https://github.com/sivanbecker/shopping-recipies-events/commit/a0d837b6db57ce6b01e1908fb72b5e46e1bb0660))
* implement AuthProvider and AuthContext for user authentication management + lint fix ([564953b](https://github.com/sivanbecker/shopping-recipies-events/commit/564953bf1411546e34d918f00c51b3268fab68d4))
* implement bulk import functionality with upsert logic and detailed import summary ([1bd2e8d](https://github.com/sivanbecker/shopping-recipies-events/commit/1bd2e8d058ccc0591bca9d90ce55e51fa8e5b519))
* implement full functionality for shopping lists with active and archived views ([e7b2fa6](https://github.com/sivanbecker/shopping-recipies-events/commit/e7b2fa68d4286c2278cce48412b9213451adb59b))
* implement full Products Catalog with search, add/edit/delete functionality and i18n support ([bbdef61](https://github.com/sivanbecker/shopping-recipies-events/commit/bbdef6104fbc72b8cc7c2bfddaadc2ffc48782dc))
* implement Google OAuth for authentication and add related UI components ([e57bfbd](https://github.com/sivanbecker/shopping-recipies-events/commit/e57bfbde2ef353c71881fa177c0b09d195e3a982))
* implement List Detail Page (/lists/:id) — stage 3.3 ([dda44fe](https://github.com/sivanbecker/shopping-recipies-events/commit/dda44fe8a3dec8c531aed2974069aca63d74e26f))
* implement List Detail Page (/lists/:id) — stage 3.3 ([2224de5](https://github.com/sivanbecker/shopping-recipies-events/commit/2224de5507c2d54c7836723c7e6ac9ebbb401b2b))
* implement product import functionality with CSV/JSON support and add import summary dialog ([37bfb2a](https://github.com/sivanbecker/shopping-recipies-events/commit/37bfb2a244476603c5ee206a2c6602104113cb86))
* implement recipes feature with pages and forms (Stage 5.2-5.5) ([7977c2a](https://github.com/sivanbecker/shopping-recipies-events/commit/7977c2a17589c5f1b7ff73a78cce6e99cb4b0ad2))
* implement user avatars (Stage 4.5) ([a52f7b8](https://github.com/sivanbecker/shopping-recipies-events/commit/a52f7b8d7d085f631272de2aaf461c63c844fe54))
* inline list name editing for owners and editors ([fa309fb](https://github.com/sivanbecker/shopping-recipies-events/commit/fa309fb9fecadfa91cdcb2a5fb6ef071f625d12f))
* inline quantity and unit editing on list items ([cf1052b](https://github.com/sivanbecker/shopping-recipies-events/commit/cf1052bf66ef8ceed26772055dd38280a341aec3))
* list-level product sharing via RLS expansion (Stage 4.x) ([9acefec](https://github.com/sivanbecker/shopping-recipies-events/commit/9acefecf29e82484ef6c05a7493c4a6fdcbe61b2))
* mark entire category done via checkbox or swipe ([61d353a](https://github.com/sivanbecker/shopping-recipies-events/commit/61d353adc6824d6a02307dc3176bad53c15b17b6))
* migrate from legacy anon key to Supabase publishable API key ([46fb99c](https://github.com/sivanbecker/shopping-recipies-events/commit/46fb99cb3583ad8355668bcfe8f3f2347b8c9694))
* migrate to Supabase publishable API key ([1508d1e](https://github.com/sivanbecker/shopping-recipies-events/commit/1508d1e6904f6f2cd85ce1964d5abc443f878bdd))
* move dark mode toggle to header ([2094691](https://github.com/sivanbecker/shopping-recipies-events/commit/2094691ab68033a14c2dbc730d7e77eb40a9625b))
* move dark mode toggle to header next to language switcher ([9e94a10](https://github.com/sivanbecker/shopping-recipies-events/commit/9e94a106c0a168402edff6b05871ca84840b7641))
* quantity & units UX + add-to-list from products page (stages 3.4 & 2.7) ([b541f66](https://github.com/sivanbecker/shopping-recipies-events/commit/b541f6658b01868592689a7daaa846a06355570d))
* quantity & units UX with upsert on duplicate (stage 3.4) ([6419dff](https://github.com/sivanbecker/shopping-recipies-events/commit/6419dff454df2b388f9c0e42627a086fe346d596))
* remove אחר category ([b5e0de8](https://github.com/sivanbecker/shopping-recipies-events/commit/b5e0de83a29957ab0367e227cf00a03916f60e34))
* remove אחר category ([d658f80](https://github.com/sivanbecker/shopping-recipies-events/commit/d658f80fe23695db14405b68e4492e1b760955bf))
* rename dairy category and add spreads category in migration ([fc1d7ff](https://github.com/sivanbecker/shopping-recipies-events/commit/fc1d7ff7deecc54d9dee59f3d4675c283bdbf1cd))
* show added-by avatar on each item row (Stage 4.6) ([0026cb4](https://github.com/sivanbecker/shopping-recipies-events/commit/0026cb4a37a4eb5eb8a6114b255d2ca4c8b9f034))
* show AI suggest button in edit product modal ([e756a4d](https://github.com/sivanbecker/shopping-recipies-events/commit/e756a4d694f91228db9b9fa90f874ece9cc9b20a))
* show AI suggest button in edit product modal ([bfacf1f](https://github.com/sivanbecker/shopping-recipies-events/commit/bfacf1f9d0f64e3240fa8d3879a5dd5fe5dfd7c0))
* show full product creation modal with AI suggest in shopping list ([0fef813](https://github.com/sivanbecker/shopping-recipies-events/commit/0fef813c26829bd152f613afbc92a6b3f5071c56))
* show Google profile picture in avatars (Stage 1.5 extension) ([84ad851](https://github.com/sivanbecker/shopping-recipies-events/commit/84ad8514def8dff58e086b246e26e9328bbe912d))
* stage 3.6 — missing items quick-add flow ([438e9c9](https://github.com/sivanbecker/shopping-recipies-events/commit/438e9c98d1674cfc954e47626ca7d76466b8e687))
* stage 3.6 — missing items quick-add flow ([8f4ba20](https://github.com/sivanbecker/shopping-recipies-events/commit/8f4ba204718eaa67993ea082c64f0f18e9fcb853))
* stage 3.7 — shopping mode (in-store UX) ([d6dab80](https://github.com/sivanbecker/shopping-recipies-events/commit/d6dab80599de1a1a9406af6a031c2a616462c0df))
* stage 3.7 — shopping mode in-store UX ([50297c6](https://github.com/sivanbecker/shopping-recipies-events/commit/50297c61168a501e95ba08371b174ea2ee247a1f))
* stage 4.1 — invite users to lists ([be64ba6](https://github.com/sivanbecker/shopping-recipies-events/commit/be64ba6ba4f8bb177343b5f39b83971742ab9482))
* stage 4.1 — invite users to lists ([88d42f8](https://github.com/sivanbecker/shopping-recipies-events/commit/88d42f8b07a82e71a6a4bb6c6b1587ecb97fc45f))
* Stage 4.2 — Realtime sharing for shared lists ([6357bf4](https://github.com/sivanbecker/shopping-recipies-events/commit/6357bf44855ec9a56741de011b635514ba24f39a))
* stage 4.2 — Supabase Realtime subscriptions for shopping lists ([19056b3](https://github.com/sivanbecker/shopping-recipies-events/commit/19056b34a4ea2aa791647bcc590ea75a59797bd2))
* Stage 6.1 — Events CRUD + Contacts ([675da1e](https://github.com/sivanbecker/shopping-recipies-events/commit/675da1e3dba345dec39631ba2569fd2e2afb4d70))
* unified product creation modal with AI suggest everywhere ([9a5a5d5](https://github.com/sivanbecker/shopping-recipies-events/commit/9a5a5d53da553f024c9eaee91b80f3e767594404))
* update app icon and rename short name to Shop Cook Host ([5b6706b](https://github.com/sivanbecker/shopping-recipies-events/commit/5b6706b621d597d17642b1137974c0dd5d29d6e4))
* update CI workflow to use Node.js 20 and enhance Snyk vulnerability scan ([692aa8e](https://github.com/sivanbecker/shopping-recipies-events/commit/692aa8e8af5f3e9c4f2de7e3c4355385819a0ecd))
* update manifest - new icon and app name ([206e450](https://github.com/sivanbecker/shopping-recipies-events/commit/206e450398ff8048ac414664e98ee88d8e4a177f))
* update shopping lists localization with additional phrases for archiving and list management ([a8ff724](https://github.com/sivanbecker/shopping-recipies-events/commit/a8ff724b52758fa6ab21a67649bddd559b567ced))
* use | as separator for multiple categories in add-category skill ([0d04be5](https://github.com/sivanbecker/shopping-recipies-events/commit/0d04be5cf1c5a0ecf8055791ad03e1ca3664660d))
* use | as separator for multiple categories in add-category skill ([2e5affc](https://github.com/sivanbecker/shopping-recipies-events/commit/2e5affc2f004ee9b650af587dc8f023b085cb182))
* validate photo album URL format before rendering link ([f9e232e](https://github.com/sivanbecker/shopping-recipies-events/commit/f9e232e9b9942b3699090872829471d4a92e8f15))
* voice input for Hebrew and English product name fields ([ae54fe7](https://github.com/sivanbecker/shopping-recipies-events/commit/ae54fe75161d7794b1fc9c44abc2a8b6f3351e44))
* voice search in add-item sheet ([b452f23](https://github.com/sivanbecker/shopping-recipies-events/commit/b452f23009e6b5a2d5a526d73d9e212f6de8735b))
* widen desktop layout and improve category filter UX ([d43ba72](https://github.com/sivanbecker/shopping-recipies-events/commit/d43ba722f128e1c9f2a010d640cd0cb5b4f3c692))


### Bug Fixes

* add *.tsbuildinfo to .gitignore to prevent build artifacts from being tracked ([35adefd](https://github.com/sivanbecker/shopping-recipies-events/commit/35adefd94bc1bb3536143cef1387c3963523ca7b))
* add broadcastChange export and fix servings initialization ([064f6c4](https://github.com/sivanbecker/shopping-recipies-events/commit/064f6c4b2423b0b588c55c4fce412cffff9cdd6d))
* add missing i18n keys to common.json (both he and en) ([c5e6015](https://github.com/sivanbecker/shopping-recipies-events/commit/c5e60156c78f9f624dbc26b0cb16eb8a7ada70af))
* add missing useEffect dependency ([726b4d3](https://github.com/sivanbecker/shopping-recipies-events/commit/726b4d31e3575fa72e61d1a57fe8a4e45acc7bc1))
* add tools management with localization support in RecipeDetailPage and RecipeFormPage ([fbded3c](https://github.com/sivanbecker/shopping-recipies-events/commit/fbded3ce2f6dfda74378ca42ce33ef3326662dcf))
* address Snyk security findings ([1f94e08](https://github.com/sivanbecker/shopping-recipies-events/commit/1f94e086563b0b5275f34f9b5c0a6062b4b2c2b1))
* adjust type casting for event invitees and remove unused parameter from generateShoppingList ([c33861f](https://github.com/sivanbecker/shopping-recipies-events/commit/c33861f4221d4760fbc0ce01a7798a1a08043c1d))
* auto-stop voice recognition after 1s in ProductDialog ([2e8551d](https://github.com/sivanbecker/shopping-recipies-events/commit/2e8551dc9dd45c2cbfdafbe279ccef4a64b394fe))
* auto-stop voice recognition after 1s on mobile for ProductDialog ([bbb93fa](https://github.com/sivanbecker/shopping-recipies-events/commit/bbb93fa426d62f2f2d77f6bd97e4177b3b5a7f1b))
* avoid duplicate Realtime channel by lifting useNotifications to NotificationBell ([00dda3e](https://github.com/sivanbecker/shopping-recipies-events/commit/00dda3ed97ed10ee6fc71ea3b17b540fbe949f17))
* backfill avatar_url for existing Google users on login ([6e06ab7](https://github.com/sivanbecker/shopping-recipies-events/commit/6e06ab7ab732f9312f810cd6bfe2e34871b8d275))
* break RLS recursion between events and event_members (migration 021) ([93c8081](https://github.com/sivanbecker/shopping-recipies-events/commit/93c8081e98207475f43ba6fe599497463dc1bcac))
* disable Gemini thinking mode to prevent truncated JSON output ([e3cec2c](https://github.com/sivanbecker/shopping-recipies-events/commit/e3cec2cc85d133a3c42386a6debf9bf757a33e03))
* disable interimResults for ProductDialog to fix mobile Hebrew hang ([1bc7a90](https://github.com/sivanbecker/shopping-recipies-events/commit/1bc7a9020cdc556c106e473b7ce0d20d8cab24a4))
* disable interimResults for ProductDialog to fix mobile Hebrew hang ([80601fb](https://github.com/sivanbecker/shopping-recipies-events/commit/80601fb15e0fafa9fcc81e2d48b4fd9b2e14105e))
* drop get_list_members before recreating with new return type ([58ee718](https://github.com/sivanbecker/shopping-recipies-events/commit/58ee7181f79a4d0315f06d5780f95b474929f878))
* enhance ingredient management by adding unit_id and new list actions in RecipeDetailPage and RecipeFormPage ([7a05c1f](https://github.com/sivanbecker/shopping-recipies-events/commit/7a05c1fdac51d18c13c23d0afc75051557156ed4))
* fix lists not loading and locale-sensitive display name ([b667b9a](https://github.com/sivanbecker/shopping-recipies-events/commit/b667b9a03ab9419d1e314d887b56c925ec27272d))
* flush last transcript as final on onend for mobile Chrome ([2fc7060](https://github.com/sivanbecker/shopping-recipies-events/commit/2fc70600772516f890fab08d37811d171e454055))
* flush last transcript as final on onend for mobile Chrome ([ec98cf7](https://github.com/sivanbecker/shopping-recipies-events/commit/ec98cf7edca468d76be8ba75b8aede83544140eb))
* guard against null product in ItemRow for shared lists ([d77302e](https://github.com/sivanbecker/shopping-recipies-events/commit/d77302e02af95df8acf26d63c3a431c779ce8ae4))
* hebrew voice input not filling field in ProductDialog ([ff34d43](https://github.com/sivanbecker/shopping-recipies-events/commit/ff34d4370aefb120d7863ccb9a8a64e391ff54ac))
* hebrew voice input not filling field in ProductDialog ([3e27485](https://github.com/sivanbecker/shopping-recipies-events/commit/3e27485412dd473fd470badee48286b497145e45))
* hide action button labels on mobile in list detail header ([4c19d0f](https://github.com/sivanbecker/shopping-recipies-events/commit/4c19d0f2acd160746ff0fb8c8bbf81c0a8571bb0))
* hide action button labels on mobile in list detail header ([8ed8a99](https://github.com/sivanbecker/shopping-recipies-events/commit/8ed8a992735433e40a21b6f3ee131ee61a44dd9e))
* implement Realtime Broadcast for cross-user list updates ([9bd53f7](https://github.com/sivanbecker/shopping-recipies-events/commit/9bd53f7a4d55177ac807c173ad93e3fdb6994d6d))
* increase voice auto-stop timeout to 2s in ProductDialog ([46a0df3](https://github.com/sivanbecker/shopping-recipies-events/commit/46a0df389c984fb25f987c4891244003651c98f8))
* increase voice auto-stop timeout to 2s in ProductDialog ([af608d5](https://github.com/sivanbecker/shopping-recipies-events/commit/af608d507162826af323fdd60ba7cadd5675da5d))
* lists not loading (PostgREST + RLS recursion) ([b8d07eb](https://github.com/sivanbecker/shopping-recipies-events/commit/b8d07ebe48546dd7b79846948d4d49e15e5cfbf9))
* migration 028 makes find_user_by_email p_list_id optional ([a826972](https://github.com/sivanbecker/shopping-recipies-events/commit/a826972562738a1e9f60d135774d9c6eb8a669cb))
* recipe features — unit selection, ingredient checklist, tools from DB ([8a30926](https://github.com/sivanbecker/shopping-recipies-events/commit/8a30926994bde34d11694deea82e230fd8e931cf))
* remove ReactQueryDevtools floating button ([#20](https://github.com/sivanbecker/shopping-recipies-events/issues/20)) ([d44f9f3](https://github.com/sivanbecker/shopping-recipies-events/commit/d44f9f38881f1b71e3bb8a1776fdbff047b03c0d))
* resolve RLS infinite recursion on list_members and shopping_lists ([04a7e1b](https://github.com/sivanbecker/shopping-recipies-events/commit/04a7e1b69eee80422169d1f5679a3792119aa149))
* resolve TypeScript build errors blocking Vercel deploy ([6ca2a1a](https://github.com/sivanbecker/shopping-recipies-events/commit/6ca2a1a512348664066f7d82c486d19ebeb58cb0))
* resolve TypeScript build errors blocking Vercel deploy ([54989af](https://github.com/sivanbecker/shopping-recipies-events/commit/54989aff099de7931b4e17a7e0c52e05f68120f1))
* resolve Web Speech API TypeScript build errors ([544f471](https://github.com/sivanbecker/shopping-recipies-events/commit/544f471204a9057ff606b5f7c63e13233d414034))
* show shared lists on the lists overview page ([d7e8421](https://github.com/sivanbecker/shopping-recipies-events/commit/d7e8421bdd877ed8615757661cf386155e614f45))
* simplify ProductDialog voice to match list search impl ([15801e1](https://github.com/sivanbecker/shopping-recipies-events/commit/15801e124eb5701648fab6484c218f1c87280ff2))
* simplify ProductDialog voice to match list search impl ([4933dbc](https://github.com/sivanbecker/shopping-recipies-events/commit/4933dbc822a6d21f294b066b215071e6e40fe40b))
* simplify unit selection in IngredientRow and remove unused shopping unit section ([74d6699](https://github.com/sivanbecker/shopping-recipies-events/commit/74d6699b3257ee575e8fa1c09986b9ca90000228))
* update Playwright browser installation and improve visibility check in auth tests ([4b86953](https://github.com/sivanbecker/shopping-recipies-events/commit/4b86953856f8bbb15fdc98ca2ac55ed40497bbca))
* update recipe feature details and improve unit selection logic ([b319307](https://github.com/sivanbecker/shopping-recipies-events/commit/b319307fd8379962e39193de1dc9db6488c06cdd))
* update supabase client initialization to use logical OR for fallback values and add vite-env.d.ts for type references ([28ea71c](https://github.com/sivanbecker/shopping-recipies-events/commit/28ea71cceba14af36cace03747d7ebabf215b775))
* update unit selection in RecipeDetailPage and RecipeFormPage to use unit_id ([ed2557d](https://github.com/sivanbecker/shopping-recipies-events/commit/ed2557dd9fc3de5c74371734e69650a2ffce5ea4))
* wrap AuthPage smoke test in AuthProvider ([5460677](https://github.com/sivanbecker/shopping-recipies-events/commit/54606772d151b11a57ee35c389c860f13f9c459c))


### Performance

* batch list members query to fix N+1 on ListsPage ([73ed951](https://github.com/sivanbecker/shopping-recipies-events/commit/73ed951dc58695552cbfebf1f92f3c136f2f7d1a))
* batch list members query to fix N+1 on ListsPage ([3aefcd8](https://github.com/sivanbecker/shopping-recipies-events/commit/3aefcd87a789335069fff9b5e85b7c611633a146))
* memoize derived state and debounce search inputs ([18265af](https://github.com/sivanbecker/shopping-recipies-events/commit/18265afbb207feb7dad84b6a4c64d12dace820eb))
* memoize derived state and debounce search inputs (PR 1 of 5) ([a4714ad](https://github.com/sivanbecker/shopping-recipies-events/commit/a4714ad13ae04a90f43bff32e50ebb49d4883525))
* optimistic toggle for shopping item checks ([7bb47e4](https://github.com/sivanbecker/shopping-recipies-events/commit/7bb47e4f940ec5781721c62d68a616715f787f4b))
* optimistic toggle for shopping item checks ([9aa179b](https://github.com/sivanbecker/shopping-recipies-events/commit/9aa179bd5a4609de2d3ea624c94c4b370d0add21))


### Refactors

* clean up code formatting and remove unnecessary line breaks in ProductsPage ([0091d7d](https://github.com/sivanbecker/shopping-recipies-events/commit/0091d7d219866dec192ac78eacbd280462c61345))
* format ItemRow and ProductsPage for improved readability ([afb285c](https://github.com/sivanbecker/shopping-recipies-events/commit/afb285c55b3764c2da006b841c977a0c05681659))
* replace hardcoded values with constants in auth tests ([1d76231](https://github.com/sivanbecker/shopping-recipies-events/commit/1d76231b85acebacffe2e8703f9c297aadb11982))
* simplify error message formatting in auth tests and improve link formatting in detail pages ([f253193](https://github.com/sivanbecker/shopping-recipies-events/commit/f253193a839515ba32b01ad1288f4e42a427c2d7))


### Documentation

* add background options reference image ([f77548b](https://github.com/sivanbecker/shopping-recipies-events/commit/f77548bac10cb7c2f0a0a0bc16478ac9ea617b09))
* add BRAINDUMP.md ([ca6c941](https://github.com/sivanbecker/shopping-recipies-events/commit/ca6c9416c37406ebd989431ad943ebe01654b61b))
* add BRAINDUMP.md with feature ideas and planning notes ([3d127a7](https://github.com/sivanbecker/shopping-recipies-events/commit/3d127a7db0e19e866cbd83078e547c405d32c347))
* add model usage instructions for branching and quality gates ([491b6d5](https://github.com/sivanbecker/shopping-recipies-events/commit/491b6d551d0a3179bc7571ecddbe11249fe70058))
* add model usage instructions for branching and quality gates ([804674b](https://github.com/sivanbecker/shopping-recipies-events/commit/804674b46e24ff1bf29e970785f7de24e8e015c2))
* add secrets rotation guide with redacted slugs ([0973c34](https://github.com/sivanbecker/shopping-recipies-events/commit/0973c3446a542fc60f703ff50fef8612d4b6ad4a))
* add secrets rotation guide with redacted slugs ([bdedeb4](https://github.com/sivanbecker/shopping-recipies-events/commit/bdedeb469f7507552fa4a63e7fca89eb024eb078))
* add Stage 4.5 avatar plan and update 4.2 with Broadcast solution ([aea3a49](https://github.com/sivanbecker/shopping-recipies-events/commit/aea3a49b591e9a20c01c822545c50dd92b35278b))
* add Stage 4.6 to PROJECT_PLAN.md ([1343b8a](https://github.com/sivanbecker/shopping-recipies-events/commit/1343b8a63748c0ba1b3c55a39a2ad1dd7e2d504d))
* add Stage 5 completion notes and known unit mismatch issue ([bb34635](https://github.com/sivanbecker/shopping-recipies-events/commit/bb34635784129bbb9a979ef956b624fffbf14e37))
* add task 2.7 — add product to shopping list from products page ([02e15cc](https://github.com/sivanbecker/shopping-recipies-events/commit/02e15cc37ffbdb952345aff93b4661f3c0fde580))
* add task 7.6 — app background theme picker ([d2e0458](https://github.com/sivanbecker/shopping-recipies-events/commit/d2e0458e53abf4954ca694ebeffdffbab5700ee2))
* add task 7.6 — app background theme picker to project plan ([c7562c0](https://github.com/sivanbecker/shopping-recipies-events/commit/c7562c0f647ef6298b11b1eb6b2a38779b66e1fe))
* decide on approach (3) for product sharing in shared lists ([0c07cc0](https://github.com/sivanbecker/shopping-recipies-events/commit/0c07cc03e5ae1dd9fcf24c7eef40a2529abb0b70))
* document product sharing design decision for shared lists ([0348ae2](https://github.com/sivanbecker/shopping-recipies-events/commit/0348ae230fd8f37d068d5592d9d512b79cbca5ec))
* mark dark mode as complete in PROGRESS.md ([5f97bc7](https://github.com/sivanbecker/shopping-recipies-events/commit/5f97bc7f52f95ac10560524fd353f59e0d512671))
* mark stage 3.5 clone as complete in PROGRESS.md ([cd6c561](https://github.com/sivanbecker/shopping-recipies-events/commit/cd6c5619d1371e1abe3c44cbc7ec701be59e74f1))
* mark stage 3.6 as complete in PROGRESS.md ([d492d84](https://github.com/sivanbecker/shopping-recipies-events/commit/d492d84fccb729482b3dee20a273eaed17b6c8a0))
* mark stage 3.7 as complete in PROGRESS.md ([8bd92d3](https://github.com/sivanbecker/shopping-recipies-events/commit/8bd92d34af2cc46fcece23b76ffb5850f101c8df))
* mark stage 4.1 as complete in PROGRESS.md ([8ab8473](https://github.com/sivanbecker/shopping-recipies-events/commit/8ab8473ca054398779057165b5058d6e39e10e70))
* mark stage 4.2 as complete in PROGRESS.md ([52ef17b](https://github.com/sivanbecker/shopping-recipies-events/commit/52ef17bb194e4e05216f92b8e6709e7380a007d3))
* note migrations 020 and 021 in PROGRESS.md ([640a00c](https://github.com/sivanbecker/shopping-recipies-events/commit/640a00cc5dd5ae4d541cd7488824eb9de349b5a1))
* plan contacts enhancements — labels, account linking, contact-based sharing ([3f67811](https://github.com/sivanbecker/shopping-recipies-events/commit/3f67811757dbc17c6db52d2940a22a8f2928f14c))
* prohibit Claude attribution lines in PR descriptions ([a865a5c](https://github.com/sivanbecker/shopping-recipies-events/commit/a865a5ced1eb0c117cc84a2d659293b0096bcbd5))
* sync PROGRESS.md and PROJECT_PLAN.md with recent work ([#82](https://github.com/sivanbecker/shopping-recipies-events/issues/82)) ([6c00bac](https://github.com/sivanbecker/shopping-recipies-events/commit/6c00bac637504ee2e19897b234b42e1cab7eea3b))
* update PROGRESS with 4.2 status, open Realtime bug, and 4.x decision ([d7676ae](https://github.com/sivanbecker/shopping-recipies-events/commit/d7676ae9416c94cfa1ea95607c567c9b6bb2d9c0))
* update PROGRESS.md — replace Missing Tests sections with what was added ([ab83906](https://github.com/sivanbecker/shopping-recipies-events/commit/ab83906976b1e398d259ce0c676c876bfc0edbea))
* update PROGRESS.md for stage 6.1 — events CRUD + contacts ([1891df5](https://github.com/sivanbecker/shopping-recipies-events/commit/1891df5c4d72af7df86219b9d1ee18744e49a37b))
* update PROGRESS.md with CI build job addition ([35afbc6](https://github.com/sivanbecker/shopping-recipies-events/commit/35afbc6231c8035c915124228d6217608b60dd55))
* update PROGRESS.md with CI build job and recipe fixes ([22ff8eb](https://github.com/sivanbecker/shopping-recipies-events/commit/22ff8eb235078b614d19da04030bce21f50c5ea0))
* update PROGRESS.md with Google profile picture feature ([6569f84](https://github.com/sivanbecker/shopping-recipies-events/commit/6569f847840a00a49321c34597e3aed6a88a1813))
* update PROGRESS.md with Stage 1.5 Google OAuth ([dbd3b07](https://github.com/sivanbecker/shopping-recipies-events/commit/dbd3b07bf807e9bb7d186b388df110adc0fa6eae))
* update PROGRESS.md with Stage 4.x and 4.6 completion ([f26e9a0](https://github.com/sivanbecker/shopping-recipies-events/commit/f26e9a03c50fe1690072b602c657a37662543532))
* update PROGRESS.md with stage 6.7 + 4.7 contacts enhancements ([bcce63b](https://github.com/sivanbecker/shopping-recipies-events/commit/bcce63b2d43f9e01d3c0c24e92e626b7a65fa526))

## [0.9.0] - 2026-04-22

Initial tagged release. Covers all work merged to `main` through Stage 9 (Events Enhancements) and the first three PRs of Stage 10 (Performance Optimization).

### Stage 0 — Scaffolding & Infrastructure

- Vite + React 18 + TypeScript project bootstrap with strict mode and `@/` path alias.
- Tailwind CSS + shadcn/ui base components; Rubik font; brand color tokens.
- React Router v6 with placeholder routes and `ProtectedRoute` wrapper.
- i18next setup with Hebrew and English locales; dynamic `dir`/`lang` switching and RTL support.
- Supabase client singleton; Row Level Security enabled from day one.
- TanStack Query v5 + Zustand store skeleton.
- Vitest + Testing Library + Playwright; GitHub Actions CI (lint, format, tests, build, E2E, Trivy/Snyk security scans).
- Vercel deployment with preview URLs per branch.

### Stage 1 — Authentication & User Profiles

- `profiles` table with auto-create trigger on `auth.users` insert.
- Login / Register pages with Zod validation, Supabase Auth integration, and Toast feedback.
- `AuthProvider`, `useAuth` hook, protected routes.
- Profile page with editable display name, language preference, and sign-out.
- Forgot password flow via `resetPasswordForEmail`.

### Stage 1.5 — Social Login

- Google OAuth provider via Supabase with "Continue with Google" button on the auth page.

### Stage 2 — Products Catalog

- `categories`, `unit_types`, `products` tables with seed data for common Israeli supermarket items.
- Products page: grid grouped by category, live search, category filter chips, add/edit/delete dialogs.
- Shared vs. personal products (`is_shared` flag).
- Bulk import from CSV / JSON with upsert-on-duplicate and a per-row result summary dialog; skipped rows downloadable for re-import.
- AI auto-suggest (`suggest-product` edge function, Gemini Flash) to fill English name, category, and default unit from a Hebrew product name.
- "Add to list" quick flow from product cards.

### Stage 3 — Shopping Lists Core

- `shopping_lists`, `list_members`, `shopping_items` tables with RLS by role.
- Lists overview with active + archived sections, FAB, create/archive/clone/delete.
- List detail page: inline-editable name, categorised items, check/uncheck, quantity stepper/free input, unit picker grouped by type.
- "Missing Items" auto-created quick-add flow and convert-to-list.
- Shopping Mode with large touch targets and progress bar.

### Stage 4 — Real-time Sharing

- Share dialog with email lookup and member management (owner/editor/viewer roles).
- Supabase Realtime subscriptions for `shopping_items` and `shopping_lists` with a broadcast-based fallback to work around the walrus RLS context issue.
- Deterministic generated avatars via `boring-avatars`; `UserAvatar` and `AvatarStack` components.
- Avatar stack on list cards, list detail header, and profile page; per-item "added by" avatar in list rows.
- Contact-based sharing suggestions via `ContactPicker`.
- Global `auto_share_products` profile toggle (design decision 4.x).

### Stage 5 — Recipes

- `recipes`, `recipe_ingredients`, `recipe_steps` tables; substitute groups.
- Recipes list + detail pages with tool icons, servings scaler, and substitute markers.
- Recipe create/edit form with ingredient builder, substitutes, notes, and reorderable steps.
- Add-to-list flow per ingredient or bulk, with merge prompts for items already in the target list.

### Stage 6 — Events

- Events tables, list, and detail page with countdown, guests, checklist, recipes, and shopping tabs.
- Guest transport logistics, "brings" field, confirmation toggle.
- Combined shopping list generator from attached recipes (servings-aware, duplicate-merging).
- Host equipment inventory on Profile with inline "You have X" deduction on the Equipment tab.
- Contacts: Family / Friend label, optional email with `linked_user_id` lookup, filter chips.

### Stage 9 — Events Enhancements

- **9.1** — Photo album chip on event cards (PR #79).
- **9.2** — Event sharing mirroring lists: `ShareEventDialog`, `useEventRole`, `AvatarStack`, RLS for event children (migration 032), contact picker integration (PR #81).
- **9.4** — Event comments drawer with realtime subscription and post-mortem editor gated on past events (`event_comments` table, migrations 030 + 031) (PR #80).

### Stage 10 — Performance Optimization (partial)

- **10.1** — React quick wins: `useMemo` for derived state, `useDebounce` hook for search inputs, memoized `AvatarStack` (PR #76).
- **10.2** — Optimistic toggle for shopping items with rollback on error (PR #77).
- **10.3** — N+1 fix on Lists page via `get_all_list_members_for_user()` RPC (migration 029, PR #78).

[0.9.0]: https://github.com/sivanbecker/shopping-recipes-events/releases/tag/v0.9.0
