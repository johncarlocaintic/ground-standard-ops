#!/usr/bin/env python3
"""
Meta Ads Visualization Generator
Creates static charts for reports
"""

import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from pathlib import Path
from typing import List, Dict, Optional
import numpy as np

class MetaAdsVisualizer:
    """Generate static visualizations for Meta Ads data"""
    
    def __init__(self, output_dir: str = '/home/claude/charts'):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(exist_ok=True, parents=True)
        
        # Set style
        sns.set_style("whitegrid")
        plt.rcParams['figure.figsize'] = (10, 6)
        plt.rcParams['font.size'] = 10
        
    def create_trend_chart(self, data: pd.DataFrame, metric: str, title: str, filename: str) -> str:
        """Create a time-series trend chart"""
        if 'date_start' not in data.columns or metric not in data.columns:
            return None
        
        # Group by date
        daily = data.groupby('date_start')[metric].sum().reset_index()
        
        plt.figure(figsize=(12, 6))
        plt.plot(daily['date_start'], daily[metric], marker='o', linewidth=2, markersize=4)
        
        # Add rolling average if enough data points
        if len(daily) > 7:
            rolling_avg = daily[metric].rolling(window=7, center=True).mean()
            plt.plot(daily['date_start'], rolling_avg, linewidth=2, linestyle='--', 
                    alpha=0.7, label='7-day avg')
            plt.legend()
        
        plt.title(title, fontsize=14, fontweight='bold')
        plt.xlabel('Date', fontsize=12)
        plt.ylabel(metric.upper().replace('_', ' ').title(), fontsize=12)
        plt.xticks(rotation=45)
        plt.tight_layout()
        
        output_path = self.output_dir / filename
        plt.savefig(output_path, dpi=300, bbox_inches='tight')
        plt.close()
        
        return str(output_path)
    
    def create_performance_comparison(self, data: pd.DataFrame, metric: str, 
                                     group_by: str, title: str, filename: str,
                                     top_n: int = 10) -> str:
        """Create horizontal bar chart comparing performance"""
        if group_by not in data.columns or metric not in data.columns:
            return None
        
        # Group and get top performers
        grouped = data.groupby(group_by)[metric].mean().sort_values(ascending=True).tail(top_n)
        
        plt.figure(figsize=(10, max(6, len(grouped) * 0.5)))
        colors = ['#2ecc71' if v > 0 else '#e74c3c' for v in grouped.values]
        plt.barh(grouped.index, grouped.values, color=colors, alpha=0.8)
        
        plt.title(title, fontsize=14, fontweight='bold')
        plt.xlabel(metric.upper().replace('_', ' ').title(), fontsize=12)
        plt.ylabel(group_by.replace('_', ' ').title(), fontsize=12)
        plt.tight_layout()
        
        output_path = self.output_dir / filename
        plt.savefig(output_path, dpi=300, bbox_inches='tight')
        plt.close()
        
        return str(output_path)
    
    def create_spend_allocation_chart(self, data: pd.DataFrame, filename: str) -> str:
        """Create pie chart showing spend allocation"""
        if 'campaign_name' not in data.columns or 'spend' not in data.columns:
            return None
        
        # Group by campaign
        campaign_spend = data.groupby('campaign_name')['spend'].sum().sort_values(ascending=False)
        
        # Show top 8 campaigns, group rest as "Other"
        if len(campaign_spend) > 8:
            top_campaigns = campaign_spend.head(8)
            other_spend = campaign_spend.tail(-8).sum()
            campaign_spend = pd.concat([top_campaigns, pd.Series({'Other': other_spend})])
        
        plt.figure(figsize=(10, 8))
        colors = sns.color_palette("husl", len(campaign_spend))
        plt.pie(campaign_spend.values, labels=campaign_spend.index, autopct='%1.1f%%',
                startangle=90, colors=colors)
        plt.title('Budget Allocation by Campaign', fontsize=14, fontweight='bold')
        plt.axis('equal')
        
        output_path = self.output_dir / filename
        plt.savefig(output_path, dpi=300, bbox_inches='tight')
        plt.close()
        
        return str(output_path)
    
    def create_funnel_visualization(self, data: pd.DataFrame, filename: str) -> str:
        """Create funnel visualization"""
        total_impressions = data['impressions'].sum() if 'impressions' in data.columns else 0
        total_clicks = data['link_clicks'].sum() if 'link_clicks' in data.columns else 0
        total_conversions = data['conversions'].sum() if 'conversions' in data.columns else 0
        
        if total_impressions == 0:
            return None
        
        stages = ['Impressions', 'Clicks', 'Conversions']
        values = [total_impressions, total_clicks, total_conversions]
        
        # Calculate percentages
        percentages = [100]
        if total_impressions > 0:
            percentages.append((total_clicks / total_impressions) * 100)
            percentages.append((total_conversions / total_impressions) * 100)
        
        fig, ax = plt.subplots(figsize=(10, 8))
        
        # Create funnel
        colors = ['#3498db', '#2ecc71', '#f39c12']
        y_positions = [3, 2, 1]
        
        for i, (stage, value, pct, color, y) in enumerate(zip(stages, values, percentages, colors, y_positions)):
            width = pct / 100
            ax.barh(y, width, height=0.7, color=color, alpha=0.8)
            
            # Add labels
            label_text = f"{stage}\n{value:,.0f} ({pct:.1f}%)"
            ax.text(width/2, y, label_text, ha='center', va='center', 
                   fontsize=12, fontweight='bold', color='white')
        
        ax.set_xlim(0, 1.2)
        ax.set_ylim(0.5, 3.5)
        ax.axis('off')
        ax.set_title('Conversion Funnel', fontsize=14, fontweight='bold', pad=20)
        
        output_path = self.output_dir / filename
        plt.savefig(output_path, dpi=300, bbox_inches='tight')
        plt.close()
        
        return str(output_path)
    
    def create_benchmark_comparison(self, your_metrics: Dict, benchmarks: Dict, 
                                   industry: str, filename: str) -> str:
        """Create benchmark comparison chart"""
        metrics_to_compare = []
        your_values = []
        benchmark_values = []
        
        for metric, data in your_metrics.items():
            if metric in benchmarks:
                metrics_to_compare.append(metric.upper())
                your_values.append(data)
                benchmark_values.append(benchmarks[metric])
        
        if not metrics_to_compare:
            return None
        
        x = np.arange(len(metrics_to_compare))
        width = 0.35
        
        fig, ax = plt.subplots(figsize=(10, 6))
        bars1 = ax.bar(x - width/2, your_values, width, label='Your Performance', color='#3498db')
        bars2 = ax.bar(x + width/2, benchmark_values, width, label=f'{industry.title()} Average', color='#95a5a6')
        
        ax.set_xlabel('Metrics', fontsize=12)
        ax.set_title('Performance vs Industry Benchmarks', fontsize=14, fontweight='bold')
        ax.set_xticks(x)
        ax.set_xticklabels(metrics_to_compare)
        ax.legend()
        
        # Add value labels on bars
        for bars in [bars1, bars2]:
            for bar in bars:
                height = bar.get_height()
                ax.annotate(f'{height:.2f}',
                           xy=(bar.get_x() + bar.get_width() / 2, height),
                           xytext=(0, 3),
                           textcoords="offset points",
                           ha='center', va='bottom', fontsize=9)
        
        plt.tight_layout()
        
        output_path = self.output_dir / filename
        plt.savefig(output_path, dpi=300, bbox_inches='tight')
        plt.close()
        
        return str(output_path)
    
    def create_frequency_distribution(self, data: pd.DataFrame, filename: str) -> str:
        """Create frequency distribution histogram"""
        if 'frequency' not in data.columns:
            return None
        
        plt.figure(figsize=(10, 6))
        plt.hist(data['frequency'].dropna(), bins=30, color='#3498db', alpha=0.7, edgecolor='black')
        
        # Add warning lines
        plt.axvline(x=2.5, color='orange', linestyle='--', linewidth=2, label='Warning (2.5)')
        plt.axvline(x=3.5, color='red', linestyle='--', linewidth=2, label='Critical (3.5)')
        
        plt.title('Ad Frequency Distribution', fontsize=14, fontweight='bold')
        plt.xlabel('Frequency', fontsize=12)
        plt.ylabel('Count', fontsize=12)
        plt.legend()
        plt.tight_layout()
        
        output_path = self.output_dir / filename
        plt.savefig(output_path, dpi=300, bbox_inches='tight')
        plt.close()
        
        return str(output_path)
    
    def create_roas_scatter(self, data: pd.DataFrame, filename: str) -> str:
        """Create scatter plot of spend vs ROAS"""
        if 'spend' not in data.columns or 'roas' not in data.columns:
            return None
        
        # Aggregate by campaign
        if 'campaign_name' in data.columns:
            campaign_data = data.groupby('campaign_name').agg({
                'spend': 'sum',
                'roas': 'mean'
            }).reset_index()
        else:
            campaign_data = data[['spend', 'roas']].copy()
        
        plt.figure(figsize=(10, 6))
        plt.scatter(campaign_data['spend'], campaign_data['roas'], 
                   alpha=0.6, s=100, color='#3498db')
        
        # Add quadrant lines
        median_spend = campaign_data['spend'].median()
        plt.axvline(x=median_spend, color='gray', linestyle='--', alpha=0.5)
        plt.axhline(y=3.0, color='green', linestyle='--', alpha=0.5, label='Healthy ROAS (3.0)')
        plt.axhline(y=1.5, color='orange', linestyle='--', alpha=0.5, label='Break-even ROAS (1.5)')
        
        plt.title('Campaign Performance: Spend vs ROAS', fontsize=14, fontweight='bold')
        plt.xlabel('Spend ($)', fontsize=12)
        plt.ylabel('ROAS', fontsize=12)
        plt.legend()
        plt.tight_layout()
        
        output_path = self.output_dir / filename
        plt.savefig(output_path, dpi=300, bbox_inches='tight')
        plt.close()
        
        return str(output_path)
    
    def generate_all_visualizations(self, data: pd.DataFrame, 
                                   benchmark_data: Optional[Dict] = None) -> Dict[str, str]:
        """Generate all relevant visualizations"""
        charts = {}
        
        # Time series trends
        if 'date_start' in data.columns:
            if 'spend' in data.columns:
                charts['spend_trend'] = self.create_trend_chart(
                    data, 'spend', 'Daily Spend Trend', 'spend_trend.png')
            
            if 'link_ctr' in data.columns:
                charts['ctr_trend'] = self.create_trend_chart(
                    data, 'link_ctr', 'CTR Trend Over Time', 'ctr_trend.png')
            
            if 'roas' in data.columns:
                charts['roas_trend'] = self.create_trend_chart(
                    data, 'roas', 'ROAS Trend Over Time', 'roas_trend.png')
        
        # Performance comparisons
        if 'campaign_name' in data.columns:
            if 'roas' in data.columns:
                charts['campaign_roas'] = self.create_performance_comparison(
                    data, 'roas', 'campaign_name', 
                    'Top Campaigns by ROAS', 'campaign_roas.png')
            
            if 'link_ctr' in data.columns:
                charts['campaign_ctr'] = self.create_performance_comparison(
                    data, 'link_ctr', 'campaign_name',
                    'Top Campaigns by CTR', 'campaign_ctr.png')
        
        # Spend allocation
        charts['spend_allocation'] = self.create_spend_allocation_chart(
            data, 'spend_allocation.png')
        
        # Funnel
        charts['funnel'] = self.create_funnel_visualization(
            data, 'conversion_funnel.png')
        
        # Frequency distribution
        if 'frequency' in data.columns:
            charts['frequency_dist'] = self.create_frequency_distribution(
                data, 'frequency_distribution.png')
        
        # ROAS scatter
        if 'spend' in data.columns and 'roas' in data.columns:
            charts['roas_scatter'] = self.create_roas_scatter(
                data, 'roas_scatter.png')
        
        # Benchmark comparison
        if benchmark_data:
            charts['benchmarks'] = self.create_benchmark_comparison(
                benchmark_data.get('your_metrics', {}),
                benchmark_data.get('benchmarks', {}),
                benchmark_data.get('industry', 'general'),
                'benchmark_comparison.png'
            )
        
        # Remove None values
        charts = {k: v for k, v in charts.items() if v is not None}
        
        return charts
