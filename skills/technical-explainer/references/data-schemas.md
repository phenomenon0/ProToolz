# Data Schema Reference

## metrics.json

```json
{
  "hero": {
    "primary": {
      "value": "129.6x",
      "label": "Speedup Achieved",
      "suffix": ""
    },
    "secondary": [
      { "value": "147,734", "label": "Baseline Cycles" },
      { "value": "1,137", "label": "Final Cycles", "highlight": true },
      { "value": "<1,363", "label": "Beats Previous Best" }
    ]
  },
  "summary": {
    "title": "The Challenge",
    "description": "Brief 2-3 sentence hook explaining what this is about",
    "callout": "Optional emphasized point"
  }
}
```

## journey.json (Milestone/Optimization Stages)

```json
{
  "milestones": [
    {
      "id": 1,
      "title": "Baseline",
      "metric": 147734,
      "metricLabel": "cycles",
      "technique": "Serial execution",
      "shortDescription": "One-liner for timeline view",
      "fullDescription": "Detailed explanation for expanded view",
      "codeSnippet": "optional code block",
      "insights": ["Key insight 1", "Key insight 2"],
      "links": [
        { "label": "Related paper", "url": "..." }
      ]
    },
    {
      "id": 2,
      "title": "SIMD Vectorization",
      "metric": 18467,
      "delta": "-8x",
      "deltaType": "improvement",
      "technique": "8-wide SIMD lanes",
      "shortDescription": "Process 8 items per instruction"
    }
  ],
  "metadata": {
    "xAxisLabel": "Optimization Stage",
    "yAxisLabel": "Cycles",
    "yAxisScale": "log"
  }
}
```

## utilization.json (Engine/Resource Usage)

```json
{
  "byMilestone": {
    "1": {
      "engines": [
        { "name": "ALU", "utilization": 8, "capacity": 12 },
        { "name": "Vector", "utilization": 0, "capacity": 6 },
        { "name": "Load", "utilization": 1, "capacity": 2 },
        { "name": "Store", "utilization": 1, "capacity": 2 }
      ]
    },
    "12": {
      "engines": [
        { "name": "ALU", "utilization": 92, "capacity": 12 },
        { "name": "Vector", "utilization": 85, "capacity": 6 }
      ]
    }
  }
}
```

## schedule.json (Execution Schedule/Timeline)

```json
{
  "cycles": 1137,
  "engines": ["alu0", "alu1", "vec0", "vec1", "load0", "load1", "store0"],
  "operations": [
    {
      "id": "op_001",
      "cycle": 0,
      "engine": "alu0",
      "instruction": "add r1, r2, r3",
      "dependencies": {
        "strict": ["op_000"],
        "weak": []
      },
      "values": { "r1": 42, "r2": 10, "r3": 32 }
    }
  ],
  "groups": [
    {
      "name": "Hash Stage 1",
      "cycleStart": 0,
      "cycleEnd": 50,
      "color": "#3b82f6"
    }
  ]
}
```

## faq.json (Progressive Disclosure Content)

```json
{
  "sections": [
    {
      "id": "what-is-kernel",
      "title": "What's a kernel in this context?",
      "content": "Markdown content here...",
      "defaultOpen": false
    },
    {
      "id": "how-different",
      "title": "How is this different from normal optimization?",
      "content": "...",
      "comparison": {
        "headers": ["Normal", "This Challenge"],
        "rows": [
          ["Hardware schedules", "You schedule manually"],
          ["Compiler optimizes", "You are the compiler"]
        ]
      }
    }
  ]
}
```

## live-ranges.json (Register/Variable Lifetimes)

```json
{
  "registers": [
    {
      "name": "r1",
      "ranges": [
        { "start": 0, "end": 45, "type": "active" },
        { "start": 100, "end": 120, "type": "active" }
      ],
      "conflicts": [
        { "with": "r5", "cycle": 42, "type": "WAW" }
      ]
    }
  ],
  "pressureByClycle": [
    { "cycle": 0, "pressure": 12 },
    { "cycle": 10, "pressure": 45 }
  ]
}
```

## methodology.json (Process/Approach)

```json
{
  "steps": [
    {
      "id": 1,
      "title": "Structured Worklog",
      "icon": "📝",
      "description": "Tracked what each approach tried..."
    },
    {
      "id": 2,
      "title": "Meta Planning",
      "icon": "🎯",
      "description": "High-level strategy before diving in"
    }
  ]
}
```
