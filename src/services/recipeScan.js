import { NativeModules } from "react-native";
import * as ImagePicker from "expo-image-picker";
import TextRecognition from "@react-native-ml-kit/text-recognition";
import { parseRecipeText } from "../domain/recipeImport";

// code: "camera-denied" | "no-text" (nothing readable in the photo) | "failed"
export class RecipeScanError extends Error {
  constructor(code) {
    super(code);
    this.name = "RecipeScanError";
    this.code = code;
  }
}

// On-device OCR is native code, so it's missing on web and in Expo Go (it needs a
// development or store build).
export const isScanAvailable = () => !!NativeModules.TextRecognition;

const PHOTO_OPTIONS = { mediaTypes: ["images"], quality: 0.9 };

// source: "camera" | "library". Returns the photo's uri, or null if the user backed out.
export async function pickPhoto(source) {
  if (source === "camera") {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) throw new RecipeScanError("camera-denied");
  }
  const result =
    source === "camera"
      ? await ImagePicker.launchCameraAsync(PHOTO_OPTIONS)
      : await ImagePicker.launchImageLibraryAsync(PHOTO_OPTIONS);
  return result.canceled ? null : result.assets?.[0]?.uri ?? null;
}

// Reads a photo of a recipe. Returns { draft, text }: the same draft as every other import
// route, plus the raw text so the user can fix it when the draft comes out incomplete.
// This is the one function an online scanner would replace; it can return text: "".
export async function scanRecipe(photoUri) {
  let text;
  try {
    const result = await TextRecognition.recognize(photoUri);
    text = String(result?.text ?? "").trim();
  } catch {
    throw new RecipeScanError("failed");
  }
  if (!text) throw new RecipeScanError("no-text");
  return { draft: parseRecipeText(text), text };
}
