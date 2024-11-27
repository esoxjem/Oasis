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
                <button class="restore-btn" data-group-index="${groupIndex}">Restore All</button>
                <button class="delete-btn" data-group-index="${groupIndex}">Delete</button>
            </div>
            ${group.tabs.map(tab => `
                <a href="${tab.url}" class="tab-link" target="_blank">${tab.title}</a>
            `).join('')}
        </div>
    `).join('');
}

document.getElementById('tabList').addEventListener('click', async (e) => {
    // Handle restore button clicks
    if (e.target.classList.contains('restore-btn')) {
        const groupIndex = parseInt(e.target.dataset.groupIndex);
        const storage = await browser.storage.local.get('tabGroups');
        const group = storage.tabGroups[groupIndex];

        // Open all tabs in the group
        group.tabs.forEach(tab => {
            const a = document.createElement('a');
            a.href = tab.url;
            a.target = '_blank';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        });

        // Remove the group after restoring
        storage.tabGroups.splice(groupIndex, 1);
        await browser.storage.local.set({ tabGroups: storage.tabGroups });
        await displayTabGroups();
    }

    // Handle delete button clicks
    if (e.target.classList.contains('delete-btn')) {
        const groupIndex = parseInt(e.target.dataset.groupIndex);
        const storage = await browser.storage.local.get('tabGroups');
        storage.tabGroups.splice(groupIndex, 1);
        await browser.storage.local.set({ tabGroups: storage.tabGroups });
        await displayTabGroups();
    }
});

// Call displayTabGroups when popup loads
document.addEventListener('DOMContentLoaded', () => {
    displayTabGroups();
});
