onload = function () {
  const DEFAULT_ARM_COLORS = {
    top: '#945f44',
    bottom: '#ffcc9c',
    outline: '#000000',
  };

  const CHARACTER_DEFINITIONS = {
    ty: {
      id: 'ty',
      name: 'TY',
      pageTitle: 'Playing With TY',
      faceMask: 'assets/TY/TY-eyesopen.png',
      armColors: {
        top: '#945f44',
        bottom: '#ffcc9c',
        outline: '#000000',
      },
      slots: {
        body: 'assets/TY/TY-body.png',
        'eyes-open': 'assets/TY/TY-eyesopen.png',
        'eyes-blink': 'assets/TY/TY-eyesblink.png',
        'eyes-dizzy': 'assets/TY/TY-expression-dizzy.png',
        'eyes-nose': 'assets/TY/TY-eyes-noseclicked.png',
        nose: 'assets/TY/TY-nose.png',
        'iris-left': 'assets/TY/TY-iris-l.png',
        'iris-right': 'assets/TY/TY-iris-r.png',
        'iris-dizzy-left': 'assets/TY/TY-dizzy-iris-l.png',
        'iris-dizzy-right': 'assets/TY/TY-dizzy-iris-r.png',
        'hand-left': 'assets/TY/TY-hand.png',
        'hand-right': 'assets/TY/TY-hand.png',
      },
    },
    buddy: {
      id: 'buddy',
      name: 'Buddy',
      pageTitle: 'Playing With Buddy',
      faceMask: 'assets/blank.png',
      armColors: {
        top: '#bdbdbdff',
        bottom: '#f4f4f4ff',
        outline: '#000000ff',
      },
      slots: {
        body: 'assets/Buddy/BUDDY-body.png',
        'eyes-open': 'assets/blank.png',
        'eyes-blink': 'assets/Buddy/BUDDY-eyes-blink.png',
        'eyes-dizzy': 'assets/Buddy/BUDDY-expression-dizzy.png',
        'eyes-nose': 'assets/Buddy/BUDDY-eyes-noseclick.png',
        nose: 'assets/Buddy/BUDDY-nose.png',
        'iris-left': 'assets/Buddy/BUDDY-eyes-open.png',
        'iris-right': 'assets/blank.png',
        'iris-dizzy-left': 'assets/Buddy/BUDDY-eyes-open.png',
        'iris-dizzy-right': 'assets/blank.png',
        'hand-left': 'assets/Buddy/BUDDY-hand.png',
        'hand-right': 'assets/Buddy/BUDDY-hand.png',
      },
    },
  };

  const characterElement = document.querySelector('.character');
  const characterSelect = document.getElementById('character-select');
  const slotElements = {};

  document.querySelectorAll('[data-slot]').forEach((el) => {
    const slotName = el.dataset.slot;
    if (slotName) {
      slotElements[slotName] = el;
    }
  });

  const resetCharacterState = () => {
    if (!characterElement) return;
    const blinkLayer = characterElement.querySelector('.character__layer--eyes-blink');
    blinkLayer && blinkLayer.classList.remove('is-visible');

    const dizzyLayer = characterElement.querySelector('.character__layer--eyes-dizzy');
    if (dizzyLayer) {
      dizzyLayer.classList.remove('is-visible', 'was-dizzy');
    }

    const eyesOpenLayer = characterElement.querySelector('.character__layer--eyes-open');
    eyesOpenLayer && eyesOpenLayer.classList.remove('is-hidden');

    const noseLayer = characterElement.querySelector('.character__layer--eyes-nose');
    noseLayer && noseLayer.classList.remove('is-active');

    characterElement.querySelectorAll('.character__iris').forEach((iris) => {
      iris.classList.remove('is-hidden');
    });
    characterElement.querySelectorAll('.character__iris--dizzy').forEach((iris) => {
      iris.classList.remove('is-visible');
      iris.style.removeProperty('--spin-angle');
    });

    document.querySelectorAll('.hand.is-grabbing').forEach((hand) => {
      hand.classList.remove('is-grabbing');
    });
    document.body.classList.remove('is-dragging-hand');
  };

  const applyCharacterDefinition = (characterId) => {
    if (!characterElement) return null;
    const characterDef = CHARACTER_DEFINITIONS[characterId];
    if (!characterDef) return null;

    characterElement.dataset.character = characterDef.id;

    Object.entries(characterDef.slots || {}).forEach(([slot, assetPath]) => {
      const el = slotElements[slot];
      if (!el) return;
      if (!assetPath) {
        console.warn(`Missing asset for slot "${slot}" in character "${characterDef.id}"`);
        return;
      }
      if (el.tagName === 'IMG') {
        if (el.getAttribute('src') !== assetPath) {
          el.src = assetPath;
        }
        if (slot === 'hand-left') {
          el.alt = `Left hand of ${characterDef.name}`;
        } else if (slot === 'hand-right') {
          el.alt = `Right hand of ${characterDef.name}`;
        } else {
          el.alt = '';
        }
      }
    });

    if (characterDef.faceMask) {
      characterElement.style.setProperty('--face-mask', `url('${characterDef.faceMask}')`);
    }

    const armColors = Object.assign({}, DEFAULT_ARM_COLORS, characterDef.armColors || {});
    const rootStyle = document.documentElement.style;
    rootStyle.setProperty('--arm-color-top', armColors.top);
    rootStyle.setProperty('--arm-color-bottom', armColors.bottom);
    rootStyle.setProperty('--arm-outline-color', armColors.outline);

    if (characterDef.pageTitle) {
      document.title = characterDef.pageTitle;
    } else if (characterDef.name) {
      document.title = `Playing With ${characterDef.name}`;
    }

    resetCharacterState();

    return characterDef;
  };

  const changeListeners = new Set();

  const notifyCharacterChange = (def) => {
    changeListeners.forEach((handler) => {
      try {
        handler(def);
      } catch (error) {
        console.error('Error running character change handler', error);
      }
    });
  };

  const setupCharacterSelection = () => {
    if (!characterElement || !characterSelect) {
      return {
        addChangeListener() {},
        applyCharacter() {},
      };
    }

    characterSelect.innerHTML = '';
    Object.values(CHARACTER_DEFINITIONS).forEach((def) => {
      const option = document.createElement('option');
      option.value = def.id;
      option.textContent = def.name || def.id;
      characterSelect.appendChild(option);
    });

    const initialId =
      (characterElement.dataset.character && CHARACTER_DEFINITIONS[characterElement.dataset.character])
        ? characterElement.dataset.character
        : Object.keys(CHARACTER_DEFINITIONS)[0];

    if (initialId) {
      characterSelect.value = initialId;
      const def = applyCharacterDefinition(initialId);
      if (def) {
        notifyCharacterChange(def);
      }
    }

    characterSelect.addEventListener('change', (event) => {
      const selectedId = event.target.value;
      const def = applyCharacterDefinition(selectedId);
      if (def) {
        notifyCharacterChange(def);
      }
    });

    return {
      addChangeListener(handler) {
        if (typeof handler === 'function') {
          changeListeners.add(handler);
        }
        return () => changeListeners.delete(handler);
      },
      applyCharacter(characterId) {
        const def = applyCharacterDefinition(characterId);
        if (def) {
          notifyCharacterChange(def);
        }
        return def;
      },
    };
  };

  const selectionApi = setupCharacterSelection();

  let applyEyeOffsets = () => {};

  const initEyes = () => {
    const face = document.querySelector('.character');
    if (!face) return;

    const leftIris = face.querySelector('.character__iris--l');
    const rightIris = face.querySelector('.character__iris--r');
    if (!leftIris || !rightIris) return;

    const blinkLayer = face.querySelector('.character__layer--eyes-blink');
    const dizzyLayer = face.querySelector('.character__layer--eyes-dizzy');
    const eyesOpenLayer = face.querySelector('.character__layer--eyes-open');
    const noseClickLayer = face.querySelector('.character__layer--eyes-nose');

    const irisMeta = [
      {
        el: leftIris,
        center: { x: 891 / 2250, y: 981 / 1688 },
        baseRange: {
          x: ((912 - 870) / 2250) * 1.35,
          y: ((1099 - 863) / 1688) * 0.38,
        },
      },
      {
        el: rightIris,
        center: { x: 1380 / 2250, y: 981 / 1688 },
        baseRange: {
          x: ((1401 - 1359) / 2250) * 1.35,
          y: ((1099 - 863) / 1688) * 0.38,
        },
      },
    ];

    const dizzyIrisMeta = [];
    const leftIrisDizzy = face.querySelector('.character__iris--dizzy-l');
    const rightIrisDizzy = face.querySelector('.character__iris--dizzy-r');
    if (leftIrisDizzy && rightIrisDizzy) {
      dizzyIrisMeta.push(
        {
          el: leftIrisDizzy,
          center: irisMeta[0].center,
          baseRange: irisMeta[0].baseRange,
        },
        {
          el: rightIrisDizzy,
          center: irisMeta[1].center,
          baseRange: irisMeta[1].baseRange,
        }
      );
    }

    const lastPos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    let lastMove = { x: window.innerWidth / 2, y: window.innerHeight / 2, t: performance.now() };

    const updateIrisOffsets = (x, y) => {
      lastPos.x = x;
      lastPos.y = y;

      const rect = face.getBoundingClientRect();
      if (!rect.width || !rect.height) return;

      const responsiveness = 1.85;

      const pointer = {
        x: (x - rect.left) / rect.width,
        y: (y - rect.top) / rect.height,
      };

      const applyTo = (metaList, scale = 1) => {
        metaList.forEach(({ el, center, baseRange }) => {
          const rangeXPx = (baseRange.x * 0.7 || 1e-6) * rect.width;
          const rangeYPx = (baseRange.y * 0.7 || 1e-6) * rect.height;

          const dxPx = (pointer.x - center.x) * rect.width * responsiveness * scale;
          const dyPx = (pointer.y - center.y) * rect.height * responsiveness * scale;

        const rotX = dyPx; // rotate 90 degrees counter-clockwise
        const rotY = -dxPx;

        let normX = rotX / rangeXPx;
        let normY = rotY / rangeYPx;
        const distanceSq = normX * normX + normY * normY;
        if (distanceSq > 1) {
          const scale = 1 / Math.sqrt(distanceSq);
          normX *= scale;
          normY *= scale;
        }

        const clampedRotX = normX * rangeXPx;
        const clampedRotY = normY * rangeYPx;

        const finalDx = -clampedRotY;
        const finalDy = clampedRotX;

          el.style.setProperty('--dx', `${finalDx}px`);
          el.style.setProperty('--dy', `${finalDy}px`);
        });
      };

      applyTo(irisMeta, 1);
      applyTo(dizzyIrisMeta, 0.42);
    };

    applyEyeOffsets = updateIrisOffsets;

    const FAST_ACTIVATE_SPEED = 3.0; // px per ms
    const FAST_DEACTIVATE_SPEED = 1.8; // px per ms
    const FAST_REQUIRED_MS = 650;
    let fastIntensityMs = 0;

    const handlePointerMove = (event) => {
      applyEyeOffsets(event.clientX, event.clientY);

      const now = performance.now();
      const dt = now - lastMove.t;
      if (dt > 0) {
        const dx = event.clientX - lastMove.x;
        const dy = event.clientY - lastMove.y;
        const speed = Math.hypot(dx, dy) / dt; // px per ms
        if (speed > FAST_ACTIVATE_SPEED) {
          fastIntensityMs = Math.min(fastIntensityMs + dt, FAST_REQUIRED_MS * 2);
          if (fastIntensityMs >= FAST_REQUIRED_MS) {
            activateDizzy();
          }
        } else {
          const decay = dt * (speed < FAST_DEACTIVATE_SPEED ? 1.35 : 0.6);
          fastIntensityMs = Math.max(0, fastIntensityMs - decay);
          if (dizzyActive && fastIntensityMs <= FAST_REQUIRED_MS * 0.25 && speed < FAST_DEACTIVATE_SPEED) {
            scheduleDizzyCooldown();
          }
        }
      }
      lastMove = { x: event.clientX, y: event.clientY, t: now };
    };

    document.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('resize', () => {
      applyEyeOffsets(lastPos.x, lastPos.y);
    });

    let blinkTimer = null;
    let noseActive = false;
    let dizzyActive = false;
    let dizzyTimer = null;
    let noseTimer = null;
    let handDragActive = false;

    const setDizzyIrisVisible = (visible) => {
      dizzyIrisMeta.forEach(({ el }) => {
        el.classList.toggle('is-visible', visible);
        if (!visible) {
          el.style.setProperty('--spin-angle', '0deg');
        } else {
          el.style.removeProperty('--spin-angle');
        }
      });
    };

    const syncDizzyIris = () => {
      setDizzyIrisVisible(dizzyActive && !noseActive);
    };

    const setEyesHidden = (hidden) => {
      if (hidden) {
        if (eyesOpenLayer) eyesOpenLayer.classList.add('is-hidden');
        irisMeta.forEach(({ el }) => el.classList.add('is-hidden'));
      } else if (!noseActive && !dizzyActive) {
        if (eyesOpenLayer) eyesOpenLayer.classList.remove('is-hidden');
        irisMeta.forEach(({ el }) => el.classList.remove('is-hidden'));
      }
      syncDizzyIris();
    };

    const hideEyes = () => setEyesHidden(true);
    const showEyes = () => setEyesHidden(false);

    const clearBlinkTimer = () => {
      if (blinkTimer) {
        clearTimeout(blinkTimer);
        blinkTimer = null;
      }
    };

    const triggerNoseFlash = (duration = 420) => {
      if (!noseClickLayer) return;
      noseActive = true;
      clearBlinkTimer();
      if (blinkLayer) blinkLayer.classList.remove('is-visible');
      noseClickLayer.classList.add('is-active');
      setEyesHidden(true);
      if (noseTimer) clearTimeout(noseTimer);
      noseTimer = setTimeout(() => {
        noseClickLayer.classList.remove('is-active');
        noseActive = false;
        showEyes();
        queueBlink();
        noseTimer = null;
      }, duration);
    };

    const deactivateDizzy = () => {
      dizzyActive = false;
      fastIntensityMs = 0;
      if (dizzyLayer) {
        dizzyLayer.classList.remove('is-visible');
        dizzyLayer.classList.add('was-dizzy');
        requestAnimationFrame(() => {
          dizzyLayer && dizzyLayer.classList.remove('was-dizzy');
        });
      }
      showEyes();
      queueBlink();
    };

    const scheduleDizzyCooldown = () => {
      if (!dizzyActive) return;
      if (dizzyTimer) clearTimeout(dizzyTimer);
      dizzyTimer = setTimeout(() => {
        dizzyTimer = null;
        deactivateDizzy();
      }, 900);
    };

    const activateDizzy = () => {
      if (dizzyActive) {
        scheduleDizzyCooldown();
        return;
      }
      dizzyActive = true;
      if (dizzyLayer) dizzyLayer.classList.add('is-visible');
      clearBlinkTimer();
      if (blinkLayer) blinkLayer.classList.remove('is-visible');
      hideEyes();
      scheduleDizzyCooldown();
    };

    const queueBlink = () => {
      if (!blinkLayer || noseActive || dizzyActive) return;
      clearBlinkTimer();
      const delay = 2600 + Math.random() * 3400;
      blinkTimer = setTimeout(() => {
        blinkLayer.classList.add('is-visible');
        hideEyes();
        setTimeout(() => {
          blinkLayer.classList.remove('is-visible');
          showEyes();
          queueBlink();
        }, 160);
      }, delay);
    };

    queueBlink();

    if (blinkLayer) {
      window.addEventListener('blur', () => {
        clearBlinkTimer();
        blinkLayer.classList.remove('is-visible');
        showEyes();
      });

      window.addEventListener('focus', () => {
        if (!noseActive && !dizzyActive) {
          blinkLayer.classList.remove('is-visible');
          showEyes();
        }
        queueBlink();
      });
    }

    if (noseClickLayer) {
      const noseBounds = {
        left: 1092 / 2250,
        right: 1165 / 2250,
        top: 998 / 1688,
        bottom: 1060 / 1688,
      };

      face.addEventListener('pointerdown', (event) => {
        const rect = face.getBoundingClientRect();
        const relX = (event.clientX - rect.left) / rect.width;
        const relY = (event.clientY - rect.top) / rect.height;
        if (
          relX >= noseBounds.left &&
          relX <= noseBounds.right &&
          relY >= noseBounds.top &&
          relY <= noseBounds.bottom
        ) {
          triggerNoseFlash();
          event.preventDefault();
        }
      });
    }

    const handleHandGrab = () => {
      handDragActive = true;
      clearBlinkTimer();
      if (noseTimer) {
        clearTimeout(noseTimer);
        noseTimer = null;
      }
      if (noseActive && noseClickLayer) {
        noseClickLayer.classList.remove('is-active');
        noseActive = false;
      }
      showEyes();
      if (dizzyLayer) dizzyLayer.classList.add('is-visible');
    };

    const handleHandRelease = () => {
      if (!handDragActive) return;
      handDragActive = false;
      if (dizzyLayer){
        reverttimer = setTimeout(() => {
          reverttimer = null;
          dizzyLayer.classList.remove('is-visible');
        },600);
      }
      triggerNoseFlash(600);
    };

    requestAnimationFrame(() => {
      applyEyeOffsets(window.innerWidth / 2, window.innerHeight / 2);
    });
    return {
      onHandGrab: handleHandGrab,
      onHandRelease: handleHandRelease,
    };
  };

  const initHands = (eyeApi) => {
    const limbElems = Array.from(document.querySelectorAll('.limb'));
    if (!limbElems.length) return;

    const updateArmForHand = (arm, hand) => {
      if (!arm || !hand) return;
      const limb = arm.parentElement;
      if (!limb) return;

      const anchorRect = limb.getBoundingClientRect();
      const handRect = hand.getBoundingClientRect();

      const anchorX = anchorRect.left + anchorRect.width / 2;
      const anchorY = anchorRect.bottom;
      const targetX = handRect.left + handRect.width / 2;
      const targetY = handRect.top + handRect.height * 0.5;

      const dx = targetX - anchorX;
      const dy = targetY - anchorY;

      const baseLength = arm.__baseLength || (arm.__baseLength = arm.getBoundingClientRect().height || 1);
      const distance = Math.hypot(dx, dy);
      const stretch = Math.max(distance / baseLength, 0.02);
      const angle = Math.atan2(dx, -dy); // rotate around bottom center

      arm.style.setProperty('--stretch', stretch.toFixed(3));
      arm.style.setProperty('--angle', `${(angle * 180) / Math.PI}deg`);
    };

    limbElems.forEach((limb, index) => {
      const hand = limb.querySelector('.hand');
      if (!hand) return;
      const arm = limb.querySelector('.arm');
      if (arm && !arm.id) arm.id = `arm-${index}`;
      hand.style.setProperty('--dx', '0px');
      hand.style.setProperty('--dy', '0px');
      const state = {
        pointerId: null,
        dragging: false,
        startX: 0,
        startY: 0,
        startDx: 0,
        startDy: 0,
        dx: 0,
        dy: 0,
        vx: 0,
        vy: 0,
        anim: null,
        arm,
      };

      updateArmForHand(state.arm, hand);

      const setOffset = (dx, dy) => {
        state.dx = dx;
        state.dy = dy;
        hand.style.setProperty('--dx', `${dx}px`);
        hand.style.setProperty('--dy', `${dy}px`);
        updateArmForHand(state.arm, hand);
      };

      const stopAnim = () => {
        if (state.anim) {
          cancelAnimationFrame(state.anim);
          state.anim = null;
        }
      };

      const springHome = () => {
        stopAnim();
        const k = 0.4;
        const damping = 0.64;

        const step = () => {
          const ax = -state.dx * k;
          const ay = -state.dy * k;
          state.vx = (state.vx + ax) * damping;
          state.vy = (state.vy + ay) * damping;
          const nextDx = state.dx + state.vx;
          const nextDy = state.dy + state.vy;

          if (
            Math.abs(nextDx) < 0.4 &&
            Math.abs(nextDy) < 0.4 &&
            Math.abs(state.vx) < 0.3 &&
            Math.abs(state.vy) < 0.3
          ) {
            setOffset(0, 0);
            updateArmForHand(state.arm, hand);
            state.vx = 0;
            state.vy = 0;
            state.anim = null;
            return;
          }

          setOffset(nextDx, nextDy);
          state.anim = requestAnimationFrame(step);
        };

        state.anim = requestAnimationFrame(step);
      };

      const endDrag = (event) => {
        if (!state.dragging || event.pointerId !== state.pointerId) return;
        state.dragging = false;
        state.pointerId = null;
        try { hand.releasePointerCapture(event.pointerId); } catch (_) {}
        hand.classList.remove('is-grabbing');
        document.body.classList.remove('is-dragging-hand');
        if (eyeApi && typeof eyeApi.onHandRelease === 'function') {
          eyeApi.onHandRelease();
        }
        springHome();
      };

      hand.addEventListener('pointerdown', (event) => {
        if (event.button !== 0 || state.dragging) return;
        event.preventDefault();
        try { hand.setPointerCapture(event.pointerId); } catch (_) {}
        stopAnim();
        state.dragging = true;
        state.pointerId = event.pointerId;
        state.startX = event.clientX;
        state.startY = event.clientY;
        state.startDx = state.dx;
        state.startDy = state.dy;
        state.vx = 0;
        state.vy = 0;
        hand.classList.add('is-grabbing');
        document.body.classList.add('is-dragging-hand');
        applyEyeOffsets(event.clientX, event.clientY);
        if (eyeApi && typeof eyeApi.onHandGrab === 'function') {
          eyeApi.onHandGrab();
        }
      });

      hand.addEventListener('pointermove', (event) => {
        if (!state.dragging || event.pointerId !== state.pointerId) return;
        const dx = state.startDx + (event.clientX - state.startX);
        const dy = state.startDy + (event.clientY - state.startY);
        setOffset(dx, dy);
        applyEyeOffsets(event.clientX, event.clientY);
      });

      hand.addEventListener('pointerup', endDrag);
      hand.addEventListener('pointercancel', endDrag);
    });
  };

  const eyeApi = initEyes();
  if (selectionApi && typeof selectionApi.addChangeListener === 'function') {
    selectionApi.addChangeListener(() => {
      requestAnimationFrame(() => {
        applyEyeOffsets(window.innerWidth / 2, window.innerHeight / 2);
      });
    });
  }
  initHands(eyeApi);
};
