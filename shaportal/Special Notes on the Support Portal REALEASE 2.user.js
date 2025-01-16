// ==UserScript==
// @name         Special Notes on the Support Portal
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  Fetches and displays special handling notes for tickets
// @author       You
// @match        https://support.didlogic.com
// @match        https://support.didlogic.com/tickets/*
// @grant        GM_xmlhttpRequest
// ==/UserScript==

(function() {
    'use strict';

    let notesContainer;

    // Logging functions
    function log(message) {
        console.log(`[DID Logic Notes Fetcher]: ${message}`);
    }

    function logError(message) {
        console.error(`[DID Logic Notes Fetcher ERROR]: ${message}`);
    }

    // Check for the presence of the Wavix logo
    function checkLogo() {
        const logo = document.querySelector('.ticket-logo.wavix-logo');
        if (logo) {
            log("Wavix logo found.");
            observeLogoDisappearance(logo);
            return true;
        } else {
            logError("Wavix logo not found.");
            triggerFailScenario();
            return false;
        }
    }

    // Observe logo disappearance and reload if it happens
    function observeLogoDisappearance(logoElement) {
        const observer = new MutationObserver(() => {
            if (!document.contains(logoElement)) {
                log("Logo disappeared. Reloading page...");
                location.reload();
            }
        });

        observer.observe(document.body, { childList: true, subtree: true });
    }

    // Check if the ticket is a Supplier ticket
    function checkIfSupplierTicket() {
        const supplierLabel = document.querySelector('.ticket-title .label--iSTTr');
        if (supplierLabel && supplierLabel.textContent.trim() === 'Supplier:') {
            logError("This is a Supplier ticket. Triggering fail scenario.");
            triggerFailScenario();
            return true;
        }
        log("This is not a Supplier ticket.");
        return false;
    }

    // Extract user ID from the CDR link
    function extractUserId() {
        const cdrLink = document.querySelector('a[href*="cp.wavix.com/calls/cdr"]');
        if (cdrLink) {
            const userId = new URL(cdrLink.href).searchParams.get('user_id');
            log(`User ID found: ${userId}`);
            return userId;
        } else {
            logError("CDR link not found.");
            triggerFailScenario();
            return null;
        }
    }

    // Fetch notes from the server
    function fetchNotes(id) {
        log(`Fetching notes for user ID: ${id}`);
        const url = `https://vp.unitedline.net/sha/api/notes/${id}`;
        const headers = {
            "x-api-key": "gjOtdjVZt1iF8l7hkknMr1pxi2iheE9rRpqJtKVf5ScTye3oKuRfknwzbTzyq6cUlEkzZKiMFkZaIcKEJVXYg4mP0tFBB76mgszh2MCTAwsQ5QvTTLARUpMnRdL2Zgv1"
        };

        GM_xmlhttpRequest({
            method: "GET",
            url: url,
            headers: headers,
            onload: function(response) {
                log("Server response received.");
                try {
                    const notesData = JSON.parse(response.responseText);
                    if (notesData && notesData.notes && notesData.notes.length > 0) {
                        log(`Notes found: ${notesData.notes.length}`);
                        const notesHtml = notesData.notes.map(note => `<p>${note.note_text}</p>`).join('');
                        createNotesSection(notesHtml);
                    } else {
                        logError("No notes found for this user ID.");
                        triggerFailScenario();
                    }
                } catch (error) {
                    logError("Error parsing notes response.");
                    triggerFailScenario();
                }
            },
            onerror: function() {
                logError("Error fetching notes from the server.");
                triggerFailScenario();
            }
        });
    }

    // Create a section to display notes
    function createNotesSection(notesHtml) {
        if (notesContainer) {
            log("Notes section already exists. Updating content.");
            notesContainer.querySelector('.notes-content').innerHTML = notesHtml;
            return;
        }

        log("Creating notes section.");
        const targetDiv = document.querySelector('.ant-collapse.ant-collapse-icon-position-end.ant-collapse-borderless');
        if (!targetDiv) {
            logError("Target div for notes section not found.");
            return;
        }

        notesContainer = document.createElement('div');
        notesContainer.classList.add('special-handling-notes');
        notesContainer.style.marginTop = '15px';
        notesContainer.style.padding = '10px';
        notesContainer.style.border = '1px solid #ccc';
        notesContainer.style.borderRadius = '8px';
        notesContainer.style.backgroundColor = '#f9f9f9';

        const toggleButton = document.createElement('button');
        toggleButton.textContent = 'Toggle Notes';
        toggleButton.style.display = 'inline-block';
        toggleButton.style.marginBottom = '10px';
        toggleButton.style.padding = '5px 10px';
        toggleButton.style.border = '1px solid #007bff';
        toggleButton.style.borderRadius = '4px';
        toggleButton.style.backgroundColor = '#007bff';
        toggleButton.style.color = '#fff';
        toggleButton.style.cursor = 'pointer';

        const notesContent = document.createElement('div');
        notesContent.className = 'notes-content';
        notesContent.style.display = 'none';
        notesContent.style.padding = '10px';
        notesContent.style.backgroundColor = '#fff';
        notesContent.style.borderRadius = '8px';
        notesContent.style.boxShadow = '0px 1px 6px rgba(0, 0, 0, 0.1)';
        notesContent.innerHTML = notesHtml;

        toggleButton.addEventListener('click', function() {
            notesContent.style.display = notesContent.style.display === 'none' ? 'block' : 'none';
        });

        notesContainer.appendChild(toggleButton);
        notesContainer.appendChild(notesContent);

        targetDiv.insertAdjacentElement('afterend', notesContainer);
        log("Notes section created and added to DOM.");
    }

    // Trigger fail scenario if an issue occurs
    function triggerFailScenario() {
        log("Triggering fail scenario.");
        const ticketTitleContainer = document.querySelector('.ticket-wrapper');
        if (ticketTitleContainer) {
            const observer = new MutationObserver(() => {
                if (!document.contains(ticketTitleContainer)) {
                    log("Ticket title container disappeared. Reloading page...");
                    location.reload();
                }
            });

            observer.observe(ticketTitleContainer, { childList: true, subtree: true });
        } else {
            logError("Ticket title container not found. Reloading page.");
            location.reload();
        }
    }

    // Main function
    function main() {
        log("Starting main process.");
        if (!checkLogo()) return;
        if (checkIfSupplierTicket()) return;
        const userId = extractUserId();
        if (userId) {
            fetchNotes(userId);
        }
    }

    // Observe for the presence of ticket-title-container and initialize
    const observer = new MutationObserver(() => {
        const ticketTitleContainer = document.querySelector('.ticket-title');
        if (ticketTitleContainer) {
            log("Ticket title container detected.");
            observer.disconnect();
            main();
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });
})();
