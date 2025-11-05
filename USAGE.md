# Guía de Uso - Convertidor XML a PDF

## 🎯 Cómo usar la aplicación

### Paso 1: Iniciar la aplicación

```bash
npm run dev
```

Abre tu navegador en [http://localhost:3000](http://localhost:3000)

### Paso 2: Cargar tu archivo XML

Tienes dos opciones:

1. **Hacer clic** en el área de carga y seleccionar tu archivo XML
2. **Arrastrar y soltar** el archivo XML directamente en el área de carga

![Área de carga](docs/upload-area.png)

### Paso 3: Convertir

Una vez seleccionado el archivo, presiona el botón **"Convertir a PDF"**.

La aplicación procesará tu archivo y automáticamente descargará el PDF generado.

## 📋 Requisitos del archivo XML

El archivo XML debe ser un **Comprobante Fiscal Digital por Internet (CFDI) versión 4.0** válido, que incluya:

- Nodo `cfdi:Comprobante`
- Información del `cfdi:Emisor`
- Información del `cfdi:Receptor`
- `cfdi:Conceptos` con al menos un concepto
- `cfdi:Complemento` con `tfd:TimbreFiscalDigital` (para el código QR)

## 🎨 Características del PDF generado

### Diseño Profesional

El PDF generado tiene un aspecto profesional similar a las facturas impresas tradicionales:

- **Encabezado azul oscuro** con título "FACTURA"
- **Secciones claramente delimitadas** con bordes y cajas
- **Tabla de conceptos** con alternancia de colores para mejor lectura
- **Código QR** para verificación en línea
- **Sellos digitales** del CFDI y del SAT

### Código QR

El código QR incluido en el PDF contiene:
- UUID del comprobante
- RFC del emisor y receptor
- Total del comprobante
- Últimos 8 caracteres del sello digital

Al escanear el código QR, se puede verificar directamente en el portal del SAT.

### Información Completa

El PDF incluye toda la información relevante:

1. **Datos del Emisor**
   - RFC
   - Nombre o razón social
   - Régimen fiscal
   - Código postal

2. **Datos del Receptor**
   - RFC
   - Nombre o razón social
   - Uso CFDI
   - Código postal

3. **Detalles del Comprobante**
   - Tipo de comprobante
   - Serie y folio
   - Fecha de emisión
   - Forma de pago
   - Método de pago
   - Moneda
   - Lugar de expedición

4. **Conceptos**
   - Cantidad
   - Descripción del producto/servicio
   - Precio unitario
   - Importe

5. **Totales**
   - Subtotal
   - IVA trasladado
   - Retenciones (si aplican)
   - Total

6. **Timbre Fiscal Digital**
   - UUID
   - Fecha de timbrado
   - Número de certificado SAT
   - Sello digital del CFDI
   - Sello digital del SAT

## 🔒 Seguridad y Privacidad

### Procesamiento Local

- ✅ **100% procesamiento en el navegador**: Tu archivo XML nunca sale de tu computadora
- ✅ **Sin servidores**: No hay servidores que almacenen tus datos
- ✅ **Sin registro**: No se requiere cuenta ni registro
- ✅ **Sin internet para procesar**: Una vez cargada la página, puedes usarla sin conexión

### Datos Sensibles

El código maneja datos fiscales sensibles como:
- RFC de emisores y receptores
- Montos de facturas
- Sellos digitales

Por eso es importante que **todo el procesamiento sea local** y no se envíen datos a servidores externos.

## ⚠️ Solución de Problemas

### Error: "No se encontró un CFDI válido"

**Causa**: El archivo XML no tiene la estructura correcta de un CFDI 4.0.

**Solución**: Verifica que tu archivo:
- Sea un XML válido
- Tenga el namespace `cfdi` correctamente declarado
- Contenga el nodo `cfdi:Comprobante`

### Error: "Error al procesar el archivo XML"

**Causa**: El XML está corrupto o tiene un formato inesperado.

**Solución**: 
- Abre el archivo XML en un editor de texto para verificar que no esté corrupto
- Verifica que sea un archivo CFDI válido emitido por un PAC autorizado

### El PDF no muestra el código QR

**Causa**: El XML no contiene el timbre fiscal digital.

**Solución**: Asegúrate de que el XML incluya el nodo `cfdi:Complemento` con `tfd:TimbreFiscalDigital`. Este nodo es agregado por el PAC al timbrar la factura.

### El texto se corta o se ve mal

**Causa**: Algunos nombres o descripciones muy largos pueden necesitar ajuste.

**Solución**: La aplicación automáticamente maneja el texto largo, pero si encuentras problemas, reporta un issue en GitHub.

## 🚀 Consejos de Uso

### Para mejores resultados:

1. **Usa archivos XML originales**: No edites manualmente los archivos XML
2. **Verifica antes de convertir**: Asegúrate de que el XML sea válido
3. **Guarda tus PDFs**: Los PDFs generados son representaciones impresas oficiales
4. **Escanea el QR**: Siempre puedes verificar la autenticidad escaneando el código QR

### Casos de uso comunes:

- 📧 **Enviar facturas por email**: Convierte el XML a PDF para adjuntar a correos
- 🖨️ **Imprimir facturas**: El PDF tiene formato profesional listo para imprimir
- 📁 **Archivar documentos**: Los PDFs son más fáciles de organizar y visualizar
- 💼 **Presentar a clientes**: El PDF tiene un aspecto más profesional que el XML

## 📞 Soporte

Si encuentras algún problema o tienes sugerencias, por favor:

1. Revisa esta guía de uso
2. Verifica que tu XML sea válido
3. Abre un issue en GitHub con:
   - Descripción del problema
   - Pasos para reproducirlo
   - Versión del navegador que usas
   - (No incluyas el XML completo por privacidad, solo la estructura relevante)

---

**Nota**: Esta aplicación es una herramienta de utilidad para facilitar la visualización de CFDIs. El XML original sigue siendo el documento fiscal oficial válido ante el SAT.

