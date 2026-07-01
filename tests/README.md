# Picture-in-Picture Plugin – Automated Tests

End-to-end tests for the **Picture-in-Picture Plugin** written with [Playwright](https://playwright.dev/).
The shared test infrastructure lives inside `tests/core/` and mirrors the layout used by the other
BigBlueButton plugins.

Unit tests (vitest) live under `tests/unit/` and are documented separately – run them with
`npm run test:unit`. Playwright ignores that folder (`testIgnore`).

---

## Test scenarios

### Structural (`tests/structural/test.spec.ts`)

Verify that the plugin registers its action-button dropdown item with the correct label and that the
label toggles between "Activate PiP Window" and "Deactivate PiP Window" when clicked.

### Behavioural – single user (`tests/behavioral/single-user.spec.ts`)

Verify the toggle workflow and the localStorage persistence of the active state using only the
moderator/presenter.

### Behavioural – multi-user (`tests/behavioral/multi-user.spec.ts`)

Verify that the dropdown toggle is available independently for a moderator and an attendee in the same
meeting.

> **Note on the PiP window contents.** The plugin renders its grid inside a `documentPictureInPicture`
> window, which is a separate top-level window that Playwright does not reliably expose as a `Page` in
> headless Chromium. Assertions that require reaching *inside* that window are guarded and skipped with a
> documented reason when the window is not reachable, rather than reported as a false pass.

---

## How to run the tests

### 1 – Install dependencies

From the **plugin root**:

```bash
npm install
npx playwright install --with-deps chromium
```

### 2 – Configure environment variables

```bash
cp .env.template .env
# edit .env and set BBB_URL and BBB_SECRET
```

| Variable | Required | Description |
|----------|----------|-------------|
| `BBB_URL` | **yes** | Full API URL, e.g. `https://bbb.example.com/bigbluebutton/` |
| `BBB_SECRET` | **yes** | Shared secret of the BBB server |
| `PICTURE_IN_PICTURE_PLUGIN_URL` | no | Direct URL to `manifest.json`; auto-detected from the server otherwise |
| `LOCAL_CONTAINER_NAME` | no | Docker container name for the local deployment script |
| `TIMEOUT_MULTIPLIER` | no | Multiply all timeouts (default 1 locally, 2 in CI) |
| `CI` | no | `"true"` enables CI reporter and single-worker mode |
| `TEST_MEETINGS` | no | Set to `"isolated"` to give each test its own meeting (see [Meeting isolation](#meeting-isolation)) |

### 3 – Build and deploy the plugin

```bash
npm run build-bundle
```

Then serve the plugin so the target BBB server can access it. To deploy into a local BBB Docker
container:

```bash
npm run publish-plugin:dev
```

---

## Meeting isolation

By default every test suite (`test.describe` block) shares **one BBB meeting** for all its tests — the
meeting is created once in `beforeAll` and torn down in `afterAll`. This is fast but tests within a suite
depend on the cleanup performed between them.

Setting `TEST_MEETINGS=isolated` switches every suite to **one meeting per test**: the meeting is created
in `beforeEach` and destroyed in `afterEach`. Tests become fully independent at the cost of more setups.

| Mode | Meetings created | Tests run | When to use |
|------|-----------------|-----------|-------------|
| default (`npm test`) | one per suite | serially within each suite | Normal development |
| isolated (`npm run test:isolated`) | one per test | can run in parallel | Debugging flaky state, CI full isolation |

---

## Running the tests

```bash
# All suites – shared meetings (default)
npm test

# All suites – one meeting per test
npm run test:isolated

# Only structural tests
npm test -- tests/structural

# Only behavioural tests
npm test -- tests/behavioral

# A single test by name
npm test -- -g "toggle"

# View the HTML report after a run
npx playwright show-report
```

---

## Test output

| Artifact | Location |
|----------|----------|
| HTML report | `playwright-report/index.html` |
| Traces | Attached to every test in the HTML report |
| Screenshots | Captured for every test |
| Video | Every test locally; failure-only in CI |
