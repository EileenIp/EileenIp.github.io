"""
Add the built portfolio projects that are missing from Eileen's CV.

Writes a NEW docx beside the original -- it never overwrites the master. Eileen
reviews the output and swaps it in herself.

Formatting is cloned, not rebuilt: each new entry deep-copies an existing
project's paragraphs, so the paragraph properties, tab stops, bullet numbering
and run fonts are the CV's own rather than an approximation of them.

EVERY NUMBER HERE COMES FROM data/projects.json, which is written from the
project repos. Nothing is estimated, rounded for effect, or invented. The
bullets follow the XYZ shape the CV's own prompt template asks for.

    python scripts/add_cv_projects.py
"""
import copy
import shutil
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET

W = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"
R = "{http://schemas.openxmlformats.org/officeDocument/2006/relationships}"
RELNS = "http://schemas.openxmlformats.org/package/2006/relationships"
HYPERLINK = "http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink"
XMLSPACE = "{http://www.w3.org/XML/1998/namespace}space"

CV = Path("C:/github/career/cv/CV 2026 working.docx")
OUT = CV.with_name("CV 2026 working (5 projects added).docx")

# The entry whose formatting every new one is cloned from.
TEMPLATE_TITLE = "Vendor Performance & Procurement Analytics Dashboard"

# Streaming Engagement is deliberately absent: its repo is empty and its own
# impact stat reads "Placeholder -- project not yet built". A CV entry for it
# would be a claim about work that does not exist.
PROJECTS = [
    {
        "title": "Launch Sentiment: Review Sentiment Early-Warning Analysis",
        "url": "https://github.com/EileenIp/launch-sentiment",
        "tools": "Python, Steam Web API, pytest",
        "date": "Sep 2026",
        "keywords": "Sentiment Analysis, Time Series, Hypothesis Testing, API Data Collection, "
                    "Alert Design, Statistical Robustness Checks",
        "bullets": [
            "Tested whether complaint themes lead review score across 886,850 Steam reviews "
            "(100% of the game's reported total, spanning 271 days), returning a null result: both "
            "sentiment collapses were triggered by dated developer actions, so complaints and score "
            "moved on the same day.",
            "Designed a change-based alert firing 3 times in 9 months with zero false positives, "
            "against 35 alerts and 29 false positives for the obvious level threshold, by testing "
            "candidate rules against the full corpus rather than assuming a cutoff.",
            "Rejected VADER and a RoBERTa sentiment model after hand-labelling 200 reviews blind - "
            "both scored below the 72.0% majority-class baseline, at 61.5% and 64.0% - and used "
            "Steam's own thumbs-up flag instead.",
        ],
    },
    {
        "title": "F2P vs Paid: Pricing and Engagement on Steam",
        "url": "https://github.com/EileenIp/steam-pricing-engagement",
        "tools": "Python, pandas, SteamSpy API, Steam Web API, pytest",
        "date": "Sep 2026",
        "keywords": "Statistical Testing, Effect Size, Confounder Control, API Data Collection, "
                    "Reproducible Pipelines, Sensitivity Analysis",
        "bullets": [
            "Tested the industry claim that going free-to-play buys engagement across 20,761 Steam "
            "games released since 2015, finding free games have a median playtime of 124 minutes "
            "against 530 for paid - a gap of more than four to one.",
            "Controlled for genre confounding across the 58 genres holding enough of both pricing "
            "models, which widened Cliff's delta from -0.457 to -0.482 rather than shrinking it, "
            "ruling out the genre explanation instead of assuming it.",
            "Built a resumable, disk-cached collection pipeline over 26,017 apps (52,034 requests, "
            "7 failures), using Mann-Whitney U with tie and continuity corrections and re-running "
            "every owner-dependent result at three bounds, which agreed to within 0.001.",
        ],
    },
    {
        "title": "Support Triage: Conversation Risk Scoring and Reply-Speed Analysis",
        "url": "https://github.com/EileenIp/support-triage",
        "tools": "Python, scikit-learn, TF-IDF, MiniLM, VADER, pandas, pytest",
        "date": "Sep 2026",
        "keywords": "Natural Language Processing, Classification, Model Evaluation, Graph "
                    "Reconstruction, Operational Analytics, Manual Validation",
        "bullets": [
            "Rebuilt 798,197 conversations from an inconsistent reply graph across 2,811,774 real "
            "support tweets by treating the links as one undirected graph after parent-pointer "
            "walking lost threads, validated against a hand-built 15-thread fixture.",
            "Built a risk model reading only the customer's opening message, reaching 0.361 PR-AUC "
            "against 0.251 for the keyword rule support tools ship with on a 23% base rate; "
            "fast-tracking the worst 10% of the queue finds 44% bad outcomes against 23% at random.",
            "Replaced all four pre-written definitions of a bad outcome after hand-auditing 100 "
            "conversations blind, and reported the counter-intuitive result honestly: every tenfold "
            "increase in first-reply time goes with -5.9 percentage points in unanswered conversations.",
        ],
    },
    {
        "title": "Subscriber Churn Early-Warning and LTV Segmentation",
        "url": "https://github.com/EileenIp/subscriber-churn-ltv",
        "tools": "Python, pandas, LightGBM, SHAP, K-Means",
        "date": "Sep 2026",
        "keywords": "Churn Modelling, Customer Lifetime Value, Segmentation, Feature Engineering, "
                    "Leakage Control, Large-Scale Data Processing",
        "bullets": [
            "Built a subscriber churn model on 21,547,746 real subscription transactions, catching "
            "84.2% of real cancellations at the deployed threshold at 45.9% precision - a "
            "deliberately wide net, given a $75 retention offer against an $894 retained-subscriber "
            "value.",
            "Derived the churn definition from the data rather than assuming one, finding 96.8% of "
            "renewals happen within 30 days of expiry, the point this dataset's own renewal-gap "
            "curve flattens.",
            "Crossed churn risk against actual subscription spend to produce a risk-value quadrant a "
            "retention budget can be spent from, and reported that logistic regression beat the "
            "deployed LightGBM on every headline metric (ROC-AUC 0.936 vs 0.676) rather than "
            "softening it.",
        ],
    },
    {
        "title": "Ad Creative Performance Data Pipeline",
        "url": "https://github.com/EileenIp/ad-creative-pipeline",
        "tools": "dbt, DuckDB, Python, GitHub Actions",
        "date": "Sep 2026",
        "keywords": "Data Engineering, dbt, Dimensional Modelling, Data Quality Testing, CI/CD, "
                    "Idempotent Pipelines",
        "bullets": [
            "Built a dbt-core and DuckDB pipeline over 96 daily drop files carrying 8 named defect "
            "types - late arrivals, restatements, exact and near duplicates, a mid-stream schema "
            "change, and a clicks-exceed-impressions platform bug - logged to a ground-truth "
            "manifest of 4,492 defect events so every defect's handling is checkable.",
            "Reconciled the pipeline to ground truth exactly across 25,892 rows for every defect "
            "type the platform can correct, with 10 dbt tests on every build and the one designed "
            "to warn surfacing 76-78 rows per run.",
            "Automated the full daily cycle (generate, load, dbt build, publish) in GitHub Actions "
            "on push, pull request, a daily schedule and manual dispatch, rather than a one-off "
            "local demo.",
        ],
    },
]


def text_of(para):
    return "".join(t.text or "" for t in para.iter(W + "t"))


def make_run(template_run, text=None, tab=False):
    """A copy of template_run carrying either one text node or one tab."""
    run = copy.deepcopy(template_run)
    for child in list(run):
        if child.tag != W + "rPr":
            run.remove(child)
    if tab:
        ET.SubElement(run, W + "tab")
    else:
        node = ET.SubElement(run, W + "t")
        node.text = text
        node.set(XMLSPACE, "preserve")
    return run


def set_runs(para, template_run, texts):
    """Replace a paragraph's runs with one run per text, keeping its pPr."""
    ppr = para.find(W + "pPr")
    for child in list(para):
        if child is not ppr:
            para.remove(child)
    for text in texts:
        para.append(make_run(template_run, text))
    return para


def main():
    if not CV.exists():
        raise SystemExit("CV not found: " + str(CV))

    with zipfile.ZipFile(CV) as z:
        parts = {name: z.read(name) for name in z.namelist()}

    ET.register_namespace("w", W.strip("{}"))
    ET.register_namespace("r", R.strip("{}"))
    doc = ET.fromstring(parts["word/document.xml"])
    rels = ET.fromstring(parts["word/_rels/document.xml.rels"])
    body = doc.find(W + "body")
    paras = list(body.iter(W + "p"))

    # The template entry: its title line, keyword line and first bullet.
    idx = next(i for i, p in enumerate(paras) if TEMPLATE_TITLE in text_of(p))
    t_title, t_keywords, t_bullet = paras[idx], paras[idx + 1], paras[idx + 2]
    bold_run = t_title.find(W + "r")
    plain_run = t_keywords.find(W + "r")
    bullet_run = t_bullet.find(W + "r")
    template_link = t_title.find(".//" + W + "hyperlink")
    if template_link is None:
        raise SystemExit("template entry has no hyperlink to clone")

    # New entries go at the end of PROJECTS, before the template stub.
    anchor = next(p for p in paras
                  if text_of(p).startswith("Template to add New Project"))
    at = list(body).index(anchor)

    used = {rel.get("Id") for rel in rels}
    built = []
    for spec in PROJECTS:
        n = 1
        while "rIdCV%d" % n in used:
            n += 1
        rid = "rIdCV%d" % n
        used.add(rid)
        ET.SubElement(rels, "{%s}Relationship" % RELNS, {
            "Id": rid,
            "Type": HYPERLINK,
            "Target": spec["url"],
            "TargetMode": "External",
        })

        title = copy.deepcopy(t_title)
        set_runs(title, bold_run, [spec["title"] + " | "])
        link = copy.deepcopy(template_link)
        link.set(R + "id", rid)
        for node in link.iter(W + "t"):
            node.text = "GitHub"
        title.append(link)
        title.append(make_run(bold_run, tab=True))
        title.append(make_run(bold_run, tab=True))
        title.append(make_run(bold_run, "%s, %s" % (spec["tools"], spec["date"])))
        built.append(title)

        built.append(set_runs(copy.deepcopy(t_keywords), plain_run, [spec["keywords"]]))
        for bullet in spec["bullets"]:
            built.append(set_runs(copy.deepcopy(t_bullet), bullet_run, [bullet]))

    for offset, para in enumerate(built):
        body.insert(at + offset, para)

    parts["word/document.xml"] = ET.tostring(doc, encoding="UTF-8", xml_declaration=True)
    parts["word/_rels/document.xml.rels"] = ET.tostring(
        rels, encoding="UTF-8", xml_declaration=True)

    shutil.copy(CV, OUT)
    with zipfile.ZipFile(OUT, "w", zipfile.ZIP_DEFLATED) as z:
        for name, blob in parts.items():
            z.writestr(name, blob)

    print("wrote %s" % OUT.name)
    print("  %d projects added, %d paragraphs" % (len(PROJECTS), len(built)))
    print("  original untouched: %s" % CV.name)


if __name__ == "__main__":
    main()
