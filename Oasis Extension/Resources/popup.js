document.getElementById('saveTabs').addEventListener('click', async () => {
    const tabs = await browser.tabs.query({ currentWindow: true });
    const tabGroup = {
        date: new Date().toISOString(),
        tabs: tabs.map(tab => ({
            title: tab.title,
            url: tab.url
        }))
    };
    
    const storage = await browser.storage.local.get('tabGroups');
    const tabGroups = storage.tabGroups || [];
    tabGroups.push(tabGroup);
    
    await browser.storage.local.set({ tabGroups });
    
    // Close all tabs except the current one
    const currentTab = await browser.tabs.getCurrent();
    tabs.forEach(tab => {
        if (tab.id !== currentTab.id) {
            browser.tabs.remove(tab.id);
        }
    });
    
    displayTabGroups();
});

async function displayTabGroups() {
    const storage = await browser.storage.local.get('tabGroups');
    const tabGroups = storage.tabGroups || [];
    const tabList = document.getElementById('tabList');
    
    tabList.innerHTML = tabGroups.map((group, groupIndex) => `
        <div class="tab-group">
            <div class="group-header">
                ${new Date(group.date).toLocaleString()}
                <button onclick="restoreGroup(${groupIndex})">Restore All</button>
                <button onclick="deleteGroup(${groupIndex})">Delete</button>
            </div>
            ${group.tabs.map(tab => `
                <a href="${tab.url}" class="tab-link" target="_blank">${tab.title}</a>
            `).join('')}
        </div>
    `).join('');
}

async function restoreGroup(groupIndex) {
    const storage = await browser.storage.local.get('tabGroups');
    const group = storage.tabGroups[groupIndex];
    
    group.tabs.forEach(tab => {
        browser.tabs.create({ url: tab.url });
    });
}

async function deleteGroup(groupIndex) {
    const storage = await browser.storage.local.get('tabGroups');
    storage.tabGroups.splice(groupIndex, 1);
    await browser.storage.local.set({ tabGroups: storage.tabGroups });
    displayTabGroups();
}

// Display saved tabs when popup opens
displayTabGroups();
