---
name: skill-creator
description: "This skill should be used when the user asks to create a new skill, build a skill, make a custom skill, develop a CLI skill, or wants to extend the CLI with new capabilities. Automates the entire skill creation process following Anthropic's official best practices."
category: meta
risk: safe
source: community
tags: "[automation, scaffolding, skill-creation, meta-skill]"
date_added: "2026-02-27"
---

# skill-creator

## Purpose

To create new CLI skills following Anthropic's official best practices with zero manual configuration. This skill automates brainstorming, template application, validation, and installation processes while maintaining progressive disclosure patterns and writing style standards.

## When to Use This Skill

This skill should be used when:
- User wants to extend CLI functionality with custom capabilities
- User needs to create a skill following official standards
- User wants to automate repetitive CLI tasks with a reusable skill
- User needs to package domain knowledge into a skill format
- User wants both local and global skill installation options

## Core Capabilities

1. **Interactive Brainstorming** - Collaborative session to define skill purpose and scope
2. **Template Application** - Automatic file generation from standardized templates
3. **Validation** - YAML, content, and style checks against Anthropic standards
4. **Installation** - Local repository or global installation

## Main Workflow

### Phase 1: Brainstorming & Planning

Ask the user:

1. **What should this skill do?** (Free-form description)
2. **When should it trigger?** (Provide 3-5 trigger phrases)
3. **What type of skill is this?**
   - General purpose
   - Code generation/modification
   - Documentation creation/maintenance
   - Analysis/investigation
4. **Provide a one-sentence description** (will appear in metadata)

### Phase 2: File Generation

Generate the skill folder structure:

```
~/.claude/skills/{skill-name}/
├── SKILL.md     ← Main skill file (1,500–2,000 words ideal)
└── README.md    ← User-facing docs (300–500 words)
```

**SKILL.md frontmatter format:**
```yaml
---
name: skill-name
description: "This skill should be used when... [third-person, imperative]"
category: general | code | documentation | analysis | meta
tags: "[tag1, tag2]"
---
```

**Writing standards:**
- Description: third-person format ("This skill should be used when...")
- Body: imperative/infinitive style ("Ask the user...", "Generate...", "Validate...")
- No second-person ("you should", "you must")
- SKILL.md: 1,500–2,000 words (max 5,000)
- README.md: 300–500 words

### Phase 3: Installation

Skills install to `~/.claude/skills/{skill-name}/SKILL.md`.

For this project, the skills path is `D:\CLAUDE\.claude\skills\` (Windows junction to `C:\Users\Admin\.claude\skills\`).

```bash
mkdir -p "D:/CLAUDE/.claude/skills/{skill-name}"
# Then write SKILL.md and README.md
```

### Phase 4: Validation

Verify before finishing:
- YAML frontmatter is valid
- Description is third-person
- Word count is within limits
- Required fields present (name, description)
- No placeholder text remains

## Quality Standards

**SKILL.md Requirements:**
- 1,500-2,000 words (ideal), under 5,000 (maximum)
- Third-person description format
- Imperative/infinitive writing style
- Progressive disclosure pattern (summary first, details after)

**README.md Requirements:**
- 300-500 words
- User-facing language
- Clear trigger phrases
- Practical usage examples
