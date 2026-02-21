document.addEventListener('DOMContentLoaded', () => {
    const faqs = [
        { 
            q: 'How do I track my bus?', 
            a: 'Go to the "Track" tab to see a live map with current locations of all active buses on your route.' 
        },
        { 
            q: 'What if I lose my digital pass?', 
            a: 'Your digital pass is tied to your account. Simply log in on any device to access it instantly.'
        },
        { 
            q: 'How does the Lost & Found feature work?', 
            a: 'Report lost items in the Lost & Found tab. If someone finds an item, they can report it as found. The system helps match lost and found items.'
        },
        {
            q: 'How do I change my assigned bus route?',
            a: 'Contact the transport admin to request a route change. They can reassign you through the admin panel.'
        },
        {
            q: 'What do the notification types mean?',
            a: 'DELAY = Bus is running late, ALERT = Important notice, INFO = General update, CROWD = Bus occupancy status.'
        }
    ];

    const faqContainer = document.getElementById('faq-list');
    
    if(faqContainer) {
        faqContainer.innerHTML = '';
        
        faqs.forEach(faq => {
            const faqItem = `
                <details class="group p-3 rounded-xl hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 transition-all border border-transparent hover:border-indigo-100">
                    <summary class="font-medium cursor-pointer list-none flex justify-between items-center py-2 text-gray-800">
                        <span class="flex items-center">
                            <span class="w-6 h-6 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center mr-3 text-white text-xs font-bold opacity-80 group-hover:opacity-100 transition-opacity">?</span>
                            ${faq.q}
                        </span>
                        <svg class="transition-transform duration-200 group-open:rotate-180 text-indigo-600" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                    </summary>
                    <p class="text-gray-600 mt-3 pb-2 text-sm ml-9 leading-relaxed">${faq.a}</p>
                </details>
            `;
            faqContainer.insertAdjacentHTML('beforeend', faqItem);
        });
    }
});