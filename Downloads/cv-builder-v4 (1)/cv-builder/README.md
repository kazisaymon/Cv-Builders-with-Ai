# CV Builder

A free, browser-based CV builder. Pick a template, write in Bangla, English or any other language, customise colours and fonts, and download a clean A4 PDF. Optional AI tools help you improve, correct and translate your text.

## Features

- **208 templates** across seven categories: Modern, ATS-friendly, Europass, Job CV, Academic CV, Scholarship CV and Bank CV.
- **Eleven layouts**: classic, sidebar, banner, compact, minimal, modern, right sidebar, timeline, executive, ATS and bank.
- **Design panel**: change the accent colour (swatches or any custom colour), font, text size and spacing on top of any template.
- **Any language**: Bengali and Chinese fonts are loaded, so non-Latin text renders correctly in the preview and the PDF.
- **Flexible sections**: entries (jobs, education), plain text, bullet lists and "label : value" detail rows. Add, reorder, collapse and delete sections.
- **Photo upload**: the image is resized in your browser and stored with your CV.
- **Download as PDF, image or Word**: PDF uses the browser print dialog (choose "Save as PDF") so text stays selectable; PNG is a 2x image of the preview; DOCX is an editable Word file with the same colour, font style and sections (a simplified layout, not a pixel copy).
- **Backup and restore**: download your CV as a JSON file and load it again on any device.
- **AI assistant (optional)**: the "AI CV" tab on the right edge of the editor opens a chat. Describe yourself and it writes a full CV, then keep asking ("add a projects section", "make it more professional", "translate to Bangla") and it edits your CV in place. Undo brings back the previous version.
- **Import an existing CV**: attach a photo, PDF, Word (.docx) or text file in the chat and the AI turns it into an editable CV. You can add a note such as "make it one page".
- **Text tools**: Improve, Fix grammar, Write from CV and Translate buttons on individual sections.

## Privacy

Your CV is saved in your own browser (localStorage) and is not uploaded anywhere. The only time data leaves your browser is when you use an AI feature: the text of your request and your current CV (or the file you attach) is sent to this app's server routes, which forward it to Groq or Gemini. Your photo is never sent. API keys stay on the server.

## Getting started

Requirements: Node.js 18.18 or newer.

```bash
npm install
cp .env.example .env.local   # Windows: copy .env.example .env.local
npm run dev                  # http://localhost:3000
```

The app works without any API keys. Only the AI buttons need them.

### Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `GROQ_API_KEY` | For AI | Key from [console.groq.com](https://console.groq.com) |
| `GEMINI_API_KEY` | For AI | Key from [aistudio.google.com](https://aistudio.google.com) |
| `GROQ_MODEL` | No | Overrides the default Groq model |
| `GEMINI_MODEL` | No | Overrides the default Gemini model |
| `GROQ_VISION_MODEL` | No | Overrides the Groq model used to read CV photos when no Gemini key is set |

You need only one of the two keys. If one provider fails, the other is tried automatically.

What each key can read when you attach a file:

| File | Groq key only | Gemini key |
| --- | --- | --- |
| .docx, .txt | Yes | Yes |
| PDF with selectable text | Yes | Yes |
| Scanned PDF | No | Yes |
| Photo or screenshot (JPG, PNG, WebP) | Best effort (vision model) | Yes, recommended |

Files can be up to 4 MB (Vercel limits request bodies to about 4.5 MB). Photos are shrunk in the browser before upload. Old .doc files are not supported; save them as .docx or PDF.

## Deploy to Vercel

1. Push this repository to GitHub.
2. In Vercel, choose **Add New, Project** and import the repository. The framework is detected as Next.js, so no configuration is needed.
3. Before deploying, add `GROQ_API_KEY` and/or `GEMINI_API_KEY` under **Environment Variables**.
4. Deploy. Later pushes to `main` redeploy automatically.

Never commit `.env.local`. It is already listed in `.gitignore`.

## Project structure

```
src/
  app/
    page.tsx            Template gallery with category and colour filters
    editor/page.tsx     Editor and live A4 preview
    api/ai/route.ts     Server route for the chat and text tools (Groq and Gemini)
    api/cv-import/route.ts  Reads an uploaded photo, PDF, .docx or .txt and returns a CV
    globals.css         Fonts, A4 page size and print rules
  components/
    CVPreview.tsx       Renders a CV in every layout
    EditorForm.tsx      Forms, design panel and backup
    AIAssistant.tsx     Side-tab chat: create, edit, import and undo
    AIButtons.tsx       Improve, fix grammar, summary and translate
    DownloadMenu.tsx    Download as PDF, PNG or Word
    Scaled.tsx          Scales the fixed-size A4 page to fit its container
  lib/
    llm.ts              Groq and Gemini calls (server only)
    prompts.ts          System prompts for chat and import
    cvJson.ts           Checks and cleans the AI's JSON before it reaches the editor
    exportDocx.ts       Builds the Word file
    exportFiles.ts      File saving and PNG capture
    templates.ts        Categories, layouts, colours and fonts
    sample.ts           Placeholder CV and the bank CV sample
    store.ts            App state, saved to localStorage (Zustand)
    types.ts            Shared types and design defaults
```

## Customising

- **Add a colour**: add a hex value to `PALETTE` in `src/lib/templates.ts`. New colours should go at the end so saved template ids stay valid.
- **Add a template category**: add an entry to `CATEGORIES` with its layouts and font.
- **Add a layout**: add its name to the `Layout` type in `src/lib/types.ts`, then add a branch for it in `src/components/CVPreview.tsx`.
- **Change the placeholder CV**: edit `src/lib/sample.ts`, then raise `version` in the persist options in `src/lib/store.ts` so browsers replace their old saved sample.

## Tech stack

Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS 3 and Zustand. Libraries: docx (Word export), html-to-image (PNG), mammoth (read .docx) and unpdf (read PDF text).

## Roadmap

- Bilingual interface (Bangla and English)
- Cover letter builder
- More section types, such as projects and publications
- Shareable links
