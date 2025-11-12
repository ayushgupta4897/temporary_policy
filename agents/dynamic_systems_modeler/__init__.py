"""
Dynamic Systems Modeler (DSM) - Intervention-Based Scenario Analysis
Strategy& PWC - New Product Line

Core Features:
- User-defined taxonomy (10 parents → LLM-generated children)
- Base graph construction with evidence citations
- Multiple intervention scenario modeling
- Delta analysis and comparison views
"""

from .taxonomy_generator import TaxonomyGenerator
from .graph_builder import DynamicGraphBuilder
from .intervention_engine import InterventionEngine
from .delta_calculator import DeltaCalculator

__all__ = [
    'TaxonomyGenerator',
    'DynamicGraphBuilder',
    'InterventionEngine',
    'DeltaCalculator'
]
