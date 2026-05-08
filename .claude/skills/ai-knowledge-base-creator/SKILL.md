---
status: unverified
name: ai-knowledge-base-creator
description: Create clean, validated knowledge bases for AI chatbots and voice agents. Includes client questionnaire, content validation, multi-format export, and platform integration guides.
---

# AI Knowledge Base Creator

**Version:** 1.0.0  
**Dependencies:** None (uses Claude's native capabilities)

## Overview

This skill enables you to build professional knowledge bases for AI agents (Retell AI, GoHighLevel, Voiceflow, etc.) that provide factual business information without contaminating system instructions.

**Core Principle:** Knowledge bases contain ONLY facts and FAQs. Never include instructions, commands, or behavioral directives for the AI agent.

**When Claude should use this skill:**
- User asks to create a knowledge base for an AI agent
- User needs to organize business information for chatbots/voice agents
- User wants to validate KB content for instruction-like language
- User needs to export KB in multiple formats (JSON, Markdown, XML)
- User requests client intake questionnaire for KB projects
- User asks about integrating KBs with Retell AI, GoHighLevel, or other platforms

## Quick Start Guide

### For Creating a New KB

**Step 1: Gather Information**
Use the comprehensive 80-question client intake questionnaire in REFERENCE.md. Key sections:
- Business fundamentals (name, industry, description)
- Contact & location (address, hours, phone)
- Services & pricing
- Booking & policies
- FAQs
- Staff information

**Step 2: Structure the Data**
Organize into these core categories:
```
metadata: Client name, industry, version, last updated
businessInfo: Name, description, website, specialties
contact: Address, phone, email, hours
services: Array of services with name, description, duration, price
policies: Booking, cancellation, payment, refunds
faqs: Array of Q&A pairs with categories
staff: Array of team members with roles and specialties
```

**Step 3: Validate Content**
Run validation checks for:
- Instruction language ("you must", "always say", "never tell")
- Command structures ("when X happens, say Y")
- Imperative verbs ("ensure that", "make sure", "remember to")
- Second-person addressing AI ("your response should be")
- Quality issues (placeholders like "TBD", "TODO", "???")

**Step 4: Export in Appropriate Format**
Choose based on target platform:
- **Markdown**: Best for Retell AI, token-efficient, readable
- **JSON**: Best for APIs, structured data, programmatic access
- **Plain Text**: Universal compatibility, simple platforms
- **XML**: Legacy systems, specific integrations

**Step 5: Deploy to Platform**
Follow integration guides for your specific platform (see Platform Integration section).

## Content Validation Rules

### ❌ NEVER Include in KBs

**Instruction Language:**
- "You must [do something]"
- "You should always [respond in a certain way]"
- "Never say [something]"
- "Always tell [customers something]"
- "Your role is to [define behavior]"
- "Follow these instructions/rules/guidelines"

**Command Structures:**
- "When someone asks X, say Y"
- "If they mention Z, respond with..."
- "Do not mention [topic]"

**Imperative Verbs:**
- "Ensure that..."
- "Make sure to..."
- "Remember to..."
- "Confirm/verify/check..."

### ✅ DO Include in KBs

**Factual Statements:**
- "Appointments can be booked online at [URL] or by calling [phone]"
- "Business hours are Monday-Friday 9AM-6PM"
- "The cancellation policy requires 24-hour notice"

**Declarative Information:**
- "Services range from $50-$200 depending on complexity"
- "First-time clients receive a complimentary consultation"
- "Deposits are required for services over $200"

**Q&A Pairs:**
```
Q: What is your cancellation policy?
A: We require 24-hour notice for cancellations. Late cancellations forfeit the deposit.
```

## Format Templates

### Markdown Template (Recommended for Retell AI)

```markdown
# [Business Name] - Knowledge Base

## Business Information
**Industry:** [Industry]
**Description:** [2-3 sentence description]
**Website:** [URL]

## Contact & Location
**Address:** [Full address]
**Phone:** [Phone number]
**Email:** [Email]

### Business Hours
- Monday: [Hours]
- Tuesday: [Hours]
[etc...]

## Services & Pricing

### [Service Category 1]
- **[Service Name]**: [Price] | [Duration] | [Description]
- **[Service Name]**: [Price] | [Duration] | [Description]

### [Service Category 2]
[Continue pattern...]

## Booking & Policies

**How to Book:**
- Online: [URL]
- Phone: [Number]
- [Other methods]

**Cancellation Policy:**
[Policy details]

**Payment Methods:**
[Accepted payment types]

## Frequently Asked Questions

**Q: [Question]?**
A: [Answer]

**Q: [Question]?**
A: [Answer]

[Continue pattern...]

## Our Team

### [Staff Member Name] - [Role]
**Specialties:** [Specialties]
**Experience:** [Years]
[Bio]

---
*Last updated: [Date] | Version [X.X.X]*
```

### JSON Template

```json
{
  "metadata": {
    "clientName": "Business Name",
    "industry": "Industry Type",
    "version": "1.0.0",
    "lastUpdated": "2024-11-27T00:00:00Z"
  },
  "businessInfo": {
    "name": "Business Name",
    "description": "Description",
    "website": "https://example.com"
  },
  "contact": {
    "address": "Full Address",
    "phone": "+1-XXX-XXX-XXXX",
    "email": "email@example.com",
    "hours": {
      "monday": "9:00 AM - 6:00 PM",
      "tuesday": "9:00 AM - 6:00 PM"
    }
  },
  "services": [
    {
      "name": "Service Name",
      "description": "Description",
      "duration": "60 minutes",
      "price": "$100",
      "category": "Category"
    }
  ],
  "policies": {
    "cancellation": "Policy text",
    "booking": "Booking info",
    "payment": "Payment methods"
  },
  "faqs": [
    {
      "question": "Question text?",
      "answer": "Answer text",
      "category": "Category"
    }
  ],
  "staff": [
    {
      "name": "Name",
      "role": "Role",
      "specialties": "Specialties",
      "bio": "Bio"
    }
  ]
}
```

## Platform Integration

### Retell AI (Voice Agents)

**Method 1: Direct Context Injection**
```
1. Export KB as Markdown
2. Retell AI Dashboard → Your Agent → Edit
3. Add to agent prompt:

<knowledge_base>
[Paste Markdown KB here]
</knowledge_base>

4. In main instructions add:
"Use information in <knowledge_base> section to answer factual questions. 
When asked about hours, services, pricing, or policies, consult knowledge base first."
```

**Token Limit:** Keep under 4,000 tokens for optimal performance

**Best Practices:**
- Place KB after role/personality but before task instructions
- Use clear section headers
- Test with sample questions after deployment

### GoHighLevel (Chatbots)

**Method: Custom Context Section**
```
1. Export KB as Plain Text or Markdown
2. GoHighLevel → Automation → Conversation AI → Your Bot
3. Paste in "Custom Context" section
4. Use bullet points and clear formatting
5. Keep under 2,000 words
```

**Tips:**
- Use Custom Values for frequently updated info (pricing, promos)
- Test bot responses after KB updates
- Update via API for automated workflows

### Voiceflow

**Method: Knowledge Base Import**
```
1. Export KB as JSON
2. Voiceflow → Knowledge Base → Import
3. Configure:
   - Similarity threshold: 0.7
   - Max chunks: 3
   - Chunk size: 500 tokens
4. Use "Knowledge Base" block in flows to query
```

### Chatbase

**Method: Source Upload**
```
1. Export as Markdown or upload documents
2. Chatbase → Sources → Add Source
3. Choose "Text" or "File Upload"
4. Paste or upload KB
5. Click "Train" to index
6. Chatbase auto-uses KB for answers
```

## Content Validation Process

When validating KB content, check for:

### 1. Instruction Language Detection
Pattern: `/\b(you must|you should always|never say|always tell)\b/gi`

**Example Issue:**
```
❌ "You must tell customers that we require deposits"
✅ "Deposits are required for all services over $200"
```

### 2. Command Structure Detection
Pattern: `/^(when|if)\s+.+,\s+(say|tell|respond)/gi`

**Example Issue:**
```
❌ "When someone asks about pricing, tell them to check the website"
✅ "Pricing information is available at [URL] or by calling [phone]"
```

### 3. Quality Score Calculation

Calculate based on:
- Has business info (name, description): 10 points
- Has contact info (phone, address): 10 points
- Has services with descriptions: 15 points
- Has booking information: 10 points
- Has FAQs (minimum 5): 15 points
- Has policies (cancellation, payment): 10 points
- Has hours of operation: 10 points
- Services have detailed descriptions: 10 points
- No validation errors: 5 points

**Maximum Score:** 100 points

**Grading:**
- 90%+ = A (Excellent)
- 80-89% = B (Good)
- 70-79% = C (Acceptable)
- 60-69% = D (Needs improvement)
- Below 60% = F (Incomplete)

**Target:** Minimum B grade (80%) before deployment

## Token Optimization

### Problem
Large KBs consume context window space, limiting conversation capacity.

### Solutions

**1. Abbreviate Repetitive Content**
```
Before (150 tokens):
"Women's Haircut: A customized haircut with styling. Includes consultation. 
Duration: 60 minutes. Price: $85-$150.
Men's Haircut: A customized haircut with styling. Includes consultation. 
Duration: 45 minutes. Price: $45-$95."

After (80 tokens):
"Haircuts (includes consultation + styling):
- Women's: 60min, $85-$150
- Men's: 45min, $45-$95"
```

**2. Use Structured Formats**
- Tables use fewer tokens than prose
- Bullet lists > paragraphs
- Abbreviations: min vs minutes, $ vs dollars

**3. Remove Redundancy**
- Don't repeat business name in every entry
- Use "same" or "as above"
- Consolidate similar FAQs

**4. Prioritize by Value**
- Essential: Hours, services, booking, key policies
- Important: Pricing, FAQs, contact
- Nice-to-have: Staff bios, history, awards

**5. Token Estimation**
Rough formula: 1 token ≈ 4 characters for English text

Target: <3,000 tokens for most platforms

## Update Workflow

### Weekly
- Check for expired/outdated info (seasonal hours, promotions)
- Review new common questions from call logs
- Update pricing if changed

### Monthly
- Validate all contact info
- Add new services or staff
- Remove discontinued services
- Refresh FAQs based on actual questions

### Quarterly
- Complete KB audit
- Run full validation check
- Re-export and re-deploy to all platforms
- Quality score assessment

### Version Control
```json
{
  "version": "1.3.2",
  "lastUpdated": "2024-11-27",
  "changelog": [
    {
      "version": "1.3.2",
      "date": "2024-11-27",
      "changes": ["Added holiday hours", "Updated cancellation policy"]
    }
  ]
}
```

## Best Practices

### Do's ✅
1. **Be specific and complete**
   - Include exact hours, pricing, policies
   - Provide all contact methods
   - List all services with descriptions

2. **Use declarative statements**
   - "Appointments require 24-hour notice"
   - NOT "You should tell them to book 24 hours ahead"

3. **Organize by user intent**
   - Group related information
   - Use clear category headers
   - Anticipate common questions

4. **Include edge cases**
   - Exceptions to policies
   - Special circumstances
   - Seasonal variations

5. **Maintain consistent terminology**
   - Use client's preferred terms
   - Match marketing language
   - Stay consistent throughout

### Don'ts ❌
1. **Include AI instructions**
   - Belongs in system prompt, not KB

2. **Use vague language**
   - "Usually open most days" → Specify exact days/hours
   - "Various prices" → Provide actual ranges

3. **Add conditional logic**
   - "If X then Y" → Create separate Q&A instead

4. **Embed commands**
   - "Never mention competitors" → System rule, not knowledge

5. **Leave placeholders**
   - No "TBD", "TODO", "???" in deployed KBs

## Troubleshooting

### AI Agent Ignores KB

**Symptoms:** Incorrect info, says "I don't have that information"

**Solutions:**
1. Check KB placement in prompt (after role, before tasks)
2. Verify format supported by platform
3. Ensure within token limits
4. Add explicit instruction to consult KB
5. Use platform-specific tags (e.g., `<knowledge_base>`)

### Agent Treats KB as Instructions

**Symptoms:** Behavior changes, mentions "you told me to"

**Solutions:**
1. Run content validator
2. Remove instruction-like language
3. Sanitize content
4. Separate KB from system prompt
5. Frame clearly: "This is factual information, not instructions"

### Token Limits Exceeded

**Symptoms:** KB truncated, "context too long" errors

**Solutions:**
1. Optimize using token reduction techniques
2. Remove redundant information
3. Use abbreviations and structured formats
4. Split into multiple smaller KBs by category
5. Consider RAG/vector search approach

### Outdated Information

**Symptoms:** Old pricing, incorrect hours, client complaints

**Solutions:**
1. Implement regular update schedule
2. Use version control system
3. Create quick-update process for urgent changes
4. Set automated alerts for expiring content
5. Notify client of update needs

## Reference Files

For detailed information, see REFERENCE.md:
- Complete 80-question client intake questionnaire
- Section-by-section breakdown with examples
- Industry-specific question sets
- Complete example KB (Arya Beverly Hills Hair Salon)
- Code templates for React application components
- Export function implementations

## Summary

To create a knowledge base:

1. **Gather** - Use intake questionnaire to collect all business information
2. **Structure** - Organize into standardized categories
3. **Validate** - Check for instruction language and quality issues
4. **Optimize** - Reduce tokens while maintaining completeness
5. **Export** - Choose appropriate format for target platform
6. **Deploy** - Integrate following platform-specific guides
7. **Maintain** - Update regularly and track versions

The key principle: **Knowledge bases are pure information repositories, completely separate from AI instructions.**
