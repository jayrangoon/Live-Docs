"use client";

import React, { useEffect } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $generateHtmlFromNodes } from "@lexical/html";

type DownloadButtonProps = {
  documentTitle: string;
};

const DownloadButton = ({ documentTitle }: DownloadButtonProps) => {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    const handleDownloadEvent = (event: CustomEvent) => {
      const title = event.detail?.title || documentTitle;
      handleDownload(title);
    };

    window.addEventListener('downloadDocument' as any, handleDownloadEvent);

    return () => {
      window.removeEventListener('downloadDocument' as any, handleDownloadEvent);
    };
  }, [editor, documentTitle]);

  const handleDownload = async (title: string) => {
    try {
      editor.getEditorState().read(() => {
        // Generate HTML from Lexical nodes with all formatting preserved
        const htmlString = $generateHtmlFromNodes(editor);

        // Create a complete Word-compatible HTML document with proper styling
        const htmlContent = `
<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="UTF-8">
  <meta name="ProgId" content="Word.Document">
  <meta name="Generator" content="Microsoft Word">
  <meta name="Originator" content="Microsoft Word">
  <title>${title}</title>
  <style>
    /* Word-compatible styles */
    body {
      font-family: 'Calibri', 'Arial', sans-serif;
      font-size: 11pt;
      line-height: 1.5;
      margin: 1in;
      background: white;
    }
    h1 {
      font-size: 24pt;
      font-weight: bold;
      margin-bottom: 12pt;
      color: #2e74b5;
    }
    h2 {
      font-size: 18pt;
      font-weight: bold;
      margin-top: 12pt;
      margin-bottom: 6pt;
      color: #2e74b5;
    }
    h3 {
      font-size: 14pt;
      font-weight: bold;
      margin-top: 10pt;
      margin-bottom: 4pt;
      color: #1f4d78;
    }
    p {
      margin: 0 0 10pt 0;
    }
    strong, b {
      font-weight: bold;
    }
    em, i {
      font-style: italic;
    }
    u {
      text-decoration: underline;
    }
    code {
      font-family: 'Courier New', monospace;
      background-color: #f5f5f5;
      padding: 2px 4px;
      border-radius: 3px;
    }
    pre {
      font-family: 'Courier New', monospace;
      background-color: #f5f5f5;
      padding: 10px;
      border-radius: 5px;
      overflow-x: auto;
    }
    ul, ol {
      margin: 0 0 10pt 20pt;
      padding-left: 20pt;
    }
    li {
      margin-bottom: 5pt;
    }
    a {
      color: #0563c1;
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <h1>${title}</h1>
  <div class="document-content">
    ${htmlString}
  </div>
</body>
</html>`;

        // Create blob with proper MIME type for Word
        const blob = new Blob(['\ufeff', htmlContent], { 
          type: 'application/msword' 
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${title || "document"}.doc`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      });
    } catch (error) {
      console.error("Error downloading document:", error);
      alert("Failed to download document. Please try again.");
    }
  };

  return null; // Hidden component, triggered by event
};

export default DownloadButton;

