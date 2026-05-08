#!/usr/bin/env python3
"""
Meta Ads Data Processor
Parses and normalizes Meta Ads export files (CSV, XLSX, XLS)
"""

import pandas as pd
import numpy as np
from pathlib import Path
from typing import Dict, List, Tuple, Optional
import re

class MetaAdsDataProcessor:
    """Process and normalize Meta Ads export data"""
    
    # Column name mappings (API field -> possible UI names)
    COLUMN_MAPPINGS = {
        'date_start': ['date_start', 'reporting starts', 'reporting_starts', 'start_date', 'date'],
        'date_stop': ['date_stop', 'reporting ends', 'reporting_ends', 'end_date'],
        'campaign_id': ['campaign_id', 'campaign id'],
        'campaign_name': ['campaign_name', 'campaign name', 'campaign'],
        'adset_id': ['adset_id', 'ad set id', 'adset id'],
        'adset_name': ['adset_name', 'ad set name', 'adset name', 'ad set'],
        'ad_id': ['ad_id', 'ad id'],
        'ad_name': ['ad_name', 'ad name', 'ad'],
        'impressions': ['impressions', 'impr.'],
        'reach': ['reach'],
        'frequency': ['frequency', 'freq'],
        'clicks': ['clicks (all)', 'clicks', 'all clicks'],
        'link_clicks': ['link clicks', 'inline_link_clicks', 'link click'],
        'ctr': ['ctr (all)', 'ctr', 'click-through rate'],
        'link_ctr': ['ctr (link click-through rate)', 'link_ctr', 'inline_link_click_ctr'],
        'cpc': ['cpc (cost per link click)', 'cpc', 'cost per click'],
        'spend': ['amount spent', 'spend', 'cost'],
        'cpm': ['cpm (cost per 1,000 impressions)', 'cpm'],
        'cpp': ['cpp (cost per 1,000 people reached)', 'cpp'],
        'conversions': ['results', 'conversions', 'purchases', 'leads'],
        'cost_per_conversion': ['cost per result', 'cost_per_conversion', 'cpa', 'cost per action'],
        'conversion_value': ['conversion value', 'purchase conversion value', 'value'],
        'roas': ['roas (return on ad spend)', 'roas', 'purchase roas', 'return on ad spend'],
        'budget': ['budget', 'daily budget', 'lifetime budget'],
        'objective': ['objective', 'campaign objective'],
        'video_views': ['video views', '3-second video views', 'thruplay'],
        'engagement': ['post engagement', 'engagement', 'post reactions']
    }
    
    def __init__(self):
        self.data = None
        self.original_columns = []
        self.normalized_columns = {}
        
    def load_file(self, file_path: str) -> pd.DataFrame:
        """Load a Meta Ads export file"""
        path = Path(file_path)
        
        if not path.exists():
            raise FileNotFoundError(f"File not found: {file_path}")
        
        # Detect file type and load
        if path.suffix.lower() == '.csv':
            df = pd.read_csv(file_path, encoding='utf-8-sig')
        elif path.suffix.lower() in ['.xlsx', '.xls']:
            df = pd.read_excel(file_path)
        else:
            raise ValueError(f"Unsupported file format: {path.suffix}")
        
        self.original_columns = df.columns.tolist()
        return df
    
    def normalize_columns(self, df: pd.DataFrame) -> pd.DataFrame:
        """Normalize column names to standard format"""
        normalized = df.copy()
        
        # Convert all column names to lowercase for matching
        normalized.columns = [col.lower().strip() for col in normalized.columns]
        
        # Map columns to standardized names
        rename_map = {}
        for standard_name, possible_names in self.COLUMN_MAPPINGS.items():
            for col in normalized.columns:
                if col in [name.lower() for name in possible_names]:
                    rename_map[col] = standard_name
                    self.normalized_columns[standard_name] = col
                    break
        
        normalized = normalized.rename(columns=rename_map)
        return normalized
    
    def clean_numeric_columns(self, df: pd.DataFrame) -> pd.DataFrame:
        """Clean and convert numeric columns"""
        numeric_columns = [
            'impressions', 'reach', 'frequency', 'clicks', 'link_clicks',
            'ctr', 'link_ctr', 'cpc', 'spend', 'cpm', 'cpp',
            'conversions', 'cost_per_conversion', 'conversion_value', 'roas', 'budget'
        ]
        
        for col in numeric_columns:
            if col in df.columns:
                # Remove currency symbols, commas, percentage signs
                if df[col].dtype == 'object':
                    df[col] = df[col].astype(str).str.replace('$', '', regex=False)
                    df[col] = df[col].str.replace(',', '', regex=False)
                    df[col] = df[col].str.replace('%', '', regex=False)
                    df[col] = df[col].str.strip()
                    
                # Convert to numeric
                df[col] = pd.to_numeric(df[col], errors='coerce')
        
        return df
    
    def parse_dates(self, df: pd.DataFrame) -> pd.DataFrame:
        """Parse date columns"""
        date_columns = ['date_start', 'date_stop']
        
        for col in date_columns:
            if col in df.columns:
                df[col] = pd.to_datetime(df[col], errors='coerce')
        
        return df
    
    def calculate_derived_metrics(self, df: pd.DataFrame) -> pd.DataFrame:
        """Calculate derived metrics if base metrics exist"""
        
        # CTR (if not present)
        if 'link_ctr' not in df.columns and 'link_clicks' in df.columns and 'impressions' in df.columns:
            df['link_ctr'] = (df['link_clicks'] / df['impressions'] * 100).round(2)
        
        # CPC (if not present)
        if 'cpc' not in df.columns and 'spend' in df.columns and 'link_clicks' in df.columns:
            df['cpc'] = (df['spend'] / df['link_clicks']).round(2)
        
        # CPM (if not present)
        if 'cpm' not in df.columns and 'spend' in df.columns and 'impressions' in df.columns:
            df['cpm'] = (df['spend'] / df['impressions'] * 1000).round(2)
        
        # Frequency (if not present)
        if 'frequency' not in df.columns and 'impressions' in df.columns and 'reach' in df.columns:
            df['frequency'] = (df['impressions'] / df['reach']).round(2)
        
        # ROAS (if not present)
        if 'roas' not in df.columns and 'conversion_value' in df.columns and 'spend' in df.columns:
            df['roas'] = (df['conversion_value'] / df['spend']).round(2)
        
        # Cost per conversion (if not present)
        if 'cost_per_conversion' not in df.columns and 'spend' in df.columns and 'conversions' in df.columns:
            df['cost_per_conversion'] = (df['spend'] / df['conversions']).round(2)
        
        return df
    
    def process(self, file_path: str) -> pd.DataFrame:
        """Full processing pipeline"""
        # Load file
        df = self.load_file(file_path)
        
        # Normalize column names
        df = self.normalize_columns(df)
        
        # Clean numeric columns
        df = self.clean_numeric_columns(df)
        
        # Parse dates
        df = self.parse_dates(df)
        
        # Calculate derived metrics
        df = self.calculate_derived_metrics(df)
        
        # Remove rows with all NaN values
        df = df.dropna(how='all')
        
        self.data = df
        return df
    
    def merge_historical_files(self, file_paths: List[str]) -> pd.DataFrame:
        """Merge multiple historical export files"""
        dfs = []
        
        for file_path in file_paths:
            processor = MetaAdsDataProcessor()
            df = processor.process(file_path)
            dfs.append(df)
        
        # Concatenate all dataframes
        merged = pd.concat(dfs, ignore_index=True)
        
        # Remove duplicates (in case of overlapping date ranges)
        if 'date_start' in merged.columns and 'campaign_id' in merged.columns:
            merged = merged.drop_duplicates(subset=['date_start', 'campaign_id'], keep='last')
        
        # Sort by date
        if 'date_start' in merged.columns:
            merged = merged.sort_values('date_start')
        
        self.data = merged
        return merged
    
    def get_summary_stats(self) -> Dict:
        """Get summary statistics of the dataset"""
        if self.data is None:
            return {}
        
        stats = {
            'total_rows': len(self.data),
            'date_range': None,
            'total_spend': None,
            'total_impressions': None,
            'total_clicks': None,
            'total_conversions': None,
            'campaigns_count': None,
            'available_metrics': [col for col in self.data.columns if col in self.COLUMN_MAPPINGS.keys()]
        }
        
        if 'date_start' in self.data.columns:
            stats['date_range'] = {
                'start': self.data['date_start'].min(),
                'end': self.data['date_start'].max()
            }
        
        if 'spend' in self.data.columns:
            stats['total_spend'] = self.data['spend'].sum()
        
        if 'impressions' in self.data.columns:
            stats['total_impressions'] = self.data['impressions'].sum()
        
        if 'link_clicks' in self.data.columns:
            stats['total_clicks'] = self.data['link_clicks'].sum()
        
        if 'conversions' in self.data.columns:
            stats['total_conversions'] = self.data['conversions'].sum()
        
        if 'campaign_name' in self.data.columns:
            stats['campaigns_count'] = self.data['campaign_name'].nunique()
        
        return stats
