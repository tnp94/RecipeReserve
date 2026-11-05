import { useState } from "react";
import { FlatList, View } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import useLayout from "../hooks/useLayout";
import { makeStyles, radius, spacing } from "../theme";
import { addStaple, removeStaple, selectStaplesList } from "../store/pantrySlice";
import { AppText, Button, EmptyState, IconButton, TextField } from "../components/ui";

const PantryStaplesScreen = () => {
  const dispatch = useDispatch();
  const styles = useStyles();
  const { isWide } = useLayout();
  const staples = useSelector(selectStaplesList);
  const [text, setText] = useState("");

  const add = () => {
    if (!text.trim()) return;
    dispatch(addStaple(text));
    setText("");
  };

  return (
    <View style={styles.screen}>
      <View style={[styles.content, isWide && styles.contentWide]}>
        <AppText variant="small" tone="muted" style={styles.intro}>
          Things you usually have, like salt or oil. When you generate a shopping list they're added already checked
          off. You can also mark staples from a recipe or the shopping list.
        </AppText>
        <View style={styles.inputRow}>
          <TextField
            style={styles.flex}
            value={text}
            onChangeText={setText}
            placeholder="Add a staple, e.g. olive oil"
            onSubmitEditing={add}
            blurOnSubmit={false}
            returnKeyType="done"
            accessibilityLabel="Staple name"
          />
          <Button label="Add" onPress={add} disabled={!text.trim()} />
        </View>
        <FlatList
          data={staples}
          keyExtractor={(s) => s.nameKey}
          style={styles.list}
          contentContainerStyle={staples.length ? styles.listContent : null}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={
            <EmptyState icon="file-tray-stacked-outline" title="No pantry staples yet" message="Add the basics you always keep at home." />
          }
          renderItem={({ item }) => (
            <View style={styles.row}>
              <AppText variant="body" style={styles.flex}>{item.name}</AppText>
              <IconButton
                icon="close"
                size={18}
                onPress={() => dispatch(removeStaple(item.nameKey))}
                accessibilityLabel={`Remove ${item.name}`}
              />
            </View>
          )}
        />
      </View>
    </View>
  );
};

const useStyles = makeStyles((t) => ({
  screen: { flex: 1, backgroundColor: t.colors.background },
  flex: { flex: 1 },
  content: { flex: 1, width: "100%", padding: spacing.lg },
  contentWide: { maxWidth: 720, alignSelf: "center" },
  intro: { marginBottom: spacing.md },
  inputRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.lg },
  list: { flex: 1 },
  listContent: {
    backgroundColor: t.colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: t.colors.border,
    overflow: "hidden",
  },
  row: { flexDirection: "row", alignItems: "center", minHeight: 52, paddingLeft: spacing.lg, paddingRight: spacing.xs },
  separator: { height: 1, backgroundColor: t.colors.border, marginLeft: spacing.lg },
}));

export default PantryStaplesScreen;
