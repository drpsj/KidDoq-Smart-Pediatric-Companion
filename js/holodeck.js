// holodeck.js
const HoloDeckEngine = (function() {
    let stage, cards = [];
    let currentIndex = 0;
    let startX = 0;
    let isDragging = false;

    // --- SPATIAL STATE MACHINE ENGINE ---
    function renderPhysics(animate = true) {
        const total = cards.length;
        
                // 🚀 ARCHITECTURE FIX 1: True Spatial Stacking
        if (stage) {
            stage.style.setProperty('perspective', '1200px', 'important');
            stage.style.setProperty('transform-style', 'preserve-3d', 'important'); // 🚀 FIX: Restored true 3D physics
            stage.style.setProperty('width', '100vw', 'important');
            stage.style.setProperty('height', '100dvh', 'important');
            stage.style.setProperty('display', 'block', 'important');
            stage.style.setProperty('overflow', 'visible', 'important'); 
        }

        cards.forEach((card, index) => {
            if (animate) {
                card.style.setProperty('transition', 'transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.5s ease', 'important');
            } else {
                card.style.setProperty('transition', 'none', 'important');
            }

            // 🚀 ARCHITECTURE FIX 2: Scrub Legacy HTML Ghost Classes
            card.classList.remove('slot-active', 'slot-prev', 'slot-next', 'slot-hidden');

            // Circular Shortest-Path Math
            let offset = index - currentIndex;
            const half = total / 2;
            if (offset > half) offset -= total;
            else if (offset < -half) offset += total;

            const absOffset = Math.abs(offset);
            
            // 🚀 FIX: 3D Spatial Math (Injects true Z-translation)
            let rotateY = offset * -25;
            let translateX = offset * 70; 
            let translateZ = absOffset * -150; // Pushes inactive cards deep into the background
            let scale = 1 - (absOffset * 0.05); 
            let opacity = absOffset === 0 ? 1 : Math.max(0, 0.6 - (absOffset * 0.25));
            
            // Authoritative Base-10000 Z-Index (Failsafe)
            let zIndex = 10000 - absOffset;

            card.style.setProperty('display', 'flex', 'important');
            card.style.setProperty('position', 'absolute', 'important');
            card.style.setProperty('top', '0', 'important');
            card.style.setProperty('bottom', '0', 'important');
            card.style.setProperty('left', '0', 'important');
            card.style.setProperty('right', '0', 'important');
            card.style.setProperty('margin', 'auto', 'important');
            
            card.style.setProperty('width', '90vw', 'important');
            card.style.setProperty('height', '75vh', 'important');
            card.style.setProperty('max-width', '450px', 'important');
            card.style.setProperty('max-height', '800px', 'important');

            // 🚀 SURGICAL FIX: Apply Z-translation to the matrix
            card.style.setProperty('transform', `translateX(${translateX}%) translateZ(${translateZ}px) rotateY(${rotateY}deg) scale(${scale})`, 'important');
            card.style.setProperty('opacity', opacity, 'important');
            card.style.setProperty('z-index', zIndex, 'important');
            
            // 🚀 ARCHITECTURE FIX 4: True is-expanded Lifecycle Handover
            if (absOffset === 0) {
                card.style.setProperty('pointer-events', 'auto', 'important');
                card.classList.add('is-expanded'); // Wake up center card
            } else {
                card.style.setProperty('pointer-events', 'none', 'important');
                card.classList.remove('is-expanded'); // Put peripheral cards to sleep
            }
        });
    }

    // --- GESTURE CONTROLLER ---
    function onTouchStart(e) {
        e.stopPropagation();
        isDragging = true;
        startX = e.touches[0].clientX;
    }

    function onTouchMove(e) {
        if (!isDragging) return;
        e.stopPropagation(); 
        e.preventDefault(); 
    }

    function onTouchEnd(e) {
        e.stopPropagation(); 
        if (!isDragging) return;
        isDragging = false;
        
        const deltaX = e.changedTouches[0].clientX - startX;
        const threshold = 40; 
        const total = cards.length;

        if (total === 0) return;

        // Infinite Modulo Logic
        if (deltaX < -threshold) {
            currentIndex = (currentIndex + 1) % total; 
        } else if (deltaX > threshold) {
            currentIndex = (currentIndex - 1 + total) % total; 
        }
        
        renderPhysics(true);
    }

    return {
        mount: function(containerId, startCardId) {
            const container = document.getElementById(containerId);
            if (!container) return;

            stage = document.getElementById('workspaceCarousel');
            if (!stage) return;
            
            cards = Array.from(stage.querySelectorAll('.bento-card'));
            if (cards.length === 0) return;

            currentIndex = Math.max(0, cards.findIndex(c => c.id === startCardId));

            // Initialize sub-tabs (is-expanded state is now dynamically managed by renderPhysics)
            cards.forEach(card => {
                const firstTab = card.querySelector('.sub-tab-content');
                if (firstTab) firstTab.style.setProperty('display', 'block', 'important');
            });

            container.style.display = 'block';

            // Bind Touch Events
            stage.addEventListener('touchstart', onTouchStart, { passive: true });
            stage.addEventListener('touchmove', onTouchMove, { passive: false });
            stage.addEventListener('touchend', onTouchEnd, { passive: true });

            requestAnimationFrame(() => {
                container.style.opacity = '1';
                renderPhysics(false); 
                requestAnimationFrame(() => renderPhysics(true)); 
            });
        },

        destroy: function(containerId) {
            const container = document.getElementById(containerId);
            if (!container) return;

            container.style.opacity = '0';
            
            setTimeout(() => {
                container.style.display = 'none';
                if (stage) {
                    stage.removeEventListener('touchstart', onTouchStart);
                    stage.removeEventListener('touchmove', onTouchMove);
                    stage.removeEventListener('touchend', onTouchEnd);
                }
                
                // Put tools back to sleep
                if (cards) {
                    cards.forEach(card => {
                        card.classList.remove('is-expanded');
                        const firstTab = card.querySelector('.sub-tab-content');
                        if (firstTab) firstTab.style.display = '';
                    });
                }
                cards = [];
            }, 400); 
        }
    };
})();