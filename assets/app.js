// ==========================================
// 1. КАТАЛОГ ТОВАРОВ И SKU (СТРОГО КАК В OZON SELLER)
// ==========================================
const productsConfig = [
  {
    id: 'product1',
    ozon_sku: '1695005157', // Замените на ваш реальный SKU с Озона
    title: '',
	title2: 'Задача: Вынуть все предметы из бутылки, а затем вернуть все в исходное состояние.',
    price: 1201, 
    priceText: '1201 ₽',
    desc: '',
	 desc2: 'Собрать будет труднее чем разобрать. Видеоинструкция по решению головоломки прилагается.',
    images: [
      "img/slide1_2.png",
	  "img/slide1_3.png",
	  "img/rich1_1.png",
     // "img/rich1_2.png",
	  "img/rich1_3.png",
      "img/video1.mp4"
    ]
  },
  {
    id: 'product2',
    ozon_sku: '1964500027', // Замените на ваш реальный SKU с Озона
    title: '',
	title2: 'Задача: вынуть кольцо из бутылки, затем установить обратно.',
    price: 990,
    priceText: '990 ₽',
    desc: '',
	 desc2: 'Лучший выбор для любителей логики и вау-эффекта. Получатель видит кольцо и бутылку, понимает цель — но решение придется заслужить вниманием, терпением и нестандартным мышлением. Видеоинструкция решения прилагается',
    images: [
     "img/slide2_2.png",
	// "img/rich2_1.png",
      "img/rich2_2.png",
	  "img/video2.mp4"
    ]
  },
  {
    id: 'product3',
    ozon_sku: '2138645678', // Замените на ваш реальный SKU с Озона
    title: '',
	title2: 'Надоело дарить деньги в банальных бумажных конвертах?',
    price: 1000,
    priceText: '1000 ₽',
    desc: '',
	desc2: 'Превратите подарок в увлекательное испытание. Именинник получит заслуженную награду только тогда, когда проявит логику, пространственное мышление и терпение.',
    images: [
       "img/rich3_1.png",
      "img/rich3_2.png",
	  "img/video3.mp4"
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
  if (modalTitle) modalTitle.textContent = p.title2;
  if (modalDesc) modalDesc.textContent = p.desc2;

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
       // [ИСПРАВЛЕНО]: Новая функция автоматического пересчета стоимости и отправки POST в Worker
    function updatePriceAndLink() {
      const qty = parseInt(qtyInput.value) || 1;
      const totalPrice = p.price * qty;

      if (priceElement) {
        priceElement.textContent = `${totalPrice.toLocaleString('ru-RU')} ₽`;
      }

      if (checkoutLink) {
        // Убираем стандартный href, чтобы ссылка работала как кнопка
        checkoutLink.removeAttribute('href');
        
        // Вешаем безопасный обработчик на клик
        checkoutLink.onclick = async (e) => {
          e.preventDefault();
          e.stopPropagation();

          // Визуально блокируем кнопку на время генерации ссылки
          const originalText = checkoutLink.textContent;
          checkoutLink.textContent = "Оформление...";
          checkoutLink.style.pointerEvents = "none";

          // Передаем только SKU и количество (Защита от подмены цен!)
          const orderData = {
            orderId: "AKTIFY-" + Date.now(),
            sku: p.ozon_sku,
            quantity: qty
          };

          try {
            const response = await fetch(WORKER_URL, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(orderData)
            });

            const data = await response.json();

            // [ИСПРАВЛЕНО]: Проверяем путь к ссылке согласно реальному ответу Ozon Pay
            if (data && data.order && data.order.payLink) {
              // Перенаправляем пользователя на платежную форму Ozon Pay
              window.location.href = data.order.payLink;
            } else {
              // Если вдруг Ozon изменил структуру или пришла ошибка валидации
              alert('Ошибка платежного шлюза Ozon: ' + (data.message || JSON.stringify(data)));
			//alert('Детали ошибки: ' + JSON.stringify(data.details || data));
              checkoutLink.textContent = originalText;
              checkoutLink.style.pointerEvents = "auto";
            }
          } catch (error) {
            alert('Сетевая ошибка соединения с сервером оплаты.');
            console.error(error);
            checkoutLink.textContent = originalText;
            checkoutLink.style.pointerEvents = "auto";
          }
        };
      }
    }

    // Слушатель для кнопки минус (-)
    buyContainer.querySelector('#qty-minus').addEventListener('click', (e) => {
      e.preventDefault(); e.stopPropagation();
      if (qtyInput.value > 1) {
        qtyInput.value = parseInt(qtyInput.value) - 1;
        updatePriceAndLink();
      }
    });

    // Слушатель для кнопки плюс (+)
    buyContainer.querySelector('#qty-plus').addEventListener('click', (e) => {
      e.preventDefault(); e.stopPropagation();
      qtyInput.value = parseInt(qtyInput.value) + 1;
      updatePriceAndLink();
    });

    updatePriceAndLink(); // Запуск первичного расчета

  }

  // СВЯЗЫВАЕМ С ОРИГИНАЛЬНЫМИ КЛАССАМИ ГАЛЕРЕИ ИЗ ВАШЕГО PDF
    // === НАЧАЛО ИСПРАВЛЕННОЙ ВСТАВКИ ДЛЯ ВИДЕО НА ВЕСЬ ЭКРАН ===
    // =========================================================================
    // НАЧАЛО НОВОЙ ВСТАВКИ (Исправленная версия без синтаксических ошибок)
    // =========================================================================
    const thumbsBox = modal.querySelector('.gallery-thumbs');
    const mainImg = modal.querySelector('.gallery-img');
    const videoEl = modal.querySelector('.gallery-video');
    const galleryStage = modal.querySelector('.gallery-stage');

    let currentMediaIndex = 0;
    let touchStartX = 0;
    let touchEndX = 0;

    function changeMainMedia(index) {
        if (index < 0 || index >= mediaList.length) return;
        currentMediaIndex = index;
        const src = mediaList[index];

        if (thumbsBox) {
            thumbsBox.querySelectorAll('.thumb').forEach((el, idx) => {
                if (idx === index) el.classList.add('active');
                else el.classList.remove('active');
            });
        }

        if (src.endsWith('.mp4')) {
            if (mainImg) mainImg.style.setProperty('display', 'none', 'important');
            if (videoEl) {
                videoEl.style.setProperty('display', 'block', 'important');
                videoEl.src = src;
                videoEl.controls = true;
                videoEl.autoplay = true;
                videoEl.muted = true;
                videoEl.style.width = '100%';
                videoEl.style.height = '100%';
                videoEl.style.objectFit = 'contain';
            }
        } else {
            if (videoEl) {
                videoEl.pause();
                videoEl.style.setProperty('display', 'none', 'important');
            }
            if (mainImg) {
                mainImg.style.setProperty('display', 'block', 'important');
                mainImg.style.opacity = '0.3';
                setTimeout(() => {
                    mainImg.src = src;
                    mainImg.style.opacity = '1';
                }, 100);
            }
        }
    }

    if (galleryStage) {
        galleryStage.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches.screenX;
        }, { passive: true });

        galleryStage.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches.screenX;
            handleSwipe();
        }, { passive: true });
    }

    function handleSwipe() {
        const swipeThreshold = 50;
        if (touchStartX - touchEndX > swipeThreshold) {
            if (currentMediaIndex < mediaList.length - 1) {
                changeMainMedia(currentMediaIndex + 1); // Свайп влево — следующий слайд
            }
        } else if (touchEndX - touchStartX > swipeThreshold) {
            if (currentMediaIndex > 0) {
                changeMainMedia(currentMediaIndex - 1); // ИСПРАВЛЕНО: Свайп вправо — предыдущий слайд
            }
        }
    }

    if (galleryStage && mainImg) {
        galleryStage.onclick = (e) => {
            if (mediaList[currentMediaIndex].endsWith('.mp4')) return;
            e.stopPropagation();
            galleryStage.classList.toggle('fullscreen');
            if (galleryStage.classList.contains('fullscreen')) {
                document.body.style.overflow = 'hidden';
            } else {
                document.body.style.overflow = 'auto';
            }
        };
    }

    if (thumbsBox && (mainImg || videoEl)) {
        thumbsBox.innerHTML = ""; 
        if (mediaList.length === 0) {
            if (mainImg) {
                mainImg.style.display = 'block';
                mainImg.src = typeof getPlaceholderSvg === 'function' ? getPlaceholderSvg(p.title) : '';
            }
            if (videoEl) videoEl.style.display = 'none';
        } else {
            changeMainMedia(0);
            
            mediaList.forEach((src, index) => {
                const thumbDiv = document.createElement('div');
                thumbDiv.className = 'thumb';
                if (index === 0) thumbDiv.classList.add('active');
                
                if (src.endsWith('.mp4')) {
                    thumbDiv.innerHTML = `<div class="video-thumb-preview" style="background:#1a1a1a;color:#fff;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:bold;width:100%;height:100%;border-radius:4px;cursor:pointer;">Видео</div>`;
                } else {
                    const thumbImg = document.createElement('img');
                    thumbImg.src = src;
                    thumbImg.onerror = () => { 
                        if (typeof getPlaceholderSvg === 'function') thumbImg.src = getPlaceholderSvg('Ошибка'); 
                    };
                    thumbDiv.appendChild(thumbImg);
                }

                thumbDiv.addEventListener('click', (e) => {
                    e.stopPropagation();
                    changeMainMedia(index);
                });
                thumbsBox.appendChild(thumbDiv);
            });
        }
    }
    // =========================================================================
    // КОНЕЦ НОВОЙ ВСТАВКИ
    // === КОНЕЦ ИСПРАВЛЕННОЙ ВСТАВКИ ДЛЯ ВИДЕО НА ВЕСЬ ЭКРАН ===


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
// Функция открытия окна обратной связи
function openFeedbackModal(type) {
  const modal = document.getElementById('feedback-modal');
  const title = document.getElementById('feedback-title');
  const typeInput = document.getElementById('feedback-type');
  const orderBlock = document.getElementById('order-number-block');
  const messageLabel = document.getElementById('message-label');
  const form = document.getElementById('feedback-form');

  if (!modal) return;
  form.reset(); // Очищаем поля формы при открытии
  typeInput.value = type;

  // Динамически адаптируем форму под выбранный тип
  if (type === 'return') {
    title.textContent = "Заявка на возврат";
    messageLabel.textContent = "Причина возврата";
    orderBlock.style.display = "block"; // Показываем поле номера заказа
  } else if (type === 'review') {
    title.textContent = "Оставить отзыв";
    messageLabel.textContent = "Ваш отзыв";
    orderBlock.style.display = "none";
  } else {
    title.textContent = "Задать вопрос";
    messageLabel.textContent = "Ваш вопрос";
    orderBlock.style.display = "none";
  }

  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

// Функция закрытия окна
function closeModal() {
  // Старый код закрытия вашего товарного модального окна остается без изменений
}

function closeFeedbackModal() {
  const modal = document.getElementById('feedback-modal');
  if (modal) {
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
  }
}

// ==========================================================================
// КРАШ-ТЕСТ ФУНКЦИЯ ОТПРАВКИ EMAILJS (ГАРАНТИЯ ОТ ЗАВИСАНИЯ КНОПКИ)
// ==========================================================================
function sendFeedback(event) {
  event.preventDefault();
  
  var form = event.target;
  var submitBtn = document.getElementById('feedback-submit-btn');
  var originalText = submitBtn.textContent;

  // 1. Мгновенно блокируем кнопку от повторных кликов
  submitBtn.textContent = "Отправка...";
  submitBtn.style.pointerEvents = "none";

  try {
    // Проверяем, загрузилась ли библиотека в index.html
    if (typeof emailjs === 'undefined') {
      alert('Критическая ошибка: библиотека отправки почты не загружена. Проверьте index.html');
      // Принудительно вызываем ошибку, чтобы уйти в блок catch и отжать кнопку
      throw new Error("emailjs_not_found");
    }

    // Локальная защита Honeypot от спам-ботов
    var honeyField = form.querySelector('#feedback-honeypot');
    if (honeyField && honeyField.value.trim().length > 0) {
      alert('Спасибо! Ваш запрос успешно отправлен.');
      closeFeedbackModal();
      throw new Error("bot_detected"); // Молча выходим
    }

    // Подготавливаем переменные для вашего HTML-шаблона Яндекса
    var templateParams = {
      type: form.querySelector('[name="type"]').value === 'return' ? 'Возврат' : form.querySelector('[name="type"]').value === 'review' ? 'Отзыв' : 'Вопрос',
      name: form.querySelector('[name="name"]').value || 'Не указано',
      contact: form.querySelector('[name="contact"]').value || 'Не указано',
      orderNumber: form.querySelector('[name="order_number"]').value || 'Не указан',
      message: form.querySelector('[name="message"]').value || 'Пустое сообщение'
    };

    // ВНИМАНИЕ: Замените эти ID на ваши данные из кабинета EmailJS!
    var SERVICE_ID = "service_v4go7jz";         // Ваша Яндекс.Почта [INDEX: 1]
    var TEMPLATE_ID = "template_1hkdslb";        // Ваш ID шаблона писем [INDEX: 1]
    var PUBLIC_KEY = "EuBcutagloFacA2Iy";         // Ваш публичный ключ [INDEX: 1]

    // Запуск отправки
    emailjs.init(PUBLIC_KEY);
    emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams)
      .then(function() {
        alert('Спасибо! Ваш запрос успешно отправлен.');
        closeFeedbackModal();
      })
      .catch(function(error) {
        alert('Ошибка Яндекса/EmailJS: ' + JSON.stringify(error));
      })
      .then(function() {
        // Дополнительный сброс кнопки после завершения асинхронного fetch
        submitBtn.textContent = originalText;
        submitBtn.style.pointerEvents = "auto";
      });

  } catch (globalError) {
    // Если JavaScript упал на любой строчке выше — ловим ошибку здесь
    if (globalError.message !== "bot_detected" && globalError.message !== "emailjs_not_found") {
      alert('Системная ошибка скрипта сайта: ' + globalError.message);
    }
    // Отжимаем кнопку немедленно
    submitBtn.textContent = originalText;
    submitBtn.style.pointerEvents = "auto";
  }
}
