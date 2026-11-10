import { Platform } from "react-native";
import * as FileSystem from "expo-file-system/legacy";
import { pickPhotoAsset } from "./recipeScan";

// Photos of the finished dish, shown in place of a recipe's coloured tile.
//
// `recipe.image` holds one of:
//   "recipe-photos/<file>.jpg"  a photo saved in the app's documents folder (phones). Kept
//                               relative because iOS moves that folder when the app updates.
//   "data:image/jpeg;base64,…"  a small copy of the photo (web, which has no file storage)
//   any other uri                shown as it is ("" = no photo)

export const PHOTO_DIR = "recipe-photos/";
const WEB_MAX_SIDE = 640; // web copies live in browser storage, so keep them small

const isSavedFile = (image) => typeof image === "string" && image.startsWith(PHOTO_DIR);

// The uri to show for `recipe.image`, or null for no photo.
export function recipeImageUri(image) {
  const value = typeof image === "string" ? image.trim() : "";
  if (!value) return null;
  if (isSavedFile(value)) return FileSystem.documentDirectory ? FileSystem.documentDirectory + value : null;
  return value;
}

// Lets the user take or choose a photo and keeps a copy the app owns (the picker's own file
// is in a cache the system may clear). source: "camera" | "library". Returns the value for
// `recipe.image`, or null if the user backed out. Throws RecipeScanError("camera-denied").
export async function pickRecipePhoto(source) {
  const asset = await pickPhotoAsset(source, { allowsEditing: true, aspect: [4, 3], quality: 0.6 });
  if (!asset) return null;
  if (Platform.OS === "web") return shrinkOnWeb(asset.uri);
  await FileSystem.makeDirectoryAsync(FileSystem.documentDirectory + PHOTO_DIR, { intermediates: true });
  const extension = (asset.uri.match(/\.(jpe?g|png|heic|webp)$/i)?.[1] ?? "jpg").toLowerCase();
  const name = `${PHOTO_DIR}${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}.${extension}`;
  await FileSystem.copyAsync({ from: asset.uri, to: FileSystem.documentDirectory + name });
  return name;
}

// Saved photo files no recipe uses any more: after a photo is replaced, a recipe deleted, or
// the samples restored. Several recipes can share a file ("Save as a new recipe").
export function unusedPhotoFiles(fileNames, recipes) {
  const used = new Set(recipes.map((r) => r?.image).filter(isSavedFile));
  return fileNames.filter((file) => !used.has(PHOTO_DIR + file));
}

// Best effort: a file left behind only costs space, so errors are ignored.
export async function removeUnusedPhotos(recipes) {
  if (Platform.OS === "web" || !FileSystem.documentDirectory) return;
  try {
    const dir = FileSystem.documentDirectory + PHOTO_DIR;
    const info = await FileSystem.getInfoAsync(dir);
    if (!info.exists) return;
    const unused = unusedPhotoFiles(await FileSystem.readDirectoryAsync(dir), recipes);
    await Promise.all(unused.map((file) => FileSystem.deleteAsync(dir + file, { idempotent: true })));
  } catch {
    // ignore
  }
}

// Draws the photo at most WEB_MAX_SIDE across and returns it as a JPEG data uri.
function shrinkOnWeb(uri) {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => {
      const scale = Math.min(1, WEB_MAX_SIDE / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", 0.75));
    };
    img.onerror = () => reject(new Error("Couldn't read that photo."));
    img.src = uri;
  });
}
