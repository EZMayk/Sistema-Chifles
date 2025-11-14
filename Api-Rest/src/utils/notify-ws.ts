import fetch from "node-fetch";

const WS_URL = process.env.WS_URL;
const WS_SECRET = process.env.WS_SECRET;


//Envía un evento al servidor WebSocket (Go)
export async function notifyWebSocket(type: string, payload: any) {
  if (!WS_URL || !WS_SECRET) {
    console.warn("WebSocket no configurado ");
    return;
  }

  try {
    const response = await fetch(WS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-WS-SECRET": WS_SECRET,
      },
      body: JSON.stringify({ type, payload }),
    });

    if (!response.ok) {
      console.error(`Error enviando evento WebSocket (${response.status})`);
    } else {
      console.log(`Evento WebSocket enviado: ${type}`);
    }
  } catch (err) {
    console.error("No se pudo conectar al servidor WebSocket:", err);
  }
}
