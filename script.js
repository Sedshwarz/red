const imageInput = document.getElementById('imageInput');
const layerInput = document.getElementById('layerInput');
const layerAddBtn = document.getElementById('layerAddBtn');
const previewImage = document.getElementById('previewImage');
const downloadBtn = document.getElementById('downloadBtn');
const cropToolBtn = document.getElementById('cropToolBtn');
const toolsMenu = document.getElementById('toolsMenu');
const postArea = document.getElementById('post');
const maskContainer = document.getElementById('maskContainer');
const cropBtnText = document.getElementById('cropBtnText');
const bgColorPicker = document.getElementById('bgColorPicker');
const alignLeftBtn = document.getElementById('alignLeftBtn');
const alignCenterBtn = document.getElementById('alignCenterBtn');
const alignRightBtn = document.getElementById('alignRightBtn');
const layerStyleMenu = document.getElementById('layerStyleMenu');
const layerRadius = document.getElementById('layerRadius');
const layerShadow = document.getElementById('layerShadow');
const layerBorder = document.getElementById('layerBorder');
const layerBorderColor = document.getElementById('layerBorderColor');
const layerRotate = document.getElementById('layerRotate');

let isCropMode = false;
let cropper = null;
let isFirstLoad = true; 

let activeLayer = null; 
let action = null; 
let startX, startY, startWidth, startHeight, startLeft, startTop;

imageInput.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        if (isCropMode) cropToolBtn.click(); 
        previewImage.src = URL.createObjectURL(file);
    }
});

previewImage.onload = () => {
    if (isFirstLoad) {
        previewImage.style.display = 'block';
        downloadBtn.style.display = 'inline-flex';
        layerAddBtn.style.display = 'inline-flex';
        toolsMenu.style.display = 'flex';
        isFirstLoad = false; 
    }
};

layerInput.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        const objectUrl = URL.createObjectURL(file);
        createLayer(objectUrl);
        layerInput.value = '';
    }
});

function createLayer(src) {
    const layer = document.createElement('div');
    layer.className = 'layer-box';
    layer.innerHTML = `
        <img src="${src}" alt="">
        <div class="handle nw" data-handle="nw"></div>
        <div class="handle ne" data-handle="ne"></div>
        <div class="handle sw" data-handle="sw"></div>
        <div class="handle se" data-handle="se"></div>
    `;
    maskContainer.appendChild(layer);

    const img = layer.querySelector('img');
    img.onload = () => {
        const aspect = img.naturalWidth / img.naturalHeight;
        layer.dataset.aspectRatio = aspect;
        
        const startH = 400;
        const startW = startH * aspect;
        layer.style.height = startH + 'px';
        layer.style.width = startW + 'px';
        
        layer.style.top = (maskContainer.clientHeight - startH) / 2 + 'px';
        layer.style.left = (maskContainer.clientWidth - startW) / 2 + 'px';
        
        setActiveLayer(layer);
    };
}


function setActiveLayer(layer) {
    document.querySelectorAll('.layer-box').forEach(l => l.classList.remove('is-edit-mode'));
    activeLayer = layer;
    
    if (activeLayer) {
        activeLayer.classList.add('is-edit-mode');
        
        layerRadius.checked = activeLayer.dataset.radius === 'true';
        layerShadow.value = activeLayer.dataset.shadow || '0';
        layerBorder.checked = activeLayer.dataset.border === 'true';
        layerBorderColor.value = activeLayer.dataset.borderColor || '#ffffff';
        layerRotate.value = activeLayer.dataset.rotate || '0';
        
        layerStyleMenu.style.opacity = '1';
        layerStyleMenu.style.pointerEvents = 'auto';
    } else {
        layerStyleMenu.style.opacity = '0';
        layerStyleMenu.style.pointerEvents = 'none';
    }
}

function getUiScale() {
    return Math.min(1, window.innerWidth / 1150);
}

maskContainer.addEventListener('pointerdown', (e) => {
    if (isCropMode) return; 

    const clickedHandle = e.target.closest('.handle');
    const clickedLayer = e.target.closest('.layer-box');

    if (clickedHandle) {
        e.preventDefault();
        action = clickedHandle.dataset.handle;
        setActiveLayer(clickedLayer);
        initDrag(e);
    } else if (clickedLayer) {
        e.preventDefault();
        action = 'drag';
        setActiveLayer(clickedLayer);
        initDrag(e);
    } else {
        setActiveLayer(null);
    }
});

function initDrag(e) {
    startX = e.clientX;
    startY = e.clientY;
    startWidth = activeLayer.offsetWidth;
    startHeight = activeLayer.offsetHeight;
    startLeft = activeLayer.offsetLeft;
    startTop = activeLayer.offsetTop;

    document.addEventListener('pointermove', onPointerMove);
    document.addEventListener('pointerup', onPointerUp);
}

function onPointerMove(e) {
    if (!action || !activeLayer) return;
    e.preventDefault();
    
    let scale = getUiScale();
    let deltaX = (e.clientX - startX) / scale;
    let deltaY = (e.clientY - startY) / scale;
    let aspect = parseFloat(activeLayer.dataset.aspectRatio);

    if (action === 'drag') {
        activeLayer.style.left = (startLeft + deltaX) + 'px';
        activeLayer.style.top = (startTop + deltaY) + 'px';
    } else {
        let newWidth, newHeight, newLeft, newTop;
        
        if (action === 'se') {
            newWidth = startWidth + deltaX;
            newHeight = newWidth / aspect;
            newLeft = startLeft;
            newTop = startTop;
        } else if (action === 'sw') {
            newWidth = startWidth - deltaX;
            newHeight = newWidth / aspect;
            newLeft = startLeft + deltaX;
            newTop = startTop;
        } else if (action === 'ne') {
            newWidth = startWidth + deltaX;
            newHeight = newWidth / aspect;
            newLeft = startLeft;
            newTop = startTop - (newHeight - startHeight);
        } else if (action === 'nw') {
            newWidth = startWidth - deltaX;
            newHeight = newWidth / aspect;
            newLeft = startLeft + deltaX;
            newTop = startTop - (newHeight - startHeight);
        }

        if (newWidth > 50) {
            activeLayer.style.width = newWidth + 'px';
            activeLayer.style.height = newHeight + 'px';
            activeLayer.style.left = newLeft + 'px';
            activeLayer.style.top = newTop + 'px';
        }
    }
}

function onPointerUp() {
    action = null;
    document.removeEventListener('pointermove', onPointerMove);
    document.removeEventListener('pointerup', onPointerUp);
}

cropToolBtn.addEventListener('click', () => {
    setActiveLayer(null);

    if (!isCropMode) {
        isCropMode = true;
        cropToolBtn.classList.add('active');
        cropBtnText.innerText = 'Uygula';

        cropper = new Cropper(previewImage, {
            viewMode: 1,
            dragMode: 'crop', 
            background: false,
            autoCropArea: 1,
            zoomable: false,
            movable: false,
        });
    } else {
        if (cropper) {
            const croppedCanvas = cropper.getCroppedCanvas();
            previewImage.src = croppedCanvas.toDataURL("image/png");
            cropper.destroy();
            cropper = null;
        }
        isCropMode = false;
        cropToolBtn.classList.remove('active');
        cropBtnText.innerText = 'Crop';
    }
});

downloadBtn.addEventListener('click', async () => {
    if (isCropMode) cropToolBtn.click();
    setActiveLayer(null); 

    const originalText = downloadBtn.innerHTML;
    downloadBtn.innerHTML = 'Oluşturuluyor...';
    downloadBtn.style.opacity = '0.7';

    try {
        const canvas = await html2canvas(postArea, { 
            backgroundColor: "#ce2727", 
            scale: 1.5, 
            useCORS: true 
        });
        
        canvas.toBlob(async function(blob) {
            const file = new File([blob], 'olusturulan.png', { type: 'image/png' });
            
            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                try {
                    await navigator.share({ files: [file], title: 'Görsel' });
                } catch (error) { console.error('İptal:', error); }
            } else {
                const dataUrl = canvas.toDataURL("image/png");
                const link = document.createElement("a");
                link.href = dataUrl;
                link.download = 'olusturulan.png';
                link.target = "_blank";
                document.body.appendChild(link);
                link.click();
                link.remove();
            }
        }, 'image/png', 0.9);

    } catch (error) {
        console.error("Hata:", error);
    } finally {
        downloadBtn.innerHTML = originalText;
        downloadBtn.style.opacity = '1';
    }
});


bgColorPicker.addEventListener('input', (e) => {
    maskContainer.style.backgroundColor = e.target.value;
});

function resetAlignButtons() {
    alignLeftBtn.classList.remove('active');
    alignCenterBtn.classList.remove('active');
    alignRightBtn.classList.remove('active');
}

function setAlignment(alignType, btn) {
    if (isCropMode) cropToolBtn.click();
    
    resetAlignButtons();
    btn.classList.add('active');
    
    if (alignType === 'left') {
        previewImage.style.left = '0';
        previewImage.style.right = 'auto';
        previewImage.style.transform = 'none';
    } else if (alignType === 'center') {
        previewImage.style.left = '50%';
        previewImage.style.right = 'auto';
        previewImage.style.transform = 'translateX(-50%)';
    } else if (alignType === 'right') {
        previewImage.style.left = 'auto';
        previewImage.style.right = '0';
        previewImage.style.transform = 'none';
    }
}

alignLeftBtn.addEventListener('click', () => setAlignment('left', alignLeftBtn));
alignCenterBtn.addEventListener('click', () => setAlignment('center', alignCenterBtn));
alignRightBtn.addEventListener('click', () => setAlignment('right', alignRightBtn));





function applyLayerStyles() {
    if (!activeLayer) return;
    const img = activeLayer.querySelector('img');
    
    activeLayer.dataset.radius = layerRadius.checked;
    activeLayer.dataset.shadow = layerShadow.value;
    activeLayer.dataset.border = layerBorder.checked;
    activeLayer.dataset.borderColor = layerBorderColor.value;
    activeLayer.dataset.rotate = layerRotate.value;
    
    img.style.borderRadius = layerRadius.checked ? '10px' : '0';
    
    let shadowStr = 'none';
    const sColor = 'rgba(0,0,0,0.6)';
    const blur = '5px';
    if (layerShadow.value === '1') shadowStr = `-4px -4px ${blur} ${sColor}`; // Sol Üst
    if (layerShadow.value === '2') shadowStr = `4px -4px ${blur} ${sColor}`;  // Sağ Üst
    if (layerShadow.value === '3') shadowStr = `4px 4px ${blur} ${sColor}`;   // Sağ Alt
    if (layerShadow.value === '4') shadowStr = `-4px 4px ${blur} ${sColor}`;  // Sol Alt
    img.style.boxShadow = shadowStr;
    
    img.style.border = layerBorder.checked ? `3px solid ${layerBorderColor.value}` : 'none';
    
    activeLayer.style.transform = `rotate(${layerRotate.value}deg)`;
}

layerRadius.addEventListener('change', applyLayerStyles);
layerShadow.addEventListener('change', applyLayerStyles);
layerBorder.addEventListener('change', applyLayerStyles);
layerBorderColor.addEventListener('input', applyLayerStyles);
layerRotate.addEventListener('input', applyLayerStyles);


const bgToggleBtn = document.getElementById('bgToggleBtn');
let isOrangeBg = false;

bgToggleBtn.addEventListener('click', () => {
    isOrangeBg = !isOrangeBg;
    if (isOrangeBg) {
        postArea.style.backgroundColor = '#f99616';
        bgToggleBtn.style.backgroundColor = '#ce2727'; 
    } else {
        postArea.style.backgroundColor = '#ce2727';
        bgToggleBtn.style.backgroundColor = '#f99616'; 
    }
});