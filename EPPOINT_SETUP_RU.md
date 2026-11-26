# Подключение Epoint к Fudik AI

В проект добавлен серверный шаблон Cloudflare Worker. Платёжные ключи НЕ помещаются в HTML/JavaScript и не отправляются в браузер.

## 1. Регистрация в Epoint

1. Зарегистрируйся как мерчант на https://epoint.az/.
2. Укажи домен сайта и URL возврата. Для callback укажи адрес Worker: `https://ИМЯ-WORKER.workers.dev/api/epoint-callback`.
3. Получи `public_key` и `private_key`.
4. Уточни у Epoint, включены ли для твоего мерчант-аккаунта платежи в USD. В этом проекте цены тарифов отправляются как USD 5.99 и USD 13.99. Если аккаунт принимает только AZN, валюту и цены нужно согласованно изменить.

## 2. Создание Cloudflare Worker и KV

1. В Cloudflare открой Workers & Pages и создай Worker с именем `fudik-ai-payments`.
2. Создай KV namespace, например `FUDIK_SUBSCRIPTIONS`.
3. В настройках Worker добавь KV binding с переменной `SUBSCRIPTIONS` и выбери созданный namespace.
4. Загрузи `worker.js` как код Worker.
5. Добавь Secrets (не Variables) с именами `EPOINT_PUBLIC_KEY` и `EPOINT_PRIVATE_KEY`.
6. В `wrangler.toml` замени `REPLACE_WITH_YOUR_KV_NAMESPACE_ID`, `YOUR-SITE.pages.dev` и домен на свои реальные значения. Укажи `SITE_URL` и `ALLOWED_ORIGIN` в настройках Worker.

## 3. Подключение сайта к Worker

В `script.js` найди `PAYMENT_API_BASE` и укажи адрес Worker, например `https://fudik-ai-payments.ТВОЙ-АККАУНТ.workers.dev`.
Затем заново загрузи `index.html`, `script.js`, `style.css` в Cloudflare Pages.

## 4. Проверка

Сначала попроси Epoint предоставить тестовые реквизиты/режим тестирования. Проверь успешный и неуспешный платёж, callback и продление тарифа. Не публикуй private key, не вставляй его в `script.js`, HTML или репозиторий GitHub.

## Важные ограничения текущей версии

- PRO/SUPER действуют 30 дней после подтверждённого callback. Автоматическое списание за следующий месяц не включено.
- Аккаунтов пользователей пока нет: покупка привязывается к случайному идентификатору браузера в localStorage. Очистка данных браузера или другое устройство не перенесут подписку; для полноценного личного кабинета потребуется авторизация.
- Тариф не включается по одной лишь странице `success`; Worker ждёт подтверждённый и проверенный callback Epoint.
- Перед реальным запуском проверь у Epoint точный формат параметров и доступность валюты/режима для своего мерчант-аккаунта.
