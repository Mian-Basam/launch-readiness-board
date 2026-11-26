import React from "react";
import { ws_start, ws_subscribe } from "../../../mocks/ws.js";

export function usePresence() {
  const [snap, setSnap] = React.useState({ users: [] });

  React.useEffect(() => {
    ws_start();
    return ws_subscribe(setSnap);
  }, []);

  return snap;
}