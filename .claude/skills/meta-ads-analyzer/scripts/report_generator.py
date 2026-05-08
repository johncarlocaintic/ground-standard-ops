#!/usr/bin/env python3
"""
Meta Ads Report Generator
Creates reports in multiple formats (DOCX, XLSX, PDF, HTML)
"""

import pandas as pd
from pathlib import Path
from typing import Dict, List, Optional
from datetime import datetime
import json

class MetaAdsReportGenerator:
    """Generate comprehensive Meta Ads reports"""
    
    def __init__(self, data: pd.DataFrame, analysis_results: Dict, 
                 visualizations: Dict[str, str], output_dir: str = '/mnt/user-data/outputs'):
        self.data = data
        self.analysis = analysis_results
        self.charts = visualizations
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(exist_ok=True, parents=True)
        
    def generate_docx_report(self, filename: str = 'meta_ads_report.docx') -> str:
        """Generate Word document report"""
        from docx import Document
        from docx.shared import Inches, Pt, RGBColor
        from docx.enum.text import WD_ALIGN_PARAGRAPH
        
        doc = Document()
        
        # Title
        title = doc.add_heading('Meta Ads Performance Analysis Report', 0)
        title.alignment = WD_ALIGN_PARAGRAPH.CENTER
        
        # Report metadata
        doc.add_paragraph(f"Generated: {datetime.now().strftime('%B %d, %Y at %I:%M %p')}")
        doc.add_paragraph()
        
        # Executive Summary
        doc.add_heading('Executive Summary', 1)
        summary_stats = self.analysis.get('summary_stats', {})
        
        if summary_stats:
            doc.add_paragraph(f"Date Range: {summary_stats.get('date_range', {}).get('start', 'N/A')} to {summary_stats.get('date_range', {}).get('end', 'N/A')}")
            doc.add_paragraph(f"Total Spend: ${summary_stats.get('total_spend', 0):,.2f}")
            doc.add_paragraph(f"Total Impressions: {summary_stats.get('total_impressions', 0):,.0f}")
            doc.add_paragraph(f"Total Clicks: {summary_stats.get('total_clicks', 0):,.0f}")
            doc.add_paragraph(f"Total Conversions: {summary_stats.get('total_conversions', 0):,.0f}")
            doc.add_paragraph(f"Number of Campaigns: {summary_stats.get('campaigns_count', 0)}")
        
        doc.add_page_break()
        
        # Key Findings
        doc.add_heading('Key Findings', 1)
        
        # Anomalies
        anomalies = self.analysis.get('anomalies', [])
        if anomalies:
            doc.add_heading('Performance Alerts', 2)
            for anomaly in anomalies:
                p = doc.add_paragraph()
                run = p.add_run(f"[{anomaly['type']}] {anomaly['message']}")
                if anomaly['type'] == 'CRITICAL':
                    run.font.color.rgb = RGBColor(231, 76, 60)
                elif anomaly['type'] == 'WARNING':
                    run.font.color.rgb = RGBColor(243, 156, 18)
                run.bold = True
                
                doc.add_paragraph(anomaly['detail'], style='List Bullet')
                doc.add_paragraph(f"Recommendation: {anomaly['recommendation']}", style='List Bullet 2')
        
        # Trends
        trends = self.analysis.get('trends', {})
        if trends:
            doc.add_heading('Performance Trends', 2)
            for metric, trend_data in trends.items():
                direction_icon = '↑' if trend_data['direction'] == 'increasing' else '↓' if trend_data['direction'] == 'decreasing' else '→'
                doc.add_paragraph(
                    f"{metric.upper()}: {direction_icon} {trend_data['direction'].title()} "
                    f"({trend_data['change_percent']:+.1f}%)"
                )
        
        doc.add_page_break()
        
        # Benchmark Comparison
        benchmarks = self.analysis.get('benchmarks', {})
        if benchmarks and 'comparisons' in benchmarks:
            doc.add_heading('Industry Benchmark Comparison', 1)
            industry = benchmarks.get('industry', 'general')
            doc.add_paragraph(f"Industry: {industry.replace('_', ' ').title()}")
            doc.add_paragraph()
            
            for metric, comparison in benchmarks['comparisons'].items():
                doc.add_heading(metric.upper(), 2)
                doc.add_paragraph(f"Your Performance: {comparison['your_value']}")
                doc.add_paragraph(f"Industry Average: {comparison['benchmark']}")
                doc.add_paragraph(f"Difference: {comparison['difference_percent']:+.1f}%")
                doc.add_paragraph(comparison['interpretation'])
                doc.add_paragraph()
        
        doc.add_page_break()
        
        # Recommendations
        recommendations = self.analysis.get('recommendations', [])
        if recommendations:
            doc.add_heading('Strategic Recommendations', 1)
            
            for i, rec in enumerate(recommendations, 1):
                doc.add_heading(f"{i}. {rec['title']}", 2)
                
                p = doc.add_paragraph()
                run = p.add_run(f"Priority: {rec['priority']}")
                if rec['priority'] == 'HIGH':
                    run.font.color.rgb = RGBColor(231, 76, 60)
                elif rec['priority'] == 'MEDIUM':
                    run.font.color.rgb = RGBColor(243, 156, 18)
                run.bold = True
                
                doc.add_paragraph(f"Category: {rec['category']}")
                doc.add_paragraph(f"Description: {rec['description']}")
                doc.add_paragraph(f"Action: {rec['action']}")
                doc.add_paragraph(f"Expected Impact: {rec['expected_impact']}")
                doc.add_paragraph()
        
        doc.add_page_break()
        
        # Visualizations
        if self.charts:
            doc.add_heading('Performance Visualizations', 1)
            for chart_name, chart_path in self.charts.items():
                if Path(chart_path).exists():
                    doc.add_heading(chart_name.replace('_', ' ').title(), 2)
                    try:
                        doc.add_picture(chart_path, width=Inches(6))
                    except Exception as e:
                        doc.add_paragraph(f"[Chart could not be embedded: {str(e)}]")
                    doc.add_paragraph()
        
        # Save document
        output_path = self.output_dir / filename
        doc.save(output_path)
        return str(output_path)
    
    def generate_xlsx_report(self, filename: str = 'meta_ads_analysis.xlsx') -> str:
        """Generate Excel workbook with multiple sheets"""
        output_path = self.output_dir / filename
        
        with pd.ExcelWriter(output_path, engine='openpyxl') as writer:
            # Raw Data
            self.data.to_excel(writer, sheet_name='Raw Data', index=False)
            
            # Summary
            summary_stats = self.analysis.get('summary_stats', {})
            if summary_stats:
                summary_df = pd.DataFrame([
                    ['Report Generated', datetime.now().strftime('%Y-%m-%d %H:%M:%S')],
                    ['Date Range Start', str(summary_stats.get('date_range', {}).get('start', 'N/A'))],
                    ['Date Range End', str(summary_stats.get('date_range', {}).get('end', 'N/A'))],
                    ['Total Spend', summary_stats.get('total_spend', 0)],
                    ['Total Impressions', summary_stats.get('total_impressions', 0)],
                    ['Total Clicks', summary_stats.get('total_clicks', 0)],
                    ['Total Conversions', summary_stats.get('total_conversions', 0)],
                    ['Number of Campaigns', summary_stats.get('campaigns_count', 0)]
                ], columns=['Metric', 'Value'])
                summary_df.to_excel(writer, sheet_name='Summary', index=False)
            
            # Anomalies
            anomalies = self.analysis.get('anomalies', [])
            if anomalies:
                anomalies_df = pd.DataFrame(anomalies)
                anomalies_df.to_excel(writer, sheet_name='Alerts', index=False)
            
            # Trends
            trends = self.analysis.get('trends', {})
            if trends:
                trends_list = []
                for metric, data in trends.items():
                    trends_list.append({
                        'Metric': metric.upper(),
                        'Direction': data['direction'],
                        'Change %': data['change_percent'],
                        'Recent Avg': data['recent_avg'],
                        'Previous Avg': data['older_avg']
                    })
                trends_df = pd.DataFrame(trends_list)
                trends_df.to_excel(writer, sheet_name='Trends', index=False)
            
            # Benchmarks
            benchmarks = self.analysis.get('benchmarks', {})
            if benchmarks and 'comparisons' in benchmarks:
                benchmark_list = []
                for metric, data in benchmarks['comparisons'].items():
                    benchmark_list.append({
                        'Metric': metric.upper(),
                        'Your Value': data['your_value'],
                        'Industry Avg': data['benchmark'],
                        'Difference %': data['difference_percent'],
                        'Performance': data['performance']
                    })
                benchmarks_df = pd.DataFrame(benchmark_list)
                benchmarks_df.to_excel(writer, sheet_name='Benchmarks', index=False)
            
            # Recommendations
            recommendations = self.analysis.get('recommendations', [])
            if recommendations:
                recs_df = pd.DataFrame(recommendations)
                recs_df.to_excel(writer, sheet_name='Recommendations', index=False)
            
            # Rankings
            rankings = self.analysis.get('rankings', {})
            if 'by_roas' in rankings:
                roas_df = pd.DataFrame(rankings['by_roas'])
                roas_df.to_excel(writer, sheet_name='Top by ROAS', index=False)
            
            if 'by_ctr' in rankings:
                ctr_df = pd.DataFrame(rankings['by_ctr'])
                ctr_df.to_excel(writer, sheet_name='Top by CTR', index=False)
            
            if 'underperformers' in rankings:
                under_df = pd.DataFrame(rankings['underperformers'])
                under_df.to_excel(writer, sheet_name='Underperformers', index=False)
        
        return str(output_path)
    
    def generate_html_report(self, filename: str = 'meta_ads_report.html') -> str:
        """Generate interactive HTML report"""
        html_content = f"""
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Meta Ads Performance Report</title>
    <style>
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background: #f5f5f5;
        }}
        .header {{
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            border-radius: 10px;
            margin-bottom: 30px;
            text-align: center;
        }}
        .header h1 {{
            margin: 0;
            font-size: 2.5em;
        }}
        .header p {{
            margin: 10px 0 0 0;
            opacity: 0.9;
        }}
        .section {{
            background: white;
            padding: 25px;
            margin-bottom: 20px;
            border-radius: 10px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }}
        .section h2 {{
            color: #667eea;
            border-bottom: 2px solid #667eea;
            padding-bottom: 10px;
            margin-top: 0;
        }}
        .stats-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin: 20px 0;
        }}
        .stat-card {{
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
        }}
        .stat-card .label {{
            font-size: 0.9em;
            color: #666;
            margin-bottom: 5px;
        }}
        .stat-card .value {{
            font-size: 1.8em;
            font-weight: bold;
            color: #667eea;
        }}
        .alert {{
            padding: 15px;
            margin: 10px 0;
            border-radius: 5px;
            border-left: 4px solid;
        }}
        .alert-critical {{
            background: #fee;
            border-color: #e74c3c;
        }}
        .alert-warning {{
            background: #fef9e7;
            border-color: #f39c12;
        }}
        .alert-info {{
            background: #e8f5fe;
            border-color: #3498db;
        }}
        .recommendation {{
            background: #f8f9fa;
            padding: 20px;
            margin: 15px 0;
            border-radius: 8px;
            border-left: 4px solid #2ecc71;
        }}
        .recommendation h3 {{
            margin-top: 0;
            color: #27ae60;
        }}
        .priority-high {{
            color: #e74c3c;
            font-weight: bold;
        }}
        .priority-medium {{
            color: #f39c12;
            font-weight: bold;
        }}
        .chart-container {{
            margin: 20px 0;
            text-align: center;
        }}
        .chart-container img {{
            max-width: 100%;
            height: auto;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }}
        table {{
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }}
        th, td {{
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #ddd;
        }}
        th {{
            background: #667eea;
            color: white;
        }}
        tr:hover {{
            background: #f5f5f5;
        }}
    </style>
</head>
<body>
    <div class="header">
        <h1>Meta Ads Performance Analysis</h1>
        <p>Generated on {datetime.now().strftime('%B %d, %Y at %I:%M %p')}</p>
    </div>
"""
        
        # Summary Stats
        summary_stats = self.analysis.get('summary_stats', {})
        if summary_stats:
            html_content += """
    <div class="section">
        <h2>Campaign Overview</h2>
        <div class="stats-grid">
"""
            html_content += f"""
            <div class="stat-card">
                <div class="label">Total Spend</div>
                <div class="value">${summary_stats.get('total_spend', 0):,.2f}</div>
            </div>
            <div class="stat-card">
                <div class="label">Impressions</div>
                <div class="value">{summary_stats.get('total_impressions', 0):,.0f}</div>
            </div>
            <div class="stat-card">
                <div class="label">Clicks</div>
                <div class="value">{summary_stats.get('total_clicks', 0):,.0f}</div>
            </div>
            <div class="stat-card">
                <div class="label">Conversions</div>
                <div class="value">{summary_stats.get('total_conversions', 0):,.0f}</div>
            </div>
            <div class="stat-card">
                <div class="label">Campaigns</div>
                <div class="value">{summary_stats.get('campaigns_count', 0)}</div>
            </div>
"""
            html_content += """
        </div>
    </div>
"""
        
        # Anomalies
        anomalies = self.analysis.get('anomalies', [])
        if anomalies:
            html_content += """
    <div class="section">
        <h2>Performance Alerts</h2>
"""
            for anomaly in anomalies:
                alert_class = f"alert-{anomaly['type'].lower()}"
                html_content += f"""
        <div class="alert {alert_class}">
            <strong>[{anomaly['type']}] {anomaly['message']}</strong><br>
            {anomaly['detail']}<br>
            <em>Recommendation: {anomaly['recommendation']}</em>
        </div>
"""
            html_content += """
    </div>
"""
        
        # Benchmarks
        benchmarks = self.analysis.get('benchmarks', {})
        if benchmarks and 'comparisons' in benchmarks:
            html_content += """
    <div class="section">
        <h2>Industry Benchmark Comparison</h2>
"""
            for metric, data in benchmarks['comparisons'].items():
                html_content += f"""
        <h3>{metric.upper()}</h3>
        <p><strong>Your Performance:</strong> {data['your_value']} | 
           <strong>Industry Average:</strong> {data['benchmark']} | 
           <strong>Difference:</strong> {data['difference_percent']:+.1f}%</p>
        <p>{data['interpretation']}</p>
"""
            html_content += """
    </div>
"""
        
        # Recommendations
        recommendations = self.analysis.get('recommendations', [])
        if recommendations:
            html_content += """
    <div class="section">
        <h2>Strategic Recommendations</h2>
"""
            for rec in recommendations:
                priority_class = f"priority-{rec['priority'].lower()}"
                html_content += f"""
        <div class="recommendation">
            <h3>{rec['title']}</h3>
            <p><span class="{priority_class}">Priority: {rec['priority']}</span> | 
               <strong>Category:</strong> {rec['category']}</p>
            <p><strong>Description:</strong> {rec['description']}</p>
            <p><strong>Action:</strong> {rec['action']}</p>
            <p><strong>Expected Impact:</strong> {rec['expected_impact']}</p>
        </div>
"""
            html_content += """
    </div>
"""
        
        # Visualizations
        if self.charts:
            html_content += """
    <div class="section">
        <h2>Performance Visualizations</h2>
"""
            for chart_name, chart_path in self.charts.items():
                if Path(chart_path).exists():
                    # Convert chart path to base64 for embedding
                    import base64
                    with open(chart_path, 'rb') as f:
                        chart_data = base64.b64encode(f.read()).decode()
                    
                    html_content += f"""
        <div class="chart-container">
            <h3>{chart_name.replace('_', ' ').title()}</h3>
            <img src="data:image/png;base64,{chart_data}" alt="{chart_name}">
        </div>
"""
            html_content += """
    </div>
"""
        
        html_content += """
</body>
</html>
"""
        
        output_path = self.output_dir / filename
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(html_content)
        
        return str(output_path)
    
    def generate_all_reports(self) -> Dict[str, str]:
        """Generate all report formats"""
        reports = {}
        
        try:
            reports['docx'] = self.generate_docx_report()
        except Exception as e:
            print(f"Error generating DOCX report: {str(e)}")
        
        try:
            reports['xlsx'] = self.generate_xlsx_report()
        except Exception as e:
            print(f"Error generating XLSX report: {str(e)}")
        
        try:
            reports['html'] = self.generate_html_report()
        except Exception as e:
            print(f"Error generating HTML report: {str(e)}")
        
        return reports
