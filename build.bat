@echo off
echo [1/3] Очистка кода и удаление комментариев...
cd scr
call npm run build
cd ..

echo.
echo [2/3] Подготовка файлов к отправке на GitHub...
git add index.html assets/styles.css assets/app.js

echo.
echo [3/3] Отправка изменений в репозиторий...
git commit -m "Авто-деплой: очистка комментариев и обновление сайта"
git push origin main

echo.
echo === Все готово! Сайт успешно обновлен на GitHub. ===
echo.
pause
