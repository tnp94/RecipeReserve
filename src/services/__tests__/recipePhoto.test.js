import * as FileSystem from "expo-file-system/legacy";
import * as ImagePicker from "expo-image-picker";
import { pickRecipePhoto, recipeImageUri, removeUnusedPhotos, unusedPhotoFiles } from "../recipePhoto";

jest.mock("expo-file-system/legacy", () => ({
  documentDirectory: "file:///docs/",
  makeDirectoryAsync: jest.fn(),
  copyAsync: jest.fn(),
  getInfoAsync: jest.fn(),
  readDirectoryAsync: jest.fn(),
  deleteAsync: jest.fn(),
}));
jest.mock("expo-image-picker", () => ({
  requestCameraPermissionsAsync: jest.fn(),
  launchCameraAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
}));
jest.mock("@react-native-ml-kit/text-recognition", () => ({ __esModule: true, default: { recognize: jest.fn() } }));

beforeEach(() => jest.clearAllMocks());

describe("recipeImageUri", () => {
  it("resolves saved photos against the documents folder", () => {
    expect(recipeImageUri("recipe-photos/a.jpg")).toBe("file:///docs/recipe-photos/a.jpg");
  });

  it("passes other uris through and treats blanks as no photo", () => {
    expect(recipeImageUri("data:image/jpeg;base64,xyz")).toBe("data:image/jpeg;base64,xyz");
    expect(recipeImageUri("https://x.com/a.jpg")).toBe("https://x.com/a.jpg");
    expect(recipeImageUri("  ")).toBeNull();
    expect(recipeImageUri(undefined)).toBeNull();
  });
});

describe("pickRecipePhoto", () => {
  it("copies the picked photo into the app's own folder", async () => {
    ImagePicker.launchImageLibraryAsync.mockResolvedValue({ canceled: false, assets: [{ uri: "file:///cache/pick.png" }] });
    const image = await pickRecipePhoto("library");
    expect(image).toMatch(/^recipe-photos\/[\w-]+\.png$/);
    expect(ImagePicker.launchImageLibraryAsync).toHaveBeenCalledWith(expect.objectContaining({ allowsEditing: true }));
    expect(FileSystem.copyAsync).toHaveBeenCalledWith({ from: "file:///cache/pick.png", to: `file:///docs/${image}` });
  });

  it("returns null when the user backs out", async () => {
    ImagePicker.requestCameraPermissionsAsync.mockResolvedValue({ granted: true });
    ImagePicker.launchCameraAsync.mockResolvedValue({ canceled: true });
    await expect(pickRecipePhoto("camera")).resolves.toBeNull();
    expect(FileSystem.copyAsync).not.toHaveBeenCalled();
  });
});

describe("unused photos", () => {
  const recipes = [{ image: "recipe-photos/a.jpg" }, { image: "recipe-photos/a.jpg" }, { image: "" }, { image: "https://x/b.jpg" }];

  it("lists files no recipe uses", () => {
    expect(unusedPhotoFiles(["a.jpg", "b.jpg", "c.jpg"], recipes)).toEqual(["b.jpg", "c.jpg"]);
  });

  it("deletes them", async () => {
    FileSystem.getInfoAsync.mockResolvedValue({ exists: true });
    FileSystem.readDirectoryAsync.mockResolvedValue(["a.jpg", "old.jpg"]);
    await removeUnusedPhotos(recipes);
    expect(FileSystem.deleteAsync).toHaveBeenCalledTimes(1);
    expect(FileSystem.deleteAsync).toHaveBeenCalledWith("file:///docs/recipe-photos/old.jpg", { idempotent: true });
  });
});
