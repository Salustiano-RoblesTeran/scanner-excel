const xlsx = require('xlsx');

// Función para cargar y convertir el archivo CSV de transacciones
const convertirTn = () => {
    const excel = xlsx.readFile("./ventasTn.csv");
    const nombreHoja = excel.SheetNames[0]; // Suponemos que hay una sola hoja en el archivo

    const datos = xlsx.utils.sheet_to_json(excel.Sheets[nombreHoja], {
        cellDates: true
    });

    // Mapear los datos a un formato específico
    const datosImp = datos.map((dato) => ({
        'numero de orden': dato['Número de orden'],
        'Estado del pago': dato['Estado del pago'],
        'Nombre del comprador': dato['Nombre del comprador'],
        'Medio de pago': dato['Medio de pago'],
        'Notas del vendedor': dato['Notas del vendedor'],
        'Identificador de la transacción en el medio de pago': dato['Identificador de la transacción en el medio de pago']
    }));

    return datosImp;
}

// Función para cargar y convertir el archivo CSV de Mercado Pago
const convertirMp = () => {
    const excel = xlsx.readFile("./ventasMp.csv");
    const nombreHoja = excel.SheetNames[0]; // Suponemos que hay una sola hoja en el archivo

    const datos = xlsx.utils.sheet_to_json(excel.Sheets[nombreHoja], {
        cellDates: true
    });

    // Mapear los datos a un formato específico
    const datosImpMp = datos.map((dato) => ({
        'Número de operación de Mercado Pago': dato['NÃºmero de operaciÃ³n de Mercado Pago (operation_id)'],
        'Valor del producto': dato['Valor del producto (transaction_amount)'],
        'Tarifa de Mercado Pago': dato['Tarifa de Mercado Pago (mercadopago_fee)'],
        'Comisión por uso de plataforma de terceros': dato['ComisiÃ³n por uso de plataforma de terceros (marketplace_fee)'],
        'Monto recibido': dato['Monto recibido (net_received_amount)'],
        'Cuotas (installments)': dato['Cuotas (installments)'],
        'Costos de financiación (financing_fee)': dato['Costos de financiaciÃ³n (financing_fee)']
    }));

    return datosImpMp;
}

// Función principal para comparar los datos
const compararDatos = () => {
    const datosImp = convertirTn();
    const datosImpMp = convertirMp();

    // Recorrer los datos y comparar
    datosImp.forEach((datoTn) => {
        const idTransaccionTn = datoTn['Identificador de la transacción en el medio de pago'];
        
        // Buscar la correspondiente transacción en Mercado Pago
        const datoMp = datosImpMp.find((dato) => {
            const numeroOperacionMp = dato['Número de operación de Mercado Pago'];
            return numeroOperacionMp === idTransaccionTn;
        });

        if (datoMp) {
            // Aquí puedes realizar cualquier acción con los datos encontrados
            console.log(`Coincidencia encontrada para ID: ${idTransaccionTn}`);
            console.log('Datos de transacción en TN:', datoTn);
            console.log('Datos de transacción en Mercado Pago:', datoMp);
            console.log('---');
        } else {
            console.log(`No se encontró coincidencia para ID: ${idTransaccionTn}`);
        }
    });
}


// Ejecutar la comparación
compararDatos();


let mp = 'https://www.mercadopago.com.ar/balance/reports/collection';