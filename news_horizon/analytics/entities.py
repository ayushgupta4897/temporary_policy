from typing import Dict, List, Set
import re
from collections import Counter, defaultdict
import networkx as nx


class EntityAnalyzer:
    def __init__(self):
        self.country_patterns = self._build_country_patterns()
        self.org_indicators = ['Inc', 'Corp', 'Ltd', 'LLC', 'Group', 'Company', 'Foundation']

    def analyze(self, articles: Dict[str, Dict]) -> Dict:
        all_entities = {
            'countries': Counter(),
            'organizations': Counter(),
            'topics': Counter()
        }

        cooccurrence = defaultdict(lambda: defaultdict(int))

        for article in articles.values():
            entities_in_article = self._extract_entities(article)

            for etype, elist in entities_in_article.items():
                all_entities[etype].update(elist)

            all_ents = []
            for elist in entities_in_article.values():
                all_ents.extend(elist)

            for i, ent1 in enumerate(all_ents):
                for ent2 in all_ents[i+1:]:
                    if ent1 != ent2:
                        pair = tuple(sorted([ent1, ent2]))
                        cooccurrence[pair[0]][pair[1]] += 1

        graph_data = self._build_network_graph(all_entities, cooccurrence)

        return {
            'top_countries': [
                {'name': country, 'count': count}
                for country, count in all_entities['countries'].most_common(15)
            ],
            'top_organizations': [
                {'name': org, 'count': count}
                for org, count in all_entities['organizations'].most_common(15)
            ],
            'top_topics': [
                {'name': topic, 'count': count}
                for topic, count in all_entities['topics'].most_common(20)
            ],
            'network_graph': graph_data,
            'total_unique_entities': len(all_entities['countries']) + len(all_entities['organizations']) + len(all_entities['topics'])
        }

    def _extract_entities(self, article: Dict) -> Dict[str, List[str]]:
        entities = {
            'countries': [],
            'organizations': [],
            'topics': []
        }

        text = article.get('full_text', '')
        citation = article.get('original_citation', {})

        country = citation.get('country')
        if country:
            if isinstance(country, list):
                entities['countries'].extend(country)
            else:
                entities['countries'].append(country)

        topics = citation.get('topics', [])
        if topics:
            entities['topics'].extend(topics)

        for country_name in self.country_patterns:
            if re.search(rf'\b{re.escape(country_name)}\b', text, re.IGNORECASE):
                entities['countries'].append(country_name)

        orgs = self._extract_organizations(text)
        entities['organizations'].extend(orgs)

        return entities

    def _extract_organizations(self, text: str) -> List[str]:
        orgs = []
        words = text.split()

        for i, word in enumerate(words):
            if any(indicator in word for indicator in self.org_indicators):
                if i > 0:
                    org_name = ' '.join(words[max(0, i-2):i+1])
                    org_name = re.sub(r'[^\w\s]', '', org_name).strip()
                    if len(org_name) > 3:
                        orgs.append(org_name)

        return orgs[:10]

    def _build_network_graph(self, all_entities: Dict, cooccurrence: Dict) -> Dict:
        G = nx.Graph()

        for etype, counter in all_entities.items():
            for entity, count in counter.most_common(20):
                G.add_node(entity, type=etype, weight=count)

        edge_count = 0
        for ent1, connections in cooccurrence.items():
            for ent2, weight in connections.items():
                if weight >= 2 and G.has_node(ent1) and G.has_node(ent2):
                    G.add_edge(ent1, ent2, weight=weight)
                    edge_count += 1
                    if edge_count >= 50:
                        break
            if edge_count >= 50:
                break

        centrality = nx.degree_centrality(G) if G.number_of_nodes() > 0 else {}

        nodes = [
            {
                'id': node,
                'type': G.nodes[node].get('type', 'unknown'),
                'weight': G.nodes[node].get('weight', 1),
                'centrality': float(centrality.get(node, 0))
            }
            for node in G.nodes()
        ]

        edges = [
            {
                'source': source,
                'target': target,
                'weight': G[source][target].get('weight', 1)
            }
            for source, target in G.edges()
        ]

        return {
            'nodes': nodes[:30],
            'edges': edges[:50],
            'node_count': len(nodes),
            'edge_count': len(edges)
        }

    def _build_country_patterns(self) -> Set[str]:
        return {
            'United States', 'USA', 'China', 'India', 'Japan', 'Germany', 'United Kingdom', 'UK',
            'France', 'Brazil', 'Italy', 'Canada', 'Russia', 'South Korea', 'Spain', 'Australia',
            'Mexico', 'Indonesia', 'Netherlands', 'Saudi Arabia', 'Turkey', 'Switzerland',
            'Poland', 'Belgium', 'Sweden', 'Argentina', 'Norway', 'Austria', 'Israel', 'Singapore',
            'UAE', 'Ireland', 'Denmark', 'Pakistan', 'Bangladesh', 'Vietnam', 'Philippines',
            'Egypt', 'Nigeria', 'South Africa', 'Kenya', 'Ghana'
        }
