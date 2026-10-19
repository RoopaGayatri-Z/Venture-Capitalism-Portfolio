// Loads 10 sample records into every table. Usage: npm run seed   (add -- --reset to wipe existing data first)
import "dotenv/config";
import neo4j from "neo4j-driver";

const driver = neo4j.driver(
  process.env.NEO4J_URI || "bolt://localhost:7687",
  neo4j.auth.basic(process.env.NEO4J_USER || "neo4j", process.env.NEO4J_PASSWORD || "password1234"));

const fix = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, Number.isInteger(v) ? neo4j.int(v) : v]));
const rows = (keys, data) => data.map((d) => fix(Object.fromEntries(keys.map((k, i) => [k, d[i]]))));

// Amounts and valuations are in $M
const firms = rows(["id", "name", "hq", "year", "site", "email", "aum"], [
  [1, "Orbit Capital", "Bengaluru", 2010, "orbitcapital.in", "hello@orbitcapital.in", 1500],
  [2, "Meridian Partners", "Mumbai", 2008, "meridianpartners.com", "info@meridianpartners.com", 2200],
  [3, "Northstar Ventures", "Chennai", 2013, "northstarvc.in", "contact@northstarvc.in", 800],
  [4, "Helix Capital", "Hyderabad", 2012, "helixcapital.com", "team@helixcapital.com", 950],
  [5, "Greenfield Ventures", "Pune", 2015, "greenfield.vc", "hello@greenfield.vc", 600],
  [6, "Lumen Capital", "New Delhi", 2011, "lumencap.com", "info@lumencap.com", 450],
  [7, "Pinnacle Partners", "Singapore", 2009, "pinnaclepartners.sg", "ir@pinnaclepartners.sg", 3100],
  [8, "Aster Ventures", "Bengaluru", 2016, "asterventures.in", "hello@asterventures.in", 300],
  [9, "Cobalt Capital", "London", 2007, "cobaltcapital.co.uk", "enquiries@cobaltcapital.co.uk", 4200],
  [10, "Zenith Growth", "San Francisco", 2014, "zenithgrowth.com", "team@zenithgrowth.com", 2800]]);

const funds = rows(["id", "firm", "name", "size", "vintage", "status", "focus"], [
  [1, 1, "Apex Growth I", 900, 2019, "Active", "FinTech"],
  [2, 1, "Apex Seed II", 250, 2021, "Active", "Early stage"],
  [3, 2, "Meridian Fund III", 1400, 2018, "Active", "SaaS"],
  [4, 2, "Meridian Impact", 420, 2020, "Active", "CleanTech"],
  [5, 3, "Northstar Fund I", 600, 2017, "Closed", "FinTech"],
  [6, 4, "Helix Bio Fund", 500, 2019, "Active", "Healthcare"],
  [7, 5, "Greenfield Climate", 350, 2022, "Fundraising", "CleanTech"],
  [8, 6, "Lumen EdTech Fund", 180, 2020, "Active", "EdTech"],
  [9, 7, "Pinnacle Global", 1100, 2016, "Closed", "SaaS"],
  [10, 10, "Zenith Growth II", 800, 2021, "Active", "Growth"]]);

const lps = rows(["id", "name", "type", "email", "phone", "country"], [
  [1, "Kestrel Pension Fund", "Pension fund", "invest@kestrelpension.co.uk", "+44 20 7946 0101", "United Kingdom"],
  [2, "Redwood Endowment", "Endowment", "office@redwoodendow.org", "+1 415 555 0102", "United States"],
  [3, "Banyan Family Office", "Family office", "contact@banyanfo.sg", "+65 6555 0103", "Singapore"],
  [4, "Sundaram Family Office", "Family office", "info@sundaramfo.in", "+91 44 5550 0104", "India"],
  [5, "Nordic Retirement Fund", "Pension fund", "ir@nordicretire.se", "+46 8 555 0105", "Sweden"],
  [6, "Atlas Corporate Ventures", "Corporate", "ventures@atlascorp.de", "+49 30 5550 0106", "Germany"],
  [7, "Maple University Endowment", "Endowment", "invest@mapleuni.ca", "+1 416 555 0107", "Canada"],
  [8, "Jade Holdings", "Corporate", "capital@jadeholdings.sg", "+65 6555 0108", "Singapore"],
  [9, "Cedar Family Office", "Family office", "office@cedarfo.ae", "+971 4 555 0109", "UAE"],
  [10, "Horizon Pension Trust", "Pension fund", "funds@horizontrust.au", "+61 2 5550 0110", "Australia"]]);

const startups = rows(["id", "name", "industry", "year", "hq", "founder", "valuation"], [
  [1, "PayLoom", "FinTech", 2018, "Chennai", "Arjun Kumar", 820],
  [2, "LedgerLeaf", "FinTech", 2019, "Mumbai", "Neha Shah", 430],
  [3, "MediNova", "Healthcare", 2017, "Bengaluru", "Dr. Priya Raman", 950],
  [4, "CareGrid", "Healthcare", 2019, "Hyderabad", "Rohit Menon", 380],
  [5, "CloudMint", "SaaS", 2016, "Bengaluru", "Sanjay Iyer", 1200],
  [6, "FlowDesk", "SaaS", 2020, "Pune", "Meera Nair", 260],
  [7, "SolarWeave", "CleanTech", 2018, "Ahmedabad", "Vikram Desai", 670],
  [8, "VoltPeak", "CleanTech", 2021, "Chennai", "Ananya Rao", 310],
  [9, "LearnLoop", "EdTech", 2019, "New Delhi", "Karthik Subramanian", 240],
  [10, "GenePath", "Healthcare", 2018, "Hyderabad", "Dr. Farah Khan", 720]]);

const rounds = rows(["sid", "no", "type", "date", "raised", "lead"], [
  [1, 1, "Series A", "2020-03-15", 30, "Apex Growth I"],
  [2, 1, "Seed", "2021-06-10", 12, "Apex Seed II"],
  [3, 1, "Series A", "2019-05-30", 35, "Helix Bio Fund"],
  [4, 1, "Series A", "2021-10-12", 14, "Helix Bio Fund"],
  [5, 1, "Series B", "2019-11-20", 40, "Meridian Fund III"],
  [6, 1, "Series A", "2021-02-14", 15, "Meridian Fund III"],
  [7, 1, "Series A", "2020-08-18", 22, "Meridian Impact"],
  [8, 1, "Seed", "2022-04-22", 9, "Greenfield Climate"],
  [9, 1, "Seed", "2021-01-18", 6, "Lumen EdTech Fund"],
  [10, 1, "Series A", "2020-12-02", 28, "Helix Bio Fund"]]);

const exits = rows(["id", "sid", "type", "date", "value", "buyer"], [
  [1, 1, "Acquisition", "2025-02-10", 900, "Finverse Group"],
  [2, 2, "Acquisition", "2025-05-22", 480, "Ledgerline Corp"],
  [3, 3, "IPO", "2025-09-15", 1100, "Public markets"],
  [4, 4, "Merger", "2024-11-03", 410, "HealthBridge Inc."],
  [5, 5, "IPO", "2024-06-27", 1500, "Public markets"],
  [6, 6, "Acquisition", "2025-03-18", 300, "DeskWorks Ltd."],
  [7, 7, "Acquisition", "2025-07-01", 720, "SunGrid Energy"],
  [8, 8, "Merger", "2025-10-09", 350, "Peakline Power"],
  [9, 9, "Acquisition", "2024-12-12", 260, "EduStream"],
  [10, 10, "Acquisition", "2025-08-05", 800, "BioSphere Pharma"]]);

const invs = rows(["id", "fund", "sid", "amount", "date", "equity", "stage"], [
  [1, 1, 1, 25, "2020-03-15", 8.5, "Series A"],
  [2, 1, 2, 12, "2021-06-10", 6.0, "Seed"],
  [3, 6, 10, 28, "2020-12-02", 6.8, "Series A"],
  [4, 3, 5, 40, "2019-11-20", 7.0, "Series B"],
  [5, 3, 6, 15, "2021-02-14", 9.0, "Series A"],
  [6, 8, 9, 6, "2021-01-18", 8.0, "Seed"],
  [7, 4, 7, 22, "2020-08-18", 6.5, "Series A"],
  [8, 7, 8, 9, "2022-04-22", 5.0, "Seed"],
  [9, 6, 3, 35, "2019-05-30", 10.0, "Series A"],
  [10, 6, 4, 14, "2021-10-12", 7.5, "Series A"]]);

const lpInvs = rows(["id", "lp", "fund", "amount", "date", "own"], [
  [1, 1, 1, 100, "2019-02-01", 11.1],
  [2, 2, 3, 150, "2018-09-14", 10.7],
  [3, 3, 3, 80, "2018-10-02", 5.7],
  [4, 4, 6, 60, "2019-06-20", 12.0],
  [5, 5, 4, 70, "2020-02-11", 16.7],
  [6, 6, 9, 120, "2016-05-30", 10.9],
  [7, 7, 10, 90, "2021-04-08", 11.3],
  [8, 8, 8, 40, "2020-07-19", 22.2],
  [9, 9, 7, 50, "2022-01-25", 14.3],
  [10, 10, 2, 35, "2021-03-03", 14.0]]);

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
    await tx.run(`UNWIND $r AS r CREATE (:VCFirm {vc_firm_id:r.id, firm_name:r.name, headquarters:r.hq, founded_year:r.year,
      website:r.site, contact_email:r.email, assets_under_management:r.aum})`, { r: firms });
    await tx.run(`UNWIND $r AS r MATCH (f:VCFirm {vc_firm_id:r.firm}) CREATE (f)-[:MANAGES]->(:VCFund {fund_id:r.id,
      fund_name:r.name, fund_size:r.size, vintage_year:r.vintage, fund_status:r.status, investment_focus:r.focus})`, { r: funds });
    await tx.run(`UNWIND $r AS r CREATE (:LimitedPartner {lp_id:r.id, lp_name:r.name, lp_type:r.type,
      contact_email:r.email, phone_number:r.phone, country:r.country})`, { r: lps });
    await tx.run(`UNWIND $r AS r CREATE (:Startup {startup_id:r.id, startup_name:r.name, industry:r.industry,
      founded_year:r.year, headquarters:r.hq, founder_name:r.founder, valuation:r.valuation})`, { r: startups });
    await tx.run(`UNWIND $r AS r MATCH (s:Startup {startup_id:r.sid}) CREATE (s)-[:HAS_ROUND]->(:FundingRound {round_no:r.no,
      round_type:r.type, round_date:date(r.date), total_raised:r.raised, lead_investor:r.lead})`, { r: rounds });
    await tx.run(`UNWIND $r AS r MATCH (s:Startup {startup_id:r.sid}) CREATE (s)-[:HAS_EXIT]->(:Exit {exit_id:r.id,
      exit_type:r.type, exit_date:date(r.date), exit_value:r.value, acquiring_company:r.buyer})`, { r: exits });
    await tx.run(`UNWIND $r AS r MATCH (f:VCFund {fund_id:r.fund}), (s:Startup {startup_id:r.sid})
      CREATE (f)-[:INVESTED_IN {investment_id:r.id, investment_amount:r.amount, investment_date:date(r.date),
      equity_percentage:r.equity, investment_stage:r.stage}]->(s)`, { r: invs });
    await tx.run(`UNWIND $r AS r MATCH (l:LimitedPartner {lp_id:r.lp}), (f:VCFund {fund_id:r.fund})
      CREATE (l)-[:INVESTS_IN {lp_investment_id:r.id, contribution_amount:r.amount, contribution_date:date(r.date),
      ownership_percentage:r.own}]->(f)`, { r: lpInvs });
    // so IDs generated by the Data entry tab continue from 11
    await tx.run(`UNWIND $names AS n MERGE (c:Counter {name:n}) SET c.value = 10`,
      { names: ["vc_firm_id", "fund_id", "lp_id", "startup_id", "exit_id", "investment_id", "lp_investment_id"] });
  });
  console.log("Seeded 10 records into each of the 8 tables.");
} finally {
  await session.close();
  await driver.close();
}
