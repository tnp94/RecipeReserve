import { useState } from "react";
import { Platform } from "react-native";
import { useDialog } from "../components/dialog/DialogProvider";
import { afterModalsDismissed } from "../components/modalGate";
import { pickRecipePhoto } from "../services/recipePhoto";

// Taking or choosing a dish photo, shared by the recipe form and Recipe Details.
//   pick(source)  "camera" | "library"; resolves to the new `recipe.image`, or null if the
//                 user backed out or it failed (failures are explained in a dialog)
//   openPhotoMenu({ hasPhoto, onChange })  a menu of Take / Choose / Remove photo;
//                 onChange(image) gets the new value ("" for Remove)
//   busy          true while the picker is open or the photo is being saved
export default function useRecipePhoto() {
  const dialog = useDialog();
  const [busy, setBusy] = useState(false);

  const pick = async (source) => {
    setBusy(true);
    try {
      // The camera can't open on iOS while the menu dialog is still closing.
      await afterModalsDismissed();
      return await pickRecipePhoto(source);
    } catch (e) {
      const denied = e?.code === "camera-denied";
      dialog.alert(
        denied ? "Camera access is off" : "Couldn't add that photo",
        denied
          ? "Turn on camera access for this app in your phone's settings, or choose a photo instead."
          : "Try taking it again, or choose a different photo."
      );
      return null;
    } finally {
      setBusy(false);
    }
  };

  const openPhotoMenu = ({ hasPhoto, onChange }) => {
    const pickThen = (source) => async () => {
      const image = await pick(source);
      if (image) onChange(image);
    };
    dialog.alert(hasPhoto ? "Change photo" : "Add a photo", "Show a photo of the dish instead of the letters.", [
      ...(Platform.OS !== "web" ? [{ text: "Take photo", onPress: pickThen("camera") }] : []),
      { text: "Choose photo", onPress: pickThen("library") },
      ...(hasPhoto ? [{ text: "Remove photo", style: "destructive", onPress: () => onChange("") }] : []),
      { text: "Cancel", style: "cancel" },
    ]);
  };

  return { busy, pick, openPhotoMenu };
}
