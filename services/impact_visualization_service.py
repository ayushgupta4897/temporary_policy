import sys
from pathlib import Path
from typing import Dict, Optional

sys.path.append(str(Path(__file__).parent.parent))

from agents.impact_analysis.impact_visualization_agent import extract_impact_visualizations
from repositories.impact_analysis_repository import ImpactAnalysisRepository
from repositories.impact_visualization_repository import get_impact_visualization_repository


class ImpactVisualizationService:
    """Service for generating and caching impact analysis visualizations."""

    def __init__(self):
        self.analysis_repository = ImpactAnalysisRepository()
        self.visualization_repository = get_impact_visualization_repository()

    def get_or_generate_visualization(
        self,
        analysis_id: str,
        force_regenerate: bool = False
    ) -> Dict:
        """
        Get cached visualization or generate new one.

        Args:
            analysis_id: ID of the impact analysis
            force_regenerate: If True, regenerate even if cached version exists

        Returns:
            Dict with keys:
                - exists: bool
                - visualization_data: Dict or None
                - generated: bool (True if newly generated)
                - error: str or None

        Raises:
            ValueError: If analysis not found or not completed
        """
        # Check if analysis exists and is completed
        analysis = self.analysis_repository.get_by_id(analysis_id)
        if not analysis:
            return {
                'exists': False,
                'visualization_data': None,
                'generated': False,
                'error': 'Analysis not found'
            }

        if analysis.get('status') != 'completed':
            return {
                'exists': False,
                'visualization_data': None,
                'generated': False,
                'error': f"Analysis not completed (status: {analysis.get('status')})"
            }

        # Check for insufficient data
        impact_analysis = analysis.get('impact_analysis', '')
        citations = analysis.get('citations', [])

        if not impact_analysis or len(impact_analysis) < 100:
            return {
                'exists': False,
                'visualization_data': None,
                'generated': False,
                'error': 'Insufficient impact analysis content'
            }

        if len(citations) == 0:
            return {
                'exists': False,
                'visualization_data': None,
                'generated': False,
                'error': 'No citations available for visualization'
            }

        # Check cache unless force regenerate
        if not force_regenerate:
            cached = self.visualization_repository.get_by_analysis_id(analysis_id)
            if cached and cached.get('visualization_data'):
                print(f"✓ Using cached visualization for analysis {analysis_id}")
                return {
                    'exists': True,
                    'visualization_data': cached['visualization_data'],
                    'generated': False,
                    'error': None
                }

        # Generate new visualization
        print(f"📊 Generating visualization for analysis {analysis_id}...")

        try:
            viz_data = extract_impact_visualizations(
                markdown_content=impact_analysis,
                citations=citations
            )

            # Cache the result
            self.visualization_repository.create(analysis_id, viz_data)

            print(f"✓ Visualization generated and cached for analysis {analysis_id}")

            return {
                'exists': True,
                'visualization_data': viz_data,
                'generated': True,
                'error': None
            }

        except Exception as e:
            print(f"✗ Error generating visualization: {e}")
            return {
                'exists': False,
                'visualization_data': None,
                'generated': False,
                'error': f'Visualization generation failed: {str(e)}'
            }

    def check_visualization_status(self, analysis_id: str) -> Dict:
        """
        Check if visualization can be generated and if it exists.

        Args:
            analysis_id: ID of the impact analysis

        Returns:
            Dict with keys:
                - exists: bool (cached visualization exists)
                - available: bool (visualization can be generated)
                - reason: str or None (why not available)
        """
        # Check if analysis exists
        analysis = self.analysis_repository.get_by_id(analysis_id)
        if not analysis:
            return {
                'exists': False,
                'available': False,
                'reason': 'Analysis not found'
            }

        # Check if analysis is completed
        if analysis.get('status') != 'completed':
            return {
                'exists': False,
                'available': False,
                'reason': f"Analysis not completed (status: {analysis.get('status')})"
            }

        # Check for sufficient data
        impact_analysis = analysis.get('impact_analysis', '')
        citations = analysis.get('citations', [])

        if not impact_analysis or len(impact_analysis) < 100:
            return {
                'exists': False,
                'available': False,
                'reason': 'Insufficient impact analysis content'
            }

        if len(citations) == 0:
            return {
                'exists': False,
                'available': False,
                'reason': 'No citations available'
            }

        # Check if cached version exists
        exists = self.visualization_repository.exists(analysis_id)

        return {
            'exists': exists,
            'available': True,
            'reason': None
        }

    def delete_visualization(self, analysis_id: str) -> bool:
        """Delete cached visualization for an analysis."""
        return self.visualization_repository.delete(analysis_id)


# Singleton instance
impact_visualization_service = ImpactVisualizationService()
