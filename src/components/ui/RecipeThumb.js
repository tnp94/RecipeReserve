import { Image, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { makeStyles, radius, useTheme } from "../../theme";
import { recipeImageUri } from "../../services/recipePhoto";
import AppText from "./AppText";

// Recipe picture: the recipe's photo (services/recipePhoto.js), or else a tile whose colour
// is picked from the recipe's name (stable across launches) with its initials.
export function tileFor(theme, name) {
  const tiles = theme.colors.tiles;
  let hash = 0;
  for (const ch of String(name ?? "")) hash = (hash * 31 + ch.charCodeAt(0)) | 0;
  return tiles[Math.abs(hash) % tiles.length];
}

export function initialsOf(name) {
  const words = String(name ?? "")
    .replace(/[^A-Za-z0-9 ]/g, " ")
    .split(/\s+/)
    .filter((w) => w && !/^(and|with|the|of|a|an|in|on)$/i.test(w));
  if (words.length === 0) return "";
  return (words[0][0] + (words[1]?.[0] ?? "")).toUpperCase();
}

const RecipeThumb = ({ recipe, size, height, width, rounded = radius.md, style, showIcon = true }) => {
  const theme = useTheme();
  const styles = useStyles();
  const w = width ?? size ?? "100%";
  const h = height ?? size ?? 120;
  const image = recipeImageUri(recipe?.image);
  if (image) {
    return <Image source={{ uri: image }} style={[{ width: w, height: h, borderRadius: rounded }, style]} accessibilityIgnoresInvertColors />;
  }
  const tile = tileFor(theme, recipe?.name);
  const small = typeof h === "number" && h < 72;
  const initials = initialsOf(recipe?.name);
  return (
    <View
      style={[styles.tile, { width: w, height: h, borderRadius: rounded, backgroundColor: tile.background }, style]}
      accessible={false}
      importantForAccessibility="no-hide-descendants"
    >
      {showIcon && !small ? (
        <Ionicons name="restaurant-outline" size={18} color={tile.foreground} style={styles.icon} />
      ) : null}
      <AppText
        variant={small ? "subheading" : "display"}
        style={{ color: tile.foreground, opacity: 0.9 }}
      >
        {initials || "?"}
      </AppText>
    </View>
  );
};

const useStyles = makeStyles(() => ({
  tile: { alignItems: "center", justifyContent: "center", overflow: "hidden" },
  icon: { position: "absolute", top: 10, left: 10, opacity: 0.7 },
}));

export default RecipeThumb;
