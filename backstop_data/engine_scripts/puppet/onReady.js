function imagesHaveLoaded() {
  return Array.from(document.images).every((i) => i.complete);
}

module.exports = async (page, scenario, vp) => {
  console.log('SCENARIO > ' + scenario.label + ", VP > " + vp.label);
  await require('./clickAndHoverHelper')(page, scenario);
  await page.waitForFunction(imagesHaveLoaded, { timeout: 30000 });
  console.log('DONE > ' + scenario.label + ", VP > " + vp.label);
};
