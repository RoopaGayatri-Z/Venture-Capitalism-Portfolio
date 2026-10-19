# Venture Capital Portfolio Analytics

A graph-database project that models a venture capital ecosystem (VC firms, funds, limited partners, startups, funding rounds, exits) in **Neo4j**, exposes it through an **Express REST API**, and visualizes it in a single-file **React dashboard**.

## Features

- **Graph data model** of VC firms, funds, LPs, startups, rounds, exits and investments
- **Analytics dashboard**: total invested, investment by fund and by industry, industry comparison, funds with large portfolios, highest-valued startups
- **Data entry tab** to add records to all 8 tables from the browser
- **Auto-incrementing IDs** using counter nodes in Neo4j
- **Seed script** that loads 10 sample records into every table

## Tech Stack

| Layer | Technology |
|---|---|
| Database | Neo4j 5 (Docker) |
| Backend | Node.js, Express, `neo4j-driver` |
| Frontend | React 18 (UMD via CDN), plain CSS, single HTML file |

## Project Structure

```
Venture-Capitalism-Portfolio/
├── backend/
│   ├── db/
│   │   ├── init.cypher        # constraints + indexes (run on server start)
│   │   └── seed.js            # sample data loader
│   ├── .env                   # your local config (not committed)
│   ├── .env.example           # config template
│   ├── docker-compose.yml     # Neo4j container
│   ├── package.json
│   └── server.js              # REST API
├── portfolio-analytics.html   # dashboard (open directly in the browser)
├── .gitignore
└── README.md
```

## Graph Model

```
(VCFirm)-[:MANAGES]->(VCFund)-[:INVESTED_IN {amount, date, equity, stage}]->(Startup)
(LimitedPartner)-[:INVESTS_IN {contribution, date, ownership}]->(VCFund)
(Startup)-[:HAS_ROUND]->(FundingRound)
(Startup)-[:HAS_EXIT]->(Exit)
```

| Node | Key properties |
|---|---|
| `VCFirm` | vc_firm_id, firm_name, headquarters, founded_year, website, contact_email, assets_under_management |
| `VCFund` | fund_id, fund_name, fund_size, vintage_year, fund_status, investment_focus |
| `LimitedPartner` | lp_id, lp_name, lp_type, contact_email, phone_number, country |
| `Startup` | startup_id, startup_name, industry, founded_year, headquarters, founder_name, valuation |
| `FundingRound` | round_no, round_type, round_date, total_raised, lead_investor |
| `Exit` | exit_id, exit_type, exit_date, exit_value, acquiring_company |

All amounts and valuations are in **$M**.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)

### 1. Configure environment

```bash
cd backend
cp .env.example .env
```

Edit `.env`:

```env
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=choose_a_password   # at least 8 characters
PORT=4000
```

### 2. Start Neo4j

```bash
docker compose up -d
```

The Neo4j browser is available at http://localhost:7474 (Bolt on port 7687).

### 3. Install dependencies and seed the database

```bash
npm install
npm run seed
```

To wipe existing data and reload the samples:

```bash
npm run seed -- --reset
```

### 4. Start the API

```bash
npm start        # or: npm run dev  (auto-restarts on changes)
```

The API runs at http://localhost:4000. Constraints and indexes from `db/init.cypher` are applied automatically on startup.

### 5. Open the dashboard

Open `portfolio-analytics.html` in your browser (double-click it, or use the VS Code Live Server extension). The **API** box at the top defaults to `http://localhost:4000`; change it if your backend runs elsewhere.

## API Reference

### Analytics (GET)

| Endpoint | Description |
|---|---|
| `/api/kpis` | Totals: startups, funds, investments, total invested |
| `/api/funds/totals` | Total invested and startup count per fund |
| `/api/funds/large?min=5` | Funds that invested in at least `min` startups |
| `/api/funds/:id/monthly` | Monthly capital deployed by a fund |
| `/api/startups/top?limit=8` | Startups ranked by valuation, with funding received |
| `/api/industries` | Startup count and total investment per industry |
| `/api/industries/compare?a=SaaS&b=FinTech` | Side-by-side industry comparison |

### Writes (POST)

| Endpoint | Description |
|---|---|
| `/api/data/:table` | Insert a record. `:table` is one of `vc_firm`, `vc_fund`, `limited_partner`, `startup`, `funding_round`, `exit`, `investment`, `lp_investment` |
| `/api/investments` | Shortcut for inserting an investment |

Example:

```bash
curl -X POST http://localhost:4000/api/data/startup \
  -H "Content-Type: application/json" \
  -d '{"startup_name":"NovaPay","industry":"FinTech","founded_year":2022,"valuation":150}'
```

Notes:
- IDs are generated automatically (counters start at 11 after seeding).
- Child records (funds, rounds, exits) and relationship records (investments, LP investments) require their parent IDs to exist.
- A funding round is identified by `startup_id` + `round_no`; a startup can have only one exit.

## Example Cypher Queries

Run these in the Neo4j browser:

```cypher
// Total invested per fund
MATCH (f:VCFund)-[i:INVESTED_IN]->(:Startup)
RETURN f.fund_name, sum(i.investment_amount) AS total ORDER BY total DESC;

// Which LPs back which firms
MATCH (l:LimitedPartner)-[:INVESTS_IN]->(:VCFund)<-[:MANAGES]-(v:VCFirm)
RETURN l.lp_name, v.firm_name;

// Startups that exited, with their investors
MATCH (f:VCFund)-[:INVESTED_IN]->(s:Startup)-[:HAS_EXIT]->(e:Exit)
RETURN s.startup_name, e.exit_type, e.exit_value, collect(f.fund_name) AS investors;
```

## Troubleshooting

| Problem | Fix |
|---|---|
| `Could not reach Neo4j` on startup | Check that `docker compose up -d` is running and the `.env` credentials match |
| Dashboard shows "Cannot reach the API" | Make sure `npm start` is running and the API URL in the dashboard is correct |
| Dashboard shows "No data yet" | Run `npm run seed` or add records in the Data entry tab |
| Seed says "Database already has data" | Run `npm run seed -- --reset` |
| Neo4j container exits immediately | `NEO4J_PASSWORD` is missing or shorter than 8 characters |

## Author

Your Name, [GitHub](https://github.com/your-username)