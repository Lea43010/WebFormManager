/* 
 * Markdown-PDF Header Script
 * Dies wird verwendet, um Header und Footer in den PDF-Dateien zu erstellen
 */

exports.header = {
  height: '2cm',
  contents: function(pageNum, numPages) {
    if (pageNum === 1) {
      // Erste Seite hat keinen Header
      return '';
    }
    return `
      <div style="text-align: center; font-size: 10pt; color: #666; border-bottom: 1px solid #ddd; padding-bottom: 5px; width: 100%;">
        <div style="float: left;">Bau-Structura Benutzerhandbuch</div>
        <div style="float: right;">Seite ${pageNum} von ${numPages}</div>
        <div style="clear: both;"></div>
      </div>
    `;
  }
};

exports.footer = {
  height: '1cm',
  contents: function(pageNum, numPages) {
    const today = new Date();
    const date = today.toLocaleDateString('de-DE', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    
    return `
      <div style="text-align: center; font-size: 8pt; color: #888;">
        <p>© ${today.getFullYear()} Bau-Structura GmbH. Alle Rechte vorbehalten.</p>
        <p>Erstellt am ${date}</p>
      </div>
    `;
  }
};