import crypto from 'crypto';

// Хеширование через встроенный модуль криптографии Node.js
function sha256(message) {
  return crypto.createHash('sha256').update(message, 'utf-8').digest('hex');
}

export default async function handler(req, res) {
  // Настройка CORS-заголовков
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*", // При желании замените на "https://aktify.ru"
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  // Добавляем CORS-заголовки к ответу Vercel
  Object.entries(corsHeaders).forEach(([key, value]) => res.setHeader(key, value));

  // Обработка Preflight-запроса OPTIONS
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Запрет всех методов кроме POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    // В Vercel тело запроса (JSON) уже автоматически распарсено в req.body
    const clientData = req.body;
    const orderId = clientData.orderId;
    const itemSku = clientData.sku;
    const itemQty = parseInt(clientData.quantity) || 1;

    // ЗАЩИЩЕННЫЙ КАТАЛОГ С ЦЕНАМИ
    const productsCatalog = {
      "1695005157": {
        name: "Головоломка Мудрец механики. Подарок мужчине. Классическая задача - крутить гайки в стесненных условиях",
        price: 990
      },
      "1964500027": {
        name: "Авторская головоломка. Мудрец механики. Задача: надеть кольцо",
        price: 1090
      },
      "2138645678": {
        name: "Головоломка Мудрец Механики. Оригинальный подарок мужчине Задача на логику и смекалку",
        price: 990
      }
    };

    const product = productsCatalog[itemSku];
    if (!product) {
      return res.status(400).json({ error: "Товар не найден в каталоге воркера" });
    }

    // Математический расчет стоимости (защита от подмены цен)
    const totalAmountValue = String(product.price * itemQty * 100); 
    const singlePriceValue = String(product.price * 100);

    // Сдвиг времени вперед на 20 минут
    const date = new Date();
    date.setMinutes(date.getMinutes() + 20); 
    const expiresAt = date.toISOString(); 

    // В Vercel переменные окружения берутся из process.env вместо env.*
    const ACCESS_KEY = process.env.OZON_ACCESS_KEY; 
    const SECRET_KEY = (process.env.OZON_SECRET_KEY || '').trim();
    
    const API_URL = 'https://payapi.ozon.ru/v1/createOrder';
    const fiscalizationType = 'FISCAL_TYPE_SINGLE';
    const paymentAlgorithm = 'PAY_ALGO_SMS';
    const currencyCode = '643';

    // Формирование сигнатуры
    const fingerprint = `${ACCESS_KEY}${expiresAt}${orderId}${fiscalizationType}${paymentAlgorithm}${currencyCode}${totalAmountValue}${SECRET_KEY}`; 
    const requestSign = sha256(fingerprint);

    // Формирование тела запроса к Ozon Pay
    const ozonRequestBody = {
      "accessKey": ACCESS_KEY,
      "amount": { "currencyCode": currencyCode, "value": totalAmountValue },
      "deliverySettings": { "isEnabled": true },
      "enableFiscalization": true,
      "expiresAt": expiresAt,
      "extId": orderId,
      "failUrl": "https://aktify.ru",
      "fiscalizationType": fiscalizationType,
      "items": [
        {
          "extId": orderId,
          "name": product.name,
          "price": { "currencyCode": currencyCode, "value": singlePriceValue },
          "quantity": itemQty,
          "type": "TYPE_PRODUCT",
          "sku": itemSku,
          "vat": "VAT_NONE" 
        }
      ],
      "mode": "MODE_FULL",
      "paymentAlgorithm": paymentAlgorithm,
      "requestSign": requestSign, 
      "successUrl": "https://aktify.ru"
    };

    // Запрос в платежный шлюз Ozon Pay
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ozonRequestBody)
    });

    const data = await response.json();
    
    // Возвращаем успешный ответ клиенту
    return res.status(200).json(data);

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
