const xlsx = require('xlsx');
const fs = require('fs');

// Función para cargar y convertir el archivo CSV de transacciones
const obtenerTn = () => {
    const excel = xlsx.readFile("./ventas.csv");
    const nombreHoja = excel.SheetNames[0]; // Suponemos que hay una sola hoja en el archivo

    const datos = xlsx.utils.sheet_to_json(excel.Sheets[nombreHoja], {
        cellDates: true
    });

    // Mapear los datos a un formato específico
    const datosImp = datos
        .filter(dato => dato['Estado del pago'] !== 'Pendiente' && dato['Estado del pago'] !== undefined)
        .map(dato => ({
            'Número de orden': dato['Número de orden'],
            'Estado del pago': dato['Estado del pago'],
            'Nombre del comprador': dato['Nombre del comprador'],
            'Medio de pago': dato['Medio de pago'],
            'Notas del vendedor': dato['Notas del vendedor'],
            'Identificador de la transacción en el medio de pago': dato['Identificador de la transacción en el medio de pago']
        }));

    return datosImp;
}

// Función para cargar y convertir el archivo CSV de Mercado Pago
const obtenerMp = () => {
    const excel = xlsx.readFile("./ventasMp.csv");
    const nombreHoja = excel.SheetNames[0]; // Suponemos que hay una sola hoja en el archivo

    const datos = xlsx.utils.sheet_to_json(excel.Sheets[nombreHoja], {
        cellDates: true
    });

    // Mapear los datos a un formato específico
    const datosImpMp = datos.map((dato) => ({
        'Número de operación de Mercado Pago': Number(dato['NÃºmero de operaciÃ³n de Mercado Pago (operation_id)']),
        'Valor del producto': Number(dato['Valor del producto (transaction_amount)']),
        'Tarifa de Mercado Pago': Number(dato['Tarifa de Mercado Pago (mercadopago_fee)']),
        'Comisión por uso de plataforma de terceros': Number(dato['ComisiÃ³n por uso de plataforma de terceros (marketplace_fee)']),
        'Monto recibido': Number(dato['Monto recibido (net_received_amount)']),
        'Cuotas (installments)': Number(dato['Cuotas (installments)']),
        'Costos de financiación (financing_fee)': Number(dato['Costos de financiaciÃ³n (financing_fee)'])
    }));

    return datosImpMp;
}

// Función para revisar las "Notas del vendedor" y actualizar el identificador de la transacción en el medio de pago
const eliminarNotas = () => {
    const datoTn = obtenerTn();

    const regex = /\b\d{11}\b/;

    const datosActualizados = datoTn.map(dato => {
        const notas = String(dato['Notas del vendedor']); // Asegurarse de que notas es un string
        const match = notas.match(regex);

        if (match) {
            dato['Identificador de la transacción en el medio de pago'] = match[0];
        }

        return dato;
    });

    return datosActualizados;
}

// Función para cruzar la información de ambos arreglos y guardarlos en un tercer arreglo definitivo
const cruzarInfo = () => {
    const datosActualizados = eliminarNotas();
    const datosMp = obtenerMp();

    const datosCruzados = datosActualizados.map(dato => {
        const identificador = parseInt(dato['Identificador de la transacción en el medio de pago'], 10);

        const datosMpEncontrado = datosMp.find(mp => mp['Número de operación de Mercado Pago'] === identificador);

        if (datosMpEncontrado) {
            const valorProducto = Math.abs(datosMpEncontrado['Valor del producto']);
            const tarifaMercadoPago = Math.abs(datosMpEncontrado['Tarifa de Mercado Pago']);
            const comisionTerceros = Math.abs(datosMpEncontrado['Comisión por uso de plataforma de terceros']);
            const costosFinanciacion = Math.abs(datosMpEncontrado['Costos de financiación (financing_fee)']);
            const impuestoDebitoCredito = valorProducto * 0.006;
            const sirtac = valorProducto * 0.001;
            const montoRecibido = datosMpEncontrado['Monto recibido'];

            // Calcular el Impuesto IIBB
            const impuestoIIBB = valorProducto - montoRecibido - costosFinanciacion - tarifaMercadoPago - impuestoDebitoCredito - sirtac - comisionTerceros;

            return {
                'Pedido': dato['Número de orden'],
                //'Estado del pago': dato['Estado del pago'],
                'Nombre': dato['Nombre del comprador'],
                'Medio de pago': dato['Medio de pago'],
                //'Identificador de la transacción en el medio de pago': dato['Identificador de la transacción en el medio de pago'],
                'Precio Venta': valorProducto,
                'Interes Cuota': costosFinanciacion,
                'Cargo de Mercado Pago': tarifaMercadoPago,
                'Comisión de terceros': comisionTerceros,
                'Impuesto IIBB': impuestoIIBB,
                // 'Monto recibido': montoRecibido,
                //'Cuotas (installments)': datosMpEncontrado['Cuotas (installments)'],
                'Impuesto IIBB regimen SIRTAC': sirtac,
                'Impuesto debito/credito': impuestoDebitoCredito,
            };
        } else {
            return {
                'Pedido': dato['Número de orden'],
                'Estado del pago': dato['Estado del pago'],
                'Nombre': dato['Nombre del comprador'],
                'Medio de pago': dato['Medio de pago'],
                'Identificador de la transacción en el medio de pago': dato['Identificador de la transacción en el medio de pago']
            };
        }
    });

    return datosCruzados;
}

// Función para guardar los datos cruzados en un archivo Excel
const guardarEnExcel = (datos, nombreArchivo) => {
    const hoja = xlsx.utils.json_to_sheet(datos);
    const libro = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(libro, hoja, 'Datos Cruzados');

    xlsx.writeFile(libro, nombreArchivo);
}

// Ejemplo de uso
const datosFinales = cruzarInfo();
guardarEnExcel(datosFinales, 'datos_cruzados.xlsx');
console.log('Archivo Excel guardado como datos_cruzados.xlsx');
