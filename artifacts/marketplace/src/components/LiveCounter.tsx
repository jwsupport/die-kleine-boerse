import { useEffect, useState, useRef } from "react";
import { Circle } from "lucide-react";

const BASE = import.meta.env.BASE_URL.replace(/\/+$/, "");
const PING_INTERVAL = 45_000; // 45 s

function getSessionId(): string {
  let sid = localStorage.getItem("_vsid");
  if (!sid) {
    sid = crypto.randomUUID();
    localStorage.setItem("_vsid", sid);
  }
  return sid;
}

export function LiveCounter() {
  const [online, setOnline] = useState<number | null>(null);
  const pathRef = useRef(window.location.pathname);

  const ping = async () => {
    try {
      const res = await fetch(`${BASE}/api/analytics/ping`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: getSessionId(), path: pathRef.current }),
      });
      if (res.ok) {
        const data = await res.json();
        setOnline(data.online ?? null);
      }
    } catch {}
  };

  useEffect(() => {
    ping();
    const id = setInterval(ping, PING_INTERVAL);
    return () => clearInterval(id);
  }, []);

  if (online === null) return null;

  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-400 select-none">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
      </span>
      {online === 1 ? "1 online" : `${online} online`}
    </span>
  );
}
