



document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const booksContainer = document.getElementById('books-container');
    const searchInput = document.getElementById('search');
    const genreFilter = document.getElementById('genre-filter');
    const prevPageBtn = document.getElementById('prev-page');
    const nextPageBtn = document.getElementById('next-page');
    const pageNumbersContainer = document.getElementById('page-numbers');

    // State variables
    let currentPage = 1;
    let totalPages = 1;
    let allBooks = [];
    let filteredBooks = [];
    let currentBooks = [];
    let allGenres = new Set();
    let currentApiUrl = 'https://gutendex.com/books/';
    let nextApiUrl = '';
    let prevApiUrl = '';

    // Initialize the app
    init();

    function init() {
        fetchBooks(currentApiUrl);
        setupEventListeners();
    }

    function setupEventListeners() {
        // Search input event
        searchInput.addEventListener('input', function() {
            filterBooks();
            renderBooks();
        });

        // Genre filter event
        genreFilter.addEventListener('change', function() {
            filterBooks();
            renderBooks();
        });

        // Pagination events
        prevPageBtn.addEventListener('click', goToPrevPage);
        nextPageBtn.addEventListener('click', goToNextPage);
    }

    async function fetchBooks(url) {
        try {
            // Show loader
            document.getElementById('loader').classList.remove('hidden');
            
            const response = await fetch(url);
            const data = await response.json();
            
            allBooks = data.results;
            nextApiUrl = data.next;
            prevApiUrl = data.previous;
            
            updatePaginationControls();
            extractGenres(allBooks);
            filteredBooks = [...allBooks];
            currentBooks = [...filteredBooks];
            
            renderBooks();
            renderGenreFilter();
        } catch (error) {
            console.error('Error fetching books:', error);
            booksContainer.innerHTML = '<p class="text-red-500 text-center py-8">Failed to load books. Please try again later.</p>';
        } finally {
            // Hide loader
            document.getElementById('loader').classList.add('hidden');
        }
    }

    function extractGenres(books) {
        allGenres.clear();
        books.forEach(book => {
            if (book.subjects) {
                book.subjects.forEach(subject => {
                    // Take only the first part of the subject before '--' if it exists
                    const genre = subject.split(' -- ')[0];
                    allGenres.add(genre);
                });
            }
        });
    }

    function renderGenreFilter() {
        genreFilter.innerHTML = '<option value="">All Genres</option>';
        
        const sortedGenres = Array.from(allGenres).sort();
        sortedGenres.forEach(genre => {
            const option = document.createElement('option');
            option.value = genre;
            option.textContent = genre;
            genreFilter.appendChild(option);
        });
    }

    function filterBooks() {
        const searchTerm = searchInput.value.toLowerCase();
        const selectedGenre = genreFilter.value;
        
        filteredBooks = allBooks.filter(book => {
            // Filter by search term
            const matchesSearch = book.title.toLowerCase().includes(searchTerm);
            
            // Filter by genre
            let matchesGenre = true;
            if (selectedGenre) {
                matchesGenre = book.subjects && book.subjects.some(subject => {
                    const genre = subject.split(' -- ')[0];
                    return genre === selectedGenre;
                });
            }
            
            return matchesSearch && matchesGenre;
        });
        
        currentBooks = [...filteredBooks];
    }

    function renderBooks() {
        if (currentBooks.length === 0) {
            booksContainer.innerHTML = '<p class="no-results">No books found matching your criteria.</p>';
            return;
        }
        
        booksContainer.innerHTML = '';
        
        currentBooks.forEach(book => {
            const bookCard = createBookCard(book);
            booksContainer.appendChild(bookCard);
        });
    }

    function createBookCard(book) {
            const card = document.createElement('div');
    card.className = 'bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1'
        
        // Get cover image
        const coverId = book.formats['image/jpeg'] || 
                       book.formats['image/png'] || 
                       Object.values(book.formats).find(format => format.includes('.jpg') || '.png');
        let coverUrl = `https://covers.openlibrary.org/b/id/${book.id}-M.jpg`;
        
        if (coverId) {
            coverUrl = coverId;
        }
        
        // Get first author name
        const authorName = book.authors && book.authors.length > 0 
            ? book.authors[0].name 
            : 'Unknown Author';
        
        // Get first 2 genres
        const genres = book.subjects ? book.subjects.slice(0, 2).map(subject => {
            return subject.split(' -- ')[0];
        }) : ['No genres listed'];
        
        // Check if book is in wishlist
        const wishlist = getWishlist();
        const isInWishlist = wishlist.some(item => item.id === book.id);
        
        card.innerHTML = `
        <div class="w-full h-64 bg-gray-200 animate-pulse relative">
            <img src="${coverUrl}" alt="${book.title}" 
                class="absolute inset-0 w-full h-full object-cover opacity-0 transition-opacity duration-300"
                onload="this.classList.remove('opacity-0')"
                onerror="this.src='https://via.placeholder.com/150x200?text=No+Cover';this.classList.remove('opacity-0')">
        </div>
        <div class="p-4">
            <h3 class="text-lg font-semibold mb-2 line-clamp-2">${book.title}</h3>
            <p class="text-gray-600 text-sm mb-2">${authorName}</p>
            <div class="flex flex-wrap gap-2 mb-3">
                ${genres.map(genre => `
                    <span class="bg-gray-100 px-2 py-1 text-xs rounded">${genre}</span>
                `).join('')}
            </div>
            <div class="flex justify-between items-center">
                <a href="book.html?id=${book.id}" class="text-indigo-600 text-sm hover:underline">View Details</a>
                <button class="wishlist-btn ${isInWishlist ? 'text-red-500' : 'text-gray-400'} hover:scale-110 transition-transform duration-200" data-id="${book.id}">
                    <i class="fas fa-heart"></i>
                </button>
            </div>
        </div>
    `;
        
        // Add event listener to wishlist button
        const wishlistBtn = card.querySelector('.wishlist-btn');
        wishlistBtn.addEventListener('click', function() {
            toggleWishlist(book);
            this.classList.toggle('text-red-500');
            this.classList.toggle('text-gray-400');
        });
        
        return card;
    }

    function toggleWishlist(book) {
        let wishlist = getWishlist();
        const bookIndex = wishlist.findIndex(item => item.id === book.id);
        
        const wishlistBtn = document.querySelector(`.wishlist-btn[data-id="${book.id}"]`);
        const notification = document.getElementById('notification');
        
        if (bookIndex === -1) {
            // Add to wishlist
            wishlistBtn.innerHTML = '<i class="fas fa-heart animate-ping"></i>';
            
            setTimeout(() => {
                const bookToAdd = {
                    id: book.id,
                    title: book.title,
                    author: book.authors && book.authors.length > 0 ? book.authors[0].name : 'Unknown Author',
                    cover: book.formats['image/jpeg'] || `https://covers.openlibrary.org/b/id/${book.id}-M.jpg`,
                    genres: book.subjects ? book.subjects.slice(0, 2).map(subject => subject.split(' -- ')[0]) : []
                };
                wishlist.push(bookToAdd);
                localStorage.setItem('wishlist', JSON.stringify(wishlist));
                
                wishlistBtn.innerHTML = '<i class="fas fa-heart"></i>';
                wishlistBtn.classList.add('text-red-500');
                wishlistBtn.classList.remove('text-gray-400');
                
                // Show notification
                notification.textContent = 'Book added to wishlist!';
                notification.classList.remove('bg-red-500', 'hidden');
                notification.classList.add('bg-green-500');
                notification.classList.remove('translate-y-10', 'opacity-0');
                
                setTimeout(() => {
                    notification.classList.add('translate-y-10', 'opacity-0');
                    setTimeout(() => notification.classList.add('hidden'), 300);
                }, 2000);
            }, 500);
        } else {
            // Remove from wishlist
            wishlistBtn.classList.add('animate-pulse');
            
            setTimeout(() => {
                wishlist.splice(bookIndex, 1);
                localStorage.setItem('wishlist', JSON.stringify(wishlist));
                
                wishlistBtn.classList.remove('animate-pulse');
                wishlistBtn.classList.remove('text-red-500');
                wishlistBtn.classList.add('text-gray-400');
                
                // Show notification
                notification.textContent = 'Book removed from wishlist!';
                notification.classList.remove('bg-green-500', 'hidden');
                notification.classList.add('bg-red-500');
                notification.classList.remove('translate-y-10', 'opacity-0');
                
                setTimeout(() => {
                    notification.classList.add('translate-y-10', 'opacity-0');
                    setTimeout(() => notification.classList.add('hidden'), 300);
                }, 2000);
            }, 300);
        }
    }

    function getWishlist() {
        const wishlistJson = localStorage.getItem('wishlist');
        return wishlistJson ? JSON.parse(wishlistJson) : [];
    }

    function updatePaginationControls() {
        prevPageBtn.disabled = !prevApiUrl;
        nextPageBtn.disabled = !nextApiUrl;
        
        // Simple pagination - in a real app you might want more sophisticated logic
        pageNumbersContainer.innerHTML = '';
        
        // Just show current page for now
        const pageNumber = document.createElement('span');
        pageNumber.className = 'page-number active';
        pageNumber.textContent = currentPage;
        pageNumbersContainer.appendChild(pageNumber);
    }

    function goToPrevPage() {
        if (prevApiUrl) {
            currentPage--;
            fetchBooks(prevApiUrl);
        }
    }

    function goToNextPage() {
        if (nextApiUrl) {
            currentPage++;
            fetchBooks(nextApiUrl);
        }
    }

   
});