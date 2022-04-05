"use strict";
(() => {
    const requestKey = 'request';
    const updateKey = 'update';
    //Install/Update Handling
    chrome.runtime.onInstalled.addListener(async (details) => {
        if (details.reason === chrome.runtime.OnInstalledReason.INSTALL ||
            details.reason === chrome.runtime.OnInstalledReason.UPDATE) {
            const keys = await chrome.storage.sync.get(null);
            const newKeys = {
                [requestKey]: keys[requestKey] ?? true,
                [updateKey]: keys[updateKey] ?? true,
            };
            await chrome.storage.sync.set(newKeys);
            console.log('Set settings', newKeys);
        }
    });
    //Page Update Option Redirecting
    const requestStatus = {};
    chrome.tabs.onUpdated.addListener(async (id, info, tab) => {
        const regex = /^http(s)?:\/\/www\.youtube\.com\/shorts\/(.+)$/;
        const url = tab.url?.match(regex);
        if (tab.status === 'complete' && requestStatus[id]) {
            delete requestStatus[id];
            return;
        }
        if (url && tab.url && tab.id && typeof requestStatus[id] === 'undefined') {
            requestStatus[id] = tab.status;
            const { [updateKey]: update } = await chrome.storage.sync.get([
                updateKey,
            ]);
            if (update) {
                const cleanURL = url[0].replace('shorts/', 'watch?v=');
                await chrome.tabs.goBack(tab.id);
                await chrome.tabs.update(tab.id, {
                    url: cleanURL,
                });
            }
        }
    });
})();
