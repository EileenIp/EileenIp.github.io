// Progress page content. Edit this file to update the page — no HTML editing needed.
// See README-progress.md for exactly what to change each month.
const PROGRESS_DATA = {
  // One card per goal. status must be exactly "Done", "In progress", or "Not started"
  // (these three strings control the tag color — see js/progress.js STATUS_STYLE).
  goals: [
    {
      title: "Ship a personal project every quarter",
      description: "Four small, finished things instead of one big unfinished one. Two down so far.",
      status: "In progress",
    },
    {
      title: "Read 24 books",
      description: "Split evenly between fiction and non-fiction. Tracking on Storygraph.",
      status: "In progress",
    },
    {
      title: "Learn watercolor painting",
      description: "Bought the supplies in January. Haven't opened them yet.",
      status: "Not started",
    },
    {
      title: "Run a half marathon",
      description: "Finished the city half in March, under my goal time.",
      status: "Done",
    },
  ],

  // Newest entry first. Add a new entry at the top of this array each month.
  monthlyLog: [
    { month: "August", year: 2026, entry: "Started the freelance illustration project. Portfolio site redesign is finally live." },
    { month: "July", year: 2026, entry: "Finished book #14. Took two weeks off for a trip to Lisbon — no side projects touched." },
    { month: "June", year: 2026, entry: "Shipped the Q2 project: a small Chrome extension for tab management. Started training for the half." },
    { month: "May", year: 2026, entry: "Slow month — mostly client work. Read two books, both non-fiction." },
    { month: "April", year: 2026, entry: "Ran the city half marathon. Beat my goal time by six minutes." },
  ],

  // Newest year first. "details" is the text shown when a year is expanded.
  pastYears: [
    {
      year: 2025,
      summary: "Shipped 3 projects, read 19 books, missed the marathon goal.",
      details: "Started the year strong with a redesign of an old side project, then two more smaller tools over the summer. Reading pace slowed in Q4. Signed up for a marathon in the fall but a knee injury in October ended that plan — deferred to 2026 as a half instead.",
    },
    {
      year: 2024,
      summary: "First full year of consistent side projects. Learned the basics of Blender.",
      details: "The year this whole tracking habit started. Spent the first few months just experimenting with Blender tutorials, then applied it to a couple of small 3D pieces for the portfolio. No formal goals set — this list started as a retroactive summary.",
    },
  ],
};
