---
name: technical-explainer
description: "Deep-dive technical explainer for codebases. Analyzes source code directly (not just docs), extracts architectural patterns, presents code with explanations, determines appropriate depth per topic. Use for: explaining codec/serialization systems, compiler internals, ML pipelines, distributed systems, or any complex technical project where understanding the actual implementation matters."
---

# Technical Explainer: Deep Codebase Analysis

Build comprehensive technical explanations by analyzing **actual source code**, not just documentation. This skill guides systematic code archaeology to understand design decisions, trade-offs, and implementation details.

## Philosophy

**Code is the truth. Docs lie.**

1. Always read source code before writing explanations
2. Determine explanation depth based on complexity, not word count
3. Show actual code snippets with inline annotations
4. Explain the "why" behind design decisions
5. Surface trade-offs explicitly
6. Let complexity drive structure (simple things short, hard things long)

---

## Phase 0: Plan Mode (Clarifying Questions)

**MANDATORY FIRST STEP**: Before any code analysis, engage with the user to scope the work.

### 0.1 Initial Scan

Quickly survey the codebase to understand what exists:
- Count files by type (`.go`, `.rs`, `.ts`, etc.)
- Identify major directories
- Find README, docs, or architecture files
- Check for existing tests/benchmarks

### 0.2 Ask Clarifying Questions

Based on the scan, ask the user:

```markdown
## Scope Questions

1. **Primary Focus**: What aspect interests you most?
   - [ ] Overall architecture (how pieces fit together)
   - [ ] Specific module deep-dive (which one?)
   - [ ] Comparison (e.g., Gen1 vs Gen2, old vs new)
   - [ ] Performance characteristics
   - [ ] API surface / how to use it

2. **Audience Level**: Who will read this?
   - [ ] Expert (skip basics, focus on novel parts)
   - [ ] Intermediate (some context, more depth on hard parts)
   - [ ] Beginner (explain everything, progressive disclosure)

3. **Output Format**:
   - [ ] Interactive web app (Vite + React)
   - [ ] Markdown document
   - [ ] Annotated source tour
   - [ ] Quick reference / cheat sheet

4. **Visual Theme** (for web output):
   - [ ] Light (clean, technical, makingsoftware.com style)
   - [ ] Academic (scholarly, gwern.net style)
   - [ ] Dark (high contrast, developer-focused)
   - [ ] Custom (describe)

5. **Depth Preference**:
   - [ ] Comprehensive (all modules, full detail)
   - [ ] Focused (1-2 key areas in depth)
   - [ ] Survey (breadth over depth, quick overview)

6. **Specific Questions**: Any particular aspects you want answered?
   - (e.g., "Why does it use varint?", "How does the dictionary work?")
```

### 0.3 Confirm Understanding

Before proceeding, summarize back:
```markdown
## Plan Summary

**Target**: [project name]
**Focus**: [what we'll cover]
**Depth**: [L1-L5 per section]
**Output**: [format + theme]
**Key Questions**: [specific things to answer]

Proceed? [Y/modify]
```

Only after user confirms, proceed to Phase 1.

---

## Phase 1: Codebase Reconnaissance

Before writing anything, systematically scan the codebase.

### 1.1 Directory Structure Analysis

```bash
# Get project layout
tree -L 3 -I 'node_modules|vendor|__pycache__|.git' $PROJECT_ROOT

# Find main entry points
find . -name "main.*" -o -name "index.*" -o -name "mod.rs" -o -name "lib.rs"

# Find type definitions (the skeleton of any system)
find . -name "types.*" -o -name "*_types.*" -o -name "models.*"

# Find test files (tests reveal intended behavior)
find . -name "*_test.*" -o -name "test_*" -o -name "*.spec.*"
```

### 1.2 Core Type Extraction

Types are the most important thing to understand first. Extract all type definitions:

```bash
# Go: Find all struct/interface definitions
grep -rn "^type .* struct" --include="*.go" | head -50
grep -rn "^type .* interface" --include="*.go" | head -30

# Rust: Find struct/enum/trait definitions
grep -rn "^pub struct\|^struct\|^pub enum\|^enum\|^pub trait\|^trait" --include="*.rs"

# TypeScript: Find interface/type definitions
grep -rn "^export interface\|^interface\|^export type\|^type " --include="*.ts"

# Python: Find class definitions
grep -rn "^class " --include="*.py"
```

### 1.3 Public API Surface

What does this system expose? Find public functions/methods:

```bash
# Go: Exported functions (capitalized)
grep -rn "^func [A-Z]" --include="*.go" | head -50

# Rust: pub fn
grep -rn "^pub fn\|^    pub fn" --include="*.rs" | head -50

# Find all exported symbols
grep -rn "^export " --include="*.ts" --include="*.js"
```

### 1.4 Constants and Configuration

Constants reveal design constraints and magic numbers:

```bash
# Find const declarations
grep -rn "^const\|^var .* = " --include="*.go" | grep -v "_test.go"
grep -rn "^const\|^static\|^lazy_static" --include="*.rs"
grep -rn "^const\|^let .* = Object.freeze" --include="*.ts" --include="*.js"

# Find default values and limits
grep -rn "Default\|Max\|Min\|Limit\|Timeout\|Size" --include="*.go" --include="*.rs"
```

### 1.5 Error Handling Patterns

Errors reveal edge cases and failure modes:

```bash
# Go errors
grep -rn "errors.New\|fmt.Errorf\|var Err" --include="*.go"

# Rust errors
grep -rn "Error\|Result<\|anyhow\|thiserror" --include="*.rs"

# Find panic/fatal paths
grep -rn "panic\|fatal\|unreachable" --include="*.go" --include="*.rs"
```

---

## Phase 2: Architectural Analysis

### 2.1 Dependency Graph

Understand what depends on what:

```bash
# Go: imports per file
grep -rn "^import" --include="*.go" -A 20 | grep -E '^\s+"'

# Find circular dependency candidates
# (files that import each other)

# Find the "core" packages (imported by many)
grep -rh "\".*\"" --include="*.go" | sort | uniq -c | sort -rn | head -20
```

### 2.2 Data Flow Analysis

Trace how data moves through the system:

1. **Input boundaries**: Where does data enter? (HTTP handlers, CLI args, file readers)
2. **Transformations**: What functions transform data?
3. **Output boundaries**: Where does data exit? (writers, serializers, network)

```bash
# Find I/O boundaries
grep -rn "io.Reader\|io.Writer\|Read\|Write\|Encode\|Decode" --include="*.go"
grep -rn "impl.*Read\|impl.*Write\|serde" --include="*.rs"
```

### 2.3 Concurrency Patterns

If concurrent, understand the model:

```bash
# Go concurrency
grep -rn "go func\|chan \|sync\.\|atomic\." --include="*.go"

# Rust concurrency
grep -rn "Arc<\|Mutex<\|RwLock<\|async fn\|tokio::\|spawn" --include="*.rs"

# Find potential race conditions (shared mutable state)
grep -rn "var .* = \|static mut" --include="*.go" --include="*.rs"
```

---

## Phase 3: Deep Dive Modules

For each major module, extract:

### 3.1 The "What"

- Primary purpose (1 sentence)
- Key types (structs/classes)
- Public API surface
- Dependencies (imports)

### 3.2 The "How"

- Core algorithm (with actual code)
- Data structures used
- Memory management approach
- Error handling strategy

### 3.3 The "Why"

- Design decisions (from comments, commit messages, or inference)
- Trade-offs made
- What alternatives were rejected
- Performance characteristics

### 3.4 Code Snippet Template

For each important function, present:

```
## [Function Name]

**Purpose**: [1 sentence]

**Signature**:
```[lang]
func EncodeValue(v Value, buf *Buffer) error
```

**Key Logic**:
```[lang]
// Actual code with inline annotations
switch v.Type() {
case TypeNull:
    buf.WriteByte(tagNull)  // Single byte, no payload
case TypeInt64:
    buf.WriteByte(tagInt64)
    buf.WriteVarint(v.Int64())  // Varint encoding saves space
case TypeString:
    buf.WriteByte(tagString)
    buf.WriteVarint(len(v.String()))  // Length-prefixed
    buf.WriteString(v.String())
// ...
}
```

**Trade-offs**:
- Uses varint for integers (saves space, costs CPU)
- No type coercion (explicit > implicit)
- Single-pass encoding (no backpatching)

**Performance**: O(n) where n = serialized size. No allocations for primitive types.
```

---

## Phase 4: Explanation Depth Calibration

Not everything needs equal depth. Calibrate based on:

### Depth Levels

| Level | When to Use | Content |
|-------|-------------|---------|
| **L1: Glance** | Trivial/obvious code | 1-2 sentences, no code |
| **L2: Summary** | Standard patterns | Purpose + key types + 1 code snippet |
| **L3: Walkthrough** | Important but conventional | Full API + 2-3 annotated snippets + trade-offs |
| **L4: Deep Dive** | Novel/complex/critical path | Everything: algorithm, memory, perf, alternatives, edge cases |
| **L5: Archaeology** | Confusing/surprising code | Git blame, commit history, design docs, "why is this weird?" |

### Complexity Signals

Increase depth when you see:
- Bitwise operations
- Unsafe code blocks
- Complex state machines
- Custom allocators / memory management
- Concurrent data structures
- Numerical algorithms
- Compression / encoding schemes
- Graph algorithms
- Performance-critical hot paths

Decrease depth when you see:
- CRUD operations
- Standard library wrappers
- Configuration parsing
- Logging / metrics
- Test utilities

---

## Phase 5: Output Formats

### Format A: Interactive Web App (Vite + React)

For maximum engagement. Use when:
- Multiple audiences (beginner to expert)
- Complex visualizations needed
- Interactive code exploration valuable

Structure:
```
project/
├── index.html
├── src/
│   ├── main.jsx
│   ├── App.jsx
│   ├── components/
│   │   ├── CodeBlock.jsx      # Syntax highlighted, annotated
│   │   ├── TypeDiagram.jsx    # Interactive type relationships
│   │   ├── DataFlowViz.jsx    # Animated data flow
│   │   ├── ComparisonTable.jsx
│   │   └── DeepDive.jsx       # Expandable deep sections
│   └── data/
│       ├── types.json
│       ├── functions.json
│       └── architecture.json
└── vite.config.js
```

### Format B: Markdown Document

For documentation that lives with code. Use when:
- Target is developers who'll read in IDE/GitHub
- Needs to be version controlled with code
- No need for interactivity

Structure:
```markdown
# [Project] Technical Deep Dive

## Executive Summary
[2-3 paragraphs for busy people]

## Architecture Overview
[Diagram + 1 page explanation]

## Core Types
[Type definitions with annotations]

## Module: [Name]
### Purpose
### Key Types
### Core Functions
### Trade-offs

## Performance Characteristics

## Known Issues & Limitations

## Appendix: Code Snippets
```

### Format C: Annotated Source Tour

For learning by reading code. Use when:
- Code is the best documentation
- Reader wants to understand by following execution
- System is small enough to read linearly

Structure:
```
# [Project] Source Tour

## Reading Order
1. types.go - Start here, all data structures
2. encode.go - How data becomes bytes
3. decode.go - How bytes become data
4. optimize.go - Performance tricks

## types.go (annotated)
[Full file with // EXPLAIN: comments inline]

## encode.go (annotated)
[Full file with // EXPLAIN: comments inline]
```

---

## Phase 6: Code Presentation Patterns

### Pattern: Side-by-Side Comparison

When comparing two approaches (e.g., Gen1 vs Gen2):

```jsx
<div className="comparison">
  <div className="left">
    <h4>Gen1: Inline Keys</h4>
    <CodeBlock lang="go">{`
// Keys stored with each object
func encodeObject(obj Object, buf *Buffer) {
    buf.WriteByte(tagObject)
    buf.WriteVarint(len(obj.Fields))
    for key, val := range obj.Fields {
        buf.WriteString(key)  // Key inline
        encodeValue(val, buf)
    }
}
    `}</CodeBlock>
    <p>Simple, single-pass, but keys repeated</p>
  </div>
  <div className="right">
    <h4>Gen2: Dictionary Indexed</h4>
    <CodeBlock lang="go">{`
// Keys reference dictionary by index
func encodeObject(obj Object, buf *Buffer, dict *Dict) {
    buf.WriteByte(tagObject)
    buf.WriteVarint(len(obj.Fields))
    for key, val := range obj.Fields {
        idx := dict.GetIndex(key)  // O(1) lookup
        buf.WriteVarint(idx)       // Index, not string
        encodeValue(val, buf, dict)
    }
}
    `}</CodeBlock>
    <p>Two-pass, but massive savings on repeated schemas</p>
  </div>
</div>
```

### Pattern: Annotated Code Block

For explaining complex functions:

```jsx
<AnnotatedCode
  lang="go"
  code={actualCode}
  annotations={[
    { line: 3, text: "Varint uses 1-10 bytes depending on magnitude" },
    { line: 7, text: "Unsafe slice avoids allocation - caller must not modify" },
    { line: 12, text: "Early return on zero prevents div-by-zero below" },
  ]}
/>
```

### Pattern: Data Structure Visualization

For showing how bytes map to types:

```jsx
<WireFormatViz
  example='{"name": "alice"}'
  bytes={[
    { hex: "06", meaning: "Object tag", color: "purple" },
    { hex: "01", meaning: "Field count: 1", color: "yellow" },
    { hex: "04", meaning: "Key length: 4", color: "yellow" },
    { hex: "6E616D65", meaning: "'name' UTF-8", color: "green" },
    { hex: "05", meaning: "String tag", color: "purple" },
    { hex: "05", meaning: "Value length: 5", color: "yellow" },
    { hex: "616C696365", meaning: "'alice' UTF-8", color: "green" },
  ]}
/>
```

### Pattern: Decision Tree

For explaining when to use what:

```jsx
<DecisionTree
  question="What are you serializing?"
  branches={[
    {
      answer: "Graph data (nodes, edges)",
      result: "Use Gen1 (has GraphShard, NodeBatch)",
    },
    {
      answer: "Repeated JSON schemas (1000+ objects)",
      next: {
        question: "Need compression?",
        branches: [
          { answer: "Yes", result: "Use Gen2 with zstd" },
          { answer: "No", result: "Use Gen2 uncompressed" },
        ]
      }
    },
    {
      answer: "Real-time / low-latency",
      result: "Use Gen1 (single-pass, predictable)",
    },
    {
      answer: "ML tensors",
      result: "Use Gen2 (native Tensor type, zero-copy)",
    },
  ]}
/>
```

---

## Phase 7: Quality Checklist

Before publishing, verify:

### Content Quality
- [ ] All code snippets are from actual source (not paraphrased)
- [ ] Types are accurate (verified against source)
- [ ] Performance claims have evidence (benchmarks, complexity analysis)
- [ ] Trade-offs are explicit, not hidden
- [ ] "Why" is explained for non-obvious decisions

### Explanation Quality
- [ ] Executive summary fits in 1 screen
- [ ] Reader can stop at any depth level and have value
- [ ] Complex topics have more depth, simple topics less
- [ ] Code is annotated, not just shown
- [ ] Diagrams complement text, not replace it

### Technical Accuracy
- [ ] Function signatures match actual code
- [ ] Error handling is explained
- [ ] Edge cases are noted
- [ ] Security implications mentioned if relevant
- [ ] Performance characteristics are O() annotated

---

## Example: Codec System Analysis Template

For a serialization codec like SJSON/GLYPH:

### 1. Type System
```
- List all type tags with hex values
- Show wire format for each type
- Explain encoding rules
- Show actual encoder code
```

### 2. Encoding Pipeline
```
- Input: What goes in (Go value, JSON, etc.)
- Transformation: Key algorithms (varint, dict building, etc.)
- Output: What comes out (byte slice)
- Show actual encode function with annotations
```

### 3. Decoding Pipeline
```
- Inverse of encoding
- Error handling (malformed input)
- Security limits (max depth, max size)
- Show actual decode function with annotations
```

### 4. Optimization Techniques
```
- Buffer pooling
- Zero-copy access
- Dictionary encoding
- Compression options
- Show actual optimization code
```

### 5. Language Implementations
```
- For each language (Go, Rust, Python, etc.):
  - Idiomatic patterns used
  - Performance characteristics
  - Known limitations
  - Show key differences in implementation
```

### 6. Benchmarks & Comparisons
```
- vs JSON (size, speed)
- vs MessagePack, CBOR, Protobuf
- Best/worst case datasets
- Show actual benchmark code and results
```

---

## Anti-Patterns to Avoid

1. **Docs-only analysis**: Never write about code you haven't read
2. **Metrics without code**: Charts are supplements, not substitutes
3. **Uniform depth**: Don't explain everything equally
4. **Paraphrased code**: Show actual snippets, not pseudo-code
5. **Missing "why"**: Always explain design decisions
6. **Ignoring edge cases**: They reveal true complexity
7. **Skipping error paths**: Errors are part of the API
8. **Assuming reader context**: Explain abbreviations, jargon
9. **Static diagrams for dynamic systems**: Use interactive viz
10. **Ignoring tests**: Tests are executable documentation

---

## Visual Themes

When generating interactive web apps, apply one of these visual themes.

### Theme: Light (MakingSoftware-inspired)

Clean, technical documentation style with excellent readability.

**Reference**: makingsoftware.com/chapters/shaders

```css
:root {
  /* Colors */
  --bg-primary: #fbfbfb;
  --bg-secondary: #f5f5f5;
  --text-primary: #1a1a1a;
  --text-secondary: #666666;
  --accent-cyan: #4ecdc4;
  --accent-yellow: #ffe66d;
  --accent-purple: #7b68ee;
  --code-bg: rgba(0, 0, 0, 0.025);
  --border-light: rgba(0, 0, 0, 0.08);

  /* Typography */
  --font-heading: 'New York', 'Iowan Old Style', 'Palatino Linotype', 'URW Palladio L', serif;
  --font-body: 'SF Pro Text', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-mono: 'Departure Mono', 'SF Mono', 'Fira Code', monospace;

  /* Sizing */
  --content-width: 720px;
  --line-height: 1.7;
  --font-size-base: 17px;
  --font-size-h1: 36px;
  --font-size-h2: 28px;
  --font-size-code: 14px;
}

body {
  background: var(--bg-primary);
  color: var(--text-primary);
  font-family: var(--font-body);
  font-size: var(--font-size-base);
  line-height: var(--line-height);
  text-align: justify;
  hyphens: auto;
}

h1, h2, h3 {
  font-family: var(--font-heading);
  font-weight: 500;
  letter-spacing: -0.02em;
}

code, pre {
  font-family: var(--font-mono);
  font-size: var(--font-size-code);
  background: var(--code-bg);
  border-radius: 4px;
}

/* Technical diagrams */
.diagram {
  display: flex;
  gap: 2rem;
  justify-content: center;
  margin: 2rem 0;
}

.diagram-block {
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  font-family: var(--font-mono);
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.diagram-block.core { background: var(--accent-cyan); }
.diagram-block.cache { background: var(--accent-yellow); }
.diagram-block.memory { background: var(--accent-purple); color: white; }

/* Progress indicator (right margin) */
.progress-track {
  position: fixed;
  right: 2rem;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.progress-dot {
  width: 8px;
  height: 2px;
  background: var(--border-light);
}

.progress-dot.active {
  background: var(--accent-purple);
}
```

**Characteristics**:
- Off-white background for reduced eye strain
- Serif headings (elegant, modern)
- Monospace for code and technical labels
- Clean diagrams with cyan/yellow/purple accents
- Progress indicator on right margin
- Justified text with generous whitespace
- Labeled components in uppercase monospace

---

### Theme: Academic (Gwern-inspired)

Scholarly, long-form reading style with sidenotes and citations.

**Reference**: gwern.net/me

```css
:root {
  /* Colors */
  --bg-primary: #fcfcfc;
  --bg-secondary: #f8f8f8;
  --text-primary: #1a1a1a;
  --text-secondary: #4a4a4a;
  --text-muted: #808080;
  --link-color: #5d5d5d;
  --link-hover: #000000;
  --border-color: #e0e0e0;
  --blockquote-border: #ddd;

  /* Typography */
  --font-heading: 'Source Serif 4', 'Source Serif Pro', 'Palatino', Georgia, serif;
  --font-body: 'Source Serif 4', 'Source Serif Pro', Georgia, serif;
  --font-mono: 'IBM Plex Mono', 'Consolas', monospace;
  --font-smallcaps: 'Source Serif 4', serif;

  /* Sizing */
  --content-width: 750px;
  --sidenote-width: 250px;
  --line-height: 1.6;
  --font-size-base: 20px;
  --font-size-h1: 50px;
  --font-size-h2: 24px;
  --font-size-sidenote: 14px;
}

body {
  background: var(--bg-primary);
  color: var(--text-primary);
  font-family: var(--font-body);
  font-size: var(--font-size-base);
  line-height: var(--line-height);
  text-align: justify;
  hyphens: auto;
}

h1 {
  font-family: var(--font-heading);
  font-size: var(--font-size-h1);
  font-weight: 400;
  text-align: center;
  margin-bottom: 0.5em;
}

h2, h3 {
  font-family: var(--font-smallcaps);
  font-variant: small-caps;
  text-transform: lowercase;
  letter-spacing: 0.05em;
  font-weight: 600;
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 0.3em;
}

/* Drop cap for first paragraph */
.chapter-start::first-letter {
  float: left;
  font-family: var(--font-heading);
  font-size: 4em;
  line-height: 0.8;
  padding-right: 0.1em;
  margin-top: 0.05em;
}

/* Blockquotes with decorative marks */
blockquote {
  position: relative;
  font-style: italic;
  margin: 2em 3em;
  padding: 0.5em 0;
}

blockquote::before {
  content: '"';
  position: absolute;
  left: -1.5em;
  top: -0.3em;
  font-size: 3em;
  color: var(--text-muted);
  font-family: Georgia, serif;
}

blockquote::after {
  content: '"';
  font-size: 3em;
  color: var(--text-muted);
  font-family: Georgia, serif;
  vertical-align: bottom;
  line-height: 0;
}

/* Sidenotes */
.sidenote {
  float: right;
  clear: right;
  width: var(--sidenote-width);
  margin-right: calc(-1 * var(--sidenote-width) - 2rem);
  font-size: var(--font-size-sidenote);
  line-height: 1.4;
  color: var(--text-secondary);
}

.sidenote-number {
  font-size: 0.7em;
  vertical-align: super;
  color: var(--text-muted);
}

/* Table of contents */
.toc {
  position: sticky;
  top: 2rem;
  float: left;
  width: 200px;
  margin-left: -220px;
  font-size: 14px;
  line-height: 1.8;
}

.toc a {
  color: var(--text-secondary);
  text-decoration: none;
}

.toc a:hover {
  color: var(--text-primary);
}

/* Links */
a {
  color: var(--link-color);
  text-decoration: underline;
  text-underline-offset: 2px;
}

a:hover {
  color: var(--link-hover);
}

/* Code */
code {
  font-family: var(--font-mono);
  font-size: 0.85em;
  background: var(--bg-secondary);
  padding: 0.15em 0.3em;
  border-radius: 3px;
}

pre {
  background: var(--bg-secondary);
  padding: 1em;
  overflow-x: auto;
  border-radius: 4px;
  font-size: 0.85em;
  line-height: 1.5;
}

/* Metadata line */
.metadata {
  text-align: center;
  font-size: 0.9em;
  color: var(--text-muted);
  margin-bottom: 2em;
}

.metadata .tag {
  display: inline-block;
  padding: 0.2em 0.5em;
  border: 1px solid var(--border-color);
  border-radius: 3px;
  margin: 0 0.2em;
}
```

**Characteristics**:
- Classical serif typography (Source Serif 4)
- Small caps for section headings
- Decorative drop caps to start chapters
- Large quotation marks for blockquotes
- Sidenote system for annotations
- Sticky table of contents on left
- Justified text, academic citation style
- Metadata tags (date, status, importance)
- Underlined links

---

### Theme: Dark

High-contrast developer-focused theme for code-heavy documentation.

```css
:root {
  /* Colors */
  --bg-primary: #0d1117;
  --bg-secondary: #161b22;
  --bg-tertiary: #21262d;
  --text-primary: #e6edf3;
  --text-secondary: #8b949e;
  --accent-blue: #58a6ff;
  --accent-green: #3fb950;
  --accent-orange: #d29922;
  --accent-red: #f85149;
  --accent-purple: #a371f7;
  --border-color: #30363d;

  /* Typography */
  --font-heading: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-body: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', 'SF Mono', monospace;

  /* Sizing */
  --content-width: 900px;
  --line-height: 1.6;
  --font-size-base: 16px;
}

body {
  background: var(--bg-primary);
  color: var(--text-primary);
  font-family: var(--font-body);
}

/* Code blocks with syntax highlighting */
pre {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  padding: 1rem;
  overflow-x: auto;
}

.token.keyword { color: var(--accent-red); }
.token.string { color: var(--accent-blue); }
.token.function { color: var(--accent-purple); }
.token.comment { color: var(--text-secondary); font-style: italic; }
.token.number { color: var(--accent-orange); }
.token.type { color: var(--accent-green); }

/* Tabs for navigation */
.tabs {
  display: flex;
  gap: 0;
  border-bottom: 1px solid var(--border-color);
  background: var(--bg-secondary);
  padding: 0 1rem;
}

.tab {
  padding: 0.75rem 1rem;
  color: var(--text-secondary);
  cursor: pointer;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
}

.tab.active {
  color: var(--text-primary);
  border-bottom-color: var(--accent-orange);
}

/* Cards */
.card {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  padding: 1.5rem;
}
```

---

### Using Themes

When creating web output:

1. **Ask user preference** in Plan Mode
2. **Load appropriate CSS** based on selection
3. **Adapt components** to theme (e.g., sidenotes only in Academic)
4. **Match diagram colors** to theme palette

```jsx
// Theme provider example
const themes = {
  light: lightThemeCSS,
  academic: academicThemeCSS,
  dark: darkThemeCSS
};

function App({ theme = 'light' }) {
  return (
    <>
      <style>{themes[theme]}</style>
      <main className={`theme-${theme}`}>
        {/* Content */}
      </main>
    </>
  );
}
```
