// ==UserScript==
// @name         Special Handling Notes Notes for CP Wavix
// @namespace    http://tampermonkey.net/
// @version      3.0
// @description  https://didlogic.atlassian.net/browse/SUP-39
// @author       You
// @match        *https://cp.wavix.com/*
// @grant        GM_xmlhttpRequest
// @require      https://code.jquery.com/jquery-3.6.0.min.js
// ==/UserScript==

(function () {
    'use strict';

    // Extracts the user ID from the URL
    function getUserIdFromUrl() {
        const urlParts = window.location.pathname.split('/');
        return urlParts.includes('edit') ? urlParts[urlParts.indexOf('edit') + 1] : null;
    }

    const apiUrl = "https://vp.unitedline.net/sha/api/notes";
    const apiKey = "gjOtdjVZt1iF8l7hkknMr1pxi2iheE9rRpqJtKVf5ScTye3oKuRfknwzbTzyq6cUlEkzZKiMFkZaIcKEJVXYg4mP0tFBB76mgszh2MCTAwsQ5QvTTLARUpMnRdL2Zgv1";
    let currentUserId = null;
    let specialHandlingNotesBlock = null;

    // Loads the Quill editor (for rich text editing)
    function loadQuill(callback) {
        const quillCSS = document.createElement('link');
        quillCSS.rel = 'stylesheet';
        quillCSS.href = 'https://cdn.quilljs.com/1.3.6/quill.snow.css';
        document.head.appendChild(quillCSS);

        const quillScript = document.createElement('script');
        quillScript.src = 'https://cdn.quilljs.com/1.3.6/quill.min.js';
        quillScript.onload = callback;
        document.body.appendChild(quillScript);
    }

    // Fetches the user's saved notes from the backend
    async function fetchNotes(apiKey, userId) {
        const targetUrl = `${apiUrl}/${userId}`;
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: "GET",
                url: targetUrl,
                headers: {
                    "Content-Type": "application/json",
                    "x-api-key": apiKey
                },
                onload: function (response) {
                    if (response.status === 200) {
                        try {
                            const data = JSON.parse(response.responseText);
                            resolve(data.notes || []);
                        } catch (error) {
                            reject(`Error parsing response: ${error}`);
                        }
                    } else {
                        reject(`Failed to fetch notes: ${response.status} ${response.statusText}`);
                    }
                },
                onerror: function (error) {
                    reject(`Request failed: ${error}`);
                }
            });
        });
    }

    // Saves the note back to the backend
    async function saveNotes(content, apiKey, userId) {
        const targetUrl = `${apiUrl}/${userId}`;
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: "PUT",
                url: targetUrl,
                headers: {
                    "Content-Type": "application/json",
                    "x-api-key": apiKey
                },
                data: JSON.stringify({ note_text: content }),
                onload: function (response) {
                    if (response.status === 200) {
                        resolve('Notes saved successfully');
                    } else {
                        const error = JSON.parse(response.responseText || '{}');
                        reject(`Failed to save notes: ${response.status} ${error.message || response.statusText}`);
                    }
                },
                onerror: function (error) {
                    reject(`Request failed: ${error}`);
                }
            });
        });
    }

    // Adds the Special Handling Notes block to the page
    async function addSpecialHandlingNotesBlock() {
        const observer = new MutationObserver((mutationsList, observer) => {
            const targetBlock = document.querySelector('.MuiPaper-root.MuiPaper-elevation.MuiPaper-rounded.MuiPaper-elevation1');
            if (targetBlock && !specialHandlingNotesBlock) {
                observer.disconnect();

                specialHandlingNotesBlock = document.createElement('div');
                specialHandlingNotesBlock.className = 'MuiPaper-root MuiPaper-elevation MuiPaper-rounded MuiPaper-elevation1 _gutterTop_z3by5_1 css-7py2rd';
                specialHandlingNotesBlock.style.marginTop = '1.5rem';
                specialHandlingNotesBlock.style.padding = '1rem';

                const contentContainer = document.createElement('div');

                const headerContainer = document.createElement('div');
                headerContainer.style.display = 'flex';
                headerContainer.style.justifyContent = 'space-between';
                headerContainer.style.alignItems = 'center';

                const label = document.createElement('label');
                label.textContent = `Special Handling Notes (User ID: ${currentUserId})`;
                label.style.fontWeight = '500';

                headerContainer.appendChild(label);

                const dividerTop = document.createElement('hr');
                dividerTop.style.marginTop = '10px';
                dividerTop.className = 'MuiDivider-root MuiDivider-fullWidth css-39bbo6';

                const marginTop = document.createElement('div');
                marginTop.style.marginTop = '20px';
                const quillEditor = document.createElement('div');
                quillEditor.id = 'quill-editor';
                quillEditor.style.height = '200px';
                quillEditor.style.marginTop = '10px';

                marginTop.appendChild(quillEditor);
                contentContainer.append(headerContainer, dividerTop, marginTop);

                const dividerBottom = document.createElement('hr');
                dividerBottom.className = 'MuiDivider-root MuiDivider-fullWidth css-39bbo6';
                dividerBottom.style.marginTop = '20px';
                contentContainer.appendChild(dividerBottom);

                const footerContainer = document.createElement('div');
                footerContainer.className = '_footerContent_z3by5_42';
                footerContainer.style.display = 'flex';
                footerContainer.style.justifyContent = 'flex-end';
                footerContainer.style.padding = '8px 12px';

                const saveButton = document.createElement('button');
                saveButton.textContent = 'Save';
                saveButton.className = 'MuiButtonBase-root MuiButton-root MuiButton-contained MuiButton-containedPrimary MuiButton-sizeMedium MuiButton-containedSizeMedium MuiButton-colorPrimary css-1nv0zhp';
                saveButton.style.textSizeAdjust = '100%';
                saveButton.style.display = 'inline-flex';
                saveButton.style.alignItems = 'center';
                saveButton.style.justifyContent = 'center';
                saveButton.style.cursor = 'pointer';
                saveButton.style.borderRadius = '4px';
                saveButton.style.fontFamily = 'HelveticaNeue';
                saveButton.style.fontWeight = '500';
                saveButton.style.lineHeight = '1.75';
                saveButton.style.color = 'rgb(255, 255, 255)';
                saveButton.style.backgroundColor = 'rgb(41, 45, 51)';
                saveButton.style.fontSize = '0.8rem';
                saveButton.style.padding = '2px 6px';

                saveButton.addEventListener('click', async function () {
                    const quillContent = document.querySelector('.ql-editor').innerHTML;
                    await saveNotes(quillContent, apiKey, currentUserId);
                });

                footerContainer.appendChild(saveButton);
                contentContainer.appendChild(footerContainer);

                specialHandlingNotesBlock.append(contentContainer);
                targetBlock.parentNode.insertBefore(specialHandlingNotesBlock, targetBlock.nextSibling);

                loadQuill(() => initQuillEditor());
            }
        });

        observer.observe(document.body, { childList: true, subtree: true });
    }

    // Initializes the Quill editor and loads the notes into it
    function initQuillEditor() {
        const quillEditor = document.getElementById('quill-editor');
        if (quillEditor) {
            const quill = new Quill(quillEditor, {
                theme: 'snow',
                modules: {
                    toolbar: [
                        ['bold', 'italic']
                    ]
                }
            });

            fetchNotes(apiKey, currentUserId).then(notes => {
                if (notes.length > 0) {
                    quill.root.innerHTML = notes[0].note_text || '';
                }
            });
        } else {
            console.error('Quill editor element not found on the page!');
        }
    }

    // Tracks changes in the page's title to dynamically reload notes block
    const titleObserver = new MutationObserver(() => {
        const title = document.querySelector('title').textContent;

        if (title === "Wavix CP - User settings" && !currentUserId) {
            currentUserId = getUserIdFromUrl();
            addSpecialHandlingNotesBlock();
        } else if (title !== "Wavix CP - User settings" && specialHandlingNotesBlock) {
            specialHandlingNotesBlock.remove();
            specialHandlingNotesBlock = null;
            location.reload();
        }
    });

    titleObserver.observe(document.querySelector('title'), { childList: true });

    // Executes the function to add the special handling notes block when the document is ready
    $(document).ready(function () {
        currentUserId = getUserIdFromUrl();
        if (currentUserId) {
            addSpecialHandlingNotesBlock();
        }
    });

})();
