require("dotenv").config();
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const VENICE_API_KEY = process.env.VENICE_API_KEY;
const STATIC_DIR = path.join(__dirname, "static");
if (!fs.existsSync(STATIC_DIR)) fs.mkdirSync(STATIC_DIR);

async function generateDiagram(contractName) {
  try {
    const prompt = `Technical architecture diagram: "${contractName}". Smart contract flow with User, Contract, Treasury. Dark futuristic background, neon cyan and magenta arrows, labeled nodes.`;
    const response = await axios.post(
      "https://api.venice.ai/api/v1/image/generate",
      { model: "flux-2-max", prompt, width: 512, height: 512, steps: 20 },
      { headers: { Authorization: `Bearer ${VENICE_API_KEY}`, "Content-Type": "application/json" }, timeout: 120000 }
    );
    const images = response.data.images;
    if (images && images.length > 0) return { url: `data:image/png;base64,${images[0]}`, prompt };
    return null;
  } catch(e) { console.log(`Diagram: ${e.message.slice(0,40)}`); return null; }
}

async function generateSpeech(text) {
  const debugStart = Date.now();
  console.log(`🎤 [DEBUG] Request start: ${new Date().toISOString()}`);
  console.log(`🎤 [DEBUG] Text length: ${text.length} chars`);
  console.log(`🎤 [DEBUG] Text preview: ${text.slice(0,100)}...`);
  console.log(`🎤 [DEBUG] Text last 100: ...${text.slice(-100)}`);

  try {
    const response = await axios.post(
      "https://api.venice.ai/api/v1/audio/speech",
      { model: "tts-elevenlabs-turbo-v2-5", input: text, speed: 1.0 },
      { headers: { Authorization: `Bearer ${VENICE_API_KEY}`, "Content-Type": "application/json" }, timeout: 300000, responseType: 'arraybuffer' }
    );

    const debugEnd = Date.now(); console.log(`🎤 [DEBUG] Request end: ${new Date().toISOString()}`); console.log(`🎤 [DEBUG] Round trip: ${debugEnd - debugStart}ms`); const audioBuffer = Buffer.from(response.data); console.log(`🎤 [DEBUG] Audio bytes received: ${audioBuffer.length}`); const responseSize = response.data.length || response.data.byteLength || 0; console.log(`🎤 [DEBUG] Raw response size: ${responseSize}`); const filename = `audio-${Date.now()}.mp3`; const filepath = path.join(STATIC_DIR, filename); fs.writeFileSync(filepath, audioBuffer); const fixedFile = filepath.replace('.mp3', '-fixed.mp3'); try { console.log(`🔧 Re-encoding for browser compatibility...`); execSync(`ffmpeg -y -i ${filepath} -c:a libmp3lame -b:a 128k ${fixedFile} 2>/dev/null`); const origSize = fs.statSync(filepath).size; const fixedSize = fs.statSync(fixedFile).size; if (fixedSize > 1000) { fs.renameSync(fixedFile, filepath); console.log(`✅ Re-encoded: ${origSize} → ${fixedSize} bytes`); } } catch(e) { console.log(`⚠️ Re-encode skipped: ${e.message.slice(0,40)}`); } try { const dur = execSync(`ffprobe -v quiet -show_entries format=duration -of csv=p=0 ${filepath} 2>&1`, { encoding: 'utf8', timeout: 5000 }).trim(); console.log(`✅ Duration: ${dur}s | Size: ${fs.statSync(filepath).size} bytes`); } catch(e) {} return `/static/${filename}`; 

  } catch(e) {
    console.log(`🎤 [DEBUG] ERROR: ${e.message}`);
    console.log(`🎤 [DEBUG] Error code: ${e.code || 'none'}`);
    if (e.response) console.log(`🎤 [DEBUG] Response status: ${e.response.status}`);
    return null;
  }
}

async function generateAudioFile(contractName, contractCode, userPrompt, vaultPatternsUsed, diagramPrompt) {
  try {
    const systemPrompt = `You are Venice, the AI protocol architect. Your explanation must follow this exact structure with these section transitions:

 "I generated a [what you built]. The goal is [purpose — what problem it solves, who it serves]."
 "To design it, I searched the protocol memory vault and found patterns related to [specific patterns used]. Those patterns influenced the structure of this implementation."
 "This kind of contract is useful for [audience/use case — who needs this and why]."
 "The primary risk is [main tradeoff or vulnerability]. [Explain the consequence if mismanaged]."
 "The architecture diagram you're viewing shows how [the key components] interact inside the protocol."

Rules:
- Be conversational, like you're walking someone through your design thinking.
- Never mention model names, APIs, or that you're an AI.
- Reference the vault patterns by name if provided.
- Keep it around 180-220 words.
- End by acknowledging the two-layer experience: the diagram shows structure, your voice explains intent.
- When describing the diagram, speak naturally about what it depicts. You know the diagram shows a dark futuristic layout with the contract's core components connected by directional flows. Describe it like an architect would — don't list technical specs.`;

    const userMessage = `Request: "${userPrompt}".\nContract Name: ${contractName}\nContract Code:\n${(contractCode||'').slice(0,1500)}\n${vaultPatternsUsed ? 'Vault patterns found and used: ' + vaultPatternsUsed + '.' : 'No specific vault patterns were matched.'}\n\nExplain your design following the structure.`;

    const response = await axios.post( "https://api.venice.ai/api/v1/chat/completions", { model: "llama-3.2-3b", messages: [{role:"system",content:systemPrompt},{role:"user",content:userMessage}], max_tokens: 350, temperature: 0.7 }, { headers: { Authorization: `Bearer ${VENICE_API_KEY}`, "Content-Type":"application/json" }, timeout: 30000 } ); const explanation = response.data.choices[0].message.content; console.log(`📝 Architect (${explanation.length}c): ${explanation.slice(0,80)}...`); const audioUrl = await generateSpeech(explanation); return { audioUrl, explanationText: explanation }; 

  } catch(e) { console.log(`Audio: ${e.message.slice(0,40)}`); return null; }
}

async function generateMultimodal(contractName, userPrompt, vaultPatternsUsed, contractCode) {
  console.log(`\n🎨 Venice Multimodal: ${contractName}`);
  const diagramResult = await generateDiagram(contractName);
  const audioResult = await generateAudioFile(contractName, contractCode, userPrompt, vaultPatternsUsed, diagramResult?.prompt || null);
  return {
    diagramUrl: diagramResult?.url || null,
    audioUrl: audioResult?.audioUrl || null,
    explanationText: audioResult?.explanationText || null,
  };
}

module.exports = { generateMultimodal };
