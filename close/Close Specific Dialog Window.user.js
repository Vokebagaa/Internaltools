// ==UserScript==
// @name         Close Specific Dialog Window
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  https://didlogic.atlassian.net/browse/SUP-46
// @updateURL https://github.com/Vokebagaa/Internaltools/raw/refs/heads/main/close/Close%20Specific%20Dialog%20Window.user.js
// @downloadURL https://github.com/Vokebagaa/Internaltools/raw/refs/heads/main/close/Close%20Specific%20Dialog%20Window.user.js
// @author       Asset Agabekov
// @match        https://support.didlogic.com/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    function createCloseButtonForSpecificModal(modalContent) {
        const okButton = modalContent.querySelector('.ant-modal-footer .ant-btn.ant-btn-default');
        const notificationText = modalContent.querySelector('.ant-modal-body .textNotification--gmPPV');

        if (okButton && notificationText && notificationText.textContent.includes('The ticket has been updated')) {
            if (!modalContent.querySelector('#closeDialogButton')) {
                const closeButton = document.createElement('button');
                closeButton.id = 'closeDialogButton';
                closeButton.textContent = 'Close Dialog Window';
                closeButton.className = 'ant-btn ant-btn-dangerous';
                closeButton.style.marginLeft = '10px';

                closeButton.addEventListener('click', function() {
                    const modalElement = modalContent.closest('.ant-modal');
                    const modalWrapElement = modalElement.closest('.ant-modal-wrap.ant-modal-centered');
                    const modalMaskElements = document.querySelectorAll('.ant-modal-mask');

                    if (modalElement) modalElement.remove();
                    if (modalWrapElement) modalWrapElement.remove();
                    modalMaskElements.forEach(mask => mask.remove());

                    const bodyElement = document.querySelector('body');
                    if (bodyElement) {
                        bodyElement.classList.remove('ant-scrolling-effect');
                        bodyElement.removeAttribute('style');
                    }
                });

                okButton.parentElement.appendChild(closeButton);
            }
        }
    }

    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.addedNodes.length > 0) {
                const modals = document.querySelectorAll('.ant-modal-content');
                modals.forEach(modalContent => {
                    createCloseButtonForSpecificModal(modalContent);
                });
            }
        });
    });

    observer.observe(document.body, { childList: true, subtree: true });

    const existingModals = document.querySelectorAll('.ant-modal-content');
    existingModals.forEach(modalContent => {
        createCloseButtonForSpecificModal(modalContent);
    });
})();
