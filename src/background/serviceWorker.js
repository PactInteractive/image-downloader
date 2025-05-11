// @ts-check
let isSettingUpRefererRule = false;

async function setupRefererRule(config) {
  if (isSettingUpRefererRule) {
    console.debug(
      `${config.siteName} Referer rule setup already in progress. Skipping.`,
    );
    return;
  }
  isSettingUpRefererRule = true;
  console.debug(`Setting up ${config.siteName} Referer rule...`);

  const extensionId = chrome.runtime.id;

  try {
    const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
    const ruleIdsToRemove = existingRules
      .filter((rule) => rule.id === config.id)
      .map((rule) => rule.id);

    if (ruleIdsToRemove.length > 0) {
      console.debug(
        `Replacing existing Referer rule (ID: ${config.id}) for ${config.siteName}.`,
      );
    }

    chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: ruleIdsToRemove,
      addRules: [
        {
          id: config.id,
          priority: 1,
          action: {
            type: 'modifyHeaders',
            requestHeaders: [
              {
                header: 'Referer',
                operation: 'set',
                value: config.refererUrl,
              },
            ],
            responseHeaders: [
              { header: 'Cross-Origin-Resource-Policy', operation: 'remove' },
              { header: 'Cross-Origin-Embedder-Policy', operation: 'remove' },
              { header: 'Cross-Origin-Opener-Policy', operation: 'remove' },
            ],
          },
          condition: {
            requestDomains: config.requestDomains,
            initiatorDomains: [extensionId],
            resourceTypes: ['image'],
          },
        },
      ],
    });
    console.debug(`${config.siteName} Referer rule updated successfully.`);
  } catch (error) {
    console.error(
      `Failed to update ${config.siteName} Referer rule:`,
      error.message || error,
    );
  } finally {
    isSettingUpRefererRule = false;
  }
}

// Referer rules
const cdnRegions = [
  'ams', // Amsterdam, Netherlands
  'amt', // Amsterdam, Netherlands
  'arn', // Stockholm, Sweden
  'atl', // Atlanta, USA
  'ber', // Berlin, Germany
  'bom', // Mumbai, India
  'bos', // Boston, USA
  'bru', // Brussels, Belgium
  'cai', // Cairo, Egypt
  'cdg', // Paris, France
  'cgh', // São Paulo, Brazil
  'cgk', // Jakarta, Indonesia
  'cph', // Copenhagen, Denmark
  'del', // Delhi, India
  'den', // Denver, USA
  'dft', // Dallas/Fort Worth, USA
  'dfw', // Dallas/Fort Worth, USA
  'dxb', // Dubai, UAE
  'ewr', // Newark, USA
  'eze', // Buenos Aires, Argentina
  'fra', // Frankfurt, Germany
  'frt', // Frankfurt, Germany
  'frx', // Frankfurt, Germany
  'gdl', // Guadalajara, Mexico
  'gru', // São Paulo, Brazil
  'hel', // Helsinki, Finland
  'hkg', // Hong Kong
  'hou', // Houston, USA
  'iad', // Ashburn, USA
  'icn', // Seoul, South Korea
  'jnb', // Johannesburg, South Africa
  'kul', // Kuala Lumpur, Malaysia
  'kut', // Kutaisi, Georgia
  'lax', // Los Angeles, USA
  'lga', // New York, USA
  'lhr', // London, UK
  'lht', // London, UK
  'mad', // Madrid, Spain
  'mel', // Melbourne, Australia
  'mia', // Miami, USA
  'mrs', // Marseille, France
  'msp', // Minneapolis, USA
  'mxp', // Milan, Italy
  'nrt', // Tokyo, Japan
  'ord', // Chicago, USA
  'ort', // Chicago, USA
  'osl', // Oslo, Norway
  'otp', // Bucharest, Romania
  'pao', // Palo Alto, USA
  'prg', // Prague, Czech Republic
  'qro', // Querétaro, Mexico
  'scl', // Santiago, Chile
  'sea', // Seattle, USA
  'sin', // Singapore
  'sit', // Singapore
  'sjc', // San Jose, USA
  'sju', // San Juan, Puerto Rico
  'sof', // Sofia, Bulgaria
  'ssn', // Seoul, South Korea
  'syd', // Sydney, Australia
  'tpe', // Taipei, Taiwan
  'vie', // Vienna, Austria
  'waw', // Warsaw, Poland
  'xsp', // Singapore
  'yul', // Montreal, Canada
  'yyz', // Toronto, Canada
  'zrh', // Zurich, Switzerland
];

const regionNumbers = [1, 2, 3, 4, 5];

const refererRules = [
  // Instagram
  {
    id: 1, // Must be unique
    siteName: 'Instagram',
    refererUrl: 'https://www.instagram.com/',
    requestDomains: [
      'instagram.com',
      '*.instagram.com',
      '*.cdninstagram.com',
      '*.fbcdn.net',
      '*.fbsbx.com',
      'graph.facebook.com',
      ...cdnRegions.flatMap((region) =>
        regionNumbers.flatMap((n) =>
          regionNumbers.map(
            (m) => `scontent-${region}${n}-${m}.cdninstagram.com`,
          ),
        ),
      ),
    ],
  },
];

// Setup rules on install/update and also on service worker startup.
// onInstalled is good for first install or update.
// The async listener ensures this completes before other potential actions.
chrome.runtime.onInstalled.addListener(async () => {
  for (const rule of refererRules) {
    await setupRefererRule(rule);
  }
});

// Ensures rules are set on service worker startup (e.g., after browser restart or SW crash)
for (const rule of refererRules) {
  setupRefererRule(rule);
}

// Handle updates
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    // Open the options page after install
    chrome.tabs.create({ url: 'src/Options/index.html' });
  }
});
// Download images
/** @typedef {{ numberOfProcessedImages: number, imagesToDownload: string[], options: any, next: () => void }} Task */

/** @type {Set<Task>} */
const tasks = new Set();

chrome.runtime.onMessage.addListener(startDownload);
chrome.downloads.onDeterminingFilename.addListener(suggestNewFilename);

// NOTE: Don't directly use an `async` function as a listener for `onMessage`:
// https://stackoverflow.com/a/56483156
// https://developer.chrome.com/docs/extensions/reference/runtime/#event-onMessage
function startDownload(
  /** @type {any} */ message,
  /** @type {chrome.runtime.MessageSender} */ sender,
  /** @type {(response?: any) => void} */ resolve,
) {
  if (!(message && message.type === 'downloadImages')) return;

  downloadImages({
    numberOfProcessedImages: 0,
    imagesToDownload: message.imagesToDownload,
    options: message.options,
    next() {
      this.numberOfProcessedImages += 1;
      if (this.numberOfProcessedImages === this.imagesToDownload.length) {
        tasks.delete(this);
      }
    },
  }).then(resolve);

  return true; // Keeps the message channel open until `resolve` is called
}

async function downloadImages(/** @type {Task} */ task) {
  tasks.add(task);
  for (const image of task.imagesToDownload) {
    await new Promise((resolve) => {
      chrome.downloads.download({ url: image }, (downloadId) => {
        if (downloadId == null) {
          if (chrome.runtime.lastError) {
            console.error(`${image}:`, chrome.runtime.lastError.message);
          }
          task.next();
        }
        resolve();
      });
    });
  }
}

// https://developer.chrome.com/docs/extensions/reference/downloads/#event-onDeterminingFilename
/** @type {Parameters<chrome.downloads.DownloadDeterminingFilenameEvent['addListener']>[0]} */
function suggestNewFilename(item, suggest) {
  const task = [...tasks][0];
  if (!task) {
    suggest();
    return;
  }

  let newFilename = '';
  if (task.options.folder_name) {
    newFilename += `${task.options.folder_name}/`;
  }
  if (task.options.new_file_name) {
    const regex = /(?:\.([^.]+))?$/;
    const extension = regex.exec(item.filename)?.[1];
    const numberOfDigits = task.imagesToDownload.length.toString().length;
    const formattedImageNumber = `${task.numberOfProcessedImages + 1}`.padStart(
      numberOfDigits,
      '0',
    );
    newFilename += `${task.options.new_file_name}${formattedImageNumber}.${extension}`;
  } else {
    newFilename += item.filename;
  }

  suggest({ filename: normalizeSlashes(newFilename) });
  task.next();
}

function normalizeSlashes(filename) {
  return filename.replace(/\\/g, '/').replace(/\/{2,}/g, '/');
}
