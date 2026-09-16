"""Build data/companies.json — the company -> display name + domain map.

The tracker data stores whatever was typed into the spreadsheet, so the same
employer appears as 'nab' and 'Nab', or 'commbank' and 'Commonwealth Bank'.
This maps the raw strings onto one canonical entry each, which gives the page
a stable display name and a domain to pull a logo from.

Domains were filled in by hand. Anything genuinely ambiguous is left with a
null domain rather than guessed -- a wrong domain means the wrong company's
logo on the card, which is worse than no logo at all. Any such name is
printed at the end of a run so it can be resolved rather than forgotten.
As of 2026-09-16 there are none, and every remaining company has a cached
logo. Eileen identified ADN and "GOVERNMENT", then removed FMD, Farrer
Capital Management and Openmesh (2026-09-13), and BMW, Fujitsu, McKinsey,
Spotlight Retail Group and ASIO (2026-09-16). The ASIO row was a real
application rather than a lead -- applied 2026-09-09, withdrawn -- so its
removal was raised as a loss of history and confirmed as intentional before
it went.
"""
import json, re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

# raw spreadsheet string -> (display name, domain or None)
COMPANIES = {
    "accenture": ("Accenture", "accenture.com"),
    "adn": ("Australian Disability Network", "australiandisabilitynetwork.org.au"),
    "aecom": ("AECOM", "aecom.com"),
    "allianz": ("Allianz", "allianz.com.au"),
    "amazon": ("Amazon", "amazon.com"),
    "apa": ("APA Group", "apa.com.au"),
    "apple": ("Apple", "apple.com"),
    "arup": ("Arup", "arup.com"),
    "atlassian": ("Atlassian", "atlassian.com"),
    "ausnet": ("AusNet", "ausnetservices.com.au"),
    "bank of america": ("Bank of America", "bankofamerica.com"),
    "bcg": ("BCG", "bcg.com"),
    "bdo": ("BDO", "bdo.com.au"),
    "bloomberg": ("Bloomberg", "bloomberg.com"),
    "capgemini": ("Capgemini", "capgemini.com"),
    "cisco": ("Cisco", "cisco.com"),
    "city of gold coast": ("City of Gold Coast", "goldcoast.qld.gov.au"),
    "coles": ("Coles", "coles.com.au"),
    "commbank": ("Commonwealth Bank", "commbank.com.au"),
    "commonwealth bank": ("Commonwealth Bank", "commbank.com.au"),
    "deloitte": ("Deloitte", "deloitte.com"),
    "didi": ("DiDi", "didiglobal.com"),
    "dxc": ("DXC Technology", "dxc.com"),
    "eightcap": ("Eightcap", "eightcap.com"),
    "evolution mining": ("Evolution Mining", "evolutionmining.com.au"),
    "ey": ("EY", "ey.com"),
    "fivecast": ("Fivecast", "fivecast.com"),
    "fti consulting": ("FTI Consulting", "fticonsulting.com"),
    "general motors": ("General Motors", "gm.com"),
    # Typed as a bare "GOVERNMENT" in the sheet; Eileen confirmed which one.
    "government": ("Queensland Government", "qld.gov.au"),
    "grant thornton": ("Grant Thornton", "grantthornton.com.au"),
    "hatch": ("Hatch", "hatch.com"),
    "heidi health": ("Heidi Health", "heidihealth.com"),
    "hoyoverse": ("HoYoverse", "hoyoverse.com"),
    "imc": ("IMC Trading", "imc.com"),
    "jane street": ("Jane Street", "janestreet.com"),
    "jpmorganchase": ("JPMorganChase", "jpmorganchase.com"),
    "kordamentha": ("KordaMentha", "kordamentha.com"),
    "kpmg": ("KPMG", "kpmg.com"),
    "leidos": ("Leidos", "leidos.com"),
    "loreal": ("L'Oreal", "loreal.com"),
    "macquarie": ("Macquarie", "macquarie.com"),
    "mastercard": ("Mastercard", "mastercard.com"),
    "mcgrathnicol": ("McGrathNicol", "mcgrathnicol.com"),
    "mercedes benz": ("Mercedes-Benz", "mercedes-benz.com"),
    "moody's corporation": ("Moody's", "moodys.com"),
    "nab": ("NAB", "nab.com.au"),
    "nbn": ("NBN Co", "nbnco.com.au"),
    "nsw government": ("NSW Government", "nsw.gov.au"),
    "nti": ("NTI", "nti.com.au"),
    "optiver": ("Optiver", "optiver.com"),
    "optus": ("Optus", "optus.com.au"),
    "origin": ("Origin Energy", "originenergy.com.au"),
    "pwc": ("PwC", "pwc.com"),
    "qantas": ("Qantas", "qantas.com"),
    "qbe insurance": ("QBE Insurance", "qbe.com"),
    "quantium": ("Quantium", "quantium.com"),
    "queensland government digital": ("Queensland Government", "qld.gov.au"),
    "reserve bank of australia": ("Reserve Bank of Australia", "rba.gov.au"),
    "rheinmetall": ("Rheinmetall", "rheinmetall.com"),
    "rsm": ("RSM", "rsm.global"),
    "sap": ("SAP", "sap.com"),
    # SIG read as Susquehanna rather than SIG plc: the surrounding
    # applications are quant trading firms (Optiver, IMC, Jane Street).
    "sig": ("Susquehanna (SIG)", "sig.com"),
    "shell": ("Shell", "shell.com"),
    "sportsbet": ("Sportsbet", "sportsbet.com.au"),
    "streem": ("Streem", "streem.com.au"),
    "suncorp": ("Suncorp", "suncorp.com.au"),
    "telstra": ("Telstra", "telstra.com.au"),
    "tencent": ("Tencent", "tencent.com"),
    "tiktok": ("TikTok", "tiktok.com"),
    "uq": ("University of Queensland", "uq.edu.au"),
    "ventia": ("Ventia", "ventia.com"),
    "visa": ("Visa", "visa.com"),
    "visagio": ("Visagio", "visagio.com"),
    "vistar media": ("Vistar Media", "vistarmedia.com"),
    "westpac": ("Westpac", "westpac.com.au"),
    "wsp": ("WSP", "wsp.com"),
}


def normalise(raw):
    """Same rule the page uses: lowercase, collapse whitespace."""
    return re.sub(r"\s+", " ", (raw or "").strip().lower())


if __name__ == "__main__":
    entries = json.loads((ROOT / "data" / "job-applications.json").read_text(encoding="utf8"))
    seen = {normalise(e["company"]) for e in entries if e.get("company")}

    registry, unresolved, missing = {}, [], []
    for key in sorted(seen):
        if key not in COMPANIES:
            missing.append(key)
            continue
        name, domain = COMPANIES[key]
        registry[key] = {"name": name, "domain": domain,
                         "logo": f"images/logos/{domain}.png" if domain else None}
        if domain is None:
            unresolved.append(name)

    out = {"version": 1,
           "note": "Generated by scripts/build_company_registry.py. "
                   "Entries with a null domain have no logo and fall back to a "
                   "monogram tile -- fill the domain in the script, don't guess here.",
           "companies": registry}
    (ROOT / "data" / "companies.json").write_text(
        json.dumps(out, indent=2, ensure_ascii=False) + "\n", encoding="utf8")

    print(f"{len(registry)} companies mapped, {len(seen)} raw names collapsed")
    if unresolved:
        print("no domain (monogram fallback):", ", ".join(unresolved))
    if missing:
        print("IN DATA BUT NOT IN SCRIPT:", ", ".join(missing))
