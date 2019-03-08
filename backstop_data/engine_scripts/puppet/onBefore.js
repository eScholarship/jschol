module.exports = async (page, scenario, vp) => {
  await require('./loadCookies')(page, scenario);

  // Enable truncation logic being able to disable itself
  await page.setUserAgent('puppeteer');

  // Search page has an animation on its controls (probably unintentional)
  await page._client.send('Animation.setPlaybackRate', { playbackRate: 1000 });
};
