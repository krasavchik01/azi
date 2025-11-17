# 🚀 Инструкция по развёртыванию

## Railway.app (Рекомендуется)

### Быстрый деплой в 1 клик:

1. **Перейдите на Railway:**
   👉 https://railway.app/

2. **Нажмите "Start a New Project"**

3. **Выберите "Deploy from GitHub repo"**
   - Авторизуйтесь через GitHub
   - Выберите репозиторий `krasavchik01/azi`
   - Выберите ветку `claude/multiplayer-card-game-01EY8ZXmMwcEESPwYNntSdwJ`

4. **Добавьте переменные окружения:**

   В разделе Variables добавьте:
   ```
   ANTHROPIC_API_KEY=ваш_ключ_anthropic
   JWT_SECRET=любая_длинная_случайная_строка
   PORT=3000
   ```

   Опционально (для MongoDB):
   ```
   MONGODB_URI=ваша_mongodb_строка_подключения
   ```

5. **Deploy!**
   - Railway автоматически установит зависимости
   - Запустит сервер
   - Даст вам публичный URL типа: `https://ваш-проект.up.railway.app`

### Бесплатный лимит:
- ✅ 500 часов работы в месяц
- ✅ Автоматические деплои при push
- ✅ HTTPS из коробки

---

## Render.com (Альтернатива)

### Быстрый деплой:

1. **Перейдите на Render:**
   👉 https://render.com/

2. **Нажмите "New +" → "Web Service"**

3. **Подключите GitHub репозиторий:**
   - Выберите `krasavchik01/azi`
   - Ветка: `claude/multiplayer-card-game-01EY8ZXmMwcEESPwYNntSdwJ`

4. **Настройки:**
   - Name: `ai-therapist-mila`
   - Environment: `Node`
   - Build Command: `npm install`
   - Start Command: `node server/index.js`
   - Instance Type: `Free`

5. **Environment Variables:**
   ```
   ANTHROPIC_API_KEY=ваш_ключ_anthropic
   JWT_SECRET=случайная_строка
   PORT=3000
   ```

6. **Create Web Service**

### Бесплатный лимит:
- ✅ 750 часов работы в месяц
- ✅ Автоматические деплои
- ✅ HTTPS

---

## 🔑 Где взять API ключи?

### Anthropic API Key:
1. Зарегистрируйтесь: https://console.anthropic.com/
2. Перейдите в API Keys
3. Создайте новый ключ
4. Пополните баланс ($5-$10 для начала)

### MongoDB (опционально):
1. Зарегистрируйтесь: https://www.mongodb.com/cloud/atlas
2. Создайте бесплатный кластер (M0 - Free tier)
3. Скопируйте Connection String
4. Замените `<password>` на ваш пароль

**Примечание:** Приложение работает и без MongoDB (используется in-memory хранилище), но при перезапуске данные потеряются.

---

## 📱 После деплоя:

1. Откройте URL вашего приложения
2. Зарегистрируйтесь (первый пользователь)
3. Начните разговор с Милой!
4. Дайте разрешение на микрофон для голосового общения

---

## ⚙️ Дополнительные настройки:

### Домен:
- Railway и Render позволяют добавить свой домен бесплатно
- В настройках проекта → Custom Domain

### Масштабирование:
- При росте нагрузки можно перейти на платные тарифы
- Railway: от $5/месяц
- Render: от $7/месяц

### Мониторинг:
- Оба сервиса предоставляют логи и метрики
- Railway: вкладка Metrics
- Render: вкладка Logs

---

## 🆘 Поддержка:

Если что-то не работает:
1. Проверьте логи в Railway/Render
2. Убедитесь, что все переменные окружения установлены
3. Проверьте баланс Anthropic API

---

## 🎉 Готово!

Ваша AI-психолог Мила теперь доступна онлайн 24/7!
