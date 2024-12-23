// Storage Service
const TabStorage = {
    STORAGE_KEY: 'com.esoxjem.oasis.tabGroups',

    async get() {
        const storage = await browser.storage.local.get(this.STORAGE_KEY);
        return storage[this.STORAGE_KEY] || [];
    },

    async save(tabGroups) {
        await browser.storage.local.set({ [this.STORAGE_KEY]: tabGroups });
    }
};

// Tab Service
const TabService = {
    async getCurrentWindowTabs() {
        return await browser.tabs.query({ currentWindow: true });
    },

    async getCurrentTab() {
        return await browser.tabs.getCurrent();
    },

    createTabGroupData(tabs) {
        return {
            date: new Date().toISOString(),
            tabs: tabs.map(this.extractTabData)
        };
    },

    extractTabData(tab) {
        return {
            title: tab.title,
            url: tab.url
        };
    },

    async closeTab(tabId) {
        await browser.tabs.remove(tabId);
    }
};

// UI Service
const UIService = {
    renderTabGroups(tabGroups) {
        const tabList = document.getElementById('tabList');
        tabList.innerHTML = this.createTabGroupsMarkup(tabGroups);
    },

    createTabGroupsMarkup(tabGroups) {
        return tabGroups.map(this.createGroupMarkup).join('');
    },

    createGroupMarkup(group, index) {
        return `
            <div class="tab-group">
                ${UIService.createHeaderMarkup(group, index)}
                ${UIService.createTabsMarkup(group, index)}
            </div>
        `;
    },
    createHeaderMarkup(group, index) {
        return `
        <div class="group-header">
            <span>📅 ${new Date(group.date).toLocaleString()}</span>
            <div class="group-actions">
                <button class="restore-btn" data-group-index="${index}">↗️</button>
                <button class="delete-btn" data-group-index="${index}">🗑️</button>
            </div>
        </div>
    `;
    },

    createTabsMarkup(group, groupIndex) {
        return group.tabs
            .map((tab, tabIndex) => this.createTabMarkup(tab, groupIndex, tabIndex))
            .join('');
    },

    createTabMarkup(tab, groupIndex, tabIndex) {
        const favicon = `https://www.google.com/s2/favicons?domain=${new URL(tab.url).hostname}`;
        return `
        <a href="${tab.url}" 
           class="tab-link" 
           data-group-index="${groupIndex}"
           data-tab-index="${tabIndex}"
           title="${tab.title}"
           target="_blank">
           <img src="${favicon}" class="favicon" alt="" />
           ${tab.title}
        </a>
    `;
    }
};

// Tab Group Manager
class TabGroupManager {
    async saveCurrentTabs() {
        const tabs = await TabService.getCurrentWindowTabs();
        const tabGroup = TabService.createTabGroupData(tabs);
        const tabGroups = await TabStorage.get();

        tabGroups.push(tabGroup);
        await TabStorage.save(tabGroups);
        await this.closeOtherTabs();
        await this.displayGroups();
    }

    async closeOtherTabs() {
        const tabs = await TabService.getCurrentWindowTabs();
        const currentTab = await TabService.getCurrentTab();

        for (const tab of tabs) {
            if (tab.id !== currentTab.id) {
                await TabService.closeTab(tab.id);
            }
        }
    }

    async displayGroups() {
        const tabGroups = await TabStorage.get();
        UIService.renderTabGroups(tabGroups);
    }

    async removeTab(groupIndex, tabIndex) {
        const tabGroups = await TabStorage.get();
        tabGroups[groupIndex].tabs.splice(tabIndex, 1);

        if (tabGroups[groupIndex].tabs.length === 0) {
            tabGroups.splice(groupIndex, 1);
        }

        await TabStorage.save(tabGroups);
        await this.displayGroups();
    }

    async restoreGroup(groupIndex) {
        const tabGroups = await TabStorage.get();
        const group = tabGroups[groupIndex];

        group.tabs.forEach(this.openTab);
        tabGroups.splice(groupIndex, 1);

        await TabStorage.save(tabGroups);
        await this.displayGroups();
    }

    openTab(tab) {
        const link = document.createElement('a');
        link.href = tab.url;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    async deleteGroup(groupIndex) {
        const tabGroups = await TabStorage.get();
        tabGroups.splice(groupIndex, 1);
        await TabStorage.save(tabGroups);
        await this.displayGroups();
    }
}

// Initialize
const manager = new TabGroupManager();

// Event Listeners
document.getElementById('saveTabs').addEventListener('click', () => manager.saveCurrentTabs());

document.getElementById('tabList').addEventListener('click', async (e) => {
    const target = e.target;
    const groupIndex = parseInt(target.dataset.groupIndex);

    switch(true) {
        case target.classList.contains('tab-link'):
            await manager.removeTab(groupIndex, parseInt(target.dataset.tabIndex));
            break;
        case target.classList.contains('restore-btn'):
            await manager.restoreGroup(groupIndex);
            break;
        case target.classList.contains('delete-btn'):
            await manager.deleteGroup(groupIndex);
            break;
    }
});
document.addEventListener('DOMContentLoaded', () => manager.displayGroups());
