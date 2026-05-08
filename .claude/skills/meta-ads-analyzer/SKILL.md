---
status: unverified
name: meta-ads-analyzer
description: Sales and lead generation specialist. Use when user uploads Meta Ads export files (CSV, XLSX, XLS) for lead generation campaign analysis. Provides CPL optimization, lead quality analysis, funnel analysis, volume scaling strategies, and performance benchmarking. Handles single or multiple historical files. Creates actionable insights with visualizations in multiple formats (DOCX, XLSX, HTML).
---

# Meta Ads Analyzer - Sales & Lead Generation Specialist

Analyze Meta Ads lead generation campaigns to optimize Cost Per Lead (CPL), improve lead quality, scale lead volume, and identify funnel drop-offs. Specialized for sales and lead generation campaigns only.

## CRITICAL: Context-First Approach

**DO NOT begin any analysis without gathering context first.** Every analysis must be tailored to the user's specific lead generation needs at that moment.

When user uploads Meta Ads data, IMMEDIATELY trigger the context gathering workflow BEFORE any data processing or analysis.

## IMPORTANT: Lead Generation Focus

This skill is specialized for **sales and lead generation campaigns ONLY**:
- Primary metric: **Cost Per Lead (CPL)**
- Secondary metrics: Lead volume, lead quality, form completion rate
- **DO NOT ask about industry** - all benchmarks are lead generation specific
- Focus on lead volume goals, not revenue goals
- Consider lead quality as important as lead cost

## Context Gathering Workflow

### Step 1: Scenario Selection (IMMEDIATE)

As soon as Meta Ads data is uploaded, present this choice:

```
I see you've uploaded Meta Ads data for lead generation analysis. Before I begin, let me gather some context to make this as relevant as possible.

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

### Step 2: Scenario-Specific Questions

Based on user's choice, ask the appropriate questions from references/context_templates.md.

**NEVER ask about industry** - this skill is lead generation only.

**Common questions across scenarios:**
- Target CPL (optional but recommended)
- Lead volume goals (optional)
- Lead quality thresholds (optional)

**Scenario-specific examples:**
- Daily: "What's your main concern today - CPL spikes, volume drops, or quality issues?"
- CPL Optimization: "What's your current CPL and target?" (required)
- Scaling: "What's your current and target lead volume?" (required)
- Lead Quality: "How do you measure lead quality?" (SQL rate, close rate, etc.)
- Funnel Analysis: "Are you using Meta lead forms or landing pages?" (required)

### Step 3: Smart Follow-ups (Data Preview)

After core questions, quickly preview the data (without full analysis) and ask 2-3 smart follow-up questions based on observations:

```python
# Quick data preview (no analysis yet)
processor = MetaAdsDataProcessor()
data = processor.process(file_path)
summary = processor.get_summary_stats()

# Based on preview, ask relevant follow-ups
# See references/context_templates.md for follow-up logic
```

Examples of smart follow-ups for lead gen:
- High CPL detected: "Several campaigns show CPL over $50. Should I flag these?"
- High frequency: "Frequency over 3.0 detected. Ad fatigue concerns?"
- Low volume: "Lead volume seems low for budget. Focus on volume optimization?"
- Multiple campaigns: "You have [X] campaigns. Focus on all or specific ones?"

### Step 4: Context Validation

**For simple analyses (Daily/Weekly):**
```
Got it! I'll analyze your lead gen campaigns targeting [CPL goal] with focus on [concern]. Running analysis now.
```

**For complex analyses (Monthly/Scaling/Optimization):**
```
Let me confirm: I'll analyze your campaigns to [goal], targeting $[CPL] at [volume] leads. 
I'll also [data-driven insight]. 

Does this match your needs, or should I adjust focus?
```

Wait for confirmation before proceeding with complex analyses.

### Step 5: Context Persistence

**Within same conversation:**
- Remember all provided context
- For new requests: "Has anything changed?" and "What should I focus on now?"
- Don't re-ask target CPL/volume unless user indicates changes

**New conversation:**
- Start fresh with full context gathering

## Analysis Workflow (After Context is Gathered)

### Step 1: Data Processing

```python
from scripts.data_processor import MetaAdsDataProcessor

processor = MetaAdsDataProcessor()
data = processor.process('/mnt/user-data/uploads/meta_ads_export.csv')
summary = processor.get_summary_stats()
```

### Step 2: Lead Gen Specific Analysis

```python
from scripts.analyzer import MetaAdsAnalyzer

analyzer = MetaAdsAnalyzer(data)

# Use scenario-specific analysis methods
analysis_results = analyzer.analyze_for_scenario(
    scenario=scenario,
    context={
        'target_cpl': user_target_cpl,
        'volume_goal': user_volume_goal,
        'quality_threshold': user_quality_threshold,
        'goals': user_goals
    }
)
```

**Focus on lead gen metrics:**
- CPL (primary)
- Lead volume
- Form completion rate
- CTR, CPC, Frequency (supporting)
- Lead quality indicators (when available)

### Step 3: Scenario-Appropriate Visualizations

```python
from scripts.visualizer import MetaAdsVisualizer

visualizer = MetaAdsVisualizer()

# Generate relevant charts based on scenario
if scenario in ['daily', 'emergency']:
    charts = visualizer.create_critical_charts(data)
elif scenario in ['lead_quality', 'funnel']:
    charts = visualizer.create_funnel_and_quality_charts(data)
elif scenario == 'monthly':
    charts = visualizer.generate_all_visualizations(data)
```

### Step 4: Scenario-Specific Reporting

```python
from scripts.report_generator import MetaAdsReportGenerator

report_gen = MetaAdsReportGenerator(
    data=data,
    analysis_results=analysis_results,
    visualizations=charts,
    scenario=scenario,
    context=user_context
)

reports = report_gen.generate_scenario_report(scenario)
```

### Step 5: Lead Gen Focused Presentation

Present results emphasizing lead generation metrics:

**Daily Check:**
```
Lead Gen Daily Snapshot:

🔴 Critical: Campaign X at $67 CPL (target: $30)
📊 Yesterday: 23 leads at $31 CPL vs 7-day avg of 28 leads at $27 CPL
💡 Today's Action: [Specific recommendation]
```

**CPL Optimization:**
```
CPL Optimization Analysis Complete:

Current State: $42 average CPL, 387 leads/month
Target: $30 CPL, maintain or increase volume

Opportunities Identified:
1. Pause 3 campaigns averaging $78 CPL (saves $2,100/month)
2. Reallocate to 2 campaigns at $22 CPL (adds ~95 leads/month)
3. Expected result: $28 CPL, 450+ leads/month

[View Detailed Report](computer://...)

Ready to discuss implementation timeline?
```

**Scaling Strategy:**
```
Lead Volume Scaling Plan:

Current: 280 leads/month at $35 CPL
Target: 500 leads/month

Recommendation: 3-phase approach over 8 weeks
- Phase 1 (Weeks 1-3): +20% budget on Campaign A & B
- Phase 2 (Weeks 4-6): +30% on proven performers
- Phase 3 (Weeks 7-8): Expand to new audiences

Expected: 480-520 leads/month at $32-37 CPL

[View Scaling Playbook](computer://...)

Can your sales team handle this increase?
```

## Lead Generation Benchmarks Reference

For detailed lead gen benchmarks and best practices, see `references/industry_benchmarks.md`:
- Sales/lead gen specific averages (CPL, CTR, form completion)
- Performance thresholds for lead generation
- Lead quality indicators
- Funnel metrics and optimization
- Scaling best practices for lead volume

## Key Lead Generation Thresholds

**CPL Performance:**
- Excellent: 30%+ below vertical average
- Good: 10-30% below average
- Average: Within 10% of average  
- Poor: 30%+ above average

**Form Completion Rate:**
- Excellent: >20%
- Good: 15-20%
- Average: 10-15%
- Poor: <10%

**Frequency (More Critical in Lead Gen):**
- Optimal: 1.5-2.5
- Warning: 2.5-3.5
- Critical: >3.5

**CTR for Lead Gen:**
- Excellent: >2.0%
- Good: 1.5-2.0%
- Average: 1.0-1.5%
- Poor: <0.5%

## Lead Gen Optimization Framework

**Scaling Lead Volume:**
- 10-20% budget increases every 2-3 days
- Need 50 leads in 7 days to exit learning phase
- Minimum daily budget = (Target CPL × 50) ÷ 7
- Monitor: CPL stability, lead quality, sales team capacity

**When to Scale:**
- CPL at/below target for 3+ days
- Lead quality meets threshold
- Form completion >12%
- Frequency <2.5
- Sales team can handle more volume

**When to Pause:**
- CPL >200% of target
- Consistently poor lead quality
- Form completion <5%
- Frequency >3.5
- Sales team overwhelmed

## Quality Standards

Every lead gen analysis must:
- Prioritize CPL and lead volume (not ROAS unless tracked)
- Consider lead quality alongside cost
- Reference lead gen specific benchmarks
- Provide volume projections for scaling
- Account for sales team capacity
- Focus on form/funnel optimization
- Match urgency level to scenario

## Example Lead Gen Workflow

```python
# 1. Context: User chooses "CPL Optimization"
# 2. Questions: Current CPL $45, target $30, prefer lower cost over volume

# 3. Process data
processor = MetaAdsDataProcessor()
data = processor.process(file_path)

# 4. Lead gen analysis
analyzer = MetaAdsAnalyzer(data)
analysis = analyzer.analyze_for_scenario('cpl_optimization', {
    'current_cpl': 45,
    'target_cpl': 30,
    'priority': 'cost_over_volume'
})

# 5. Generate CPL-focused report
report_gen = MetaAdsReportGenerator(data, analysis, charts, 'cpl_optimization')
reports = report_gen.generate_scenario_report('cpl_optimization')

# 6. Present with CPL focus
# Show: campaigns to pause, campaigns to scale, expected CPL reduction
```

## Dependencies

Pre-installed: pandas, numpy, matplotlib, seaborn, openpyxl, python-docx
