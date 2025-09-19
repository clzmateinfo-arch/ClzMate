// src/features/courseViewer/Whiteboard.jsx
import React, { useCallback, useEffect, useRef, useState, forwardRef, useImperativeHandle } from "react";
import { Excalidraw } from "@excalidraw/excalidraw";

/**
 * Whiteboard component that persists scene to localStorage and exposes imperative methods.
 *
 * Exposed methods via ref:
 *  - exportJson()
 *  - importFile(file)
 *  - importJson(parsed)
 *  - clear()
 *
 * Props:
 *  - courseId (string) used for localStorage key
 *  - onStatusChange (fn) called with "idle" | "saving" | "saved" | "cleared"
 */
const Whiteboard = forwardRef(function Whiteboard({ courseId = "global", onStatusChange = () => { } }, ref) {
  const excalRef = useRef(null);
  const storageKey = `whiteboard:${courseId}`;
  const [status, setStatus] = useState("idle"); // idle | saving | saved | cleared
  const saveTimer = useRef(null);

  // Load initial scene once (on mount)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw && excalRef.current?.updateScene) {
        const parsed = JSON.parse(raw);
        excalRef.current.updateScene(parsed);
      }
    } catch (e) {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  // schedule save (debounced)
  const scheduleSave = useCallback(
    (data) => {
      setStatus("saving");
      onStatusChange("saving");
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        try {
          localStorage.setItem(storageKey, JSON.stringify(data));
          setStatus("saved");
          onStatusChange("saved");
          setTimeout(() => {
            setStatus("idle");
            onStatusChange("idle");
          }, 900);
        } catch (e) {
          setStatus("idle");
          onStatusChange("idle");
        }
      }, 600);
    },
    [storageKey, onStatusChange]
  );

  const onChange = useCallback(
    (elements, state) => {
      const payload = { elements, appState: state };
      scheduleSave(payload);
    },
    [scheduleSave]
  );

  // Expose imperative API to parent
  useImperativeHandle(ref, () => ({
    exportJson: () => {
      try {
        const raw = localStorage.getItem(storageKey) || "{}";
        const blob = new Blob([raw], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `whiteboard-${courseId || "scene"}.json`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      } catch (e) {
        // ignore
      }
    },
    importFile: (file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const parsed = JSON.parse(ev.target.result);
          if (excalRef.current?.updateScene) excalRef.current.updateScene(parsed);
          localStorage.setItem(storageKey, JSON.stringify(parsed));
          setStatus("saved");
          onStatusChange("saved");
          setTimeout(() => {
            setStatus("idle");
            onStatusChange("idle");
          }, 700);
        } catch (err) {
          // ignore parse errors
        }
      };
      reader.readAsText(file);
    },
    importJson: (parsed) => {
      try {
        if (excalRef.current?.updateScene) excalRef.current.updateScene(parsed);
        localStorage.setItem(storageKey, JSON.stringify(parsed));
        setStatus("saved");
        onStatusChange("saved");
        setTimeout(() => {
          setStatus("idle");
          onStatusChange("idle");
        }, 700);
      } catch (err) {
        // ignore
      }
    },
    clear: () => {
      try {
        if (excalRef.current?.resetScene) {
          excalRef.current.resetScene();
        } else if (excalRef.current?.updateScene) {
          excalRef.current.updateScene({ elements: [], appState: { viewBackgroundColor: "transparent" } });
        }
        localStorage.removeItem(storageKey);
        setStatus("cleared");
        onStatusChange("cleared");
        setTimeout(() => {
          setStatus("idle");
          onStatusChange("idle");
        }, 700);
      } catch (e) {
        // ignore
      }
    },
    getStatus: () => status,
  }), [courseId, storageKey, onStatusChange, status]);

  // Default initial data: transparent background so underlying UI is visible
  const initialData = {
    elements: [],
    appState: {
      viewBackgroundColor: "transparent",
    },
  };

  return (
    <div className="w-full h-full relative">
      <div className="w-full h-full" style={{ width: "100%", height: "100%" }}>
        <Excalidraw
          ref={excalRef}
          onChange={onChange}
          initialData={initialData}
          zenModeEnabled={false}
          gridModeEnabled={false}
          theme="light"
        />
      </div>
    </div>
  );
});

export default Whiteboard;
