export const generatePDF = async (markdown: string, title: string, query: string): Promise<void> => {
  // Only import html2pdf on client side
  if (typeof window === 'undefined') {
    console.error('PDF generation is only available in the browser');
    return;
  }

  // Dynamic import to avoid SSR issues
  const html2pdf = (await import('html2pdf.js')).default;

  // Get the already-rendered content from the page
  const existingContent = document.getElementById('report-content');
  if (!existingContent) {
    console.error('No report content found on page');
    alert('Unable to find report content. Please try again.');
    return;
  }

  // Clone the rendered content
  const contentClone = existingContent.cloneNode(true) as HTMLElement;

  // Apply all computed styles as inline styles
  const applyInlineStyles = (originalEl: HTMLElement, clonedEl: HTMLElement) => {
    const computed = window.getComputedStyle(originalEl);

    // Copy all critical CSS properties as inline styles
    const criticalProps = [
      'color', 'backgroundColor', 'fontSize', 'fontWeight', 'fontFamily',
      'lineHeight', 'margin', 'marginTop', 'marginBottom', 'marginLeft', 'marginRight',
      'padding', 'paddingTop', 'paddingBottom', 'paddingLeft', 'paddingRight',
      'display', 'textAlign', 'borderColor', 'borderWidth', 'borderStyle',
      'width', 'height', 'maxWidth', 'minWidth'
    ];

    criticalProps.forEach(prop => {
      const value = computed.getPropertyValue(prop);
      if (value && value !== 'auto' && value !== 'none') {
        (clonedEl.style as any)[prop] = value;
      }
    });

    // Recursively apply to all children
    const originalChildren = originalEl.children;
    const clonedChildren = clonedEl.children;

    for (let i = 0; i < originalChildren.length; i++) {
      if (originalChildren[i] instanceof HTMLElement && clonedChildren[i] instanceof HTMLElement) {
        applyInlineStyles(originalChildren[i] as HTMLElement, clonedChildren[i] as HTMLElement);
      }
    }
  };

  applyInlineStyles(existingContent, contentClone);
  
  // Create a wrapper container with proper styling
  const container = document.createElement('div');
  container.style.backgroundColor = 'white';
  container.style.padding = '40px';
  container.style.fontFamily = 'Arial, Helvetica, sans-serif';
  container.style.color = '#1f2937';
  
  // Add header
  const header = document.createElement('div');
  header.style.marginBottom = '30px';
  header.style.paddingBottom = '20px';
  header.style.borderBottom = '2px solid #7a1818';
  
  const titleElement = document.createElement('h1');
  titleElement.textContent = title;
  titleElement.style.fontSize = '24px';
  titleElement.style.fontWeight = 'bold';
  titleElement.style.color = '#7a1818';
  titleElement.style.marginBottom = '10px';
  
  const queryElement = document.createElement('p');
  queryElement.style.fontSize = '12px';
  queryElement.style.color = '#6b7280';
  queryElement.style.marginBottom = '5px';
  queryElement.innerHTML = `<strong>Query:</strong> ${query}`;
  
  const dateElement = document.createElement('p');
  dateElement.style.fontSize = '12px';
  dateElement.style.color = '#6b7280';
  dateElement.innerHTML = `<strong>Generated:</strong> ${new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })}`;
  
  header.appendChild(titleElement);
  header.appendChild(queryElement);
  header.appendChild(dateElement);
  
  // Append header and cloned content
  container.appendChild(header);
  container.appendChild(contentClone);
  
  // Check if this is a large document (Research Analysis)
  const isLargeDocument = markdown && markdown.length > 100000;

  // PDF generation options - optimize for large documents
  const options = {
    margin: [10, 10, 10, 10],
    filename: `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${Date.now()}.pdf`,
    image: {
      type: 'jpeg' as const,
      quality: isLargeDocument ? 0.85 : 0.98  // Lower quality for large docs
    },
    html2canvas: {
      scale: isLargeDocument ? 1 : 2,  // Lower scale for large docs to reduce memory
      useCORS: true,
      letterRendering: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: isLargeDocument ? 1024 : undefined,  // Fixed width for consistency
      imageTimeout: 15000,  // Increase timeout for images
      removeContainer: true
    },
    jsPDF: {
      unit: 'mm' as const,
      format: 'a4',
      orientation: 'portrait' as const,
      compress: true  // Enable compression for large PDFs
    },
    pagebreak: {
      mode: ['avoid-all', 'css', 'legacy']
    }
  };

  // For very large documents, use direct jsPDF text rendering instead of html2canvas
  if (isLargeDocument) {
    try {
      const { default: jsPDF } = await import('jspdf');
      const doc = new jsPDF({
        unit: 'mm',
        format: 'a4',
        orientation: 'portrait'
      });

      // Extract plain text content
      const textContent = contentClone.textContent || '';
      const lines = textContent.split('\n');

      let y = 20;
      const pageHeight = 280;
      const lineHeight = 7;
      const margin = 15;
      const maxWidth = 180;

      // Add title
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text(title, margin, y);
      y += 15;

      // Add query
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Query: ${query}`, margin, y);
      y += 10;

      // Add date
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, margin, y);
      y += 15;

      // Add content
      doc.setFontSize(10);

      for (const line of lines) {
        if (!line.trim()) continue;

        const wrappedLines = doc.splitTextToSize(line, maxWidth);

        for (const wrappedLine of wrappedLines) {
          if (y > pageHeight) {
            doc.addPage();
            y = 20;
          }
          doc.text(wrappedLine, margin, y);
          y += lineHeight;
        }
      }

      doc.save(`${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${Date.now()}.pdf`);
      return;
    } catch (error) {
      console.error('Direct PDF generation failed:', error);
      alert('Failed to generate PDF for large document.');
      return;
    }
  }

  // Generate and download PDF using html2pdf for normal-sized documents
  try {
    await html2pdf()
      .from(container)
      .set(options)
      .save();
  } catch (error) {
    console.error('PDF generation failed:', error);
    alert('Failed to generate PDF. Please try again.');
  }
};