"""
Build data/resume.json from Eileen's CV docx.

The CV is the source of truth. This script reads it and emits structured data
for the site's resume builder, so a CV edit is a re-run rather than a
hand-edit in two places. It never rewrites the docx.

    python scripts/build_resume_json.py

Three defects in the docx are worked around here rather than silently
absorbed; each one prints a warning and is listed in TODO.md for Eileen to
fix at source:

  1. The E-commerce Purchase-Prediction entry appears twice, verbatim.
  2. The Advertising Revenue project's three bullets have no title line --
     they are stranded under that duplicate. The title, tools and repo URL
     are recovered from data/projects.json, where the same project is already
     described. Nothing is invented.
  3. The Creator Content Decision Dashboard carries five bullets, where the
     last two are condensed restatements of the first three.

ROLE AND INDUSTRY TAGS ARE DRAFTED, NOT AUTHORITATIVE. They are Eileen's to
correct in tools/resume-tagger.html, which exports a corrected resume.json.
Re-running this script regenerates the draft tags, so run it only when the CV
itself has changed, and re-apply her corrections after.
"""
import json
import re
import sys
import zipfile
from datetime import date
from pathlib import Path
from xml.etree import ElementTree as ET

W = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"
R = "{http://schemas.openxmlformats.org/officeDocument/2006/relationships}"

REPO = Path(__file__).resolve().parent.parent
CV = REPO.parent / "career" / "cv" / "CV 2026 working.docx"
OUT = REPO / "data" / "resume.json"
PROJECTS_JSON = REPO / "data" / "projects.json"

ROLES = ["data-analyst", "data-scientist", "bi-developer", "data-engineer"]


def read_paragraphs(path):
    """Return [(is_bullet, text)] for every non-empty paragraph in the docx."""
    zf = zipfile.ZipFile(path)
    root = ET.fromstring(zf.read("word/document.xml"))
    rels = {}
    try:
        rel_root = ET.fromstring(zf.read("word/_rels/document.xml.rels"))
        rels = {e.get("Id"): e.get("Target") for e in rel_root}
    except KeyError:
        pass

    out = []
    for para in root.iter(W + "p"):
        parts = []
        for node in para.iter():
            if node.tag == W + "t":
                parts.append(node.text or "")
            elif node.tag == W + "tab":
                parts.append("\t")
            elif node.tag == W + "hyperlink":
                target = rels.get(node.get(R + "id"))
                if target:
                    parts.append("\x00" + target + "\x00")
        text = "".join(parts).strip()
        if not text:
            continue
        ppr = para.find(W + "pPr")
        is_bullet = ppr is not None and ppr.find(W + "numPr") is not None
        out.append((is_bullet, text))
    return out


def clean(text):
    """Strip the hyperlink sentinels and normalise whitespace."""
    text = re.sub(r"\x00[^\x00]*\x00", "", text)
    return re.sub(r"[\t  \s]+", " ", text).strip()


def first_url(text):
    m = re.search(r"\x00([^\x00]*)\x00", text)
    return m.group(1) if m else None


TITLE_META = re.compile(r"^(?P<tools>.+),\s*(?P<month>[A-Z][a-z]{2})\s+(?P<year>\d{4})$")

# The docx writes these two tool names with typos. Display spelling is
# normalised; "Power BI" already matches career/build_tailored_resumes.py.
TOOL_SPELLING = {"Power Bi": "Power BI", "Qilk": "Qlik"}


def slugify(title):
    s = title.lower()
    s = s.replace("&", " and ")
    s = re.sub(r"[^a-z0-9]+", "-", s)
    return s.strip("-")


def split_title_line(raw):
    """Parse 'Title | <link>GitHub <tabs> Tools, Mon Year' into its parts."""
    url = first_url(raw)
    text = re.sub(r"\x00[^\x00]*\x00", "", raw)
    cells = [c.strip() for c in text.split("\t") if c.strip()]
    if len(cells) < 2:
        return None
    left, meta = cells[0], cells[-1]
    m = TITLE_META.match(meta)
    if not m:
        return None
    title = re.sub(r"\s*\|\s*GitHub\s*$", "", left).strip()
    if not title:
        return None
    tools = [TOOL_SPELLING.get(t.strip(), t.strip())
             for t in m.group("tools").split(",") if t.strip()]
    return {
        "id": slugify(title),
        "title": title,
        "tools": tools,
        "date": f"{m.group('month')} {m.group('year')}",
        "year": int(m.group("year")),
        "url": url,
    }


def parse_projects(paras):
    """Walk the PROJECTS section, returning entries and the defects found."""
    start = next(i for i, (_, t) in enumerate(paras) if clean(t) == "PROJECTS")
    end = next(i for i, (_, t) in enumerate(paras)
               if clean(t).startswith("Template to add New Project"))

    projects, defects, current = [], [], None
    for is_bullet, raw in paras[start + 1:end]:
        if is_bullet:
            if current is None:
                # Bullets with no title line above them. Recovered below.
                defects.append(("orphan-bullet", clean(raw)))
                projects.append({"id": None, "bullets": [clean(raw)]})
                current = projects[-1]
            else:
                current.setdefault("bullets", []).append(clean(raw))
            continue

        parsed = split_title_line(raw)
        if parsed:
            projects.append(parsed)
            current = projects[-1]
        elif current is not None and not current.get("keywords"):
            # The non-bullet line under a title is its keyword/method list.
            current["keywords"] = [k.strip() for k in clean(raw).split(",") if k.strip()]
    return projects, defects


def repair(projects):
    """Fix the three docx defects, loudly. Returns (projects, notes)."""
    notes = []

    # --- Defect 1 & 2: the duplicated entry, and the bullets stranded in it.
    seen = {}
    deduped = []
    for p in projects:
        pid = p.get("id")
        if pid in seen:
            original = seen[pid]
            extra = [b for b in p.get("bullets", []) if b not in original["bullets"]]
            notes.append(
                f"DEFECT: '{p['title']}' appears twice in the docx, verbatim. "
                f"Second copy dropped."
            )
            if extra:
                # Recovered from data/projects.json, where the same project is
                # already titled and linked. Bullets are the docx's own.
                canon = json.loads(PROJECTS_JSON.read_text(encoding="utf-8"))
                entries = canon["projects"] if isinstance(canon, dict) else canon
                match = next(e for e in entries
                             if e["id"] == "advertising-revenue-sales-efficiency-2026")
                recovered = {
                    "id": slugify(match["title"]),
                    "title": match["title"],
                    "tools": list(match["tools"]),
                    "date": "Aug 2026",
                    "year": match["year"],
                    "url": match["links"]["notebookRepo"],
                    # No keyword line survived with these bullets. Left
                    # empty rather than inheriting the duplicate's, which
                    # describe a different project entirely.
                    "keywords": [],
                    "bullets": extra,
                    "recovered": True,
                }
                deduped.append(recovered)
                notes.append(
                    f"DEFECT: {len(extra)} bullets belonging to "
                    f"'{match['title']}' had no title line in the docx -- they sat "
                    f"under the duplicate above. Title, tools and repo URL taken "
                    f"from data/projects.json; bullets are the docx's own."
                )
            continue
        seen[pid] = p
        deduped.append(p)

    # --- Defect 3: Creator dashboard's two restated bullets.
    for p in deduped:
        if p["id"] == "creator-content-decision-dashboard" and len(p["bullets"]) == 5:
            dropped = p["bullets"][3:]
            p["bullets"] = p["bullets"][:3]
            notes.append(
                "DEFECT: 'Creator Content Decision Dashboard' carries 5 bullets; "
                "the last 2 are condensed restatements of the first 3. Kept the "
                "first 3. (Already logged under CV / content gaps in TODO.md.)"
            )
            p["droppedDuplicateBullets"] = dropped

    for p in deduped:
        if not p.get("url"):
            notes.append(f"NO LINK: '{p['title']}' has no GitHub URL on the CV.")
    return deduped, notes


# ---------------------------------------------------------------------------
# DRAFTED role and industry tags. Eileen's to correct -- see the module
# docstring. Keyed by the slug the parser derives from each CV title.
# ---------------------------------------------------------------------------
DA, DS, BI, DE = "data-analyst", "data-scientist", "bi-developer", "data-engineer"

TAGS = {
 "home-price-predictor": ([DS], ["Real Estate"]),
 "email-spam-classifier": ([DS], ["Technology"]),
 "stock-prices-forecasting": ([DS], ["Banking & Finance"]),
 "dynamic-ai-chatbot": ([DS], ["Technology", "Media & Entertainment"]),
 "bitcoin-s-impact-on-a-portfolio-analysis-report": ([DS, DA], ["Banking & Finance"]),
 "credit-fraud-detection-classifier-analysis": ([DS], ["Banking & Finance"]),
 "customer-segmentation-in-bank-campaigns-presentation": ([DS, DA], ["Banking & Finance", "Marketing"]),
 "customer-churn-forecasting-analysis-in-telecom-services": ([DS, DA], ["Telecom", "Customer Experience"]),
 "amazon-prime-movies-and-tv-shows-clustering": ([DS], ["Media & Entertainment"]),
 "pizza-sales-dashboard": ([BI, DA], ["Retail & Hospitality"]),
 "artist-selection-presentation": ([DA], ["Media & Entertainment"]),
 "insurance-risk-and-claims-analytics-dashboard": ([BI, DA], ["Insurance"]),
 "sales-performance-analytics-dashboard": ([BI, DA], ["Banking & Finance"]),
 "bank-loan-application-tracking-dashboard": ([DA, BI], ["Banking & Finance"]),
 "bank-fraud-transaction-monitoring-dashboard": ([BI, DA], ["Banking & Finance"]),
 "bank-marketing-term-deposit-campaign-dashboard": ([BI, DA], ["Banking & Finance", "Marketing"]),
 "bank-customer-churn-analysis-dashboard": ([BI, DA], ["Banking & Finance", "Customer Experience"]),
 "spotify-listening-analytics-dashboard": ([BI, DA], ["Media & Entertainment"]),
 "meta-ad-performance-and-revenue-analytics-dashboard": ([BI, DA], ["Digital Advertising", "Marketing", "Social Media"]),
 "social-media-marketing-performance-dashboard": ([BI, DA], ["Marketing", "Social Media"]),
 "hotel-customer-feedback-analytics-dashboard": ([BI, DA], ["Customer Experience", "Retail & Hospitality"]),
 "superstore-sales-and-profit-analytics-dashboard": ([BI, DA], ["Retail & Hospitality"]),
 "vendor-performance-and-procurement-analytics-dashboard": ([DE, BI, DA], ["Supply Chain"]),
 "shopify-sales-and-customer-funnel-analytics-dashboard": ([BI, DA], ["E-Commerce"]),
 "e-commerce-marketing-performance-analytics-dashboard": ([BI, DA], ["E-Commerce", "Marketing"]),
 "amazon-product-sales-analytics-dashboard": ([BI, DA], ["E-Commerce"]),
 "e-commerce-purchase-prediction-and-conversion-funnel-analysis-report": ([DS, DE, DA], ["E-Commerce"]),
 "advertising-revenue-and-sales-efficiency-growth-diagnostic": ([DE, BI, DA], ["Digital Advertising"]),
 "creator-content-decision-dashboard": ([BI, DA], ["Media & Entertainment", "Social Media"]),
}

# Preference order within each role, best evidence first. The picker takes the
# top 3 that also match the chosen industry, then backfills on role alone.
FEATURED = {
 DA: ["advertising-revenue-and-sales-efficiency-growth-diagnostic",
      "e-commerce-purchase-prediction-and-conversion-funnel-analysis-report",
      "creator-content-decision-dashboard",
      "hotel-customer-feedback-analytics-dashboard",
      "meta-ad-performance-and-revenue-analytics-dashboard",
      "vendor-performance-and-procurement-analytics-dashboard"],
 DS: ["e-commerce-purchase-prediction-and-conversion-funnel-analysis-report",
      "credit-fraud-detection-classifier-analysis",
      "amazon-prime-movies-and-tv-shows-clustering",
      "customer-churn-forecasting-analysis-in-telecom-services",
      "customer-segmentation-in-bank-campaigns-presentation",
      "dynamic-ai-chatbot"],
 BI: ["advertising-revenue-and-sales-efficiency-growth-diagnostic",
      "vendor-performance-and-procurement-analytics-dashboard",
      "creator-content-decision-dashboard",
      "meta-ad-performance-and-revenue-analytics-dashboard",
      "insurance-risk-and-claims-analytics-dashboard",
      "spotify-listening-analytics-dashboard"],
 # Three projects, and they are the three. See TODO.md: the CV's data
 # engineering evidence is data modelling and batch processing at scale --
 # no orchestration, no streaming. Nothing here claims otherwise.
 DE: ["advertising-revenue-and-sales-efficiency-growth-diagnostic",
      "e-commerce-purchase-prediction-and-conversion-funnel-analysis-report",
      "vendor-performance-and-procurement-analytics-dashboard"],
}

ROLE_LABELS = {DA: "Data Analyst", DS: "Data Scientist",
               BI: "BI Developer", DE: "Data Engineer"}

# Same sets as the CV's SKILLS section, resequenced per role. Asserted below.
LANGS = {DA: ["SQL", "Python", "R"], DS: ["Python", "R", "SQL"],
         BI: ["SQL", "Python", "R"], DE: ["SQL", "Python", "R"]}
TOOLS = {
 DA: ["Excel", "Power BI", "Tableau", "Google Sheets", "Qlik", "Jupyter Notebooks",
      "Snowflake", "GitHub", "GCP", "Azure", "Vertex AI", "Claude AI", "OpenAI",
      "DeepSeek", "Kimi"],
 DS: ["Jupyter Notebooks", "Vertex AI", "OpenAI", "Claude AI", "DeepSeek", "Kimi",
      "GCP", "Azure", "Snowflake", "GitHub", "Power BI", "Tableau", "Excel",
      "Google Sheets", "Qlik"],
 BI: ["Power BI", "Tableau", "Qlik", "Excel", "Google Sheets", "Snowflake",
      "GitHub", "Jupyter Notebooks", "GCP", "Azure", "Vertex AI", "Claude AI",
      "OpenAI", "DeepSeek", "Kimi"],
 DE: ["Snowflake", "GCP", "Azure", "GitHub", "Jupyter Notebooks", "Vertex AI",
      "Power BI", "Tableau", "Excel", "Google Sheets", "Qlik", "Claude AI",
      "OpenAI", "DeepSeek", "Kimi"],
}


# ---------------------------------------------------------------------------
# One A4 page holds 783.89pt. The docx's fixed sections -- education, five NDIS
# bullets, three YouTube bullets, skills, five certification lines -- measure
# 652pt of that, which leaves room for exactly one project. A one-page CV
# carrying one project is not a portfolio CV.
#
# career/build_tailored_resumes.py already hit this and already solved it: the
# nine resumes Eileen sent out in September use shorter NDIS and YouTube
# bullets, which is why three projects fit. Those are her own words from an
# existing file, reused verbatim here -- not a rewrite, and not per-audience:
# whichever length is set applies to every variant identically.
#
# Certifications are condensed differently, by joining rather than cutting. The
# tailored-resume script drops the two Forage simulations and the DataCamp
# certificate to reach one line; running the five titles together as one
# paragraph reclaims most of the same space without losing a claim.
# ---------------------------------------------------------------------------
CONDENSED_EXPERIENCE = {
    "ndis-quality-and-safegua": [
        "Analysed 100K+ structured and unstructured provider-registration records"
        " using R and SQL, identifying five key drivers of approval delays.",
        "Built and evaluated five classification models and created 10+"
        " visualisations to investigate bottlenecks and communicate operational"
        " patterns.",
        "Validated findings with managers and subject matter experts, translating"
        " analysis into an internal insights paper, presentations and"
        " workflow-improvement recommendations.",
    ],
    "youtube": [
        "Grew an AI-generated explainer channel to 10,000 subscribers, publishing"
        " weekly videos using AI tools for ideation, scripting, voice synthesis"
        " and production.",
        "Analysed views, audience retention and watch time in YouTube Analytics to"
        " guide topics and formats; maintained monetised production for more than"
        " two years.",
    ],
}


def section(paras, heading, *stops):
    """Paragraphs between a heading and the next of the given stop headings."""
    start = next(i for i, (_, t) in enumerate(paras) if clean(t) == heading)
    end = len(paras)
    for i in range(start + 1, len(paras)):
        if clean(paras[i][1]) in stops:
            end = i
            break
    return paras[start + 1:end]


DASH = re.compile(r"\s*[–—-]\s*")


def parse_experience(paras):
    """The two Work Experience entries. YouTube is flagged optional -- the
    picker lets a visitor drop it; see TODO.md for why it defaults to on."""
    rows = section(paras, "Work Experience", "LINKEDIN Experience")
    entries, current = [], None
    for is_bullet, raw in rows:
        text = clean(raw)
        if is_bullet:
            if current:
                current["bullets"].append(text)
            continue
        cells = [c.strip() for c in re.sub(r"\x00[^\x00]*\x00", "", raw).split("\t") if c.strip()]
        if current is None or current.get("role"):
            entries.append({"organisation": cells[0], "location": cells[-1] if len(cells) > 1 else "",
                            "role": "", "dates": "", "bullets": []})
            current = entries[-1]
        else:
            current["role"] = cells[0]
            current["dates"] = DASH.sub(" - ", cells[-1]) if len(cells) > 1 else ""
    for e in entries:
        e["id"] = slugify(e["organisation"])[:24]
        e["optional"] = "youtube" in e["id"]
        short = CONDENSED_EXPERIENCE.get(e["id"])
        if short is None:
            sys.exit(f"No condensed bullets defined for experience id {e['id']!r}")
        e["bulletsCondensed"] = short
    return entries


def parse_education(paras):
    rows = section(paras, "EDUCATION", "PROJECTS")
    # clean() collapses runs of whitespace, and this line uses exactly that to
    # separate its two columns -- so split it before cleaning.
    head = [re.sub(r"\x00[^\x00]*\x00", "", r).strip() for b, r in rows if not b]
    bullets = [clean(r) for b, r in rows if b]
    place, institution = re.split(r"\s{2,}|\t", head[0], 1)
    degree, _, grad = clean(head[1]).partition("Expected Graduation:")
    return {"institution": institution.strip(), "location": place.strip(),
            "degree": degree.strip(), "graduation": grad.strip(),
            "detail": bullets}


def parse_skills(paras):
    """The two skill rows, and only those.

    SKILLS is the last section in the docx and it runs on -- a GitHub-profile
    blurb ("Fun fact: ..."), then two pasted copies of a prompt template. None
    of that is CV content, and all of it is bullet-formatted, so an allowlist
    of labels is the guard rather than a shape heuristic. This data ends up in
    a PDF a recruiter downloads; a heuristic that lets one stray line through
    is a heuristic that puts it on Eileen's resume.
    """
    wanted = {"programming-languages": "languages", "tools": "tools"}
    rows = [clean(r) for b, r in section(paras, "SKILLS") if b]
    out = {}
    for row in rows:
        label, _, values = row.partition(":")
        key = wanted.get(slugify(label))
        if not key or not values:
            continue
        out[key] = [TOOL_SPELLING.get(v.strip(), v.strip())
                    for v in values.split(",") if v.strip()]
    missing = set(wanted.values()) - set(out)
    if missing:
        sys.exit(f"SKILLS section is missing expected rows: {sorted(missing)}")
    return out


def parse_certifications(paras):
    rows = section(paras, "Activities", "SKILLS")
    out, current = [], None
    for is_bullet, raw in rows:
        text = clean(raw)
        if is_bullet:
            if current:
                current["bullets"].append(text)
            continue
        cells = [c.strip() for c in re.sub(r"\x00[^\x00]*\x00", "", raw).split("\t") if c.strip()]
        out.append({"title": cells[0], "date": cells[-1] if len(cells) > 1 else "", "bullets": []})
        current = out[-1]
    return out


def main():
    if not CV.exists():
        sys.exit(f"CV not found: {CV}")
    paras = read_paragraphs(CV)
    projects, _ = parse_projects(paras)
    projects, notes = repair(projects)

    skills = parse_skills(paras)
    base_langs = set(skills["languages"])
    base_tools = set(skills["tools"])

    # "Same set, different order" is enforced, not just intended: a per-role
    # list that adds or drops a skill is a claim that varies by audience.
    for role in ROLES:
        assert set(LANGS[role]) == base_langs, (role, set(LANGS[role]) ^ base_langs)
        assert set(TOOLS[role]) == base_tools, (role, set(TOOLS[role]) ^ base_tools)

    tagged = []
    for p in projects:
        roles, industries = TAGS.get(p["id"], ([], []))
        if p["id"] not in TAGS:
            notes.append(f"UNTAGGED: '{p['title']}' has no draft tags -- new since the last run?")
        p["roles"] = roles
        p["industries"] = industries
        p["tagsDrafted"] = True
        tagged.append(p)

    known = {p["id"] for p in tagged}
    for role, ids in FEATURED.items():
        for pid in ids:
            assert pid in known, f"FEATURED[{role}] names an unknown project: {pid}"
        for pid in ids:
            assert role in dict((p["id"], p["roles"]) for p in tagged)[pid], \
                f"FEATURED[{role}] names {pid}, which is not tagged for that role"

    contact = clean(paras[1][1])
    industries = sorted({i for p in tagged for i in p["industries"]})

    doc = {
        "generated": date.today().isoformat(),
        "source": "career/cv/CV 2026 working.docx",
        "tagsAreDrafted": True,
        "profile": {
            "name": clean(paras[0][1]),
            "contactLine": contact,
            "email": re.search(r"[\w.+-]+@[\w.-]+", contact).group(0),
            "phone": re.search(r"\+\d[\d ]{8,}", contact).group(0).strip(),
            "citizenship": contact.split("|")[0].strip(),
            "linkedin": "https://www.linkedin.com/in/eileen-ip",
            "github": "https://github.com/EileenIp",
        },
        # One fixed summary for every variant, or none. The CV itself has no
        # summary section, so this stays null until Eileen writes one. It does
        # not vary by role -- that was her call: selection varies, claims don't.
        "summary": None,
        # Applies to every variant identically -- it is a page-budget setting,
        # not a per-audience one. "full" uses the docx's own bullets and fits
        # one project; "condensed" reuses the shorter wording from
        # career/build_tailored_resumes.py and fits three. See TODO.md.
        "length": "condensed",
        "education": parse_education(paras),
        "experience": parse_experience(paras),
        "projects": tagged,
        "skills": skills,
        "certifications": parse_certifications(paras),
        "roles": [
            {"id": r, "label": ROLE_LABELS[r], "featured": FEATURED[r],
             "languages": LANGS[r], "tools": TOOLS[r]}
            for r in ROLES
        ],
        "industries": industries,
    }
    OUT.write_text(json.dumps(doc, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    print(f"wrote {OUT.relative_to(REPO)}: {len(tagged)} projects, "
          f"{len(doc['experience'])} experience entries, {len(industries)} industries")
    for role in ROLES:
        n = sum(1 for p in tagged if role in p["roles"])
        print(f"  {ROLE_LABELS[role]:16s} {n:2d} projects tagged, "
              f"{len(FEATURED[role])} in preference order")
    if notes:
        print("\nCV defects and gaps -- these need fixing in the docx, not here:")
        for n in notes:
            print("  * " + n)


if __name__ == "__main__":
    main()
