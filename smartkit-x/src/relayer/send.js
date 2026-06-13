async function send7710(url, payload) {
  const res = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
  const json = await res.json();
  if (json.error) throw new Error(JSON.stringify(json.error, null, 2));
  return json;
}
module.exports = { send7710 };
