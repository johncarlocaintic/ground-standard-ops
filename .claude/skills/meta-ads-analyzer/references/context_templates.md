# Context Management & Analysis Templates for Lead Generation

This reference defines the progressive context gathering approach and pre-built analysis scenarios for Meta Ads lead generation analysis.

## Core Principle

**Always gather context BEFORE any analysis begins.** Every analysis must be tailored to the user's specific lead generation needs at that moment.

**IMPORTANT**: This skill is specialized for **sales and lead generation campaigns ONLY**. Do NOT ask about industry - all benchmarks are based on lead generation verticals.

## Progressive Context Gathering Flow

### Phase 1: Scenario Selection (Immediate)

When user uploads Meta Ads data, IMMEDIATELY present scenario options:

```
I see you've uploaded Meta Ads data. Before I analyze it, let me gather some context to make this as relevant as possible.

Would you like to use a pre-built analysis scenario, or should we customize the analysis?

📊 Quick Scenarios:
1. Daily Performance Check
2. Weekly Performance Review  
3. Monthly Performance Review
4. Emergency Audit (critical issues only)
5. Campaign Troubleshooting
6. Lead Quality Analysis
7. Cost Per Lead Optimization
8. Funnel Drop-off Analysis
9. Scaling Strategy (lead volume)

Or reply "custom" for tailored questions.
```

### Phase 2: Core Questions

Based on scenario selection, ask relevant questions.

**NEVER ask about industry** - this skill is lead generation only.

#### Universal Questions (Asked for Most Scenarios)
- **Target CPL** (optional but recommended): "What's your target Cost Per Lead?"
- **Lead Volume Goals** (optional): "What's your monthly lead volume goal?"
- **Lead Quality Threshold** (optional): "Do you have minimum lead quality requirements?"

#### Scenario-Specific Questions

**For Daily Performance Check:**
1. "Any specific campaigns you want me to watch today?" (optional)
2. "What's your main concern today - CPL spikes, lead volume drops, or lead quality issues?" (optional)
3. "What's your target CPL?" (optional but helpful)

**For Weekly Performance Review:**
1. "What's your target CPL?" (optional but recommended)
2. "Are you comparing to last week or a specific baseline?" (optional)
3. "Any changes you made this week I should know about?" (optional - helps explain trends)
4. "What's your weekly lead volume goal?" (optional)

**For Monthly Performance Review:**
1. "What were your lead generation goals for this month?" (optional)
2. "What's your target CPL?" (recommended)
3. "What's your monthly lead volume target?" (optional)
4. "Comparing to which previous month?" (optional - defaults to prior month)
5. "Any specific campaigns you want highlighted?" (optional)

**For Emergency Audit:**
1. "What triggered this audit? (CPL spike, lead quality drop, volume crash, other)" (optional but very helpful)
2. "How urgent? (need immediate actions vs. comprehensive review)" (optional - defaults to critical issues only)
3. "What's your normal/target CPL for context?" (optional but helpful)

**For Campaign Troubleshooting:**
1. "Which specific campaign(s) are you concerned about?" (required for this scenario)
2. "What symptoms are you seeing? (high CPL, low volume, poor lead quality, etc.)" (optional but very helpful)
3. "When did the issue start?" (optional - helps identify triggers)
4. "What's your target CPL for this campaign?" (optional)

**For Lead Quality Analysis:**
1. "How do you currently measure lead quality?" (optional - SQL rate, close rate, lead score, etc.)
2. "What's your acceptable cost per qualified lead?" (optional)
3. "Are you seeing issues with specific campaigns or overall?" (optional)
4. "Do you track form completion rate or post-lead metrics?" (optional)

**For Cost Per Lead Optimization:**
1. "What's your current average CPL and what's your target?" (required for this scenario)
2. "What's more important - lower CPL or maintain lead volume?" (optional - helps prioritize)
3. "Have you identified any high CPL campaigns already?" (optional)
4. "What's your monthly lead budget?" (optional - helps with recommendations)

**For Funnel Drop-off Analysis:**
1. "Are you using Meta lead forms or landing pages?" (required - affects analysis approach)
2. "What's your current form completion rate if known?" (optional)
3. "Where do you suspect the drop-off? (impressions to clicks, clicks to forms, forms to submissions)" (optional)
4. "Do you have data on landing page performance?" (optional)

**For Scaling Strategy (Lead Volume):**
1. "What's your current monthly lead volume and what's your target?" (required for this scenario)
2. "What's your current total monthly budget and how much can you increase it?" (optional but very helpful)
3. "How quickly do you need to scale? (gradual over months vs. aggressive in weeks)" (optional - defaults to conservative)
4. "Any campaigns you definitely want to scale or avoid?" (optional)
5. "Can your sales team handle increased lead volume?" (optional but important)

**For Custom Analysis:**
Ask all 5 core questions progressively:
1. "What's your primary goal for this analysis?"
2. "What's your target CPL?" (optional but recommended)
3. "What's your lead volume goal?" (optional)
4. "Any known issues or areas of concern?" (optional)
5. "What time period does this data cover?" (helps frame the analysis)

### Phase 3: Smart Follow-ups (Based on Data Preview)

After core questions, quickly preview the data and ask 2-3 smart follow-ups based on what you see:

**If you see high CPL (>$50):**
- "I notice several campaigns with CPL over $50. Is this expected for your vertical, or should I flag these?"

**If you see high frequency (>3.0):**
- "I see campaigns with frequency over 3.0. Are you experiencing ad fatigue issues?"

**If you see low form completion (if data available):**
- "Form completion rates look low (<10%). Should I focus on funnel optimization?"

**If you see large CPL disparities:**
- "I see CPL ranges from $15 to $85 across campaigns. Should I identify which to pause vs. scale?"

**If you see low lead volume:**
- "Lead volume seems low for the budget spent. Should I focus on volume optimization?"

**If you see multiple campaigns:**
- "You have [X] campaigns. Should I focus on all of them or prioritize specific ones?"

**If comparing time periods:**
- "I see data from [dates]. Should I compare these periods or analyze them separately?"

**If you see instant form data:**
- "I see you're using Meta instant forms. Should I compare performance vs. landing page campaigns?"

### Phase 4: Context Validation & Confirmation

Before running analysis, summarize and confirm:

**For Simple Analyses (Daily/Weekly):**
```
Got it! I'll analyze your lead generation campaigns with a focus on [primary concern], targeting [CPL goal if provided]. Running analysis now.
```

**For Complex Analyses (Monthly/Scaling/Optimization):**
```
Let me confirm: I'll analyze your lead gen campaigns to [goal], targeting [CPL] at [volume goal]. 
I'll also [data-driven insight from preview]. 

Does this match your needs, or should I adjust my focus?
```

Wait for user confirmation before proceeding with complex analyses.

## Analysis Templates by Scenario

### 1. Daily Performance Check

**Focus Areas:**
- Yesterday's CPL vs. 7-day average
- Lead volume vs. daily target
- Budget pacing (on track, overspending, underspending)
- Critical alerts only (frequency >3.5, CPL spikes >100%, zero leads)

**Outputs:**
- Quick summary (2-3 key points)
- Critical alerts only
- 1-2 immediate action items
- Single-page summary report (no extensive visualizations)

**Key Metrics:**
- CPL (primary)
- Lead volume
- Frequency
- Budget spent

**Analysis Depth:** Light (focus on anomalies and deviations)

### 2. Weekly Performance Review

**Focus Areas:**
- Week-over-week CPL trends
- Lead volume trends
- Top 3 and bottom 3 campaigns by CPL
- Medium-priority alerts (frequency 2.5-3.5, CPL 20-50% above target)
- Form completion rates (if available)

**Outputs:**
- Executive summary
- Trend analysis with 7-day rolling averages
- Campaign rankings (by CPL and volume)
- 3-5 recommendations
- Standard report with key visualizations

**Key Metrics:**
- CPL (primary)
- Lead volume
- CTR
- Frequency
- Form completion rate

**Analysis Depth:** Medium (balance between detail and speed)

### 3. Monthly Performance Review

**Focus Areas:**
- Month-over-month comparison
- Goal achievement (CPL targets, volume goals)
- Complete benchmark comparison vs. lead gen averages
- Budget efficiency and allocation
- All alerts (low, medium, high priority)
- Strategic recommendations for next month

**Outputs:**
- Comprehensive executive summary
- Full trend analysis (daily + weekly patterns)
- Complete benchmark comparisons with interpretations
- Detailed campaign rankings (top 10, bottom 10)
- Budget reallocation suggestions
- 8-12 strategic recommendations
- Full report suite (DOCX, XLSX, HTML) with all visualizations

**Key Metrics:**
- CPL (primary)
- Lead volume
- CTR, CPC, Frequency
- Form completion rate
- Cost per qualified lead (if data available)

**Analysis Depth:** Comprehensive (deep dive into everything)

### 4. Emergency Audit

**Focus Areas:**
- ONLY critical issues (no nice-to-haves)
- CPL spikes (>100% of target)
- Zero lead campaigns (spend with no results)
- Severe ad fatigue (frequency >4.0)
- Budget waste (high spend + poor CPL)
- Immediate risk mitigation

**Outputs:**
- Triage-style summary (critical, urgent, monitor)
- List of campaigns to pause immediately
- List of campaigns to fix within 24-48 hours
- Emergency action plan with priority order
- Minimal visualizations (only what's needed for decisions)

**Key Metrics:**
- CPL (primary)
- Lead volume (or lack thereof)
- Frequency
- Spend efficiency

**Analysis Depth:** Narrow but deep (critical issues only, but thoroughly analyzed)

**Special Instructions:**
- Skip benchmark comparisons unless directly relevant to the emergency
- Skip historical trends unless they explain the emergency
- Focus 100% on immediate actions and their expected impact

### 5. Campaign Troubleshooting

**Focus Areas:**
- Specified campaign(s) only
- Detailed CPL breakdown over time
- Form completion funnel (if data available)
- Comparison to account average and top performers
- Historical performance (when did CPL spike or leads drop?)
- Potential root causes (creative fatigue, audience saturation, competition)
- Specific fix recommendations

**Outputs:**
- Campaign health report card
- Root cause analysis (most likely issues ranked)
- Step-by-step troubleshooting checklist
- A/B test suggestions
- Timeline of performance degradation (if historical data available)
- Focused report on specified campaigns only

**Key Metrics:**
- CPL (primary)
- Lead volume trends
- CTR, Frequency
- Form completion rate
- Audience overlap (if multiple ad sets)

**Analysis Depth:** Deep but narrow (comprehensive analysis of specific campaigns)

**Special Instructions:**
- Compare troubled campaign to similar successful campaigns
- Identify the exact metric(s) causing the problem
- Provide multiple hypotheses for why CPL increased or leads dropped
- Give specific, tactical fixes (not generic advice)

### 6. Lead Quality Analysis (NEW)

**Focus Areas:**
- Lead quality indicators (form completion time, information completeness)
- Cost per qualified lead vs. cost per raw lead
- Campaign-level quality patterns
- Form field analysis (which fields correlate with quality)
- Timing analysis (day/hour patterns in lead quality)
- Quality vs. volume tradeoffs

**Outputs:**
- Lead quality scorecard by campaign
- High-quality vs. low-quality lead breakdown
- Cost per qualified lead calculations
- Quality improvement recommendations
- Campaign ranking by lead quality (not just CPL)
- Quality-focused report

**Key Metrics:**
- CPL (by quality tier)
- Lead volume (by quality tier)
- Form completion rate
- Information completeness
- Qualification rate (if post-lead data available)

**Analysis Depth:** Medium-deep (focused on quality dimensions)

**Special Instructions:**
- Don't just focus on CPL - consider quality-adjusted CPL
- Identify patterns: Are cheaper leads lower quality?
- Recommend targeting/creative changes to improve quality
- Suggest form optimizations if completion rate is low

### 7. Cost Per Lead Optimization (NEW)

**Focus Areas:**
- CPL by campaign, ad set, ad level
- Identify high CPL outliers
- Budget reallocation opportunities
- Audience efficiency analysis
- Creative performance vs. CPL
- Bid strategy effectiveness
- Quick wins to reduce CPL immediately

**Outputs:**
- CPL analysis matrix (all levels)
- Campaigns to pause (high CPL, low volume)
- Campaigns to scale (low CPL, high quality)
- Budget reallocation plan with expected CPL impact
- Optimization checklist (audience, creative, bidding)
- CPL optimization report with before/after projections

**Key Metrics:**
- CPL (primary, at all levels)
- Lead volume
- Audience size and saturation
- Creative fatigue indicators
- Bid efficiency

**Analysis Depth:** Deep and broad (comprehensive CPL analysis)

**Special Instructions:**
- Calculate potential CPL reduction from each recommendation
- Prioritize recommendations by impact vs. effort
- Consider volume impact of CPL optimization (may trade volume for cost)
- Provide specific budget reallocation amounts

### 8. Funnel Drop-off Analysis (NEW)

**Focus Areas:**
- Full funnel breakdown: Impressions → Clicks → Landing Page Views → Form Starts → Form Submissions
- Conversion rates at each stage
- Identify biggest drop-off point
- Landing page performance (if applicable)
- Form field analysis (where do people abandon?)
- Device/placement funnel differences
- Comparison to funnel benchmarks

**Outputs:**
- Visual funnel with conversion rates
- Drop-off analysis by stage
- Benchmark comparison for each funnel stage
- Stage-specific optimization recommendations
- A/B test suggestions for problem stages
- Funnel optimization report

**Key Metrics:**
- CTR (impression to click)
- Landing page view rate (click to page)
- Form start rate (page to form)
- Form completion rate (form start to submit)
- Overall conversion rate (impression to lead)

**Analysis Depth:** Deep and narrow (comprehensive funnel focus)

**Special Instructions:**
- Identify THE bottleneck (biggest drop-off)
- Prioritize fixes by potential impact on overall funnel
- Recommend specific tests for each weak stage
- Consider mobile vs. desktop funnel differences
- For instant forms: Focus on form field optimization
- For landing pages: Include page speed and UX analysis

### 9. Scaling Strategy (Lead Volume)

**Focus Areas:**
- Current lead volume vs. target
- Scalable campaign identification (low CPL + high quality + headroom)
- Budget increase recommendations with timeline
- Risk assessment (audience saturation, ad fatigue)
- Sales team capacity considerations
- Learning phase implications
- Expected volume increase projections

**Outputs:**
- Scaling readiness scorecard for each campaign
- Specific budget increase timeline (week-by-week)
- Expected lead volume projections
- Risk mitigation strategies
- Monitoring metrics to watch post-scale
- Scaling playbook report

**Key Metrics:**
- Current CPL and projected CPL post-scale
- Current and projected lead volume
- Frequency and audience saturation indicators
- Budget headroom
- Lead quality stability

**Analysis Depth:** Strategic (forward-looking, scenario-based)

**Special Instructions:**
- Apply 10-20% rule for safe scaling
- Calculate minimum budgets for learning phase (50 leads in 7 days)
- Consider audience size relative to daily budget
- Flag campaigns NOT ready to scale (and explain why)
- Provide volume projections based on historical performance
- Account for quality degradation if scaling too fast
- Address sales team capacity if mentioned in context

## Context Persistence Rules

### Within Same Conversation
- **Remember all context** provided earlier in the conversation
- When user requests new analysis: Ask "Has anything changed since last time?" and "What specific aspect should I focus on now?"
- Don't re-ask target CPL or volume goals unless user indicates things changed

### New Conversation
- **Start fresh** - assume no prior context
- Always go through full context gathering

### Follow-up Questions in Same Session
If user asks follow-up questions like:
- "Tell me more about Campaign X" → Use existing context, focus on that campaign
- "What if I increase budget by 20%?" → Use existing context, model the scenario
- "Compare to Q3 instead" → Keep context but adjust time comparison
- "Now focus on lead quality" → Keep context but shift analysis lens to quality

## Question Style Guidelines

**Always use conversational, natural language:**
- ✅ "What's your target CPL?"
- ❌ "Please specify your target cost-per-acquisition for lead generation objectives"

**Keep questions concise:**
- ✅ "Any specific campaigns you want me to focus on?"
- ❌ "Are there particular campaign entities within your account structure that you would like me to prioritize?"

**Provide examples when helpful:**
- ✅ "What's your primary goal? (lower CPL, increase volume, improve quality, etc.)"
- ❌ "What's your primary goal?"

**Make optional questions clearly optional:**
- ✅ "What's your target CPL? (optional but helpful for context)"
- ❌ "What is your target CPL?"

**Group related questions:**
- When asking multiple questions, number them clearly
- Don't overwhelm with more than 5 questions at once

## Error Handling

**If user doesn't provide required context for specific scenarios:**
- Campaign Troubleshooting requires campaign name: "Which campaign should I focus on?"
- CPL Optimization requires target: "What's your target or current CPL for context?"
- Scaling requires volume goal: "What's your target lead volume?"

**If user is unsure:**
- Provide defaults: "No worries! I'll use lead gen industry averages ($27.66 CPL) for context."

**If context is ambiguous:**
- Ask for clarification: "When you say 'reduce costs', do you mean CPL, CPC, or overall monthly spend?"

**If user changes context mid-conversation:**
- Acknowledge and adapt: "Got it, shifting focus to lead quality instead of just CPL. Let me re-analyze with that lens."

## Lead Generation Specific Guidance

**Always remember:**
- This is lead generation, not ecommerce - CPL matters more than ROAS
- Lead quality is as important as lead cost
- Volume goals are critical for sales team planning
- Form completion rate is a key funnel metric
- Frequency matters more in lead gen (fatigue happens faster)
- Audience size relative to budget is crucial (saturation risk)
