import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { colors, radius } from "../../../theme";

// Gesture-based drag-and-drop shared by iOS, Android and web (mouse + touch).
// Coordinates: gesture absoluteX/absoluteY and measureInWindow are both window
// coordinates (viewport coordinates on web); the preview is placed relative to the
// provider's own container by subtracting its measured window offset.
const ApiContext = createContext(null);
const StateContext = createContext({ active: null, hoverKey: null, hoverHalf: null });

export const useDragApi = () => useContext(ApiContext);
export const useDragState = () => useContext(StateContext);

export const dropOverStyle = (isOver) =>
  isOver ? { borderColor: colors.accentStrong, backgroundColor: "rgba(47,128,237,0.12)" } : null;

// ScrollView that registers itself as the auto-scroll target while dragging and is
// locked (scrollEnabled=false) during a drag.
export const DragScrollView = ({ horizontal = false, onScroll, onContentSizeChange, ...props }) => {
  const api = useDragApi();
  const { active } = useDragState();
  const ref = useRef(null);
  const info = useRef({ ref, horizontal, offset: 0, content: 0 }).current;
  useEffect(() => {
    api.setScroller(info);
    return () => api.setScroller(null);
  }, [api, info]);
  return (
    <ScrollView
      {...props}
      ref={ref}
      horizontal={horizontal}
      scrollEnabled={!active}
      scrollEventThrottle={16}
      onScroll={(e) => {
        const o = e.nativeEvent.contentOffset;
        info.offset = horizontal ? o.x : o.y;
        if (onScroll) onScroll(e);
      }}
      onContentSizeChange={(w, h) => {
        info.content = horizontal ? w : h;
        if (onContentSizeChange) onContentSizeChange(w, h);
      }}
    />
  );
};

const EDGE = 56; // px from the scroller edge where auto-scroll can start
const DWELL = 300; // ms the pointer must rest in the edge zone before scrolling starts
const MIN_STEP = 4; // px per tick at the zone's inner edge
const MAX_STEP = 16; // px per tick at the screen edge
const PREVIEW_W = 180;
const PREVIEW_H = 40;

const DragProvider = ({ children, style }) => {
  const [active, setActive] = useState(null);
  const [hoverKey, setHoverKey] = useState(null);
  const [hoverHalf, setHoverHalf] = useState(null);
  const activeRef = useRef(null);
  const hoverRef = useRef(null);
  const zones = useRef(new Map());
  const rects = useRef(new Map());
  const containerRef = useRef(null);
  const container = useRef({ x: 0, y: 0, w: 0, h: 0 });
  const scroller = useRef(null); // { ref, horizontal, offset, content }
  const lastMeasure = useRef(0);
  const lastPos = useRef({ x: 0, y: 0 });
  const timer = useRef(null);
  const edgeSince = useRef(0);
  const pos = useRef(new Animated.ValueXY({ x: -1000, y: -1000 })).current;

  const measureZones = useCallback(() => {
    lastMeasure.current = Date.now();
    zones.current.forEach((zone, key) => {
      const node = zone.node;
      if (!node || !node.measureInWindow) return;
      node.measureInWindow((x, y, w, h) => {
        if (activeRef.current && zones.current.get(key) === zone) rects.current.set(key, { x, y, w, h });
      });
    });
  }, []);

  const measureContainer = useCallback(() => {
    const node = containerRef.current;
    if (node && node.measureInWindow) {
      node.measureInWindow((x, y, w, h) => {
        container.current = { x, y, w, h };
      });
    }
  }, []);

  const halfRef = useRef(null);
  const setHover = (key, y) => {
    if (hoverRef.current !== key) {
      hoverRef.current = key;
      setHoverKey(key);
    }
    const half = key && y !== undefined ? halfOf(key, y) : null;
    if (halfRef.current !== half) {
      halfRef.current = half;
      setHoverHalf(half);
    }
  };

  // "before" when the pointer is in the top half of the zone's cached rect, else "after".
  const halfOf = (key, y) => {
    const r = rects.current.get(key);
    if (!r) return null;
    return y < r.y + r.h / 2 ? "before" : "after";
  };

  const hitTest = (x, y) => {
    const type = activeRef.current?.type;
    let best = null;
    let bestArea = Infinity;
    rects.current.forEach((r, key) => {
      const zone = zones.current.get(key);
      if (!zone || !zone.accepts.includes(type)) return;
      if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) {
        const area = r.w * r.h;
        if (area < bestArea) {
          best = key;
          bestArea = area;
        }
      }
    });
    return best;
  };

  const place = (x, y) => {
    pos.setValue({ x: x - container.current.x - PREVIEW_W / 2, y: y - container.current.y - PREVIEW_H / 2 });
  };

  // Signed scroll step for the pointer position (0 outside the edge zones or without a scroller).
  // Speed grows with depth into the zone: MIN_STEP at its inner edge up to MAX_STEP at the edge.
  const edgeDelta = (x, y) => {
    const s = scroller.current;
    const c = container.current;
    if (!s || !s.ref.current || !c.w) return 0;
    const near = s.horizontal ? x - c.x : y - c.y;
    const size = s.horizontal ? c.w : c.h;
    const speed = (dist) => MIN_STEP + (MAX_STEP - MIN_STEP) * Math.min(1, Math.max(0, (EDGE - dist) / EDGE));
    if (near < EDGE) return -speed(near);
    if (near > size - EDGE) return speed(size - near);
    return 0;
  };

  const stopTimer = () => {
    edgeSince.current = 0;
    if (timer.current) {
      clearInterval(timer.current);
      timer.current = null;
    }
  };

  // One tick of the auto-scroll loop, using the last known pointer position.
  const tick = () => {
    const s = scroller.current;
    const c = container.current;
    if (!activeRef.current || !s || !s.ref.current) return stopTimer();
    const { x, y } = lastPos.current;
    const delta = edgeDelta(x, y);
    if (!delta) return stopTimer();
    if (Date.now() - edgeSince.current < DWELL) return; // still dwelling
    const size = s.horizontal ? c.w : c.h;
    const max = Math.max(0, s.content - size);
    const next = Math.min(max, Math.max(0, s.offset + delta));
    const applied = next - s.offset;
    if (!applied) return stopTimer(); // content end reached
    s.offset = next;
    s.ref.current.scrollTo(s.horizontal ? { x: next, animated: false } : { y: next, animated: false });
    // Shift cached rects right away; a throttled re-measure then corrects any drift.
    rects.current.forEach((r) => {
      if (s.horizontal) r.x -= applied;
      else r.y -= applied;
    });
    setHover(hitTest(x, y), y);
    if (Date.now() - lastMeasure.current > 100) measureZones();
  };

  const autoScroll = (x, y) => {
    lastPos.current = { x, y };
    if (!edgeDelta(x, y)) stopTimer();
    else if (!timer.current) {
      edgeSince.current = Date.now();
      timer.current = setInterval(tick, 16);
    }
  };

  useEffect(() => stopTimer, []);

  const api = useMemo(
    () => ({
      registerZone(key, zone) {
        zones.current.set(key, zone);
      },
      unregisterZone(key, zone) {
        if (zones.current.get(key) === zone) {
          zones.current.delete(key);
          rects.current.delete(key);
        }
      },
      setScroller(info) {
        scroller.current = info;
      },
      begin(payload, x, y) {
        activeRef.current = payload;
        lastPos.current = { x, y };
        hoverRef.current = null;
        halfRef.current = null;
        setHoverKey(null);
        setHoverHalf(null);
        setActive(payload);
        rects.current = new Map();
        measureContainer();
        measureZones();
        // The container offset arrives async; place with the previous value first.
        place(x, y);
        const node = containerRef.current;
        if (node && node.measureInWindow) {
          node.measureInWindow((cx, cy, w, h) => {
            container.current = { x: cx, y: cy, w, h };
            if (activeRef.current) place(x, y);
          });
        }
        setHover(null);
      },
      move(x, y) {
        if (!activeRef.current) return;
        place(x, y);
        autoScroll(x, y);
        setHover(hitTest(x, y), y);
      },
      end() {
        const payload = activeRef.current;
        if (!payload) return;
        stopTimer();
        // Re-run the hit test on the (post-scroll) rects so the drop matches what is under the pointer.
        const { x, y } = lastPos.current;
        const dropKey = hitTest(x, y);
        const zone = dropKey ? zones.current.get(dropKey) : null;
        const rect = dropKey ? rects.current.get(dropKey) : null;
        activeRef.current = null;
        hoverRef.current = null;
        halfRef.current = null;
        setActive(null);
        setHoverKey(null);
        setHoverHalf(null);
        if (zone) zone.onDrop(payload, { x, y, rect });
      },
      cancel() {
        stopTimer();
        if (!activeRef.current) return;
        activeRef.current = null;
        hoverRef.current = null;
        halfRef.current = null;
        setActive(null);
        setHoverKey(null);
        setHoverHalf(null);
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [measureContainer, measureZones]
  );

  const state = useMemo(() => ({ active, hoverKey, hoverHalf }), [active, hoverKey, hoverHalf]);

  return (
    <ApiContext.Provider value={api}>
      <StateContext.Provider value={state}>
        <View ref={containerRef} collapsable={false} style={[styles.container, style]}>
          {children}
          {active ? (
            <Animated.View
              pointerEvents="none"
              style={[styles.preview, { transform: pos.getTranslateTransform() }]}
            >
              <View style={styles.pill}>
                <Text style={styles.pillText} numberOfLines={1}>{active.label}</Text>
              </View>
            </Animated.View>
          ) : null}
        </View>
      </StateContext.Provider>
    </ApiContext.Provider>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  preview: { position: "absolute", left: 0, top: 0, width: PREVIEW_W, height: PREVIEW_H, alignItems: "center", justifyContent: "center", zIndex: 1000 },
  pill: {
    maxWidth: PREVIEW_W,
    backgroundColor: colors.accentStrong,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 8,
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  pillText: { color: "#fff", fontWeight: "bold", fontSize: 14 },
});

export default DragProvider;
