const ee = require('@google/earthengine');
const fs = require('fs');

const creds = JSON.parse(
  fs.readFileSync(
    '/Users/kamran/Major-Project/credentials/tsunamimvp-99bf1-d327c4c7061c.json',
    'utf8',
  ),
);

console.log('Authenticating...');
ee.data.authenticateViaPrivateKey(
  creds,
  () => {
    console.log('Auth OK, initializing...');
    ee.initialize(
      null,
      null,
      () => {
        console.log('EE initialized!');
        const geom = ee.Geometry.Rectangle([-126, 46, -124, 48]);
        const col = ee
          .ImageCollection('COPERNICUS/S1_GRD')
          .filterBounds(geom)
          .filterDate('2025-01-01', '2025-06-01')
          .filter(ee.Filter.eq('instrumentMode', 'IW'))
          .select('VV');
        const count = col.size().getInfo();
        console.log('Image count:', count);
        if (count > 0) {
          const img = col.sort('system:time_start', false).first();
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
          img
            .visualize(visParams)
            .getThumbURL({ region: geom, dimensions: '800x600', format: 'png' }, (url, err) => {
              if (err) {
                console.log('THUMB ERROR:', err);
                process.exit(1);
              } else {
                console.log('THUMB URL:', url);
                process.exit(0);
              }
            });
        } else {
          console.log('No images found');
          process.exit(1);
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
