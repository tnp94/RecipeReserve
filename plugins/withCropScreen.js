const { AndroidConfig, withAndroidColors, withAndroidColorsNight, withStringsXml } = require("expo/config-plugins");

// expo-image-picker's Android crop screen (shown after taking or choosing a recipe photo)
// has a transparent toolbar by default, which came out as a dark bar with near-invisible
// Back / Crop / rotate buttons. App colours with the same names override the library's, so
// this gives the toolbar a solid bar with clear icons, and renames its "Crop" button to
// "Accept" (the user may not have changed the crop at all). Values mirror src/theme/themes/freshWarm.js.
// It's a native resource: changing it needs a new build, not an over-the-air update.
const LIGHT = {
  expoCropToolbarColor: "#FFFFFF", // surface
  expoCropToolbarIconColor: "#1F2421", // text
  expoCropBackButtonIconColor: "#1F2421",
  expoCropToolbarActionTextColor: "#2F6B4F", // primary
  expoCropBackgroundColor: "#F3EFE8", // surfaceAlt, so the photo stands out from the bar
};

// When the phone is in dark mode the crop screen follows it (the rest of the app is always
// light), so the bar stays dark there but solid, with light icons.
const DARK = {
  expoCropToolbarColor: "#262B28",
  expoCropToolbarIconColor: "#FFFFFF",
  expoCropBackButtonIconColor: "#FFFFFF",
  expoCropToolbarActionTextColor: "#8FD1AE",
  expoCropBackgroundColor: "#121513",
};

// The cropper's own text resources, overridden the same way.
const STRINGS = {
  crop_image_menu_crop: "Accept",
};

const setColors = (colors, values) =>
  Object.entries(values).reduce(
    (xml, [name, value]) => AndroidConfig.Colors.assignColorValue(xml, { name, value }),
    colors
  );

module.exports = function withCropScreen(config) {
  config = withStringsXml(config, (c) => {
    const items = Object.entries(STRINGS).map(([name, value]) => AndroidConfig.Resources.buildResourceItem({ name, value }));
    c.modResults = AndroidConfig.Strings.setStringItem(items, c.modResults);
    return c;
  });
  config = withAndroidColors(config, (c) => {
    c.modResults = setColors(c.modResults, LIGHT);
    return c;
  });
  return withAndroidColorsNight(config, (c) => {
    c.modResults = setColors(c.modResults, DARK);
    return c;
  });
};
