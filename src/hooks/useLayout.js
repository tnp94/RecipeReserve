import { useWindowDimensions } from "react-native";

export default function useLayout() {
  const { width, height } = useWindowDimensions();
  return { width, height, isWide: width >= 900, isExtraWide: width >= 1200 };
}

export { useLayout };
