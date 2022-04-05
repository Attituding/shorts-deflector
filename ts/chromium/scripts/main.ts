(async () => {
    const descriptionKey = 'description';
    const desktopKey = 'desktop';
    const requestKey = 'request';
    const updateKey = 'update';

    //Description
    const description = document.getElementById(
        descriptionKey,
    ) as HTMLSpanElement;

    description.textContent = String(
        chrome.runtime.getManifest().description,
    );

    //Desktop Interface Button
    const regex = /^http(s)?:\/\/www\.youtube\.com\/shorts\/(.+)$/;
    const requestStatus: {[key: string]: string | undefined} = {};

    const desktopButton = document.getElementById(
        desktopKey,
    ) as HTMLButtonElement;

    let [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
    });

    desktopButton.disabled = Boolean(tab?.url?.match(regex)) === false;

    chrome.tabs.onUpdated.addListener((id, _changes, newTab) => {
        if (typeof requestStatus[id] === 'undefined') {
            requestStatus[id] = tab.status;
            tab = newTab;
            desktopButton.disabled = Boolean(tab?.url?.match(regex)) === false;
            return;
        }

        delete requestStatus[id];
    });

    desktopButton.addEventListener('click', async () => {
        const cleanURL = tab.url?.replace('shorts/', 'watch?v=');
        await chrome.tabs.update(tab.id!, {
            url: cleanURL,
        });
    });

    //Settings Handling
    const requestButton = document.getElementById(
        requestKey,
    ) as HTMLFormElement;

    const updateButton = document.getElementById(
        updateKey,
    ) as HTMLFormElement;

    const keys = await chrome.storage.sync.get([
        requestKey,
        updateKey,
    ]);

    requestButton.checked = keys[requestKey];
    updateButton.checked = keys[updateKey];

    requestButton.addEventListener('click', async () => {
        await chrome.storage.sync.set({
            [requestKey]: requestButton.checked,
        });

        const declarativeNetRequestKey = requestButton.checked
            ? 'enableRulesetIds'
            : 'disableRulesetIds';

        await chrome.declarativeNetRequest.updateEnabledRulesets({
            [declarativeNetRequestKey]: ['shorts'],
        });
    });

    updateButton.addEventListener('click', async () => {
        await chrome.storage.sync.set({
            [updateKey]: updateButton.checked,
        });
    });
})();