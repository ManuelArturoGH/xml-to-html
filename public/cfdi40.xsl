<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0"
                xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
                xmlns:cfdi="http://www.sat.gob.mx/cfd/4"
                xmlns:tfd="http://www.sat.gob.mx/TimbreFiscalDigital"
                xmlns:cartaporte31="http://www.sat.gob.mx/CartaPorte31">

    <xsl:output method="html" encoding="UTF-8" indent="yes"/>

    <xsl:template match="/">
        <html>
            <head>
                <meta charset="UTF-8"/>
                <title>CFDI 4.0 - Factura</title>
                <style>
                    * { box-sizing: border-box; margin: 0; padding: 0; }
                    body {
                        font-family: Arial, Helvetica, sans-serif;
                        font-size: 11px;
                        color: #333;
                        padding: 20px;
                        background: #fff;
                    }
                    .container { max-width: 800px; margin: 0 auto; }
                    .header {
                        display: flex;
                        justify-content: space-between;
                        margin-bottom: 20px;
                        padding-bottom: 10px;
                        border-bottom: 2px solid #2c3e50;
                    }
                    .company h1 {
                        font-size: 20px;
                        color: #2c3e50;
                        margin-bottom: 5px;
                    }
                    .company-info { font-size: 10px; line-height: 1.5; color: #555; }
                    .invoice-info { text-align: right; }
                    .invoice-info h2 {
                        font-size: 16px;
                        color: #e74c3c;
                        margin-bottom: 5px;
                    }
                    .invoice-info p { margin: 2px 0; font-size: 10px; }

                    .section { margin: 15px 0; }
                    .section-title {
                        background: #34495e;
                        color: white;
                        padding: 8px 10px;
                        font-size: 12px;
                        font-weight: bold;
                        margin-bottom: 10px;
                    }

                    .info-grid {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 15px;
                        margin-bottom: 15px;
                    }
                    .info-box {
                        border: 1px solid #ddd;
                        padding: 10px;
                        background: #f8f9fa;
                    }
                    .info-box h3 {
                        font-size: 11px;
                        color: #2c3e50;
                        margin-bottom: 8px;
                        padding-bottom: 5px;
                        border-bottom: 1px solid #ddd;
                    }
                    .info-box p {
                        margin: 4px 0;
                        font-size: 10px;
                        line-height: 1.4;
                    }
                    .info-box strong { color: #2c3e50; }

                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin: 10px 0;
                        font-size: 10px;
                    }
                    th {
                        background: #34495e;
                        color: white;
                        padding: 8px;
                        text-align: left;
                        font-weight: bold;
                        font-size: 10px;
                    }
                    td {
                        padding: 8px;
                        border-bottom: 1px solid #ddd;
                        vertical-align: top;
                    }
                    tr:hover td { background: #f8f9fa; }

                    .text-right { text-align: right; }
                    .text-center { text-align: center; }

                    .totals {
                        float: right;
                        width: 300px;
                        margin-top: 15px;
                    }
                    .totals table { margin: 0; }
                    .totals td {
                        padding: 6px 10px;
                        border: none;
                    }
                    .totals .total-row {
                        background: #2c3e50;
                        color: white;
                        font-weight: bold;
                        font-size: 12px;
                    }

                    .timbre-section {
                        clear: both;
                        margin-top: 20px;
                        padding: 15px;
                        border: 2px solid #3498db;
                        background: #ecf0f1;
                    }
                    .timbre-section h3 {
                        color: #2c3e50;
                        margin-bottom: 10px;
                        font-size: 12px;
                    }
                    .timbre-section p {
                        margin: 5px 0;
                        font-size: 10px;
                        word-break: break-all;
                    }

                    .footer {
                        margin-top: 30px;
                        padding-top: 15px;
                        border-top: 1px solid #ddd;
                        font-size: 9px;
                        color: #777;
                        text-align: center;
                    }

                    @media print {
                        body { padding: 0; }
                        .container { max-width: 100%; }
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <!-- HEADER -->
                    <div class="header">
                        <div class="company">
                            <h1><xsl:value-of select="cfdi:Comprobante/cfdi:Emisor/@Nombre"/></h1>
                            <div class="company-info">
                                <strong>RFC:</strong> <xsl:value-of select="cfdi:Comprobante/cfdi:Emisor/@Rfc"/><br/>
                                <strong>Régimen Fiscal:</strong> <xsl:value-of select="cfdi:Comprobante/cfdi:Emisor/@RegimenFiscal"/><br/>
                                <xsl:if test="cfdi:Comprobante/@LugarExpedicion">
                                    <strong>Lugar de Expedición:</strong> <xsl:value-of select="cfdi:Comprobante/@LugarExpedicion"/>
                                </xsl:if>
                            </div>
                        </div>
                        <div class="invoice-info">
                            <h2>CARTA TRASLADO</h2>
                            <p>
                                <strong>Serie/Folio:</strong> <xsl:value-of select="cfdi:Comprobante/@Serie"/> <xsl:value-of select="cfdi:Comprobante/@Folio"/>
                            </p>
                            <p><strong>Fecha:</strong> <xsl:value-of select="cfdi:Comprobante/@Fecha"/></p>
                            <p><strong>Tipo de Comprobante:</strong>
                                <xsl:choose>
                                    <xsl:when test="cfdi:Comprobante/@TipoDeComprobante = 'I'">Ingreso</xsl:when>
                                    <xsl:when test="cfdi:Comprobante/@TipoDeComprobante = 'E'">Egreso</xsl:when>
                                    <xsl:when test="cfdi:Comprobante/@TipoDeComprobante = 'T'">Traslado</xsl:when>
                                    <xsl:when test="cfdi:Comprobante/@TipoDeComprobante = 'N'">Nómina</xsl:when>
                                    <xsl:when test="cfdi:Comprobante/@TipoDeComprobante = 'P'">Pago</xsl:when>
                                    <xsl:otherwise><xsl:value-of select="cfdi:Comprobante/@TipoDeComprobante"/></xsl:otherwise>
                                </xsl:choose>
                            </p>
                        </div>
                    </div>

                    <!-- RECEPTOR Y DATOS GENERALES -->
<!--                    <div class="info-grid">-->
<!--                        <div class="info-box">-->
<!--                            <h3>RECEPTOR</h3>-->
<!--                            <p><strong>Nombre:</strong> <xsl:value-of select="cfdi:Comprobante/cfdi:Receptor/@Nombre"/></p>-->
<!--                            <p><strong>RFC:</strong> <xsl:value-of select="cfdi:Comprobante/cfdi:Receptor/@Rfc"/></p>-->
<!--                            <p><strong>Uso CFDI:</strong> <xsl:value-of select="cfdi:Comprobante/cfdi:Receptor/@UsoCFDI"/> - -->
<!--                                <xsl:choose>-->
<!--                                    <xsl:when test="cfdi:Comprobante/cfdi:Receptor/@UsoCFDI = 'G01'">Adquisición de mercancías</xsl:when>-->
<!--                                    <xsl:when test="cfdi:Comprobante/cfdi:Receptor/@UsoCFDI = 'G02'">Devoluciones, descuentos o bonificaciones</xsl:when>-->
<!--                                    <xsl:when test="cfdi:Comprobante/cfdi:Receptor/@UsoCFDI = 'G03'">Gastos en general</xsl:when>-->
<!--                                    <xsl:when test="cfdi:Comprobante/cfdi:Receptor/@UsoCFDI = 'I01'">Construcciones</xsl:when>-->
<!--                                    <xsl:when test="cfdi:Comprobante/cfdi:Receptor/@UsoCFDI = 'I02'">Mobilario y equipo de oficina</xsl:when>-->
<!--                                    <xsl:when test="cfdi:Comprobante/cfdi:Receptor/@UsoCFDI = 'P01'">Por definir</xsl:when>-->
<!--                                    <xsl:when test="cfdi:Comprobante/cfdi:Receptor/@UsoCFDI = 'S01'">Sin efectos fiscales</xsl:when>-->
<!--                                    <xsl:when test="cfdi:Comprobante/cfdi:Receptor/@UsoCFDI = 'CP01'">Pagos</xsl:when>-->
<!--                                    <xsl:when test="cfdi:Comprobante/cfdi:Receptor/@UsoCFDI = 'CN01'">Nómina</xsl:when>-->
<!--                                    <xsl:otherwise></xsl:otherwise>-->
<!--                                </xsl:choose>-->
<!--                            </p>-->
<!--                            <p><strong>Régimen Fiscal:</strong> <xsl:value-of select="cfdi:Comprobante/cfdi:Receptor/@RegimenFiscalReceptor"/> - -->
<!--                                <xsl:choose>-->
<!--                                    <xsl:when test="cfdi:Comprobante/cfdi:Receptor/@RegimenFiscalReceptor = '601'">General de Ley Personas Morales</xsl:when>-->
<!--                                    <xsl:when test="cfdi:Comprobante/cfdi:Receptor/@RegimenFiscalReceptor = '603'">Personas Morales con Fines no Lucrativos</xsl:when>-->
<!--                                    <xsl:when test="cfdi:Comprobante/cfdi:Receptor/@RegimenFiscalReceptor = '605'">Sueldos y Salarios e Ingresos Asimilados a Salarios</xsl:when>-->
<!--                                    <xsl:when test="cfdi:Comprobante/cfdi:Receptor/@RegimenFiscalReceptor = '606'">Arrendamiento</xsl:when>-->
<!--                                    <xsl:when test="cfdi:Comprobante/cfdi:Receptor/@RegimenFiscalReceptor = '607'">Régimen de Enajenación o Adquisición de Bienes</xsl:when>-->
<!--                                    <xsl:when test="cfdi:Comprobante/cfdi:Receptor/@RegimenFiscalReceptor = '608'">Demás ingresos</xsl:when>-->
<!--                                    <xsl:when test="cfdi:Comprobante/cfdi:Receptor/@RegimenFiscalReceptor = '610'">Residentes en el Extranjero sin Establecimiento Permanente en México</xsl:when>-->
<!--                                    <xsl:when test="cfdi:Comprobante/cfdi:Receptor/@RegimenFiscalReceptor = '611'">Ingresos por Dividendos (socios y accionistas)</xsl:when>-->
<!--                                    <xsl:when test="cfdi:Comprobante/cfdi:Receptor/@RegimenFiscalReceptor = '612'">Personas Físicas con Actividades Empresariales y Profesionales</xsl:when>-->
<!--                                    <xsl:when test="cfdi:Comprobante/cfdi:Receptor/@RegimenFiscalReceptor = '614'">Ingresos por intereses</xsl:when>-->
<!--                                    <xsl:when test="cfdi:Comprobante/cfdi:Receptor/@RegimenFiscalReceptor = '616'">Sin obligaciones fiscales</xsl:when>-->
<!--                                    <xsl:when test="cfdi:Comprobante/cfdi:Receptor/@RegimenFiscalReceptor = '620'">Sociedades Cooperativas de Producción que optan por diferir sus ingresos</xsl:when>-->
<!--                                    <xsl:when test="cfdi:Comprobante/cfdi:Receptor/@RegimenFiscalReceptor = '621'">Incorporación Fiscal</xsl:when>-->
<!--                                    <xsl:when test="cfdi:Comprobante/cfdi:Receptor/@RegimenFiscalReceptor = '622'">Actividades Agrícolas, Ganaderas, Silvícolas y Pesqueras</xsl:when>-->
<!--                                    <xsl:when test="cfdi:Comprobante/cfdi:Receptor/@RegimenFiscalReceptor = '623'">Opcional para Grupos de Sociedades</xsl:when>-->
<!--                                    <xsl:when test="cfdi:Comprobante/cfdi:Receptor/@RegimenFiscalReceptor = '624'">Coordinados</xsl:when>-->
<!--                                    <xsl:when test="cfdi:Comprobante/cfdi:Receptor/@RegimenFiscalReceptor = '625'">Régimen de las Actividades Empresariales con ingresos a través de Plataformas Tecnológicas</xsl:when>-->
<!--                                    <xsl:when test="cfdi:Comprobante/cfdi:Receptor/@RegimenFiscalReceptor = '626'">Régimen Simplificado de Confianza</xsl:when>-->
<!--                                    <xsl:otherwise></xsl:otherwise>-->
<!--                                </xsl:choose>-->
<!--                            </p>-->
<!--                            <xsl:if test="cfdi:Comprobante/cfdi:Receptor/@DomicilioFiscalReceptor">-->
<!--                                <p><strong>C.P.:</strong> <xsl:value-of select="cfdi:Comprobante/cfdi:Receptor/@DomicilioFiscalReceptor"/></p>-->
<!--                            </xsl:if>-->
<!--                        </div>-->
<!--                        <div class="info-box">-->
<!--                            <h3>DATOS DE PAGO</h3>-->
<!--                            <p><strong>Forma de Pago:</strong> <xsl:value-of select="cfdi:Comprobante/@FormaPago"/></p>-->
<!--                            <p><strong>Método de Pago:</strong> <xsl:value-of select="cfdi:Comprobante/@MetodoPago"/></p>-->
<!--                            <p><strong>Moneda:</strong> <xsl:value-of select="cfdi:Comprobante/@Moneda"/></p>-->
<!--                            <xsl:if test="cfdi:Comprobante/@TipoCambio">-->
<!--                                <p><strong>Tipo de Cambio:</strong> <xsl:value-of select="cfdi:Comprobante/@TipoCambio"/></p>-->
<!--                            </xsl:if>-->
<!--                            <xsl:if test="cfdi:Comprobante/@CondicionesDePago">-->
<!--                                <p><strong>Condiciones de Pago:</strong> <xsl:value-of select="cfdi:Comprobante/@CondicionesDePago"/></p>-->
<!--                            </xsl:if>-->
<!--                        </div>-->
<!--                    </div>-->

                    <!-- CONCEPTOS -->
                    <div class="section">
                        <div class="section-title">CONCEPTOS</div>
                        <table>
                            <thead>
                                <tr>
                                    <th style="width: 50px;">Cant.</th>
                                    <th style="width: 80px;">Unidad</th>
                                    <th style="width: 80px;">Clave</th>
                                    <th>Descripción</th>
                                    <th style="width: 90px;" class="text-right">P. Unitario</th>
                                    <th style="width: 90px;" class="text-right">Importe</th>
                                </tr>
                            </thead>
                            <tbody>
                                <xsl:for-each select="cfdi:Comprobante/cfdi:Conceptos/cfdi:Concepto">
                                    <tr>
                                        <td class="text-center">
                                            <xsl:variable name="cantidad" select="@Cantidad"/>
                                            <xsl:variable name="cantidadNum" select="number($cantidad)"/>
                                            <xsl:variable name="cantidadRedondeada" select="round($cantidadNum * 100) div 100"/>
                                            <xsl:choose>
                                                <!-- Si el número redondeado es igual al entero, mostrar como entero -->
                                                <xsl:when test="$cantidadRedondeada = floor($cantidadRedondeada)">
                                                    <xsl:value-of select="format-number($cantidadRedondeada, '#,##0')"/>
                                                </xsl:when>
                                                <!-- Si tiene decimales significativos, mostrar con 2 decimales -->
                                                <xsl:otherwise>
                                                    <xsl:value-of select="format-number($cantidadRedondeada, '#,##0.00')"/>
                                                </xsl:otherwise>
                                            </xsl:choose>
                                        </td>
                                        <td>
                                            <xsl:value-of select="@ClaveUnidad"/>
                                            <xsl:if test="@Unidad">
                                                <br/><small><xsl:value-of select="@Unidad"/></small>
                                            </xsl:if>
                                        </td>
                                        <td><xsl:value-of select="@ClaveProdServ"/></td>
                                        <td>
                                            <strong><xsl:value-of select="@Descripcion"/></strong>
                                            <xsl:if test="@NoIdentificacion">
                                                <br/><small>No. Identificación: <xsl:value-of select="@NoIdentificacion"/></small>
                                            </xsl:if>
                                        </td>
                                        <td class="text-right">
                                            <xsl:choose>
                                                <xsl:when test="number(@ValorUnitario) = 0">-</xsl:when>
                                                <xsl:otherwise>$<xsl:value-of select="format-number(@ValorUnitario, '#,##0.00')"/></xsl:otherwise>
                                            </xsl:choose>
                                        </td>
                                        <td class="text-right">
                                            <xsl:choose>
                                                <xsl:when test="number(@Importe) = 0">-</xsl:when>
                                                <xsl:otherwise>$<xsl:value-of select="format-number(@Importe, '#,##0.00')"/></xsl:otherwise>
                                            </xsl:choose>
                                        </td>
                                    </tr>
                                </xsl:for-each>
                            </tbody>
                        </table>
                    </div>

                    <!-- IMPUESTOS -->
                    <xsl:if test="cfdi:Comprobante/cfdi:Impuestos">
                        <div class="section">
                            <div class="section-title">IMPUESTOS</div>
                            <table>
                                <thead>
                                    <tr>
                                        <th>Impuesto</th>
                                        <th>Tipo</th>
                                        <th class="text-right">Tasa/Cuota</th>
                                        <th class="text-right">Base</th>
                                        <th class="text-right">Importe</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <!-- Traslados -->
                                    <xsl:for-each select="cfdi:Comprobante/cfdi:Impuestos/cfdi:Traslados/cfdi:Traslado">
                                        <tr>
                                            <td><xsl:value-of select="@Impuesto"/></td>
                                            <td>Traslado</td>
                                            <td class="text-right">
                                                <xsl:value-of select="format-number(@TasaOCuota * 100, '0.00')"/>%
                                            </td>
                                            <td class="text-right">$<xsl:value-of select="format-number(@Base, '#,##0.00')"/></td>
                                            <td class="text-right">$<xsl:value-of select="format-number(@Importe, '#,##0.00')"/></td>
                                        </tr>
                                    </xsl:for-each>
                                    <!-- Retenciones -->
                                    <xsl:for-each select="cfdi:Comprobante/cfdi:Impuestos/cfdi:Retenciones/cfdi:Retencion">
                                        <tr>
                                            <td><xsl:value-of select="@Impuesto"/></td>
                                            <td>Retención</td>
                                            <td class="text-right">-</td>
                                            <td class="text-right">-</td>
                                            <td class="text-right">$<xsl:value-of select="format-number(@Importe, '#,##0.00')"/></td>
                                        </tr>
                                    </xsl:for-each>
                                </tbody>
                            </table>
                        </div>
                    </xsl:if>

                    <!-- TOTALES -->
                    <div class="totals">
                        <table>
                            <tr>
                                <td><strong>Subtotal:</strong></td>
                                <td class="text-right">$<xsl:value-of select="format-number(cfdi:Comprobante/@SubTotal, '#,##0.00')"/></td>
                            </tr>
                            <xsl:if test="cfdi:Comprobante/@Descuento">
                                <tr>
                                    <td><strong>Descuento:</strong></td>
                                    <td class="text-right">-$<xsl:value-of select="format-number(cfdi:Comprobante/@Descuento, '#,##0.00')"/></td>
                                </tr>
                            </xsl:if>
                            <xsl:if test="cfdi:Comprobante/cfdi:Impuestos/@TotalImpuestosRetenidos">
                                <tr>
                                    <td><strong>Retenciones:</strong></td>
                                    <td class="text-right">-$<xsl:value-of select="format-number(cfdi:Comprobante/cfdi:Impuestos/@TotalImpuestosRetenidos, '#,##0.00')"/></td>
                                </tr>
                            </xsl:if>
                            <xsl:if test="cfdi:Comprobante/cfdi:Impuestos/@TotalImpuestosTrasladados">
                                <tr>
                                    <td><strong>Impuestos Trasladados:</strong></td>
                                    <td class="text-right">$<xsl:value-of select="format-number(cfdi:Comprobante/cfdi:Impuestos/@TotalImpuestosTrasladados, '#,##0.00')"/></td>
                                </tr>
                            </xsl:if>
                            <tr class="total-row">
                                <td><strong>TOTAL:</strong></td>
                                <td class="text-right"><strong>$<xsl:value-of select="format-number(cfdi:Comprobante/@Total, '#,##0.00')"/></strong></td>
                            </tr>
                        </table>
                    </div>

                    <!-- CARTA PORTE 3.1 -->
                    <xsl:if test="cfdi:Comprobante/cfdi:Complemento/cartaporte31:CartaPorte">
                        <div class="section" style="clear: both; margin-top: 20px;">
<!--                            <div class="section-title">CARTA PORTE 3.1</div>-->

                            <xsl:variable name="cartaporte" select="cfdi:Comprobante/cfdi:Complemento/cartaporte31:CartaPorte"/>

<!--                            <div class="info-grid">-->
<!--                                <div class="info-box">-->
<!--                                    <h3>INFORMACIÓN GENERAL</h3>-->
<!--                                    <p><strong>Versión:</strong> <xsl:value-of select="$cartaporte/@Version"/></p>-->
<!--                                    <p><strong>Transporte Internacional:</strong> <xsl:value-of select="$cartaporte/@TranspInternac"/></p>-->
<!--                                    <p><strong>Total Distancia Recorrida:</strong> <xsl:value-of select="$cartaporte/@TotalDistRec"/> km</p>-->
<!--                                    <xsl:if test="$cartaporte/@IdCCP">-->
<!--                                        <p><strong>ID CCP:</strong> <xsl:value-of select="$cartaporte/@IdCCP"/></p>-->
<!--                                    </xsl:if>-->
<!--                                </div>-->

<!--                                <div class="info-box">-->
<!--                                    <h3>MERCANCÍAS</h3>-->
<!--                                    <p><strong>Total de Mercancías:</strong> <xsl:value-of select="$cartaporte/cartaporte31:Mercancias/@NumTotalMercancias"/></p>-->
<!--                                    <p><strong>Peso Bruto Total:</strong> <xsl:value-of select="format-number($cartaporte/cartaporte31:Mercancias/@PesoBrutoTotal, '#,##0.00')"/> <xsl:value-of select="$cartaporte/cartaporte31:Mercancias/@UnidadPeso"/></p>-->
<!--                                </div>-->
<!--                            </div>-->

                            <!-- UBICACIONES -->
<!--                            <h3 style="margin-top: 15px; font-size: 11px; color: #2c3e50;">Ubicaciones</h3>-->
<!--                            <table>-->
<!--                                <thead>-->
<!--                                    <tr>-->
<!--                                        <th>Tipo</th>-->
<!--                                        <th>RFC</th>-->
<!--                                        <th>Fecha/Hora</th>-->
<!--                                        <th>Domicilio</th>-->
<!--                                        <th class="text-right">Distancia</th>-->
<!--                                    </tr>-->
<!--                                </thead>-->
<!--                                <tbody>-->
<!--                                    <xsl:for-each select="$cartaporte/cartaporte31:Ubicaciones/cartaporte31:Ubicacion">-->
<!--                                        <tr>-->
<!--                                            <td><strong><xsl:value-of select="@TipoUbicacion"/></strong></td>-->
<!--                                            <td><xsl:value-of select="@RFCRemitenteDestinatario"/></td>-->
<!--                                            <td><xsl:value-of select="@FechaHoraSalidaLlegada"/></td>-->
<!--                                            <td>-->
<!--                                                <xsl:value-of select="cartaporte31:Domicilio/@Calle"/>,-->
<!--                                                <xsl:value-of select="cartaporte31:Domicilio/@Municipio"/>,-->
<!--                                                <xsl:value-of select="cartaporte31:Domicilio/@Estado"/>,-->
<!--                                                <xsl:value-of select="cartaporte31:Domicilio/@Pais"/>-->
<!--                                                <br/>-->
<!--                                                <small>C.P. <xsl:value-of select="cartaporte31:Domicilio/@CodigoPostal"/></small>-->
<!--                                            </td>-->
<!--                                            <td class="text-right">-->
<!--                                                <xsl:if test="@DistanciaRecorrida">-->
<!--                                                    <xsl:value-of select="@DistanciaRecorrida"/> km-->
<!--                                                </xsl:if>-->
<!--                                            </td>-->
<!--                                        </tr>-->
<!--                                    </xsl:for-each>-->
<!--                                </tbody>-->
<!--                            </table>-->

<!--                            &lt;!&ndash; AUTOTRANSPORTE &ndash;&gt;-->
<!--                            <xsl:if test="$cartaporte/cartaporte31:Mercancias/cartaporte31:Autotransporte">-->
<!--                                <h3 style="margin-top: 15px; font-size: 11px; color: #2c3e50;">Autotransporte</h3>-->
<!--                                <div class="info-grid">-->
<!--                                    <div class="info-box">-->
<!--                                        <h3>VEHÍCULO</h3>-->
<!--                                        <xsl:variable name="vehiculo" select="$cartaporte/cartaporte31:Mercancias/cartaporte31:Autotransporte/cartaporte31:IdentificacionVehicular"/>-->
<!--                                        <p><strong>Placa:</strong> <xsl:value-of select="$vehiculo/@PlacaVM"/></p>-->
<!--                                        <p><strong>Año Modelo:</strong> <xsl:value-of select="$vehiculo/@AnioModeloVM"/></p>-->
<!--                                        <p><strong>Configuración:</strong> <xsl:value-of select="$vehiculo/@ConfigVehicular"/></p>-->
<!--                                        <p><strong>Peso Bruto Vehicular:</strong> <xsl:value-of select="$vehiculo/@PesoBrutoVehicular"/></p>-->
<!--                                    </div>-->
<!--                                    <div class="info-box">-->
<!--                                        <h3>SEGUROS Y PERMISOS</h3>-->
<!--                                        <xsl:variable name="autotransporte" select="$cartaporte/cartaporte31:Mercancias/cartaporte31:Autotransporte"/>-->
<!--                                        <p><strong>Permiso SCT:</strong> <xsl:value-of select="$autotransporte/@PermSCT"/></p>-->
<!--                                        <p><strong>Número Permiso:</strong> <xsl:value-of select="$autotransporte/@NumPermisoSCT"/></p>-->
<!--                                        <xsl:variable name="seguro" select="$autotransporte/cartaporte31:Seguros"/>-->
<!--                                        <p><strong>Aseguradora:</strong> <xsl:value-of select="$seguro/@AseguraRespCivil"/></p>-->
<!--                                        <p><strong>Póliza:</strong> <xsl:value-of select="$seguro/@PolizaRespCivil"/></p>-->
<!--                                    </div>-->
<!--                                </div>-->
<!--                            </xsl:if>-->

                            <!-- FIGURA TRANSPORTE -->
                            <xsl:if test="$cartaporte/cartaporte31:FiguraTransporte/cartaporte31:TiposFigura">
                                <h3 style="margin-top: 15px; font-size: 11px; color: #2c3e50;">Figura de Transporte</h3>
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Tipo Figura</th>
                                            <th>Nombre</th>
                                            <th>RFC</th>
                                            <th>Número de Licencia</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <xsl:for-each select="$cartaporte/cartaporte31:FiguraTransporte/cartaporte31:TiposFigura">
                                            <tr>
                                                <td><xsl:value-of select="@TipoFigura"/></td>
                                                <td><xsl:value-of select="@NombreFigura"/></td>
                                                <td><xsl:value-of select="@RFCFigura"/></td>
                                                <td><xsl:value-of select="@NumLicencia"/></td>
                                            </tr>
                                        </xsl:for-each>
                                    </tbody>
                                </table>
                            </xsl:if>
                        </div>
                    </xsl:if>

                    <!-- TIMBRE FISCAL DIGITAL -->
                    <!-- Buscar el timbre de múltiples formas posibles -->
                    <xsl:variable name="timbre" select="cfdi:Comprobante/cfdi:Complemento/tfd:TimbreFiscalDigital | cfdi:Comprobante/cfdi:Complemento/*[local-name()='TimbreFiscalDigital'] | //tfd:TimbreFiscalDigital | //*[local-name()='TimbreFiscalDigital']"/>

                    <xsl:if test="$timbre">
                        <div class="timbre-section">
                            <h3>TIMBRE FISCAL DIGITAL</h3>
                            <p><strong>UUID:</strong> <xsl:value-of select="$timbre/@UUID"/></p>
                            <p><strong>Fecha de Timbrado:</strong> <xsl:value-of select="$timbre/@FechaTimbrado"/></p>
                            <p><strong>No. Certificado SAT:</strong> <xsl:value-of select="$timbre/@NoCertificadoSAT"/></p>
                            <p><strong>RFC Proveedor Certificación:</strong> <xsl:value-of select="$timbre/@RfcProvCertif"/></p>
                            <p><strong>Versión del Timbre:</strong> <xsl:value-of select="$timbre/@Version"/></p>
                        </div>
                    </xsl:if>

                    <!-- SELLOS DIGITALES -->
                    <div class="section">
                        <!-- Sello del CFDI desde el timbre -->
                        <xsl:if test="$timbre/@SelloCFD">
                            <p style="font-size: 9px; color: #666; margin-top: 10px; margin-bottom: 10px;">
                                <strong>Sello Digital del CFDI (Timbre):</strong><br/>
                                <span style="word-break: break-all; display: block; margin-top: 5px; font-family: monospace;">
                                    <xsl:value-of select="$timbre/@SelloCFD"/>
                                </span>
                            </p>
                        </xsl:if>

                        <!-- Sello del SAT desde el timbre -->
                        <xsl:if test="$timbre/@SelloSAT">
                            <p style="font-size: 9px; color: #666; margin-top: 10px; margin-bottom: 10px;">
                                <strong>Sello Digital del SAT:</strong><br/>
                                <span style="word-break: break-all; display: block; margin-top: 5px; font-family: monospace;">
                                    <xsl:value-of select="$timbre/@SelloSAT"/>
                                </span>
                            </p>
                        </xsl:if>

                        <!-- Sello del Emisor desde el comprobante -->
                        <xsl:if test="cfdi:Comprobante/@Sello">
                            <p style="font-size: 9px; color: #666; margin-top: 10px; margin-bottom: 10px;">
                                <strong>Sello Digital del Emisor:</strong><br/>
                                <span style="word-break: break-all; display: block; margin-top: 5px; font-family: monospace;">
                                    <xsl:value-of select="cfdi:Comprobante/@Sello"/>
                                </span>
                            </p>
                        </xsl:if>

                        <p style="font-size: 9px; color: #666; margin-top: 5px;">
                            <strong>No. Certificado del Emisor:</strong> <xsl:value-of select="cfdi:Comprobante/@NoCertificado"/>
                        </p>
                    </div>

                    <!-- FOOTER -->
                    <div class="footer">
                        <p>Este documento es una representación impresa de un CFDI</p>
                        <p>Para verificar la validez del comprobante, consulte el portal del SAT</p>
                    </div>
                </div>
            </body>
        </html>
    </xsl:template>

</xsl:stylesheet>

