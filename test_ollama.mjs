import { Ollama } from 'ollama';
const ollama = new Ollama();

async function run() {
  try {
    const list = await ollama.list();
    console.log("Success:", list.models.map(m => m.name));
  } catch (e) {
    console.error("Failed:", e);
  }
}
run();
