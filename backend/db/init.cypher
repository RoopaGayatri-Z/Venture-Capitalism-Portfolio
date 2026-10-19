CREATE CONSTRAINT vcfirm_id IF NOT EXISTS FOR (n:VCFirm) REQUIRE n.vc_firm_id IS UNIQUE;
CREATE CONSTRAINT vcfund_id IF NOT EXISTS FOR (n:VCFund) REQUIRE n.fund_id IS UNIQUE;
CREATE CONSTRAINT lp_id IF NOT EXISTS FOR (n:LimitedPartner) REQUIRE n.lp_id IS UNIQUE;
CREATE CONSTRAINT startup_id IF NOT EXISTS FOR (n:Startup) REQUIRE n.startup_id IS UNIQUE;
CREATE CONSTRAINT exit_id IF NOT EXISTS FOR (n:Exit) REQUIRE n.exit_id IS UNIQUE;
CREATE CONSTRAINT counter_name IF NOT EXISTS FOR (n:Counter) REQUIRE n.name IS UNIQUE;
CREATE INDEX startup_industry IF NOT EXISTS FOR (n:Startup) ON (n.industry);
CREATE INDEX invested_date IF NOT EXISTS FOR ()-[r:INVESTED_IN]-() ON (r.investment_date);
CREATE INDEX lp_contrib_date IF NOT EXISTS FOR ()-[r:INVESTS_IN]-() ON (r.contribution_date)
