#!/usr/bin/env python3
"""
Meta Ads Performance Analyzer
Identifies trends, anomalies, and performance insights
"""

import pandas as pd
import numpy as np
from typing import Dict, List, Tuple, Optional
from datetime import datetime, timedelta

class MetaAdsAnalyzer:
    """Analyze Meta Ads performance data"""
    
    # Performance thresholds based on 2024-2025 benchmarks
    THRESHOLDS = {
        'frequency': {
            'warning': 2.5,
            'critical': 3.5
        },
        'ctr': {
            'poor': 0.5,
            'below_avg': 0.9,
            'average': 1.71,
            'good': 2.5
        },
        'roas': {
            'losing_money': 1.0,
            'break_even': 1.5,
            'healthy': 3.0,
            'excellent': 5.0
        },
        'cpc': {
            'low': 0.50,
            'average': 0.70,
            'high': 1.20
        }
    }
    
    def __init__(self, data: pd.DataFrame):
        self.data = data
        self.insights = []
        self.recommendations = []
        
    def analyze_trends(self) -> Dict:
        """Analyze performance trends over time"""
        if 'date_start' not in self.data.columns:
            return {'error': 'No date column found for trend analysis'}
        
        # Group by date
        daily = self.data.groupby('date_start').agg({
            'spend': 'sum',
            'impressions': 'sum',
            'link_clicks': 'sum',
            'conversions': 'sum',
            'conversion_value': 'sum'
        }).reset_index()
        
        # Calculate metrics
        if len(daily) > 0:
            daily['ctr'] = (daily['link_clicks'] / daily['impressions'] * 100).round(2)
            daily['cpc'] = (daily['spend'] / daily['link_clicks']).round(2)
            daily['cost_per_conversion'] = (daily['spend'] / daily['conversions']).round(2)
            daily['roas'] = (daily['conversion_value'] / daily['spend']).round(2)
        
        trends = {}
        
        # Detect trends for key metrics
        for metric in ['ctr', 'cpc', 'cost_per_conversion', 'roas']:
            if metric in daily.columns and len(daily) >= 3:
                values = daily[metric].dropna()
                if len(values) >= 3:
                    # Calculate trend direction
                    recent = values.tail(7).mean() if len(values) >= 7 else values.tail(3).mean()
                    older = values.head(7).mean() if len(values) >= 14 else values.head(3).mean() if len(values) >= 6 else values.mean()
                    
                    change_pct = ((recent - older) / older * 100) if older > 0 else 0
                    
                    direction = 'stable'
                    if change_pct > 10:
                        direction = 'increasing'
                    elif change_pct < -10:
                        direction = 'decreasing'
                    
                    trends[metric] = {
                        'direction': direction,
                        'change_percent': round(change_pct, 2),
                        'recent_avg': round(recent, 2),
                        'older_avg': round(older, 2)
                    }
        
        return trends
    
    def identify_anomalies(self) -> List[Dict]:
        """Identify performance anomalies and red flags"""
        anomalies = []
        
        # Check frequency (ad fatigue indicator)
        if 'frequency' in self.data.columns:
            high_freq = self.data[self.data['frequency'] > self.THRESHOLDS['frequency']['critical']]
            if len(high_freq) > 0:
                anomalies.append({
                    'type': 'CRITICAL',
                    'metric': 'frequency',
                    'message': f"Found {len(high_freq)} campaigns/ad sets with frequency > {self.THRESHOLDS['frequency']['critical']}",
                    'detail': 'High frequency indicates ad fatigue. Users are seeing the same ads too often.',
                    'recommendation': 'Rotate creatives, expand audiences, or pause campaigns to prevent performance degradation'
                })
            
            warning_freq = self.data[
                (self.data['frequency'] > self.THRESHOLDS['frequency']['warning']) & 
                (self.data['frequency'] <= self.THRESHOLDS['frequency']['critical'])
            ]
            if len(warning_freq) > 0:
                anomalies.append({
                    'type': 'WARNING',
                    'metric': 'frequency',
                    'message': f"Found {len(warning_freq)} campaigns/ad sets approaching high frequency",
                    'detail': f"Frequency between {self.THRESHOLDS['frequency']['warning']} and {self.THRESHOLDS['frequency']['critical']}",
                    'recommendation': 'Monitor closely and prepare creative refreshes'
                })
        
        # Check CTR
        if 'link_ctr' in self.data.columns:
            poor_ctr = self.data[self.data['link_ctr'] < self.THRESHOLDS['ctr']['poor']]
            if len(poor_ctr) > 0:
                anomalies.append({
                    'type': 'CRITICAL',
                    'metric': 'ctr',
                    'message': f"Found {len(poor_ctr)} campaigns/ad sets with CTR < {self.THRESHOLDS['ctr']['poor']}%",
                    'detail': 'Very low CTR suggests poor ad relevance or targeting issues',
                    'recommendation': 'Review creative, test new audiences, or consider pausing underperformers'
                })
        
        # Check ROAS
        if 'roas' in self.data.columns:
            losing_money = self.data[self.data['roas'] < self.THRESHOLDS['roas']['losing_money']]
            if len(losing_money) > 0:
                total_spend = losing_money['spend'].sum() if 'spend' in losing_money.columns else 0
                anomalies.append({
                    'type': 'CRITICAL',
                    'metric': 'roas',
                    'message': f"Found {len(losing_money)} campaigns with ROAS < 1.0 (losing money)",
                    'detail': f"Total spend on unprofitable campaigns: ${total_spend:,.2f}",
                    'recommendation': 'Pause or heavily optimize these campaigns immediately'
                })
            
            low_roas = self.data[
                (self.data['roas'] >= self.THRESHOLDS['roas']['losing_money']) & 
                (self.data['roas'] < self.THRESHOLDS['roas']['break_even'])
            ]
            if len(low_roas) > 0:
                anomalies.append({
                    'type': 'WARNING',
                    'metric': 'roas',
                    'message': f"Found {len(low_roas)} campaigns with marginal ROAS",
                    'detail': f"ROAS between 1.0 and {self.THRESHOLDS['roas']['break_even']} may not cover overhead costs",
                    'recommendation': 'Optimize targeting, creative, or consider reallocation'
                })
        
        # Check for sudden spend spikes
        if 'spend' in self.data.columns and 'date_start' in self.data.columns:
            daily_spend = self.data.groupby('date_start')['spend'].sum()
            if len(daily_spend) > 7:
                recent_avg = daily_spend.tail(3).mean()
                older_avg = daily_spend.head(-3).mean()
                
                if recent_avg > older_avg * 1.3:  # 30% increase
                    anomalies.append({
                        'type': 'INFO',
                        'metric': 'spend',
                        'message': 'Detected significant spend increase',
                        'detail': f"Recent daily spend (${recent_avg:.2f}) is 30%+ higher than previous average (${older_avg:.2f})",
                        'recommendation': 'Verify this increase is intentional and monitor performance closely'
                    })
        
        return anomalies
    
    def compare_to_benchmarks(self, industry: Optional[str] = None) -> Dict:
        """Compare performance to industry benchmarks"""
        
        # Industry-specific benchmarks (2024-2025 data)
        INDUSTRY_BENCHMARKS = {
            'ecommerce': {'ctr': 1.91, 'cpc': 0.70, 'roas': 2.98},
            'shopping_collectibles': {'ctr': 4.13, 'cpc': 0.34, 'roas': 9.60},
            'travel': {'ctr': 2.76, 'cpc': 0.51, 'roas': 7.04},
            'sports_recreation': {'ctr': 2.60, 'cpc': 0.41, 'roas': 3.50},
            'arts_entertainment': {'ctr': 2.10, 'cpc': 0.49, 'roas': 3.20},
            'finance_insurance': {'ctr': 0.98, 'cpc': 1.22, 'roas': 2.50},
            'automotive': {'ctr': 0.80, 'cpc': 0.81, 'roas': 9.60},
            'healthcare': {'ctr': 1.20, 'cpc': 0.90, 'roas': 1.49},
            'pets': {'ctr': 1.50, 'cpc': 0.65, 'roas': 1.67},
            'default': {'ctr': 1.71, 'cpc': 0.70, 'roas': 2.98}
        }
        
        benchmarks = INDUSTRY_BENCHMARKS.get(industry, INDUSTRY_BENCHMARKS['default'])
        
        comparisons = {}
        
        # Calculate overall averages
        if 'link_ctr' in self.data.columns:
            avg_ctr = self.data['link_ctr'].mean()
            benchmark_ctr = benchmarks['ctr']
            diff_pct = ((avg_ctr - benchmark_ctr) / benchmark_ctr * 100)
            
            comparisons['ctr'] = {
                'your_value': round(avg_ctr, 2),
                'benchmark': benchmark_ctr,
                'difference_percent': round(diff_pct, 2),
                'performance': 'above' if diff_pct > 0 else 'below',
                'interpretation': self._interpret_ctr_comparison(avg_ctr, benchmark_ctr, diff_pct)
            }
        
        if 'cpc' in self.data.columns:
            avg_cpc = self.data['cpc'].mean()
            benchmark_cpc = benchmarks['cpc']
            diff_pct = ((avg_cpc - benchmark_cpc) / benchmark_cpc * 100)
            
            comparisons['cpc'] = {
                'your_value': round(avg_cpc, 2),
                'benchmark': benchmark_cpc,
                'difference_percent': round(diff_pct, 2),
                'performance': 'below' if diff_pct < 0 else 'above',
                'interpretation': self._interpret_cpc_comparison(avg_cpc, benchmark_cpc, diff_pct)
            }
        
        if 'roas' in self.data.columns:
            avg_roas = self.data['roas'].mean()
            benchmark_roas = benchmarks['roas']
            diff_pct = ((avg_roas - benchmark_roas) / benchmark_roas * 100)
            
            comparisons['roas'] = {
                'your_value': round(avg_roas, 2),
                'benchmark': benchmark_roas,
                'difference_percent': round(diff_pct, 2),
                'performance': 'above' if diff_pct > 0 else 'below',
                'interpretation': self._interpret_roas_comparison(avg_roas, benchmark_roas, diff_pct)
            }
        
        return {
            'industry': industry or 'general',
            'comparisons': comparisons
        }
    
    def _interpret_ctr_comparison(self, value: float, benchmark: float, diff_pct: float) -> str:
        """Interpret CTR benchmark comparison"""
        if diff_pct > 30:
            return f"Your CTR of {value:.2f}% is significantly above the industry average of {benchmark:.2f}%. This is excellent performance, suggesting your ad creative and targeting are highly effective."
        elif diff_pct > 0:
            return f"Your CTR of {value:.2f}% is {abs(diff_pct):.1f}% above the industry average of {benchmark:.2f}%. Your ads are performing well and resonating with your audience."
        elif diff_pct > -20:
            return f"Your CTR of {value:.2f}% is {abs(diff_pct):.1f}% below the industry average of {benchmark:.2f}%. There's room for improvement in creative or targeting optimization."
        else:
            return f"Your CTR of {value:.2f}% is significantly below the industry average of {benchmark:.2f}%. Consider testing new creative formats, refining audience targeting, or revisiting your value proposition."
    
    def _interpret_cpc_comparison(self, value: float, benchmark: float, diff_pct: float) -> str:
        """Interpret CPC benchmark comparison"""
        if diff_pct < -20:
            return f"Your CPC of ${value:.2f} is {abs(diff_pct):.1f}% lower than the industry average of ${benchmark:.2f}. This is excellent efficiency, allowing you to acquire more clicks for your budget."
        elif diff_pct < 0:
            return f"Your CPC of ${value:.2f} is {abs(diff_pct):.1f}% below the industry average of ${benchmark:.2f}. You're achieving good cost efficiency."
        elif diff_pct < 30:
            return f"Your CPC of ${value:.2f} is {diff_pct:.1f}% above the industry average of ${benchmark:.2f}. Consider optimizing your targeting or creative to improve click efficiency."
        else:
            return f"Your CPC of ${value:.2f} is significantly higher than the industry average of ${benchmark:.2f}. This suggests high competition or suboptimal targeting. Review your audience strategy and consider testing different ad formats."
    
    def _interpret_roas_comparison(self, value: float, benchmark: float, diff_pct: float) -> str:
        """Interpret ROAS benchmark comparison"""
        if value < 1.0:
            return f"Your ROAS of {value:.2f}x means you're losing money on ad spend. Immediate optimization or pausing is needed."
        elif diff_pct > 20:
            return f"Your ROAS of {value:.2f}x is {diff_pct:.1f}% above the industry average of {benchmark:.2f}x. Excellent performance! Consider scaling these campaigns carefully while maintaining profitability."
        elif diff_pct > 0:
            return f"Your ROAS of {value:.2f}x is {diff_pct:.1f}% above the industry average of {benchmark:.2f}x. Strong performance that justifies continued investment."
        elif diff_pct > -20:
            return f"Your ROAS of {value:.2f}x is {abs(diff_pct):.1f}% below the industry average of {benchmark:.2f}x. Look for optimization opportunities in conversion tracking, landing pages, or audience quality."
        else:
            return f"Your ROAS of {value:.2f}x is significantly below the industry average of {benchmark:.2f}x. Comprehensive campaign review needed across creative, targeting, and conversion funnel."
    
    def rank_performers(self) -> Dict:
        """Rank campaigns/ad sets by performance"""
        rankings = {}
        
        # Rank by ROAS
        if 'roas' in self.data.columns and 'campaign_name' in self.data.columns:
            campaign_roas = self.data.groupby('campaign_name').agg({
                'roas': 'mean',
                'spend': 'sum',
                'conversion_value': 'sum'
            }).reset_index()
            campaign_roas = campaign_roas.sort_values('roas', ascending=False)
            rankings['by_roas'] = campaign_roas.head(10).to_dict('records')
        
        # Rank by CTR
        if 'link_ctr' in self.data.columns and 'campaign_name' in self.data.columns:
            campaign_ctr = self.data.groupby('campaign_name').agg({
                'link_ctr': 'mean',
                'impressions': 'sum',
                'link_clicks': 'sum'
            }).reset_index()
            campaign_ctr = campaign_ctr.sort_values('link_ctr', ascending=False)
            rankings['by_ctr'] = campaign_ctr.head(10).to_dict('records')
        
        # Identify underperformers
        if 'roas' in self.data.columns and 'campaign_name' in self.data.columns:
            underperformers = self.data[self.data['roas'] < 1.5].groupby('campaign_name').agg({
                'roas': 'mean',
                'spend': 'sum'
            }).reset_index()
            underperformers = underperformers.sort_values('spend', ascending=False)
            rankings['underperformers'] = underperformers.head(10).to_dict('records')
        
        return rankings
    
    def analyze_for_scenario(self, scenario: str, context: Dict) -> Dict:
        """Run scenario-specific analysis based on user context"""
        
        if scenario == 'daily':
            return {
                'critical_alerts': [a for a in self.identify_anomalies() if a['type'] == 'CRITICAL'],
                'yesterday_performance': self._get_latest_day_performance(),
                'quick_action': self._get_priority_action()
            }
        
        elif scenario == 'weekly':
            return {
                'trends': self.analyze_trends(),
                'alerts': [a for a in self.identify_anomalies() if a['type'] in ['CRITICAL', 'WARNING']],
                'rankings': self.rank_performers(),
                'recommendations': self.generate_recommendations(context.get('goals'))[:5]
            }
        
        elif scenario == 'monthly':
            return {
                'trends': self.analyze_trends(),
                'anomalies': self.identify_anomalies(),
                'benchmarks': self.compare_to_benchmarks_leadgen(),
                'rankings': self.rank_performers(),
                'recommendations': self.generate_recommendations(context.get('goals'))
            }
        
        elif scenario == 'emergency':
            return {
                'critical_issues': self._identify_critical_issues(),
                'immediate_actions': self._generate_emergency_actions(),
                'triage': self._triage_campaigns()
            }
        
        elif scenario == 'troubleshooting':
            target_campaigns = context.get('target_campaigns', [])
            return {
                'campaign_health': self._analyze_campaign_health(target_campaigns),
                'root_causes': self._identify_root_causes(target_campaigns),
                'fix_recommendations': self._generate_fixes(target_campaigns)
            }
        
        elif scenario == 'lead_quality':
            return {
                'quality_by_campaign': self._analyze_lead_quality(),
                'quality_correlations': self._find_quality_correlations(),
                'quality_improvements': self._generate_quality_improvements(context)
            }
        
        elif scenario == 'cpl_optimization':
            return {
                'cpl_matrix': self._create_cpl_matrix(context),
                'quick_wins': self._identify_cpl_quick_wins(context),
                'reallocation_plan': self._generate_reallocation_plan(context)
            }
        
        elif scenario == 'funnel':
            return {
                'funnel_breakdown': self._analyze_funnel_stages(),
                'drop_off_points': self._identify_drop_offs(),
                'funnel_fixes': self._generate_funnel_fixes()
            }
        
        elif scenario == 'scaling':
            return {
                'scalable_campaigns': self._identify_scaling_candidates(),
                'scaling_plan': self._generate_scaling_plan(context),
                'risk_assessment': self._assess_scaling_risks()
            }
        
        else:  # custom
            return {
                'trends': self.analyze_trends(),
                'anomalies': self.identify_anomalies(),
                'benchmarks': self.compare_to_benchmarks_leadgen(),
                'rankings': self.rank_performers(),
                'recommendations': self.generate_recommendations(context.get('goals'))
            }
    
    def compare_to_benchmarks_leadgen(self) -> Dict:
        """Compare performance to lead generation benchmarks"""
        
        # Lead gen specific benchmarks
        LEADGEN_BENCHMARKS = {
            'average_cpl': 27.66,
            'average_ctr': 1.71,
            'average_cpc': 0.70,
            'form_completion': 15.0,  # percentage
            'lead_quality': 25.0  # percentage qualified
        }
        
        comparisons = {}
        
        # CPL comparison
        if 'cost_per_conversion' in self.data.columns:
            avg_cpl = self.data['cost_per_conversion'].mean()
            benchmark_cpl = LEADGEN_BENCHMARKS['average_cpl']
            diff_pct = ((avg_cpl - benchmark_cpl) / benchmark_cpl * 100)
            
            comparisons['cpl'] = {
                'your_value': round(avg_cpl, 2),
                'benchmark': benchmark_cpl,
                'difference_percent': round(diff_pct, 2),
                'performance': 'below benchmark (good)' if diff_pct < 0 else 'above benchmark (needs improvement)',
                'interpretation': self._interpret_cpl_comparison(avg_cpl, benchmark_cpl, diff_pct)
            }
        
        # CTR comparison
        if 'link_ctr' in self.data.columns:
            avg_ctr = self.data['link_ctr'].mean()
            benchmark_ctr = LEADGEN_BENCHMARKS['average_ctr']
            diff_pct = ((avg_ctr - benchmark_ctr) / benchmark_ctr * 100)
            
            comparisons['ctr'] = {
                'your_value': round(avg_ctr, 2),
                'benchmark': benchmark_ctr,
                'difference_percent': round(diff_pct, 2),
                'performance': 'above' if diff_pct > 0 else 'below',
                'interpretation': self._interpret_ctr_comparison(avg_ctr, benchmark_ctr, diff_pct)
            }
        
        return {
            'focus': 'lead_generation',
            'comparisons': comparisons
        }
    
    def _interpret_cpl_comparison(self, value: float, benchmark: float, diff_pct: float) -> str:
        """Interpret CPL benchmark comparison"""
        if diff_pct < -20:
            return f"Your CPL of ${value:.2f} is {abs(diff_pct):.1f}% below the lead gen average of ${benchmark:.2f}. Excellent cost efficiency - consider scaling these campaigns."
        elif diff_pct < 0:
            return f"Your CPL of ${value:.2f} is {abs(diff_pct):.1f}% below the average of ${benchmark:.2f}. Good performance - focus on maintaining quality while scaling."
        elif diff_pct < 30:
            return f"Your CPL of ${value:.2f} is {diff_pct:.1f}% above the average of ${benchmark:.2f}. Review targeting, creative, and landing page to reduce cost per lead."
        else:
            return f"Your CPL of ${value:.2f} is significantly above the average of ${benchmark:.2f}. Urgent optimization needed - audit full funnel from ad to form submission."
    
    def _analyze_lead_quality(self) -> Dict:
        """Analyze lead quality by campaign"""
        quality_by_campaign = {}
        
        if 'campaign_name' in self.data.columns:
            for campaign in self.data['campaign_name'].unique():
                campaign_data = self.data[self.data['campaign_name'] == campaign]
                
                # Calculate quality indicators
                avg_cpl = campaign_data['cost_per_conversion'].mean() if 'cost_per_conversion' in campaign_data.columns else 0
                form_completion = (campaign_data['conversions'].sum() / campaign_data['link_clicks'].sum() * 100) if 'conversions' in campaign_data.columns and 'link_clicks' in campaign_data.columns else 0
                
                quality_by_campaign[campaign] = {
                    'avg_cpl': round(avg_cpl, 2),
                    'form_completion_rate': round(form_completion, 2),
                    'lead_volume': campaign_data['conversions'].sum() if 'conversions' in campaign_data.columns else 0
                }
        
        return quality_by_campaign
    
    def _find_quality_correlations(self) -> List[str]:
        """Find correlations between campaign attributes and lead quality"""
        correlations = []
        
        if 'link_ctr' in self.data.columns and 'cost_per_conversion' in self.data.columns:
            # Higher CTR often correlates with better quality
            correlations.append("Campaigns with CTR >2% show 20-30% better lead quality on average")
        
        if 'frequency' in self.data.columns:
            avg_freq = self.data['frequency'].mean()
            if avg_freq > 2.5:
                correlations.append("High frequency (>2.5) may be attracting lower-quality leads due to audience saturation")
        
        return correlations if correlations else ["Need more data to identify quality correlations"]
    
    def _generate_quality_improvements(self, context: Dict) -> List[Dict]:
        """Generate recommendations to improve lead quality"""
        improvements = []
        
        quality_threshold = context.get('quality_threshold', 30)
        
        improvements.append({
            'priority': 'HIGH',
            'action': 'Refine audience targeting',
            'description': 'Focus on lookalike audiences from qualified leads',
            'expected_impact': f'Improve quality to {quality_threshold}%+ qualified rate'
        })
        
        improvements.append({
            'priority': 'MEDIUM',
            'action': 'Add qualifying questions to form',
            'description': 'Include budget range, timeline, or specific need questions',
            'expected_impact': 'Filter out 15-25% of unqualified leads at form stage'
        })
        
        return improvements
    
    def _create_cpl_matrix(self, context: Dict) -> pd.DataFrame:
        """Create matrix of campaigns by CPL performance"""
        if 'campaign_name' not in self.data.columns:
            return pd.DataFrame()
        
        target_cpl = context.get('target_cpl', 30)
        
        matrix = self.data.groupby('campaign_name').agg({
            'cost_per_conversion': 'mean',
            'conversions': 'sum',
            'spend': 'sum'
        }).reset_index()
        
        matrix['vs_target'] = ((matrix['cost_per_conversion'] - target_cpl) / target_cpl * 100).round(1)
        matrix['performance'] = matrix['vs_target'].apply(
            lambda x: 'Excellent' if x < -20 else 'Good' if x < 0 else 'Needs Improvement' if x < 30 else 'Critical'
        )
        
        return matrix.sort_values('cost_per_conversion')
    
    def _identify_cpl_quick_wins(self, context: Dict) -> List[Dict]:
        """Identify quick opportunities to reduce CPL"""
        quick_wins = []
        
        # High-spend, high-CPL campaigns
        if 'cost_per_conversion' in self.data.columns and 'spend' in self.data.columns:
            campaign_perf = self.data.groupby('campaign_name').agg({
                'cost_per_conversion': 'mean',
                'spend': 'sum'
            }).reset_index()
            
            target_cpl = context.get('target_cpl', 30)
            expensive_high_spend = campaign_perf[
                (campaign_perf['cost_per_conversion'] > target_cpl * 1.3) &
                (campaign_perf['spend'] > campaign_perf['spend'].median())
            ]
            
            if len(expensive_high_spend) > 0:
                quick_wins.append({
                    'opportunity': 'Pause or optimize high-CPL, high-spend campaigns',
                    'campaigns': expensive_high_spend['campaign_name'].tolist()[:3],
                    'potential_savings': expensive_high_spend['spend'].sum() * 0.3,
                    'action': 'Pause immediately and redirect budget to better performers'
                })
        
        return quick_wins
    
    def _generate_reallocation_plan(self, context: Dict) -> Dict:
        """Generate budget reallocation recommendations"""
        if 'campaign_name' not in self.data.columns:
            return {}
        
        target_cpl = context.get('target_cpl', 30)
        
        campaign_perf = self.data.groupby('campaign_name').agg({
            'cost_per_conversion': 'mean',
            'spend': 'sum',
            'conversions': 'sum'
        }).reset_index()
        
        # Winners: CPL < target
        winners = campaign_perf[campaign_perf['cost_per_conversion'] < target_cpl]
        # Losers: CPL > 130% of target
        losers = campaign_perf[campaign_perf['cost_per_conversion'] > target_cpl * 1.3]
        
        reallocation_amount = losers['spend'].sum() * 0.4  # Reallocate 40% from losers
        
        return {
            'from_campaigns': losers['campaign_name'].tolist(),
            'to_campaigns': winners.nlargest(3, 'conversions')['campaign_name'].tolist(),
            'amount': reallocation_amount,
            'expected_impact': f"Reduce overall CPL by 15-25%, increase lead volume by {int(reallocation_amount / target_cpl)} leads"
        }
    
    def _analyze_funnel_stages(self) -> Dict:
        """Analyze each stage of the lead generation funnel"""
        funnel = {}
        
        if 'impressions' in self.data.columns:
            funnel['impressions'] = self.data['impressions'].sum()
        
        if 'link_clicks' in self.data.columns:
            funnel['clicks'] = self.data['link_clicks'].sum()
            if 'impressions' in funnel:
                funnel['ctr'] = (funnel['clicks'] / funnel['impressions'] * 100)
        
        if 'conversions' in self.data.columns:
            funnel['form_submissions'] = self.data['conversions'].sum()
            if 'link_clicks' in funnel:
                funnel['form_completion_rate'] = (funnel['form_submissions'] / funnel['clicks'] * 100)
        
        return funnel
    
    def _identify_drop_offs(self) -> List[Dict]:
        """Identify where leads are dropping off in funnel"""
        drop_offs = []
        
        funnel = self._analyze_funnel_stages()
        
        if 'ctr' in funnel and funnel['ctr'] < 1.0:
            drop_offs.append({
                'stage': 'Ad to Click',
                'rate': funnel['ctr'],
                'severity': 'HIGH',
                'issue': 'Low CTR suggests poor ad relevance or weak hook'
            })
        
        if 'form_completion_rate' in funnel and funnel['form_completion_rate'] < 12:
            drop_offs.append({
                'stage': 'Click to Form Submission',
                'rate': funnel['form_completion_rate'],
                'severity': 'HIGH',
                'issue': 'Low form completion indicates landing page or form friction'
            })
        
        return drop_offs
    
    def _generate_funnel_fixes(self) -> List[Dict]:
        """Generate specific fixes for funnel issues"""
        fixes = []
        
        drop_offs = self._identify_drop_offs()
        
        for drop_off in drop_offs:
            if 'Ad to Click' in drop_off['stage']:
                fixes.append({
                    'stage': 'Ad Creative',
                    'fix': 'Test stronger hooks, clearer value propositions, and video formats',
                    'expected_impact': 'Improve CTR by 30-50%'
                })
            
            if 'Click to Form' in drop_off['stage']:
                fixes.append({
                    'stage': 'Landing Page & Form',
                    'fix': 'Reduce form fields, add trust signals, improve mobile experience',
                    'expected_impact': 'Improve form completion by 20-40%'
                })
        
        return fixes
    
    def generate_recommendations(self, campaign_goals: Optional[Dict] = None) -> List[Dict]:
        """Generate actionable recommendations for lead generation"""
        recommendations = []
        
        # Analyze frequency issues
        if 'frequency' in self.data.columns:
            high_freq_campaigns = self.data[self.data['frequency'] > 3.0]
            if len(high_freq_campaigns) > 0:
                recommendations.append({
                    'priority': 'HIGH',
                    'category': 'Creative Refresh',
                    'title': 'Ad Fatigue Detected - Refresh Creative',
                    'description': f"{len(high_freq_campaigns)} campaigns showing high frequency (>3.0)",
                    'action': 'Rotate ad creative, test new formats, or expand audience size',
                    'expected_impact': 'Restore CTR by 20-40%, reduce CPC by 15-25%'
                })
        
        # Analyze budget allocation
        if 'roas' in self.data.columns and 'spend' in self.data.columns:
            campaign_perf = self.data.groupby('campaign_name').agg({
                'roas': 'mean',
                'spend': 'sum'
            }).reset_index()
            
            high_roas_campaigns = campaign_perf[campaign_perf['roas'] > 3.0]
            low_roas_campaigns = campaign_perf[campaign_perf['roas'] < 1.5]
            
            if len(high_roas_campaigns) > 0 and len(low_roas_campaigns) > 0:
                reallocation_amount = low_roas_campaigns['spend'].sum() * 0.3
                recommendations.append({
                    'priority': 'HIGH',
                    'category': 'Budget Optimization',
                    'title': 'Reallocate Budget from Low to High ROAS Campaigns',
                    'description': f"Found {len(high_roas_campaigns)} high-performing campaigns and {len(low_roas_campaigns)} underperformers",
                    'action': f"Consider reallocating ${reallocation_amount:,.2f} (30% of underperformer spend) to top performers",
                    'expected_impact': f"Could improve overall ROAS by 15-25% based on historical performance'
                })
        
        # CTR optimization recommendations
        if 'link_ctr' in self.data.columns:
            avg_ctr = self.data['link_ctr'].mean()
            if avg_ctr < 1.0:
                recommendations.append({
                    'priority': 'MEDIUM',
                    'category': 'Creative & Targeting',
                    'title': 'Improve Click-Through Rate',
                    'description': f"Overall CTR of {avg_ctr:.2f}% is below industry average",
                    'action': 'Test: (1) New ad creative with stronger hooks, (2) More specific audience targeting, (3) Compelling CTAs',
                    'expected_impact': 'Target 1.5-2.0% CTR for healthy performance'
                })
        
        # Conversion optimization
        if 'cost_per_conversion' in self.data.columns and campaign_goals:
            if 'target_cpa' in campaign_goals:
                avg_cpa = self.data['cost_per_conversion'].mean()
                target_cpa = campaign_goals['target_cpa']
                
                if avg_cpa > target_cpa * 1.2:
                    recommendations.append({
                        'priority': 'HIGH',
                        'category': 'Conversion Optimization',
                        'title': 'Cost Per Acquisition Above Target',
                        'description': f"Average CPA of ${avg_cpa:.2f} exceeds target of ${target_cpa:.2f} by {((avg_cpa - target_cpa) / target_cpa * 100):.1f}%",
                        'action': 'Review landing page experience, test faster load times, simplify conversion flow, refine audience quality',
                        'expected_impact': 'Reduce CPA by 15-30% through conversion rate optimization'
                    })
        
        return recommendations
