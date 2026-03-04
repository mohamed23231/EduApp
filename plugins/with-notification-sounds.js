/**
 * with-notification-sounds.js
 *
 * Expo config plugin that copies custom notification sound files
 * into android/app/src/main/res/raw/ during prebuild.
 *
 * Android reads notification sounds from res/raw/ by filename.
 * The channel setup in push-notification-handler.ts references these filenames.
 */

const { withDangerousMod } = require('@expo/config-plugins');
const fs   = require('fs');
const path = require('path');

const SOUNDS = [
  'absence_alert.wav',
  'low_performance_alert.wav',
];

module.exports = function withNotificationSounds(config) {
  return withDangerousMod(config, [
    'android',
    (dangerousConfig) => {
      const rawDir = path.join(
        dangerousConfig.modRequest.platformProjectRoot,
        'app', 'src', 'main', 'res', 'raw',
      );
      fs.mkdirSync(rawDir, { recursive: true });

      for (const sound of SOUNDS) {
        const src  = path.join(dangerousConfig.modRequest.projectRoot, 'assets', 'sounds', sound);
        const dest = path.join(rawDir, sound);

        if (!fs.existsSync(src)) {
          console.warn(`[with-notification-sounds] Missing sound file: ${src}`);
          continue;
        }

        fs.copyFileSync(src, dest);
        console.log(`[with-notification-sounds] Copied ${sound} → android res/raw/`);
      }

      return dangerousConfig;
    },
  ]);
};
