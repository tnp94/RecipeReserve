// jest-expo runs as iOS by default, which is the platform the gate is active on.
import React from "react";
import TestRenderer, { act } from "react-test-renderer";
import { Platform } from "react-native";
import { useGatedModal } from "../modalGate";

const probes = {};
function Probe({ name, visible }) {
  probes[name] = useGatedModal(visible);
  return null;
}
const render = (els) => {
  let r;
  act(() => { r = TestRenderer.create(<>{els}</>); });
  return r;
};

describe("useGatedModal (iOS)", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it("runs on iOS in this test environment", () => expect(Platform.OS).toBe("ios"));

  it("shows immediately when nothing is dismissing", () => {
    render(<Probe name="a" visible />);
    expect(probes.a.shown).toBe(true);
  });

  it("waits for the previous modal's onDismiss before showing the next", () => {
    const r = render([<Probe key="a" name="a" visible />, <Probe key="b" name="b" visible={false} />]);
    act(() => r.update(<><Probe key="a" name="a" visible={false} /><Probe key="b" name="b" visible /></>));
    expect(probes.a.shown).toBe(false);
    expect(probes.b.shown).toBe(false); // a is still fading out
    act(() => probes.a.onDismiss());
    expect(probes.b.shown).toBe(true);
  });

  it("falls back to a timer when onDismiss never comes", () => {
    const r = render([<Probe key="a" name="a" visible />, <Probe key="b" name="b" visible={false} />]);
    act(() => r.update(<><Probe key="a" name="a" visible={false} /><Probe key="b" name="b" visible /></>));
    expect(probes.b.shown).toBe(false);
    act(() => jest.advanceTimersByTime(700));
    expect(probes.b.shown).toBe(true);
  });

  it("treats unmounting a shown modal as a dismiss (no onDismiss)", () => {
    const r = render([<Probe key="a" name="a" visible />]);
    act(() => r.update(<><Probe key="b" name="b" visible /></>)); // a unmounts while shown
    expect(probes.b.shown).toBe(false);
    act(() => jest.advanceTimersByTime(700));
    expect(probes.b.shown).toBe(true);
  });

  it("re-shows the same modal after its own dismiss (dialog -> dialog)", () => {
    const r = render(<Probe name="a" visible />);
    act(() => r.update(<Probe name="a" visible={false} />));
    act(() => r.update(<Probe name="a" visible />));
    expect(probes.a.shown).toBe(false);
    act(() => probes.a.onDismiss());
    expect(probes.a.shown).toBe(true);
  });
});
