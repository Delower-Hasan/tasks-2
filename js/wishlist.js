document.addEventListener('DOMContentLoaded', function() {
    const wishlistContainer = document.getElementById('wishlist-container');
    const emptyWishlistMessage = document.getElementById('empty-wishlist');
    
    renderWishlist();
    
    function renderWishlist() {
        const wishlist = getWishlist();
        
        if (wishlist.length === 0) {
            wishlistContainer.style.display = 'none';
            emptyWishlistMessage.style.display = 'block';
            return;
        }
        
        emptyWishlistMessage.style.display = 'none';
        wishlistContainer.style.display = 'grid';
        wishlistContainer.innerHTML = '';
        
        wishlist.forEach(book => {
            const bookCard = createWishlistBookCard(book);
            wishlistContainer.appendChild(bookCard);
        });
    }
    


function createWishlistBookCard(book) {
    const card = document.createElement('div');
    card.className = 'bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300';
    
    card.innerHTML = `
        <img src="${book.cover}" alt="${book.title}" 
            class="w-full h-64 object-cover"
            onerror="this.src='https://via.placeholder.com/150x200?text=No+Cover'">
        <div class="p-4">
            <h3 class="text-lg font-semibold mb-2 line-clamp-2">${book.title}</h3>
            <p class="text-gray-600 text-sm mb-2">${book.author}</p>
            <div class="flex flex-wrap gap-2 mb-3">
                ${book.genres.slice(0, 2).map(genre => `
                    <span class="bg-gray-100 px-2 py-1 text-xs rounded">${genre}</span>
                `).join('')}
            </div>
            <div class="flex justify-between items-center">
                <a href="book.html?id=${book.id}" class="text-indigo-600 text-sm hover:underline">View Details</a>
                <button class="text-red-500" data-id="${book.id}">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>
        </div>
    `;
    
    // Add event listener to remove button
    const removeBtn = card.querySelector('button');
    removeBtn.addEventListener('click', function() {
        removeFromWishlist(book.id);
        renderWishlist();
    });
    
    return card;
}

    
    function removeFromWishlist(bookId) {
        let wishlist = getWishlist();
        wishlist = wishlist.filter(book => book.id !== bookId);
        localStorage.setItem('wishlist', JSON.stringify(wishlist));
    }
    
    function getWishlist() {
        const wishlistJson = localStorage.getItem('wishlist');
        return wishlistJson ? JSON.parse(wishlistJson) : [];
    }
});