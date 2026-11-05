import * as ImagePicker from "expo-image-picker";
import TextRecognition from "@react-native-ml-kit/text-recognition";
import { pickPhoto, scanRecipe } from "../recipeScan";

jest.mock("expo-image-picker", () => ({
  requestCameraPermissionsAsync: jest.fn(),
  launchCameraAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
}));
jest.mock("@react-native-ml-kit/text-recognition", () => ({
  __esModule: true,
  default: { recognize: jest.fn() },
}));

const codeOf = (promise) => promise.then(() => "resolved", (e) => e.code);

beforeEach(() => jest.clearAllMocks());

describe("pickPhoto", () => {
  it("takes a photo once the camera is allowed", async () => {
    ImagePicker.requestCameraPermissionsAsync.mockResolvedValue({ granted: true });
    ImagePicker.launchCameraAsync.mockResolvedValue({ canceled: false, assets: [{ uri: "file:///a.jpg" }] });
    await expect(pickPhoto("camera")).resolves.toBe("file:///a.jpg");
  });

  it("does not open the camera when it is not allowed", async () => {
    ImagePicker.requestCameraPermissionsAsync.mockResolvedValue({ granted: false });
    await expect(codeOf(pickPhoto("camera"))).resolves.toBe("camera-denied");
    expect(ImagePicker.launchCameraAsync).not.toHaveBeenCalled();
  });

  it("chooses from the library without asking for the camera", async () => {
    ImagePicker.launchImageLibraryAsync.mockResolvedValue({ canceled: false, assets: [{ uri: "file:///b.jpg" }] });
    await expect(pickPhoto("library")).resolves.toBe("file:///b.jpg");
    expect(ImagePicker.requestCameraPermissionsAsync).not.toHaveBeenCalled();
  });

  it("returns null when the user backs out", async () => {
    ImagePicker.launchImageLibraryAsync.mockResolvedValue({ canceled: true, assets: null });
    await expect(pickPhoto("library")).resolves.toBeNull();
  });
});

describe("scanRecipe", () => {
  it("returns a draft and the text it came from", async () => {
    const text = "Soup\nIngredients\n1 leek\nDirections\nCook it.";
    TextRecognition.recognize.mockResolvedValue({ text, blocks: [] });
    const result = await scanRecipe("file:///a.jpg");
    expect(TextRecognition.recognize).toHaveBeenCalledWith("file:///a.jpg");
    expect(result.text).toBe(text);
    expect(result.draft.name).toBe("Soup");
    expect(result.draft.directions).toEqual(["Cook it."]);
  });

  it("reports a photo with no text", async () => {
    TextRecognition.recognize.mockResolvedValue({ text: "  \n ", blocks: [] });
    await expect(codeOf(scanRecipe("file:///a.jpg"))).resolves.toBe("no-text");
  });

  it("reports recognition that fails", async () => {
    TextRecognition.recognize.mockRejectedValue(new Error("boom"));
    await expect(codeOf(scanRecipe("file:///a.jpg"))).resolves.toBe("failed");
  });

  it("reports recognition that throws straight away", async () => {
    TextRecognition.recognize.mockImplementation(() => {
      throw new Error("not linked");
    });
    await expect(codeOf(scanRecipe("file:///a.jpg"))).resolves.toBe("failed");
  });
});
