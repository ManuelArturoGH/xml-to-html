# Convertidor XML a PDF - CFDI 4.0

Una aplicación web simple y moderna para convertir facturas electrónicas XML (CFDI 4.0) a formato PDF.

## 🚀 Características

- ✅ Conversión de XML CFDI 4.0 a PDF profesional
- ✅ Formato de factura profesional con tablas y diseño estructurado
- ✅ Código QR con enlace de verificación del SAT
- ✅ Sello digital del CFDI y del SAT
- ✅ Información completa: emisor, receptor, conceptos y totales
- ✅ Desglose de impuestos (IVA, retenciones)
- ✅ Procesamiento 100% local (sin envío de datos a servidores)
- ✅ Interfaz moderna y responsive
- ✅ Soporte para modo oscuro
- ✅ Diseño minimalista con Tailwind CSS

## 📋 Requisitos

- Node.js 18+ 
- npm o yarn

## 🛠️ Instalación

```bash
# Clonar el repositorio
git clone <tu-repositorio>

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## 📦 Dependencias principales

- **Next.js 16** - Framework de React
- **React 19** - Biblioteca de UI
- **Tailwind CSS 4** - Framework de CSS
- **fast-xml-parser** - Parser de XML
- **jsPDF** - Generación de PDFs
- **qrcode** - Generación de códigos QR

## 🎯 Uso

1. Haz clic en el área de carga o arrastra un archivo XML
2. Selecciona tu factura electrónica CFDI 4.0 (.xml)
3. Presiona el botón "Convertir a PDF"
4. El PDF se descargará automáticamente

## 📄 Estructura del PDF generado

El PDF incluye un diseño profesional con:

### Encabezado
- Título de factura con fondo azul oscuro
- Folio y fecha del comprobante

### Información Principal
- **Emisor**: RFC, nombre, régimen fiscal y código postal
- **Receptor**: RFC, nombre, uso CFDI y código postal
- **Detalles del comprobante**: tipo, forma de pago, método de pago, moneda y lugar de expedición

### Tabla de Conceptos
- Tabla profesional con alternancia de colores
- Columnas: Cantidad, Descripción, Precio Unitario e Importe
- Manejo automático de páginas múltiples

### Totales
- Subtotal
- Impuestos trasladados (IVA)
- Retenciones (si aplican)
- Total destacado con fondo azul

### Timbre Fiscal Digital
- **Código QR** escaneables con enlace de verificación del SAT
- UUID del comprobante
- Fecha de timbrado
- Número de certificado del SAT
- Sello digital del CFDI
- Sello digital del SAT

### Pie de Página
- Leyenda de representación impresa de CFDI

## 🔒 Privacidad

Todos los archivos se procesan localmente en tu navegador. No se envían datos a ningún servidor externo.

## 📝 Scripts disponibles

```bash
npm run dev      # Iniciar servidor de desarrollo
npm run build    # Crear build de producción
npm start        # Iniciar servidor de producción
npm run lint     # Ejecutar ESLint
```

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor, abre un issue o pull request.

## 📜 Licencia

MIT

