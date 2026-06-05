import "dotenv/config";

const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`;

const res = await fetch(url);
const data = await res.json();

if (!res.ok) {
  console.error("Error:", data);
  process.exit(1);
}

const models = (data.models || []).map((m) => ({
  name: m.name, 
  methods: m.supportedGenerationMethods, 
}));

console.log(models);