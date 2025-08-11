/*! Client-side PDF export helper (html2pdf.js) */
(function(){
  // Load html2pdf.js from CDN if not present
  function loadScript(src) {
    return new Promise(function(resolve, reject){
      var s = document.createElement('script');
      s.src = src; s.async = true;
      s.onload = resolve; s.onerror = reject;
      document.head.appendChild(s);
    });
  }
  function ensureHtml2Pdf(){
    if (window.html2pdf) return Promise.resolve();
    return loadScript("https://cdn.jsdelivr.net/npm/html2pdf.js@0.10.1/dist/html2pdf.bundle.min.js");
  }
  // Export the given DOM element to PDF
  async function exportElementToPDF(el, filename){
    await ensureHtml2Pdf();
    var opt = {
      margin: [12,12,12,12],
      filename: filename || ('export-' + Date.now() + '.pdf'),
      image: { type: 'jpeg', quality: 0.96 },
      html2canvas: {
        scale: window.devicePixelRatio > 1 ? 2 : 1,
        useCORS: true,
        allowTaint: false
      },
      jsPDF: { unit: 'pt', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['css', 'legacy'] }
    };
    return window.html2pdf().set(opt).from(el).save();
  }
  // Public API: enableClientPDF({selector, buttonText})
  window.enableClientPDF = function(options){
    options = options || {};
    var targetSel = options.selector || '#app, main, .quesContent, body';
    var btnText = options.buttonText || '导出为 PDF';
    var target = document.querySelector(targetSel);
    if(!target){ console.warn('PDF export: target not found:', targetSel); target = document.body; }

    // Create a floating button
    var btn = document.createElement('button');
    btn.textContent = btnText;
    btn.style.position = 'fixed';
    btn.style.right = '16px';
    btn.style.bottom = '16px';
    btn.style.zIndex = '2147483647';
    btn.style.padding = '10px 14px';
    btn.style.borderRadius = '10px';
    btn.style.border = '1px solid #e5e7eb';
    btn.style.background = '#111827';
    btn.style.color = '#fff';
    btn.style.cursor = 'pointer';
    btn.style.boxShadow = '0 6px 20px rgba(0,0,0,.18)';
    btn.addEventListener('click', function(){
      exportElementToPDF(target, document.title.replace(/\s+/g,'_') + '.pdf');
    });
    document.body.appendChild(btn);
  };

  // Auto-enable with defaults after DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function(){ window.enableClientPDF({}); });
  } else {
    window.enableClientPDF({});
  }
})();
