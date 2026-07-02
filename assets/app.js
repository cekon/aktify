// ==========================================
// 1. КАТАЛОГ ТОВАРОВ И SKU (СТРОГО КАК В OZON SELLER)
// ==========================================
const productsConfig = [
  {
    id: 'product1',
    ozon_sku: '123456789', // Замените на ваш реальный SKU с Озона
    title: 'Крутить гайки в стесненных условиях',
    price: 1201, 
    priceText: '1201 ₽',
    desc: 'Подарок для человека, который любит разбираться, пробовать разные углы и не сдается после первой попытки. Задача кажется простой, но быстро превращается в настоящий механический вызов.',
    images: [
      "assets/products/nuts-1.jpg",
      "assets/products/nuts-2.jpg",
      "assets/products/nuts-3.jpg"
    ]
  },
  {
    id: 'product2',
    ozon_sku: '987654321', // Замените на ваш реальный SKU с Озона
    title: 'Авторская задача: надеть кольцо',
    price: 990,
    priceText: '990 ₽',
    desc: 'Лучший выбор для любителей логики и вау-эффекта. Получатель видит кольцо и бутылку, понимает цель — но решение придется заслужить вниманием, терпением и нестандартным мышлением.',
    images: [
      "assets/products/ring-1.jpg",
      "assets/products/ring-2.jpg"
    ]
  },
  {
    id: 'product3',
    ozon_sku: '555444333', // Замените на ваш реальный SKU с Озона
    title: 'Интеллектуальный конверт',
    price: 1000,
    priceText: '1000 ₽',
    desc: 'Когда деньги хочется подарить красиво, а не просто в конверте. Спрячьте вложение внутри: сначала человек решает задачу, потом получает награду.',
    images: [
      "assets/products/envelope-1.jpg"
    ]
  }
];

// ССЫЛКА НА ВАШ РАБОЧИЙ CLOUDFLARE WORKER
const WORKER_URL = "https://ozon-pay.floral-base-69f9.workers.dev"; // Замените на вашу ссылку

// ==========================================
// 2. БАЗОВАЯ ЛОГИКА МЕНЮ И КУКИ
// ==========================================
const nav = document.querySelector('.nav');
const menuBtn = document.querySelector('.menu-btn');
if (menuBtn && nav) menuBtn.addEventListener('click', () => nav.classList.toggle('open'));

const cookieBlock = document.querySelector('.cookie');
const cookieBtn = document.querySelector('.cookie button');
if (cookieBlock && cookieBtn) {
  if (localStorage.getItem("cookieAccepted") === "true") {
    cookieBlock.style.display = "none";
  } else {
    cookieBlock.style.display = "flex";
  }
  cookieBtn.addEventListener("click", () => {
    localStorage.setItem("cookieAccepted", "true");
    cookieBlock.style.opacity = "0";
    setTimeout(() => { cookieBlock.style.display = "none"; }, 300);
  });
}

const modal = document.querySelector('#productModal');

// Функция генерации красивых бело-золотых заглушек
function getPlaceholderSvg(text) {
  return `data:image/svg+xml;utf8,<svg xmlns="http://w3.org" width="100%" height="100%" viewBox="0 0 400 400"><rect width="100%" height="100%" fill="%23fffcf5"/><circle cx="200" cy="180" r="50" fill="none" stroke="%23e8dbca" stroke-width="2"/><path d="M150 280 L200 210 L250 280" fill="none" stroke="%23e8dbca" stroke-width="2"/><text x="50%" y="85%" dominant-baseline="middle" text-anchor="middle" font-family="system-ui,sans-serif" font-size="14" fill="%23c97917">${encodeURIComponent(text)}</text></svg>`;
}

// ==========================================
// 3. ФУНКЦИЯ ОТКРЫТИЯ ОКНА И СВЯЗИ С ОРИГИНАЛЬНОЙ ГАЛЕРЕЕЙ
// ==========================================
function openGallery(p) {
  if (!modal) return;

  const mediaList = p.images || [];
  
  // Наполняем базовые текстовые данные в правой колонке оферты
  const modalTitle = modal.querySelector('.modal-copy h2');
  const modalDesc = modal.querySelector('.modal-desc');
  if (modalTitle) modalTitle.textContent = p.title;
  if (modalDesc) modalDesc.textContent = p.desc;

  // Наполняем скрытые теги внутри блока .gallery-caption (для совместимости)
  const galleryTitle = modal.querySelector('.gallery-title');
  const galleryDesc = modal.querySelector('.gallery-desc');
  if (galleryTitle) galleryTitle.textContent = p.title;
  if (galleryDesc) galleryDesc.textContent = p.desc;

  // Настраиваем блок покупки (Цена + Селектор количества + Кнопка воркера)
  let buyContainer = modal.querySelector('#modal-buy-container');
  if (!buyContainer) buyContainer = modal.querySelector('.buy-row');

  if (buyContainer) {
    buyContainer.innerHTML = `
      <strong class="modal-price" id="dynamic-price">${p.priceText}</strong>
      <div class="qty-selector">
        <button type="button" class="qty-btn" id="qty-minus">−</button>
        <input type="number" id="modal-qty" value="1" min="1" readonly>
        <button type="button" class="qty-btn" id="qty-plus">+</button>
      </div>
      <a class="btn primary" id="checkout-link" href="#">Купить с доставкой Ozon</a>
    `;

    const qtyInput = buyContainer.querySelector('#modal-qty');
    const priceElement = buyContainer.querySelector('#dynamic-price');
    const checkoutLink = buyContainer.querySelector('#checkout-link');
    
    // Функция автоматического пересчета стоимости
    function updatePriceAndLink() {
      const qty = parseInt(qtyInput.value) || 1;
      const totalPrice = p.price * qty;
      
      if (priceElement) {
        priceElement.textContent = `${totalPrice.toLocaleString('ru-RU')} ₽`;
      }
      if (checkoutLink) {
        checkoutLink.href = `${WORKER_URL}/?item=${p.id}&qty=${qty}`;
      }
    }

    buyContainer.querySelector('#qty-minus').addEventListener('click', (e) => {
      e.preventDefault(); e.stopPropagation();
      if (qtyInput.value > 1) {
        qtyInput.value = parseInt(qtyInput.value) - 1;
        updatePriceAndLink();
      }
    });

    buyContainer.querySelector('#qty-plus').addEventListener('click', (e) => {
      e.preventDefault(); e.stopPropagation();
      qtyInput.value = parseInt(qtyInput.value) + 1;
      updatePriceAndLink();
    });

    updatePriceAndLink(); // Первичный расчет при открытии карточки
  }

  // СВЯЗЫВАЕМ С ОРИГИНАЛЬНЫМИ КЛАССАМИ ГАЛЕРЕИ ИЗ ВАШЕГО PDF
  const thumbsBox = modal.querySelector('.gallery-thumbs');
  const mainImg = modal.querySelector('.gallery-img'); // Исправлено: ищем .gallery-img вместо #mainImage
  const videoEl = modal.querySelector('.gallery-video');

  if (thumbsBox && mainImg) {
    thumbsBox.innerHTML = ""; // Полностью очищаем старые миниатюры
    if (videoEl) videoEl.style.display = "none"; // Прячем видео по умолчанию
    mainImg.style.display = "block";

    if (mediaList.length === 0) {
      mainImg.src = getPlaceholderSvg(p.title);
    } else {
      // Инициализируем главное окно первой картинкой товара
      mainImg.src = mediaList[0];
      mainImg.style.opacity = '1';
      mainImg.onerror = () => { mainImg.src = getPlaceholderSvg('Изображение товара'); };

      // Генерируем оригинальные миниатюры со стилем .thumb
      mediaList.forEach((src, index) => {
        const thumbDiv = document.createElement('div');
        thumbDiv.className = 'thumb'; // Родной класс миниатюры из вашего CSS
        if (index === 0) thumbDiv.classList.add('active'); // Подсвечиваем активную рамку

        const thumbImg = document.createElement('img');
        thumbImg.src = src;
        thumbImg.onerror = () => { thumbImg.src = getPlaceholderSvg('Ошибка'); };

        thumbDiv.appendChild(thumbImg);

        // Интерактивное переключение медиафайлов
        thumbDiv.addEventListener('click', (e) => {
          e.stopPropagation();
          thumbsBox.querySelectorAll('.thumb').forEach(el => el.classList.remove('active'));
          thumbDiv.classList.add('active');
          
          mainImg.style.opacity = '0.3';
          setTimeout(() => {
            mainImg.src = src;
            mainImg.style.opacity = '1';
          }, 100);
        });

        thumbsBox.appendChild(thumbDiv);
      });
    }
  }

  modal.showModal(); // Открываем всплывающее окно
}

// ==========================================
// 4. ГЛОБАЛЬНЫЙ ПЕРЕХВАТЧИК КЛИКОВ ПО КАРТОЧКАМ
// ==========================================
document.addEventListener('click', (event) => {
  const card = event.target.closest('.product-card');
  if (!card) return;
  if (card.dataset.product === undefined) return;
  
  const productData = productsConfig[card.dataset.product];
  if (productData) {
    openGallery(productData);
  }
});

// Закрытие окна на крестик
if (modal) {
  const closeBtn = modal.querySelector('.close');
  if (closeBtn) closeBtn.addEventListener('click', () => modal.close());
}
// ==========================================================================
// АВТОМАТИЧЕСКАЯ ЗАГРУЗКА ЦЕН В КАТАЛОГ НА ГЛАВНОЙ СТРАНИЦЕ
// ==========================================================================
// ==========================================================================
// ИСПРАВЛЕННАЯ АВТОЗАГРУЗКА ЦЕН (БЕЗ СЛОМА ОРИГИНАЛЬНЫХ СТИЛЕЙ)
// ==========================================================================
function loadCatalogPrices() {
  const catalogCards = document.querySelectorAll('.product-grid .product-card');
  
  catalogCards.forEach(card => {
    const productIndex = card.dataset.product;
    
    if (productIndex !== undefined && productsConfig[productIndex]) {
      const productData = productsConfig[productIndex];
      
      // Ищем обычный тег strong внутри подвала карточки товара
      const priceField = card.querySelector('.card-footer strong');
      if (priceField) {
        priceField.textContent = productData.priceText;
      }
    }
  });
}

// Запускаем функцию вывода цен
document.addEventListener('DOMContentLoaded', loadCatalogPrices);
loadCatalogPrices();

