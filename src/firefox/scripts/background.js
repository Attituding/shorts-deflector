"use strict";
(() => {
    const automaticKey = 'automatic';
    const newPagesOnlyKey = 'new-pages-only';
    // Legacy Keys
    const requestKey = 'request';
    const updateKey = 'update';
    // Install/Update Handling
    browser.runtime.onInstalled.addListener(async (details) => {
        if (details.reason === browser.runtime.OnInstalledReason.INSTALL
            || details.reason === browser.runtime.OnInstalledReason.UPDATE) {
            const keys = await browser.storage.sync.get(null);
            const newKeys = {
                [automaticKey]: keys[automaticKey]
                    ?? (keys[requestKey] || keys[updateKey])
                    ?? true,
                [newPagesOnlyKey]: (keys[requestKey] === false)
                    || false,
            };
            await browser.storage.sync.set(newKeys);
            console.log('Set settings', newKeys);
        }
    });
    // Request Option Redirecting
    // @ts-expect-error FireFox can handle async onBeforeRequest
    // eslint-disable-next-line consistent-return
    browser.webRequest.onBeforeRequest.addListener(async (details) => {
        const regex = /^http(s)?:\/\/www\.youtube\.com\/shorts\/(.+)$/;
        const url = details.url?.match(regex);
        if (details.url && url?.[0]) {
            const { [automaticKey]: auto } = await browser.storage.sync.get([
                automaticKey,
            ]);
            if (auto) {
                const cleanURL = url[0].replace('shorts/', 'watch?v=');
                return {
                    redirectUrl: cleanURL,
                };
            }
        }
    }, {
        urls: [
            '*://www.youtube.com/shorts/*',
        ],
    }, [
        'blocking',
    ]);
    // Page Update Option Redirecting
    const requestStatus = {};
    browser.tabs.onUpdated.addListener(async (id, _info, tab) => {
        const regex = /^http(s)?:\/\/www\.youtube\.com\/shorts\/(.+)$/;
        const url = tab.url?.match(regex);
        if (tab.status === 'complete' && requestStatus[id]) {
            delete requestStatus[id];
            return;
        }
        if (url && tab.url && tab.id && typeof requestStatus[id] === 'undefined') {
            requestStatus[id] = tab.status;
            const keys = await browser.storage.sync.get([
                automaticKey,
                newPagesOnlyKey,
            ]);
            if (keys[automaticKey] && keys[newPagesOnlyKey] === false) {
                const cleanURL = url[0].replace('shorts/', 'watch?v=');
                try {
                    await browser.tabs.goBack(tab.id);
                    // eslint-disable-next-line no-empty
                }
                catch { }
                await browser.tabs.update(tab.id, {
                    url: cleanURL,
                });
            }
        }
        // @ts-expect-error Mozilla version has extra params
    }, {
        urls: [
            '*://www.youtube.com/shorts/*',
        ],
    });
})();
