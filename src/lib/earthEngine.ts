import ee from '@google/earthengine';
import * as fs from 'fs';
import { childLogger } from '../utils/logger.js';

const logger = childLogger('earthengine');

let eeInitialized = false;
let eeAvailable = false;

export async function initializeEarthEngine(): Promise<void> {
  if (eeInitialized) {
    return;
  }

  eeInitialized = true;

  return new Promise((resolve) => {
    try {
      const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

      if (!credentialsPath) {
        logger.warn('⚠️ GOOGLE_APPLICATION_CREDENTIALS not set - using fallback mode');
        eeAvailable = false;
        resolve();
        return;
      }

      if (!fs.existsSync(credentialsPath)) {
        logger.warn(`⚠️ Credentials file not found at ${credentialsPath} - using fallback mode`);
        eeAvailable = false;
        resolve();
        return;
      }

      // Read and parse service account credentials
      const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf-8'));

      logger.info('Authenticating with Earth Engine using service account...');

      ee.data.authenticateViaPrivateKey(
        credentials,
        () => {
          logger.info('Auth successful, initializing Earth Engine...');
          (ee.initialize as any)(
            null,
            null,
            () => {
              eeAvailable = true;
              logger.info('✅ Earth Engine initialized successfully');
              resolve();
            },
            (initErr: any) => {
              logger.warn(
                { err: String(initErr) },
                '⚠️ Earth Engine initialize() failed - using fallback mode',
              );
              eeAvailable = false;
              resolve();
            },
          );
        },
        (authErr: any) => {
          logger.warn(
            { err: String(authErr) },
            '⚠️ Earth Engine auth failed - using fallback mode',
          );
          eeAvailable = false;
          resolve();
        },
      );

      // Set timeout for initialization
      setTimeout(() => {
        if (!eeAvailable) {
          logger.warn('⚠️ Earth Engine initialization timeout - using fallback mode');
          resolve();
        }
      }, 30000);
    } catch (error) {
      logger.warn(
        { err: error instanceof Error ? error.message : String(error) },
        '⚠️ Earth Engine initialization failed, using fallback',
      );
      eeAvailable = false;
      resolve();
    }
  });
}

// Fallback mock data generator
function generateMockSatelliteData(region: { name: string; bounds: number[][] }): {
  imageUrl: string;
  anomalyScore: number;
  timestamp: Date;
  metadata: any;
} {
  // Generate realistic anomaly scores
  const baseScore = Math.random() * 0.4; // Most readings 0-0.4 (normal)
  const anomalyScore = Math.random() > 0.85 ? Math.random() * 1 : baseScore; // 15% chance of anomaly

  // Generate a SAR-like placeholder SVG with terrain patterns unique to each region
  const seed = region.name.length * 7;
  const hue = (seed * 37) % 360;
  const anomalyColor = anomalyScore > 0.7 ? '#ef4444' : anomalyScore > 0.3 ? '#eab308' : '#22c55e';
  const anomalyLabel =
    anomalyScore > 0.7 ? 'ANOMALY DETECTED' : anomalyScore > 0.3 ? 'ELEVATED' : 'NORMAL';
  const bounds = region.bounds;
  const centerLon = ((bounds[0][0] + bounds[1][0]) / 2).toFixed(1);
  const centerLat = ((bounds[0][1] + bounds[1][1]) / 2).toFixed(1);
  const ts = new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC';

  // Build noise rectangles to simulate terrain texture
  let noiseRects = '';
  for (let i = 0; i < 80; i++) {
    const x = (i * 73 + seed) % 600;
    const y = (i * 47 + seed * 3) % 400;
    const w = 20 + ((i * 13) % 60);
    const h = 10 + ((i * 11) % 40);
    const lightness = 15 + ((i * 7) % 25);
    noiseRects += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="hsl(${hue},${10 + (i % 15)}%,${lightness}%)" opacity="${0.3 + (i % 5) * 0.1}"/>`;
  }

  const svg = `<svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:hsl(${hue},20%,12%)"/>
      <stop offset="50%" style="stop-color:hsl(${hue},15%,18%)"/>
      <stop offset="100%" style="stop-color:hsl(${hue},20%,14%)"/>
    </linearGradient>
    <linearGradient id="scanline" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" style="stop-color:rgba(255,255,255,0.03)"/>
      <stop offset="50%" style="stop-color:rgba(255,255,255,0)"/>
      <stop offset="100%" style="stop-color:rgba(255,255,255,0.03)"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#bg)"/>
  ${noiseRects}
  <!-- Scan lines -->
  ${Array.from({ length: 30 }, (_, i) => `<rect x="0" y="${i * 20}" width="800" height="1" fill="rgba(255,255,255,0.04)"/>`).join('')}
  <!-- Grid overlay -->
  <line x1="400" y1="0" x2="400" y2="600" stroke="rgba(255,255,255,0.08)" stroke-dasharray="4,8"/>
  <line x1="0" y1="300" x2="800" y2="300" stroke="rgba(255,255,255,0.08)" stroke-dasharray="4,8"/>
  <!-- Region label -->
  <rect x="16" y="16" width="350" height="90" rx="6" fill="rgba(0,0,0,0.6)"/>
  <text x="28" y="42" font-family="monospace" font-size="14" fill="#94a3b8">SENTINEL-1 SAR · VV BAND</text>
  <text x="28" y="64" font-family="Arial,sans-serif" font-size="18" fill="white" font-weight="bold">${region.name}</text>
  <text x="28" y="88" font-family="monospace" font-size="12" fill="#94a3b8">${centerLat}°N ${centerLon}°E · ${ts}</text>
  <!-- Anomaly indicator -->
  <rect x="584" y="16" width="200" height="46" rx="6" fill="rgba(0,0,0,0.6)"/>
  <circle cx="604" cy="39" r="6" fill="${anomalyColor}"/>
  <text x="618" y="34" font-family="monospace" font-size="11" fill="#94a3b8">ANOMALY</text>
  <text x="618" y="50" font-family="monospace" font-size="13" fill="${anomalyColor}" font-weight="bold">${(anomalyScore * 100).toFixed(1)}% ${anomalyLabel}</text>
  <!-- Bottom bar -->
  <rect x="0" y="564" width="800" height="36" fill="rgba(0,0,0,0.5)"/>
  <text x="16" y="586" font-family="monospace" font-size="11" fill="#64748b">MODE: IW · RES: 10m · POLARIZATION: VV · SOURCE: Simulated (Earth Engine Fallback)</text>
</svg>`;

  const svgBase64 = Buffer.from(svg).toString('base64');

  return {
    imageUrl: `data:image/svg+xml;base64,${svgBase64}`,
    anomalyScore: Math.round(anomalyScore * 100) / 100,
    timestamp: new Date(),
    metadata: {
      satellite: 'Sentinel-1 (Simulated)',
      sensor: 'SAR (Synthetic Aperture Radar)',
      resolution: '10m',
      band: 'VV (Vertical-Vertical Polarization)',
      mode: 'IW (Interferometric Wide swath)',
      region: region.name,
      dataSource: 'Fallback Mode',
    },
  };
}

export async function fetchSatelliteImage(region: { name: string; bounds: number[][] }): Promise<{
  imageUrl: string;
  anomalyScore: number;
  timestamp: Date;
  metadata: any;
}> {
  await initializeEarthEngine();

  try {
    logger.info(`📡 Fetching satellite data for: ${region.name}`);

    if (!eeAvailable) {
      logger.info(`⚠️ Using fallback data for ${region.name}`);
      return generateMockSatelliteData(region);
    }

    // Create polygon geometry from bounds [[minLon, minLat], [maxLon, maxLat]]
    const coords = [
      [region.bounds[0][0], region.bounds[0][1]],
      [region.bounds[1][0], region.bounds[0][1]],
      [region.bounds[1][0], region.bounds[1][1]],
      [region.bounds[0][0], region.bounds[1][1]],
    ];

    const geometry = (ee.Geometry as any).Polygon([coords]);

    // Use dynamic date range: last 30 days for recent, last 6 months for baseline
    const now = new Date();
    const recentEnd = now.toISOString().split('T')[0];
    const recentStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];
    const baselineStart = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];

    // Load Sentinel-1 SAR imagery (C-band, works in all weather conditions)
    const sentinel1 = (ee as any)
      .ImageCollection('COPERNICUS/S1_GRD')
      .filterBounds(geometry)
      .filterDate(recentStart, recentEnd)
      .filter((ee.Filter as any).eq('instrumentMode', 'IW'))
      .select('VV');

    // Check if data exists
    const imageCount = sentinel1.size().getInfo();
    if (imageCount === 0) {
      logger.info(`No Earth Engine data found for ${region.name}, using fallback`);
      return generateMockSatelliteData(region);
    }

    logger.info(`Found ${imageCount} Sentinel-1 images for ${region.name}`);

    // Get the most recent image
    const latestImage = sentinel1.sort('system:time_start', false).first();

    // Calculate baseline (historical median over 6 months)
    const baseline = (ee as any)
      .ImageCollection('COPERNICUS/S1_GRD')
      .filterBounds(geometry)
      .filterDate(baselineStart, recentStart)
      .filter((ee.Filter as any).eq('instrumentMode', 'IW'))
      .select('VV')
      .median();

    // Calculate anomaly as deviation from baseline
    const anomaly = latestImage
      .subtract(baseline)
      .abs()
      .reduceRegion({
        reducer: (ee.Reducer as any).mean(),
        geometry: geometry,
        scale: 1000,
      });

    // Visualization parameters for SAR backscatter
    const visParams = {
      bands: ['VV'],
      min: -25,
      max: 0,
      palette: [
        '#000004',
        '#1b0c41',
        '#4a0c6b',
        '#781c6d',
        '#a52c60',
        '#cf4446',
        '#ed6925',
        '#fb9b06',
        '#f7d13d',
        '#fcffa4',
      ],
    };

    // Generate a static thumbnail URL (works in <img> tags unlike tile URLs)
    const thumbUrl: string = await new Promise((resolveThumb, rejectThumb) => {
      latestImage.visualize(visParams).getThumbURL(
        {
          region: geometry,
          dimensions: '800x600',
          format: 'png',
        },
        (url: string, err: any) => {
          if (err) rejectThumb(err);
          else resolveThumb(url);
        },
      );
    });

    // Get anomaly value and normalize
    const anomalyValue = anomaly.getInfo();
    const rawScore = Math.abs((anomalyValue?.VV || 0) / 10);
    const normalizedScore = Math.min(1, rawScore);

    logger.info(
      `✅ ${region.name}: Anomaly Score = ${(normalizedScore * 100).toFixed(2)}%, thumb URL generated`,
    );

    return {
      imageUrl: thumbUrl,
      anomalyScore: Math.round(normalizedScore * 100) / 100,
      timestamp: new Date(),
      metadata: {
        satellite: 'Sentinel-1',
        sensor: 'SAR (Synthetic Aperture Radar)',
        resolution: '10m',
        band: 'VV (Vertical-Vertical Polarization)',
        mode: 'IW (Interferometric Wide swath)',
        region: region.name,
        dataSource: 'Google Earth Engine',
        imageCount,
      },
    };
  } catch (error) {
    logger.error(`❌ Error fetching ${region.name}:`, error);
    logger.info(`⚠️ Falling back to mock data for ${region.name}`);
    return generateMockSatelliteData(region);
  }
}

export async function fetchMultipleRegions(
  regions: Array<{ name: string; bounds: number[][] }>,
): Promise<
  Array<{
    region: string;
    imageUrl: string;
    anomalyScore: number;
    timestamp: Date;
    metadata: any;
  }>
> {
  const results = await Promise.allSettled(regions.map((region) => fetchSatelliteImage(region)));

  const successful = results
    .map((result, index) => {
      if (result.status === 'fulfilled') {
        return {
          region: regions[index].name,
          ...result.value,
        };
      } else {
        logger.error(
          `Failed to fetch ${regions[index].name}:`,
          (result as PromiseRejectedResult).reason,
        );
        return null;
      }
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);

  logger.info(`✅ Successfully fetched ${successful.length}/${regions.length} regions`);

  return successful;
}
