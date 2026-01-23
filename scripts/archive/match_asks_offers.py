#!/usr/bin/env python3
"""
Find potential matches between asks and offers.
"""

import yaml
import glob
import re
from pathlib import Path
from difflib import SequenceMatcher
from datetime import datetime

def extract_frontmatter(filepath):
    """Extract YAML frontmatter from markdown file."""
    with open(filepath, 'r') as f:
        content = f.read()
    
    match = re.match(r'^---\s*\n(.*?)\n---\s*\n', content, re.DOTALL)
    if match:
        return yaml.safe_load(match.group(1))
    return None

def load_asks():
    """Load all open asks."""
    asks = []
    for filepath in glob.glob('data/asks-offers/asks/*.md'):
        if '_TEMPLATE' in filepath:
            continue
        data = extract_frontmatter(filepath)
        if data and data.get('status') == 'open':
            data['_filepath'] = filepath
            asks.append(data)
    return asks

def load_offers():
    """Load all available offers."""
    offers = []
    for filepath in glob.glob('data/asks-offers/offers/*.md'):
        if '_TEMPLATE' in filepath:
            continue
        data = extract_frontmatter(filepath)
        if data and data.get('status') == 'available':
            data['_filepath'] = filepath
            offers.append(data)
    return offers

def calculate_match_score(ask, offer):
    """Calculate match score between ask and offer."""
    score = 0
    
    # Tag overlap (most important)
    ask_tags = set(ask.get('tags', []))
    offer_tags = set(offer.get('tags', []))
    tag_overlap = len(ask_tags & offer_tags)
    score += tag_overlap * 10
    
    # Category match
    if ask.get('category') == offer.get('category'):
        score += 5
    
    # Location match
    ask_location = ask.get('location', '')
    offer_location = offer.get('location', '')
    
    if ask_location and offer_location:
        if ask_location == offer_location:
            score += 3
        # Check for "Any" in offer location
        if 'any' in offer_location.lower():
            score += 2
    
    # Neighborhood overlap
    ask_neighborhoods = set(ask.get('neighborhoods', []))
    offer_neighborhoods = set(offer.get('neighborhoods', []))
    neighborhood_overlap = len(ask_neighborhoods & offer_neighborhoods)
    score += neighborhood_overlap * 2
    
    # Text similarity (titles)
    title_similarity = SequenceMatcher(
        None, 
        ask.get('title', '').lower(), 
        offer.get('title', '').lower()
    ).ratio()
    score += title_similarity * 5
    
    return score

def find_matches(min_score=5):
    """Find all potential matches."""
    asks = load_asks()
    offers = load_offers()
    
    matches = []
    
    for ask in asks:
        for offer in offers:
            score = calculate_match_score(ask, offer)
            if score >= min_score:
                matches.append({
                    'ask': ask,
                    'offer': offer,
                    'score': score
                })
    
    return sorted(matches, key=lambda x: x['score'], reverse=True)

def format_match_report(matches):
    """Format matches as a readable report."""
    if not matches:
        return "No matches found."
    
    report = []
    report.append("=" * 70)
    report.append("NOTF ASK/OFFER MATCHING REPORT")
    report.append(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M')}")
    report.append("=" * 70)
    report.append("")
    report.append(f"Found {len(matches)} potential match(es):\n")
    
    for i, match in enumerate(matches, 1):
        ask = match['ask']
        offer = match['offer']
        score = match['score']
        
        report.append(f"{i}. Match Score: {score}")
        report.append("-" * 70)
        report.append(f"ASK: {ask['title']}")
        report.append(f"  Posted by: {ask.get('posted_by', 'Unknown')}")
        report.append(f"  Location: {ask.get('location', 'Not specified')}")
        report.append(f"  Category: {ask.get('category', 'Not specified')}")
        report.append(f"  Tags: {', '.join(ask.get('tags', []))}")
        report.append("")
        report.append(f"OFFER: {offer['title']}")
        report.append(f"  Posted by: {offer.get('posted_by', 'Unknown')}")
        report.append(f"  Location: {offer.get('location', 'Not specified')}")
        report.append(f"  Category: {offer.get('category', 'Not specified')}")
        report.append(f"  Tags: {', '.join(offer.get('tags', []))}")
        report.append("")
        report.append(f"Why this matches:")
        
        # Explain the match
        ask_tags = set(ask.get('tags', []))
        offer_tags = set(offer.get('tags', []))
        common_tags = ask_tags & offer_tags
        if common_tags:
            report.append(f"  - Shared tags: {', '.join(common_tags)}")
        
        if ask.get('location') == offer.get('location'):
            report.append(f"  - Same location: {ask.get('location')}")
        
        if ask.get('category') == offer.get('category'):
            report.append(f"  - Same category: {ask.get('category')}")
        
        report.append("")
        report.append("=" * 70)
        report.append("")
    
    return "\n".join(report)

def main():
    print("Searching for matches...")
    matches = find_matches(min_score=5)
    report = format_match_report(matches)
    print(report)
    
    # Save report
    report_file = f"matches_{datetime.now().strftime('%Y-%m-%d')}.txt"
    with open(report_file, 'w') as f:
        f.write(report)
    print(f"\nReport saved to: {report_file}")

if __name__ == '__main__':
    main()
