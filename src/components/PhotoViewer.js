import { Image, Modal, Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { makeStyles, spacing } from "../theme";
import { useGatedModal } from "./modalGate";
import IconButton from "./ui/IconButton";

// A photo shown full screen on a dark backdrop. Tapping anywhere (or Back) closes it.
// `uri` is a resolved image uri (see recipeImageUri in services/recipePhoto.js).
const PhotoViewer = ({ visible, uri, onClose, accessibilityLabel = "Photo" }) => {
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const { shown, onDismiss } = useGatedModal(!!visible && !!uri);
  return (
    <Modal
      visible={shown}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
      onDismiss={onDismiss}
    >
      <Pressable style={styles.root} onPress={onClose} accessibilityLabel="Close photo" accessibilityRole="button">
        {uri ? (
          <Image
            source={{ uri }}
            style={styles.image}
            resizeMode="contain"
            accessibilityLabel={accessibilityLabel}
            accessibilityIgnoresInvertColors
          />
        ) : null}
      </Pressable>
      <View style={[styles.close, { top: insets.top + spacing.sm, right: insets.right + spacing.sm }]}>
        <IconButton icon="close" variant="tonal" onPress={onClose} accessibilityLabel="Close photo" />
      </View>
    </Modal>
  );
};

const useStyles = makeStyles((t) => ({
  root: { flex: 1, backgroundColor: t.colors.photoViewer, alignItems: "center", justifyContent: "center" },
  image: { width: "100%", height: "100%" },
  close: { position: "absolute" },
}));

export default PhotoViewer;
