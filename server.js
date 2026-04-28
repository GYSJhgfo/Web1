const express = require('express');
const { chromium } = require('playwright');
const fs = require('fs');

const app = express();
app.use(express.json());
app.use(express.static('public'));

app.post('/login', async (req, res) => {
    const { phone, password } = req.body;

    try {
        const browser = await chromium.launch({ 
            headless: false,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        const context = await browser.newContext({
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        });
        
        const page = await context.newPage();

        await page.goto('https://account.viber.com/uk/login', { waitUntil: 'networkidle' });
        await page.waitForTimeout(3000);

        // Чекаємо поле телефону
        await page.waitForSelector('input[type="tel"]', { timeout: 15000 });
        await page.waitForTimeout(500);

        // Очищаємо поле і вводимо номер посимвольно
        await page.click('input[type="tel"]');
        await page.waitForTimeout(300);
        await page.keyboard.press('Control+A');
        await page.keyboard.press('Backspace');
        await page.waitForTimeout(300);

        for (const char of phone) {
            await page.keyboard.type(char);
            await page.waitForTimeout(80 + Math.random() * 80); // імітація людини
        }

        await page.waitForTimeout(1500);

        // Пароль
        await page.waitForSelector('input[type="password"]', { timeout: 10000 });
        await page.click('input[type="password"]');
        await page.waitForTimeout(300);
        await page.keyboard.press('Control+A');
        await page.keyboard.press('Backspace');
        await page.waitForTimeout(300);

        for (const char of password) {
            await page.keyboard.type(char);
            await page.waitForTimeout(80 + Math.random() * 80); // імітація людини
        }

        await page.waitForTimeout(2000);

        // Скріншот до кліку
        const screenshotBefore = await page.screenshot({ encoding: 'base64' });
        fs.writeFileSync('public/before.png', Buffer.from(screenshotBefore, 'base64'));

        // Натискаємо кнопку
        try {
            await page.waitForSelector('button[type="submit"]:not([disabled])', { timeout: 6000 });
            await page.click('button[type="submit"]');
        } catch {
            // Якщо кнопка disabled — пробуємо через JavaScript
            await page.evaluate(() => {
                const btn = document.querySelector('button[type="submit"]');
                if (btn) btn.click();
            });
        }

        await page.waitForTimeout(5000);

        // Скріншот після входу
        const screenshot = await page.screenshot({ encoding: 'base64' });
        fs.writeFileSync('public/after.png', Buffer.from(screenshot, 'base64'));

        await browser.close();

        res.json({ success: true, screenshot, screenshotBefore });

    } catch (error) {
        console.error('Помилка:', error.message);
        res.json({ success: false, error: error.message });
    }
});

app.listen(3000, () => {
    console.log('Сервер запущено на http://localhost:3000');
});