// Personal progress notes. Keep plans separate from completed milestones.
const PROGRESS_DATA = {
  "goals": [
    {
      "title": "Find my next internship",
      "description": "I’m studying Computer Science and Commerce at UQ and looking for an internship where I can use both. Right now, I’m preparing applications and working on how I explain my experience and projects.",
      "status": "In progress"
    },
    {
      "title": "Complete my BSAN4201 presentation",
      "description": "I’m exploring how a traditional product could become a useful AI-enabled service. My individual presentation is due on 12 October. I’m still choosing the idea, then I’ll work through the customer problem, analysis and business model.",
      "status": "In progress"
    },
    {
      "title": "Make my portfolio reflect my work",
      "description": "I want someone visiting my website to understand what I built, why I built it and what I learned. I’m improving the case studies and dashboards I already have, while making the site easier to explore.",
      "status": "In progress"
    },
    {
      "title": "Build toward media, marketing and gaming",
      "description": "These are the areas I want to work in. I’m exploring projects around player retention, launch sentiment, advertising and streaming, with a focus on questions a team could actually use the answers to.",
      "status": "In progress"
    },
    {
      "title": "Finish my internship course",
      "description": "An internship is part of my path to completing university. Securing an offer is the next milestone; completing the placement and course comes after that.",
      "status": "Not started"
    }
  ],
  "monthlyLog": [
    {
      "month": "September",
      "year": 2026,
      "links": [
        { "label": "Support triage", "href": "projects.html?project=support-ticket-sentiment-tracker" },
        { "label": "Launch sentiment", "href": "projects.html?project=launch-sentiment-helldivers-2024" },
        { "label": "Ad creative pipeline", "href": "projects.html?project=ad-creative-performance-pipeline" }
      ],
      "entry": "Three projects reached a finished state this month: an ad creative pipeline built to survive a deliberately messy upstream, a launch sentiment study of a game’s review history, and a support triage model that scores a customer’s first message as it arrives. Two of the three ended somewhere I wasn’t expecting — the early-warning idea behind the sentiment project didn’t hold up, and in the triage project faster replies went with worse outcomes rather than better. Those are the ones I’d rather be asked about.\n\nThe triage project also changed how I think about labelling. Nothing in the data said which conversations went badly, so I read a hundred of them myself and decided one at a time. None of the four definitions I’d written in advance matched what I was actually judging on, and the conversations I couldn’t call turned out to share a shape — the customer simply stops replying, and the ending happens somewhere the data can’t see.\n\nA fourth project, comparing free-to-play and paid games on Steam, has its analysis done but not its write-up. The result contradicts what I assumed going in, so I want to be clear about what can honestly be claimed from it before it goes on the site.\n\nOn the site itself I rebuilt the job tracker around application stages, added proper link previews and icons, and gave every project a real image. Next is applications and my BSAN4201 presentation on 12 October."
    },
    {
      "month": "August",
      "year": 2026,
      "links": [
        { "label": "E-commerce purchase prediction", "href": "projects.html?project=ecommerce-behavior-conversion-2019" },
        { "label": "Creator content dashboard", "href": "projects.html?project=creator-content-decision-dashboard-2026" },
        { "label": "Advertising revenue and sales efficiency", "href": "projects.html?project=advertising-revenue-sales-efficiency-2026" }
      ],
      "entry": "My project work focused on e-commerce purchase prediction and conversion funnels, a creator content decision dashboard, and advertising revenue and sales efficiency. These projects connect my interests in customer behaviour, media and marketing.\n\nI worked on explaining my e-commerce project for interviews and presenting it through my portfolio. I also spent time on application and interview preparation, and on making dashboard filters, tooltips and labels easier to understand.\n\nFor BSAN4201, I started brainstorming traditional products that could become AI-enabled services. I’m interested in finding an idea where the AI has a clear purpose in the customer’s experience."
    },
    {
      "month": "June",
      "year": 2026,
      "entry": "I was reaching out to recruiters and exploring student and early-career opportunities across data, analytics, AI and business strategy. I worked on making my messages clearer about my background and the opportunities I’m looking for."
    },
    {
      "month": "April",
      "year": 2026,
      "entry": "My YouTube channel reached 10,000 subscribers. I started the channel in August 2023 and reached 5,000 subscribers in December 2024, so this marks another milestone in a project I’ve continued alongside university."
    },
    {
      "month": "January",
      "year": 2026,
      "entry": "I built out my dashboard portfolio across e-commerce, marketing, customer feedback and finance. Projects included Shopify sales and customer funnels, Meta advertising performance, and insurance risk and claims analysis.\n\nOther work covered customer churn, vendor performance, bank fraud monitoring and loan application tracking. I’m grouping these projects here as a period of dashboard practice, with selected work featured in my portfolio."
    }
  ],
  "pastYears": [
    {
      "year": 2025,
      "summary": "Data analyst internship, machine learning projects and a growing interest in media analytics.",
      "details": "November — Worked on Facebook page classification using graph neural networks, and an artist selection insights visualisation presentation. These projects brought together machine learning and communicating analysis.\n\nJune — Undertook a data analyst internship in the NDIS sector.\n\nDuring the year — Worked on a machine learning model for Olympic table tennis talent identification, alongside projects in telecom churn prediction, credit card fraud classification and loan risk analysis.\n\nJanuary — Created a Spotify listening analytics dashboard, adding a music-focused project to my portfolio.\n\nBy December, I was exploring the kinds of data projects that could help me move toward media and entertainment roles in Australia and Hong Kong. That interest still shapes the projects I want to build, from audience behaviour to marketing performance and retention."
    },
    {
      "year": 2024,
      "summary": "Reached 1,000 and then 5,000 YouTube subscribers while building my early analytics projects.",
      "details": "December — My YouTube channel reached 5,000 subscribers.\n\nDuring the year — Built early analysis and machine learning projects covering customer segmentation, bank marketing segmentation, stock market prediction, email spam classification and house price prediction.\n\nJune — Reached 1,000 YouTube subscribers, the first major audience milestone after launching the previous year.\n\nAlongside these projects, I continued my university studies in business analytics, computing and mathematics."
    },
    {
      "year": 2023,
      "summary": "Started my YouTube channel alongside my computing and commerce studies.",
      "details": "August — Started my YouTube channel.\n\nAt university, I continued studying computing and commerce, including programming, data, databases, business analytics, finance and accounting."
    },
    {
      "year": 2022,
      "summary": "Built my university foundations in computing, mathematics and business.",
      "details": "My coursework covered programming, mathematics, statistics, information systems, accounting, economics and management — the foundations for my later data and analytics projects."
    }
  ]
};
