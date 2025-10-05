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
  
  // PDF generation options
  const options = {
    margin: [10, 10, 10, 10],
    filename: `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${Date.now()}.pdf`,
    image: { 
      type: 'jpeg' as const, 
      quality: 0.98 
    },
    html2canvas: { 
      scale: 2,
      useCORS: true,
      letterRendering: true,
      logging: false,
      backgroundColor: '#ffffff'
    },
    jsPDF: { 
      unit: 'mm' as const, 
      format: 'a4', 
      orientation: 'portrait' as const
    },
    pagebreak: { 
      mode: ['avoid-all', 'css', 'legacy']
    }
  };
  
  // Generate and download PDF
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