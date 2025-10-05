from impact_analyzer import ImpactAnalyzer


def main():
    analyzer = ImpactAnalyzer(batch_size=10)
    
    query = "Impact of Person with disability Employment on GDP of UAE"
    
    results = analyzer.analyze_impact(query)
    
    analyzer.save_results(results)
    
    print(f"\nQuery: {results['query']}")
    print(f"Citations Found: {results['citations_count']}")
    print(f"Analysis Timestamp: {results['timestamp']}")
    
    if results['citations_count'] > 0:
        print("\nTop Citations:")
        for i, citation in enumerate(results['citations'][:5], 1):
            print(f"{i}. {citation.get('title', 'N/A')}")
            if citation.get('multiplier'):
                print(f"   Multiplier: {citation.get('multiplier')}")


if __name__ == "__main__":
    main()
