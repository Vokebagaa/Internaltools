// ==UserScript==
// @name         Follow Upper
// @namespace    http://tampermonkey.net/
// @version      4.0
// @description  Can collect tickets, can start and end follow up, Next button, Back button, current ticket number, and handles reply waiting
// @author       Aset Agabekov
// @match        *https://support.didlogic.com/admin/carrier_tickets*
// @match        *https://support.didlogic.com/tickets/*
// @match        *https://support.didlogic.com/admin/incidents*
// @grant        window.close
// @grant        GM_setValue
// @grant        GM_getValue
// ==/UserScript==

(function () {
    'use strict';

    if (window.location.href === 'https://support.didlogic.com/admin/incidents') {
        return;
    }

    let ticketLinks = GM_getValue('ticketLinks', []);
    let currentTicketIndex = GM_getValue('currentTicketIndex', 0);
    let isReplying = false;

    if (!Array.isArray(ticketLinks)) {
        ticketLinks = [];
    }

    if (typeof currentTicketIndex !== 'number') {
        currentTicketIndex = 0;
    }

    function gatherTicketLinks() {
        const rows = document.querySelectorAll('tr.ant-table-row');
        let links = [];

        rows.forEach(row => {
            const firstTicketCell = row.querySelector('td.ant-table-cell a[href^="/tickets/"]');
            if (firstTicketCell) {
                links.push(firstTicketCell.getAttribute('href'));
            }
        });

        ticketLinks.push(...links);
    }

    async function collectAllTickets() {
        do {
            gatherTicketLinks();

            const nextPageButton = document.querySelector('.ant-pagination-next:not(.ant-pagination-disabled)');
            if (nextPageButton) {
                nextPageButton.click();
                await new Promise(resolve => setTimeout(resolve, 2000));
            } else {
                break;
            }
        } while (true);

        GM_setValue('ticketLinks', ticketLinks);
        currentTicketIndex = 0;
        GM_setValue('currentTicketIndex', currentTicketIndex);

        if (ticketLinks.length > 0) {
            window.location.href = `https://support.didlogic.com${ticketLinks[0]}`;
        } else {
            alert("No ticket links found. Please make sure you have tickets available to collect.");
        }
    }

    function closeTabAfterReply() {
        const tempReplyBlock = document.querySelector('.temporary-reply');
        if (tempReplyBlock) {
            const checkInterval = setInterval(() => {
                const stillExists = document.querySelector('.temporary-reply');
                if (!stillExists) {
                    clearInterval(checkInterval);
                    window.close();
                }
            }, 1000);

            setTimeout(() => {
                const stillExists = document.querySelector('.temporary-reply');
                if (stillExists) {
                    window.close();
                }
            }, 16000);
        }
    }

    function addNavigationButtons() {
        const actionsDiv = document.querySelector('div.actions');
        if (!actionsDiv) {
            return;
        }

        // Создаем контейнер с классом
        const navContainer = document.createElement('div');
        navContainer.className = 'navigation-container'; // Добавляем класс
        navContainer.style.display = 'flex';
        navContainer.style.flexDirection = 'column';
        navContainer.style.alignItems = 'center';
        navContainer.style.justifyContent = 'center';
        navContainer.style.width = '200px';
        navContainer.style.padding = '10px';
        navContainer.style.margin = '10px auto';
        navContainer.style.border = '1px solid #ccc';
        navContainer.style.borderRadius = '8px';
        navContainer.style.backgroundColor = '#f9f9f9';
        navContainer.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';

        // Добавляем индикатор текущего тикета
        const currentTicketIndicator = document.createElement('div');
        currentTicketIndicator.style.marginBottom = '10px';
        currentTicketIndicator.style.fontSize = '14px';
        currentTicketIndicator.style.textAlign = 'center';
        currentTicketIndicator.style.color = 'black';
        currentTicketIndicator.innerText = `Ticket ${currentTicketIndex + 1} of ${ticketLinks.length}`;
        navContainer.appendChild(currentTicketIndicator);

        // Кнопка "Next"
        const nextButton = document.createElement('button');
        nextButton.style.padding = '10px 20px';
        nextButton.style.backgroundColor = 'green';
        nextButton.style.color = 'white';
        nextButton.style.border = 'none';
        nextButton.style.cursor = 'pointer';
        nextButton.style.marginBottom = '10px';
        nextButton.style.borderRadius = '4px';

        if (currentTicketIndex < ticketLinks.length - 1) {
            nextButton.innerText = 'Next Ticket';
            nextButton.addEventListener('click', () => {
                if (isReplying) {
                    currentTicketIndex++;
                    GM_setValue('currentTicketIndex', currentTicketIndex);
                    window.open(`https://support.didlogic.com${ticketLinks[currentTicketIndex]}`, '_blank');
                    closeTabAfterReply();
                } else {
                    currentTicketIndex++;
                    GM_setValue('currentTicketIndex', currentTicketIndex);
                    window.location.href = `https://support.didlogic.com${ticketLinks[currentTicketIndex]}`;
                }
            });
        } else {
            nextButton.innerText = 'Finish Follow Up';
            nextButton.addEventListener('click', () => {
                alert('Congrats, Follow up finished!');
                GM_setValue('currentTicketIndex', 0);
                ticketLinks = [];
                GM_setValue('ticketLinks', ticketLinks);
            });
        }

        // Кнопка "Back"
        const backButton = document.createElement('button');
        backButton.innerText = 'Back';
        backButton.style.padding = '10px 20px';
        backButton.style.backgroundColor = '#f44336';
        backButton.style.color = 'white';
        backButton.style.border = 'none';
        backButton.style.cursor = 'pointer';
        backButton.style.marginBottom = '10px';
        backButton.style.borderRadius = '4px';

        backButton.addEventListener('click', () => {
            if (currentTicketIndex > 0) {
                currentTicketIndex--;
                GM_setValue('currentTicketIndex', currentTicketIndex);
                window.location.href = `https://support.didlogic.com${ticketLinks[currentTicketIndex]}`;
            }
        });

        navContainer.appendChild(backButton);
        navContainer.appendChild(nextButton);

        actionsDiv.appendChild(navContainer);
    }
    function waitForElement(selector, callback) {
        const interval = setInterval(() => {
            const element = document.querySelector(selector);
            if (element) {
                clearInterval(interval);
                callback(element);
            }
        }, 500);
    }

    function setupReplyListener() {
        const replyButtons = document.querySelectorAll('button.ant-btn');
        replyButtons.forEach(button => {
            if (button.textContent.includes("Reply")) {
                button.addEventListener('click', () => {
                    isReplying = true;
                    closeTabAfterReply();
                });
            }
        });
    }

    function addTemplateButtons() {
        const navContainer = document.querySelector('div.navigation-container'); // Ищем по классу
        if (!navContainer) return;

        const texts = {
            "Copy update 1": "Hello Team,\n\n\nCould you please provide an update?\n\n",
            "Copy Update 2": "Hello Team,\n\n\nWe are waiting for the results of the investigation.\n\nPlease provide an update.\n\n"
        };

        Object.entries(texts).forEach(([name, text]) => {
            const button = document.createElement('button');
            button.textContent = name;
            button.style.margin = "5px";
            button.style.padding = '10px 15px';
            button.style.backgroundColor = '#007bff';
            button.style.color = 'white';
            button.style.border = 'none';
            button.style.borderRadius = '4px';
            button.style.cursor = 'pointer';

            button.onclick = () => {
                navigator.clipboard.writeText(text).then(() => {
                    console.log(`${name} copied to clipboard`);
                    const originalText = button.textContent; // Сохраняем оригинальный текст
                    button.textContent = "Copied!"; // Меняем текст кнопки на "Copied!"
                    setTimeout(() => {
                        button.textContent = originalText; // Возвращаем текст кнопки через 3 секунды
                    }, 2500);
                }).catch(err => {
                    console.error('Error copying text: ', err);
                });
            };

            navContainer.appendChild(button);
        });
    }

    if (window.location.href.includes('/admin/carrier_tickets')) {
        waitForElement('div.pagination--TBCj5', (paginationContainer) => {
            const button = document.createElement('button');
            button.style.padding = '12px 20px';
            button.style.backgroundColor = '#4CAF50';
            button.style.color = 'white';
            button.style.border = 'none';
            button.style.cursor = 'pointer';
            button.style.marginRight = '10px';

            ticketLinks = GM_getValue('ticketLinks', []);
            currentTicketIndex = GM_getValue('currentTicketIndex', 0);

            if (ticketLinks.length > 0) {
                button.innerText = 'Continue Follow Up';
            } else {
                button.innerText = 'Start Follow Upping';
            }

            button.addEventListener('click', async () => {
                if (ticketLinks.length === 0) {
                    ticketLinks = [];
                    await collectAllTickets();
                } else {
                    window.location.href = `https://support.didlogic.com${ticketLinks[currentTicketIndex]}`;
                }
            });

            paginationContainer.appendChild(button);

            const finishSessionButton = document.createElement('button');
            finishSessionButton.innerText = 'Finish Session';
            finishSessionButton.style.padding = '20px 30px';
            finishSessionButton.style.backgroundColor = '#f44336';
            finishSessionButton.style.color = 'white';
            finishSessionButton.style.border = 'none';
            finishSessionButton.style.cursor = 'pointer';
            finishSessionButton.style.marginLeft = '10px';

            finishSessionButton.addEventListener('click', () => {
                alert('Session finished!');
                currentTicketIndex = 0;
                ticketLinks = [];
                button.innerText = 'Start Follow Upping';
                GM_setValue('currentTicketIndex', currentTicketIndex);
                GM_setValue('ticketLinks', ticketLinks);
            });

            paginationContainer.appendChild(finishSessionButton);
        });
    }

    if (window.location.href.includes('/tickets/')) {
        waitForElement('div.actions', () => {
            ticketLinks = GM_getValue('ticketLinks', []);
            currentTicketIndex = GM_getValue('currentTicketIndex', 0);

            const currentTicketURL = `/tickets/${window.location.pathname.split('/').pop()}`;
            if (ticketLinks[currentTicketIndex] !== currentTicketURL) {
                return;
            }

            addNavigationButtons();
            setupReplyListener();
            addTemplateButtons();
        });
    }
})();
