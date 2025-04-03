document.addEventListener('DOMContentLoaded', function() {
    const bookDetailsContainer = document.getElementById('book-details');
    
    // Get book ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const bookId = urlParams.get('id');
    
    if (bookId) {
        fetchBookDetails(bookId);
    } else {
        bookDetailsContainer.innerHTML = '<p class="error">No book ID provided.</p>';
    }
    
    function fetchBookDetails(id) {
        fetch(`https://gutendex.com/books/${id}`)
            .then(response => response.json())
            .then(book => {
                renderBookDetails(book);
            })
            .catch(error => {
                console.error('Error fetching book details:', error);
                bookDetailsContainer.innerHTML = '<p class="error">Failed to load book details. Please try again later.</p>';
            });
    }
    
    function renderBookDetails(book) {
        // Get cover image
        const coverId = book.formats['image/jpeg'] || 
                       book.formats['image/png'] || 
                       Object.values(book.formats).find(format => format.includes('.jpg') || '.png');
        let coverUrl = `https://covers.openlibrary.org/b/id/${book.id}-L.jpg`;
        
        if (coverId) {
            coverUrl = coverId;
        }
        
        // Get authors
        const authors = book.authors && book.authors.length > 0 
            ? book.authors.map(author => author.name).join(', ') 
            : 'Unknown Author';
        
        // Get genres
        const genres = book.subjects ? book.subjects.map(subject => {
            return subject.split(' -- ')[0];
        }) : ['No genres listed'];
        
        // Get download links
        const downloadLinks = [];
        for (const [format, url] of Object.entries(book.formats)) {
            if (format.startsWith('text/') || format.includes('pdf') || format.includes('epub')) {
                downloadLinks.push({
                    format: format.split('/').pop().toUpperCase(),
                    url: url
                });
            }
        }
        
        // Check if book is in wishlist
        const wishlist = getWishlist();
        const isInWishlist = wishlist.some(item => item.id === book.id);
        
        bookDetailsContainer.innerHTML = `
            <div class="flex flex-col md:flex-row gap-8 mb-8">
                <img src="${coverUrl}" alt="${book.title}" 
                    class="w-full md:w-1/3 h-auto max-h-[450px] object-contain rounded-lg shadow-md"
                    onerror="this.src='https://via.placeholder.com/300x450?text=No+Cover'">
                
                <div class="flex-1">
                    <h1 class="text-3xl font-bold mb-2">${book.title}</h1>
                    <p class="text-gray-600 text-xl mb-4">by ${authors}</p>
                    
                    <div class="flex flex-wrap gap-2 mb-6">
                        ${genres.map(genre => `
                            <span class="bg-gray-100 px-3 py-1 text-sm rounded-full">${genre}</span>
                        `).join('')}
                    </div>
                    
                    <button id="wishlist-toggle" 
                        class="px-4 py-2 rounded-md ${isInWishlist ? 'bg-red-500' : 'bg-indigo-600'} text-white flex items-center gap-2">
                        <i class="fas fa-heart"></i>
                        ${isInWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}
                    </button>
                </div>
            </div>
            
            <div class="space-y-8">
                <div>
                    <h3 class="text-xl font-semibold mb-3">About This Book</h3>
                    <p class="text-gray-700">${book.description || 'No description available.'}</p>
                </div>
                
                <div>
                    <h3 class="text-xl font-semibold mb-3">Download Options</h3>
                    ${downloadLinks.length > 0 
                        ? `<div class="flex flex-wrap gap-3">
                            ${downloadLinks.map(link => `
                                <a href="${link.url}" target="_blank" 
                                    class="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-sm">
                                    ${link.format}
                                </a>
                            `).join('')}
                           </div>`
                        : '<p class="text-gray-600">No download links available.</p>'}
                </div>
                
                <div>
                    <h3 class="text-xl font-semibold mb-3">Book Details</h3>
                    <ul class="space-y-2">
                        <li class="flex"><span class="w-32 font-medium">ID:</span> ${book.id}</li>
                        ${book.languages ? `<li class="flex"><span class="w-32 font-medium">Languages:</span> ${book.languages.join(', ')}</li>` : ''}
                        ${book.bookshelves && book.bookshelves.length > 0 
                            ? `<li class="flex"><span class="w-32 font-medium">Bookshelves:</span> ${book.bookshelves.join(', ')}</li>` 
                            : ''}
                        ${book.download_count ? `<li class="flex"><span class="w-32 font-medium">Downloads:</span> ${book.download_count.toLocaleString()}</li>` : ''}
                    </ul>
                </div>
            </div>
        `;
        
        // Add event listener to wishlist button
        const wishlistBtn = document.getElementById('wishlist-toggle');
        wishlistBtn.addEventListener('click', function() {
            toggleWishlist(book);
            this.classList.toggle('bg-red-500');
            this.classList.toggle('bg-indigo-600');
            this.innerHTML = `
                <i class="fas fa-heart"></i>
                ${this.classList.contains('bg-red-500') ? 'Remove from Wishlist' : 'Add to Wishlist'}
            `;
        });
    }
    
    function toggleWishlist(book) {
        let wishlist = getWishlist();
        const bookIndex = wishlist.findIndex(item => item.id === book.id);
        
        if (bookIndex === -1) {
            // Add to wishlist
            const bookToAdd = {
                id: book.id,
                title: book.title,
                author: book.authors && book.authors.length > 0 
                    ? book.authors.map(author => author.name).join(', ') 
                    : 'Unknown Author',
                cover: book.formats['image/jpeg'] || `https://covers.openlibrary.org/b/id/${book.id}-L.jpg`,
                genres: book.subjects ? book.subjects.map(subject => subject.split(' -- ')[0]) : []
            };
            wishlist.push(bookToAdd);
        } else {
            // Remove from wishlist
            wishlist.splice(bookIndex, 1);
        }
        
        localStorage.setItem('wishlist', JSON.stringify(wishlist));
    }
    
    function getWishlist() {
        const wishlistJson = localStorage.getItem('wishlist');
        return wishlistJson ? JSON.parse(wishlistJson) : [];
    }



});