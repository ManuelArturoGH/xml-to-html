'use client';

import { useState } from "react";
import QRCode from "qrcode";
// Nota: usamos html2pdf dinámicamente (se importa dentro de la función para evitar evaluación en servidor)

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type === "text/xml" || selectedFile.name.endsWith(".xml")) {
        setFile(selectedFile);
        setError("");
      } else {
        setError("Por favor selecciona un archivo XML válido");
        setFile(null);
      }
    }
  };

  const previewHTML = async () => {
    if (!file) {
      setError("Por favor selecciona un archivo XML");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const { htmlString, cssStyles } = await processXMLToHTML(file);

      // Crear ventana nueva con el HTML
      const previewWindow = window.open('', '_blank', 'width=800,height=600');
      if (previewWindow) {
        previewWindow.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <title>Preview CFDI</title>
            <style>${cssStyles}</style>
            <style>
              body { margin: 20px; font-family: Arial, sans-serif; background: #f5f5f5; }
              .container { background: white; padding: 20px; max-width: 210mm; margin: 0 auto; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
            </style>
          </head>
          <body>
            <div class="container">
              ${htmlString}
            </div>
          </body>
          </html>
        `);
        previewWindow.document.close();
      }
    } catch (err: unknown) {
      console.error(err);
      const message = err instanceof Error ? err.message : String(err);
      setError(message || 'Error al procesar el archivo XML.');
    } finally {
      setLoading(false);
    }
  };

  const processXMLToHTML = async (xmlFile: File) => {
    const xmlText = await xmlFile.text();

    // 1) Cargar el XSL oficial
    let xslText = "";
    try {
      const res = await fetch('/cfdi40.xsl');
      if (!res.ok) {
        setError('No se encontró el archivo /cfdi40.xsl en la carpeta public. Coloca el XSLT oficial del SAT en public/cfdi40.xsl.');
        setLoading(false);
        throw new Error('XSL no encontrado');
      }
      xslText = await res.text();
    } catch {
      setError('No se encontró el archivo /cfdi40.xsl en la carpeta public. Coloca el XSLT oficial del SAT en public/cfdi40.xsl.');
      setLoading(false);
      throw new Error('XSL no encontrado');
    }

    // 2) Transformar XML a HTML
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'application/xml');
    const xslDoc = parser.parseFromString(xslText, 'application/xml');

    if (xmlDoc.getElementsByTagName('parsererror').length > 0) {
      setError('El XML no es válido');
      setLoading(false);
      throw new Error('XML inválido');
    }

    // Debug: mostrar estructura del XML
    console.log('=== DEBUG: Estructura del XML ===');
    const complemento = xmlDoc.getElementsByTagNameNS('http://www.sat.gob.mx/cfd/4', 'Complemento')[0]
                     || xmlDoc.getElementsByTagName('cfdi:Complemento')[0]
                     || xmlDoc.getElementsByTagName('Complemento')[0];

    if (complemento) {
      console.log('Complemento encontrado:', complemento);
      console.log('Hijos del Complemento:', complemento.children);
      for (let i = 0; i < complemento.children.length; i++) {
        const child = complemento.children[i];
        console.log(`  - ${i}: ${child.tagName} / ${child.localName}`, child);
      }
    } else {
      console.warn('No se encontró el nodo Complemento');
    }

    // Buscar TimbreFiscalDigital de todas las formas posibles
    const timbreNS = xmlDoc.getElementsByTagNameNS('http://www.sat.gob.mx/TimbreFiscalDigital', 'TimbreFiscalDigital')[0];
    const timbrePrefix = xmlDoc.getElementsByTagName('tfd:TimbreFiscalDigital')[0];
    const timbreLocal = Array.from(xmlDoc.getElementsByTagName('*')).find(el => el.localName === 'TimbreFiscalDigital');

    console.log('TimbreFiscalDigital (namespace):', timbreNS);
    console.log('TimbreFiscalDigital (prefix):', timbrePrefix);
    console.log('TimbreFiscalDigital (localName):', timbreLocal);

    const timbreElement = timbreNS || timbrePrefix || timbreLocal;
    if (timbreElement) {
      console.log('Timbre encontrado, atributos:');
      for (let i = 0; i < timbreElement.attributes.length; i++) {
        const attr = timbreElement.attributes[i];
        console.log(`  ${attr.name}: ${attr.value.substring(0, 50)}...`);
      }
    } else {
      console.warn('⚠️ NO SE ENCONTRÓ EL TIMBRE FISCAL DIGITAL');
    }

    // Verificar si hay errores en el XSL
    if (xslDoc.getElementsByTagName('parsererror').length > 0) {
      console.error('Error parseando XSL:', xslDoc.getElementsByTagName('parsererror')[0].textContent);
      throw new Error('El archivo XSL no es válido');
    }

    const xsltProcessor = new XSLTProcessor();
    xsltProcessor.importStylesheet(xslDoc);

    // Intentar transformar
    const resultDoc = xsltProcessor.transformToDocument(xmlDoc);

    console.log('ResultDoc:', resultDoc);

    if (!resultDoc) {
      console.error('La transformación XSLT falló. ResultDoc es null');
      throw new Error('Error en la transformación XSLT. El XSL puede no ser compatible.');
    }

    // Extraer estilos
    const styleElements = resultDoc.getElementsByTagName('style');
    let cssStyles = '';
    for (let i = 0; i < styleElements.length; i++) {
      cssStyles += styleElements[i].textContent || '';
    }

    console.log('CSS extraído, longitud:', cssStyles.length);

    // Extraer contenido del body
    const bodyElements = resultDoc.getElementsByTagName('body');
    let bodyContent = '';
    if (bodyElements.length > 0) {
      const serializer = new XMLSerializer();
      bodyContent = serializer.serializeToString(bodyElements[0]);
      bodyContent = bodyContent.replace(/<\/?body[^>]*>/gi, '');
    } else {
      console.warn('No se encontró elemento body en el resultado');
      // Si no hay body, intentar serializar todo el documento
      const serializer = new XMLSerializer();
      bodyContent = serializer.serializeToString(resultDoc);
    }

    console.log('Body content extraído, longitud:', bodyContent.length);

    // 3) Generar QR
    const nsResolver = xmlDoc.createNSResolver(xmlDoc.documentElement);
    const timbre = xmlDoc.evaluate(
      "//*[local-name()='TimbreFiscalDigital']",
      xmlDoc,
      nsResolver,
      XPathResult.FIRST_ORDERED_NODE_TYPE,
      null
    ).singleNodeValue as Element | null;

    const emisor = xmlDoc.evaluate("//*[local-name()='Emisor']", xmlDoc, nsResolver, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue as Element | null;
    const receptor = xmlDoc.evaluate("//*[local-name()='Receptor']", xmlDoc, nsResolver, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue as Element | null;

    const uuid = timbre?.getAttribute('UUID') || '';
    const rfcEmisor = emisor?.getAttribute('Rfc') || emisor?.getAttribute('RFC') || '';
    const rfcReceptor = receptor?.getAttribute('Rfc') || receptor?.getAttribute('RFC') || '';

    const comprobante = xmlDoc.documentElement;
    const totalAttr = comprobante.getAttribute('Total') || comprobante.getAttribute('total') || '';
    const totalNumber = parseFloat(totalAttr || '0') || 0;
    const totalStr = totalNumber.toFixed(6);

    const selloCFD = timbre ? (timbre.getAttribute('SelloCFD') || '') : '';
    const feParam = selloCFD ? selloCFD.slice(-8) : '';

    const verificationUrl = `https://verificacfdi.facturaelectronica.sat.gob.mx/default.aspx?id=${encodeURIComponent(uuid)}&re=${encodeURIComponent(rfcEmisor)}&rr=${encodeURIComponent(rfcReceptor)}&tt=${encodeURIComponent(totalStr)}&fe=${encodeURIComponent(feParam)}`;

    const qrDataUrl = await QRCode.toDataURL(verificationUrl, { margin: 1, scale: 6 });

    const fechaTimbrado = timbre?.getAttribute('FechaTimbrado') || '';
    const noCertSAT = timbre?.getAttribute('NoCertificadoSAT') || '';

    const qrSection = `
      <div style="margin-top:20px; padding:15px; border:1px solid #ccc; display:flex; gap:15px; align-items:flex-start; page-break-inside:avoid; background:white;">
        <img src="${qrDataUrl}" style="width:110px; height:110px; flex-shrink:0;" alt="QR Code" />
        <div style="font-size:11px; color:#222; line-height:1.6;">
          <strong style="font-size:12px;">Timbre Fiscal Digital</strong><br/>
          <strong>UUID:</strong> ${uuid}<br/>
          <strong>Fecha de Timbrado:</strong> ${fechaTimbrado}<br/>
          <strong>No. Certificado SAT:</strong> ${noCertSAT}<br/>
          <small style="color:#666;">Este código QR contiene la URL de verificación en el portal del SAT</small>
        </div>
      </div>
    `;

    const htmlString = bodyContent + qrSection;

    return { htmlString, cssStyles, qrDataUrl, uuid };
  };



  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 text-gray-900 dark:text-white">
            Convertidor XML a PDF
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Convierte tus facturas CFDI 4.0 a formato PDF de manera rápida y sencilla
          </p>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-700">
          {/* Upload Area */}
          <div className="mb-6">
            <label
              htmlFor="file-upload"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3"
            >
              Selecciona tu archivo XML
            </label>
            <div className="flex items-center justify-center w-full">
              <label
                htmlFor="file-upload"
                className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-xl cursor-pointer bg-gray-50 dark:bg-gray-900 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <svg
                    className="w-12 h-12 mb-3 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                  <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                    <span className="font-semibold">Click para subir</span> o arrastra el archivo
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Archivo XML (CFDI 4.0)
                  </p>
                </div>
                <input
                  id="file-upload"
                  type="file"
                  className="hidden"
                  accept=".xml,text/xml"
                  onChange={handleFileChange}
                />
              </label>
            </div>
          </div>

          {/* Selected File */}
          {file && (
            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-300">
                <span className="font-medium">Archivo seleccionado:</span> {file.name}
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-800 dark:text-red-300">
                {error}
              </p>
            </div>
          )}

          {/* Preview Button */}
          <button
            onClick={previewHTML}
            disabled={!file || loading}
            className="w-full py-3 px-6 text-white font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200 shadow-lg hover:shadow-xl"
          >
            {loading ? "Procesando..." : "👁️ Previsualizar HTML"}
          </button>
        </div>

        {/* Info Footer */}
        <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>Tus archivos se procesan de forma local en tu navegador.</p>
          <p>No se envían datos a ningún servidor.</p>
        </div>
      </div>
    </div>
  );
}







