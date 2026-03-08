// ============================================================================
// GOOGLE APPS SCRIPT PARA SISTEMA DE PEDIDOS LA MORENA
// ============================================================================
// Este código debe copiarse en Google Apps Script
// Instrucciones completas en el archivo INSTRUCCIONES.txt
// VERSIÓN ACTUALIZADA: Soporta Opción 3 (Solo Sopa), Exportar PDF/Excel

// ID de tu Google Spreadsheet (obténlo de la URL de tu hoja de cálculo)
const SPREADSHEET_ID = 'TU_SPREADSHEET_ID_AQUI';

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;
    
    if (action === 'saveMenu') {
      return saveMenu(data.day, data.menu);
    } else if (action === 'saveOrder') {
      return saveOrder(data.order);
    } else if (action === 'getMenus') {
      return getMenus();
    } else if (action === 'getOrders') {
      return getOrders();
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: 'Acción no válida'
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  try {
    const action = e.parameter.action;
    
    if (action === 'getMenus') {
      return getMenus();
    } else if (action === 'getOrders') {
      return getOrders();
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: 'Acción no válida'
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// ============================================================================
// FUNCIONES PARA MENÚS
// Ahora incluye columna "Precio Opción 3 (Solo Sopa)"
// ============================================================================

function saveMenu(day, menuData) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName('Menus');
  
  // Crear la hoja si no existe
  if (!sheet) {
    sheet = ss.insertSheet('Menus');
    sheet.appendRow([
      'Día', 'Sopa', 'Segundo 1', 'Segundo 2', 'Segundo 3', 'Saludable',
      'Precio Completo', 'Precio Segundo', 'Precio Opción 3',
      'Última Actualización'
    ]);
  }
  
  // Buscar si ya existe el día
  const data = sheet.getDataRange().getValues();
  let rowIndex = -1;
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === day) {
      rowIndex = i + 1;
      break;
    }
  }
  
  const newRow = [
    day,
    menuData.sopa,
    menuData.segundo1,
    menuData.segundo2,
    menuData.segundo3 || '',
    menuData.saludable,
    menuData.precioCompleto,
    menuData.precioSegundo,
    menuData.precioOpcion3 || 15,
    new Date().toLocaleString('es-ES')
  ];
  
  if (rowIndex !== -1) {
    sheet.getRange(rowIndex, 1, 1, newRow.length).setValues([newRow]);
  } else {
    sheet.appendRow(newRow);
  }
  
  return ContentService.createTextOutput(JSON.stringify({
    status: 'success',
    message: 'Menú guardado correctamente'
  })).setMimeType(ContentService.MimeType.JSON);
}

function getMenus() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('Menus');
  
  if (!sheet) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      data: {}
    })).setMimeType(ContentService.MimeType.JSON);
  }
  
  const data = sheet.getDataRange().getValues();
  const menus = {};
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    menus[row[0]] = {
      sopa: row[1],
      segundo1: row[2],
      segundo2: row[3],
      segundo3: row[4] || '',
      saludable: row[5],
      precioCompleto: parseFloat(row[6]),
      precioSegundo: parseFloat(row[7]),
      precioOpcion3: parseFloat(row[8]) || 15
    };
  }
  
  return ContentService.createTextOutput(JSON.stringify({
    status: 'success',
    data: menus
  })).setMimeType(ContentService.MimeType.JSON);
}

// ============================================================================
// FUNCIONES PARA PEDIDOS
// Ahora incluye soporte para Opción 3 (Solo Sopa)
// ============================================================================

function saveOrder(order) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName('Pedidos');
  
  // Crear la hoja si no existe
  if (!sheet) {
    sheet = ss.insertSheet('Pedidos');
    sheet.appendRow([
      'ID', 'Nombre', 'Día', 'Hora', 'Tipo Menú',
      'Sopa', 'Pedido', 'Método Pago', 'Precio (Bs)', 'Fecha Registro'
    ]);
  }
  
  const paymentMethodText = order.paymentMethod === 'qr' ? 'Pago por QR' : order.paymentMethod === 'porpagar' ? 'Por Pagar' : 'Efectivo en Caja';
  
  let tipoMenu;
  if (order.menuType === 'completo') tipoMenu = 'Menú Completo';
  else if (order.menuType === 'segundo') tipoMenu = 'Solo Segundo';
  else tipoMenu = 'Opción 3 - Solo Sopa';
  
  sheet.appendRow([
    order.id,
    order.name,
    order.day,
    order.time,
    tipoMenu,
    order.sopa || 'N/A',
    order.segundo,
    paymentMethodText,
    order.price,
    order.date
  ]);
  
  return ContentService.createTextOutput(JSON.stringify({
    status: 'success',
    message: 'Pedido guardado correctamente'
  })).setMimeType(ContentService.MimeType.JSON);
}

function getOrders() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('Pedidos');
  
  if (!sheet) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      data: []
    })).setMimeType(ContentService.MimeType.JSON);
  }
  
  const data = sheet.getDataRange().getValues();
  const orders = [];
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    let menuType;
    if (row[4] === 'Menú Completo') menuType = 'completo';
    else if (row[4] === 'Solo Segundo') menuType = 'segundo';
    else menuType = 'opcion3';
    
    let payMethod;
    if (row[7] === 'Pago por QR') payMethod = 'qr';
    else if (row[7] === 'Por Pagar') payMethod = 'porpagar';
    else payMethod = 'efectivo';
    
    orders.push({
      id: row[0],
      name: row[1],
      day: row[2],
      time: row[3],
      menuType: menuType,
      sopa: row[5] !== 'N/A' ? row[5] : null,
      segundo: row[6],
      paymentMethod: payMethod,
      price: parseFloat(row[8]),
      date: row[9]
    });
  }
  
  return ContentService.createTextOutput(JSON.stringify({
    status: 'success',
    data: orders
  })).setMimeType(ContentService.MimeType.JSON);
}
