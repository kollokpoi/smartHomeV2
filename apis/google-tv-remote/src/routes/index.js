// routes/remoteRoutes.js
const express = require('express');
const router = express.Router();
const adbRemote = require('../classes/ADBRemote');

// Статус (без попытки подключения)
router.get('/status', async (req, res) => {
    const status = await adbRemote.getStatus();
    res.json(status);
});

// Кнопки - автоматически подключаются при первом вызове
router.post('/key/:key', async (req, res) => {
    const { key } = req.params;
    const keyMap = {
        home: 'home', back: 'back', up: 'up', down: 'down',
        left: 'left', right: 'right', enter: 'enter', power: 'power',
        volumeup: 'volumeUp', volumedown: 'volumeDown', mute: 'mute',
        menu: 'menu', settings: 'settings', search: 'search'
    };
    
    if (!keyMap[key]) {
        return res.status(400).json({ success: false, message: 'Неизвестная клавиша' });
    }
    
    const result = await adbRemote[keyMap[key]]();
    res.json(result);
});

router.post('/app/launch', async (req, res) => {
    const { packageName } = req.body;
    if (!packageName) {
        return res.status(400).json({ success: false, message: 'packageName обязателен' });
    }
    const result = await adbRemote.launchApp(packageName);
    res.json(result);
});

router.post('/app/close', async (req, res) => {
    const { packageName } = req.body;
    if (!packageName) {
        return res.status(400).json({ success: false, message: 'packageName обязателен' });
    }
    const result = await adbRemote.closeApp(packageName);
    res.json(result);
});

router.get('/app/current', async (req, res) => {
    const result = await adbRemote.getCurrentApp();
    res.json(result);
});

router.get('/apps', async (req, res) => {
    const result = await adbRemote.getInstalledApps();
    res.json(result);
});

router.get('/info', async (req, res) => {
    const result = await adbRemote.getDeviceInfo();
    res.json(result);
});

module.exports = router;