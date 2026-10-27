// Personal progress notes. Keep plans separate from completed milestones.
const PROGRESS_DATA = {
  "goals": [
    {
      "title": "Graduate from UQ",
      "description": "To finish my degree I need to complete RBUS3999, UQ’s Business Industry Placement course. I can only enrol once I have an internship, so right now I’m applying for internships. I’m aiming to graduate in June 2027.",
      "status": "In progress"
    },
    {
      "title": "Build my own brand",
      "description": "I want to show that you don’t need to be a strong communicator to be independent. Long, wordy writing is hard for me to follow, so I make things that make sense at a glance. I’ll post vlogs of me working on YouTube, and faceless posts about AI products, prompts and agents on LinkedIn and Instagram.",
      "status": "Not started"
    },
    {
      "title": "Build AI products",
      "description": "I want to build tools for people who find communication hard, and that break complex ideas down into simple information. ConverseAssist, my conversation accessibility prototype, was a first step in this direction.",
      "status": "Not started"
    },
    {
      "title": "Learn financial trading",
      "description": "I want to understand how a trade works from the first idea to closing it. I’m learning through a short course, then practising with fake money.",
      "status": "Not started"
    },
    {
      "title": "Learn Mandarin and Japanese",
      "description": "For Mandarin, I’m starting with words I actually see: anime, miHoYo games and shopping on Taobao. For Japanese, I’m learning hiragana, katakana and kanji through common anime phrases.",
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
      "entry": "Three projects reached a finished state this month: an ad creative pipeline built to survive a deliberately messy upstream, a launch sentiment study of a game’s review history, and a support triage model that scores a customer’s first message as it arrives. Two of the three ended somewhere I wasn’t expecting — the early-warning idea behind the sentiment project didn’t hold up, and in the triage project faster replies went with worse outcomes rather than better. Those are the ones I’d rather be asked about.\n\nThe triage project also changed how I think about labelling. Nothing in the data said which conversations went badly, so I read a hundred of them myself and decided one at a time. None of the four definitions I’d written in advance matched what I was actually judging on, and the conversations I couldn’t call turned out to share a shape — the customer simply stops replying, and the ending happens somewhere the data can’t see.\n\nA fourth project, comparing free-to-play and paid games on Steam, went up mid-month. The result contradicted what I assumed going in: going free did not buy more playtime.\n\nOn the site itself I rebuilt the job tracker around application stages, added proper link previews and icons, and gave every project a real image. Next is applications and my BSAN4201 presentation on 12 October."
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
