# doc-writer

Documents anything you just built — bots, workflows, integrations, infrastructure — using your project's own documentation guidelines.

## When to use it

Say any of these after finishing a build:
- "document this"
- "write it up"
- "log what I just built"
- "document the bot / workflow / integration"
- "write up what we just did"

## What it does

1. Finds your client's documentation guidelines file automatically
2. Identifies what type of doc is needed (Bot, Workflow, Integration, Process, Troubleshooting)
3. Pulls info from the current conversation and screenshots — asks only for what's missing
4. Writes a correctly named file to the right location
5. Updates `tasks/todo.md` to mark the item as documented

## Requirements

Each client project needs a documentation guidelines file at:
```
clients/{client-folder}/docs/{client}-documentation-guidelines.md
```

AAI already has this at `clients/ai-agency-institute/docs/aai-documentation-guidelines.md`.
For new clients, create their guidelines file before using this skill.

## Notes

- Runs in its own context window (`context: fork`) — won't slow down your main session
- Never invents missing information — flags it explicitly so you can fill it in
- Follows Australian English spelling throughout
- Always includes author (John Carlo Caintic) and date
