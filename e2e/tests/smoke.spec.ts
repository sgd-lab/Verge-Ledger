import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Real end-to-end flows against the production static build served by the
 * playwright webServer (see playwright.config.ts at the repo root).
 *
 * Every test gets a fresh browser context, hence a fresh IndexedDB, so
 * flows that need recorded data run the survey flow first in the same
 * test rather than depending on another test's state.
 *
 * Axe checks fail only on serious or critical violations, matching the
 * brief; moderate/minor findings are reported by axe but do not fail.
 */

async function axeCheck(page: Page, url: string): Promise<void> {
  await page.goto(url);
  await expect(page.locator('main')).toBeVisible();
  const results = await new AxeBuilder({ page }).analyze();
  const blocking = results.violations.filter(
    (v) => v.impact === 'serious' || v.impact === 'critical',
  );
  expect(
    blocking,
    `axe serious/critical violations on ${url}: ${JSON.stringify(blocking, null, 2)}`,
  ).toEqual([]);
}

async function runSurvey(page: Page): Promise<void> {
  await page.goto('/survey');
  const acknowledge = page.getByRole('button', { name: /I understand/i });
  if (await acknowledge.isVisible()) {
    await acknowledge.click();
  }
  await page.getByRole('button', { name: /Enter coordinates/i }).click();
  await page.getByRole('button', { name: /Add a segment/i }).click();
  await expect(page.getByText(/Manual Coordinate Entry/i)).toBeVisible();
  await page.getByLabel(/Start Latitude/i).fill('51.5074');
  await page.getByLabel(/Start Longitude/i).fill('-0.1278');
  await page.getByLabel(/End Latitude/i).fill('51.508');
  await page.getByLabel(/End Longitude/i).fill('-0.1281');
  await page.getByRole('button', { name: /Confirm Segment Geometry/i }).click();
  await expect(page.getByText(/Geometry confirmed/i)).toBeVisible();
  await page.getByLabel(/Road name \(optional\)/i).fill('Church Lane');
  await page.getByRole('button', { name: /Save segment/i }).click();
  await expect(page.getByText(/Segment saved/i)).toBeVisible();
}

test('survey→score: record a segment and an observation and see a triage score', async ({
  page,
}) => {
  await runSurvey(page);
  await expect(page.getByText(/Add an observation/i)).toBeVisible();
  await page.getByRole('button', { name: /Save observation and score it/i }).click();
  await expect(page.getByText(/Observation saved\. Triage score/i)).toBeVisible();
});

test('advisor: advice is generated for a surveyed verge', async ({ page }) => {
  await runSurvey(page);
  await page.goto('/advisor');
  await expect(page.getByText(/Choose a surveyed verge/i)).toBeVisible();
  await page.getByRole('button', { name: /Use this verge/i }).click();
  await page.getByRole('button', { name: /Get cut-timing advice/i }).click();
  await expect(page.getByText(/Recommended regime/i)).toBeVisible();
});

test('simulator: a preset run ranks cut-drop options', async ({ page }) => {
  await page.goto('/simulator');
  await page.getByRole('button', { name: /Rural road, two cuts: May, September/i }).click();
  await page.getByRole('button', { name: /Rank cut-drop options/i }).click();
  await expect(page.getByText(/Results —/i)).toBeVisible();
});

test('evidence pack: generate a pack for a surveyed verge', async ({ page }) => {
  await runSurvey(page);
  await page.goto('/export');
  await expect(page.getByText(/What to export/i)).toBeVisible();
  await page.getByRole('button', { name: /Generate evidence pack/i }).click();
  await expect(page.getByText(/Evidence pack generated below/i)).toBeVisible();
  await expect(page.getByLabel(/Evidence pack text/i)).toBeVisible();
});

test('import/export: download GeoJSON, then import a new segment from GeoJSON', async ({
  page,
}) => {
  await runSurvey(page);
  await page.goto('/export');
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: /Download GeoJSON/i }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toContain('geojson');

  const geojson = JSON.stringify({
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: {
          id: '01IMPORTSEGMENT000000001',
          workspaceId: 'import-workspace',
          roadClass: 'C',
          setting: 'rural',
          widthBand: '1_5_to_3',
          side: 'left',
          roadName: 'Imported Lane',
          lengthM: 60,
          isDemo: false,
        },
        geometry: {
          type: 'LineString',
          coordinates: [
            [-0.1278, 51.5074],
            [-0.1281, 51.508],
          ],
        },
      },
    ],
  });
  await page.locator('#import-file').setInputFiles({
    name: 'import.geojson',
    mimeType: 'application/json',
    buffer: Buffer.from(geojson),
  });
  await page.getByRole('button', { name: /Import file/i }).click();
  await expect(page.getByText(/Imported 1 segment\(s\)/i)).toBeVisible();
});

for (const route of [
  '/',
  '/survey',
  '/advisor',
  '/simulator',
  '/councils',
  '/export',
  '/workspaces',
  '/impact',
]) {
  test(`axe: no serious or critical issues on ${route}`, async ({ page }) => {
    await axeCheck(page, route);
  });
}
