// holodeck.js
const HoloDeckEngine = (function() {
    let stage, cards = [];
    let currentIndex = 0;
    let startX = 0;
    let isDragging = false;

    // --- SPATIAL MATH ENGINE ---
    function renderPhysics(animate = true) {
        const total = cards.length;
        
        // 🚀 GOD-MODE 1: Un-Cage the 3D Space (Prevents Safari/Chrome Z-Clipping)
        if (stage) {
            stage.style.setProperty('perspective', '1200px', 'important');
            stage.style.setProperty('transform-style', 'preserve-3d', 'important');
            stage.style.setProperty('width', '100vw', 'important');
            stage.style.setProperty('height', '100dvh', 'important');
            stage.style.setProperty('display', 'block', 'important');
            stage.style.setProperty('overflow', 'visible', 'important'); // 🚀 Changed from hidden to visible
        }

        cards.forEach((card, index) => {
            if (animate) {
                card.style.setProperty('transition', 'transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.5s ease, filter 0.5s ease', 'important');
            } else {
                card.style.setProperty('transition', 'none', 'important');
            }

            // Circular Shortest-Path Math
            let offset = index - currentIndex;
            const half = total / 2;
            if (offset > half) offset -= total;
            else if (offset < -half) offset += total;

            const absOffset = Math.abs(offset);
            
            // 🚀 GOD-MODE 2: Safer 3D Depths to prevent swallowing
            let rotateY = offset * -35; // Slightly shallower rotation
            let translateZ = absOffset * -120; // Reduced from -250px so they don't clip into the backdrop
            let translateX = offset * 70; // Wider horizontal spread
            let scale = 1 - (absOffset * 0.1); 
            
            let opacity = absOffset === 0 ? 1 : Math.max(0, 0.7 - (absOffset * 0.2));
            let blur = absOffset === 0 ? 'blur(0px)' : `blur(${absOffset * 3}px)`;
            let zIndex = 100 - absOffset;

            if (absOffset > 2) opacity = 0; // Cull extreme peripherals

            // 🚀 GOD-MODE 3: Force Dimensions & Backface Visibility
            card.style.setProperty('display', 'flex', 'important');
            card.style.setProperty('visibility', 'visible', 'important');
            card.style.setProperty('position', 'absolute', 'important');
            card.style.setProperty('top', '0', 'important');
            card.style.setProperty('bottom', '0', 'important');
            card.style.setProperty('left', '0', 'important');
            card.style.setProperty('right', '0', 'important');
            card.style.setProperty('margin', 'auto', 'important');
            card.style.setProperty('backface-visibility', 'visible', 'important'); // Stops rotation vanishing
            
            // Hardcode dimensions
            card.style.setProperty('width', '90vw', 'important');
            card.style.setProperty('height', '75vh', 'important');
            card.style.setProperty('max-width', '450px', 'important');
            card.style.setProperty('max-height', '800px', 'important');

            // Apply calculated 3D Physics
            card.style.setProperty('transform', `translate3d(${translateX}%, 0, ${translateZ}px) rotateY(${rotateY}deg) scale(${scale})`, 'important');
            card.style.setProperty('opacity', opacity, 'important');
            card.style.setProperty('filter', blur, 'important');
            card.style.setProperty('z-index', zIndex, 'important');
            
            // Only the center card is interactive
            card.style.setProperty('pointer-events', absOffset === 0 ? 'auto' : 'none', 'important');
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

            // 🚀 GOD-MODE 4: Wake up inner clinical tools (sub-tabs)
            cards.forEach(card => {
                card.classList.add('is-expanded');
                // Force first sub-tab to be active if it exists, otherwise it stays blank
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