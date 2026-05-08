---
name: transcript-analyzer
description: "This skill should be used when the user asks to analyze a meeting transcript, summarize a meeting, get meeting notes, or process a Fathom recording. Produces structured output with action items, verbatim client instructions, timestamps, and a Fathom link."
category: analysis
tags: "[transcripts, meetings, action-items, fathom, notes]"
---

# Transcript Analyzer

## Purpose

Analyze meeting transcripts and produce structured summaries containing:
1. **Action items** with owners, due dates, and timestamps
2. **Word-for-word client instructions** quoted exactly as spoken
3. **Timestamps** for every key moment in the transcript
4. **Fathom recording link** for easy reference

## When to Use This Skill

Trigger this skill when the user says:
- "Analyze this transcript"
- "Summarize this meeting"
- "Give me the meeting notes"
- "Fathom summary"

Then ask for:
- The transcript (pasted, file path, or content)
- The Fathom link to the recording

## Output Format

### Action Items Table

| # | Action Item | Owner | Due Date | Timestamp |
|---|------------|-------|----------|-----------|
| 1 | Description of task | Person responsible | Deadline | HH:MM:SS |

### Client Instructions (Verbatim)

Exact quotes from the client, never paraphrased:

> "I want the hero section to be gold, not yellow."

- **Timestamp:** 00:05:23
- **Context:** Homepage design feedback

### Key Timestamps

| Timestamp | Topic/Moment |
|-----------|-------------|
| 00:02:15 | Introductions and agenda |
| 00:05:23 | Homepage design feedback |

### Fathom Recording

Direct link to the recording for playback.

## Output Rules

- Client instructions are **always** word-for-word — never paraphrased
- Timestamps are included for every action item and client quote
- If the Fathom link is missing, ask for it before completing the summary
- Ambiguous client statements are flagged for clarification
- Action items are prioritized by urgency when due dates are present
