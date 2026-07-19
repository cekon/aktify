@echo off
chcp 65001 > nul

echo [1/4] Синхронизация с сервером GitHub...
git pull origin main --no-rebase

echo.
echo [2/4] Очистка кода и удаление комментариев...
cd scr
call npm run build
cd ..

echo.
echo [3/4] Подготовка ВСЕХ файлов к отправке...
git add --all

echo.
echo [4/4] Отправка изменений в репозиторий...
git commit -m "Авто-деплой: полное обновление сайта"
git push origin main

echo.
echo === Все готово! Сайт успешно обновлен на GitHub. ===
echo.
pause
