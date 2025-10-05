declare module 'html2pdf.js' {
  interface Html2PdfOptions {
    margin?: number | number[];
    filename?: string;
    image?: {
      type?: 'jpeg' | 'png' | 'webp';
      quality?: number;
    };
    html2canvas?: {
      scale?: number;
      useCORS?: boolean;
      letterRendering?: boolean;
      scrollY?: number;
      scrollX?: number;
      backgroundColor?: string;
      imageTimeout?: number;
      logging?: boolean;
      proxy?: string;
      removeContainer?: boolean;
      foreignObjectRendering?: boolean;
      width?: number;
      height?: number;
    };
    jsPDF?: {
      unit?: 'pt' | 'mm' | 'cm' | 'in';
      format?: string | number[];
      orientation?: 'portrait' | 'landscape';
      compress?: boolean;
    };
    pagebreak?: {
      mode?: string | string[];
      before?: string | string[];
      after?: string | string[];
      avoid?: string | string[];
    };
    enableLinks?: boolean;
  }

  interface Html2Pdf {
    from(element: HTMLElement | string): Html2Pdf;
    set(options: Html2PdfOptions): Html2Pdf;
    save(filename?: string): Promise<void>;
    output(type: string, options?: any): Promise<any>;
    then(callback: (pdf: any) => void): Html2Pdf;
    catch(callback: (error: any) => void): Html2Pdf;
    toPdf(): Html2Pdf;
    get(type: string): Promise<any>;
  }

  function html2pdf(): Html2Pdf;
  function html2pdf(element: HTMLElement, options?: Html2PdfOptions): Promise<void>;

  export = html2pdf;
}
