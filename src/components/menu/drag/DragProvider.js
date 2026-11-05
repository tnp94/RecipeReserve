import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { colors, radius } from "../../../theme";

// Gesture-based drag-and-drop shared by iOS, Android and web (mouse + touch).
// Coordinates: gesture absoluteX/absoluteY and measureInWindow are both window
// coordinates (viewport coordinates on web); the preview is placed relative to the
// provider's own container by subtracting its measured window offset.
//
// Drag state lives in a small external store instead of React context so that a hover
// change re-renders only the zones whose own snapshot changed (see useDropZone).
const ApiContext = createContext(null);

export const useDragApi = () => useContext(ApiContext);

// True while any drag is in progress (scroll views lock themselves with this).
export function useDragActive() {
  const api = useDragApi();
  return useSyncExternalStore(api.subscribe, () => api.getState().active !== null);
}

export const dropOverStyle = (isOver) =>
  isOver ? { borderColor: colors.accentStrong, backgroundColor: "rgba(47,128,237,0.12)" } : null;

// ScrollView that registers itself as an auto-scroll target and is locked
// (scrollEnabled=false) during a drag. Any number may be mounted (e.g. the wide layout's
// horizontal board plus one vertical scroller per column).
export const DragScrollView = ({ horizontal = false, onScroll, onContentSizeChange, ...props }) => {
  const api = useDragApi();
  const active = useDragActive();
  const ref = useRef(null);
  const info = useRef({ ref, horizontal, offset: 0, content: 0, rect: null }).current;
  useEffect(() => api.addScroller(info), [api, info]);
  return (
    <ScrollView
      {...props}
      ref={ref}
      collapsable={false}
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

const EDGE = 56; // px from a scroller's edge where auto-scroll can start
const DWELL = 300; // ms the pointer must rest in the edge zone before scrolling starts
const MIN_STEP = 4; // px per tick at the zone's inner edge
const MAX_STEP = 16; // px per tick at the scroller's edge
const PREVIEW_W = 180;
const PREVIEW_H = 40;

const contains = (r, x, y) => !!r && x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;

const measure = (node, cb) => {
  if (node && node.measureInWindow) node.measureInWindow((x, y, w, h) => cb({ x, y, w, h }));
};

const IDLE = { active: null, hoverKey: null, hoverHalf: null };

const DragProvider = ({ children, style }) => {
  // The preview needs `active` as React state; everything else reads the store.
  const [preview, setPreview] = useState(null);
  const stateRef = useRef(IDLE);
  const listeners = useRef(new Set());
  const zones = useRef(new Map());
  const rects = useRef(new Map());
  const scrollers = useRef(new Set());
  const containerRef = useRef(null);
  const container = useRef({ x: 0, y: 0, w: 0, h: 0 });
  const lastMeasure = useRef(0);
  const lastPos = useRef({ x: 0, y: 0 });
  const timer = useRef(null);
  const edgeSince = useRef(0);
  const pos = useRef(new Animated.ValueXY({ x: -1000, y: -1000 })).current;

  const setState = (patch) => {
    const prev = stateRef.current;
    const next = { ...prev, ...patch };
    if (next.active === prev.active && next.hoverKey === prev.hoverKey && next.hoverHalf === prev.hoverHalf) return;
    stateRef.current = next;
    listeners.current.forEach((l) => l());
  };

  const measureAll = useCallback(() => {
    lastMeasure.current = Date.now();
    measure(containerRef.current, (r) => (container.current = r));
    zones.current.forEach((zone, key) => {
      measure(zone.node, (r) => {
        if (stateRef.current.active && zones.current.get(key) === zone) rects.current.set(key, r);
      });
    });
    scrollers.current.forEach((s) => measure(s.ref.current, (r) => (s.rect = r)));
  }, []);

  const halfOf = (key, y) => {
    const r = rects.current.get(key);
    if (!r) return null;
    return y < r.y + r.h / 2 ? "before" : "after";
  };

  const setHover = (key, y) => setState({ hoverKey: key, hoverHalf: key ? halfOf(key, y) : null });

  // Smallest accepting zone under the pointer. Points outside the provider's container
  // are ignored, which also rules out zones scrolled out of view (their rects lie outside).
  const hitTest = (x, y) => {
    if (!contains(container.current, x, y)) return null;
    const type = stateRef.current.active?.type;
    let best = null;
    let bestArea = Infinity;
    rects.current.forEach((r, key) => {
      const zone = zones.current.get(key);
      if (!zone || !zone.accepts.includes(type) || !contains(r, x, y)) return;
      const area = r.w * r.h;
      if (area < bestArea) {
        best = key;
        bestArea = area;
      }
    });
    return best;
  };

  const place = (x, y) => {
    pos.setValue({ x: x - container.current.x - PREVIEW_W / 2, y: y - container.current.y - PREVIEW_H / 2 });
  };

  // Scroll step for one scroller (0 outside its edge zones). Speed grows with depth into
  // the zone: MIN_STEP at its inner edge up to MAX_STEP at the scroller's edge.
  const deltaFor = (s, x, y) => {
    const r = s.rect;
    if (!r || !contains(r, x, y)) return 0;
    const near = s.horizontal ? x - r.x : y - r.y;
    const size = s.horizontal ? r.w : r.h;
    const speed = (dist) => MIN_STEP + (MAX_STEP - MIN_STEP) * Math.min(1, Math.max(0, (EDGE - dist) / EDGE));
    let d = 0;
    if (near < EDGE) d = -speed(near);
    else if (near > size - EDGE) d = speed(size - near);
    // Only report a delta the scroller can actually apply.
    const max = Math.max(0, s.content - size);
    return (d < 0 && s.offset <= 0) || (d > 0 && s.offset >= max) ? 0 : d;
  };

  // Innermost (smallest) scroller under the pointer that can scroll toward the edge.
  const pickScroll = (x, y) => {
    let best = null;
    scrollers.current.forEach((s) => {
      if (!s.ref.current) return;
      const delta = deltaFor(s, x, y);
      if (!delta) return;
      const area = s.rect.w * s.rect.h;
      if (!best || area < best.area) best = { s, delta, area };
    });
    return best;
  };

  const stopTimer = () => {
    edgeSince.current = 0;
    if (timer.current) {
      clearInterval(timer.current);
      timer.current = null;
    }
  };

  // Shift cached rects of everything inside scroller `s` after it scrolled by `applied`.
  // "Inside" = centred within the scroller's cross-axis band (columns sit side by side).
  const shiftInside = (s, applied) => {
    const r = s.rect;
    const inside = (z) =>
      s.horizontal ? z.y + z.h / 2 >= r.y && z.y + z.h / 2 <= r.y + r.h : z.x + z.w / 2 >= r.x && z.x + z.w / 2 <= r.x + r.w;
    const shift = (z) => {
      if (!inside(z)) return;
      if (s.horizontal) z.x -= applied;
      else z.y -= applied;
    };
    rects.current.forEach(shift);
    scrollers.current.forEach((other) => other !== s && other.rect && shift(other.rect));
  };

  // One tick of the auto-scroll loop, using the last known pointer position.
  const tick = () => {
    if (!stateRef.current.active) return stopTimer();
    const { x, y } = lastPos.current;
    const pick = pickScroll(x, y);
    if (!pick) return stopTimer();
    if (Date.now() - edgeSince.current < DWELL) return; // still dwelling
    const { s, delta } = pick;
    const size = s.horizontal ? s.rect.w : s.rect.h;
    const max = Math.max(0, s.content - size);
    const next = Math.min(max, Math.max(0, s.offset + delta));
    const applied = next - s.offset;
    if (!applied) return stopTimer(); // content end reached
    s.offset = next;
    s.ref.current.scrollTo(s.horizontal ? { x: next, animated: false } : { y: next, animated: false });
    shiftInside(s, applied);
    setHover(hitTest(x, y), y);
    if (Date.now() - lastMeasure.current > 100) measureAll();
  };

  const autoScroll = (x, y) => {
    lastPos.current = { x, y };
    if (!pickScroll(x, y)) stopTimer();
    else if (!timer.current) {
      edgeSince.current = Date.now();
      timer.current = setInterval(tick, 16);
    }
  };

  useEffect(() => stopTimer, []);

  const finish = () => {
    stopTimer();
    setPreview(null);
    setState(IDLE);
  };

  const api = useMemo(
    () => ({
      subscribe(listener) {
        listeners.current.add(listener);
        return () => listeners.current.delete(listener);
      },
      getState: () => stateRef.current,
      registerZone(key, zone) {
        zones.current.set(key, zone);
      },
      unregisterZone(key, zone) {
        if (zones.current.get(key) === zone) {
          zones.current.delete(key);
          rects.current.delete(key);
        }
      },
      addScroller(info) {
        scrollers.current.add(info);
        return () => scrollers.current.delete(info);
      },
      begin(payload, x, y) {
        lastPos.current = { x, y };
        rects.current = new Map();
        setState({ active: payload, hoverKey: null, hoverHalf: null });
        setPreview(payload);
        place(x, y); // container offset arrives async; re-place once measured
        measure(containerRef.current, (r) => {
          container.current = r;
          if (stateRef.current.active) place(x, y);
        });
        measureAll();
      },
      move(x, y) {
        if (!stateRef.current.active) return;
        place(x, y);
        autoScroll(x, y);
        setHover(hitTest(x, y), y);
      },
      end() {
        const payload = stateRef.current.active;
        if (!payload) return;
        // Re-run the hit test on the (post-scroll) rects so the drop matches what is under the pointer.
        const { x, y } = lastPos.current;
        const dropKey = hitTest(x, y);
        const zone = dropKey ? zones.current.get(dropKey) : null;
        const rect = dropKey ? rects.current.get(dropKey) : null;
        const half = dropKey ? halfOf(dropKey, y) : null;
        finish();
        if (zone) zone.onDrop(payload, { x, y, rect, half });
      },
      cancel() {
        if (stateRef.current.active) finish();
        else stopTimer();
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [measureAll]
  );

  return (
    <ApiContext.Provider value={api}>
      <View ref={containerRef} collapsable={false} style={[styles.container, style]}>
        {children}
        {preview ? (
          <Animated.View pointerEvents="none" style={[styles.preview, { transform: pos.getTranslateTransform() }]}>
            <View style={styles.pill}>
              <Text style={styles.pillText} numberOfLines={1}>{preview.label}</Text>
            </View>
          </Animated.View>
        ) : null}
      </View>
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
