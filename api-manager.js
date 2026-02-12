let apiKeys = [];
let currentKeyId = null;

function loadApiKeys() {
    const stored = localStorage.getItem('localplayer_api_keys');
    if (stored) {
        apiKeys = JSON.parse(stored);
        renderApiKeys();
    }
}

function saveApiKeys() {
    localStorage.setItem('localplayer_api_keys', JSON.stringify(apiKeys));
}

function generateUUID() {
    const chars = 'abcdef0123456789';
    let uuid = '';
    for (let i = 0; i < 12; i++) {
        uuid += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return uuid;
}

function generateApiKey() {
    const networkUuidInput = document.getElementById('networkUuid');
    const apiNameInput = document.getElementById('apiName');
    
    const networkUuid = networkUuidInput.value.trim();
    const apiName = apiNameInput.value.trim() || 'Без названия';
    
    if (!networkUuid) {
        showToast('Пожалуйста, введите UUID сети', 'error');
        return;
    }
    
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(networkUuid)) {
        showToast('Неверный формат UUID. Пример: 550e8400-e29b-41d4-a716-446655440000', 'error');
        return;
    }
    
    const randomUuid = generateUUID();
    const apiKey = `LP-${randomUuid}`;
    
    const newKey = {
        id: Date.now().toString(),
        key: apiKey,
        name: apiName,
        networkUuid: networkUuid,
        createdAt: new Date().toISOString(),
        isActive: true,
        rateLimit: '1000/час',
        expiresIn: '1 год'
    };
    
    apiKeys.push(newKey);
    saveApiKeys();
    renderApiKeys();
    
    networkUuidInput.value = '';
    apiNameInput.value = '';
    
    showToast('API ключ успешно создан!', 'success');
    
    setTimeout(() => {
        document.querySelector('.api-keys-section').scrollIntoView({ behavior: 'smooth' });
    }, 500);
}

function renderApiKeys() {
    const container = document.getElementById('apiKeysList');
    
    if (apiKeys.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-key"></i>
                <p>У вас пока нет API ключей</p>
                <p class="empty-hint">Создайте первый ключ, чтобы начать работу с API</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = apiKeys.map(key => `
        <div class="api-key-item">
            <div class="api-key-info">
                <h3>
                    <i class="fas fa-tag"></i>
                    ${key.name}
                </h3>
                <div class="key-value">${key.key}</div>
                <div class="key-meta">
                    <i class="fas fa-calendar"></i>
                    Создан: ${new Date(key.createdAt).toLocaleDateString('ru-RU')}
                    ${key.isActive ? '<span style="color: var(--success); margin-left: 1rem;"><i class="fas fa-check-circle"></i> Активен</span>' : '<span style="color: var(--error); margin-left: 1rem;"><i class="fas fa-times-circle"></i> Неактивен</span>'}
                </div>
            </div>
            <div class="api-key-actions">
                <button class="icon-btn" onclick="copyToClipboard('${key.key}')" title="Копировать">
                    <i class="fas fa-copy"></i>
                </button>
                <button class="icon-btn" onclick="viewKeyDetails('${key.id}')" title="Настройки">
                    <i class="fas fa-cog"></i>
                </button>
                <button class="icon-btn" onclick="deleteKey('${key.id}')" title="Удалить" style="color: var(--error);">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

function copyToClipboard(text) {
    if (typeof text === 'string' && !text.startsWith('LP-')) {
        const element = document.getElementById(text);
        if (element) {
            text = element.textContent;
        }
    }
    
    navigator.clipboard.writeText(text).then(() => {
        showToast('Скопировано в буфер обмена', 'success');
    }).catch(err => {
        showToast('Ошибка при копировании', 'error');
    });
}

function viewKeyDetails(keyId) {
    const key = apiKeys.find(k => k.id === keyId);
    if (!key) return;
    
    currentKeyId = keyId;
    
    document.getElementById('modalApiKey').textContent = key.key;
    document.getElementById('modalEndpoint').textContent = `https://localplayer-tau.vercel.app/api/${key.key}`;
    document.getElementById('apiActiveToggle').checked = key.isActive;
    
    document.getElementById('apiKeyModal').classList.add('active');
}

function closeModal() {
    document.getElementById('apiKeyModal').classList.remove('active');
    currentKeyId = null;
}

function deleteCurrentKey() {
    if (!currentKeyId) return;
    
    if (confirm('Вы уверены, что хотите удалить этот API ключ? Это действие нельзя отменить.')) {
        deleteKey(currentKeyId);
        closeModal();
    }
}

function deleteKey(keyId) {
    const index = apiKeys.findIndex(k => k.id === keyId);
    if (index !== -1) {
        apiKeys.splice(index, 1);
        saveApiKeys();
        renderApiKeys();
        showToast('API ключ удален', 'success');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const toggle = document.getElementById('apiActiveToggle');
    if (toggle) {
        toggle.addEventListener('change', (e) => {
            if (currentKeyId) {
                const key = apiKeys.find(k => k.id === currentKeyId);
                if (key) {
                    key.isActive = e.target.checked;
                    saveApiKeys();
                    renderApiKeys();
                    showToast(key.isActive ? 'API ключ активирован' : 'API ключ деактивирован', 'success');
                }
            }
        });
    }
    
    const modal = document.getElementById('apiKeyModal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
    }
    
    const networkUuidInput = document.getElementById('networkUuid');
    const apiNameInput = document.getElementById('apiName');
    
    if (networkUuidInput) {
        networkUuidInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                generateApiKey();
            }
        });
    }
    
    if (apiNameInput) {
        apiNameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                generateApiKey();
            }
        });
    }
    
    loadApiKeys();
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeModal();
    }
});
