# Story Tools - Quick Start Guide

**Get creating stories in 2 minutes!**

---

## Step 1: Install (30 seconds)

```bash
cd ~/.claude/skills/webgpu-threejs-tsl/tools
npm install
```

---

## Step 2: Run Wizard (90 seconds)

```bash
npm run wizard
```

Follow the prompts:

1. **Choose template:** "Simple Scroll Story - 3 sections" (recommended for first time)
2. **Story title:** "My First Gallery"
3. **Description:** "A beautiful scroll-driven gallery"
4. **Add catalogs?** Yes → "Use default catalogs"
5. **Modify sections?** No (keep template sections)
6. **Configure performance?** No (use defaults)
7. **Save as:** `my-first-gallery.story.json`

**Done!** You now have a valid story.json file.

---

## Step 3: Validate

```bash
npm run validate my-first-gallery.story.json
```

Should see:
```
╔═══════════════════════════════════════════════════╗
║                                                   ║
║          ✓ Story is valid!                       ║
║                                                   ║
╚═══════════════════════════════════════════════════╝
```

---

## Step 4: Use in StoryRunner

```javascript
import StoryRunner from './story/StoryRunner.js';

const runner = new StoryRunner('./my-first-gallery.story.json');
await runner.init();
```

---

## What You Created

Your `my-first-gallery.story.json` contains:

- **3 sections:** intro, content, outro
- **Timeline animations:** Opacity fades with easing
- **Default catalogs:** Ready to use starter assets
- **Performance settings:** Optimized for smooth scrolling

---

## Next Steps

### Customize Your Story

1. **Edit the JSON file:**
   ```bash
   code my-first-gallery.story.json
   ```

2. **Change section parameters:**
   ```json
   "params": {
     "title": "Your Custom Title",
     "subtitle": "Your Subtitle"
   }
   ```

3. **Add more keyframes:**
   ```json
   "timeline": [
     { "t": 0, "opacity": 0 },
     { "t": 0.5, "opacity": 0.5, "position": [0, 1, 0] },
     { "t": 1, "opacity": 1, "position": [0, 0, 0] }
   ]
   ```

4. **Re-validate:**
   ```bash
   npm run validate my-first-gallery.story.json
   ```

### Create Custom Story

Run wizard again and choose **"Blank Template"** to build from scratch:

```bash
npm run wizard
```

---

## Example Output (Wizard)

```
╔═══════════════════════════════════════════════════╗
║                                                   ║
║         WebGPU Story.json Wizard                  ║
║                                                   ║
║   Interactive CLI for creating scroll stories    ║
║                                                   ║
╚═══════════════════════════════════════════════════╝

? Choose a starting template: Simple Scroll Story - 3 sections
✓ Loaded template: Simple Scroll Story - 3 sections

── Story Metadata ──────────────────────────────────
? Story title (for reference): My First Gallery
? Story description: A beautiful scroll-driven gallery
✓ Metadata configured

── Asset Catalogs ──────────────────────────────────
? Add asset catalogs? Yes
? Catalog configuration: Use default catalogs (recommended)
✓ Added 3 default catalogs

── Story Sections ──────────────────────────────────
? How many sections? 3
? Modify sections? No

── Performance Settings ────────────────────────────
? Configure performance settings? No
ℹ Using default performance settings

── Save Story ──────────────────────────────────────
? Save as: my-first-gallery.story.json
✓ Story saved to: /path/to/my-first-gallery.story.json

╔═══════════════════════════════════════════════════╗
║                                                   ║
║              Story Created Successfully!          ║
║                                                   ║
╚═══════════════════════════════════════════════════╝

Summary:
  Title: My First Gallery
  Sections: 3
  Catalogs: 3
  File: /path/to/my-first-gallery.story.json
```

---

## Troubleshooting

### "Cannot find module 'inquirer'"
```bash
cd tools
npm install
```

### "File exists. Overwrite?"
Choose **Yes** to replace, or change filename.

### Validation errors
Read the error message carefully:
- Missing required field? Add it to JSON
- Value out of range? Check min/max (e.g., t must be 0-1)
- Wrong type? Check string vs number vs array

---

## Tips

- **Start with a template** - Easier than blank
- **Validate often** - Catch errors early
- **Small keyframe count** - 2-3 keyframes per section is enough
- **Test in browser** - Load with StoryRunner to see it in action

---

## Ready to Create?

```bash
npm run wizard
```

**Have fun building scroll stories!** 🎨✨

---

**More Help:** See `tools/README.md` for full documentation
