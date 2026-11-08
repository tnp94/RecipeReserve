import { useMemo, useRef, useState } from "react";
import { ActivityIndicator, Platform, View } from "react-native";
import AppModal from "../AppModal";
import { AppText, Button, SegmentedControl, TextField } from "../ui";
import { extractUrl, hasRecipeContent, missingParts, parseRecipeText } from "../../domain/recipeImport";
import { plural } from "../../domain/format";
import { fetchRecipeDraft } from "../../services/recipeFetch";
import { isScanAvailable, pickPhoto, scanRecipe } from "../../services/recipeScan";
import { makeStyles, radius, spacing, useTheme } from "../../theme";

const MODES = [
  { value: "link", label: "Link" },
  { value: "text", label: "Paste text" },
  ...(isScanAvailable() ? [{ value: "scan", label: "Scan" }] : []),
];

const SCAN_MESSAGES = {
  "camera-denied": "Camera access is off. Turn it on in your phone's settings, or choose a photo instead.",
  "no-text": "We couldn't read any text in that photo. Try again with the page flat and in good light.",
  failed: "We couldn't read that photo. Try another one, or paste the recipe instead.",
};

const FETCH_MESSAGES = {
  network:
    Platform.OS === "web"
      ? "Your browser blocked this site from sharing its page. Copy the recipe from the page and paste it instead."
      : "Couldn't reach that page. Check the link and your connection, or paste the recipe instead.",
  timeout: "That page took too long to load. Try again, or paste the recipe instead.",
  http: "That site wouldn't open the page for us. Copy the recipe from the page and paste it instead.",
  "no-recipe": "We couldn't find a recipe on that page. Copy it from the page and paste it instead.",
};

// Gets a recipe from a link, a block of pasted text or a photo and hands the draft (see
// domain/recipeImport.js) to the form, which is where the user reviews it.
const ImportRecipeModal = ({ visible, onClose, onImport }) => {
  const styles = useStyles();
  const theme = useTheme();
  const [mode, setMode] = useState("link");
  const [link, setLink] = useState("");
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [scanNotice, setScanNotice] = useState(false); // scanned text is in the paste box to fix
  // Pages scanned so far, [{ text, draft }]. A recipe can run over two pages (ingredients on
  // one, method on the next), so each scan adds a page and they're read as one text.
  const [pages, setPages] = useState([]);
  const request = useRef(0); // bumping it makes the answer to an older request get ignored

  const draft = useMemo(() => (mode === "text" ? parseRecipeText(text) : null), [mode, text]);
  const ready = mode === "text" && hasRecipeContent(draft);
  const scannedText = pages.map((p) => p.text).filter(Boolean).join("\n\n");
  const scanDraft = useMemo(
    () => (pages.length === 0 ? null : pages.length === 1 ? pages[0].draft : parseRecipeText(scannedText)),
    [pages, scannedText]
  );
  const scanMissing = scanDraft ? missingParts(scanDraft) : [];

  const reset = () => {
    request.current += 1;
    setLoading(false);
    setError("");
    setLink("");
    setText("");
    setMode("link");
    setScanNotice(false);
    setPages([]);
  };
  const close = () => {
    reset();
    onClose();
  };
  const finish = (result, options) => {
    reset();
    onImport(result, options);
  };

  const scan = async (source) => {
    const id = ++request.current;
    setError("");
    try {
      const photo = await pickPhoto(source);
      if (id !== request.current || !photo) return;
      setLoading(true);
      const result = await scanRecipe(photo);
      if (id !== request.current) return;
      // Show what was found, so the user can add the next page or use the recipe.
      setLoading(false);
      setPages((previous) => [...previous, result]);
    } catch (e) {
      if (id !== request.current) return;
      setLoading(false);
      setError(SCAN_MESSAGES[e.code] ?? SCAN_MESSAGES.failed);
    }
  };

  const fetchLink = async () => {
    const url = extractUrl(link);
    if (!url) {
      setError("That doesn't look like a web link.");
      return;
    }
    const id = ++request.current;
    setError("");
    setLoading(true);
    try {
      const result = await fetchRecipeDraft(url);
      if (id === request.current) finish(result);
    } catch (e) {
      if (id !== request.current) return;
      setLoading(false);
      setError(FETCH_MESSAGES[e.code] ?? FETCH_MESSAGES.network);
    }
  };

  // Couldn't tell the parts apart: let the user tidy the text rather than lose it.
  const editScannedText = () => {
    request.current += 1;
    setLoading(false);
    setError("");
    setText(scannedText);
    setScanNotice(true);
    setMode("text");
  };

  const changeMode = (next) => {
    request.current += 1;
    setLoading(false);
    setError("");
    setScanNotice(false);
    setMode(next);
  };

  return (
    <AppModal
      visible={visible}
      onClose={close}
      title="Import a recipe"
      subtitle="You can check and fix everything before saving."
      footer={
        <>
          <Button label="Cancel" variant="secondary" onPress={close} />
          {mode === "link" ? (
            <Button label="Get recipe" icon="download-outline" disabled={loading || !link.trim()} onPress={fetchLink} />
          ) : mode === "text" ? (
            <Button label="Use this recipe" disabled={!ready} onPress={() => finish(draft, { scanned: scanNotice })} />
          ) : scanDraft ? (
            <Button
              label="Use this recipe"
              disabled={loading || !hasRecipeContent(scanDraft)}
              onPress={() => finish(scanDraft, { scanned: true })}
            />
          ) : null}
        </>
      }
    >
      <SegmentedControl options={MODES} value={mode} onChange={changeMode} accessibilityLabel="Import from" style={styles.modes} />
      {mode === "link" ? (
        <>
          <TextField
            label="Recipe page link"
            value={link}
            onChangeText={(t) => {
              setLink(t);
              setError("");
            }}
            placeholder="https://"
            autoFocus
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            returnKeyType="go"
            onSubmitEditing={() => {
              if (!loading && link.trim()) fetchLink();
            }}
          />
          {loading ? (
            <View style={styles.loading} accessibilityLiveRegion="polite">
              <ActivityIndicator color={theme.colors.primary} />
              <AppText variant="small" tone="muted">Getting the recipe…</AppText>
            </View>
          ) : null}
          {error ? (
            <View style={styles.error} accessibilityLiveRegion="polite">
              <AppText variant="small" tone="danger">{error}</AppText>
              <Button label="Paste text instead" variant="ghost" size="sm" icon="clipboard-outline" onPress={() => changeMode("text")} style={styles.errorAction} />
            </View>
          ) : null}
        </>
      ) : mode === "scan" ? (
        <>
          {scanDraft ? (
            <View style={styles.preview} accessibilityLiveRegion="polite">
              <AppText variant="overline" tone="muted">
                {pages.length === 1 ? "From your photo" : `From ${pages.length} pages`}
              </AppText>
              <AppText variant="bodyStrong" numberOfLines={1}>{scanDraft.name || "No name yet"}</AppText>
              <AppText variant="small">
                {`${plural(scanDraft.ingredients.length, "ingredient")} · ${plural(scanDraft.directions.length, "step")}`}
              </AppText>
              {scanMissing.includes("ingredients") || scanMissing.includes("directions") ? (
                <AppText variant="small" tone="muted">
                  {`No ${scanMissing.includes("ingredients") ? "ingredients" : "directions"} yet. If they're on another page, scan that page too.`}
                </AppText>
              ) : null}
              <Button label="Check the text" variant="ghost" size="sm" icon="create-outline" onPress={editScannedText} style={styles.errorAction} />
            </View>
          ) : (
            <AppText variant="small" tone="muted">
              Lay the page flat in good light, with one recipe filling the photo. If the recipe runs onto another page, you can add that page next. Photos stay on your device.
            </AppText>
          )}
          <View style={styles.scanButtons}>
            <Button
              label={scanDraft ? "Photo of next page" : "Take photo"}
              icon="camera-outline"
              variant={scanDraft ? "secondary" : "primary"}
              disabled={loading}
              onPress={() => scan("camera")}
            />
            <Button
              label={scanDraft ? "Choose next page" : "Choose photo"}
              icon="images-outline"
              variant="secondary"
              disabled={loading}
              onPress={() => scan("library")}
            />
          </View>
          {loading ? (
            <View style={styles.loading} accessibilityLiveRegion="polite">
              <ActivityIndicator color={theme.colors.primary} />
              <AppText variant="small" tone="muted">Reading the recipe…</AppText>
            </View>
          ) : null}
          {error ? (
            <View style={styles.error} accessibilityLiveRegion="polite">
              <AppText variant="small" tone="danger">{error}</AppText>
              <Button label="Paste text instead" variant="ghost" size="sm" icon="clipboard-outline" onPress={() => changeMode("text")} style={styles.errorAction} />
            </View>
          ) : null}
        </>
      ) : (
        <>
          {scanNotice ? (
            <AppText variant="small" tone="muted" style={styles.notice} accessibilityLiveRegion="polite">
              Here's what we read. We couldn't find both the ingredients and the directions, so add "Ingredients" and "Directions" above each part.
            </AppText>
          ) : null}
          <TextField
            value={text}
            onChangeText={setText}
            multiline
            autoFocus
            placeholder={"Weeknight Chili\nServes 4\n\nIngredients\n2 cups beans\n1 onion, chopped\n\nDirections\n1. Chop the onion.\n2. Simmer everything."}
            accessibilityLabel="Recipe text"
            inputStyle={styles.input}
            autoCorrect={false}
          />
          {text.trim() ? (
            <View style={styles.preview}>
              <AppText variant="overline" tone="muted">We found</AppText>
              {ready || draft.name ? (
                <AppText variant="bodyStrong" numberOfLines={1}>{draft.name || "No name yet"}</AppText>
              ) : null}
              {ready ? (
                <AppText variant="small">
                  {`${plural(draft.ingredients.length, "ingredient")} · ${plural(draft.directions.length, "step")}`}
                </AppText>
              ) : (
                <AppText variant="small" tone="muted">No ingredients or steps yet. Put each one on its own line.</AppText>
              )}
            </View>
          ) : null}
        </>
      )}
    </AppModal>
  );
};

const useStyles = makeStyles((t) => ({
  modes: { marginBottom: spacing.lg },
  input: { minHeight: 200 },
  notice: { marginBottom: spacing.md },
  scanButtons: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.md },
  loading: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginTop: spacing.md },
  error: { marginTop: spacing.md, gap: spacing.xs },
  errorAction: { alignSelf: "flex-start" },
  preview: {
    marginTop: spacing.md,
    padding: spacing.md,
    gap: spacing.xs,
    borderRadius: radius.md,
    backgroundColor: t.colors.background,
  },
}));

export default ImportRecipeModal;
