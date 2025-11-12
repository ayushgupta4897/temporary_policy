'use client';

import { useState, useEffect } from 'react';
import MarkdownPreview from '@uiw/react-markdown-preview';
import { Query, ReportContent, ReportInfo } from '@/types';
import { apiService } from '@/services/api';
import { generatePDF } from '../utils/pdfGenerator';
import {
  ClipboardIcon,
  DocumentIcon,
  SearchIcon,
  ChartBarIcon,
  ChartPieIcon,
  BeakerIcon,
  TrendingUpIcon,
  BookOpenIcon,
  DownloadIcon,
  ExclamationIcon,
  PolicyIcon,
  ProcessingIcon
} from '@/components/Icons';
import { ReportSkeleton } from '@/components/LoadingSkeleton';
import FloatingPolicyChat from '@/components/FloatingPolicyChat';

interface ReportsViewerProps {
  query: Query;
}

const REPORT_TYPES = [
  { key: 'executive_summary', label: 'Executive Summary', IconComponent: ClipboardIcon, priority: 1 },
  { key: 'policy_report', label: 'Policy Document', IconComponent: DocumentIcon, priority: 2 },
  { key: 'research_report', label: 'Research Analysis', IconComponent: SearchIcon, priority: 3 },
  { key: 'analytics_report', label: 'Data Analytics', IconComponent: ChartBarIcon, priority: 4 },
  { key: 'simulation_report', label: 'Scenario Analysis', IconComponent: BeakerIcon, priority: 5 },
  { key: 'strategy_brief', label: 'Strategy Brief', IconComponent: TrendingUpIcon, priority: 6 },
  { key: 'policy_dossier', label: 'Full Dossier', IconComponent: BookOpenIcon, priority: 7 },
];

export default function ReportsViewer({ query }: ReportsViewerProps) {
  const [activeReport, setActiveReport] = useState<string>('');
  const [reportContent, setReportContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [availableReports, setAvailableReports] = useState<ReportInfo[]>([]);
  const [isLoadingReports, setIsLoadingReports] = useState(true);

  useEffect(() => {
    fetchAvailableReports();
  }, [query.queryId, query.status]);

  useEffect(() => {
    if (availableReports.length > 0 && !activeReport) {
      const availableKeys = availableReports.map(r => r.name.replace('.md', ''));
      const defaultReport = REPORT_TYPES
        .filter(type => availableKeys.includes(type.key))
        .sort((a, b) => a.priority - b.priority)[0]?.key;
      
      if (defaultReport) setActiveReport(defaultReport);
    }
  }, [availableReports, activeReport]);

  useEffect(() => {
    if (activeReport) loadReportContent(activeReport);
  }, [activeReport]);

  const fetchAvailableReports = async () => {
    if (query.status !== 'done') {
      setIsLoadingReports(false);
      return;
    }

    try {
      const reports = await apiService.listReports(query.queryId);
      setAvailableReports(reports);
    } catch (error) {
      console.error('Failed to fetch reports:', error);
      setAvailableReports([]);
    } finally {
      setIsLoadingReports(false);
    }
  };

  const loadReportContent = async (reportType: string) => {
    setIsLoading(true);
    try {
      const response = await apiService.getReportContent(query.queryId, `${reportType}.md`);
      setReportContent(response.content);
    } catch (error) {
      console.error('Failed to load report:', error);
      setReportContent('Unable to load report content. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const downloadAsPDF = async () => {
    if (!reportContent) {
      alert('No content available to generate PDF.');
      return;
    }

    setIsGeneratingPDF(true);
    try {
      const reportType = REPORT_TYPES.find(t => t.key === activeReport);
      const title = reportType?.label || 'Report';
      
      await generatePDF(reportContent, title, query.query);
    } catch (error) {
      console.error('PDF generation failed:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const availableReportTypes = REPORT_TYPES.filter(type =>
    availableReports.some(report => report.name === `${type.key}.md`)
  ).sort((a, b) => a.priority - b.priority);

  // Check if analytics visualization is available (full mode + analytics report exists)
  const hasAnalyticsVisualization = query.analysisMode === 'full' &&
    availableReports.some(report => report.name === 'analytics_report.md');

  if (isLoadingReports) {
    return (
      <div className="page-container section-spacing">
        <div className="flex items-center justify-center min-h-64">
          <div className="text-center">
            <div className="loading-spinner mx-auto mb-4"></div>
            <h3 className="font-serif text-xl text-neutral-900 mb-2">Loading Reports</h3>
            <p className="text-neutral-600">Fetching available reports...</p>
          </div>
        </div>
      </div>
    );
  }

  if (availableReportTypes.length === 0) {
    return (
      <div className="page-container section-spacing">
        <div className="text-center bg-gradient-to-br from-dark-700 to-dark-800 rounded-lg border border-gradient-from/30 shadow-md p-12">
          <div className="w-16 h-16 bg-gradient-to-br from-gradient-from/20 to-gradient-via/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <PolicyIcon className="text-gray-300" size="xl" />
          </div>
          <h2 className="font-serif text-2xl text-gray-100 mb-3">No Reports Available</h2>
          <p className="text-gray-300 mb-4">
            Reports are still being processed or there was an error generating them.
          </p>
          {query.status !== 'done' && (
            <div className="status-processing">
              Status: {query.status}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="page-container section-spacing">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <h1 className="font-serif text-4xl text-gradient-from mb-2">Policy Bot Reports</h1>
            <p className="text-gray-300">
              Generated on {new Date(query.completedAt || query.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {hasAnalyticsVisualization && (
              <button
                onClick={() => window.open(`/analytics/${query.queryId}`, '_blank')}
                className="btn-primary group"
              >
                <ChartPieIcon className="mr-2 group-hover:scale-110 transition-transform" size="md" />
                View Analytics
              </button>
            )}
            <button
              onClick={downloadAsPDF}
              className="btn-secondary group"
              disabled={!reportContent || isLoading || isGeneratingPDF}
            >
              {isGeneratingPDF ? (
                <>
                  <ProcessingIcon className="mr-2" size="md" />
                  Generating PDF...
                </>
              ) : (
                <>
                  <DownloadIcon className="mr-2 group-hover:translate-y-0.5 transition-transform" size="md" />
                  Export PDF
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* AI Disclaimer */}
      <div className="bg-gradient-to-r from-dark-600/90 to-dark-700/90 p-6 mb-8 border-l-4 border-gradient-from rounded-lg backdrop-blur-sm">
        <div className="flex items-start gap-3">
          <ExclamationIcon className="text-gradient-from mt-0.5" size="md" />
          <div>
            <h3 className="font-serif text-lg text-gray-100 mb-2">AI-Generated Content Disclaimer</h3>
            <p className="text-sm text-gray-300 leading-relaxed">
              This document was generated by AI-powered analysis. It is intended as a decision-support tool and should not be considered a substitute for expert policy advice. All outputs should be reviewed and validated before use in official contexts.
            </p>
          </div>
        </div>
      </div>

      {/* Query Context */}
      <div className="bg-gradient-to-br from-dark-700/95 to-dark-800/95 p-6 mb-8 rounded-lg border border-gradient-via/30 backdrop-blur-sm">
        <h3 className="font-serif text-lg text-gray-100 mb-3">Original Query</h3>
        <p className="text-gray-300 leading-relaxed">
          {query.query}
        </p>
      </div>

      {/* Report Navigation */}
      <div className="bg-gradient-to-br from-dark-700 to-dark-900 rounded-lg border border-gradient-from/30 mb-8">
        <div className="border-b border-gradient-from/20 px-6 pt-6">
          <div className="flex overflow-x-auto pb-4 gap-1">
            {availableReportTypes.map((report) => {
              const Icon = report.IconComponent;
              return (
                <button
                  key={report.key}
                  onClick={() => setActiveReport(report.key)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200 group ${
                    activeReport === report.key
                      ? 'bg-gradient-to-r from-gradient-from to-gradient-via text-white shadow-sm'
                      : 'text-gray-400 hover:text-gray-100 hover:bg-dark-600/50'
                  }`}
                >
                  <Icon
                    className={activeReport === report.key ? 'text-white' : 'text-gray-500 group-hover:text-gray-300'}
                    size="sm"
                  />
                  <span>{report.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Report Content */}
        <div className="p-6">
          {isLoading ? (
            <ReportSkeleton />
          ) : (
            <div id="report-content" className="custom-scrollbar bg-gray-50 rounded-lg p-6">
              <style jsx global>{`
                #report-content h1,
                #report-content h2,
                #report-content h3,
                #report-content h4,
                #report-content h5,
                #report-content h6 {
                  color: #1f2937 !important;
                }
              `}</style>
              <MarkdownPreview
                source={reportContent}
                style={{
                  backgroundColor: '#f9fafb',
                  color: '#1f2937',
                  fontFamily: 'Arial, Helvetica, sans-serif',
                  fontSize: '16px',
                  lineHeight: '1.6',
                  padding: '20px'
                }}
                wrapperElement={{
                  'data-color-mode': 'light'
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Floating Chat */}
      <FloatingPolicyChat queryId={query.queryId} />
    </div>
  );
}
