// Loads a realistic sample dataset (8 firms, 14 funds, 30 LPs, 25 startups, 30 rounds, 6 exits,
// 30 investments, 30 LP commitments). Usage: npm run seed   (add -- --reset to wipe existing data first)
// Amounts and valuations are in $M. Data is generated with a fixed seed, so every run gives the same result.
import "dotenv/config";
import neo4j from "neo4j-driver";

const driver = neo4j.driver(
  process.env.NEO4J_URI || "bolt://localhost:7687",
  neo4j.auth.basic(process.env.NEO4J_USER || "neo4j", process.env.NEO4J_PASSWORD));

/* ---------- helpers ---------- */
let seed = 42;
const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const between = (a, b) => a + Math.floor(rnd() * (b - a + 1));
const pick = (a) => a[Math.floor(rnd() * a.length)];
const pad = (n) => String(n).padStart(2, "0");
const iso = (y) => `${y}-${pad(between(1, 12))}-${pad(between(1, 28))}`;
const obj = (keys, data) => data.map((d) => Object.fromEntries(keys.map((k, i) => [k, d[i]])));
const fix = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, Number.isInteger(v) ? neo4j.int(v) : v]));

/* ---------- 8 VC firms ---------- */
const firms = obj(["id", "name", "hq", "year", "site", "email", "aum"], [
  [1, "Orbit Capital", "Bengaluru", 2010, "orbitcapital.in", "hello@orbitcapital.in", 2400],
  [2, "Meridian Partners", "Mumbai", 2008, "meridianpartners.com", "info@meridianpartners.com", 3100],
  [3, "Northstar Ventures", "Chennai", 2013, "northstarvc.in", "contact@northstarvc.in", 1200],
  [4, "Helix Capital", "Hyderabad", 2012, "helixcapital.com", "team@helixcapital.com", 1300],
  [5, "Greenfield Ventures", "Pune", 2015, "greenfield.vc", "hello@greenfield.vc", 700],
  [6, "Lumen Capital", "New Delhi", 2011, "lumencap.com", "info@lumencap.com", 500],
  [7, "Pinnacle Partners", "Singapore", 2009, "pinnaclepartners.sg", "ir@pinnaclepartners.sg", 3600],
  [8, "Zenith Growth", "San Francisco", 2014, "zenithgrowth.com", "team@zenithgrowth.com", 2800]]);

/* ---------- 14 funds (firms run 1 to 3 each) ---------- */
const funds = obj(["id", "firm", "name", "size", "vintage", "status", "focus"], [
  [1, 1, "Apex Growth I", 700, 2016, "Closed", "FinTech"],
  [2, 1, "Apex Growth II", 1100, 2020, "Active", "FinTech"],
  [3, 1, "Apex Seed III", 250, 2023, "Active", "Early stage"],
  [4, 2, "Meridian Fund I", 800, 2016, "Closed", "SaaS"],
  [5, 2, "Meridian Fund II", 1400, 2019, "Active", "SaaS"],
  [6, 2, "Meridian Impact", 450, 2021, "Active", "CleanTech"],
  [7, 3, "Northstar Fund I", 500, 2017, "Closed", "Generalist"],
  [8, 3, "Northstar Fund II", 900, 2022, "Active", "Generalist"],
  [9, 4, "Helix Bio I", 350, 2017, "Closed", "Healthcare"],
  [10, 4, "Helix Bio II", 600, 2021, "Active", "Healthcare"],
  [11, 5, "Greenfield Climate", 380, 2022, "Active", "CleanTech"],
  [12, 6, "Lumen EdTech Fund", 180, 2019, "Active", "EdTech"],
  [13, 7, "Pinnacle Global", 1500, 2018, "Active", "Growth"],
  [14, 8, "Zenith Growth II", 1000, 2022, "Fundraising", "Growth"]]);

/* ---------- 25 startups (3 are bootstrapped: no VC funding) ---------- */
const startups = obj(["id", "name", "industry", "year", "hq", "founder", "valuation"], [
  [1, "PayLoom", "FinTech", 2016, "Chennai", "Arjun Kumar", 820],
  [2, "CloudMint", "SaaS", 2016, "Bengaluru", "Sanjay Iyer", 1200],
  [3, "MediNova", "Healthcare", 2017, "Bengaluru", "Dr. Priya Raman", 950],
  [4, "LedgerLeaf", "FinTech", 2017, "Mumbai", "Neha Shah", 430],
  [5, "SolarWeave", "CleanTech", 2017, "Ahmedabad", "Vikram Desai", 670],
  [6, "Stackly", "SaaS", 2018, "Pune", "Rahul Verma", 540],
  [7, "GenePath", "Healthcare", 2018, "Hyderabad", "Dr. Farah Khan", 720],
  [8, "LearnLoop", "EdTech", 2018, "New Delhi", "Karthik Subramanian", 240],
  [9, "CoinHarbor", "FinTech", 2018, "Mumbai", "Aditi Rao", 610],
  [10, "FlowDesk", "SaaS", 2019, "Pune", "Meera Nair", 260],
  [11, "CareGrid", "Healthcare", 2019, "Hyderabad", "Rohit Menon", 380],
  [12, "VoltPeak", "CleanTech", 2019, "Chennai", "Ananya Krishnan", 310],
  [13, "Tutora", "EdTech", 2019, "Bengaluru", "Sneha Pillai", 180],
  [14, "RiskRiver", "FinTech", 2020, "Gurugram", "Manish Gupta", 290],
  [15, "VitalSync", "Healthcare", 2020, "Bengaluru", "Dr. Imran Sheikh", 350],
  [16, "QueryLeaf", "SaaS", 2020, "Kochi", "Joseph Mathew", 420],
  [17, "GridPulse", "CleanTech", 2020, "Pune", "Harini Das", 280],
  [18, "SkillBridge", "EdTech", 2021, "Mumbai", "Vivek Joshi", 150],
  [19, "TaxNest", "FinTech", 2021, "Bengaluru", "Pooja Kulkarni", 330],
  [20, "ClinicFlow", "Healthcare", 2021, "Chennai", "Dr. Anil George", 270],
  [21, "BuildKit", "SaaS", 2021, "Hyderabad", "Tarun Reddy", 200],
  [22, "AquaRenew", "CleanTech", 2022, "Chennai", "Lakshmi Narayan", 190],
  [23, "PrepPal", "EdTech", 2022, "Jaipur", "Nikhil Bansal", 90],
  [24, "SwiftCover", "FinTech", 2022, "Mumbai", "Kavya Menon", 160],
  [25, "SignalDesk", "SaaS", 2022, "Pune", "Aman Sethi", 210]]);
const bootstrapped = new Set([6, 14, 21]);
const invested = startups.filter((s) => !bootstrapped.has(s.id));

/* ---------- 30 limited partners ---------- */
const LP_NAMES = ["Kestrel", "Redwood", "Banyan", "Sundaram", "Nordic", "Atlas", "Maple", "Jade", "Cedar", "Horizon",
  "Silverline", "Orchid", "Granite", "Lotus", "Summit", "Harbor", "Evergreen", "Falcon", "Indigo", "Marlin",
  "Ashoka", "Zephyr", "Coral", "Birch", "Sable", "Tamarind", "Quartz", "Willow", "Cobalt", "Ember"];
const LP_TYPES = [["Pension fund", "Pension Fund"], ["Endowment", "Endowment"], ["Family office", "Family Office"],
  ["Corporate", "Corporate Ventures"], ["Fund of funds", "Fund of Funds"], ["Sovereign fund", "Sovereign Fund"]];
const COUNTRIES = [["India", "in", "+91"], ["India", "in", "+91"], ["India", "in", "+91"], ["United States", "com", "+1"],
  ["Singapore", "sg", "+65"], ["United Kingdom", "co.uk", "+44"], ["UAE", "ae", "+971"], ["Germany", "de", "+49"],
  ["Sweden", "se", "+46"], ["Canada", "ca", "+1"], ["Australia", "com.au", "+61"], ["Japan", "jp", "+81"]];
const lps = LP_NAMES.map((n, i) => {
  const [type, suffix] = pick(LP_TYPES), [country, tld, code] = pick(COUNTRIES);
  return { id: i + 1, name: `${n} ${suffix}`, type, email: `invest@${n.toLowerCase()}.${tld}`,
    phone: `${code} ${between(20, 99)} ${between(1000, 9999)} ${between(1000, 9999)}`, country };
});

/* ---------- 30 investments: 22 first cheques + 5 next-round follow-ons + 3 co-investments ---------- */
const STAGES = ["Seed", "Series A", "Series B", "Series C"];
const AMT = { Seed: [2, 8], "Series A": [8, 25], "Series B": [20, 50], "Series C": [40, 80] };
const EQ = { Seed: [80, 150], "Series A": [60, 120], "Series B": [40, 80], "Series C": [20, 50] }; // tenths of a percent
const GEN = ["Generalist", "Growth", "Early stage"];
const year = (d) => +d.slice(0, 4);
// A fund must exist by the time it invests; it prefers its own sector or a generalist mandate; big funds are chosen more often.
const choose = (industry, y) => {
  const ok = funds.filter((f) => f.vintage <= y);
  const match = ok.filter((f) => f.focus === industry || GEN.includes(f.focus));
  return pick((match.length ? match : ok).flatMap((f) => (f.size >= 800 ? [f, f] : [f])));
};
const invs = [];
const add = (fund, s, date, stage, scale = 1) => {
  const [a, b] = AMT[stage], [e, f] = EQ[stage];
  const v = { id: invs.length + 1, fund: fund.id, sid: s.id, amount: Math.max(1, Math.round(between(a, b) * scale)),
    date, equity: +((between(e, f) / 10) * scale).toFixed(1), stage };
  invs.push(v);
  return v;
};
const lead = {};
for (const s of invested) {
  const y = between(s.year + 1, Math.min(2025, s.year + 3)), age = y - s.year;
  lead[s.id] = add(choose(s.industry, y), s, iso(y), age <= 1 ? "Seed" : age === 2 ? "Series A" : "Series B");
}
invested.filter((_, i) => i % 4 === 1).slice(0, 5).forEach((s) => {
  const prev = lead[s.id], y = Math.min(2025, year(prev.date) + between(1, 2));
  const stage = STAGES[Math.min(STAGES.indexOf(prev.stage) + 1, 3)];
  const fund = rnd() < 0.6 ? funds.find((f) => f.id === prev.fund) : choose(s.industry, y);
  const d = iso(y);
  add(fund, s, d > prev.date ? d : `${year(prev.date)}-12-${pad(between(1, 28))}`, stage);
});
invested.filter((_, i) => i % 6 === 2).slice(0, 3).forEach((s) => {
  const l = lead[s.id], y = year(l.date);
  let f = choose(s.industry, y);
  if (f.id === l.fund) f = funds.find((x) => x.id !== l.fund && x.vintage <= y) || f;
  add(f, s, l.date, l.stage, 0.5); // joins the same round at a smaller size
});

/* ---------- 30 funding rounds, derived from the investments (+3 angel-funded seed rounds) ---------- */
const groups = {};
invs.forEach((v) => (groups[`${v.sid}|${v.date}|${v.stage}`] ??= []).push(v));
const rounds = [], count = {};
Object.values(groups).sort((a, b) => a[0].date.localeCompare(b[0].date)).forEach((g) => {
  const sid = g[0].sid, top = g.reduce((m, v) => (v.amount > m.amount ? v : m));
  count[sid] = (count[sid] || 0) + 1;
  rounds.push({ sid, no: count[sid], type: g[0].stage, date: g[0].date,
    raised: Math.round(g.reduce((t, v) => t + v.amount, 0) * (1.5 + rnd() * 1.5)),
    lead: funds.find((f) => f.id === top.fund).name });
});
startups.filter((s) => bootstrapped.has(s.id)).forEach((s) =>
  rounds.push({ sid: s.id, no: 1, type: "Seed", date: iso(s.year + 1), raised: between(1, 3), lead: "Angel syndicate" }));

/* ---------- exits: only older startups, after their last funding ---------- */
const BUYERS = { FinTech: ["Finverse Group", "Ledgerline Corp", "PayGlobal"], SaaS: ["DeskWorks Ltd.", "CloudCore Inc."],
  Healthcare: ["HealthBridge Inc.", "BioSphere Pharma"], CleanTech: ["SunGrid Energy", "Peakline Power"], EdTech: ["EduStream", "LearnCo"] };
const lastYear = (sid) => Math.max(...invs.filter((v) => v.sid === sid).map((v) => year(v.date)));
const exits = invested.filter((s) => lastYear(s.id) <= 2022).slice(0, 6).map((s, i) => {
  const big = s.valuation >= 900;
  return { id: i + 1, sid: s.id, type: big ? "IPO" : pick(["Acquisition", "Acquisition", "Merger"]),
    date: iso(lastYear(s.id) + between(1, 3)), value: Math.round(s.valuation * (0.9 + rnd() * 0.4)),
    buyer: big ? "Public markets" : pick(BUYERS[s.industry]) };
});

/* ---------- 30 LP commitments (each LP backs one fund, sized against the fund) ---------- */
const lpInvs = lps.map((l, i) => {
  const f = funds[i % funds.length], own = between(40, 180) / 10; // 4.0% to 18.0%
  return { id: i + 1, lp: l.id, fund: f.id, amount: Math.round((f.size * own) / 100), date: iso(f.vintage), own };
});

/* ---------- write to Neo4j ---------- */
const session = driver.session();
try {
  const [{ n }] = (await session.run("MATCH (x) WHERE NOT x:Counter RETURN count(x) AS n")).records.map((r) => r.toObject());
  if (neo4j.integer.toNumber(n) > 0) {
    if (!process.argv.includes("--reset")) {
      console.log("Database already has data. Run `npm run seed -- --reset` to wipe it and reload the sample data.");
      process.exit(0);
    }
    await session.run("MATCH (x) DETACH DELETE x");
  }
  await session.executeWrite(async (tx) => {
    const run = (cy, rows) => tx.run(cy, { r: rows.map(fix) });
    await run(`UNWIND $r AS r CREATE (:VCFirm {vc_firm_id:r.id, firm_name:r.name, headquarters:r.hq, founded_year:r.year,
      website:r.site, contact_email:r.email, assets_under_management:r.aum})`, firms);
    await run(`UNWIND $r AS r MATCH (f:VCFirm {vc_firm_id:r.firm}) CREATE (f)-[:MANAGES]->(:VCFund {fund_id:r.id,
      fund_name:r.name, fund_size:r.size, vintage_year:r.vintage, fund_status:r.status, investment_focus:r.focus})`, funds);
    await run(`UNWIND $r AS r CREATE (:LimitedPartner {lp_id:r.id, lp_name:r.name, lp_type:r.type,
      contact_email:r.email, phone_number:r.phone, country:r.country})`, lps);
    await run(`UNWIND $r AS r CREATE (:Startup {startup_id:r.id, startup_name:r.name, industry:r.industry,
      founded_year:r.year, headquarters:r.hq, founder_name:r.founder, valuation:r.valuation})`, startups);
    await run(`UNWIND $r AS r MATCH (s:Startup {startup_id:r.sid}) CREATE (s)-[:HAS_ROUND]->(:FundingRound {round_no:r.no,
      round_type:r.type, round_date:date(r.date), total_raised:r.raised, lead_investor:r.lead})`, rounds);
    await run(`UNWIND $r AS r MATCH (s:Startup {startup_id:r.sid}) CREATE (s)-[:HAS_EXIT]->(:Exit {exit_id:r.id,
      exit_type:r.type, exit_date:date(r.date), exit_value:r.value, acquiring_company:r.buyer})`, exits);
    await run(`UNWIND $r AS r MATCH (f:VCFund {fund_id:r.fund}), (s:Startup {startup_id:r.sid})
      CREATE (f)-[:INVESTED_IN {investment_id:r.id, investment_amount:r.amount, investment_date:date(r.date),
      equity_percentage:r.equity, investment_stage:r.stage}]->(s)`, invs);
    await run(`UNWIND $r AS r MATCH (l:LimitedPartner {lp_id:r.lp}), (f:VCFund {fund_id:r.fund})
      CREATE (l)-[:INVESTS_IN {lp_investment_id:r.id, contribution_amount:r.amount, contribution_date:date(r.date),
      ownership_percentage:r.own}]->(f)`, lpInvs);
    // so IDs generated by the Data entry tab continue after the seeded ones
    await tx.run(`UNWIND $c AS c MERGE (n:Counter {name:c.name}) SET n.value = c.value`, { c: [
      { name: "vc_firm_id", value: neo4j.int(firms.length) }, { name: "fund_id", value: neo4j.int(funds.length) },
      { name: "lp_id", value: neo4j.int(lps.length) }, { name: "startup_id", value: neo4j.int(startups.length) },
      { name: "exit_id", value: neo4j.int(exits.length) }, { name: "investment_id", value: neo4j.int(invs.length) },
      { name: "lp_investment_id", value: neo4j.int(lpInvs.length) }] });
  });
  console.log(`Seeded: ${firms.length} firms, ${funds.length} funds, ${lps.length} limited partners, ${startups.length} startups, ` +
    `${rounds.length} funding rounds, ${exits.length} exits, ${invs.length} investments, ${lpInvs.length} LP commitments.`);
} finally {
  await session.close();
  await driver.close();
}
