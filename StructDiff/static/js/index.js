function setCopyButtonState(button, copiedLabel, defaultLabel) {
    if (!button) return;
    const copyText = button.querySelector('.copy-text');
    button.classList.add('copied');
    if (copyText) {
        copyText.textContent = copiedLabel;
    }

    setTimeout(function() {
        button.classList.remove('copied');
        if (copyText) {
            copyText.textContent = defaultLabel;
        }
    }, 2000);
}

function copyTextWithFallback(text, button, copiedLabel, defaultLabel) {
    navigator.clipboard.writeText(text).then(function() {
        setCopyButtonState(button, copiedLabel, defaultLabel);
    }).catch(function(err) {
        console.error('Failed to copy: ', err);
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        setCopyButtonState(button, copiedLabel, defaultLabel);
    });
}

// Copy BibTeX to clipboard
function copyBibTeX() {
    const bibtexElement = document.getElementById('bibtex-code');
    const button = document.querySelector('#BibTeX .copy-bibtex-btn');

    if (bibtexElement && button) {
        copyTextWithFallback(bibtexElement.textContent, button, 'Copied', 'Copy');
    }
}

// Copy the complete LLM evaluation prompt
function copyPromptText(button) {
    const promptElement = document.getElementById('llm-prompt-text');
    if (!promptElement || !button) return;

    copyTextWithFallback(promptElement.value, button, 'Prompt Copied', 'Copy Full Prompt');
}

const lightboxState = {
    scale: 1,
    minScale: 1,
    maxScale: 5,
    translateX: 0,
    translateY: 0,
    isDragging: false,
    dragStartX: 0,
    dragStartY: 0
};

function getLightboxElements() {
    return {
        lightbox: document.getElementById('image-lightbox'),
        viewport: document.getElementById('image-lightbox-viewport'),
        image: document.getElementById('image-lightbox-image'),
        caption: document.getElementById('image-lightbox-caption'),
        resetButton: document.querySelector('[data-lightbox-action="reset"]')
    };
}

function isLightboxOpen() {
    const { lightbox } = getLightboxElements();
    return !!(lightbox && lightbox.classList.contains('is-active'));
}

function clampLightboxTranslation() {
    const { viewport, image } = getLightboxElements();
    if (!viewport || !image) return;

    const maxX = Math.max(0, (image.offsetWidth * lightboxState.scale - viewport.clientWidth) / 2);
    const maxY = Math.max(0, (image.offsetHeight * lightboxState.scale - viewport.clientHeight) / 2);

    lightboxState.translateX = Math.min(maxX, Math.max(-maxX, lightboxState.translateX));
    lightboxState.translateY = Math.min(maxY, Math.max(-maxY, lightboxState.translateY));
}

function updateLightboxTransform() {
    const { viewport, image, resetButton } = getLightboxElements();
    if (!viewport || !image) return;

    if (lightboxState.scale <= 1.01) {
        lightboxState.scale = 1;
        lightboxState.translateX = 0;
        lightboxState.translateY = 0;
    } else {
        clampLightboxTranslation();
    }

    image.style.transform = 'translate(' + lightboxState.translateX + 'px, ' + lightboxState.translateY + 'px) scale(' + lightboxState.scale + ')';
    viewport.classList.toggle('is-zoomed', lightboxState.scale > 1.01);
    viewport.classList.toggle('is-dragging', lightboxState.isDragging);

    if (resetButton) {
        resetButton.textContent = Math.round(lightboxState.scale * 100) + '%';
    }
}

function resetLightboxTransform() {
    lightboxState.scale = 1;
    lightboxState.translateX = 0;
    lightboxState.translateY = 0;
    lightboxState.isDragging = false;
    updateLightboxTransform();
}

function setLightboxScale(nextScale) {
    lightboxState.scale = Math.min(lightboxState.maxScale, Math.max(lightboxState.minScale, nextScale));
    updateLightboxTransform();
}

function stepLightboxZoom(direction) {
    const step = 0.25;
    setLightboxScale(lightboxState.scale + direction * step);
}

function openImageLightbox(src, altText) {
    const { lightbox, image, caption } = getLightboxElements();

    if (!lightbox || !image || !caption || !src) return;

    image.onload = function() {
        resetLightboxTransform();
    };

    image.src = src;
    image.alt = altText || 'Enlarged preview';
    caption.textContent = altText || '';
    lightbox.classList.add('is-active');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.classList.add('lightbox-open');
    requestAnimationFrame(function() {
        resetLightboxTransform();
    });
}

function closeImageLightbox() {
    const { lightbox, image, caption } = getLightboxElements();

    if (!lightbox || !image || !caption) return;

    lightbox.classList.remove('is-active');
    lightbox.setAttribute('aria-hidden', 'true');
    image.removeAttribute('src');
    image.alt = '';
    image.style.transform = '';
    caption.textContent = '';
    document.body.classList.remove('lightbox-open');
    resetLightboxTransform();
}

// Scroll to top functionality
function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

// Show/hide scroll to top button
window.addEventListener('scroll', function() {
    const scrollButton = document.querySelector('.scroll-to-top');
    if (window.pageYOffset > 300) {
        scrollButton.classList.add('visible');
    } else {
        scrollButton.classList.remove('visible');
    }
});

document.addEventListener('click', function(event) {
    const figureLink = event.target.closest('.figure-link');
    if (figureLink) {
        const img = figureLink.querySelector('img');
        const src = figureLink.getAttribute('href') || (img && img.getAttribute('src'));
        const altText = img ? img.getAttribute('alt') : '';
        event.preventDefault();
        openImageLightbox(src, altText);
        return;
    }

    const actionButton = event.target.closest('[data-lightbox-action]');
    if (actionButton) {
        const action = actionButton.getAttribute('data-lightbox-action');
        if (action === 'zoom-in') {
            stepLightboxZoom(1);
        } else if (action === 'zoom-out') {
            stepLightboxZoom(-1);
        } else if (action === 'reset') {
            resetLightboxTransform();
        } else if (action === 'close') {
            closeImageLightbox();
        }
        return;
    }

    if (event.target.closest('.image-lightbox__backdrop')) {
        closeImageLightbox();
    }
});

document.addEventListener('keydown', function(event) {
    if (!isLightboxOpen()) return;

    if (event.key === 'Escape') {
        closeImageLightbox();
    } else if (event.key === '+' || event.key === '=') {
        stepLightboxZoom(1);
    } else if (event.key === '-') {
        stepLightboxZoom(-1);
    }
});

(function initLightboxInteractions() {
    const { viewport, image } = getLightboxElements();
    if (!viewport || !image) return;

    viewport.addEventListener('wheel', function(event) {
        const lightbox = document.getElementById('image-lightbox');
        if (!lightbox || !lightbox.classList.contains('is-active')) return;

        event.preventDefault();
        const direction = event.deltaY < 0 ? 1 : -1;
        stepLightboxZoom(direction);
    }, { passive: false });

    image.addEventListener('dblclick', function(event) {
        event.preventDefault();
        if (lightboxState.scale > 1.2) {
            resetLightboxTransform();
        } else {
            setLightboxScale(2.2);
        }
    });

    viewport.addEventListener('pointerdown', function(event) {
        if (lightboxState.scale <= 1.01) return;

        lightboxState.isDragging = true;
        lightboxState.dragStartX = event.clientX - lightboxState.translateX;
        lightboxState.dragStartY = event.clientY - lightboxState.translateY;
        viewport.classList.add('is-dragging');

        if (viewport.setPointerCapture) {
            viewport.setPointerCapture(event.pointerId);
        }
    });

    viewport.addEventListener('pointermove', function(event) {
        if (!lightboxState.isDragging) return;

        lightboxState.translateX = event.clientX - lightboxState.dragStartX;
        lightboxState.translateY = event.clientY - lightboxState.dragStartY;
        updateLightboxTransform();
    });

    function stopDragging(event) {
        if (!lightboxState.isDragging) return;

        lightboxState.isDragging = false;
        viewport.classList.remove('is-dragging');

        if (event && viewport.releasePointerCapture) {
            try {
                viewport.releasePointerCapture(event.pointerId);
            } catch (error) {
                // Ignore release failures from non-captured pointers.
            }
        }
    }

    viewport.addEventListener('pointerup', stopDragging);
    viewport.addEventListener('pointercancel', stopDragging);
    viewport.addEventListener('pointerleave', stopDragging);
})();
