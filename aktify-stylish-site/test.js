// Встроенный модуль Node.js для работы с шифрованием
const crypto = require('crypto');

// 1. Конфигурация
const ACCESS_KEY = '1b34c793-f3ae-4721-82ed-0581a0abcf6d'; 
const SECRET_KEY = 'ZCbtytGxpsV5j6EZvjmbzPgeZVU40if3';
const API_URL = 'https://payapi.ozon.ru/v1/createOrder';
const extId = '4037';
const fiscalizationType = 'FISCAL_TYPE_SINGLE';
const amount = { 
  currencyCode: '643', 
  value: '84000' // С копейками для строгой валидации шлюза
}; 
const paymentAlgorithm = 'PAY_ALGO_SMS';

// Формирование строки для подписи (fingerprint)
const fingerprint = `${ACCESS_KEY}${extId}${fiscalizationType}${paymentAlgorithm}${amount.currencyCode}${amount.value}${SECRET_KEY}`; 

// 2. СИНХРОННАЯ функция генерации SHA-256
function sha256(message) {
  return crypto
    .createHash('sha256')
    .update(message, 'utf8')
    .digest('hex');
}

// 3. Основная функция для отправки тестового запроса
async function createTestPayment() {
  
  // Вычисляем подпись синхронно
  const requestSign = sha256(fingerprint);
  
  console.log("--- Лог отладки параметров ---");
  console.log("Строка для подписи:", fingerprint);
  console.log("Вычисленная подпись:", requestSign);
  console.log("------------------------------\n");

  // Тело запроса к Ozon Pay
  const ozonRequestBody = {
    "accessKey": ACCESS_KEY,
    "amount": {
      "currencyCode": amount.currencyCode,
      "value": amount.value
    },
    "deliverySettings": {
      "isEnabled": true
    },
    "enableFiscalization": true,
    "extData": {
      "property1": "string",
      "property2": "string"
    },
    "extId": extId,
    "failUrl": "https://aktify.ru",
    "fiscalizationPhone": "79824552425", // Изменено: телефон без знака "+"
    "fiscalizationType": fiscalizationType,
    "items": [
      {
        "extId": extId,
        "name": "Головоломка Мудрец механики. Подарок мужчине. Классическая задача - крутить гайки в стесненных условиях",
        "price": {
          "currencyCode": amount.currencyCode,
          "value": "84000"
        },
        "quantity": 1,
        "type": "TYPE_PRODUCT",
        "sku": "1695005157", // Изменено: обернуто в кавычки (строка)
        "vat": "VAT_NONE" // Изменено: стандартное значение "Без НДС"
      }
    ],
    "mode": "MODE_FULL",
    "paymentAlgorithm": paymentAlgorithm,
    "requestSign": requestSign,
    "successUrl": "https://aktify.ru"
  };

  const bodyString = JSON.stringify(ozonRequestBody);
 
  try {
    console.log('Отправка запроса в Ozon Pay...');
 
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: bodyString
    });

    const data = await response.json();

    if (!response.ok) {
      console.log('\n❌ --- ПОДРОБНЫЙ АНАЛИЗ ОШИБКИ ВАЛИДАЦИИ ---');
      console.log('Статус ответа сервера:', response.status);
      console.log('Основное сообщение:', data.message);
      
      // Принудительно разворачиваем структуру нарушений (violations)
      if (data.details && data.details.length > 0) {
        data.details.forEach((detail, index) => {
          if (detail.violations && Array.isArray(detail.violations)) {
            console.log(`\nНарушение #${index + 1}:`);
            detail.violations.forEach((v, vIndex) => {
              console.log(`  [${vIndex + 1}] Поле с ошибкой:`, v.field || 'Не указано');
              console.log(`      Описание ошибки:`, v.description || v.message || 'Нет описания');
            });
          } else {
            console.log(`Детали #${index + 1}:`, JSON.stringify(detail));
          }
        });
      } else {
        console.log('Массив details пуст. Полный сырой ответ:', JSON.stringify(data));
      }
      console.log('-------------------------------------------\n');
      return;
    }

    console.log('Успех! Ответ от Ozon Pay:', data);
    
  } catch (error) {
    console.error('Системная ошибка при отправке запроса:', error.message);
  }
}

// Запуск главной функции
createTestPayment();
