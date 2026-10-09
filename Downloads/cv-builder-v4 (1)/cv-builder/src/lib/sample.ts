import type { CV } from "./types";

const id = () => Math.random().toString(36).slice(2, 9);
export const newId = id;

export const SAMPLE_CV: CV = {
  name: "YOUR NAME",
  headline: "Your Job Title | Skill 1 | Skill 2 | Skill 3",
  contact: ["City, Country", "you@example.com", "+000 000 000000", "linkedin.com/in/your-handle"],
  sections: [
    {
      id: id(), title: "Profile Summary", kind: "text",
      text: "Write 3-4 sentences about your background, key skills and what you are looking for. Keep it clear and specific to the role you are applying for.",
      items: [],
    },
    {
      id: id(), title: "Technical Skills", kind: "items", text: "",
      items: [
        { id: id(), heading: "Skill Category 1", sub: "", date: "", bullets: ["Tool, technology or skill, tool, technology"] },
        { id: id(), heading: "Skill Category 2", sub: "", date: "", bullets: ["Tool, technology or skill, tool, technology"] },
      ],
    },
    {
      id: id(), title: "Experience", kind: "items", text: "",
      items: [
        { id: id(), heading: "Job Title", sub: "Company or Organization Name", date: "Year - Year",
          bullets: ["Describe what you did and the result you achieved.", "Add numbers where possible (e.g. improved X by 20%)."] },
      ],
    },
    {
      id: id(), title: "Education", kind: "items", text: "",
      items: [
        { id: id(), heading: "Degree Name", sub: "University or School Name", date: "Year - Year", bullets: [] },
      ],
    },
  ],
};

const f = (label: string, value: string) => ({ id: id(), label, value });
const gap = () => f("", "");

// Bank-style CV (Bangladeshi bank job format): boxed headings, "label : value" rows, photo, personal details, references.
export const BANK_CV: CV = {
  name: "Your Name",
  headline: "",
  contact: ["City, Country", "Mobile: +000 0000 000000", "Email: you@example.com"],
  sections: [
    { id: id(), title: "CAREER OBJECTIVE:", kind: "text", items: [],
      text: "Seeking a challenging position as Trainee Assistant Officer where I can apply my analytical ability, disciplined work ethic, and strong academic foundation to contribute effectively to the organization's growth." },
    { id: id(), title: "KEY QUALITIES", kind: "list", items: [],
      text: "Able to work under pressure and meet deadlines.\nStrong analytical and problem-solving ability.\nGood inter-personal and communication skills.\nMultitasking & able to keep confidentialities.\nDisciplined, sincere, and quick to learn new systems." },
    { id: id(), title: "EDUCATIONAL BACKGROUND:", kind: "fields", text: "", items: [],
      fields: [
        f("Title", "Degree Name (e.g. BSc in Your Subject)"), f("Institute Name", "Your University"), f("Result", "CGPA - 0.00 (Out of - 4.00)"), f("Passing Year", "2026"), gap(),
        f("Title", "HSC"), f("Board", "Your Board"), f("Institute Name", "Your College"), f("Result", "0.00 (Out of 5.00)"), f("Passing Year", "2020"), gap(),
        f("Title", "SSC"), f("Board", "Your Board"), f("Institute Name", "Your School"), f("Result", "0.00 (Out of 5.00)"), f("Passing Year", "2018"),
      ] },
    { id: id(), title: "LANGUAGE PROFICIENCY:", kind: "list", items: [],
      text: "Bangla - Native Language. (Excellent in reading, writing, listening and speaking)\nEnglish - Medium of communication. (Excellent in reading, writing, listening and speaking)" },
    { id: id(), title: "COMPUTER SKILL:", kind: "list", items: [],
      text: "Application Programs: MS Word, MS Excel, MS PowerPoint.\nProgramming / Technical: list your tools and languages.\nComputer Networking: Internet browsing & E-mail." },
    { id: id(), title: "KEY PROJECTS:", kind: "list", items: [],
      text: "Project name: one-line description of what you built and the tools used.\nProject name: one-line description." },
    { id: id(), title: "ACHIEVEMENTS & LEADERSHIP:", kind: "list", items: [],
      text: "Your achievement or leadership role, with year.\nTraining or certificate, with institution." },
    { id: id(), title: "PERSONAL DETAILS:", kind: "fields", text: "", items: [],
      fields: [f("Name", ""), f("Father's Name", ""), f("Mother's Name", ""), f("Date of Birth", ""), f("Nationality", "Bangladeshi (By Birth)"), f("Religion", ""), f("Gender", ""), f("Marital Status", "")] },
    { id: id(), title: "PERMANENT ADDRESS:", kind: "text", items: [], text: "Vill: , P.S: , Dist: ." },
    { id: id(), title: "REFERENCE:", kind: "fields", text: "", items: [],
      fields: [f("Name", ""), f("Designation", ""), f("Email ID", ""), f("Relation", ""), gap(), f("Name", ""), f("Designation", ""), f("Email ID", ""), f("Relation", "")] },
  ],
};
