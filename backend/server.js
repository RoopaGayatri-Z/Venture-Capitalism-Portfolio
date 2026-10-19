import "dotenv/config";
import fs from "node:fs";
import express from "express";
import cors from "cors";
import neo4j from "neo4j-driver";

const driver = neo4j.driver(
  process.env.NEO4J_URI || "bolt://localhost:7687",
  neo4j.auth.basic(process.env.NEO4J_USER || "neo4j", process.env.NEO4J_PASSWORD),
  { disableLosslessIntegers: true }); // return plain JS numbers

class HttpError extends Error { constructor(status, msg) { super(msg); this.status = status; } }

async function run(cypher, params = {}, write = false) {
  const session = driver.session();
  try {
    const res = await (write ? session.executeWrite : session.executeRead).call(session, (tx) => tx.run(cypher, params));
    return res.records.map((r) => r.toObject());
  } finally { await session.close(); }
}

const app = express();
app.use(cors(), express.json());
const route = (fn) => (req, res, next) => fn(req, res).catch(next);

/* ---------- Graph model ----------
 (VCFirm)-[:MANAGES]->(VCFund)-[:INVESTED_IN {amount, date, stage...}]->(Startup)
 (LimitedPartner)-[:INVESTS_IN {contribution...}]->(VCFund)
 (Startup)-[:HAS_ROUND]->(FundingRound)      (Startup)-[:HAS_EXIT]->(Exit)          */
const SPEC = {
  vc_firm: { label: "VCFirm", id: "vc_firm_id", req: ["firm_name"],
    props: ["firm_name", "headquarters", "founded_year", "website", "contact_email", "assets_under_management"] },
  vc_fund: { label: "VCFund", id: "fund_id", req: ["vc_firm_id", "fund_name"],
    props: ["fund_name", "fund_size", "vintage_year", "fund_status", "investment_focus"],
    parent: { label: "VCFirm", key: "vc_firm_id", rel: "MANAGES" } },
  limited_partner: { label: "LimitedPartner", id: "lp_id", req: ["lp_name"],
    props: ["lp_name", "lp_type", "contact_email", "phone_number", "country"] },
  startup: { label: "Startup", id: "startup_id", req: ["startup_name", "industry"],
    props: ["startup_name", "industry", "founded_year", "headquarters", "founder_name", "valuation"] },
  funding_round: { label: "FundingRound", req: ["startup_id", "round_no"], dates: ["round_date"],
    props: ["round_no", "round_type", "round_date", "total_raised", "lead_investor"],
    parent: { label: "Startup", key: "startup_id", rel: "HAS_ROUND", where: "NOT (a)-[:HAS_ROUND]->(:FundingRound {round_no: $p.round_no})" } },
  exit: { label: "Exit", id: "exit_id", req: ["startup_id"], dates: ["exit_date"],
    props: ["exit_type", "exit_date", "exit_value", "acquiring_company"],
    parent: { label: "Startup", key: "startup_id", rel: "HAS_EXIT", where: "NOT (a)-[:HAS_EXIT]->()" } },
  investment: { id: "investment_id", dates: ["investment_date"],
    req: ["fund_id", "startup_id", "investment_amount", "investment_date"],
    props: ["investment_amount", "investment_date", "equity_percentage", "investment_stage"],
    edge: { from: ["VCFund", "fund_id"], to: ["Startup", "startup_id"], rel: "INVESTED_IN" } },
  lp_investment: { id: "lp_investment_id", dates: ["contribution_date"],
    req: ["lp_id", "fund_id", "contribution_amount", "contribution_date"],
    props: ["contribution_amount", "contribution_date", "ownership_percentage"],
    edge: { from: ["LimitedPartner", "lp_id"], to: ["VCFund", "fund_id"], rel: "INVESTS_IN" } },
};

const plain = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, v && typeof v === "object" ? v.toString() : v]));

async function insert(table, body) {
  const s = Object.hasOwn(SPEC, table) ? SPEC[table] : null;
  if (!s) throw new HttpError(404, "Unknown table");
  const missing = s.req.filter((k) => body[k] === undefined || body[k] === "");
  if (missing.length) throw new HttpError(400, "Missing required field(s): " + missing.join(", "));

  const p = {};
  for (const k of s.props) if (body[k] !== undefined) p[k] = Number.isInteger(body[k]) ? neo4j.int(body[k]) : body[k];
  const dates = (s.dates || []).map((d) => ` SET v.${d} = date($p.${d})`).join("");

  let cy, params;
  if (s.edge) {
    const { from, to, rel } = s.edge;
    cy = `MATCH (a:${from[0]} {${from[1]}: $a}), (b:${to[0]} {${to[1]}: $b})
          CREATE (a)-[v:${rel}]->(b) SET v = $p${dates} RETURN properties(v) AS row`;
    params = { a: neo4j.int(body[from[1]]), b: neo4j.int(body[to[1]]) };
  } else if (s.parent) {
    const { label, key, rel, where } = s.parent;
    cy = `MATCH (a:${label} {${key}: $a}) ${where ? "WHERE " + where : ""}
          CREATE (a)-[:${rel}]->(v:${s.label}) SET v = $p${dates} RETURN properties(v) AS row`;
    params = { a: neo4j.int(body[key]) };
  } else {
    cy = `CREATE (v:${s.label}) SET v = $p${dates} RETURN properties(v) AS row`;
    params = {};
  }

  const session = driver.session();
  try {
    return await session.executeWrite(async (tx) => {
      if (s.id) { // auto-increment numeric id via a counter node
        const r = await tx.run(`MERGE (c:Counter {name: $n}) ON CREATE SET c.value = 0
                                SET c.value = c.value + 1 RETURN c.value AS id`, { n: s.id });
        p[s.id] = neo4j.int(r.records[0].get("id"));
      }
      const res = await tx.run(cy, { ...params, p });
      if (!res.records.length) throw new HttpError(400, "Referenced record not found, or it already exists");
      return plain(res.records[0].get("row"));
    });
  } finally { await session.close(); }
}

/* ---------- Analytics ---------- */
app.get("/api/kpis", route(async (_req, res) => {
  const [row] = await run(`
    MATCH (s:Startup) WITH count(s) AS startups
    MATCH (f:VCFund) WITH startups, count(f) AS funds
    OPTIONAL MATCH ()-[i:INVESTED_IN]->()
    RETURN startups, funds, count(i) AS investments, coalesce(sum(i.investment_amount), 0) AS total_invested`);
  res.json(row);
}));

app.get("/api/funds/totals", route(async (_req, res) => {
  res.json(await run(`
    MATCH (v:VCFirm)-[:MANAGES]->(f:VCFund)
    OPTIONAL MATCH (f)-[i:INVESTED_IN]->(s:Startup)
    RETURN f.fund_id AS fund_id, f.fund_name AS fund_name, v.firm_name AS firm_name,
           coalesce(sum(i.investment_amount), 0) AS total, count(DISTINCT s) AS startups
    ORDER BY total DESC`));
}));

app.get("/api/funds/large", route(async (req, res) => {
  res.json(await run(`
    MATCH (f:VCFund)-[i:INVESTED_IN]->(s:Startup)
    WITH f, count(DISTINCT s) AS startups, sum(i.investment_amount) AS total
    WHERE startups >= $min
    RETURN f.fund_id AS fund_id, f.fund_name AS fund_name, startups, total
    ORDER BY startups DESC, total DESC`, { min: Number(req.query.min) || 5 }));
}));

app.get("/api/startups/top", route(async (req, res) => {
  res.json(await run(`
    MATCH (s:Startup)
    OPTIONAL MATCH (:VCFund)-[i:INVESTED_IN]->(s)
    RETURN s.startup_id AS startup_id, s.startup_name AS startup_name, s.industry AS industry,
           s.founded_year AS founded_year, s.valuation AS valuation,
           coalesce(sum(i.investment_amount), 0) AS invested
    ORDER BY valuation DESC LIMIT $limit`, { limit: neo4j.int(Math.min(Number(req.query.limit) || 8, 100)) }));
}));

app.get("/api/industries", route(async (_req, res) => {
  res.json(await run(`
    MATCH (s:Startup)
    OPTIONAL MATCH (:VCFund)-[i:INVESTED_IN]->(s)
    RETURN s.industry AS industry, count(DISTINCT s) AS startups, coalesce(sum(i.investment_amount), 0) AS total
    ORDER BY total DESC`));
}));

app.get("/api/industries/compare", route(async (req, res) => {
  const { a, b } = req.query;
  if (!a || !b) throw new HttpError(400, "Provide a and b");
  res.json(await run(`
    MATCH (s:Startup) WHERE s.industry IN [$a, $b]
    OPTIONAL MATCH (:VCFund)-[i:INVESTED_IN]->(s)
    WITH s.industry AS industry, count(DISTINCT s) AS startups, coalesce(sum(i.investment_amount), 0) AS total
    RETURN industry, startups, total, toFloat(total) / startups AS avg_per_startup`, { a, b }));
}));

// Monthly capital deployed by a fund (computed on demand)
app.get("/api/funds/:id/monthly", route(async (req, res) => {
  res.json(await run(`
    MATCH (:VCFund {fund_id: $id})-[i:INVESTED_IN]->()
    WITH date.truncate('month', i.investment_date) AS m, sum(i.investment_amount) AS deployed, count(*) AS deals
    RETURN toString(m) AS month, deployed, deals ORDER BY month`, { id: neo4j.int(Number(req.params.id)) }));
}));

/* ---------- Writes ---------- */
app.post("/api/data/:table", route(async (req, res) => res.status(201).json(await insert(req.params.table, req.body))));
app.post("/api/investments", route(async (req, res) => res.status(201).json(await insert("investment", req.body))));

app.use((err, _req, res, _next) => {
  const status = err.status || (String(err.code).startsWith("Neo.ClientError") ? 400 : 500);
  if (status === 500) console.error(err);
  res.status(status).json({ error: status === 500 ? "Internal server error" : err.message });
});

/* ---------- Start ---------- */
const statements = fs.readFileSync(new URL("./db/init.cypher", import.meta.url), "utf8")
  .split(";").map((s) => s.trim()).filter(Boolean);
try {
  for (const st of statements) await run(st, {}, true);
} catch (e) {
  console.error("Could not reach Neo4j. Is it running (docker compose up -d) and are the .env credentials right?\n", e.message);
  process.exit(1);
}
const port = process.env.PORT || 4000;
app.listen(port, () => console.log("API listening on :" + port));
