'use client';

import { useState } from "react";
import QRCode from "qrcode";
// Nota: usamos html2pdf dinámicamente (se importa dentro de la función para evitar evaluación en servidor)

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [htmlContent, setHtmlContent] = useState<string>("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type === "text/xml" || selectedFile.name.endsWith(".xml")) {
        setFile(selectedFile);
        setError("");
        setHtmlContent(""); // Limpiar preview anterior
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

  const convertToPDF = async () => {
    if (!file) {
      setError("Por favor selecciona un archivo XML");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const xmlText = await file.text();
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlText, 'application/xml');

      if (xmlDoc.getElementsByTagName('parsererror').length > 0) {
        throw new Error('El XML no es válido');
      }

      // Importar pdfmake dinámicamente
      const pdfMake = await import('pdfmake/build/pdfmake');
      const pdfFonts = await import('pdfmake/build/vfs_fonts');

      // Configurar las fuentes - la estructura varía según la versión
      if (pdfFonts.default && pdfFonts.default.pdfMake && pdfFonts.default.pdfMake.vfs) {
        pdfMake.default.vfs = pdfFonts.default.pdfMake.vfs;
      } else if (pdfFonts.default && pdfFonts.default.vfs) {
        pdfMake.default.vfs = pdfFonts.default.vfs;
      } else {
        pdfMake.default.vfs = pdfFonts.default;
      }

      // Extraer datos del CFDI
      const nsResolver = xmlDoc.createNSResolver(xmlDoc.documentElement);
      const comprobante = xmlDoc.documentElement;

      // Emisor
      const emisor = xmlDoc.evaluate("//*[local-name()='Emisor']", xmlDoc, nsResolver, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue as Element | null;
      const emisorNombre = emisor?.getAttribute('Nombre') || '';
      const emisorRfc = emisor?.getAttribute('Rfc') || '';
      const emisorRegimen = emisor?.getAttribute('RegimenFiscal') || '';

      // Receptor
      const receptor = xmlDoc.evaluate("//*[local-name()='Receptor']", xmlDoc, nsResolver, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue as Element | null;
      const receptorNombre = receptor?.getAttribute('Nombre') || '';
      const receptorRfc = receptor?.getAttribute('Rfc') || '';
      const receptorUsoCFDI = receptor?.getAttribute('UsoCFDI') || '';
      const receptorRegimen = receptor?.getAttribute('RegimenFiscalReceptor') || '';

      // Comprobante
      const serie = comprobante.getAttribute('Serie') || '';
      const folio = comprobante.getAttribute('Folio') || '';
      const fecha = comprobante.getAttribute('Fecha') || '';
      const tipoComprobante = comprobante.getAttribute('TipoDeComprobante') || '';
      const formaPago = comprobante.getAttribute('FormaPago') || '';
      const metodoPago = comprobante.getAttribute('MetodoPago') || '';
      const moneda = comprobante.getAttribute('Moneda') || 'MXN';
      const subtotal = parseFloat(comprobante.getAttribute('SubTotal') || '0');
      const total = parseFloat(comprobante.getAttribute('Total') || '0');

      // Conceptos
      const conceptos: any[] = [];
      const conceptosNodes = xmlDoc.evaluate("//*[local-name()='Concepto']", xmlDoc, nsResolver, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);

      for (let i = 0; i < conceptosNodes.snapshotLength; i++) {
        const concepto = conceptosNodes.snapshotItem(i) as Element;
        const cantidad = parseFloat(concepto.getAttribute('Cantidad') || '0');
        conceptos.push([
          { text: Math.round(cantidad).toString(), fontSize: 8 },
          { text: concepto.getAttribute('ClaveUnidad') || '', fontSize: 8 },
          { text: concepto.getAttribute('ClaveProdServ') || '', fontSize: 8 },
          { text: concepto.getAttribute('Descripcion') || '', fontSize: 8 },
          { text: concepto.getAttribute('ValorUnitario') === '0.00' ? '-' : '$' + parseFloat(concepto.getAttribute('ValorUnitario') || '0').toFixed(2), fontSize: 8, alignment: 'right' },
          { text: concepto.getAttribute('Importe') === '0.00' ? '-' : '$' + parseFloat(concepto.getAttribute('Importe') || '0').toFixed(2), fontSize: 8, alignment: 'right' }
        ]);
      }

      // Carta Porte
      const cartaPorte = xmlDoc.evaluate("//*[local-name()='CartaPorte']", xmlDoc, nsResolver, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue as Element | null;
      const tieneCartaPorte = !!cartaPorte;

      let cartaPorteContent: any[] = [];

      if (tieneCartaPorte && cartaPorte) {
        // Información general de Carta Porte
        const version = cartaPorte.getAttribute('Version') || '';
        const transpInternac = cartaPorte.getAttribute('TranspInternac') || '';
        const totalDistRec = cartaPorte.getAttribute('TotalDistRec') || '';

        // Ubicaciones
        const ubicaciones: any[] = [];
        const ubicacionesNodes = xmlDoc.evaluate("//*[local-name()='Ubicacion']", xmlDoc, nsResolver, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);

        for (let i = 0; i < ubicacionesNodes.snapshotLength; i++) {
          const ubicacion = ubicacionesNodes.snapshotItem(i) as Element;
          const domicilio = ubicacion.getElementsByTagName('*')[0];

          ubicaciones.push([
            { text: ubicacion.getAttribute('TipoUbicacion') || '', fontSize: 8, bold: true },
            { text: ubicacion.getAttribute('RFCRemitenteDestinatario') || '', fontSize: 8 },
            { text: ubicacion.getAttribute('FechaHoraSalidaLlegada') || '', fontSize: 8 },
            { text: domicilio ? `${domicilio.getAttribute('Calle') || ''}, ${domicilio.getAttribute('Municipio') || ''}, ${domicilio.getAttribute('Estado') || ''}, CP: ${domicilio.getAttribute('CodigoPostal') || ''}` : '', fontSize: 7 },
            { text: ubicacion.getAttribute('DistanciaRecorrida') ? ubicacion.getAttribute('DistanciaRecorrida') + ' km' : '-', fontSize: 8, alignment: 'right' }
          ]);
        }

        // Mercancias info
        const mercanciasNode = xmlDoc.evaluate("//*[local-name()='Mercancias']", xmlDoc, nsResolver, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue as Element | null;
        const numTotalMercancias = mercanciasNode?.getAttribute('NumTotalMercancias') || '';
        const pesoBrutoTotal = mercanciasNode?.getAttribute('PesoBrutoTotal') || '';
        const unidadPeso = mercanciasNode?.getAttribute('UnidadPeso') || '';

        // Autotransporte
        const autotransporte = xmlDoc.evaluate("//*[local-name()='Autotransporte']", xmlDoc, nsResolver, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue as Element | null;
        const vehiculo = xmlDoc.evaluate("//*[local-name()='IdentificacionVehicular']", xmlDoc, nsResolver, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue as Element | null;
        const seguro = xmlDoc.evaluate("//*[local-name()='Seguros']", xmlDoc, nsResolver, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue as Element | null;

        // Figura de transporte
        const figuraTransporte = xmlDoc.evaluate("//*[local-name()='TiposFigura']", xmlDoc, nsResolver, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue as Element | null;

        cartaPorteContent = [
          { text: 'CARTA PORTE 3.1', fontSize: 11, bold: true, color: 'white', fillColor: '#34495e', margin: [0, 15, 0, 5] },
          {
            columns: [
              {
                width: '48%',
                stack: [
                  { text: 'INFORMACIÓN GENERAL', fontSize: 9, bold: true, margin: [0, 0, 0, 5] },
                  { text: `Versión: ${version}`, fontSize: 8 },
                  { text: `Transporte Internacional: ${transpInternac}`, fontSize: 8 },
                  { text: `Total Distancia Recorrida: ${totalDistRec} km`, fontSize: 8 }
                ],
                fillColor: '#f8f9fa',
                margin: [5, 5, 5, 5]
              },
              { width: '4%', text: '' },
              {
                width: '48%',
                stack: [
                  { text: 'MERCANCÍAS', fontSize: 9, bold: true, margin: [0, 0, 0, 5] },
                  { text: `Total de Mercancías: ${numTotalMercancias}`, fontSize: 8 },
                  { text: `Peso Bruto Total: ${pesoBrutoTotal} ${unidadPeso}`, fontSize: 8 }
                ],
                fillColor: '#f8f9fa',
                margin: [5, 5, 5, 5]
              }
            ],
            margin: [0, 5, 0, 10]
          },
          { text: 'Ubicaciones', fontSize: 10, bold: true, margin: [0, 10, 0, 5] },
          {
            table: {
              headerRows: 1,
              widths: [50, 70, 70, '*', 50],
              body: [
                [
                  { text: 'Tipo', fontSize: 8, bold: true, fillColor: '#34495e', color: 'white' },
                  { text: 'RFC', fontSize: 8, bold: true, fillColor: '#34495e', color: 'white' },
                  { text: 'Fecha/Hora', fontSize: 8, bold: true, fillColor: '#34495e', color: 'white' },
                  { text: 'Domicilio', fontSize: 8, bold: true, fillColor: '#34495e', color: 'white' },
                  { text: 'Distancia', fontSize: 8, bold: true, fillColor: '#34495e', color: 'white', alignment: 'right' }
                ],
                ...ubicaciones
              ]
            },
            layout: {
              hLineWidth: () => 0.5,
              vLineWidth: () => 0.5,
              hLineColor: () => '#ddd',
              vLineColor: () => '#ddd'
            }
          }
        ];

        // Agregar autotransporte si existe
        if (autotransporte && vehiculo) {
          cartaPorteContent.push(
            { text: 'Autotransporte', fontSize: 10, bold: true, margin: [0, 10, 0, 5] },
            {
              columns: [
                {
                  width: '48%',
                  stack: [
                    { text: 'VEHÍCULO', fontSize: 9, bold: true, margin: [0, 0, 0, 5] },
                    { text: `Placa: ${vehiculo.getAttribute('PlacaVM') || ''}`, fontSize: 8 },
                    { text: `Año Modelo: ${vehiculo.getAttribute('AnioModeloVM') || ''}`, fontSize: 8 },
                    { text: `Configuración: ${vehiculo.getAttribute('ConfigVehicular') || ''}`, fontSize: 8 },
                    { text: `Peso Bruto Vehicular: ${vehiculo.getAttribute('PesoBrutoVehicular') || ''}`, fontSize: 8 }
                  ],
                  fillColor: '#f8f9fa',
                  margin: [5, 5, 5, 5]
                },
                { width: '4%', text: '' },
                {
                  width: '48%',
                  stack: [
                    { text: 'SEGUROS Y PERMISOS', fontSize: 9, bold: true, margin: [0, 0, 0, 5] },
                    { text: `Permiso SCT: ${autotransporte.getAttribute('PermSCT') || ''}`, fontSize: 8 },
                    { text: `Número Permiso: ${autotransporte.getAttribute('NumPermisoSCT') || ''}`, fontSize: 8 },
                    { text: `Aseguradora: ${seguro?.getAttribute('AseguraRespCivil') || ''}`, fontSize: 8 },
                    { text: `Póliza: ${seguro?.getAttribute('PolizaRespCivil') || ''}`, fontSize: 8 }
                  ],
                  fillColor: '#f8f9fa',
                  margin: [5, 5, 5, 5]
                }
              ],
              margin: [0, 5, 0, 10]
            }
          );
        }

        // Agregar figura de transporte si existe
        if (figuraTransporte) {
          cartaPorteContent.push(
            { text: 'Figura de Transporte', fontSize: 10, bold: true, margin: [0, 10, 0, 5] },
            {
              table: {
                widths: [70, '*', 80, 80],
                body: [
                  [
                    { text: 'Tipo Figura', fontSize: 8, bold: true, fillColor: '#34495e', color: 'white' },
                    { text: 'Nombre', fontSize: 8, bold: true, fillColor: '#34495e', color: 'white' },
                    { text: 'RFC', fontSize: 8, bold: true, fillColor: '#34495e', color: 'white' },
                    { text: 'No. Licencia', fontSize: 8, bold: true, fillColor: '#34495e', color: 'white' }
                  ],
                  [
                    { text: figuraTransporte.getAttribute('TipoFigura') || '', fontSize: 8 },
                    { text: figuraTransporte.getAttribute('NombreFigura') || '', fontSize: 8 },
                    { text: figuraTransporte.getAttribute('RFCFigura') || '', fontSize: 8 },
                    { text: figuraTransporte.getAttribute('NumLicencia') || '', fontSize: 8 }
                  ]
                ]
              },
              layout: {
                hLineWidth: () => 0.5,
                vLineWidth: () => 0.5,
                hLineColor: () => '#ddd',
                vLineColor: () => '#ddd'
              }
            }
          );
        }
      }

      // Timbre
      const timbre = xmlDoc.evaluate("//*[local-name()='TimbreFiscalDigital']", xmlDoc, nsResolver, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue as Element | null;
      const uuid = timbre?.getAttribute('UUID') || '';
      const fechaTimbrado = timbre?.getAttribute('FechaTimbrado') || '';
      const noCertSAT = timbre?.getAttribute('NoCertificadoSAT') || '';
      const rfcProvCertif = timbre?.getAttribute('RfcProvCertif') || '';
      const selloCFDTimbre = timbre?.getAttribute('SelloCFD') || '';
      const selloSAT = timbre?.getAttribute('SelloSAT') || '';

      // Sello del comprobante
      const selloComprobante = comprobante.getAttribute('Sello') || '';
      const noCertificado = comprobante.getAttribute('NoCertificado') || '';

      // Generar QR
      const rfcEmisor = emisorRfc;
      const rfcReceptor = receptorRfc;
      const totalStr = total.toFixed(6);
      const feParam = selloCFDTimbre ? selloCFDTimbre.slice(-8) : '';
      const verificationUrl = `https://verificacfdi.facturaelectronica.sat.gob.mx/default.aspx?id=${encodeURIComponent(uuid)}&re=${encodeURIComponent(rfcEmisor)}&rr=${encodeURIComponent(rfcReceptor)}&tt=${encodeURIComponent(totalStr)}&fe=${encodeURIComponent(feParam)}`;
      const qrDataUrl = await QRCode.toDataURL(verificationUrl, { margin: 1, scale: 4 });

      // Definir documento PDF
      const docDefinition: any = {
        pageSize: 'A4',
        pageMargins: [40, 40, 40, 40],
        content: [
          // HEADER
          {
            columns: [
              {
                width: '*',
                stack: [
                  { text: emisorNombre, fontSize: 16, bold: true, color: '#2c3e50' },
                  { text: `RFC: ${emisorRfc}`, fontSize: 9, margin: [0, 3, 0, 0] },
                  { text: `Régimen Fiscal: ${emisorRegimen}`, fontSize: 9 }
                ]
              },
              {
                width: 'auto',
                stack: [
                  { text: 'CARTA PORTE / TRASLADO', fontSize: 14, bold: true, color: '#e74c3c', alignment: 'right' },
                  { text: `Serie: ${serie}  Folio: ${folio}`, fontSize: 9, alignment: 'right', margin: [0, 3, 0, 0] },
                  { text: `Fecha: ${fecha}`, fontSize: 9, alignment: 'right' },
                  { text: `Tipo: ${tipoComprobante === 'T' ? 'Traslado' : tipoComprobante}`, fontSize: 9, alignment: 'right' }
                ]
              }
            ],
            margin: [0, 0, 0, 15]
          },

          // RECEPTOR Y DATOS DE PAGO
          {
            columns: [
              {
                width: '48%',
                stack: [
                  { text: 'RECEPTOR', fontSize: 10, bold: true, color: '#2c3e50', margin: [0, 0, 0, 5] },
                  { text: `Nombre: ${receptorNombre}`, fontSize: 8 },
                  { text: `RFC: ${receptorRfc}`, fontSize: 8 },
                  { text: `Uso CFDI: ${receptorUsoCFDI}`, fontSize: 8 },
                  { text: `Régimen Fiscal: ${receptorRegimen}`, fontSize: 8 }
                ],
                fillColor: '#f8f9fa',
                margin: [5, 5, 5, 5]
              },
              { width: '4%', text: '' },
              {
                width: '48%',
                stack: [
                  { text: 'DATOS DE PAGO', fontSize: 10, bold: true, color: '#2c3e50', margin: [0, 0, 0, 5] },
                  { text: `Forma de Pago: ${formaPago}`, fontSize: 8 },
                  { text: `Método de Pago: ${metodoPago}`, fontSize: 8 },
                  { text: `Moneda: ${moneda}`, fontSize: 8 }
                ],
                fillColor: '#f8f9fa',
                margin: [5, 5, 5, 5]
              }
            ],
            margin: [0, 0, 0, 15]
          },

          // CONCEPTOS
          { text: 'CONCEPTOS', fontSize: 11, bold: true, color: 'white', fillColor: '#34495e', margin: [0, 10, 0, 5] },
          {
            table: {
              headerRows: 1,
              widths: [40, 50, 60, '*', 60, 60],
              body: [
                [
                  { text: 'Cant.', fontSize: 9, bold: true, fillColor: '#34495e', color: 'white' },
                  { text: 'Unidad', fontSize: 9, bold: true, fillColor: '#34495e', color: 'white' },
                  { text: 'Clave', fontSize: 9, bold: true, fillColor: '#34495e', color: 'white' },
                  { text: 'Descripción', fontSize: 9, bold: true, fillColor: '#34495e', color: 'white' },
                  { text: 'P. Unit.', fontSize: 9, bold: true, fillColor: '#34495e', color: 'white', alignment: 'right' },
                  { text: 'Importe', fontSize: 9, bold: true, fillColor: '#34495e', color: 'white', alignment: 'right' }
                ],
                ...conceptos
              ]
            },
            layout: {
              hLineWidth: () => 0.5,
              vLineWidth: () => 0.5,
              hLineColor: () => '#ddd',
              vLineColor: () => '#ddd'
            }
          },

          // TOTALES
          {
            columns: [
              { width: '*', text: '' },
              {
                width: 150,
                table: {
                  widths: ['*', 'auto'],
                  body: [
                    [{ text: 'Subtotal:', fontSize: 9 }, { text: `$${subtotal.toFixed(2)}`, fontSize: 9, alignment: 'right' }],
                    [{ text: 'TOTAL:', fontSize: 10, bold: true, fillColor: '#2c3e50', color: 'white' }, { text: `$${total.toFixed(2)}`, fontSize: 10, bold: true, fillColor: '#2c3e50', color: 'white', alignment: 'right' }]
                  ]
                },
                layout: 'noBorders',
                margin: [0, 10, 0, 0]
              }
            ]
          },

          // CARTA PORTE
          ...cartaPorteContent,

          // TIMBRE FISCAL (si existe)
          ...(uuid ? [
            { text: 'TIMBRE FISCAL DIGITAL', fontSize: 11, bold: true, color: 'white', fillColor: '#3498db', margin: [0, 20, 0, 5] },
            {
              columns: [
                {
                  image: qrDataUrl,
                  width: 80,
                  height: 80
                },
                {
                  width: '*',
                  stack: [
                    { text: `UUID: ${uuid}`, fontSize: 8, margin: [10, 0, 0, 3] },
                    { text: `Fecha de Timbrado: ${fechaTimbrado}`, fontSize: 8, margin: [10, 0, 0, 3] },
                    { text: `No. Certificado SAT: ${noCertSAT}`, fontSize: 8, margin: [10, 0, 0, 3] },
                    { text: `RFC Proveedor Certificación: ${rfcProvCertif}`, fontSize: 8, margin: [10, 0, 0, 3] }
                  ]
                }
              ],
              margin: [0, 5, 0, 10]
            }
          ] : []),

          // SELLOS DIGITALES
          ...(selloCFDTimbre || selloSAT || selloComprobante ? [
            { text: 'SELLOS DIGITALES', fontSize: 11, bold: true, color: 'white', fillColor: '#34495e', margin: [0, 15, 0, 5] },
            ...(selloCFDTimbre ? [
              { text: 'Sello Digital del CFDI (Timbre):', fontSize: 8, bold: true, margin: [0, 5, 0, 2] },
              { text: selloCFDTimbre, fontSize: 6, margin: [0, 0, 0, 8] }
            ] : []),
            ...(selloSAT ? [
              { text: 'Sello Digital del SAT:', fontSize: 8, bold: true, margin: [0, 5, 0, 2] },
              { text: selloSAT, fontSize: 6, margin: [0, 0, 0, 8] }
            ] : []),
            ...(selloComprobante ? [
              { text: 'Sello Digital del Emisor:', fontSize: 8, bold: true, margin: [0, 5, 0, 2] },
              { text: selloComprobante, fontSize: 6, margin: [0, 0, 0, 8] }
            ] : []),
            { text: `No. Certificado del Emisor: ${noCertificado}`, fontSize: 8, margin: [0, 5, 0, 0] }
          ] : []),

          // FOOTER
          {
            text: 'Este documento es una representación impresa de un CFDI',
            fontSize: 7,
            color: '#777',
            alignment: 'center',
            margin: [0, 20, 0, 0]
          }
        ],
        defaultStyle: {
          font: 'Roboto'
        }
      };

      // Generar y descargar PDF
      const fileName = file.name.replace(/\.xml$/i, '') || 'cfdi';
      pdfMake.default.createPdf(docDefinition).download(`${fileName}.pdf`);

      console.log('PDF generado exitosamente');

    } catch (err: unknown) {
      console.error(err);
      const message = err instanceof Error ? err.message : String(err);
      setError(message || 'Error al procesar el archivo XML. Verifica que sea un CFDI 4.0 válido.');
    } finally {
      setLoading(false);
    }
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

          {/* Convert Button */}
          <div className="space-y-3">
            <button
              onClick={previewHTML}
              disabled={!file || loading}
              className="w-full py-3 px-6 text-gray-700 dark:text-gray-200 font-semibold rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:bg-gray-300 dark:disabled:bg-gray-800 disabled:cursor-not-allowed transition-colors duration-200 shadow hover:shadow-lg"
            >
              {loading ? "Procesando..." : "👁️ Previsualizar HTML"}
            </button>

            <button
              onClick={convertToPDF}
              disabled={!file || loading}
              className="w-full py-3 px-6 text-white font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200 shadow-lg hover:shadow-xl"
            >
              {loading ? "Convirtiendo..." : "📄 Convertir a PDF"}
            </button>
          </div>
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







