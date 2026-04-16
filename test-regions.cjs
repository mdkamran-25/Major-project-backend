const ee = require('@google/earthengine');
const fs = require('fs');

const creds = JSON.parse(
  fs.readFileSync(
    '/Users/kamran/Major-Project/credentials/tsunamimvp-99bf1-d327c4c7061c.json',
    'utf8',
  ),
);

const regions = [
  {
    name: 'Alaska Aleutian',
    bounds: [
      [-165, 50],
      [-140, 65],
    ],
  },
  {
    name: 'Indo-Pacific Ring',
    bounds: [
      [90, -10],
      [150, 20],
    ],
  },
  {
    name: 'Japan Trench',
    bounds: [
      [130, 30],
      [145, 45],
    ],
  },
  {
    name: 'Peru-Chile Trench',
    bounds: [
      [-77, -45],
      [-70, -5],
    ],
  },
];

console.log('Authenticating...');
ee.data.authenticateViaPrivateKey(
  creds,
  () => {
    ee.initialize(
      null,
      null,
      () => {
        console.log('EE initialized');

        const region = regions[0]; // Test Alaska Aleutian
        console.log(`Testing ${region.name}...`);

        const coords = [
          [region.bounds[0][0], region.bounds[0][1]],
          [region.bounds[1][0], region.bounds[0][1]],
          [region.bounds[1][0], region.bounds[1][1]],
          [region.bounds[0][0], region.bounds[1][1]],
        ];
        const geometry = ee.Geometry.Polygon([coords]);

        const now = new Date();
        const recentEnd = now.toISOString().split('T')[0];
        const recentStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0];

        console.log(`Date range: ${recentStart} to ${recentEnd}`);

        const sentinel1 = ee
          .ImageCollection('COPERNICUS/S1_GRD')
          .filterBounds(geometry)
          .filterDate(recentStart, recentEnd)
          .filter(ee.Filter.eq('instrumentMode', 'IW'))
          .select('VV');

        const count = sentinel1.size().getInfo();
        console.log(`Image count: ${count}`);

        if (count > 0) {
          const img = sentinel1.sort('system:time_start', false).first();
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
          console.log('Getting thumb URL...');
          img
            .visualize(visParams)
            .getThumbURL({ region: geometry, dimensions: '800x600', format: 'png' }, (url, err) => {
              if (err) console.log('ERROR:', err);
              else console.log('URL:', url.substring(0, 80) + '...');
              process.exit(0);
            });
        } else {
          console.log('No images found');
          process.exit(0);
        }
      },
      (err) => {
        console.log('Init error:', err);
        process.exit(1);
      },
    );
  },
  (err) => {
    console.log('Auth error:', err);
    process.exit(1);
  },
);
