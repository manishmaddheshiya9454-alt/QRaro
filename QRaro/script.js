const storageKeys = {
  history: 'qrora-history',
  favorites: 'qrora-favorites',
  theme: 'qrora-theme',
  user: 'qrora-user',
};

const qrTypes = [
  { key: 'text', label: 'Text' },
  { key: 'url', label: 'URL' },
  { key: 'image', label: 'Image' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone' },
  { key: 'wifi', label: 'Wi‑Fi' },
  { key: 'contact', label: 'Contact' },
  { key: 'location', label: 'Location' },
];

const state = {
  selectedType: 'text',
  theme: localStorage.getItem(storageKeys.theme) || 'light',
  user: JSON.parse(localStorage.getItem(storageKeys.user) || 'null'),
  history: JSON.parse(localStorage.getItem(storageKeys.history) || '[]'),
  favorites: JSON.parse(localStorage.getItem(storageKeys.favorites) || '[]'),
  qrCodeInstance: null,
  qrCodeData: '',
  qrPreviewImage: '',
  logoImage: '',
  uploadFile: null,
  scanStream: null,
};

const selectors = {
  typeTabs: document.querySelector('#typeTabs'),
  dynamicForm: document.querySelector('#dynamicForm'),
  previewTypeBadge: document.querySelector('#previewTypeBadge'),
  qrPreview: document.querySelector('#qrPreview'),
  previewColorText: document.querySelector('#previewColorText'),
  previewStyleText: document.querySelector('#previewStyleText'),
  fgColor: document.querySelector('#fgColor'),
  bgColor: document.querySelector('#bgColor'),
  shapeSelect: document.querySelector('#shapeSelect'),
  eyeSelect: document.querySelector('#eyeSelect'),
  sizeSelect: document.querySelector('#sizeSelect'),
  marginRange: document.querySelector('#marginRange'),
  logoUpload: document.querySelector('#logoUpload'),
  generateBtn: document.querySelector('#generateBtn'),
  copyContentBtn: document.querySelector('#copyContentBtn'),
  downloadPngBtn: document.querySelector('#downloadPngBtn'),
  downloadSvgBtn: document.querySelector('#downloadSvgBtn'),
  downloadPdfBtn: document.querySelector('#downloadPdfBtn'),
  shareQrBtn: document.querySelector('#shareQrBtn'),
  themeToggle: document.querySelector('#themeToggle'),
  signInBtn: document.querySelector('#signInBtn'),
  getStartedBtn: document.querySelector('#getStartedBtn'),
  menuBtn: document.querySelector('#menuBtn'),
  authModal: document.querySelector('#authModal'),
  authForm: document.querySelector('#authForm'),
  authSubmitBtn: document.querySelector('#authSubmitBtn'),
  authTitle: document.querySelector('#authTitle'),
  authEmail: document.querySelector('#authEmail'),
  authPassword: document.querySelector('#authPassword'),
  confirmPassword: document.querySelector('#confirmPassword'),
  confirmPasswordWrap: document.querySelector('#confirmPasswordWrap'),
  forgotPasswordBtn: document.querySelector('#forgotPasswordBtn'),
  demoAuthBtn: document.querySelector('#demoAuthBtn'),
  historyList: document.querySelector('#historyList'),
  favoritesList: document.querySelector('#favoritesList'),
  historySearch: document.querySelector('#historySearch'),
  historyFilter: document.querySelector('#historyFilter'),
  dashboard: document.querySelector('#dashboard'),
  totalQrStat: document.querySelector('#totalQrStat'),
  favoriteStat: document.querySelector('#favoriteStat'),
  recentStat: document.querySelector('#recentStat'),
  decodeUpload: document.querySelector('#decodeUpload'),
  decodeResult: document.querySelector('#decodeResult'),
  cameraPreview: document.querySelector('#cameraPreview'),
  cameraPlaceholder: document.querySelector('#cameraPlaceholder'),
  startCameraBtn: document.querySelector('#startCameraBtn'),
  dashboardCreateBtn: document.querySelector('#dashboardCreateBtn'),
  dashboardScanBtn: document.querySelector('#dashboardScanBtn'),
  dashboardUploadBtn: document.querySelector('#dashboardUploadBtn'),
  heroQrPreview: document.querySelector('#heroQrPreview'),
  toastContainer: document.querySelector('#toastContainer'),
};

function initTheme() {
  if (state.theme === 'dark') {
    document.body.classList.add('dark-mode');
  }
  const toggleIcon = selectors.themeToggle.querySelector('.toggle-icon');
  toggleIcon.textContent = state.theme === 'dark' ? '🌙' : '☀️';
}

function toggleTheme() {
  state.theme = state.theme === 'dark' ? 'light' : 'dark';
  localStorage.setItem(storageKeys.theme, state.theme);
  document.body.classList.toggle('dark-mode', state.theme === 'dark');
  const toggleIcon = selectors.themeToggle.querySelector('.toggle-icon');
  toggleIcon.textContent = state.theme === 'dark' ? '🌙' : '☀️';
  showToast(`Theme set to ${state.theme === 'dark' ? 'dark' : 'light'} mode.`);
}

function showToast(message) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  selectors.toastContainer.appendChild(toast);
  setTimeout(() => {
    toast.remove();
  }, 2400);
}

function sanitizeText(value) {
  return String(value || '').trim();
}

function formatFileSize(bytes) {
  if (!bytes) return '0 KB';
  const units = ['B', 'KB', 'MB', 'GB'];
  const size = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = bytes / 1024 ** size;
  return `${value.toFixed(1)} ${units[size]}`;
}

function setAuthMode(mode) {
  const tabs = document.querySelectorAll('.auth-tab');
  const active = mode === 'signup';
  tabs.forEach((tab) => {
    tab.classList.toggle('active', tab.dataset.authTab === mode);
  });
  selectors.authTitle.textContent = mode === 'signup' ? 'Create your QRora account' : 'Sign in to QRora';
  selectors.authSubmitBtn.textContent = mode === 'signup' ? 'Create account' : 'Sign In';
  selectors.confirmPasswordWrap.classList.toggle('hidden', !active);
}

function openAuthModal(mode = 'signin') {
  setAuthMode(mode);
  selectors.authModal.classList.remove('hidden');
  selectors.authModal.setAttribute('aria-hidden', 'false');
}

function closeAuthModal() {
  selectors.authModal.classList.add('hidden');
  selectors.authModal.setAttribute('aria-hidden', 'true');
  selectors.authForm.reset();
}

function renderTabs() {
  selectors.typeTabs.innerHTML = qrTypes.map((type) => `
    <button type="button" class="type-tab ${state.selectedType === type.key ? 'active' : ''}" data-type="${type.key}">${type.label}</button>
  `).join('');

  selectors.typeTabs.querySelectorAll('.type-tab').forEach((button) => {
    button.addEventListener('click', () => {
      state.selectedType = button.dataset.type;
      renderTabs();
      renderForm();
    });
  });
}

function renderForm() {
  const type = state.selectedType;
  selectors.previewTypeBadge.textContent = qrTypes.find((item) => item.key === type)?.label || 'Text';

  const formMap = {
    text: `
      <div class="form-group">
        <label for="textInput">Enter text</label>
        <textarea id="textInput" placeholder="Type the text you want to encode...">${state.qrCodeData || ''}</textarea>
        <div class="helper-row">
          <span class="character-count" id="textCounter">0 / 500</span>
          <div class="action-grid dense" style="grid-template-columns: repeat(2, minmax(0, 1fr)); width: 220px;">
            <button type="button" class="btn btn-ghost" id="clearTextBtn">Clear</button>
            <button type="button" class="btn btn-primary" id="generateTextBtn">Generate</button>
          </div>
        </div>
      </div>
    `,
    url: `
      <div class="form-group">
        <label for="urlInput">Website URL</label>
        <input id="urlInput" type="url" placeholder="https://example.com" value="${state.qrCodeData || ''}" />
        <div class="helper-row">
          <span class="character-count">Use a valid URL for best scanning.</span>
          <button type="button" class="btn btn-primary" id="generateTextBtn">Generate</button>
        </div>
      </div>
    `,
    image: `
      <div class="form-group">
        <label>Upload image</label>
        <label class="upload-label" for="imageUpload">Choose image file</label>
        <input id="imageUpload" type="file" accept="image/png,image/jpeg,image/jpg,image/webp" />
        <div id="imageMeta" class="image-meta">
          ${state.uploadFile ? `<div class="mini-upload-info"><strong>${state.uploadFile.name}</strong><span>${formatFileSize(state.uploadFile.size)}</span></div>` : '<span class="muted-copy">PNG, JPG, JPEG, and WEBP are supported.</span>'}
        </div>
        <div class="helper-row">
          <small>Large image files may exceed standard QR data limits. QRora will warn you and suggest a shareable reference.</small>
          <button type="button" class="btn btn-primary" id="generateTextBtn">Generate</button>
        </div>
      </div>
    `,
    email: `
      <div class="form-group">
        <label for="emailTo">To</label>
        <input id="emailTo" type="email" placeholder="hello@company.com" value="${state.qrCodeData || ''}" />
      </div>
      <div class="form-row">
        <div class="form-group">
          <label for="emailSubject">Subject</label>
          <input id="emailSubject" type="text" placeholder="Hello" />
        </div>
        <div class="form-group">
          <label for="emailBody">Message</label>
          <textarea id="emailBody" placeholder="Your message here..."></textarea>
        </div>
      </div>
      <div class="helper-row">
        <span class="character-count">Email QR creates a mailto link.</span>
        <button type="button" class="btn btn-primary" id="generateTextBtn">Generate</button>
      </div>
    `,
    phone: `
      <div class="form-group">
        <label for="phoneInput">Phone number</label>
        <input id="phoneInput" type="tel" placeholder="+1 415 555 0100" value="${state.qrCodeData || ''}" />
        <div class="helper-row">
          <span class="character-count">A tap-to-call QR code.</span>
          <button type="button" class="btn btn-primary" id="generateTextBtn">Generate</button>
        </div>
      </div>
    `,
    wifi: `
      <div class="form-group">
        <label for="wifiSsid">Network name (SSID)</label>
        <input id="wifiSsid" type="text" placeholder="CoffeeHouse Wi‑Fi" />
      </div>
      <div class="form-row">
        <div class="form-group">
          <label for="wifiPassword">Password</label>
          <input id="wifiPassword" type="text" placeholder="Password123" />
        </div>
        <div class="form-group">
          <label for="wifiType">Security</label>
          <select id="wifiType">
            <option value="WPA">WPA/WPA2</option>
            <option value="WEP">WEP</option>
            <option value="nopass">No password</option>
          </select>
        </div>
      </div>
      <div class="helper-row">
        <span class="character-count">QR will encode a Wi‑Fi join prompt.</span>
        <button type="button" class="btn btn-primary" id="generateTextBtn">Generate</button>
      </div>
    `,
    contact: `
      <div class="form-group">
        <label for="contactName">Full name</label>
        <input id="contactName" type="text" placeholder="Alex Morgan" />
      </div>
      <div class="form-row">
        <div class="form-group">
          <label for="contactEmail">Email</label>
          <input id="contactEmail" type="email" placeholder="alex@example.com" />
        </div>
        <div class="form-group">
          <label for="contactPhone">Phone</label>
          <input id="contactPhone" type="tel" placeholder="+1 415 555 0100" />
        </div>
      </div>
      <div class="helper-row">
        <span class="character-count">Contact QR stores a vCard.</span>
        <button type="button" class="btn btn-primary" id="generateTextBtn">Generate</button>
      </div>
    `,
    location: `
      <div class="form-row">
        <div class="form-group">
          <label for="locationLat">Latitude</label>
          <input id="locationLat" type="number" step="any" placeholder="37.7749" />
        </div>
        <div class="form-group">
          <label for="locationLng">Longitude</label>
          <input id="locationLng" type="number" step="any" placeholder="-122.4194" />
        </div>
      </div>
      <div class="helper-row">
        <span class="character-count">Create a map location QR.</span>
        <button type="button" class="btn btn-primary" id="generateTextBtn">Generate</button>
      </div>
    `,
  };

  selectors.dynamicForm.innerHTML = formMap[type] || formMap.text;

  const textInput = document.querySelector('#textInput');
  if (textInput) {
    textInput.addEventListener('input', () => {
      const value = sanitizeText(textInput.value);
      document.querySelector('#textCounter').textContent = `${value.length} / 500`;
      state.qrCodeData = value;
      if (value) {
        generateQrFromCurrentType();
      }
    });
  }

  const clearTextBtn = document.querySelector('#clearTextBtn');
  if (clearTextBtn) {
    clearTextBtn.addEventListener('click', () => {
      const input = document.querySelector('#textInput');
      input.value = '';
      state.qrCodeData = '';
      document.querySelector('#textCounter').textContent = '0 / 500';
      generateQrFromCurrentType();
    });
  }

  const generateButtons = document.querySelectorAll('#generateTextBtn');
  generateButtons.forEach((button) => {
    button.addEventListener('click', generateQrFromCurrentType);
  });

  const imageUploadInput = document.querySelector('#imageUpload');
  if (imageUploadInput) {
    imageUploadInput.addEventListener('change', handleImageFileSelect);
  }

  const sizeSelect = selectors.sizeSelect;
  const fgColor = selectors.fgColor;
  const bgColor = selectors.bgColor;
  const shapeSelect = selectors.shapeSelect;
  const eyeSelect = selectors.eyeSelect;
  const marginRange = selectors.marginRange;

  fgColor.addEventListener('input', updatePreviewMeta);
  bgColor.addEventListener('input', updatePreviewMeta);
  shapeSelect.addEventListener('change', updatePreviewMeta);
  eyeSelect.addEventListener('change', updatePreviewMeta);
  sizeSelect.addEventListener('change', updatePreviewMeta);
  marginRange.addEventListener('input', updatePreviewMeta);
  selectors.logoUpload.addEventListener('change', handleLogoUpload);

  updatePreviewMeta();
}

function updatePreviewMeta() {
  const fg = selectors.fgColor.value || '#111827';
  const bg = selectors.bgColor.value || '#ffffff';
  const shape = selectors.shapeSelect.value;
  const eye = selectors.eyeSelect.value;
  const sizeOption = selectors.sizeSelect.value;
  const margin = selectors.marginRange.value;

  selectors.previewColorText.textContent = `${fg} / ${bg}`;
  selectors.previewStyleText.textContent = `${shape.charAt(0).toUpperCase() + shape.slice(1)} · ${eye}`;

  if (!state.qrCodeInstance) {
    return;
  }

  const widthMap = { small: 220, medium: 280, large: 340, custom: 320 };
  const size = widthMap[sizeOption] || 280;
  const renderedWidth = size;

  state.qrCodeInstance.update({
    width: renderedWidth,
    height: renderedWidth,
    margin: Number(margin),
    qrOptions: { errorCorrectionLevel: 'M' },
    dotsOptions: {
      color: fg,
      type: mapShapeToDots(shape),
    },
    cornersSquareOptions: {
      color: fg,
      type: mapEyeToCorners(eye),
    },
    cornersDotOptions: {
      color: fg,
      type: mapEyeToCorners(eye),
    },
    backgroundOptions: {
      color: bg,
    },
    image: state.logoImage || undefined,
  });
}

function mapShapeToDots(shape) {
  const values = {
    square: 'square',
    rounded: 'rounded',
    dots: 'dots',
    smooth: 'extra-rounded',
  };
  return values[shape] || 'rounded';
}

function mapEyeToCorners(eye) {
  const values = {
    square: 'square',
    rounded: 'extra-rounded',
    circle: 'dot',
  };
  return values[eye] || 'rounded';
}

function generateQrFromCurrentType() {
  const content = buildQrContentByType();
  if (!content) {
    showToast('Please enter valid data before generating a QR code.');
    return;
  }

  state.qrCodeData = content;
  renderQrCode(content);
  addToHistoryIfNeeded(content, state.selectedType);
}

function buildQrContentByType() {
  const type = state.selectedType;

  if (type === 'text') {
    const value = sanitizeText(document.querySelector('#textInput')?.value || state.qrCodeData || '');
    return value || null;
  }

  if (type === 'url') {
    let value = sanitizeText(document.querySelector('#urlInput')?.value || state.qrCodeData || '');
    if (!value) return null;
    if (!/^https?:\/\//i.test(value)) value = `https://${value}`;
    return value;
  }

  if (type === 'image') {
    if (!state.uploadFile) {
      showToast('Upload an image to generate an image QR code.');
      return null;
    }

    const file = state.uploadFile;
    const maxBytes = 2500;
    const reader = new FileReader();

    if (file.size > maxBytes) {
      showToast('Large files exceed typical QR capacity. QRora will use a shareable reference instead.');
    }

    return new Promise((resolve) => {
      reader.onload = () => {
        const data = reader.result;
        const safeContent = file.size <= maxBytes ? data : `QRora: shared-image:${file.name}|${file.size}|${Date.now()}`;
        resolve(safeContent);
      };
      reader.readAsDataURL(file);
    });
  }

  if (type === 'email') {
    const to = sanitizeText(document.querySelector('#emailTo')?.value || '');
    const subject = sanitizeText(document.querySelector('#emailSubject')?.value || '');
    const body = sanitizeText(document.querySelector('#emailBody')?.value || '');
    if (!to) return null;
    const params = [];
    if (subject) params.push(`subject=${encodeURIComponent(subject)}`);
    if (body) params.push(`body=${encodeURIComponent(body)}`);
    return `mailto:${to}${params.length ? `?${params.join('&')}` : ''}`;
  }

  if (type === 'phone') {
    const value = sanitizeText(document.querySelector('#phoneInput')?.value || state.qrCodeData || '');
    return value ? `tel:${value}` : null;
  }

  if (type === 'wifi') {
    const ssid = sanitizeText(document.querySelector('#wifiSsid')?.value || '');
    const password = sanitizeText(document.querySelector('#wifiPassword')?.value || '');
    const security = document.querySelector('#wifiType')?.value || 'WPA';
    if (!ssid) return null;
    if (security === 'nopass') return `WIFI:T:nopass;S:${ssid};P:;H:false;;`;
    return `WIFI:T:${security};S:${ssid};P:${password};H:true;;`;
  }

  if (type === 'contact') {
    const name = sanitizeText(document.querySelector('#contactName')?.value || '');
    const email = sanitizeText(document.querySelector('#contactEmail')?.value || '');
    const phone = sanitizeText(document.querySelector('#contactPhone')?.value || '');
    if (!name && !email && !phone) return null;
    const lines = ['BEGIN:VCARD', 'VERSION:3.0'];
    if (name) lines.push(`FN:${name}`);
    if (email) lines.push(`EMAIL:${email}`);
    if (phone) lines.push(`TEL:${phone}`);
    lines.push('END:VCARD');
    return lines.join('\n');
  }

  if (type === 'location') {
    const lat = sanitizeText(document.querySelector('#locationLat')?.value || '');
    const lng = sanitizeText(document.querySelector('#locationLng')?.value || '');
    if (!lat || !lng) return null;
    return `geo:${lat},${lng}`;
  }

  return state.qrCodeData || null;
}

function renderQrCode(content) {
  const canvasTarget = selectors.qrPreview;
  const previewSize = 280;

  const qrOptions = {
    width: previewSize,
    height: previewSize,
    type: 'canvas',
    margin: Number(selectors.marginRange.value || 10),
    qrOptions: { errorCorrectionLevel: 'M' },
    dotsOptions: {
      color: selectors.fgColor.value || '#111827',
      type: mapShapeToDots(selectors.shapeSelect.value),
    },
    backgroundOptions: {
      color: selectors.bgColor.value || '#ffffff',
    },
    cornersSquareOptions: {
      color: selectors.fgColor.value || '#111827',
      type: mapEyeToCorners(selectors.eyeSelect.value),
    },
    cornersDotOptions: {
      color: selectors.fgColor.value || '#111827',
      type: mapEyeToCorners(selectors.eyeSelect.value),
    },
  };

  if (state.logoImage) {
    qrOptions.image = state.logoImage;
    qrOptions.imageOptions = {
      hideBackgroundDots: true,
      imageSize: 0.2,
      margin: 12,
      crossOrigin: 'anonymous',
    };
  }

  if (state.qrCodeInstance) {
    state.qrCodeInstance.update({
      data: content,
      ...qrOptions,
    });
    return;
  }

  state.qrCodeInstance = new QRCodeStyling({
    data: content,
    ...qrOptions,
  });

  state.qrCodeInstance.append(canvasTarget);

  const heroPreview = selectors.heroQrPreview;
  if (heroPreview) {
    heroPreview.innerHTML = '';
    const heroQr = new QRCodeStyling({
      data: content,
      ...qrOptions,
      width: 180,
      height: 180,
      margin: 8,
    });
    heroQr.append(heroPreview);
  }
}

function handleImageFileSelect(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
  if (!validTypes.includes(file.type)) {
    showToast('Unsupported image type. Please use PNG, JPG, JPEG, or WEBP.');
    return;
  }

  if (file.size > 15 * 1024 * 1024) {
    showToast('The selected file is too large. Please choose a file under 15 MB.');
    return;
  }

  state.uploadFile = file;
  const previewContainer = document.querySelector('#imageMeta');
  if (previewContainer) {
    previewContainer.innerHTML = `<div class="mini-upload-info"><strong>${file.name}</strong><span>${formatFileSize(file.size)}</span></div>`;
  }
  showToast('Image uploaded successfully.');
}

function handleLogoUpload(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    state.logoImage = reader.result;
    if (state.qrCodeData) {
      renderQrCode(state.qrCodeData);
    }
    showToast('Logo uploaded and applied to the QR preview.');
  };
  reader.readAsDataURL(file);
}

function addToHistoryIfNeeded(content, type) {
  const name = `${type.charAt(0).toUpperCase() + type.slice(1)} QR`;
  const now = new Date().toISOString();
  const item = {
    id: crypto.randomUUID(),
    name,
    type,
    content,
    createdAt: now,
    lastUsedAt: now,
    isFavorite: false,
  };

  state.history.unshift(item);
  localStorage.setItem(storageKeys.history, JSON.stringify(state.history));
  renderHistory();
  renderDashboard();
}

function getFilteredHistory() {
  const term = sanitizeText(document.querySelector('#historySearch')?.value || '').toLowerCase();
  const filter = document.querySelector('#historyFilter')?.value || 'all';

  return state.history.filter((item) => {
    const matchesText = !term || item.name.toLowerCase().includes(term) || item.type.toLowerCase().includes(term);
    const matchesFilter = filter === 'all' || item.type === filter;
    return matchesText && matchesFilter;
  });
}

function renderHistory() {
  const list = getFilteredHistory();
  selectors.historyList.innerHTML = '';

  if (!list.length) {
    selectors.historyList.innerHTML = `
      <div class="empty-state-card">
        <div class="empty-state-icon">✦</div>
        <h3>No QR codes yet</h3>
        <p>Create your first QR code and it will appear here.</p>
        <button class="btn btn-primary" type="button" id="emptyCreateBtn">Create QR</button>
      </div>
    `;
    document.querySelector('#emptyCreateBtn')?.addEventListener('click', () => {
      document.querySelector('#creator')?.scrollIntoView({ behavior: 'smooth' });
    });
    return;
  }

  list.forEach((item) => {
    const card = document.createElement('article');
    card.className = 'history-item';
    card.innerHTML = `
      <div class="mini-qr" aria-label="${item.name} QR code preview">
        <img src="${buildPreviewImage(item.content)}" alt="${item.name}" />
      </div>
      <div class="item-meta">
        <strong>${item.name}</strong>
        <span>${item.type}</span>
        <small>Created ${new Date(item.createdAt).toLocaleDateString()}</small>
      </div>
      <div class="history-actions">
        <button type="button" data-action="open" data-id="${item.id}">Open</button>
        <button type="button" data-action="edit" data-id="${item.id}">Edit</button>
        <button type="button" data-action="download" data-id="${item.id}">Download</button>
        <button type="button" data-action="favorite" data-id="${item.id}">${item.isFavorite ? '★' : '☆'}</button>
        <button type="button" data-action="delete" data-id="${item.id}">Delete</button>
      </div>
    `;

    card.querySelectorAll('button').forEach((button) => {
      button.addEventListener('click', () => handleHistoryAction(button.dataset.action, button.dataset.id));
    });

    selectors.historyList.appendChild(card);
  });

  renderFavorites();
}

function buildPreviewImage(content) {
  const safeContent = String(content || 'QRora');
  const seed = safeContent.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const svgCells = [];

  for (let y = 0; y < 7; y += 1) {
    for (let x = 0; x < 7; x += 1) {
      const isFinder = (x < 2 && y < 2) || (x > 4 && y < 2) || (x < 2 && y > 4);
      const value = ((seed + x * 17 + y * 13 + (x * y)) % 3) === 0 || isFinder;
      if (!value) continue;
      svgCells.push(`<rect x="${x * 16 + 8}" y="${y * 16 + 8}" width="8" height="8" rx="2" fill="#111827" />`);
    }
  }

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120">
      <rect width="120" height="120" fill="#ffffff" rx="18"/>
      <g fill="#111827">
        <rect x="8" y="8" width="24" height="24" rx="4"/>
        <rect x="88" y="8" width="24" height="24" rx="4"/>
        <rect x="8" y="88" width="24" height="24" rx="4"/>
        <rect x="16" y="16" width="8" height="8" rx="2" fill="#ffffff"/>
        <rect x="96" y="16" width="8" height="8" rx="2" fill="#ffffff"/>
        <rect x="16" y="96" width="8" height="8" rx="2" fill="#ffffff"/>
        <rect x="48" y="8" width="8" height="8" rx="2"/>
        <rect x="64" y="8" width="8" height="8" rx="2"/>
        <rect x="48" y="24" width="8" height="8" rx="2"/>
        <rect x="64" y="24" width="8" height="8" rx="2"/>
        <rect x="48" y="40" width="8" height="8" rx="2"/>
        <rect x="56" y="40" width="8" height="8" rx="2"/>
        <rect x="64" y="40" width="8" height="8" rx="2"/>
        <rect x="48" y="56" width="8" height="8" rx="2"/>
        <rect x="56" y="56" width="8" height="8" rx="2"/>
        <rect x="64" y="56" width="8" height="8" rx="2"/>
        <rect x="48" y="72" width="8" height="8" rx="2"/>
        <rect x="56" y="72" width="8" height="8" rx="2"/>
        <rect x="64" y="72" width="8" height="8" rx="2"/>
        <rect x="72" y="48" width="8" height="8" rx="2"/>
        <rect x="80" y="56" width="8" height="8" rx="2"/>
        <circle cx="104" cy="104" r="8" fill="#38c0ff"/>
        ${svgCells.join('')}
      </g>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function renderFavorites() {
  const favorites = state.history.filter((item) => item.isFavorite);
  selectors.favoritesList.innerHTML = '';

  if (!favorites.length) {
    selectors.favoritesList.innerHTML = '<p class="muted-copy">No favorites saved yet.</p>';
    return;
  }

  selectors.favoritesList.innerHTML = `<div class="section-heading left-align"><span class="eyebrow">Favorites</span><h3>Saved favorites</h3></div>`;
  favorites.forEach((item) => {
    const row = document.createElement('div');
    row.className = 'history-item';
    row.innerHTML = `
      <div class="mini-qr"><img src="${buildPreviewImage(item.content)}" alt="${item.name}" /></div>
      <div class="item-meta"><strong>${item.name}</strong><span>${item.type}</span><small>Last used ${new Date(item.lastUsedAt).toLocaleDateString()}</small></div>
      <div class="history-actions">
        <button type="button" data-action="open" data-id="${item.id}">Open</button>
        <button type="button" data-action="download" data-id="${item.id}">Download</button>
      </div>
    `;
    row.querySelectorAll('button').forEach((button) => {
      button.addEventListener('click', () => handleHistoryAction(button.dataset.action, button.dataset.id));
    });
    selectors.favoritesList.appendChild(row);
  });
}

function handleHistoryAction(action, id) {
  const item = state.history.find((entry) => entry.id === id);
  if (!item) return;

  if (action === 'delete') {
    state.history = state.history.filter((entry) => entry.id !== id);
    localStorage.setItem(storageKeys.history, JSON.stringify(state.history));
    renderHistory();
    renderDashboard();
    showToast('QR removed from your library.');
    return;
  }

  if (action === 'favorite') {
    item.isFavorite = !item.isFavorite;
    item.lastUsedAt = new Date().toISOString();
    localStorage.setItem(storageKeys.history, JSON.stringify(state.history));
    renderHistory();
    renderDashboard();
    showToast(item.isFavorite ? 'Added to favorites.' : 'Removed from favorites.');
    return;
  }

  if (action === 'edit') {
    state.selectedType = item.type;
    renderTabs();
    renderForm();
    document.querySelector('#creator')?.scrollIntoView({ behavior: 'smooth' });
    state.qrCodeData = item.content;
    renderQrCode(item.content);
    showToast(`Editing ${item.name}.`);
    return;
  }

  if (action === 'download') {
    const qr = new QRCodeStyling({
      data: item.content,
      width: 280,
      height: 280,
      margin: 12,
      dotsOptions: { color: '#111827', type: 'rounded' },
      backgroundOptions: { color: '#ffffff' },
    });
    qr.download({ name: item.name.replace(/\s+/g, '-').toLowerCase(), extension: 'png' });
    showToast('QR downloaded.');
    return;
  }

  if (action === 'open') {
    state.qrCodeData = item.content;
    renderQrCode(item.content);
    document.querySelector('#creator')?.scrollIntoView({ behavior: 'smooth' });
    showToast(`Opened ${item.name}.`);
  }
}

function renderDashboard() {
  if (!state.user) {
    selectors.dashboard.style.display = 'none';
    return;
  }

  selectors.dashboard.style.display = 'block';
  selectors.totalQrStat.textContent = state.history.length;
  selectors.favoriteStat.textContent = state.history.filter((item) => item.isFavorite).length;
  selectors.recentStat.textContent = Math.min(state.history.length, 3);
}

function applyAuthState() {
  const user = state.user;
  const signInBtn = selectors.signInBtn;
  const getStartedBtn = selectors.getStartedBtn;

  if (user) {
    signInBtn.textContent = user.email.split('@')[0];
    getStartedBtn.textContent = 'Logout';
    selectors.dashboard.style.display = 'block';
  } else {
    signInBtn.textContent = 'Sign In';
    getStartedBtn.textContent = 'Get Started';
    selectors.dashboard.style.display = 'none';
  }
}

function handleAuthSubmit(event) {
  event.preventDefault();
  const mode = document.querySelector('.auth-tab.active')?.dataset.authTab || 'signin';
  const email = sanitizeText(selectors.authEmail.value);
  const password = sanitizeText(selectors.authPassword.value);

  if (!email || !password) {
    showToast('Please enter a valid email and password.');
    return;
  }

  if (mode === 'signup') {
    const confirm = sanitizeText(selectors.confirmPassword.value);
    if (password !== confirm) {
      showToast('Passwords do not match.');
      return;
    }
  }

  const safeUser = {
    email,
    name: email.split('@')[0],
    createdAt: new Date().toISOString(),
  };
  state.user = safeUser;
  localStorage.setItem(storageKeys.user, JSON.stringify(safeUser));
  closeAuthModal();
  applyAuthState();
  renderDashboard();
  showToast(mode === 'signup' ? 'Welcome to QRora! Your account is ready.' : 'Welcome back!');
}

function handleForgotPassword() {
  const email = sanitizeText(selectors.authEmail.value);
  if (!email) {
    showToast('Enter your email to receive a reset link.');
    return;
  }
  showToast('Password reset instructions sent to your inbox.');
}

function requestDemoAuth() {
  state.user = { email: 'demo@qrora.app', name: 'Demo User', createdAt: new Date().toISOString() };
  localStorage.setItem(storageKeys.user, JSON.stringify(state.user));
  closeAuthModal();
  applyAuthState();
  renderDashboard();
  showToast('Demo mode enabled.');
}

function handleLogout() {
  state.user = null;
  localStorage.removeItem(storageKeys.user);
  applyAuthState();
  renderDashboard();
  showToast('You have been signed out.');
}

async function startCameraScan() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    showToast('Your device does not support browser camera access.');
    return;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
    state.scanStream = stream;
    selectors.cameraPreview.srcObject = stream;
    selectors.cameraPlaceholder.classList.add('hidden');
    scanFromCameraLoop();
    showToast('Camera is live. Hold your QR code in frame.');
  } catch (error) {
    showToast('Camera permission was denied or unavailable.');
  }
}

function stopCameraScan() {
  if (state.scanStream) {
    state.scanStream.getTracks().forEach((track) => track.stop());
    state.scanStream = null;
  }
  selectors.cameraPreview.srcObject = null;
  selectors.cameraPlaceholder.classList.remove('hidden');
}

function scanFromCameraLoop() {
  const video = selectors.cameraPreview;
  if (!video || !video.videoWidth) {
    requestAnimationFrame(scanFromCameraLoop);
    return;
  }

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: 'dontInvert' });

  if (code) {
    handleDecodedValue(code.data);
    stopCameraScan();
    return;
  }

  requestAnimationFrame(scanFromCameraLoop);
}

function handleDecodedValue(value) {
  const resultCard = document.createElement('div');
  resultCard.className = 'result-card';
  const sanitized = String(value || '').trim();
  const decodedPreview = sanitized.startsWith('http') ? `<a href="${sanitized}" target="_blank" rel="noreferrer">Open link</a>` : sanitized;
  resultCard.innerHTML = `
    <div class="result-card-header">
      <strong>QR decoded successfully</strong>
      <span class="status-pill">Scanned</span>
    </div>
    <div class="result-summary">${decodedPreview}</div>
    <div class="result-actions">
      <button class="btn btn-primary" type="button" id="copyDecodedBtn">Copy</button>
      <button class="btn btn-ghost" type="button" id="openDecodedBtn">Open</button>
      <button class="btn btn-ghost" type="button" id="downloadDecodedBtn">Download</button>
      <button class="btn btn-ghost" type="button" id="shareDecodedBtn">Share</button>
    </div>
  `;
  selectors.decodeResult.className = 'decode-result success';
  selectors.decodeResult.innerHTML = '';
  selectors.decodeResult.appendChild(resultCard);

  const copyBtn = document.querySelector('#copyDecodedBtn');
  const openBtn = document.querySelector('#openDecodedBtn');
  const downloadBtn = document.querySelector('#downloadDecodedBtn');
  const shareBtn = document.querySelector('#shareDecodedBtn');

  copyBtn.addEventListener('click', async () => {
    await navigator.clipboard.writeText(sanitized);
    showToast('Decoded content copied to clipboard.');
  });

  openBtn.addEventListener('click', () => {
    if (/^https?:\/\//i.test(sanitized)) {
      window.open(sanitized, '_blank', 'noopener');
    } else {
      showToast('This decoded content is not a web link.');
    }
  });

  downloadBtn.addEventListener('click', () => {
    const blob = new Blob([sanitized], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'decoded-qr.txt';
    link.click();
    URL.revokeObjectURL(url);
    showToast('Decoded text downloaded.');
  });

  shareBtn.addEventListener('click', async () => {
    if (navigator.share) {
      await navigator.share({ title: 'QRora decoded result', text: sanitized });
      return;
    }
    await navigator.clipboard.writeText(sanitized);
    showToast('Share fallback: copied decoded content.');
  });

  showToast('QR decoded successfully.');
}

function handleDecodeUpload(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, canvas.width, canvas.height, { inversionAttempts: 'dontInvert' });
      if (code) {
        handleDecodedValue(code.data);
      } else {
        selectors.decodeResult.className = 'decode-result empty-state';
        selectors.decodeResult.innerHTML = '<p>We could not read this QR code. Try uploading a clearer image or use the camera scanner.</p>';
        showToast('We could not read this QR code. Try a clearer image.');
      }
    };
    img.src = reader.result;
  };
  reader.readAsDataURL(file);
}

function generateHeroPreview() {
  const content = 'QRora | Smart QR Studio';
  const heroCode = new QRCodeStyling({
    data: content,
    width: 190,
    height: 190,
    margin: 8,
    dotsOptions: {
      color: '#1b2248',
      type: 'rounded',
    },
    cornersSquareOptions: {
      color: '#1b2248',
      type: 'rounded',
    },
    cornersDotOptions: {
      color: '#1b2248',
      type: 'dot',
    },
  });

  heroCode.append(selectors.heroQrPreview);
}

async function copyGeneratedContent() {
  const content = state.qrCodeData || buildQrContentByType();
  if (!content) {
    showToast('No content is ready to copy yet.');
    return;
  }

  try {
    await navigator.clipboard.writeText(String(content));
    showToast('Content copied to clipboard.');
  } catch (error) {
    showToast('Copy failed. Your browser blocked clipboard access.');
  }
}

async function shareQrCode() {
  const content = state.qrCodeData || buildQrContentByType();
  if (!content) {
    showToast('Generate a QR code before sharing.');
    return;
  }

  if (navigator.share) {
    try {
      await navigator.share({ title: 'QRora QR code', text: String(content) });
      showToast('QR shared successfully.');
      return;
    } catch (error) {
      // user cancelled or unsupported
    }
  }

  await navigator.clipboard.writeText(String(content));
  showToast('Share fallback: QR content copied to clipboard.');
}

async function downloadQr(type) {
  const content = state.qrCodeData || buildQrContentByType();
  if (!content) {
    showToast('Generate a QR code first.');
    return;
  }

  const downloadName = 'qrora-qr';
  if (!state.qrCodeInstance) {
    renderQrCode(content);
  }

  if (type === 'png') {
    state.qrCodeInstance.download({ name: downloadName, extension: 'png' });
  } else if (type === 'svg') {
    state.qrCodeInstance.download({ name: downloadName, extension: 'svg' });
  } else if (type === 'pdf') {
    const { jsPDF } = window.jspdf;
    const canvas = document.querySelector('#qrPreview canvas') || document.querySelector('#qrPreview img');
    if (!canvas) {
      showToast('QR preview is not ready for PDF export.');
      return;
    }
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: [300, 300] });
    const image = canvas.toDataURL('image/png');
    pdf.addImage(image, 'PNG', 0, 0, 300, 300);
    pdf.save(`${downloadName}.pdf`);
  }

  showToast(`QR downloaded as ${type.toUpperCase()}.`);
}

function addEventListeners() {
  selectors.themeToggle.addEventListener('click', toggleTheme);
  selectors.signInBtn.addEventListener('click', () => openAuthModal('signin'));
  selectors.getStartedBtn.addEventListener('click', () => {
    if (state.user) {
      handleLogout();
      return;
    }
    openAuthModal('signup');
  });
  selectors.menuBtn.addEventListener('click', () => {
    document.querySelector('.main-nav').classList.toggle('open');
  });

  document.querySelectorAll('[data-close-modal]').forEach((element) => {
    element.addEventListener('click', closeAuthModal);
  });

  selectors.authForm.addEventListener('submit', handleAuthSubmit);
  selectors.forgotPasswordBtn.addEventListener('click', handleForgotPassword);
  selectors.demoAuthBtn.addEventListener('click', requestDemoAuth);

  selectors.generateBtn.addEventListener('click', generateQrFromCurrentType);
  selectors.copyContentBtn.addEventListener('click', copyGeneratedContent);
  selectors.downloadPngBtn.addEventListener('click', () => downloadQr('png'));
  selectors.downloadSvgBtn.addEventListener('click', () => downloadQr('svg'));
  selectors.downloadPdfBtn.addEventListener('click', () => downloadQr('pdf'));
  selectors.shareQrBtn.addEventListener('click', shareQrCode);

  selectors.startCameraBtn.addEventListener('click', startCameraScan);
  selectors.decodeUpload.addEventListener('change', handleDecodeUpload);
  selectors.historySearch.addEventListener('input', renderHistory);
  selectors.historyFilter.addEventListener('change', renderHistory);

  document.querySelector('#dashboardCreateBtn').addEventListener('click', () => document.querySelector('#creator')?.scrollIntoView({ behavior: 'smooth' }));
  document.querySelector('#dashboardScanBtn').addEventListener('click', () => document.querySelector('#scanner')?.scrollIntoView({ behavior: 'smooth' }));
  document.querySelector('#dashboardUploadBtn').addEventListener('click', () => document.querySelector('#decodeUpload')?.click());

  document.querySelectorAll('.auth-tab').forEach((tab) => {
    tab.addEventListener('click', () => setAuthMode(tab.dataset.authTab));
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeAuthModal();
    }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      openAuthModal('signin');
    }
  });
}

function bootstrap() {
  initTheme();
  renderTabs();
  renderForm();
  renderHistory();
  applyAuthState();
  renderDashboard();
  generateHeroPreview();
  addEventListeners();
  if (state.history.length) {
    const latest = state.history[0];
    state.qrCodeData = latest.content;
    renderQrCode(latest.content);
  } else {
    renderQrCode('QRora | Smart QR Studio');
  }
}

window.addEventListener('DOMContentLoaded', bootstrap);
